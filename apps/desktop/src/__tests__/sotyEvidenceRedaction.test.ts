import { describe, it, expect } from "vitest";
import {
  isUnsafeFieldName,
  stripUnsafeFields,
  deepStripUnsafeFields,
  UNSAFE_FIELD_PATTERNS,
} from "../lib/sotyEvidenceRedaction";

// ─── isUnsafeFieldName ────────────────────────────────────────────────────────

describe("isUnsafeFieldName — unsafe keys", () => {
  const unsafe = [
    "query",
    "search_term",
    "password",
    "token",
    "cookie",
    "credential",
    "secret",
    "api_key",
    "external_page_content",
    "response_body",
    "raw_html",
    "downloaded_content",
    "clipboard_content",
    "user_query",
    "user_password",
    "auth_token",
    "session_cookie",
    "api_key_value",
  ];

  for (const key of unsafe) {
    it(`marks "${key}" as unsafe`, () => {
      expect(isUnsafeFieldName(key)).toBe(true);
    });
  }
});

describe("isUnsafeFieldName — safe keys", () => {
  const safe = [
    "id",
    "name",
    "risk",
    "status",
    "score",
    "state",
    "demo_mode",
    "source",
    "generated_at",
    "schema_version",
    "operator_label",
    "route_pack",
    "route_card",
    "host_guard",
    "osint",
    "warnings",
    "limitations",
    "redaction",
    "overall_score",
    "deductions_count",
  ];

  for (const key of safe) {
    it(`does not mark "${key}" as unsafe`, () => {
      expect(isUnsafeFieldName(key)).toBe(false);
    });
  }
});

describe("UNSAFE_FIELD_PATTERNS", () => {
  it("is a non-empty array of RegExp", () => {
    expect(UNSAFE_FIELD_PATTERNS.length).toBeGreaterThan(0);
    for (const p of UNSAFE_FIELD_PATTERNS) {
      expect(p).toBeInstanceOf(RegExp);
    }
  });
});

// ─── stripUnsafeFields ────────────────────────────────────────────────────────

describe("stripUnsafeFields", () => {
  it("removes password field", () => {
    const result = stripUnsafeFields({ password: "secret123", name: "alice" });
    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("name", "alice");
  });

  it("removes token field", () => {
    const result = stripUnsafeFields({ token: "abc", id: "123" });
    expect(result).not.toHaveProperty("token");
    expect(result).toHaveProperty("id", "123");
  });

  it("removes cookie field", () => {
    const result = stripUnsafeFields({ cookie: "sess=xyz", score: 100 });
    expect(result).not.toHaveProperty("cookie");
    expect(result).toHaveProperty("score", 100);
  });

  it("removes credential field", () => {
    const result = stripUnsafeFields({ credential: "foo", state: "SOTY_READY" });
    expect(result).not.toHaveProperty("credential");
    expect(result).toHaveProperty("state");
  });

  it("removes query field", () => {
    const result = stripUnsafeFields({ query: "example.com", risk: "low" });
    expect(result).not.toHaveProperty("query");
    expect(result).toHaveProperty("risk");
  });

  it("removes api_key field", () => {
    const result = stripUnsafeFields({ api_key: "key123", name: "tool" });
    expect(result).not.toHaveProperty("api_key");
    expect(result).toHaveProperty("name");
  });

  it("removes raw_html field", () => {
    const result = stripUnsafeFields({ raw_html: "<html>", id: "1" });
    expect(result).not.toHaveProperty("raw_html");
    expect(result).toHaveProperty("id");
  });

  it("removes clipboard_content field", () => {
    const result = stripUnsafeFields({ clipboard_content: "paste", id: "1" });
    expect(result).not.toHaveProperty("clipboard_content");
    expect(result).toHaveProperty("id");
  });

  it("does not mutate the input object", () => {
    const input = { password: "secret", name: "alice" };
    stripUnsafeFields(input);
    expect(input).toHaveProperty("password", "secret");
  });

  it("keeps all safe fields", () => {
    const input = { id: "1", name: "test", score: 95, state: "SOTY_READY" };
    const result = stripUnsafeFields(input as Record<string, unknown>);
    expect(result).toEqual(input);
  });

  it("removes multiple unsafe fields in one pass", () => {
    const result = stripUnsafeFields({
      password: "x",
      token: "y",
      cookie: "z",
      id: "1",
      name: "safe",
    });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("token");
    expect(result).not.toHaveProperty("cookie");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
  });
});

// ─── deepStripUnsafeFields ───────────────────────────────────────────────────

describe("deepStripUnsafeFields", () => {
  it("strips unsafe fields from a nested object", () => {
    const input = {
      id: "1",
      nested: { token: "abc", name: "inner" },
    };
    const result = deepStripUnsafeFields(input) as typeof input;
    expect((result.nested as Record<string, unknown>).token).toBeUndefined();
    expect((result.nested as Record<string, unknown>).name).toBe("inner");
  });

  it("strips unsafe fields from objects inside arrays", () => {
    const input = [
      { id: "1", password: "secret" },
      { id: "2", name: "safe" },
    ];
    const result = deepStripUnsafeFields(input) as Array<Record<string, unknown>>;
    expect(result[0].password).toBeUndefined();
    expect(result[0].id).toBe("1");
    expect(result[1].name).toBe("safe");
  });

  it("leaves primitive values unchanged", () => {
    expect(deepStripUnsafeFields(42)).toBe(42);
    expect(deepStripUnsafeFields("hello")).toBe("hello");
    expect(deepStripUnsafeFields(true)).toBe(true);
    expect(deepStripUnsafeFields(null)).toBeNull();
  });

  it("does not mutate the input", () => {
    const input = { id: "1", token: "secret" };
    deepStripUnsafeFields(input);
    expect(input.token).toBe("secret");
  });

  it("handles deeply nested unsafe fields", () => {
    const input = { a: { b: { c: { api_key: "key", safe: "value" } } } };
    const result = deepStripUnsafeFields(input) as typeof input;
    const deep = result.a.b.c as Record<string, unknown>;
    expect(deep.api_key).toBeUndefined();
    expect(deep.safe).toBe("value");
  });

  it("handles empty object", () => {
    expect(deepStripUnsafeFields({})).toEqual({});
  });

  it("handles empty array", () => {
    expect(deepStripUnsafeFields([])).toEqual([]);
  });
});

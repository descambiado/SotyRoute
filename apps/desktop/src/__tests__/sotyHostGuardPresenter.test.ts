import { describe, it, expect } from "vitest";
import {
  statusToVariant,
  statusToLabel,
  overallCopy,
  HOST_GUARD_LIMITATION_COPY,
} from "../lib/sotyHostGuardPresenter";

describe("statusToVariant", () => {
  it("maps pass → ok", () => expect(statusToVariant("pass")).toBe("ok"));
  it("maps warn → warn", () => expect(statusToVariant("warn")).toBe("warn"));
  it("maps fail → danger", () => expect(statusToVariant("fail")).toBe("danger"));
  it("maps skip → info", () => expect(statusToVariant("skip")).toBe("info"));
});

describe("statusToLabel", () => {
  it("maps pass → Pass", () => expect(statusToLabel("pass")).toBe("Pass"));
  it("maps warn → Warning", () => expect(statusToLabel("warn")).toBe("Warning"));
  it("maps fail → Fail", () => expect(statusToLabel("fail")).toBe("Fail"));
  it("maps skip → Skipped", () => expect(statusToLabel("skip")).toBe("Skipped"));
});

describe("overallCopy", () => {
  it("returns a non-empty string for each status", () => {
    for (const status of ["pass", "warn", "fail", "skip"] as const) {
      expect(overallCopy(status).length).toBeGreaterThan(0);
    }
  });

  it("does not claim guaranteed safety for any status", () => {
    for (const status of ["pass", "warn", "fail", "skip"] as const) {
      const copy = overallCopy(status).toLowerCase();
      expect(copy).not.toContain("guaranteed");
      expect(copy).not.toContain("clean malware");
      expect(copy).not.toContain("remove threats");
      expect(copy).not.toContain("undetectable");
    }
  });
});

describe("HOST_GUARD_LIMITATION_COPY", () => {
  it("is a non-empty string", () => {
    expect(HOST_GUARD_LIMITATION_COPY.length).toBeGreaterThan(0);
  });

  it("does not contain banned phrases", () => {
    const copy = HOST_GUARD_LIMITATION_COPY.toLowerCase();
    const banned = [
      "clean malware",
      "remove threats",
      "undetectable",
      "bypass",
      "evade",
      "antivirus replacement",
      "edr replacement",
      "guaranteed clean",
    ];
    for (const phrase of banned) {
      expect(copy).not.toContain(phrase);
    }
  });

  it("mentions 'cannot guarantee'", () => {
    expect(HOST_GUARD_LIMITATION_COPY.toLowerCase()).toContain("cannot guarantee");
  });
});

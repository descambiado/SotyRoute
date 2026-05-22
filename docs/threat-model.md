# Threat Model

This document describes what SotyRoute is **designed to help with** and — equally important — what it **does not protect against**. Read it before relying on the tool for anything that matters.

## Operator authorization boundary

SotyRoute assumes the operator has **written authorization** for every target referenced in a profile (`allowed_targets`). Authorization is **outside** the tool. SotyRoute will not validate engagement contracts, scope letters, or NDAs — it can only structure the operator's own declarations into evidence.

## What SotyRoute helps with

1. **Posture awareness.** "What does my network look like *right now*, before I run anything?"
2. **Pre-execution validation.** Profile is well-formed, scope is declared, dependencies (Tor, WireGuard) are detected or honestly reported as missing.
3. **Evidence.** A timestamped, structured record of each session for audit, report generation, and disagreement resolution.
4. **Consistent operator behavior.** Same checks every time. No "I forgot to disable X" surprises.
5. **Downstream automation.** BOFA / SotyHUB can consume SotyRoute output as a preflight gate.

## What SotyRoute does **not** protect against

### Anonymity

SotyRoute does **not** make the operator anonymous. Tor is not a VPN; a VPN provider is a trust relationship; SOCKS5 is application-cooperative. Side channels (browser fingerprinting, WebRTC, application telemetry, timezone, language, behavioral patterns) are outside the routing layer.

### Browser leaks

WebRTC, DNS-over-HTTPS inside the browser, QUIC, third-party cookies — these bypass the system-level routing entirely. The Doctor page surfaces this as a warning but cannot fix it. Use a hardened browser configuration for browser-level work.

### VPN provider trust

If the operator selects a commercial VPN, they trust that provider's network, logging policy, jurisdiction, and infrastructure. SotyRoute does not vet providers. WireGuard mode requires a server **the operator controls or is authorized to use**.

### Tor exit-node trust

Tor exits can see, modify, or intercept unencrypted traffic. Always assume the exit is hostile. SotyRoute does not change this; it only warns about it.

### DNS leaks at the application layer

System DNS is one piece. Applications can:
- Use DoH/DoT to a public resolver, bypassing system DNS.
- Hardcode resolvers (`8.8.8.8`).
- Use mDNS / LLMNR.

SotyRoute checks system DNS posture; it does not patch application-internal resolvers.

### Endpoint compromise

If the Windows host is already compromised, SotyRoute cannot help. Evidence files, profiles, and settings can be tampered with by any process running as the same user. Signed evidence bundles are on the roadmap (v0.4.0) but not a substitute for endpoint hygiene.

### Hardware identifiers

MAC addresses, motherboard serials, GPU IDs, TPM EK certificates — none of these are altered by SotyRoute. Out of scope.

### Captive portals / corporate proxies

Corporate networks may MITM TLS via installed root CAs, force traffic through proxies, or block tunnels entirely. SotyRoute will detect *some* of this in the Doctor page; it cannot bypass it (and should not).

## Trust assumptions

- The operator runs the application themselves on a host they control.
- The operator does **not** run untrusted profiles. Profiles are configuration, not code, but they declare scope — a malicious profile could declare misleading scope.
- The evidence directory is on a filesystem the operator controls.

## In scope for security reports

See [SECURITY.md](../SECURITY.md).

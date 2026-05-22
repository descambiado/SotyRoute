# Comparison

## SotyRoute vs Nipe vs Conventional VPN

| Feature | Nipe | Conventional VPN | SotyRoute Desktop |
|---|---|---|---|
| Windows GUI | no | yes, usually | **yes** |
| Multi-transport (Tor / WG / SOCKS5 / Observe / Lab) | Tor only | provider's protocols | **yes** |
| Tor readiness check | yes | no | **yes** |
| WireGuard awareness | no / limited | yes if provider | **yes** |
| SOCKS5 profile awareness | limited | no | **yes** |
| Lab scope profiles | no | no | **yes** |
| Dry-run planner | no | no | **yes** |
| Evidence reports | no | no | **yes** |
| BOFA / SotyHUB exports | no | no | **yes** |
| DNS / routing posture summary | limited | limited | **yes** |
| One-click profile selection | no | yes | **yes** |
| Ethical lab documentation | limited | no | **yes** |
| Anonymity claims | partial | "private", varies | **none — deliberate** |
| Endpoint trust required | host owner | host owner + provider | host owner |

## SotyRoute vs proxychains

| Aspect | proxychains | SotyRoute |
|---|---|---|
| Scope | per-command, LD_PRELOAD style | per-session, per-profile |
| Platform | POSIX | Windows-first |
| Evidence | none | full session bundle |
| Validation | none | profile + scope validation |
| UI | none | full desktop UI |

proxychains is a sharp instrument for chaining proxies under a single shell command. SotyRoute is a posture + policy + evidence layer at the session level. Different tools, different jobs.

## SotyRoute vs manual firewall + routing

You could absolutely do everything SotyRoute does with `netsh advfirewall`, `Set-NetIPInterface`, `Set-DnsClientServerAddress`, and a notebook. SotyRoute is what you get when you do it **the same way, every time, with evidence**.

| Aspect | Manual | SotyRoute |
|---|---|---|
| Consistency | depends on operator memory | enforced by profile |
| Evidence | depends on operator | automatic |
| Reversibility | depends on operator | planned in v0.2.0 |
| Reviewability | scripts in shell history | session bundle on disk |
| Onboarding a new team member | "read this wiki" | "load this profile" |

## Where SotyRoute is **not** the right answer

- You need a production VPN for end-users. → Use a real VPN provider, or self-host WireGuard with a proper management plane.
- You need to anonymize end-user web traffic. → Use Tor Browser; understand its limitations.
- You need application-layer egress control on a server. → Use a proper egress proxy / firewall appliance.
- You are doing unauthorized work. → Stop. SotyRoute is the wrong tool, and you are using it wrong.

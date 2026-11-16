<p align="center">
  <img src="icon.svg" alt="Nextcloud Talk HPB Logo" width="21%">
</p>

# Nextcloud Talk HPB on StartOS

> Everything not listed in this document should behave the same as upstream
> Nextcloud Talk's High-Performance Backend. If a feature, setting, or behavior
> is not mentioned here, the upstream documentation is accurate and fully
> applicable — see the Documentation section of `instructions.md` for links.

The [High-Performance Backend](https://github.com/strukturag/nextcloud-spreed-signaling) (HPB) is the signaling server, Janus media server and NATS message bus that let Nextcloud Talk hold calls with more than a handful of participants: each participant sends one stream to Janus, which forwards it to everyone else. This package runs all three, plus its own Coturn TURN relay, and the Nextcloud package configures Talk to use it.

- **Upstream repo:** <https://github.com/strukturag/nextcloud-spreed-signaling>
- **Wrapper repo:** <https://github.com/Start9Labs/nextcloud-talk-hpb-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Four images, one subcontainer each, all sharing the service's network address. Janus is built by `janus.Dockerfile` from Alpine's `janus-gateway` package, keeping only the VideoRoom plugin and the WebSocket transport, with the WebSocket bound to loopback and full trickle on. The other three are unmodified upstream images whose binaries run directly, without their entrypoints.

| Subcontainer | Image                                   | Runs                         | Listens on          |
| ------------ | --------------------------------------- | ---------------------------- | ------------------- |
| `signaling`  | `strukturag/nextcloud-spreed-signaling` | `nextcloud-spreed-signaling` | `:8081`             |
| `janus`      | built (`janus.Dockerfile`)              | `janus`                      | `127.0.0.1:8188`    |
| `nats`       | `nats` (Alpine variant)                 | `nats-server`                | `127.0.0.1:4222`    |
| `coturn`     | `coturn/coturn`                         | `turnserver`, as `nobody`    | `:3478` UDP and TCP |

Architectures: x86_64, aarch64.

## Volume and Data Layout

Nothing here is user data: the package keeps only the shared secrets it generates on install.

| Volume   | Contents                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------- |
| `main`   | `store.json` — the TURN, signaling and internal secrets                                            |
| `public` | `turn-secret` and `signaling-secret`, copied from `store.json` on every init for Nextcloud to read |

Every daemon's config is written into its subcontainer's root filesystem on each start and never touches a volume.

## File Models

All configuration is generated; nothing is meant to be edited by hand.

- **`main/store.json`** — the three secrets, each generated on the first init that finds it missing and kept for the life of the install.
- **`public/turn-secret`, `public/signaling-secret`** — rewritten from `store.json` on every init.
- **`/config/server.conf`** (signaling) — rewritten on every start. Its `[nextcloud]` `urls` lists every HTTPS address of Nextcloud's Web UI interface except Tor. Session keys are random per start, so a restart ends signaling sessions and clients reconnect.
- **`/etc/turnserver.conf`** (coturn) — rewritten on every start. `relay-ip` and the only `allowed-peer-ip` are the container's address and every other peer is denied, with `no-tcp-relay`. The realm is the TURN Relay interface's public domain, or `nextcloud-talk-hpb` without one.
- **`/etc/nats.conf`** (nats) — fixed: loopback only, a 10-second write deadline and an 8 MB payload limit.

## Dependencies

None declared. The package reads the Nextcloud package's Web UI addresses to build the signaling server's allowlist, and stays waiting until Nextcloud is installed. It is the Nextcloud package that depends on this one, when **Talk Calls** is set to the high-performance backend.

## Network Access and Interfaces

Janus is reachable only through the TURN relay: it announces nothing but the container's address, and every call participant reaches it through a relay allocation. No media port range is published.

| Interface  | ID     | Type | Port                                                                                  |
| ---------- | ------ | ---- | ------------------------------------------------------------------------------------- |
| TURN Relay | `turn` | api  | 3478 UDP and TCP (prefers external 3480); TURN over TLS through StartOS (prefers 443) |

The signaling port, 8081, is bound with no interface, so it is reachable only from other services on the server. Nextcloud's Apache proxies `/standalone-signaling/` on Nextcloud's own origin to it.

The signaling server authenticates each browser by calling back the Nextcloud address that browser loaded Talk from. Nextcloud's `.local` names are mapped to the StartOS bridge inside the signaling subcontainer, and the StartOS root CA is installed there, so those calls stay on the server and verify.

For calls beyond the local network, the TURN Relay interface needs a public domain of its own; StartOS will not serve one domain on two hosts. Without one, Nextcloud hands Talk the relay on each of the server's private IPv4 addresses, and calls work only on the local network.

## Installation and First-Run Flow

Install starts the services with nothing to configure here. Signaling waits until Nextcloud is installed with an HTTPS address. In Nextcloud, run **Configure** and set **Talk Calls** to **High-performance backend**; Nextcloud then points Talk at this package.

## Actions

None.

## Tasks

None.

## Health Checks

| Check          | What it means                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signaling`    | The signaling server answers `/api/v1/welcome`. Nextcloud's dependency on this package requires it.                                                               |
| `nextcloud`    | Shown instead of `signaling` while Nextcloud is not installed or has no HTTPS address; signaling does not start until it has one.                                 |
| `janus`        | Janus is listening on its WebSocket.                                                                                                                              |
| `coturn`       | The TURN relay is listening.                                                                                                                                      |
| `turn-address` | Success when the TURN Relay interface has a public domain with both its plain and TLS addresses. Disabled without one: calls then work only on the local network. |

## Backups and Restore

The `main` volume is backed up. `public` is not: init rewrites it from `store.json` after a restore. Nextcloud picks up the restored secrets on its next start.

## Limitations and Differences

1. Every call participant connects through the TURN relay, including participants who could reach Janus directly. The relay hop stays on the server.
2. Nextcloud's Tor address is not on the signaling allowlist; Talk calls do not work over Tor.
3. Call recording, SIP dial-in and federation-specific signaling are not set up.
4. The signaling server's stats and metrics endpoints answer only on loopback.

## Quick Reference for AI Consumers

```yaml
package_id: nextcloud-talk-hpb
image: strukturag/nextcloud-spreed-signaling
architectures: [x86_64, aarch64]
subcontainers: [signaling, janus, nats, coturn]
volumes:
  main: store.json
  public: turn-secret, signaling-secret
file_models:
  - main/store.json
  - public/turn-secret
  - public/signaling-secret
dependencies: none
interfaces:
  turn: { type: api, port: 3478 }
actions: []
tasks: []
health_checks:
  - signaling
  - nextcloud
  - janus
  - coturn
  - turn-address
```

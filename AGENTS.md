# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## This repo

- **Keep the relay's `relay-ip` and sole `allowed-peer-ip` the container address, every other peer denied, and `no-tcp-relay` set.** Janus is reachable only through that relay, and a wider peer list makes it an open relay.
- **Don't give Janus a public address or a port range.** Every participant reaches it through the relay; announcing more breaks nothing visibly and reopens a port range on the user's router.
- **The signaling host id, port and the `public` volume's file names are read by the Nextcloud package** (`hpb*` constants in its `startos/utils.ts`). Change them in both repos together.

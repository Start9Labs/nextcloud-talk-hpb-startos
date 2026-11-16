# Nextcloud Talk HPB

## Documentation

- [Nextcloud Talk administration: High-Performance Backend](https://nextcloud-talk.readthedocs.io/en/latest/quick-install/) — upstream's overview of what the backend does and how Talk uses it.
- [nextcloud-spreed-signaling](https://github.com/strukturag/nextcloud-spreed-signaling) — the signaling server's own documentation.

## What you get on StartOS

- Group calls in Nextcloud Talk: each participant sends their video once, and the server forwards it to everyone else.
- A **TURN Relay** interface that carries every participant's audio and video to the server.
- Nothing to configure here. Nextcloud points Talk at this service for you.

## Getting set up

1. Install and start Nextcloud, and install the **Talk** app inside Nextcloud.
2. Start this service.
3. In Nextcloud, run **Configure** and set **Talk Calls** to **High-performance backend**.

That is enough for calls on your local network.

### For calls over the public internet

1. **Add a public domain to Nextcloud's Web UI interface.** Talk connects to this service through it.
2. **Add a public domain to this service's TURN Relay interface**, different from Nextcloud's, and enable both of its addresses. Every participant's audio and video travels through it: plain TURN over UDP and TCP, and TURN over TLS on port 443 for networks that allow nothing else.

The **TURN Relay Address** health check turns green once the relay has a public domain with both addresses. Grey means calls work only on your local network.

Tor is not a substitute: Talk calls cannot run over Tor.

## Limitations

- Call recording and SIP dial-in are not set up.

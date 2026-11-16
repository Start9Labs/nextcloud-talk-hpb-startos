# Updating the upstream version

Upstream is the signaling server, `strukturag/nextcloud-spreed-signaling`. The package version's upstream part follows it.

## Determining the upstream version

- Signaling: `gh release view -R strukturag/nextcloud-spreed-signaling --json tagName -q .tagName`; the image tag drops the leading `v`.
- Janus: the `janus-gateway` package in the Alpine release `janus.Dockerfile` builds from.
- NATS: `gh release view -R nats-io/nats-server --json tagName -q .tagName`; use the `-alpine` image tag.
- Coturn: `gh release view -R coturn/coturn --json tagName -q .tagName`.

## Applying the bump

- `signaling`, `nats` and `coturn`: their `dockerTag` in `startos/manifest/index.ts`.
- Janus: the `FROM alpine:` tag in `janus.Dockerfile`.
- A signaling bump also sets the upstream part of `version` in `startos/versions/current.ts`.

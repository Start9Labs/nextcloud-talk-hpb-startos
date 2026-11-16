FROM alpine:3.24.4

RUN apk add --no-cache janus-gateway \
 && find /usr/lib/janus/plugins -name '*.so*' ! -name 'libjanus_videoroom.so*' -delete \
 && find /usr/lib/janus/transports -name '*.so*' ! -name 'libjanus_websockets.so*' -delete \
 && cd /etc/janus \
 && mv janus.transport.websockets.jcfg.sample janus.transport.websockets.jcfg \
 && sed -i 's|^[[:space:]]*#ws_ip = .*|\tws_ip = "127.0.0.1"|' janus.transport.websockets.jcfg \
 && grep -q '^[[:space:]]*ws_ip = "127.0.0.1"' janus.transport.websockets.jcfg \
 && mv janus.plugin.videoroom.jcfg.sample janus.plugin.videoroom.jcfg \
 && sed -i '/^room-1234:/,/^}/d' janus.plugin.videoroom.jcfg \
 && sed 's|^[[:space:]]*#full_trickle = .*|\tfull_trickle = true|' janus.jcfg.sample > janus.jcfg \
 && grep -q '^[[:space:]]*full_trickle = true' janus.jcfg \
 && rm -f janus.*.sample

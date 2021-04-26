FROM ubuntu:focal
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && \
    sed -i~orig -e 's/# deb-src/deb-src/' /etc/apt/sources.list && \
    apt-get update -y && \
    apt-get install -y dnsutils tzdata git ninja-build meson curl && \
    ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    apt-get build-dep -y janus && \
    apt-get purge -y libnice10 libnice-dev

RUN git clone https://gitlab.freedesktop.org/libnice/libnice && \
    cd libnice && \
    meson --prefix=/usr build && ninja -C build && ninja -C build install

RUN cd / && git clone https://github.com/meetecho/janus-gateway.git -b v0.10.2  && cd /janus-gateway && \
    sh autogen.sh &&  \
    ./configure \
    --enable-rest \
    --enable-post-processing \
    --enable-data-channels \
    --disable-rabbitmq \
    --disable-mqtt \
    --disable-unix-sockets \
    --enable-plugin-echotest \
    --enable-plugin-recordplay \
    --enable-plugin-sip \
    --enable-plugin-videocall \
    --enable-plugin-voicemail \
    --enable-plugin-textroom \
    --enable-plugin-audiobridge \
    --enable-plugin-nosip \
    --enable-all-handlers && \
    make -j$(nproc) && make install && make configs && ldconfig

COPY janus.jcfg /usr/local/etc/janus/janus.jcfg
COPY janus.transport.http.jcfg /usr/local/etc/janus/janus.transport.http.jcfg

RUN mkdir -p /janus/recordings/

RUN cp /usr/local/bin/janus-pp-rec /janus/recordings/

COPY runprod.sh .
COPY rundev.sh .
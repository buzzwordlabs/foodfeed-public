FROM ubuntu:focal
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y && \
    apt-get install -y dnsutils tzdata git curl ffmpeg libjansson4 && \
    ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
    dpkg-reconfigure --frontend noninteractive tzdata
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs
COPY runprod.sh .
COPY rundev.sh .
RUN mkdir -p /janus/recordings/
WORKDIR /app
COPY . .
ARG ENV
RUN echo "$ENV"
RUN if [ "$ENV" = "dev" ] ; then npm run build ; else npm run build:prod ; fi;
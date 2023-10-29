#FROM debian:bookworm-slim as build-drivers
#ARG MAKEFLAGS
#ADD files /files
#COPY common.sh build-drivers.sh /tmp
#RUN /tmp/build-drivers.sh
#
#FROM build-drivers as build-tools
#ARG MAKEFLAGS
#COPY build-tools.sh /tmp
#RUN /tmp/build-tools.sh

FROM debian:bookworm-slim as base
ARG MAKEFLAGS
ARG APT_PROXY
ADD files/sdrplay /tmp/sdrplay
COPY install-base.sh common.sh /tmp
RUN /tmp/install-base.sh

FROM base as sources
ARG MAKEFLAGS
ARG APT_PROXY
ADD files /files
COPY install-sources.sh /tmp
COPY --from=golang:bookworm /usr/local/go /usr/local/go
RUN /tmp/install-sources.sh

FROM base as final
# FROM sources as final
ARG PRODUCT=openwebrxplus
ARG VARIANT=nightly
ARG OWRXVERSION
ARG MAKEFLAGS
ARG BUILD_DATE
ARG BUILD_SHA
COPY --from=sources /build-sources-date /build-sources-date
COPY install-owrx.sh /tmp
RUN /tmp/install-owrx.sh

ENTRYPOINT ["/init"]
VOLUME /etc/openwebrx
VOLUME /var/lib/openwebrx

# ENV S6_CMD_ARG0="/opt/openwebrx/docker/scripts/run.sh"
CMD [""]
# CMD ["/usr/bin/with-contenv","/bin/bash"]
# CMD ["/bin/bash"]

EXPOSE 8073



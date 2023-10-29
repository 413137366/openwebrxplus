#!/bin/bash
set -euo pipefail

source /tmp/common.sh

echo;echo;echo;echo;echo;echo;echo
pinfo "Building ${PRODUCT:-}-${VARIANT:-}..."
pinfo "MAKEFLAGS: ${MAKEFLAGS:-}"
pinfo "BUILD_DATE: ${BUILD_DATE:-}"
pinfo "BUILD_SHA: ${BUILD_SHA:-}"
pinfo "PLATFORM: ${PLATFORM}"
pinfo "PRODUCT: ${PRODUCT}"
pinfo "VARIANT: ${VARIANT}"
pinfo "VERSION: ${OWRXVERSION}"

echo ${BUILD_DATE:-} > /build-date
echo ${BUILD_SHA:-} > /build-sha
echo ${PRODUCT:-}-${VARIANT:-}-${OWRXVERSION:-${BUILD_DATE}} > /build-image

if [ -z "${VARIANT:-}" ]; then
  perror "No VARIANT variable specified."
  exit 1
fi

apt update

pinfo "Installing prebuilt deb packages..."
dpkg -i /build_cache/soapysdr0.8-module-airspyhf_*.deb
dpkg -i /build_cache/soapysdr-module-airspyhf_*.deb
dpkg -i /build_cache/soapysdr0.8-module-plutosdr_*.deb
dpkg -i /build_cache/soapysdr-module-plutosdr_*.deb
dpkg -i /build_cache/runds-connector_*.deb
pinfo "Installing rest of the binaries from rootfs..."
cp -a /build_cache/rootfs/* /
ldconfig /etc/ld.so.conf.d

if [ "${VARIANT}" == "nightly" ]; then
  pinfo "This is a NIGHTLY build."
else
  pinfo "This is a RELEASE build."
  DEBIAN_FRONTEND=noninteractive apt install -y --install-suggests --install-recommends openwebrx=${OWRXVERSION:-}
fi



pwarn "Tiny image..."
rm -f /etc/apt/apt.conf.d/51cache
apt clean
rm -rf /var/lib/apt/lists/*

pok "Final image done."

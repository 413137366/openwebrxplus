SHELL:=/bin/bash
PRODUCT=openwebrxplus
DATE=$(shell date +%F)
SHA=$(shell git rev-parse --short HEAD)
# to use APT proxy, run: docker compose up -d
#APT_PROXY=
APT_PROXY=http://192.168.175.50:3142
ARCH=$(shell uname -m)
IS_PODMAN=$(shell if ! docker buildx ls; then echo 1; fi)

default: error
ifeq ($(VARIANT),nightly)
DOCKER_IMAGE=$(PRODUCT)-$(VARIANT)
DOCKER_TAG=$(DATE)
default: build
else
ifeq ($(VARIANT),release)
ifndef VERSION
default: error
else
default: build
DOCKER_IMAGE=$(PRODUCT)
DOCKER_TAG=$(VERSION)
endif
endif
endif

ifndef DOCKER_IMAGE
default: error
endif
ifndef DOCKER_TAG
default: error
endif

define help =

You need to specify the variant of the image:
# make nightly
# make release VERSION=1.2.33

You can specify env var for MAKEFLAGS inside docker build like this:
# DOCKER_MAKEFLAGS='-j4' make nightly

Change the build arch with ARCH= flag

To run a container:
# make VARIANT=nightly run
# make VARIANT=release VERSION=1.2.33 run

To add admin user inside a running container:
# make VARIANT=nightly add_admin
# make VARIANT=release VERSION=1.2.33 add_admin

To run new container with interactive shell:
# make VARIANT=nightly dev
# make VARIANT=release VERSION=1.2.33 dev
endef

error:; @ $(info $(help)) :

nightly:
	$(MAKE) VARIANT=nightly VERSION=${DATE}-${SHA} build

release:
ifndef VERSION
	$(MAKE) error
else
	$(MAKE) VARIANT=release build VERSION=$(VERSION)
endif

ifeq ($(IS_PODMAN),1)
build:
	@echo "Building $(DOCKER_IMAGE):$(DOCKER_TAG)"
	@mkdir -p cache
	docker build \
		--arch='$(ARCH)' \
		--build-arg MAKEFLAGS='${DOCKER_MAKEFLAGS}' \
		--build-arg BUILD_DATE='$(DATE)' \
		--build-arg BUILD_SHA='$(SHA)' \
		--build-arg PRODUCT='$(PRODUCT)' \
		--build-arg VARIANT='$(VARIANT)' \
		--build-arg OWRXVERSION='$(VERSION)' \
		--build-arg APT_PROXY='$(APT_PROXY)' \
		-v `pwd`/cache:/build_cache \
		-t $(DOCKER_IMAGE):$(DOCKER_TAG) \
		-t $(DOCKER_IMAGE) .
else
build:
	@echo "Building $(DOCKER_IMAGE):$(DOCKER_TAG)"
	@mkdir -p cache
	@# create docker builder https://docs.docker.com/build/building/multi-platform/
	@# we enable networking so the builder container has access to the host network (needed for registry)
	@echo -e "\n\nCreating docker builder for multiarch...\n\n"
	@docker buildx create \
		--name owrxp-builder \
		--driver docker-container \
		--bootstrap \
		--use \
		--driver-opt network=host \
		|| true # ignore errors if already created
	@# create another docker container for local registry.
	@# we need this to store our -base image, because docker builder always try to pull the -base image
	@# from dockerhub and not use the localy present -base image for building the -full image.
	@#@echo -e "\n\nCreating local docker registry...\n\n"
	@#@docker container rm -vf registry 2>/dev/null || true # remove an existing registry container (ignoring errors)
	@#@docker run -d --name registry --network=host registry:2 # create new registry container
	@# build the -base image and store it in local registry (see the tags)
	@echo -e "\n\nBuilding the base image for AMD64, ARM64 and ARM32v7.\n\n"
	time docker buildx build \
		--platform linux/amd64 \
		--build-context mycache=`pwd`/cache \
		--cache-from type=local,src=`pwd`/cache \
		--cache-to type=local,dest=`pwd`/cache \
		--build-arg MAKEFLAGS='${DOCKER_MAKEFLAGS}' \
		--build-arg BUILD_DATE='$(DATE)' \
		--build-arg BUILD_SHA='$(SHA)' \
		--build-arg PRODUCT='$(PRODUCT)' \
		--build-arg VARIANT='$(VARIANT)' \
		--build-arg OWRXVERSION='$(VERSION)' \
		--build-arg APT_PROXY='$(APT_PROXY)' \
		-t $(DOCKER_IMAGE):$(DOCKER_TAG) \
		-t $(DOCKER_IMAGE) \
		--pull \
		--progress=plain \
		.
	@#--push
	@#--platform linux/amd64,linux/arm64,linux/arm/v7
	@#--cache-from=type=local,src=`pwd`/cache
	@#--cache-to=type=local,dest=`pwd`/cache
	@echo -e "\n\nRemoving docker builder (keeping state/caches for next use)...\n\n"
	@docker buildx rm --keep-state owrxp-builder # keep state is needed to keep the caches for the next build
	@#@echo -e "\n\nRemoving local docker registry...\n\n"
	@#@docker container rm -vf registry
endif

run:
	@mkdir -p work/owrx/var work/owrx/etc
	docker run --rm \
		-h $(DOCKER_IMAGE) \
		--name $(DOCKER_IMAGE) \
		--device /dev/bus/usb \
		-p 8073:8073 \
		-v ./work/owrx/var:/var/lib/openwebrx \
		-v ./work/owrx/etc:/etc/openwebrx \
		$(DOCKER_IMAGE)

add_admin:
	docker exec -it $(DOCKER_IMAGE) /usr/bin/openwebrx admin adduser admin

dev:
	@mkdir -p work/owrx/var work/owrx/etc
	docker run -it --rm \
		-p 8073:8073 \
		--device /dev/bus/usb \
		-v ./work/owrx/var:/var/lib/openwebrx \
		-v ./work/owrx/etc:/etc/openwebrx \
		--name $(DOCKER_IMAGE)-dev \
		--entrypoint /init \
		-v `pwd`/cache:/build_cache \
		-e http_proxy="${APT_PROXY}" \
		$(DOCKER_IMAGE) /bin/bash

# Build-time PHP toolchain for Clog's server plugin: Composer and the eleph commands.
#
# Generation is a build step, not a service. Nothing in this image runs as a daemon,
# so containers are created per command and removed on exit — which is why this is a
# bare Dockerfile rather than another entry in docker-compose.yml. The runtime stack
# there (WordPress, MySQL, Redis) is the thing you start and stop; this is not.
#
# Image names are fully qualified: podman refuses to guess a registry for an
# unqualified name and prompts interactively, which would break unattended builds.
FROM docker.io/library/php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libonig-dev \
        libzip-dev \
    # mbstring and zip are not in the base image; the spec compiler needs the former,
    # Composer wants the latter to avoid shelling out to unzip.
    && docker-php-ext-install -j"$(nproc)" mbstring zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=docker.io/library/composer:2 /usr/bin/composer /usr/bin/composer

# Composer refuses to run as root without this, and rootless podman maps the host
# user to root inside the container.
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /work/clog/server

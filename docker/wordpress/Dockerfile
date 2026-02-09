FROM wordpress:6-apache

RUN echo "deb http://deb.debian.org/debian bookworm main" > /etc/apt/sources.list \ && echo "deb http://security.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list \ && echo "deb http://deb.debian.org/debian bookworm-updates main" >> /etc/apt/sources.list

RUN apt-get update && apt-get install -y curl unzip ca-certificates && rm -rf /var/lib/apt/lists/*

# Install PHP Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Download and install WPGraphQL plugin
RUN curl -L -o /tmp/wp-graphql.zip https://downloads.wordpress.org/plugin/wp-graphql.latest-stable.zip \
    && unzip /tmp/wp-graphql.zip -d /usr/src/wordpress/wp-content/plugins/ \
    && rm /tmp/wp-graphql.zip

# Download and install WPGraphQL JWT Authentication plugin
RUN curl -L -o /tmp/wp-graphql-jwt-auth.zip https://github.com/wp-graphql/wp-graphql-jwt-authentication/releases/latest/download/wp-graphql-jwt-authentication.zip \
    && unzip /tmp/wp-graphql-jwt-auth.zip -d /usr/src/wordpress/wp-content/plugins/ \
    && rm /tmp/wp-graphql-jwt-auth.zip

# Download and install WP Redis plugin
RUN curl -L -o /tmp/wp-redis.zip https://downloads.wordpress.org/plugin/wp-redis.latest-stable.zip \
    && unzip /tmp/wp-redis.zip -d /usr/src/wordpress/wp-content/plugins/ \
    && rm /tmp/wp-redis.zip

# Copy PHP upload config
COPY uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Copy Redis object cache drop-in
COPY object-cache.php /usr/src/wordpress/wp-content/object-cache.php

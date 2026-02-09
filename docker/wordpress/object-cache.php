<?php
# This is a drop-in for WordPress object caching via Redis.
# It will be copied to wp-content/object-cache.php by the Dockerfile.
# The actual implementation is provided by the wp-redis plugin.
# This file bootstraps the wp-redis object cache drop-in.

if ( defined( 'WP_REDIS_HOST' ) ) {
    $redis_server = array(
        'host' => WP_REDIS_HOST,
        'port' => defined( 'WP_REDIS_PORT' ) ? WP_REDIS_PORT : 6379,
    );
}

if ( file_exists( WP_CONTENT_DIR . '/plugins/wp-redis/includes/object-cache.php' ) ) {
    require_once WP_CONTENT_DIR . '/plugins/wp-redis/includes/object-cache.php';
}

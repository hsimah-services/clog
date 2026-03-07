#!/bin/bash
set -e

# Run the default WordPress entrypoint first
docker-entrypoint.sh apache2-foreground &
WP_PID=$!

# Wait for WordPress files to be available
echo "Waiting for WordPress files..."
until wp core version --allow-root --quiet 2>/dev/null; do
  sleep 2
done
echo "WordPress files are ready."

# Install WordPress if not already installed (handles fresh databases in CI)
if ! wp core is-installed --allow-root --quiet 2>/dev/null; then
  echo "WordPress not installed — running wp core install..."
  wp core install \
    --url="${WP_URL:-http://localhost:8080}" \
    --title="${WP_TITLE:-Clog}" \
    --admin_user="${WP_ADMIN_USER:-admin}" \
    --admin_password="${WP_ADMIN_PASSWORD:-admin}" \
    --admin_email="${WP_ADMIN_EMAIL:-admin@localhost}" \
    --skip-email \
    --allow-root
  echo "WordPress installed successfully."
fi

# Copy object-cache.php drop-in to live directory if missing
if [ ! -f /var/www/html/wp-content/object-cache.php ]; then
  cp /usr/src/wordpress/wp-content/object-cache.php /var/www/html/wp-content/object-cache.php
  echo "Copied object-cache.php drop-in"
fi

# Remove legacy plugin directory (old Dockerfile unzipped the GitHub archive with a versioned name)
if [ -d /var/www/html/wp-content/plugins/wp-graphql-jwt-authentication-0.7.0 ]; then
  rm -rf /var/www/html/wp-content/plugins/wp-graphql-jwt-authentication-0.7.0
  echo "Removed legacy wp-graphql-jwt-authentication-0.7.0 directory"
fi

# Install and activate plugins via WP-CLI
wp plugin install wp-graphql --activate --allow-root
if [ -d /var/www/html/wp-content/plugins/wp-graphql-jwt-authentication ]; then
  wp plugin activate wp-graphql-jwt-authentication --allow-root
else
  wp plugin install https://github.com/wp-graphql/wp-graphql-jwt-authentication/archive/refs/tags/v0.7.0.zip --activate --allow-root
fi
wp plugin install wp-redis --activate --allow-root

# Activate the local clog plugin (mounted via volume, not installed via WP-CLI)
wp plugin activate clog --allow-root 2>/dev/null || echo "Could not activate: clog"

# Set permalink structure (required for WPGraphQL pretty URLs)
wp rewrite structure '/%postname%/' --allow-root 2>/dev/null || true

# Ensure .htaccess has rewrite rules (WordPress can't always write these)
if ! grep -q "RewriteEngine On" /var/www/html/.htaccess 2>/dev/null; then
  cat > /var/www/html/.htaccess << 'HTACCESS'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
HTACCESS
  echo "Wrote .htaccess rewrite rules"
fi

wait $WP_PID

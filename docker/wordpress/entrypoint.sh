#!/bin/bash
set -e

# Run the default WordPress entrypoint first
docker-entrypoint.sh apache2-foreground &
WP_PID=$!

# Wait for WordPress to be ready
echo "Waiting for WordPress to be ready..."
until wp core is-installed --allow-root --quiet 2>/dev/null; do
  sleep 2
done
echo "WordPress is ready."

# Copy plugins from source to live directory if missing (handles persistent volumes)
for plugin_dir in wp-graphql wp-graphql-jwt-authentication-0.7.0 wp-redis; do
  if [ -d "/usr/src/wordpress/wp-content/plugins/$plugin_dir" ] && [ ! -d "/var/www/html/wp-content/plugins/$plugin_dir" ]; then
    cp -r "/usr/src/wordpress/wp-content/plugins/$plugin_dir" "/var/www/html/wp-content/plugins/"
    echo "Copied plugin: $plugin_dir"
  fi
done

# Activate plugins if not already active
for plugin in wp-graphql wp-graphql-jwt-authentication-0.7.0 wp-redis clog; do
  if ! wp plugin is-active "$plugin" --allow-root 2>/dev/null; then
    wp plugin activate "$plugin" --allow-root 2>/dev/null && echo "Activated: $plugin" || echo "Could not activate: $plugin"
  fi
done

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

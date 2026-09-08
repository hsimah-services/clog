<?php
/**
 * Self-hosted updates. Clog isn't on WordPress.org, so this points WordPress's
 * own update mechanism at hsimah-services/clog's GitHub releases instead —
 * the Plugins page shows "Update available" and "Update Now" works normally.
 *
 * Requires CLOG_GITHUB_TOKEN (a token with read access to this private repo)
 * to be defined, e.g. via WORDPRESS_CONFIG_EXTRA. Without it, no update
 * checker is registered and the plugin behaves as if updates aren't wired up.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'CLOG_GITHUB_TOKEN' ) || '' === CLOG_GITHUB_TOKEN ) {
	return;
}

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

$clog_update_checker = PucFactory::buildUpdateChecker(
	'https://github.com/hsimah-services/clog/',
	CLOG_PLUGIN_DIR . 'clog.php',
	'clog'
);

$clog_update_checker->setAuthentication( CLOG_GITHUB_TOKEN );

// Releases attach a pre-built zip (vendor/ and client dist/ included) — use
// that instead of GitHub's raw source archive.
$clog_update_checker->getVcsApi()->enableReleaseAssets( '/\.zip($|[?&#])/i' );

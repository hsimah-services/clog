<?php
/**
 * Self-hosted updates. Clog isn't on WordPress.org, so this points WordPress's
 * own update mechanism at hsimah/clog's GitHub releases instead —
 * the Plugins page shows "Update available" and "Update Now" works normally.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

$clog_update_checker = PucFactory::buildUpdateChecker(
	'https://github.com/hsimah/clog/',
	CLOG_PLUGIN_DIR . 'clog.php',
	'clog'
);

// Releases attach a pre-built zip (vendor/ and client dist/ included) — use
// that instead of GitHub's raw source archive.
$clog_update_checker->getVcsApi()->enableReleaseAssets( '/\.zip($|[?&#])/i' );

<?php
/**
 * Frontend routing and asset loading for the Clog React app.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register rewrite rules so /clog and /clog/* are handled by WordPress.
 */
function clog_rewrite_rules() {
	add_rewrite_rule( '^clog(/.*)?$', 'index.php?clog_app=1', 'top' );
}
add_action( 'init', 'clog_rewrite_rules' );

/**
 * Register the clog_app query variable.
 */
function clog_query_vars( $vars ) {
	$vars[] = 'clog_app';
	return $vars;
}
add_filter( 'query_vars', 'clog_query_vars' );

/**
 * Load the app template when clog_app query var is set.
 */
function clog_template_include( $template ) {
	if ( get_query_var( 'clog_app' ) ) {
		if ( ! is_user_logged_in() ) {
			auth_redirect();
			exit;
		}
		return CLOG_PLUGIN_DIR . 'templates/app.php';
	}
	return $template;
}
add_filter( 'template_include', 'clog_template_include' );

/**
 * Extend JWT expiry to 1 hour for SPA sessions.
 */
add_filter( 'graphql_jwt_auth_expire', function () {
	return HOUR_IN_SECONDS;
} );

/**
 * Read the Vite manifest and return the entry point JS and CSS filenames.
 *
 * @return array{js: string, css: string[]} Asset paths relative to dist/.
 */
function clog_get_vite_assets() {
	$manifest_path = CLOG_PLUGIN_DIR . 'dist/.vite/manifest.json';

	if ( ! file_exists( $manifest_path ) ) {
		return array(
			'js'  => '',
			'css' => array(),
		);
	}

	$manifest = json_decode( file_get_contents( $manifest_path ), true );
	$entry    = $manifest['index.html'] ?? array();

	return array(
		'js'  => $entry['file'] ?? '',
		'css' => $entry['css'] ?? array(),
	);
}

/**
 * Flush rewrite rules on plugin activation.
 */
function clog_activate() {
	clog_rewrite_rules();
	flush_rewrite_rules();
	clog_get_snapshot_dir();
	clog_schedule_snapshot_events();
}

/**
 * Flush rewrite rules on plugin deactivation.
 */
function clog_deactivate() {
	flush_rewrite_rules();
	clog_unschedule_snapshot_events();
}

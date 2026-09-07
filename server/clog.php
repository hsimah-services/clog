<?php
/**
 * Plugin Name: Clog
 * Description: Custom post types for inventory tracking — Items, Locations, and Inventory entries. Exposed via WPGraphQL.
 * Version: 1.0.0
 * Author: hsimah
 * Text Domain: clog
 * Requires Plugins: wp-graphql, wp-graphql-jwt-authentication
 * Requires at least: 6.5
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CLOG_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// Composer autoloader — Elephentity and its dependencies. Guarded so a checkout
// without `composer install` still loads the hand-written plugin code below.
if ( file_exists( CLOG_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once CLOG_PLUGIN_DIR . 'vendor/autoload.php';
}

require_once CLOG_PLUGIN_DIR . 'includes/post-types.php';
require_once CLOG_PLUGIN_DIR . 'includes/runtime.php';
require_once CLOG_PLUGIN_DIR . 'includes/entity-cli.php';
require_once CLOG_PLUGIN_DIR . 'includes/admin-menu.php';
require_once CLOG_PLUGIN_DIR . 'includes/seed-data.php';
require_once CLOG_PLUGIN_DIR . 'includes/frontend.php';

register_activation_hook( __FILE__, 'clog_activate' );
register_deactivation_hook( __FILE__, 'clog_deactivate' );

<?php
/**
 * Plugin Name: Clog
 * Description: Custom post types for inventory tracking — Items, Locations, and Inventory entries. Exposed via WPGraphQL.
 * Version: 1.0.0
 * Author: hsimah
 * Text Domain: clog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CLOG_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

require_once CLOG_PLUGIN_DIR . 'includes/post-types.php';
require_once CLOG_PLUGIN_DIR . 'includes/meta-fields.php';
require_once CLOG_PLUGIN_DIR . 'includes/graphql.php';
require_once CLOG_PLUGIN_DIR . 'includes/admin-menu.php';

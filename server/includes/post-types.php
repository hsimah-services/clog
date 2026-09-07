<?php
/**
 * Register Clog's post types from the compiled manifest.
 *
 * This file used to carry the registration arguments by hand — three
 * `register_post_type()` calls whose labels and slugs had to be kept in step with
 * `spec/entities/` by whoever remembered. They are now compiled: the `wordpress`
 * target emits `generated/wordpress/post-types.php`, and registering them is a loop
 * over it.
 *
 * Registering the type is all this does. Nothing here creates or maintains a post
 * row — the custom table is the entity.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Clog\Runtime\Clog;

add_action( 'init', 'clog_register_post_types' );

function clog_register_post_types(): void {
	// Guarded like the GraphQL boot is: a checkout without `composer install` still
	// loads the rest of the plugin, and an admin screen is a worse place to discover
	// a missing autoloader than the error log.
	if ( ! class_exists( Clog::class ) ) {
		return;
	}

	Clog::instance()->postTypes()->register();
}

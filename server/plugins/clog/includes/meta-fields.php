<?php
/**
 * Register custom meta fields for Clog post types.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', 'clog_register_meta_fields' );

function clog_register_meta_fields(): void {
	// Item meta fields
	register_post_meta( 'clog_item', 'clog_barcodes', [
		'type'          => 'array',
		'description'   => 'Barcodes associated with this item',
		'single'        => true,
		'show_in_rest'  => [
			'schema' => [
				'type'  => 'array',
				'items' => [ 'type' => 'string' ],
			],
		],
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );

	register_post_meta( 'clog_item', 'clog_default_expiry_unit', [
		'type'          => 'string',
		'description'   => 'Default expiry unit (days or months)',
		'single'        => true,
		'show_in_rest'  => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );

	register_post_meta( 'clog_item', 'clog_default_expiry_value', [
		'type'          => 'integer',
		'description'   => 'Default expiry value',
		'single'        => true,
		'show_in_rest'  => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );

	// Inventory meta fields
	register_post_meta( 'clog_inventory', 'clog_item_id', [
		'type'          => 'integer',
		'description'   => 'Referenced Item post ID',
		'single'        => true,
		'show_in_rest'  => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );

	register_post_meta( 'clog_inventory', 'clog_location_id', [
		'type'          => 'integer',
		'description'   => 'Referenced Location post ID',
		'single'        => true,
		'show_in_rest'  => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );

	register_post_meta( 'clog_inventory', 'clog_date_added', [
		'type'          => 'string',
		'description'   => 'Date the item was added to inventory (ISO 8601)',
		'single'        => true,
		'show_in_rest'  => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );

	register_post_meta( 'clog_inventory', 'clog_date_expiry', [
		'type'          => 'string',
		'description'   => 'Expiry date (ISO 8601), empty if no expiry',
		'single'        => true,
		'show_in_rest'  => true,
		'auth_callback' => function() {
			return current_user_can( 'edit_clog_entries' );
		},
	] );
}

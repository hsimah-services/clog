<?php
/**
 * Register custom post types for Clog.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', 'clog_register_post_types' );

function clog_register_post_types(): void {
	// Item
	register_post_type( 'clog_item', [
		'labels'       => [
			'name'               => __( 'Items', 'clog' ),
			'singular_name'      => __( 'Item', 'clog' ),
			'add_new_item'       => __( 'Add New Item', 'clog' ),
			'edit_item'          => __( 'Edit Item', 'clog' ),
			'new_item'           => __( 'New Item', 'clog' ),
			'view_item'          => __( 'View Item', 'clog' ),
			'search_items'       => __( 'Search Items', 'clog' ),
			'not_found'          => __( 'No items found', 'clog' ),
			'not_found_in_trash' => __( 'No items found in Trash', 'clog' ),
		],
		'public'       => true,
		'show_ui'      => true,
		'show_in_rest' => true,
		'show_in_menu' => 'clog',
		'supports'     => [ 'title', 'custom-fields' ],
		'show_in_graphql'    => true,
		'graphql_single_name' => 'ClogItem',
		'graphql_plural_name' => 'ClogItems',
	] );

	// Location
	register_post_type( 'clog_location', [
		'labels'       => [
			'name'               => __( 'Locations', 'clog' ),
			'singular_name'      => __( 'Location', 'clog' ),
			'add_new_item'       => __( 'Add New Location', 'clog' ),
			'edit_item'          => __( 'Edit Location', 'clog' ),
			'new_item'           => __( 'New Location', 'clog' ),
			'view_item'          => __( 'View Location', 'clog' ),
			'search_items'       => __( 'Search Locations', 'clog' ),
			'not_found'          => __( 'No locations found', 'clog' ),
			'not_found_in_trash' => __( 'No locations found in Trash', 'clog' ),
		],
		'public'       => true,
		'show_ui'      => true,
		'show_in_rest' => true,
		'show_in_menu' => 'clog',
		'supports'     => [ 'title', 'custom-fields' ],
		'show_in_graphql'    => true,
		'graphql_single_name' => 'ClogLocation',
		'graphql_plural_name' => 'ClogLocations',
	] );

	// Inventory
	register_post_type( 'clog_inventory', [
		'labels'       => [
			'name'               => __( 'Inventory', 'clog' ),
			'singular_name'      => __( 'Inventory Entry', 'clog' ),
			'add_new_item'       => __( 'Add Inventory Entry', 'clog' ),
			'edit_item'          => __( 'Edit Inventory Entry', 'clog' ),
			'new_item'           => __( 'New Inventory Entry', 'clog' ),
			'view_item'          => __( 'View Inventory Entry', 'clog' ),
			'search_items'       => __( 'Search Inventory', 'clog' ),
			'not_found'          => __( 'No inventory entries found', 'clog' ),
			'not_found_in_trash' => __( 'No inventory entries found in Trash', 'clog' ),
		],
		'public'       => true,
		'show_ui'      => true,
		'show_in_rest' => true,
		'show_in_menu' => 'clog',
		'supports'     => [ 'title', 'custom-fields' ],
		'show_in_graphql'    => true,
		'graphql_single_name' => 'ClogInventory',
		'graphql_plural_name' => 'ClogInventoryEntries',
	] );
}

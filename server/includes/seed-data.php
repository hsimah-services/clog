<?php
/**
 * WP-CLI command to seed test data for Clog.
 *
 * Usage: wp clog seed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

WP_CLI::add_command( 'clog seed', 'clog_seed_data' );

/**
 * Seed test data matching client/src/data/seed.json.
 *
 * ## EXAMPLES
 *
 *     wp clog seed
 *
 * @when after_wp_load
 */
function clog_seed_data(): void {
	// Check if data already exists.
	$existing = get_posts( [
		'post_type'   => 'clog_item',
		'numberposts' => 1,
		'post_status' => 'publish',
	] );

	if ( ! empty( $existing ) ) {
		WP_CLI::warning( 'Seed data already exists. Delete existing posts first to re-seed.' );
		return;
	}

	// Items.
	$items = [
		[
			'name'         => 'Heinz Ketchup',
			'barcodes'     => [ '013000006057' ],
			'expiry_unit'  => 'months',
			'expiry_value' => 6,
		],
		[
			'name'         => 'Dry Dog Food',
			'barcodes'     => [ '017800149341' ],
			'expiry_unit'  => null,
			'expiry_value' => null,
		],
		[
			'name'         => 'Wet Dog Food',
			'barcodes'     => [ '017800153560' ],
			'expiry_unit'  => 'days',
			'expiry_value' => 90,
		],
	];

	$item_ids = [];
	foreach ( $items as $item ) {
		$post_id = wp_insert_post( [
			'post_type'   => 'clog_item',
			'post_title'  => $item['name'],
			'post_status' => 'publish',
		] );

		if ( is_wp_error( $post_id ) ) {
			WP_CLI::error( "Failed to create item: {$item['name']}" );
			return;
		}

		update_post_meta( $post_id, 'clog_barcodes', $item['barcodes'] );

		if ( $item['expiry_unit'] !== null ) {
			update_post_meta( $post_id, 'clog_default_expiry_unit', $item['expiry_unit'] );
			update_post_meta( $post_id, 'clog_default_expiry_value', $item['expiry_value'] );
		}

		$item_ids[] = $post_id;
		WP_CLI::log( "Created item: {$item['name']} (ID: {$post_id})" );
	}

	// Locations.
	$locations = [
		'Garage Shelves',
		'Garage Freezer',
		'Kitchen Cabinet',
		'Kitchen Freezer',
	];

	$location_ids = [];
	foreach ( $locations as $name ) {
		$post_id = wp_insert_post( [
			'post_type'   => 'clog_location',
			'post_title'  => $name,
			'post_status' => 'publish',
		] );

		if ( is_wp_error( $post_id ) ) {
			WP_CLI::error( "Failed to create location: {$name}" );
			return;
		}

		$location_ids[] = $post_id;
		WP_CLI::log( "Created location: {$name} (ID: {$post_id})" );
	}

	// Inventory entries.
	// References: item_ids[0]=Ketchup, [1]=Dry Dog Food, [2]=Wet Dog Food
	// location_ids: [0]=Garage Shelves, [1]=Garage Freezer, [2]=Kitchen Cabinet, [3]=Kitchen Freezer
	$inventory_entries = [
		[ 'item' => 0, 'loc' => 2, 'added' => '2025-01-20T12:00:00', 'expiry' => '2025-07-20T00:00:00' ],
		[ 'item' => 0, 'loc' => 2, 'added' => '2025-01-22T09:00:00', 'expiry' => '2025-08-01T00:00:00' ],
		[ 'item' => 0, 'loc' => 0, 'added' => '2025-01-20T12:05:00', 'expiry' => '2025-06-15T00:00:00' ],
		[ 'item' => 0, 'loc' => 0, 'added' => '2025-01-21T10:00:00', 'expiry' => '2025-09-01T00:00:00' ],
		[ 'item' => 0, 'loc' => 0, 'added' => '2025-01-25T14:30:00', 'expiry' => null ],
		[ 'item' => 1, 'loc' => 0, 'added' => '2025-01-21T14:00:00', 'expiry' => null ],
		[ 'item' => 1, 'loc' => 0, 'added' => '2025-01-23T08:00:00', 'expiry' => null ],
		[ 'item' => 1, 'loc' => 0, 'added' => '2025-01-26T11:00:00', 'expiry' => null ],
		[ 'item' => 2, 'loc' => 2, 'added' => '2025-01-22T10:30:00', 'expiry' => '2025-04-22T00:00:00' ],
		[ 'item' => 2, 'loc' => 2, 'added' => '2025-01-23T10:30:00', 'expiry' => '2025-05-01T00:00:00' ],
		[ 'item' => 2, 'loc' => 2, 'added' => '2025-01-24T10:30:00', 'expiry' => null ],
		[ 'item' => 2, 'loc' => 1, 'added' => '2025-01-22T10:35:00', 'expiry' => '2025-06-01T00:00:00' ],
		[ 'item' => 2, 'loc' => 1, 'added' => '2025-01-23T10:35:00', 'expiry' => '2025-06-15T00:00:00' ],
		[ 'item' => 2, 'loc' => 1, 'added' => '2025-01-24T10:35:00', 'expiry' => null ],
	];

	$inv_count = 0;
	foreach ( $inventory_entries as $entry ) {
		$inv_count++;
		$post_id = wp_insert_post( [
			'post_type'   => 'clog_inventory',
			'post_title'  => "Inventory Entry {$inv_count}",
			'post_status' => 'publish',
		] );

		if ( is_wp_error( $post_id ) ) {
			WP_CLI::error( "Failed to create inventory entry #{$inv_count}" );
			return;
		}

		update_post_meta( $post_id, 'clog_item_id', $item_ids[ $entry['item'] ] );
		update_post_meta( $post_id, 'clog_location_id', $location_ids[ $entry['loc'] ] );
		update_post_meta( $post_id, 'clog_date_added', $entry['added'] );

		if ( $entry['expiry'] !== null ) {
			update_post_meta( $post_id, 'clog_date_expiry', $entry['expiry'] );
		}

		WP_CLI::log( "Created inventory entry #{$inv_count} (ID: {$post_id})" );
	}

	WP_CLI::success( "Seeded " . count( $item_ids ) . " items, " . count( $location_ids ) . " locations, and {$inv_count} inventory entries." );
}

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

use Clog\Runtime\Clog;

WP_CLI::add_command( 'clog seed', 'clog_seed_data' );

/**
 * Seed test data through the entity gateway.
 *
 * Everything goes through the gateway rather than wp_insert_post and post meta: the
 * custom tables are the storage now, and seeding around them would produce a database
 * the API cannot see. It doubles as the widest exercise of the write path there is.
 *
 * ## OPTIONS
 *
 * [--force]
 * : Seed even when entities already exist.
 *
 * ## EXAMPLES
 *
 *     wp clog seed
 *
 * @when after_wp_load
 */
function clog_seed_data( array $args, array $assoc ): void {
	$clog = Clog::instance();

	if ( [] !== $clog->tables()->missing() ) {
		WP_CLI::error( 'Entity tables are missing. Run `wp clog install` first.' );
		return;
	}

	$gateway = $clog->gateway();

	if ( $gateway->all( 'Item' )->count() > 0 && ! isset( $assoc['force'] ) ) {
		WP_CLI::warning( 'Seed data already exists. Pass --force to add more anyway.' );
		return;
	}

	// One barcode per item, and no default expiry: both dropped from the spec.
	$items = [
		'Heinz Ketchup'          => '013000006057',
		'Purina Dry Dog Food'    => '017800149341',
		'Pedigree Wet Dog Food'  => '017800153560',
	];

	$item_ids = [];

	foreach ( $items as $name => $barcode ) {
		$item_ids[] = $gateway->create( 'Item', [
			'name'    => $name,
			'barcode' => $barcode,
		] );

		WP_CLI::log( "Created item: {$name}" );
	}

	$locations = [ 'Garage Shelves', 'Garage Freezer', 'Kitchen Cabinet', 'Kitchen Freezer' ];

	$location_ids = [];

	foreach ( $locations as $name ) {
		$location_ids[] = $gateway->create( 'Location', [ 'name' => $name ] );

		WP_CLI::log( "Created location: {$name}" );
	}

	// [ item index, location index, date added ]. Expiry is gone from the model.
	$entries = [
		[ 0, 2, '2025-01-20 12:00:00' ],
		[ 0, 2, '2025-01-22 09:00:00' ],
		[ 0, 0, '2025-01-20 12:05:00' ],
		[ 0, 0, '2025-01-21 10:00:00' ],
		[ 0, 0, '2025-01-25 14:30:00' ],
		[ 1, 0, '2025-01-21 14:00:00' ],
		[ 1, 0, '2025-01-23 08:00:00' ],
		[ 1, 0, '2025-01-26 11:00:00' ],
		[ 2, 2, '2025-01-22 10:30:00' ],
		[ 2, 2, '2025-01-23 10:30:00' ],
		[ 2, 2, '2025-01-24 10:30:00' ],
		[ 2, 1, '2025-01-22 10:35:00' ],
		[ 2, 1, '2025-01-23 10:35:00' ],
		[ 2, 1, '2025-01-24 10:35:00' ],
	];

	$item_names = array_keys( $items );

	foreach ( $entries as $index => [ $item, $location, $added ] ) {
		$gateway->create( 'Inventory', [
			'name'      => sprintf( '%s @ %s', $item_names[ $item ], $locations[ $location ] ),
			'dateAdded' => $added,
			'item'      => $item_ids[ $item ]->raw(),
			'location'  => $location_ids[ $location ]->raw(),
		] );

		WP_CLI::log( sprintf( 'Created inventory entry #%d', $index + 1 ) );
	}

	WP_CLI::success( sprintf(
		'Seeded %d items, %d locations and %d inventory entries.',
		count( $item_ids ),
		count( $location_ids ),
		count( $entries ),
	) );
}

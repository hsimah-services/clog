<?php
/**
 * WP-CLI commands for Clog snapshots.
 *
 * Usage:
 *   wp clog snapshot [daily|weekly|monthly|all]
 *   wp clog snapshot-list
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

WP_CLI::add_command( 'clog snapshot', 'clog_cli_snapshot' );
WP_CLI::add_command( 'clog snapshot-list', 'clog_cli_snapshot_list' );

/**
 * Generate a clog data snapshot.
 *
 * ## OPTIONS
 *
 * [<type>]
 * : Snapshot type to generate.
 * ---
 * default: all
 * options:
 *   - daily
 *   - weekly
 *   - monthly
 *   - all
 * ---
 *
 * ## EXAMPLES
 *
 *     wp clog snapshot
 *     wp clog snapshot daily
 *     wp clog snapshot all
 *
 * @when after_wp_load
 */
function clog_cli_snapshot( array $args ): void {
	$type = $args[0] ?? 'all';

	$types = ( $type === 'all' )
		? [ 'daily', 'weekly', 'monthly' ]
		: [ $type ];

	foreach ( $types as $t ) {
		switch ( $t ) {
			case 'daily':
				$day_name = strtolower( current_time( 'l' ) );
				$filename = "clog-snapshot-{$day_name}.sql";
				break;
			case 'weekly':
				$filename = 'clog-snapshot-weekly.sql';
				break;
			case 'monthly':
				$filename = 'clog-snapshot-monthly.sql';
				break;
			default:
				WP_CLI::error( "Unknown snapshot type: {$t}" );
				return;
		}

		WP_CLI::log( "Generating {$t} snapshot: {$filename}" );

		if ( clog_generate_snapshot( $filename ) ) {
			WP_CLI::success( "Wrote {$filename}" );
		} else {
			WP_CLI::warning( "No clog data found — {$filename} not written." );
		}
	}
}

/**
 * List existing clog snapshot files.
 *
 * ## EXAMPLES
 *
 *     wp clog snapshot-list
 *
 * @when after_wp_load
 */
function clog_cli_snapshot_list(): void {
	$dir = clog_get_snapshot_dir();

	$files = glob( $dir . 'clog-snapshot-*.sql' );

	if ( empty( $files ) ) {
		WP_CLI::log( 'No snapshot files found.' );
		return;
	}

	$rows = [];
	foreach ( $files as $file ) {
		$rows[] = [
			'file'     => basename( $file ),
			'size'     => size_format( filesize( $file ) ),
			'modified' => gmdate( 'Y-m-d H:i:s', filemtime( $file ) ),
		];
	}

	WP_CLI\Utils\format_items( 'table', $rows, [ 'file', 'size', 'modified' ] );
}

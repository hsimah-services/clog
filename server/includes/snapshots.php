<?php
/**
 * Core snapshot generation for Clog data.
 *
 * Exports clog posts and postmeta as SQL INSERT statements
 * using $wpdb queries — no shell commands or mysqldump needed.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get the snapshot directory path, creating it if necessary.
 *
 * @return string Absolute path to the snapshot directory (with trailing slash).
 */
function clog_get_snapshot_dir(): string {
	$upload_dir   = wp_upload_dir();
	$snapshot_dir = trailingslashit( $upload_dir['basedir'] ) . 'clog-snapshots/';

	if ( ! is_dir( $snapshot_dir ) ) {
		wp_mkdir_p( $snapshot_dir );
	}

	// Deny web access via .htaccess.
	$htaccess = $snapshot_dir . '.htaccess';
	if ( ! file_exists( $htaccess ) ) {
		file_put_contents( $htaccess, "Deny from all\n" );
	}

	return $snapshot_dir;
}

/**
 * Generate a SQL snapshot of all clog data and write it to a file.
 *
 * @param string $filename The filename (without path) to write.
 * @return bool True on success, false on failure.
 */
function clog_generate_snapshot( string $filename ): bool {
	global $wpdb;

	$snapshot_dir = clog_get_snapshot_dir();
	$filepath     = $snapshot_dir . $filename;

	$label      = str_replace( [ 'clog-snapshot-', '.sql' ], '', $filename );
	$now        = current_time( 'mysql' );
	$wp_version = get_bloginfo( 'version' );

	$plugin_data    = get_plugin_data( CLOG_PLUGIN_DIR . 'clog.php', false, false );
	$plugin_version = $plugin_data['Version'] ?? '1.0.0';

	$clog_post_types = [ 'clog_item', 'clog_location', 'clog_inventory' ];

	// Fetch clog posts.
	$type_placeholders = implode( ', ', array_fill( 0, count( $clog_post_types ), '%s' ) );
	$posts = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->posts} WHERE post_type IN ({$type_placeholders})",
			...$clog_post_types
		),
		ARRAY_A
	);

	if ( empty( $posts ) ) {
		return false;
	}

	$post_ids = wp_list_pluck( $posts, 'ID' );

	// Fetch postmeta for those posts.
	$id_placeholders = implode( ', ', array_fill( 0, count( $post_ids ), '%d' ) );
	$meta = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT * FROM {$wpdb->postmeta} WHERE post_id IN ({$id_placeholders})",
			...$post_ids
		),
		ARRAY_A
	);

	// Build SQL output.
	$sql = "-- Clog Snapshot: {$label}\n";
	$sql .= "-- Generated: {$now}\n";
	$sql .= "-- WordPress: {$wp_version}\n";
	$sql .= "-- Plugin Version: {$plugin_version}\n\n";

	// Posts table structure.
	$create_posts = $wpdb->get_row( "SHOW CREATE TABLE {$wpdb->posts}", ARRAY_A );
	if ( $create_posts ) {
		$sql .= "-- Table structure for {$wpdb->posts}\n";
		$ddl  = $create_posts['Create Table'];
		$ddl  = preg_replace( '/^CREATE TABLE/', 'CREATE TABLE IF NOT EXISTS', $ddl );
		$sql .= $ddl . ";\n\n";
	}

	// Posts INSERT statements.
	$sql .= "-- Clog posts\n";
	$sql .= clog_build_insert_statements( $wpdb->posts, $posts );
	$sql .= "\n";

	// Postmeta table structure.
	$create_meta = $wpdb->get_row( "SHOW CREATE TABLE {$wpdb->postmeta}", ARRAY_A );
	if ( $create_meta ) {
		$sql .= "-- Table structure for {$wpdb->postmeta}\n";
		$ddl  = $create_meta['Create Table'];
		$ddl  = preg_replace( '/^CREATE TABLE/', 'CREATE TABLE IF NOT EXISTS', $ddl );
		$sql .= $ddl . ";\n\n";
	}

	// Postmeta INSERT statements.
	if ( ! empty( $meta ) ) {
		$sql .= "-- Clog postmeta\n";
		$sql .= clog_build_insert_statements( $wpdb->postmeta, $meta );
		$sql .= "\n";
	}

	return (bool) file_put_contents( $filepath, $sql );
}

/**
 * Build batched INSERT statements from an array of rows.
 *
 * @param string  $table Table name.
 * @param array[] $rows  Array of associative row arrays.
 * @return string SQL INSERT statements.
 */
function clog_build_insert_statements( string $table, array $rows ): string {
	if ( empty( $rows ) ) {
		return '';
	}

	global $wpdb;

	$columns    = array_keys( $rows[0] );
	$col_list   = '`' . implode( '`, `', $columns ) . '`';
	$batch_size = 100;
	$sql        = '';

	foreach ( array_chunk( $rows, $batch_size ) as $batch ) {
		$value_groups = [];

		foreach ( $batch as $row ) {
			$values = [];
			foreach ( $columns as $col ) {
				$val = $row[ $col ];
				if ( $val === null ) {
					$values[] = 'NULL';
				} else {
					$values[] = "'" . $wpdb->_real_escape( (string) $val ) . "'";
				}
			}
			$value_groups[] = '(' . implode( ', ', $values ) . ')';
		}

		$sql .= "INSERT INTO `{$table}` ({$col_list}) VALUES\n";
		$sql .= implode( ",\n", $value_groups ) . ";\n";
	}

	return $sql;
}

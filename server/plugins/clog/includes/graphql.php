<?php
/**
 * Register WPGraphQL types and fields for Clog.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'graphql_register_types', 'clog_register_graphql_types' );

function clog_register_graphql_types(): void {
	clog_register_graphql_enums();
	clog_register_graphql_object_types();
	clog_register_item_fields();
	clog_register_location_fields();
	clog_register_inventory_fields();
}

/**
 * Register enum for expiry unit.
 */
function clog_register_graphql_enums(): void {
	register_graphql_enum_type( 'ClogExpiryUnit', [
		'description' => 'Unit for default expiry duration',
		'values'      => [
			'DAYS'   => [ 'value' => 'days' ],
			'MONTHS' => [ 'value' => 'months' ],
		],
	] );
}

/**
 * Register the DefaultExpiry object type.
 */
function clog_register_graphql_object_types(): void {
	register_graphql_object_type( 'ClogDefaultExpiry', [
		'description' => 'Default expiry configuration for an item',
		'fields'      => [
			'unit'  => [
				'type'        => 'ClogExpiryUnit',
				'description' => 'Expiry unit (days or months)',
			],
			'value' => [
				'type'        => 'Int',
				'description' => 'Expiry duration value',
			],
		],
	] );
}

/**
 * Register GraphQL fields for ClogItem.
 */
function clog_register_item_fields(): void {
	register_graphql_field( 'ClogItem', 'barcodes', [
		'type'        => [ 'list_of' => 'String' ],
		'description' => 'Barcodes associated with this item',
		'resolve'     => function ( $post ) {
			$barcodes = get_post_meta( $post->databaseId, 'clog_barcodes', true );
			if ( empty( $barcodes ) || ! is_array( $barcodes ) ) {
				return [];
			}
			return $barcodes;
		},
	] );

	register_graphql_field( 'ClogItem', 'defaultExpiry', [
		'type'        => 'ClogDefaultExpiry',
		'description' => 'Default expiry configuration',
		'resolve'     => function ( $post ) {
			$unit  = get_post_meta( $post->databaseId, 'clog_default_expiry_unit', true );
			$value = get_post_meta( $post->databaseId, 'clog_default_expiry_value', true );

			if ( empty( $unit ) || $value === '' ) {
				return null;
			}

			return [
				'unit'  => $unit,
				'value' => (int) $value,
			];
		},
	] );
}

/**
 * Register GraphQL fields for ClogLocation.
 *
 * Location only uses post_title (name) and post_date (createdAt),
 * both already exposed by WPGraphQL. No extra fields needed.
 */
function clog_register_location_fields(): void {
	// No additional fields — title and date are built-in.
}

/**
 * Register GraphQL fields for ClogInventory.
 */
function clog_register_inventory_fields(): void {
	register_graphql_field( 'ClogInventory', 'item', [
		'type'        => 'ClogItem',
		'description' => 'The item in this inventory entry',
		'resolve'     => function ( $post, $args, $context ) {
			$item_id = get_post_meta( $post->databaseId, 'clog_item_id', true );
			if ( empty( $item_id ) ) {
				return null;
			}
			return $context->get_loader( 'post' )->load_deferred( (int) $item_id );
		},
	] );

	register_graphql_field( 'ClogInventory', 'location', [
		'type'        => 'ClogLocation',
		'description' => 'The location of this inventory entry',
		'resolve'     => function ( $post, $args, $context ) {
			$location_id = get_post_meta( $post->databaseId, 'clog_location_id', true );
			if ( empty( $location_id ) ) {
				return null;
			}
			return $context->get_loader( 'post' )->load_deferred( (int) $location_id );
		},
	] );

	register_graphql_field( 'ClogInventory', 'dateAdded', [
		'type'        => 'String',
		'description' => 'Date the item was added to inventory (ISO 8601)',
		'resolve'     => function ( $post ) {
			return get_post_meta( $post->databaseId, 'clog_date_added', true ) ?: null;
		},
	] );

	register_graphql_field( 'ClogInventory', 'dateExpiry', [
		'type'        => 'String',
		'description' => 'Expiry date (ISO 8601), null if no expiry',
		'resolve'     => function ( $post ) {
			return get_post_meta( $post->databaseId, 'clog_date_expiry', true ) ?: null;
		},
	] );
}

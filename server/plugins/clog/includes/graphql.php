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
	clog_register_item_mutation_inputs();
	clog_register_inventory_mutation_inputs();
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

/**
 * Register mutation input fields for ClogItem create/update.
 */
function clog_register_item_mutation_inputs(): void {
	$fields = [
		'barcodes' => [
			'type'        => [ 'list_of' => 'String' ],
			'description' => 'Barcodes associated with this item',
		],
		'defaultExpiryUnit' => [
			'type'        => 'ClogExpiryUnit',
			'description' => 'Default expiry unit (days or months)',
		],
		'defaultExpiryValue' => [
			'type'        => 'Int',
			'description' => 'Default expiry duration value',
		],
	];

	foreach ( [ 'CreateClogItemInput', 'UpdateClogItemInput' ] as $input_type ) {
		foreach ( $fields as $field_name => $config ) {
			register_graphql_field( $input_type, $field_name, $config );
		}
	}
}

/**
 * Register mutation input fields for ClogInventory create/update.
 */
function clog_register_inventory_mutation_inputs(): void {
	$fields = [
		'clogItemId' => [
			'type'        => 'Int',
			'description' => 'Post ID of the related item',
		],
		'clogLocationId' => [
			'type'        => 'Int',
			'description' => 'Post ID of the related location',
		],
		'dateAdded' => [
			'type'        => 'String',
			'description' => 'Date added (ISO 8601)',
		],
		'dateExpiry' => [
			'type'        => 'String',
			'description' => 'Expiry date (ISO 8601)',
		],
	];

	foreach ( [ 'CreateClogInventoryInput', 'UpdateClogInventoryInput' ] as $input_type ) {
		foreach ( $fields as $field_name => $config ) {
			register_graphql_field( $input_type, $field_name, $config );
		}
	}
}

/**
 * Save custom meta fields when mutations fire.
 */
add_action( 'graphql_post_object_mutation_update_additional_data', 'clog_save_mutation_meta', 10, 6 );

function clog_save_mutation_meta( $post_id, $input, $post_type_object, $mutation_name, $context, $info ): void {
	$post_type = get_post_type( $post_id );

	if ( 'clog_item' === $post_type ) {
		if ( isset( $input['barcodes'] ) ) {
			update_post_meta( $post_id, 'clog_barcodes', $input['barcodes'] );
		}
		if ( isset( $input['defaultExpiryUnit'] ) ) {
			update_post_meta( $post_id, 'clog_default_expiry_unit', $input['defaultExpiryUnit'] );
		}
		if ( isset( $input['defaultExpiryValue'] ) ) {
			update_post_meta( $post_id, 'clog_default_expiry_value', (int) $input['defaultExpiryValue'] );
		}
	}

	if ( 'clog_inventory' === $post_type ) {
		if ( isset( $input['clogItemId'] ) ) {
			update_post_meta( $post_id, 'clog_item_id', (int) $input['clogItemId'] );
		}
		if ( isset( $input['clogLocationId'] ) ) {
			update_post_meta( $post_id, 'clog_location_id', (int) $input['clogLocationId'] );
		}
		if ( isset( $input['dateAdded'] ) ) {
			update_post_meta( $post_id, 'clog_date_added', sanitize_text_field( $input['dateAdded'] ) );
		}
		if ( array_key_exists( 'dateExpiry', $input ) ) {
			if ( empty( $input['dateExpiry'] ) ) {
				delete_post_meta( $post_id, 'clog_date_expiry' );
			} else {
				update_post_meta( $post_id, 'clog_date_expiry', sanitize_text_field( $input['dateExpiry'] ) );
			}
		}
	}
}

<?php
/**
 * Mounts the Elephentity runtime: schema installation and the GraphQL layer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Clog\Runtime\Clog;
use Eleph\WPGraphQL\Plugin as ElephGraphQL;

/**
 * Register the generated GraphQL surface.
 *
 * Registration is a loop over the compiled manifest — object types, root fields,
 * connections and mutations — resolved through the entity gateway. It replaces the
 * hand-written registrations that read post meta.
 */
add_action( 'plugins_loaded', 'clog_boot_graphql' );

function clog_boot_graphql(): void {
	if ( ! class_exists( ElephGraphQL::class ) ) {
		return;
	}

	$clog = Clog::instance();

	// A missing table means activation has not run — most likely a bind-mounted
	// checkout in a container that was already installed. Registering the schema
	// anyway would produce a GraphQL surface whose every resolver hits a table that
	// is not there, so say so once and stay out of the way.
	if ( [] !== $clog->tables()->missing() ) {
		error_log( '[clog] entity tables are missing; run `wp clog install`. GraphQL not registered.' );
		return;
	}

	ElephGraphQL::fromManifest( $clog->graphqlManifestPath(), $clog->gateway() )->boot();
}

/**
 * Create the entity tables. Called on activation and by `wp clog install`.
 *
 * @return list<string> Tables created.
 */
function clog_install_tables(): array {
	return Clog::instance()->tables()->install();
}

/**
 * Format DateTimeImmutable values on their way out through GraphQL.
 *
 * Elephentity maps a `datetime` field to the GraphQL type `String`, but its resolver
 * hands back whatever the getter returns — and the generated getter returns a
 * DateTimeImmutable. Every query selecting createdAt, updatedAt or dateAdded therefore
 * fails with "String cannot represent value: instance of DateTimeImmutable".
 *
 * WPGraphQL runs every resolved value through this filter, so the coercion can be
 * applied in one place without re-registering fields or reaching into the manifest.
 * ISO 8601, which is what the previous hand-written resolvers emitted and what the
 * client parses.
 *
 * Remove once the framework's resolver formats what it declared as a String.
 */
add_filter( 'graphql_resolve_field', 'clog_format_graphql_datetimes', 10, 1 );

function clog_format_graphql_datetimes( $value ) {
	return $value instanceof DateTimeInterface ? $value->format( DateTimeInterface::ATOM ) : $value;
}

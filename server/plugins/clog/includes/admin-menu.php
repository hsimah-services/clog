<?php
/**
 * Register the top-level Clog admin menu and landing page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'admin_menu', 'clog_register_admin_menu' );

function clog_register_admin_menu(): void {
	add_menu_page(
		__( 'Clog', 'clog' ),
		__( 'Clog', 'clog' ),
		'edit_posts',
		'clog',
		'clog_render_landing_page',
		'dashicons-archive',
		26
	);
}

function clog_render_landing_page(): void {
	$items_count     = wp_count_posts( 'clog_item' );
	$locations_count = wp_count_posts( 'clog_location' );
	$inventory_count = wp_count_posts( 'clog_inventory' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Clog', 'clog' ); ?></h1>
		<p><?php esc_html_e( 'Inventory tracking dashboard.', 'clog' ); ?></p>

		<div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
			<div class="card" style="flex: 1; padding: 1.5rem;">
				<h2 style="margin-top: 0;"><?php esc_html_e( 'Items', 'clog' ); ?></h2>
				<p style="font-size: 2rem; margin: 0.5rem 0;"><?php echo esc_html( $items_count->publish ?? 0 ); ?></p>
				<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=clog_item' ) ); ?>" class="button button-primary">
					<?php esc_html_e( 'View Items', 'clog' ); ?>
				</a>
			</div>

			<div class="card" style="flex: 1; padding: 1.5rem;">
				<h2 style="margin-top: 0;"><?php esc_html_e( 'Locations', 'clog' ); ?></h2>
				<p style="font-size: 2rem; margin: 0.5rem 0;"><?php echo esc_html( $locations_count->publish ?? 0 ); ?></p>
				<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=clog_location' ) ); ?>" class="button button-primary">
					<?php esc_html_e( 'View Locations', 'clog' ); ?>
				</a>
			</div>

			<div class="card" style="flex: 1; padding: 1.5rem;">
				<h2 style="margin-top: 0;"><?php esc_html_e( 'Inventory', 'clog' ); ?></h2>
				<p style="font-size: 2rem; margin: 0.5rem 0;"><?php echo esc_html( $inventory_count->publish ?? 0 ); ?></p>
				<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=clog_inventory' ) ); ?>" class="button button-primary">
					<?php esc_html_e( 'View Inventory', 'clog' ); ?>
				</a>
			</div>
		</div>
	</div>
	<?php
}

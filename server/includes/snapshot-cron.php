<?php
/**
 * WP-Cron scheduling for automated Clog snapshots.
 *
 * Schedules daily, weekly, and monthly snapshot events.
 * Monthly uses a daily schedule with a date guard since
 * WP-Cron has no native monthly interval.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Schedule all snapshot cron events.
 *
 * Skips scheduling when WP_DEBUG is enabled (dev environments).
 * Snapshots can still be generated manually via WP-CLI.
 */
function clog_schedule_snapshot_events(): void {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		return;
	}

	if ( ! wp_next_scheduled( 'clog_daily_snapshot' ) ) {
		wp_schedule_event( time(), 'daily', 'clog_daily_snapshot' );
	}

	if ( ! wp_next_scheduled( 'clog_weekly_snapshot' ) ) {
		wp_schedule_event( time(), 'weekly', 'clog_weekly_snapshot' );
	}

	if ( ! wp_next_scheduled( 'clog_monthly_snapshot' ) ) {
		wp_schedule_event( time(), 'daily', 'clog_monthly_snapshot' );
	}
}

/**
 * Unschedule all snapshot cron events.
 */
function clog_unschedule_snapshot_events(): void {
	$events = [
		'clog_daily_snapshot',
		'clog_weekly_snapshot',
		'clog_monthly_snapshot',
	];

	foreach ( $events as $hook ) {
		$timestamp = wp_next_scheduled( $hook );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, $hook );
		}
	}
}

/**
 * Daily snapshot handler — writes clog-snapshot-{dayname}.sql.
 */
function clog_cron_daily_snapshot(): void {
	$day_name = strtolower( current_time( 'l' ) );
	clog_generate_snapshot( "clog-snapshot-{$day_name}.sql" );
}
add_action( 'clog_daily_snapshot', 'clog_cron_daily_snapshot' );

/**
 * Weekly snapshot handler — writes clog-snapshot-weekly.sql on Sundays.
 */
function clog_cron_weekly_snapshot(): void {
	clog_generate_snapshot( 'clog-snapshot-weekly.sql' );
}
add_action( 'clog_weekly_snapshot', 'clog_cron_weekly_snapshot' );

/**
 * Monthly snapshot handler — writes clog-snapshot-monthly.sql on the 1st.
 * Runs on a daily schedule but only generates the file on day 1.
 */
function clog_cron_monthly_snapshot(): void {
	if ( current_time( 'j' ) !== '1' ) {
		return;
	}
	clog_generate_snapshot( 'clog-snapshot-monthly.sql' );
}
add_action( 'clog_monthly_snapshot', 'clog_cron_monthly_snapshot' );

<?php

declare(strict_types=1);

namespace Clog\Runtime;

use Clog\Entity\Catalogue;
use Eleph\Runtime\Catalogue\BootCheck;
use Eleph\Runtime\Gateway\EntityGateway;
use Eleph\Runtime\Gateway\Runtime;
use Eleph\Runtime\Gateway\UnitOfWorkFactory;
use Eleph\WordPress\Database\WpdbDatabase;
use Eleph\WordPress\Manifest\StorageManifest;
use Eleph\WordPress\WordPress;
use Eleph\WordPress\WordPressAdaptor;
use Psr\Log\LoggerInterface;
use wpdb;

/**
 * The assembled runtime, as one object the plugin holds.
 *
 * Every layer below is separately useless — an adaptor with no hydrators, a unit of
 * work with no verifiers — and this is where they meet. Assembly is cheap: two
 * `require`s of generated PHP that opcache already holds, and no reflection until a
 * generated class is first asked for.
 *
 * Built lazily and once. WordPress loads plugins long before it knows whether a
 * request will touch an entity, so paying for this on every admin page and cron tick
 * would be waste; nothing here runs until something asks for the gateway.
 */
final class Clog
{
    private static ?self $instance = null;

    private ?EntityGateway $gateway = null;

    private ?StorageManifest $manifest = null;

    private ?WordPressAdaptor $adaptor = null;

    private function __construct(
        private readonly WpdbDatabase $database,
        private readonly string $generated,
        private readonly Container $container,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * The shared instance, built from the globals on first use.
     */
    public static function instance(): self
    {
        if (null === self::$instance) {
            /** @var wpdb $wpdb */
            global $wpdb;

            self::$instance = new self(
                new WpdbDatabase($wpdb),
                CLOG_PLUGIN_DIR . 'generated/',
                new Container(),
                new ErrorLogLogger(),
            );
        }

        return self::$instance;
    }

    /**
     * Entities addressed by name — the one entry point application code needs.
     *
     * The boot check runs here rather than on `plugins_loaded`: it is what refuses to
     * start while a generated interface has no implementation, and hanging it off the
     * first real use means a WordPress install whose admin never touches Clog is not
     * made unbootable by it.
     */
    public function gateway(): EntityGateway
    {
        if (null === $this->gateway) {
            $catalogue = new Catalogue($this->container);

            (new BootCheck($catalogue, $this->container))->run();

            $units = new UnitOfWorkFactory($this->adaptor(), $catalogue, new NoProcessors(), $this->logger);

            $this->gateway = new ProjectedGateway(
                new Runtime($this->adaptor(), $catalogue, $units),
                $catalogue,
                $units,
            );
        }

        return $this->gateway;
    }

    /**
     * Schema installation, for activation and the CLI.
     */
    public function tables(): Tables
    {
        return new Tables($this->database, $this->manifest());
    }

    private function adaptor(): WordPressAdaptor
    {
        return $this->adaptor ??= WordPress::adaptor($this->database, $this->manifest());
    }

    private function manifest(): StorageManifest
    {
        return $this->manifest ??= WordPress::manifest($this->generated . 'storage-manifest.php');
    }

    public function graphqlManifestPath(): string
    {
        return $this->generated . 'graphql-manifest.php';
    }
}

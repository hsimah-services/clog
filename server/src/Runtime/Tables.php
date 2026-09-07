<?php

declare(strict_types=1);

namespace Clog\Runtime;

use Eleph\WordPress\Database\Database;
use Eleph\WordPress\Manifest\StorageManifest;
use Eleph\WordPress\Sql\DdlCompiler;

/**
 * Creates the entity tables from the compiled storage manifest.
 *
 * Elephentity stores entities in real tables with typed columns rather than in
 * postmeta, and ships no command to create them — `eleph` has validate, generate, fmt
 * and check, and the MigrationPlanner in the WordPress package is not exposed by any
 * of them. So the plugin installs its own schema on activation.
 *
 * Creation only. An existing table is left exactly as it is: comparing a live table
 * against the manifest and working out a safe ALTER is what the migration planner is
 * for, and half-doing it here would produce a tool that silently diverges from the
 * spec on the changes it cannot handle.
 */
final readonly class Tables
{
    public function __construct(
        private Database $database,
        private StorageManifest $manifest,
        private DdlCompiler $ddl = new DdlCompiler(),
    ) {
    }

    /**
     * @return list<string> The tables created, in the order they were created.
     */
    public function install(): array
    {
        $created = [];

        foreach ($this->manifest->withPrefix($this->database->prefix())->tables as $table) {
            if ([] !== $this->database->describeTable($table->name)) {
                continue;
            }

            $this->database->execute($this->ddl->createTable($table));
            $created[] = $table->name;
        }

        return $created;
    }

    /**
     * Which manifest tables are missing, without creating anything.
     *
     * @return list<string>
     */
    public function missing(): array
    {
        $missing = [];

        foreach ($this->manifest->withPrefix($this->database->prefix())->tables as $table) {
            if ([] === $this->database->describeTable($table->name)) {
                $missing[] = $table->name;
            }
        }

        return $missing;
    }
}

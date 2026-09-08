<?php

declare(strict_types=1);

namespace Clog\Runtime;

use Eleph\Runtime\Type\ProcessorRegistry;
use Eleph\Runtime\Type\ReadProcessor;
use Eleph\Runtime\Type\WriteProcessor;
use RuntimeException;

/**
 * A processor registry for a project that declares no value types.
 *
 * Clog's spec has no `types/` entries, so the catalogue reports no field types and
 * nothing ever asks for a processor. The unit of work still requires a registry, so
 * this stands in for one.
 *
 * It refuses rather than returning a pass-through. A lookup reaching here means a
 * declared type was added to the spec without an implementation being wired, and
 * silently handing back the raw primitive would skip the verification the type exists
 * to perform.
 */
final readonly class NoProcessors implements ProcessorRegistry
{
    public function has(string $type): bool
    {
        return false;
    }

    public function read(string $type): ReadProcessor
    {
        throw $this->unregistered($type);
    }

    public function write(string $type): WriteProcessor
    {
        throw $this->unregistered($type);
    }

    private function unregistered(string $type): RuntimeException
    {
        return new RuntimeException(sprintf(
            'No processors for declared type "%s". Clog registers none: add them to %s once the spec declares a type.',
            $type,
            self::class,
        ));
    }
}

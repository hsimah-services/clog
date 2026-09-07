<?php

declare(strict_types=1);

namespace Clog\Runtime;

use Psr\Log\AbstractLogger;
use Stringable;

/**
 * A PSR-3 logger over WordPress's error log.
 *
 * The unit of work logs rather than throws for a postCommit trigger that fails —
 * there is nothing left to roll back by then — so a null logger would turn those into
 * silent failures. Nothing in Clog declares a trigger yet; this exists so that when
 * one does, its failures land somewhere by default rather than by remembering to.
 */
final class ErrorLogLogger extends AbstractLogger
{
    /**
     * @param array<array-key, mixed> $context
     */
    public function log(mixed $level, string|Stringable $message, array $context = []): void
    {
        $line = sprintf('[clog] %s: %s', strtoupper((string) $level), $message);

        if ([] !== $context) {
            $line .= ' ' . (json_encode($context, JSON_PARTIAL_OUTPUT_ON_ERROR | JSON_UNESCAPED_SLASHES) ?: '{}');
        }

        error_log($line);
    }
}

<?php

declare(strict_types=1);

namespace Clog\Runtime;

use Eleph\Runtime\Query\ValueDecoder;
use Psr\Container\ContainerInterface;
use ReflectionClass;
use ReflectionNamedType;
use RuntimeException;

/**
 * The container the generated Catalogue resolves its classes through.
 *
 * Elephentity auto-discovers nothing: the Catalogue asks for a hydrator, verifiers,
 * triggers and an input applier per entity by class name, and something has to build
 * them. Clog has no DI container of its own and a WordPress plugin is a poor place to
 * introduce one, so this is the smallest thing that satisfies the contract.
 *
 * Construction is by reflection over the constructor's parameter types, resolved from
 * a small set of shared singletons. That is deliberately narrow — it is autowiring for
 * a closed set of generated classes, not a general-purpose container — and anything it
 * cannot resolve throws by name rather than guessing.
 *
 * Instances are shared. Every generated class here is stateless: hydrators and input
 * appliers hold only a ValueDecoder, and the verifier and trigger bridges hold nothing
 * at all.
 */
final class Container implements ContainerInterface
{
    /** @var array<string, object> */
    private array $instances = [];

    /** @var array<string, object> */
    private readonly array $shared;

    public function __construct()
    {
        $this->shared = [
            ValueDecoder::class => new ValueDecoder(),
        ];
    }

    public function has(string $id): bool
    {
        return isset($this->instances[$id])
            || isset($this->shared[$id])
            || (class_exists($id) && $this->isConstructible($id));
    }

    public function get(string $id): object
    {
        return $this->instances[$id] ??= $this->make($id);
    }

    private function make(string $id): object
    {
        if (isset($this->shared[$id])) {
            return $this->shared[$id];
        }

        if (!class_exists($id)) {
            throw new RuntimeException(sprintf(
                'Cannot build "%s": no such class. If it is generated, run `eleph generate`.',
                $id,
            ));
        }

        $constructor = (new ReflectionClass($id))->getConstructor();

        if (null === $constructor) {
            return new $id();
        }

        $arguments = [];

        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (!$type instanceof ReflectionNamedType || $type->isBuiltin()) {
                throw new RuntimeException(sprintf(
                    'Cannot build "%s": parameter $%s is not a resolvable class type.',
                    $id,
                    $parameter->getName(),
                ));
            }

            $arguments[] = $this->get($type->getName());
        }

        return new $id(...$arguments);
    }

    /**
     * @param class-string $id
     */
    private function isConstructible(string $id): bool
    {
        $reflection = new ReflectionClass($id);

        if (!$reflection->isInstantiable()) {
            return false;
        }

        $constructor = $reflection->getConstructor();

        if (null === $constructor) {
            return true;
        }

        foreach ($constructor->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (!$type instanceof ReflectionNamedType || $type->isBuiltin()) {
                return false;
            }
        }

        return true;
    }
}

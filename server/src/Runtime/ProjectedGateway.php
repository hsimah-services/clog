<?php

declare(strict_types=1);

namespace Clog\Runtime;

use DateTimeImmutable;
use Eleph\Runtime\Catalogue\EntityCatalogue;
use Eleph\Runtime\Gateway\EntityGateway;
use Eleph\Runtime\Gateway\UnitOfWorkFactory;
use Eleph\Runtime\Identity\EntityId;
use Eleph\Runtime\Identity\PendingId;
use Eleph\Runtime\Mutation\Mutation;
use Eleph\Runtime\Query\EntityQuery;
use Eleph\Runtime\UnitOfWork\ValueEncoder;
use Throwable;

/**
 * Supplies what the spec declares but Elephentity 0.0.1 does not carry out.
 *
 * Three gaps, all of which fail quietly rather than loudly:
 *
 *  - **Edges cannot be written.** The runtime has the machinery — `Mutation::edge()`
 *    returns an `EdgeMutation` — but nothing generated reaches it. The mutator gets no
 *    `setItem()`, the input applier ignores edge keys, and the GraphQL mutation carries
 *    no edge arguments. So an Inventory entry could be created but never attached to
 *    the Item it is an instance of. This builds the mutation itself to get at the edge.
 *
 *  - **`required` is not enforced and timestamps are not filled.** `createdAt` is
 *    `required: true` and immutable, and nothing supplies it or objects to its absence.
 *    The empty value reaches MySQL and is stored as 0000-00-00 where the session is not
 *    strict, or rejected outright where it is — so the same code behaves differently
 *    per installation.
 *
 *  - **Nothing writes the wp_posts projection.** `postId` is documented as the post row
 *    the entity projects to, written by the mutator in the same unit of work. No code
 *    does that; the column is NOT NULL with no default and silently lands on 0.
 *
 * A gateway rather than a helper the callers remember to use: the GraphQL layer is
 * handed a gateway and does its own writes, so anything wrapping only Clog's own calls
 * would leave every mutation from the API writing broken rows.
 *
 * Delete it as the framework fills these in.
 */
final readonly class ProjectedGateway implements EntityGateway
{
    /**
     * Entity name to post type slug.
     *
     * Duplicated from `storage.handle` in the spec because nothing exposes it at
     * runtime: the storage manifest carries table names, and the catalogue carries
     * neither handles nor field primitives.
     */
    private const HANDLES = [
        'Item' => 'clog_item',
        'Location' => 'clog_location',
        'Inventory' => 'clog_inventory',
    ];

    public function __construct(
        private EntityGateway $inner,
        private EntityCatalogue $catalogue,
        private UnitOfWorkFactory $units,
    ) {
    }

    public function create(string $entity, array $input): EntityId
    {
        // Raw primitives, not domain objects: the generated input appliers decode from
        // storage shapes, so a DateTimeImmutable here is rejected as "not a string".
        $now = (new DateTimeImmutable())->format(ValueEncoder::DATETIME_FORMAT);

        [$fields, $edges] = $this->split($entity, $input);

        $fields['createdAt'] ??= $now;
        $fields['updatedAt'] ??= $now;

        $postId = $fields['postId'] ??= $this->createPost($entity, $fields);

        try {
            $target = new PendingId($entity);
            $mutation = new Mutation($entity, $target);

            $this->catalogue->apply($entity, $mutation, $fields);
            $this->applyEdges($mutation, $edges);

            $work = $this->units->create();
            $work->register($mutation);

            return $work->commit()->idFor($target);
        } catch (Throwable $failure) {
            // The post row is written first because the column needs its id, so a
            // rejected commit — a duplicate barcode, a failed verifier — would leave it
            // behind with nothing pointing at it. The entity's own row is inside the
            // unit of work's transaction; this one is not.
            if (is_int($postId) && $postId > 0) {
                wp_delete_post($postId, true);
            }

            throw $failure;
        }
    }

    public function update(string $entity, EntityId $id, array $input): void
    {
        [$fields, $edges] = $this->split($entity, $input);

        $fields['updatedAt'] ??= (new DateTimeImmutable())->format(ValueEncoder::DATETIME_FORMAT);

        $this->inner->update($entity, $id, $fields);

        // A second commit, not one. Reaching the edge means building the mutation
        // here, and building an update mutation needs the row's current values so
        // verifiers can compare against them — which Runtime keeps private. Clog
        // declares no verifiers, so the cost of this is atomicity between the fields
        // and the edges rather than a rule going unchecked.
        if ([] !== $edges) {
            $mutation = new Mutation($entity, $id);
            $this->applyEdges($mutation, $edges);

            $work = $this->units->create();
            $work->register($mutation);
            $work->commit();
        }

        if (isset($fields['name']) && is_string($fields['name'])) {
            $postId = $this->postIdOf($entity, $id);

            if ($postId > 0) {
                wp_update_post(['ID' => $postId, 'post_title' => $fields['name']]);
            }
        }
    }

    public function delete(string $entity, EntityId $id): void
    {
        $postId = $this->postIdOf($entity, $id);

        // Read before, delete after: a refused delete — a location with stock in it —
        // must leave its post row alone.
        $this->inner->delete($entity, $id);

        if ($postId > 0) {
            wp_delete_post($postId, true);
        }

        // A cascade happens inside the unit of work, which knows nothing about post
        // rows, so deleting an Item takes its Inventory rows with it and leaves their
        // projections behind. There is no hook to catch that, so the projection is
        // reconciled instead: one indexed query per entity type, on an operation that
        // is rare.
        $this->sweepOrphanedPosts();
    }

    /**
     * Delete post rows nothing projects to any more.
     */
    public function sweepOrphanedPosts(): int
    {
        global $wpdb;

        $referenced = [];

        foreach (array_keys(self::HANDLES) as $entity) {
            foreach ($this->inner->all($entity)->all() as $row) {
                if (method_exists($row, 'getPostId')) {
                    $referenced[(int) $row->getPostId()] = true;
                }
            }
        }

        $deleted = 0;

        $posts = $wpdb->get_col($wpdb->prepare(
            sprintf(
                'SELECT ID FROM %s WHERE post_type IN (%s)',
                $wpdb->posts,
                implode(', ', array_fill(0, count(self::HANDLES), '%s')),
            ),
            ...array_values(self::HANDLES),
        ));

        foreach ($posts as $postId) {
            if (!isset($referenced[(int) $postId])) {
                wp_delete_post((int) $postId, true);
                ++$deleted;
            }
        }

        return $deleted;
    }

    /**
     * Separate edge inputs from field inputs.
     *
     * @param array<string, mixed> $input
     *
     * @return array{array<string, mixed>, array<string, mixed>}
     */
    private function split(string $entity, array $input): array
    {
        $edgeNames = [];

        foreach (array_keys($this->catalogue->edgeTargets()) as $key) {
            [$owner, $edge] = explode('.', $key, 2);

            if ($owner === $entity) {
                $edgeNames[] = $edge;
            }
        }

        $fields = [];
        $edges = [];

        foreach ($input as $name => $value) {
            if (in_array($name, $edgeNames, true)) {
                $edges[$name] = $value;
            } else {
                $fields[$name] = $value;
            }
        }

        return [$fields, $edges];
    }

    /**
     * @param array<string, mixed> $edges
     */
    private function applyEdges(Mutation $mutation, array $edges): void
    {
        foreach ($edges as $name => $value) {
            $targets = null === $value || '' === $value
                ? []
                : array_map(
                    static fn (mixed $one): EntityId => EntityId::of(is_numeric($one) ? (int) $one : (string) $one),
                    is_array($value) ? array_values($value) : [$value],
                );

            $mutation->edge($name)->set($targets);
        }
    }

    private function postIdOf(string $entity, EntityId $id): int
    {
        $existing = $this->inner->find($entity, $id);

        return is_object($existing) && method_exists($existing, 'getPostId')
            ? (int) $existing->getPostId()
            : 0;
    }

    /**
     * The wp_posts row this entity projects to.
     *
     * @param array<string, mixed> $fields
     */
    private function createPost(string $entity, array $fields): int
    {
        $handle = self::HANDLES[$entity] ?? null;

        if (null === $handle) {
            return 0;
        }

        $postId = wp_insert_post([
            'post_type' => $handle,
            'post_title' => isset($fields['name']) && is_string($fields['name']) ? $fields['name'] : $entity,
            'post_status' => 'publish',
        ], true);

        return is_wp_error($postId) ? 0 : $postId;
    }

    public function find(string $entity, EntityId $id): ?object
    {
        return $this->inner->find($entity, $id);
    }

    public function all(string $entity): EntityQuery
    {
        return $this->inner->all($entity);
    }

    public function runQuery(string $entity, string $query, array $args): EntityQuery
    {
        return $this->inner->runQuery($entity, $query, $args);
    }

    public function runAction(string $entity, string $action, EntityId $id, array $args): void
    {
        $this->inner->runAction($entity, $action, $id, $args);
    }
}

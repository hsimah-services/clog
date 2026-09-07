# Elephentity findings — from wiring Clog on v0.0.1

Everything below was hit while mounting the runtime in a real WordPress plugin
(`server/`), not read off the source. Each entry says what was observed, how to
reproduce it, and what was expected. Ordered by how much it blocked.

Environment: Elephentity `v0.0.1` (`52ceb85`), PHP 8.3.31, WordPress 6.9.4,
MySQL 8.0, WPGraphQL 2.22.2.

---

## 1. Edges cannot be written through any generated path

**Severity: blocking.** An inventory system whose entries can never be attached to
an item.

The runtime has the machinery — `Mutation::edge()` returns an `EdgeMutation` with
`add`/`remove`/`set` — but nothing generated reaches it:

- `InventoryMutator` has `setName`, `setDateAdded`, `setPostId`, `setUpdatedAt` and
  no `setItem` / `setLocation`.
- `InventoryInput::apply()` iterates fields only; an `item` key in the input array
  is silently dropped.
- `MutationEntry` for `createClogInventory` carries `createdAt, updatedAt, postId,
  name, dateAdded` — no edge arguments — so the GraphQL API cannot set one either.

Reading works: the read model has `getItem()`, and the GraphQL object type exposes
`item`. Only writing is missing.

**Repro.** Spec an entity with a `one` edge, `eleph generate`, then
`$gateway->create('Inventory', ['name' => 'x', 'item' => 1])`. The row is created
with `item_id` NULL and no error.

**Expected.** Either a setter on the mutator, edge keys honoured by the input
applier, or edge arguments on the generated mutation — any one of the three.

**Worked around** in `server/src/Runtime/ProjectedGateway.php` by building the
`Mutation` directly and calling `$mutation->edge($name)->set([EntityId::of($id)])`.
That works, which suggests the gap is only in codegen.

---

## 2. Inverse edge accessors are not generated

**Severity: blocking for the obvious query.** "What is in this location?"

`Inventory.yml` declares both edges with an inverse:

```yaml
  location:
    to: Location
    cardinality: one
    inverse:
      name: inventoryEntries
      unique: false
```

`eleph validate` accepts it and `eleph check` passes, but the generated `Location`
class has only `getId`, `getCreatedAt`, `getUpdatedAt`, `getPostId`, `getName`.
There is no `getInventoryEntries()`, and nothing in the GraphQL manifest for it
either.

**Expected.** Either the accessor, or `validate` rejecting an `inverse:` block it
does not intend to honour. Silently accepting the declaration and generating
nothing is the worst of the three.

---

## 3. `required: true` is not enforced at runtime

**Severity: high**, and it makes behaviour installation-dependent.

`grep -rn required packages/runtime/src` returns only unrelated hits in
`DependencySorter` and `UnitOfWork`. Nothing verifies that a required field was
supplied, and the catalogue does not expose which fields are required, so nothing
downstream could.

**Repro.** `createdAt` in the shipped `Timestamps` pattern is `required: true`.
Create an entity without it:

```php
$gateway->create('Location', ['name' => 'Pantry']);
```

The insert succeeds and stores `created_at = 0000-00-00 00:00:00`. Reading it back
yields `-0001-11-30`.

**Why it is worse than it looks.** WordPress's default session has no
`STRICT_TRANS_TABLES` (here: `NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,
NO_ENGINE_SUBSTITUTION`). On a strict install the same code raises a SQL error
instead. Identical spec, identical code, different behaviour per installation.

**Expected.** A missing required field on create should produce a `Violation` from
the verification pipeline, with a field path, before any SQL runs.

---

## 4. `datetime` fields are declared `String` but resolved as objects

**Severity: high.** Every GraphQL query selecting any datetime field fails.

`TypeMapper` maps `datetime` to GraphQL `String`. `TypeRegistrar::resolver()` is:

```php
return static fn (object $source): mixed => $source->{$accessor}();
```

and the generated getter returns `DateTimeImmutable`.

**Repro.** `{ clogItems { nodes { createdAt } } }` →

```
String cannot represent value: instance of DateTimeImmutable
```

**Expected.** The resolver should format what the manifest declared as a String —
`ValueEncoder::DATETIME_FORMAT` or ISO 8601. Worked around here with a
`graphql_resolve_field` filter.

---

## 5. Nothing writes the `wp_posts` projection

**Severity: high**, and the docs say otherwise.

`PostTypeRegistrar`'s docblock: *"the custom table is authoritative and the post row
is a projection the mutator writes as part of the same unit of work."* No such code
exists — `grep -rn 'wp_insert_post' packages/` returns nothing.

The `ClogPost` pattern in `examples/clog` declares `postId` with no `nullable`, so
the column is `BIGINT NOT NULL` with no default, and nothing requires it on create.
Every entity created through the gateway lands on `post_id = 0`.

**Expected.** Either the WordPress adaptor creates and maintains the post row as
documented, or the example pattern marks `postId` nullable and the docs stop
claiming it is written.

**Knock-on:** because a cascade happens inside the unit of work, which knows nothing
about post rows, deleting an Item deletes its Inventory rows and leaves their post
rows behind. There is no hook to observe a cascade, so an application maintaining
the projection itself cannot keep it consistent.

---

## 6. Machine-managed timestamps are mandatory API input

**Severity: high.** Exactly backwards from issue 3.

`createdAt` is `required: true, immutable: true` in the shipped `Timestamps`
pattern, so the generated input type is:

```
CreateClogLocationInput.createdAt: String!
```

**Repro.** `mutation { createClogLocation(input: {name: "Cellar"}) { clientMutationId } }` →

```
Field CreateClogLocationInput.createdAt of required type String! was not provided.
```

So every API client must invent a creation timestamp, and `immutable: true` means
it can never be corrected. Taken with issue 3, `required` is enforced in the one
place it should not be and ignored in the place it should.

**Expected.** Something like `default: now` or a `managed: true` marker that keeps a
field out of the input type and fills it at commit.

---

## 7. No way to create or migrate the tables

**Severity: high.** The framework's storage cannot be brought into existence.

`eleph list` shows `check`, `fmt`, `generate`, `validate`. There is no `migrate`,
though `packages/cli/composer.json` describes the package as *"The eleph command:
validate, generate, check, fmt, migrate"*, and `MigrationPlanner`, `MigrationPlan`
and `Refusal` all exist in the WordPress package with no command reaching them.

**Worked around** with `server/src/Runtime/Tables.php`, which walks
`StorageManifest::withPrefix()->tables` and runs `DdlCompiler::createTable()`.
Creation only — comparing a live table to the manifest is what the planner is for.

**Expected.** `eleph migrate` exposing the planner, or a documented runtime entry
point for schema installation.

---

## 8. `PostTypeRegistrar` needs the build-time schema

**Severity: medium**, but it forced hand-written post types to stay.

`PostTypeRegistrar::__construct(private Schema $schema)` takes
`Eleph\Schema\Ir\Schema` — the compiled IR from `elephentity/schema`, which
`GETTING_STARTED.md` says is a dev dependency that "runs at build time and never
ships". Registering post types at runtime therefore means shipping the build-time
package and compiling YAML on every request.

Storage and GraphQL both get generated manifests. Post types do not.

**Expected.** A generated post-type manifest, the same shape as
`storage-manifest.php` and `graphql-manifest.php`.

---

## 9. `unique: true` surfaces as a raw SQL exception

**Severity: medium.**

A duplicate value on a unique field produces:

```
RuntimeException: Duplicate entry '013000006057' for key
'wp_clog_item.wp_clog_item_barcode_uniq' (running: INSERT INTO wp_clog_item)
```

— including the SQL, and on the HTML path a `wpdberror` div printed straight into
the response.

Compare `onDelete: restrict`, which is excellent:

```
Cannot delete Location#1: 1 Inventory still depends on it through "location".
The edge says restrict.
```

**Expected.** Uniqueness checked in the verification pipeline and returned as a
`Violation` with the field path, the way deletion rules already work.

---

## 10. No `ProcessorRegistry` implementation ships

**Severity: low**, but every project hits it.

Only the interface exists in `src`; the sole implementation is
`packages/runtime/tests/UnitOfWork/StubProcessors.php`. A project with no declared
types still has to write one to construct `UnitOfWorkFactory`.

**Expected.** A `NullProcessorRegistry` in the runtime package, or a
container-backed default.

---

## 11. Storage handles and field primitives are not exposed at runtime

**Severity: low**, but it forces duplication of the spec.

`EntityCatalogue` exposes `fieldNames()` and `fieldTypes()` — the latter only
*declared* types, empty for a project with none. Nothing exposes a field's
primitive, and nothing exposes `storage.handle`.

Consequences here: a `HANDLES` map hand-copied from the spec into
`ProjectedGateway`, and a CLI that cannot coerce `--barcode=013000006057` correctly
because it cannot ask whether `barcode` is a string or an int.

**Expected.** `handle(string $entity)` and a field-primitive lookup on the
catalogue.

---

## 12. `examples/clog` shows no wiring

**Severity: low, documentation.**

The example is `spec/` and `generated/` only — no `src/`, no container, no
bootstrap. It demonstrates that codegen runs, not how to run the result.
`GETTING_STARTED.md` ends at `eleph generate`, and `bespoke-files.md` covers wiring
in three sentences ("Your container supplies the handlers").

Assembling a working runtime meant reading `Runtime`, `UnitOfWorkFactory`,
`BootCheck`, `WordPress`, `Plugin` and the generated `Catalogue` to work out the
order. A ~60-line reference bootstrap in the example would remove that entirely.

---

## 13. Stale claim in the shipped skill

`skills/eleph/SKILL.md`, under "What Elephentity cannot express":

> **GraphQL root queries.** The manifest registers types and mutations but no entry
> points yet.

Not true at v0.0.1. `graphql-manifest.php` emits a `roots:` block, `TypeRegistrar`
registers them, and `clogItem`, `clogItems`, `clogLocation`, `clogLocations`,
`clogInventory` and `clogInventoryEntries` are all present in the schema and
resolve. The `Manifest` constructor has taken `roots` and `queries` since the tag.

---

## What worked well, for balance

- The four gates are fast and the errors are specific. `validate` catching a
  semantic problem before generation is the right split.
- `onDelete` handling is the best part of the runtime: derived from the spec at
  build time, and the refusal message names the entity, the count and the edge.
- The storage manifest is genuinely good — indexes derived from `unique`/`indexed`,
  edge placement inferred rather than declared, and prefixing left to the install.
- Generated code is readable, and the digest header made it obvious what was
  machine-owned without having to remember.

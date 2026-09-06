# Clog (Cave Log)

Clog is a React‑powered inventory management frontend that lives inside a WordPress plugin. The repo contains both the client application (`client/`) and the plugin/theme code under `server/`.

---

## Requirements

A container runtime is the only hard requirement — WordPress, PHP, MySQL, Redis and
Node all run inside containers, so nothing needs to be installed on the host.

- **Podman** (rootless, no daemon) plus a compose CLI — on Fedora:
  ```bash
  sudo dnf install docker-compose
  systemctl --user enable --now podman.socket
  ```
  *or* **Docker Engine / Docker Desktop** with Compose v2. `scripts/dev.sh` detects
  whichever is present and wires up the socket for you.
- A `.env` file at the project root. `scripts/dev.sh` creates one from
  `.env.example` on first run.
- **Node.js 18+** is optional, and only needed if you want to run the client build or
  the Playwright e2e suite directly on the host rather than in the `client` container.

---

## Repository layout

```
/                       # project root
  client/               # React/Vite SPA (frontend)
  server/               # WordPress plugin (`plugins/clog`) and themes
  .docker/wordpress/    # WordPress image: WP-CLI, Redis ext, first-run install script
  docker-compose.yml    # brings up WordPress, MySQL, Redis, Mailpit, PhpMyAdmin, and the client dev server
  scripts/dev.sh        # single entry point for the dev stack (up/down/logs/reset/wp)
  .env.example          # committed template for .env
  .env                  # local environment (ignored by git)
  CLAUDE.md             # coding conventions / developer handbook
  README.md             # this file
```

---

## Development setup

1. **Start everything**

   ```bash
   scripts/dev.sh up
   ```

   That is the whole setup. The script picks a container runtime, starts the podman
   socket if that is what you have, creates `.env` from `.env.example` if it is
   missing, and brings the stack up. On first run WordPress installs itself,
   activates the `clog` plugin from the bind-mounted `server/` directory, and
   installs WPGraphQL, WPGraphQL-JWT and WP-Redis (see
   `.docker/wordpress/entrypoint.sh`).

   Other subcommands:

   | Command | Effect |
   | --- | --- |
   | `scripts/dev.sh up` | Build and start the stack |
   | `scripts/dev.sh down` | Stop the stack, keeping data |
   | `scripts/dev.sh logs wordpress` | Follow a service's logs |
   | `scripts/dev.sh status` | List running services |
   | `scripts/dev.sh wp plugin list` | Run WP-CLI in the WordPress container |
   | `scripts/dev.sh shell` | Bash shell in the WordPress container |
   | `scripts/dev.sh reset` | **Destructive** — drop the DB and WP install, then reinstall clean |

   In VS Code the stack starts automatically on folder open via
   `.vscode/tasks.json`; the same tasks are available from the command palette. In
   Emacs, `M-x compile RET scripts/dev.sh up` does the same thing.

   The container set includes:
   - MySQL database (`db`)
   - Redis cache (`redis`)
   - WordPress site with the `clog` plugin mounted (`wordpress`)
   - PhpMyAdmin (`phpmyadmin`)
   - Mailpit SMTP/HTTP viewer (`mailpit`)
   - Vite dev server for the client (`client`)

2. **The frontend**

   The `client` service already runs Vite on http://localhost:3000 with `client/src`
   and `client/public` bind-mounted, so hot reload works against the files in your
   editor with no host-side Node install.

   If you would rather run it on the host (for example to use an IDE's Node
   integration), stop that service and run it yourself:

   ```bash
   scripts/dev.sh down client
   cd client && npm install && npm run dev
   ```

   Either way the client talks to `http://localhost:8080/graphql` (configurable via
   `VITE_GRAPHQL_URL`).

3. **Access the app**

   - **Frontend:** http://localhost:3000/clog
   - **WordPress admin:** http://localhost:8080/wp-admin (use credentials from `.env`)

4. **Stopping/tearing down**

   ```bash
   scripts/dev.sh down     # stop, keep the database
   scripts/dev.sh reset    # stop and destroy the database and WP install
   ```

---

## Running tests

End‑to‑end tests live under `client/e2e` and use Playwright.

Before running tests ensure the `.env` file includes:

```dotenv
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=secret
VITE_GRAPHQL_URL=http://localhost:8080/graphql
```

Execute from the client directory:

```bash
npm run test:e2e          # headless
npm run test:e2e:headed   # with browser
npm run test:e2e:ui       # open Playwright UI
```

CI uses a dedicated compose file (`.github/workflows/e2e-tests/docker-compose.yml`) and `.env.ci`.

---

## Building for production

```bash
cd client
npm run build            # outputs static files to client/dist
``` 

The build artifacts are mounted into the WordPress plugin via the `docker-compose.yml` volume, so the plugin can be packaged or deployed as-is.

---

## Environment variables

`.env.example` is the authoritative list and is committed; `.env` is gitignored.
`scripts/dev.sh` copies the template on first run, so the defaults work as-is for
local development. Every value in it is a throwaway development credential —
`WP_ADMIN_USER` / `WP_ADMIN_PASSWORD` are the wp-admin login and are also what the
Playwright suite authenticates with.

Additional environment variables may be defined in `.env.ci` or production copies; never commit secrets.

---

## Notes for Fedora / SELinux hosts

The bind mounts in `docker-compose.yml` carry `:z` labels so SELinux lets the
container read `server/` and `client/`. Under rootless podman your files appear as
`root`-owned inside the container, which is fine — WordPress only ever reads the
plugin directory. If the plugin fails to activate, check the labels with
`ls -Z server` and confirm they are `container_file_t`.

---

## Deployment

Releases are built and published via GitHub Actions on the `space-needle` self‑hosted runner. Tags prefixed with `deploy@pupyrus` trigger the workflow which builds the plugin and deploys it to the `pupyrus` container. See `.github/workflows/deploy.yml` for details.

---

## Further reading

- [`CLAUDE.md`](CLAUDE.md) — internal coding rules, conventions and patterns
- `client/e2e/*` — Playwright tests and setup scripts

This README replaces the generic Vite template with instructions tailored to Clog's codebase and development workflow.


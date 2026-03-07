# Clog (Cave Log)

Clog is a React‑powered inventory management frontend that lives inside a WordPress plugin. The repo contains both the client application (`client/`) and the plugin/theme code under `server/`.

---

## Requirements

- **Docker & Docker Compose v2** (Docker Desktop on macOS/Windows or engine on Linux)
- **Node.js 18+ and npm/yarn** for the client build and tests
- A `.env` file at the project root (see `.env.example` for required variables)

---

## Repository layout

```
/                       # project root
  client/               # React/Vite SPA (frontend)
  server/               # WordPress plugin (`plugins/clog`) and themes
  docker-compose.yml    # brings up WordPress, MySQL, Redis, Mailpit, PhpMyAdmin, and the client dev server
  .env                  # local environment (ignored by git)
  CLAUDE.md             # coding conventions / developer handbook
  README.md             # this file
```

---

## Development setup

1. **Start all services**

   ```bash
   docker compose up --build -d
   ```

   The container set includes:
   - MySQL database (`db`)
   - Redis cache (`redis`)
   - WordPress site with the `clog` plugin mounted (`wordpress`)
   - PhpMyAdmin (`phpmyadmin`)
   - Mailpit SMTP/HTTP viewer (`mailpit`)
   - Vite dev server for the client (`client`)

2. **Install and run the frontend**

   ```bash
   cd client
   npm install         # or yarn
   npm run dev         # starts Vite on http://localhost:3000
   ```

   The client will proxy requests to `http://localhost:8080/graphql` (configurable via `VITE_GRAPHQL_URL`).

3. **Access the app**

   - **Frontend:** http://localhost:3000
   - **WordPress admin:** http://localhost:8080/wp-admin (use credentials from `.env`)

4. **Stopping/tearing down**

   ```bash
   docker compose down
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

The `.env` file should contain at least:

```dotenv
MYSQL_ROOT_PASSWORD=...
WORDPRESS_DB_USER=...
WORDPRESS_DB_PASSWORD=...
WORDPRESS_DB_NAME=...
WORDPRESS_DB_HOST=db
WORDPRESS_TABLE_PREFIX=wp_
REDIS_HOST=redis
REDIS_PORT=6379
GRAPHQL_JWT_AUTH_SECRET_KEY=some-secret
VITE_GRAPHQL_URL=http://localhost:8080/graphql
WP_ADMIN_USER=admin          # for e2e tests
WP_ADMIN_PASSWORD=secret     # for e2e tests
```

Additional environment variables may be defined in `.env.ci` or production copies; never commit secrets.

---

## Deployment

Releases are built and published via GitHub Actions on the `space-needle` self‑hosted runner. Tags prefixed with `deploy@pupyrus` trigger the workflow which builds the plugin and deploys it to the `pupyrus` container. See `.github/workflows/deploy.yml` for details.

---

## Further reading

- [`CLAUDE.md`](CLAUDE.md) — internal coding rules, conventions and patterns
- `client/e2e/*` — Playwright tests and setup scripts

This README replaces the generic Vite template with instructions tailored to Clog's codebase and development workflow.


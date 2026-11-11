<p align="center">
  <img src="assets/icon.svg" width="96" height="96" alt="OpenTV logo" />
</p>

<h1 align="center">OpenTV</h1>

<p align="center">
  A self-hostable hub to discover, track and stream movies and TV shows.<br />
  One server with Docker Compose, plus native apps for Windows, macOS, Linux and Android.
</p>

---

## Features

- **Polished, responsive UI.** Cinematic hero carousel, poster rows, genre browsing with infinite scroll, instant search, and rich detail pages with cast, trailers, seasons and recommendations. It works from a 400px phone up to an ultrawide monitor.
- **Watch without an account.** Anyone can browse and play. Signing in only adds personal features.
- **Accounts with a username and password only.** No email address and no third-party sign-in.
- **Personal library.** Continue watching with progress bars, favorites, a full watch history, and resume buttons on every title.
- **Stats.** Total watch time, movies, series and episodes watched, a day streak, 30-day activity, top genres and most watched titles.
- **Multi-server player.** About 40 configurable embed providers, a server picker that remembers your choice, a pop-up shield, episode navigation, and a sidebar episode list.
- **Cross-platform.** The same React app runs in the browser (served by the API server) and inside Tauri on desktop and Android.
- **Self-hosting friendly.** One container, SQLite storage in a single volume, a read-only root filesystem, a health check, and a JWT secret that is generated for you.

## Quick start (Docker Compose)

1. Get a free TMDB API key (either the "API Key" or the "API Read Access Token" works) at <https://www.themoviedb.org/settings/api>.
2. Clone this repository and create your environment file:

   ```bash
   cp .env.example .env
   ```

3. Put your key in `.env`:

   ```dotenv
   TMDB_API_KEY=your-key-here
   ```

4. Start it:

   ```bash
   docker compose up -d
   ```

5. Open <http://localhost:8080>.

Data (users, favorites, history and the generated JWT secret) lives in the `opentv-data` volume. To update, run `git pull && docker compose up -d --build`.

### Using the prebuilt image

Every release publishes a multi-arch image (`linux/amd64`, `linux/arm64`) to the GitHub Container Registry. Point Compose at it by setting `OPENTV_IMAGE` in `.env`:

```dotenv
OPENTV_IMAGE=ghcr.io/<owner>/opentv:latest
```

Then run `docker compose pull && docker compose up -d`.

### Running behind a reverse proxy (recommended)

Put OpenTV behind Caddy, Traefik or nginx with HTTPS, then set:

```dotenv
TRUST_PROXY=true
COOKIE_SECURE=auto
```

With `TRUST_PROXY=true` the server trusts `X-Forwarded-*` headers. Session cookies are then marked `Secure` automatically when the request reached the proxy over HTTPS. Only enable it when OpenTV is not reachable directly. A minimal Caddyfile:

```caddyfile
tv.example.com {
  reverse_proxy localhost:8080
}
```

## Configuration

All settings are environment variables. The defaults suit a private home server.

| Variable             | Default                      | Description                                                                                   |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `TMDB_API_KEY`       |                              | TMDB v3 API key or v4 read access token. Required for browsing and search.                    |
| `OPENTV_PORT`        | `8080`                       | Host port published by Docker Compose.                                                        |
| `ALLOW_REGISTRATION` | `true`                       | Set to `false` to stop new sign-ups after creating your accounts.                             |
| `SESSION_DAYS`       | `30`                         | Lifetime of a sign-in session.                                                                |
| `COOKIE_SECURE`      | `auto`                       | `auto` sets `Secure` on cookies for HTTPS requests. Use `true` or `false` to force it.        |
| `TRUST_PROXY`        | `false`                      | Trust `X-Forwarded-*` headers from a reverse proxy.                                           |
| `JWT_SECRET`         | generated                    | At least 32 characters. If empty, a random secret is generated and stored in the data volume. |
| `CORS_ORIGINS`       |                              | Comma-separated list of extra browser origins allowed to call the API with credentials.       |
| `LOG_LEVEL`          | `info`                       | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.                               |
| `DATA_DIR`           | `/data`                      | Where the SQLite database and generated secret are stored.                                    |
| `PROVIDERS_FILE`     | `/app/config/providers.json` | Streaming provider definitions (see below).                                                   |

### Streaming providers

The player embeds third-party players by TMDB ID. Providers are defined in [`config/providers.json`](config/providers.json). Compose mounts that folder read-only, so you can add, remove, reorder or fix providers without rebuilding. Restart the container after editing.

```json
{
  "id": "vidlink",
  "name": "VidLink",
  "recommended": true,
  "movie": "https://vidlink.pro/movie/{id}",
  "tv": "https://vidlink.pro/tv/{id}/{season}/{episode}"
}
```

- `{id}` is the TMDB ID, and `{season}` and `{episode}` are numbers.
- URLs must use `https`. The server validates the file at startup and adds every provider origin to the page's Content Security Policy automatically.
- `recommended` providers get a star and are selected by default. `language` shows a hint such as "Italian".
- Embed domains change often. If a server stops working, update its URL template or remove it.

## Desktop and mobile apps

Download the installers from the GitHub Releases page:

| Platform | Files                                    |
| -------- | ---------------------------------------- |
| Windows  | `.msi`, `.exe` (NSIS)                    |
| macOS    | `.dmg` for Apple Silicon and Intel       |
| Linux    | `.AppImage`, `.deb`, `.rpm`              |
| Android  | `.apk` (sideload), `.aab` (Play Console) |

On first launch, the app asks for your server address, such as `https://tv.example.com` or `192.168.1.20:8080`. You can change it later from the account menu.

The apps send API requests through Tauri's Rust HTTP client. Its cookie jar keeps the same http-only JWT cookie the browser uses, and saves it to the app's data directory. Sessions therefore survive restarts without exposing the token to JavaScript, and the same server works for the web and the apps without CORS configuration.

## Development

Prerequisites: Node.js 22+, and for the native apps Rust (stable) plus the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` starts the API on <http://localhost:8080> (with file watching) and the Vite dev server on <http://localhost:5173>, which proxies `/api` to the API.

| Command                     | What it does                                      |
| --------------------------- | ------------------------------------------------- |
| `npm run dev`               | API and web app with hot reload                   |
| `npm run build`             | Production build of the web app and server        |
| `npm start`                 | Run the built server (serves the web app as well) |
| `npm test`                  | Server and web unit tests (Vitest)                |
| `npm run lint`              | ESLint for the whole monorepo                     |
| `npm run typecheck`         | TypeScript checks for every workspace             |
| `npm run format`            | Prettier                                          |
| `npm run tauri dev`         | Desktop app against the Vite dev server           |
| `npm run tauri build`       | Desktop installers for the current OS             |
| `npm run tauri android dev` | Android app (run `tauri android init` once first) |

### Project layout

```text
apps/
  server/        Fastify API: auth, library, stats, TMDB proxy, static hosting
    src/lib/     Domain services (auth, library, tmdb, providers)
    src/routes/  HTTP routes with zod validation
    test/        Vitest integration tests using fastify.inject
  web/           React 19 + Vite + Tailwind CSS 4 single-page app
    src/pages/   Route components
    src/hooks/   Data and behaviour hooks (TanStack Query)
    src/lib/     API client, TMDB helpers, formatting, platform detection
config/          providers.json
src-tauri/       Tauri 2 shell for desktop and Android
.github/         CI and release workflows
```

### Architecture

- **Server.** Fastify 5 with SQLite (`better-sqlite3`, WAL mode, versioned migrations). Passwords are hashed with Argon2id. Sessions are HS256 JWTs in `HttpOnly`, `SameSite=Lax` cookies, and changing your password or choosing "sign out everywhere" revokes all sessions through a per-user token version.
- **TMDB proxy.** The browser never sees your TMDB key. Requests go through `/api/tmdb/*`, which only allows a fixed set of endpoints and query parameters, forces `include_adult=false`, deduplicates concurrent requests and caches responses in memory.
- **Hardening.** Helmet security headers with a strict CSP, rate-limited auth endpoints, and a required custom header on state-changing requests as CSRF defence. Request bodies are capped at 64 KB and all input is validated with zod. The container runs as a non-root user on a read-only filesystem with all capabilities dropped.
- **Watch tracking.** While a signed-in user is on the player, the client sends a heartbeat every 30 seconds of visible time. If a provider posts playback progress through `postMessage`, that exact position is stored. Otherwise progress is estimated from the runtime. Titles count as finished at 90%.

### HTTP API

| Method   | Path                                         | Auth | Description                                       |
| -------- | -------------------------------------------- | ---- | ------------------------------------------------- |
| `GET`    | `/api/health`                                |      | Liveness check                                    |
| `GET`    | `/api/server-info`                           |      | Version, TMDB and registration status             |
| `GET`    | `/api/providers`                             |      | Configured streaming providers                    |
| `GET`    | `/api/tmdb/*`                                |      | Allowlisted TMDB proxy                            |
| `POST`   | `/api/auth/register`, `/api/auth/login`      |      | `{ username, password }`, sets the session cookie |
| `POST`   | `/api/auth/logout`, `/api/auth/logout-all`   |      | End this session or all sessions                  |
| `GET`    | `/api/auth/me`                               |      | Current user or `null`                            |
| `POST`   | `/api/auth/password`                         | yes  | Change password                                   |
| `DELETE` | `/api/auth/me`                               | yes  | Delete account and all data                       |
| `GET`    | `/api/library/favorites`                     | yes  | List favorites                                    |
| `PUT`    | `/api/library/favorites/:type/:id`           | yes  | Add a favorite                                    |
| `DELETE` | `/api/library/favorites/:type/:id`           | yes  | Remove a favorite                                 |
| `GET`    | `/api/library/continue`                      | yes  | Continue watching                                 |
| `GET`    | `/api/library/history`                       | yes  | Watch history (`limit`, `offset`)                 |
| `POST`   | `/api/library/history/heartbeat`             | yes  | Record playback                                   |
| `DELETE` | `/api/library/history`, `/history/:type/:id` | yes  | Clear all history or one title                    |
| `GET`    | `/api/library/stats`                         | yes  | Viewing statistics                                |

Every non-GET request must send the `X-OpenTV-Client` header.

## CI and releases

- **`ci.yml`** runs on every push and pull request. It checks formatting, linting, types, tests and the production build, audits production dependencies, builds and smoke-tests the Docker image, and runs `cargo fmt` and `clippy` on the Tauri crate.
- **`release.yml`** runs manually (Actions, then Release, then "Run workflow") or when you push a `v*` tag. It builds:
  - desktop bundles for Windows, macOS (Apple Silicon and Intel) and Linux with `tauri-action`, attached to a GitHub release named after the version in `src-tauri/tauri.conf.json`;
  - a signed Android APK and AAB, attached to the same release;
  - a multi-arch Docker image pushed to `ghcr.io/<owner>/opentv`.

### Releases

1. Bump the version in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`.
2. Commit, then push a tag such as `v1.1.0`, or run the Release workflow manually.

To keep the same Android signing key across releases, add these repository secrets. Without them, each release is signed with a throwaway key, so users must uninstall before updating.

| Secret                      | Value                     |
| --------------------------- | ------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | `base64 -w0 release.jks`  |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore and key password |
| `ANDROID_KEY_ALIAS`         | Key alias in the keystore |

## Disclaimer

OpenTV does not host, store or distribute any media. It shows metadata from TMDB and embeds players from third-party websites that the server administrator configures. You are responsible for making sure your use complies with the laws of your country and with the terms of the services you configure. This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

[MIT](LICENSE)

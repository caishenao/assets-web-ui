1. [x] Record the base-template scope -> Verify: this checklist exists and matches the requested work.
2. [x] Remove non-essential apps/docs/demo routes -> Verify: workspace only exposes the base Ant Design Vue app.
3. [x] Add configurable request encryption -> Verify: `encrypt: true` is typed and wired into the request client.
4. [x] Add Casdoor auth integration -> Verify: login, callback, token storage, user mapping, and route guard work together.
5. [x] Update environment/dependency/docs metadata -> Verify: README and env examples document Casdoor and request-encryption switches.
6. [x] Run install and verification commands -> Verify: `pnpm install`, typecheck, production build, and browser smoke test were run.

## Review

Implemented a slim Ant Design Vue base app with `/home`, login, Casdoor callback, fallback routing, Casdoor auth guard, configurable request encryption, cleaned env/build metadata, and removed demo/docs/mock applications. Verification passed with `pnpm -F @vben/web-antd run typecheck`, `pnpm -F @vben/web-antd run build`, and a browser smoke test at `http://localhost:5666/auth/login`. The local Casdoor server was not running, so the OAuth callback could not be completed end-to-end; the login button generated the expected authorize URL for `localhost:8000`.

# Basic Web UI

Vue 3 + Vite + Vben based frontend base template. The workspace keeps one app:

- `apps/web-antd`: Ant Design Vue web frontend
- `packages/*`: shared Vben runtime packages used by the app
- `internal/*` and `scripts/*`: local build, lint, and Vite tooling

## Start

```bash
pnpm install
pnpm dev
```

The default dev URL is `http://localhost:5666`.

## Casdoor

Casdoor is the default auth mode. Configure these values in `apps/web-antd/.env.development` or the matching production env file:

```env
VITE_GLOB_AUTH_MODE=casdoor
VITE_GLOB_CASDOOR_SERVER_URL=http://localhost:8000
VITE_GLOB_CASDOOR_CLIENT_ID=basic-web-ui
VITE_GLOB_CASDOOR_APP_NAME=basic-web-ui
VITE_GLOB_CASDOOR_ORG_NAME=built-in
VITE_GLOB_CASDOOR_REDIRECT_PATH=/auth/casdoor-callback
VITE_GLOB_CASDOOR_SCOPE=openid profile email
```

In Casdoor, add this redirect URL for local development:

```text
http://localhost:5666/auth/casdoor-callback
```

After login, the frontend maps Casdoor `roles`, `groups`, `permissions`, and `isAdmin` from the access token into Vben access codes. Later project routes can use route `meta.authority` with those codes.

## Request Encryption

Enable encryption globally and opt in per request:

```env
VITE_GLOB_ENABLE_ENCRYPT=true
VITE_GLOB_ENCRYPT_HEADER_KEY=encrypt-key
VITE_GLOB_RSA_PUBLIC_KEY=your-rsa-public-key
VITE_GLOB_RSA_PRIVATE_KEY=your-rsa-private-key
```

```ts
requestClient.post('/auth/login', data, { encrypt: true });
```

The request body is encrypted with AES, and the one-time AES key is Base64 encoded and RSA encrypted into the `encrypt-key` header. Keep the switch off for APIs that do not implement the matching backend decrypt filter.

`VITE_GLOB_RSA_PRIVATE_KEY` is only needed when the backend also returns encrypted responses with the same header. Do not treat frontend env values as server-side secrets.

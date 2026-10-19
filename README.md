# Replica Studio / Delux

This project was built with [Lovable](https://lovable.dev) and is synchronized with the [Lovable editor](https://lovable.dev/projects/9b051ef4-d4a6-440a-b862-6a0330d085a6).

## Development

This repository uses Bun and the `bun.lock` lockfile.

```sh
git clone https://github.com/kjnknonhjgctc-netizen/replica-studio.git
cd replica-studio
bun install --frozen-lockfile
bun run dev
```

## Quality checks

```sh
bun run test
bun run build
bun run lint
```

The GitHub Actions workflow also runs the test suite, TypeScript diagnostics, a production build, and linting for the new date utility and its tests. The repository has existing lint debt in legacy screens and services; the targeted workflow avoids presenting those legacy formatting/type warnings as new regressions.

## Important: prototype authentication and storage

The current Delux data layer is a browser-side demonstration implementation: application records and password values are stored in `localStorage`, and the session token is based on a profile ID. This is **not suitable for production accounts or sensitive personal data**. Before launching to real users, replace it with a trusted server-side backend, password hashing, opaque expiring sessions, server-side authorization, and a real password-reset flow. Keep `LOVABLE_API_KEY` in server-side deployment secrets; never put it in client code.

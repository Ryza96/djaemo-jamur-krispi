# Known Issues

## Turbopack Refresh Loop

| Field | Value |
|-------|-------|
| **Status** | Known External Issue |
| **Affected Version** | Next.js 16.2.9 |

### Symptoms

- Infinite page refresh loop (~2-4 reloads per second)
- WebSocket reconnect failures
- HMR (Hot Module Replacement) feedback loop

### Root Cause

Bug pada Turbopack (bukan source code project). HMR feedback loop yang dipicu oleh Cache Components regression yang diintroduksi di Next.js 16.2.1-canary.46.

### Workaround

```bash
npm run dev  # secara otomatis menggunakan --webpack
```

Atau secara eksplisit:

```bash
next dev --webpack
```

### Official Reference

- [GitHub Issue #94634](https://github.com/vercel/next.js/issues/94634) — infinite refresh loop and crashes in next.js 16.2.7
- [PR #94128](https://github.com/vercel/next.js/pull/94128) — fix yang mendarat di 16.3.0-canary.30
- [Investigasi lengkap](TURBOPACK_INVESTIGATION.md)

### Resolution

Gunakan **Webpack** selama development. Setelah Next.js 16.3.0 stable dirilis, Turbopack dapat dievaluasi kembali dengan:

```bash
npm install next@latest
npm run dev  # Turbopack (default)
```

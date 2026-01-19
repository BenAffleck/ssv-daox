# DAOx Tech Stack Recommendation

## Philosophy

**Simple. Typed. Proven.**

Minimize moving parts while maximizing developer experience and production reliability.

---

## Recommended Stack

### Frontend

| Layer          | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Framework      | **Next.js 14+**     | SSR, API routes, file-based routing    |
| Language       | **TypeScript**      | Type safety across entire stack        |
| Styling        | **Tailwind CSS**    | Utility-first, zero runtime cost       |

### Infrastructure

| Layer          | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Hosting        | **Vercel**          | Zero-config Next.js deployment         |

### Testing

| Type           | Choice              | Rationale                              |
|----------------|---------------------|----------------------------------------|
| Unit           | **Vitest**          | Fast, ESM-native, Jest-compatible      |
| Component      | **Testing Library** | User-centric assertions                |
| E2E            | **Playwright**      | Cross-browser, reliable                |

---

## Architecture Fit

```
┌────────────────────────────────────────────────────────┐
│                    Vercel Edge                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│   Next.js App                                          │
│   ├── /app (pages + layouts)                           │
│   └── /lib (shared utilities)                          │
│                                                        │
├──────────────┬─────────────────┬───────────────────────┤
└──────────────┴─────────────────┴───────────────────────┘
```
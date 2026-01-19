# DAOx - SSV Network DAO Hub

A modular hub for SSV Network DAO members, providing governance tools and insights through extensible modules.

## Features

- **Modular Architecture**: Plugin-based system for easy feature expansion
- **DAO Delegates Module**: Leaderboard and governance insights (coming soon)
- **Responsive Design**: Mobile-first, accessible UI built with Tailwind CSS
- **Type-Safe**: Full TypeScript coverage with strict mode
- **Well-Tested**: Comprehensive unit and E2E test coverage

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Testing**: Vitest (unit), Testing Library (component), Playwright (E2E)
- **Hosting**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ssv-daox

# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run unit tests with Vitest
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
ssv-daox/
├── app/                    # Next.js app directory
│   ├── [slug]/            # Dynamic module routes
│   ├── layout.tsx         # Root layout with header
│   ├── page.tsx           # Landing page
│   ├── loading.tsx        # Loading states
│   └── error.tsx          # Error boundaries
├── components/            # React components
│   ├── Header.tsx         # Application header
│   └── ModuleCard.tsx     # Module card component
├── lib/                   # Shared utilities
│   ├── types.ts          # TypeScript type definitions
│   └── data/
│       └── modules.ts     # Module data and helpers
├── __tests__/            # Unit tests
└── e2e/                  # End-to-end tests
```

## Module System

### Module Entity

Each module has the following structure:

```typescript
{
  id: string;           // Unique identifier
  slug: string;         // URL-friendly identifier
  name: string;         // Display name
  status: 'active' | 'coming_soon';
  sortOrder: number;    // Display order
}
```

### Adding a New Module

1. **Add module to data source** (`lib/data/modules.ts`):

```typescript
{
  id: 'my-module',
  slug: 'my-module',
  name: 'My Module',
  status: ModuleStatus.ACTIVE,
  sortOrder: 3,
}
```

2. **Create module page** (`app/my-module/page.tsx`):

```typescript
export default function MyModulePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold">My Module</h1>
      {/* Module content */}
    </div>
  );
}
```

3. **Add tests** for your module functionality

## Testing

### Running Tests

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm test -- --watch

# E2E tests
npm run test:e2e

# E2E tests in headed mode
npm run test:e2e -- --headed
```

### Test Coverage

- **Unit Tests**: 19 tests covering types, data, and components
- **E2E Tests**: 13 tests covering user flows and navigation

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

This project uses strict TypeScript and requires all code to pass:

- TypeScript compilation (`npm run type-check`)
- Unit tests (`npm test`)
- E2E tests (`npm run test:e2e`)
- Production build (`npm run build`)

## License

Apache 2.0

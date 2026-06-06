# AGENTS.md - Development Guidelines

## Build & Development Commands
- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm start` - Start production server
- **Note**: No test framework configured - check with user before adding tests

## Code Style Guidelines

### Imports & Organization
- Use `"use client"` directive for client components
- Group imports: React/Next.js, external libraries, internal modules
- Use `@/` prefix for all internal imports
- Follow conventional commit format with English language only

### TypeScript & Naming
- Strict TypeScript - avoid `any` types
- PascalCase for components and interfaces
- camelCase for variables and functions
- Use generated database types from `src/types/database.types.ts`
- Hooks use `Use` prefix (e.g., `UseGetUserGroupsQuery.ts`)

### Component Patterns
- Export function components with explicit function declarations
- Use HeroUI components for consistent design
- Organize by feature in `src/components/{domain}/`
- Keep components small and focused

### State Management
- Jotai for global client state (in `src/lib/store/`)
- React Query for server state and data fetching
- Custom hooks in `src/hooks/` wrap React Query
- Query definitions in `src/queries/` organized by domain

### Error Handling & Security
- Always handle Supabase query errors explicitly
- Use Row Level Security (RLS) policies - never disable RLS
- Validate environment variables on app startup
- Use TypedSupabaseClient for all database operations

## Architecture Notes
- Next.js 15 with App Router and React 19
- Supabase for backend (auth, database, real-time)
- Progressive Web App with push notifications
- Type-safe throughout with generated database types
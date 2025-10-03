# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI compliance assessment platform for the EU AI Act (Regulation 2024/1689). The system helps organizations evaluate, document, and maintain compliance with European Union AI regulations through risk assessment, regulatory database access, compliance monitoring, document generation, and regulatory update tracking.

## Development Commands

### Core Commands
- **Development**: `npm run dev` - Starts both frontend (Vite) and backend (Express) in development mode
- **Build**: `npm run build` - Builds frontend assets and bundles backend server for production
- **Start Production**: `npm start` - Runs the production build
- **Type Check**: `npm run check` - Runs TypeScript compiler without emitting files
- **Database Push**: `npm run db:push` - Pushes schema changes to PostgreSQL using Drizzle Kit

### Environment Setup
Requires `DATABASE_URL` and `SESSION_SECRET` environment variables. The server initializes database tables automatically on startup via `init-db.ts`.

## Architecture

### Monorepo Structure
- **`client/`**: React frontend with TypeScript
- **`server/`**: Express backend with TypeScript
- **`shared/`**: Shared types and schema (`schema.ts`) used across client and server
- **`attached_assets/`**: Static assets

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### Full-Stack Flow
1. **Single Server**: Express serves both API routes and frontend (via Vite dev server in development, static files in production)
2. **Port**: Always uses `PORT` environment variable (default 5000) - other ports are firewalled
3. **Database Initialization**: `initializeDatabase()` runs before routes are registered
4. **Request Logging**: All `/api` requests are logged with method, path, status, duration, and truncated response

## Database

### ORM and Schema
- **Drizzle ORM** with PostgreSQL (Neon serverless)
- Schema defined in `shared/schema.ts` with Zod validation schemas
- Storage layer abstracted in `server/storage.ts` for type-safe database operations

### Key Tables
- **users**: Email/password authentication with profile info
- **aiSystems**: Registered AI systems with risk classifications (minimal/limited/high/unacceptable)
- **riskAssessments**: Historical risk evaluation results
- **complianceRecords**: Compliance status tracking
- **aiActArticles**: Searchable regulatory text database
- **generatedDocuments**: AI-generated compliance documentation
- **regulatoryUpdates**: Automated regulatory monitoring
- **llmSettings**: User-configurable AI provider settings
- **maturityAssessments**: Organizational compliance maturity tracking
- **frameworkAssessments**: Positive AI Framework v3.0 dimension assessments (7 dimensions with strategies and risk levels)

### Database Operations
Use `storage` object from `server/storage.ts` for all database queries. It provides type-safe methods for CRUD operations on all tables.

## Authentication

Express-session with PostgreSQL session store (connect-pg-simple). Passport.js with Local Strategy for email/password authentication. Password hashing via bcrypt (12 salt rounds). Authentication logic in `server/auth.ts`.

Session cookies: httpOnly, secure in production, sameSite=lax, 1 week TTL.

## Backend Services (server/services/)

All services follow service layer pattern with business logic separated from routes.

### AssessmentService
- Primary risk classification for AI systems using questionnaire-based evaluation
- Uses LLM providers for intelligent risk analysis
- Generates compliance matrices mapping AI system features to AI Act requirements
- Key exports: `assessmentService.assessRisk()`, `assessmentService.generateComplianceMatrix()`

### ComplianceService
- Tracks compliance status over time
- Generates compliance reports and documentation
- Key export: `complianceService`

### RegulatoryService
- Monitors regulatory updates and maintains AI Act article database
- Provides search/retrieval of regulatory text
- Key export: `regulatoryService`

### LLMService
- Manages multiple AI providers: OpenAI (GPT), Google (Gemini), Anthropic (Claude)
- Provider selection with fallback support and error handling
- User-configurable provider preferences in database
- Key exports: `llmService.chat()`, `llmService.getProvider()`

### CertificateService
- Generates PDF compliance certificates
- Tracks certification history
- Key export: `certificateService`

### MaturityService
- Assesses organizational AI governance maturity (5 levels: initial → optimizing)
- Maps to Positive AI Framework v3.0 with 7 dimensions and detailed strategies
- Provides gap analysis and improvement recommendations
- Key exports: `maturityService.assessMaturity()`, `maturityService.assessFramework()`

## Frontend Architecture

### Tech Stack
- **React 18** with **TypeScript**
- **Wouter** for client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** + **Zod** for form validation
- **shadcn/ui** components built on **Radix UI** primitives
- **Tailwind CSS** for styling with CSS variables for theming

### Key Pages (client/src/pages/)
- **landing.tsx**: Unauthenticated landing page
- **home.tsx**: Dashboard after login
- **assessment.tsx**: AI system risk assessment interface
- **compliance.tsx**: Compliance tracking and reporting
- **framework.tsx**: Positive AI Framework v3.0 assessment
- **maturity.tsx**: Organizational maturity assessment
- **certificates.tsx**: Compliance certificate generation and management
- **database.tsx**: AI Act regulatory article search
- **documents.tsx**: Generated compliance documentation library
- **monitoring.tsx**: Regulatory update tracking
- **settings.tsx**: User preferences and LLM provider configuration

### Component Organization
UI components in `client/src/components/` follow shadcn/ui patterns. Reusable hooks in `client/src/hooks/`. Utilities in `client/src/lib/`.

## API Routes

All API routes defined in `server/routes.ts`. Routes return JSON responses with consistent error handling. Authentication middleware protects routes requiring login.

### Route Patterns
- `/api/user/*` - User management and authentication
- `/api/ai-systems/*` - AI system CRUD operations
- `/api/assess/*` - Risk assessment endpoints
- `/api/compliance/*` - Compliance tracking
- `/api/framework/*` - Framework assessments
- `/api/maturity/*` - Maturity assessments
- `/api/certificates/*` - Certificate generation
- `/api/database/*` - Regulatory article search
- `/api/documents/*` - Document management
- `/api/monitoring/*` - Regulatory updates
- `/api/llm-settings/*` - LLM provider configuration

## Build and Deployment

### Development
Vite dev server runs on frontend, hot module replacement enabled. Backend runs with tsx for TypeScript execution. Both start with `npm run dev`.

### Production Build
1. Frontend: Vite builds to `dist/public/`
2. Backend: esbuild bundles server to `dist/index.js` (ESM format, external packages)
3. Run with `npm start` (NODE_ENV=production)

### Type Safety
TypeScript strict mode enabled. Shared schema in `shared/schema.ts` ensures type safety across client and server. Use `npm run check` to verify types before committing.

## Key Design Patterns

- **Service Layer**: Business logic in service classes, routes handle HTTP concerns only
- **Repository Pattern**: `storage.ts` abstracts database access
- **Provider Pattern**: LLM service with unified interface for multiple AI providers
- **Component Composition**: shadcn/ui components for consistent design system
- **Type-Safe Validation**: Zod schemas derived from Drizzle schema definitions

## Important Notes

- The platform is a **decision-support tool**, not legal advice or official certification
- All database queries should go through `storage` object for type safety
- LLM provider calls include error handling and fallback logic
- Session management uses PostgreSQL for persistence across server restarts
- Frontend uses absolute imports via `@/` and `@shared/` aliases

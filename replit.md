# Overview

This is an AI compliance assessment platform for the EU AI Act (Regulation 2024/1689). The system helps organizations evaluate, document, and maintain compliance with the European Union's AI regulations. It provides risk assessment tools, regulatory database access, compliance monitoring, document generation, and regulatory update tracking. The platform is designed as a decision-support tool that assists with AI Act compliance but does not provide legal advice or official certification.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Full-Stack Architecture
- **Frontend**: React with TypeScript, using Vite for development and build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit-based OIDC authentication with session management

## Frontend Architecture
- **UI Framework**: React with shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Services
- **Assessment Service**: Processes AI system risk evaluations using configurable LLM providers
- **Compliance Service**: Tracks compliance status and generates compliance matrices
- **Regulatory Service**: Monitors regulatory updates and maintains AI Act article database
- **LLM Service**: Manages multiple AI providers (OpenAI, Google/Gemini, Anthropic) with fallback support
- **Storage Service**: Centralizes database operations with type-safe interfaces

## Database Schema
- **Users**: Stores user profiles for authentication
- **AI Systems**: Tracks registered AI systems with risk classifications
- **Risk Assessments**: Historical risk evaluation results
- **AI Act Articles**: Regulatory text database with search capabilities
- **Compliance Records**: Compliance status tracking
- **Generated Documents**: AI-generated compliance documentation
- **Regulatory Updates**: Automated regulatory monitoring feeds
- **LLM Settings**: User-configurable AI provider settings

## Key Design Patterns
- **Service Layer Pattern**: Business logic separated into dedicated service classes
- **Repository Pattern**: Database access abstracted through storage service
- **Provider Pattern**: Multiple LLM providers with unified interface
- **Component Composition**: Reusable UI components with consistent design system

# External Dependencies

## AI/LLM Services
- **OpenAI API**: GPT models for document generation and risk analysis
- **Google Gemini API**: Alternative LLM provider with cost optimization
- **Anthropic Claude**: Additional LLM option for diverse AI capabilities

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **PostgreSQL**: Primary database with session storage

## Authentication & Security
- **Replit Auth**: OIDC-based authentication system
- **Passport.js**: Authentication middleware
- **Express Session**: Session management with PostgreSQL store

## Frontend Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form validation and management
- **Zod**: Runtime type validation

## Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across full stack
- **ESBuild**: Fast JavaScript bundling for production
# ReviewHub - Marketplace Review & Complaint Manager

## Overview

ReviewHub is a SaaS demo application for centralized management of customer reviews and complaints across multiple marketplace platforms (Amazon, eBay, Shopify, PayPal, Alibaba, and Website). The application provides AI-powered analysis, sentiment tracking, and workflow management for customer feedback. Built as a premium, enterprise-grade interface with glass-morphic aesthetics inspired by Linear, Notion, and Asana.

**Core Capabilities:**
- Unified dashboard for multi-marketplace review aggregation
- AI-powered sentiment analysis and categorization using Grok 4.1 Fast LLM
- Kanban-style workflow management (Open → In Progress → Resolved)
- Analytics and visualization for review trends and insights
- Email integration for customer communication via AgentMail and Outlook
- Theme switching (light/dark mode)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript running on Vite for development and production builds
- React Router via Wouter for client-side routing
- TanStack Query (React Query) for server state management and API data fetching

**UI Component System:**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system configuration
- Glass-morphic design aesthetic with backdrop blur effects and elevated cards
- Design tokens following premium SaaS patterns (Inter font, custom color system, precise spacing primitives)

**State Management:**
- React Query for server state with configured query client (`queryClient.ts`)
- React Context for theme management (`ThemeProvider`)
- Local component state for UI interactions

**Key UI Patterns:**
- Dashboard with filterable review cards and statistics
- Drag-and-drop Kanban board using @hello-pangea/dnd
- Modal-based detail views for review management
- Chart visualizations using Recharts library

### Backend Architecture

**Server Framework:**
- Express.js application with separate dev/prod entry points
- Development mode uses Vite middleware for HMR
- Production mode serves pre-built static assets

**API Design:**
- RESTful endpoints under `/api` prefix
- Current endpoints: `/api/emails` for email retrieval
- Custom logging middleware for request/response tracking
- JSON request/response handling with raw body access for webhooks

**Development vs Production:**
- `server/index-dev.ts`: Vite integration with live reload
- `server/index-prod.ts`: Static file serving from `dist/public`
- Shared application logic in `server/app.ts`

### Data Storage Solutions

**Database Schema (Drizzle ORM):**
- PostgreSQL database via Neon serverless driver (`@neondatabase/serverless`)
- Schema definition in `shared/schema.ts` with two main tables:
  - `users`: Authentication (id, username, password)
  - `reviews`: Review records with marketplace source, content, sentiment analysis, category, severity, status, and AI-generated replies

**Storage Abstraction:**
- Interface-based storage layer (`IStorage`) in `server/storage.ts`
- In-memory implementation (`MemStorage`) for development/demo
- Database URL configured via `DATABASE_URL` environment variable
- Migrations managed through Drizzle Kit in `migrations/` directory

**Design Decision:** The application uses an abstraction layer to support both in-memory storage (for demo purposes) and PostgreSQL (for production). This allows the demo to run without database provisioning while maintaining production-ready schema definitions.

### External Dependencies

**Third-Party APIs:**
- **AgentMail API**: Email retrieval and management via `agentmail` package
  - Integration in `server/integrations/agentmail.ts`
  - Uses Replit Connectors for credential management
  - Endpoint: `https://api.agentmail.to`

- **Microsoft Graph API (Outlook)**: Email integration via `@microsoft/microsoft-graph-client`
  - Integration in `server/integrations/outlook.ts`
  - OAuth-based authentication through Replit Connectors
  - Token refresh handling with expiration checking

**Replit Platform Integration:**
- Replit Connectors system for secure credential storage
- Environment variables: `REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY`, `WEB_REPL_RENEWAL`
- Development plugins: runtime error overlay, cartographer, dev banner

**AI/LLM Integration:**
- Designed for Grok 4.1 Fast LLM (referenced in requirements, implementation pending)
- AI features: sentiment analysis, category classification, severity assessment, automated reply generation
- Currently using mock data with AI-suggested responses in frontend

**Design Rationale:** The connector-based authentication approach abstracts credential management from the application code, allowing seamless integration with external services while maintaining security. The dual email provider support (AgentMail + Outlook) provides flexibility for different deployment scenarios.

**Database Provider:**
- Neon PostgreSQL serverless for production
- Connection pooling handled by `@neondatabase/serverless`
- Schema migrations via Drizzle Kit (`npm run db:push`)

**UI Dependencies:**
- Complete Radix UI primitive collection for accessible components
- React Icons (Simple Icons) for marketplace branding
- Recharts for analytics visualization
- Class Variance Authority (CVA) for component variant management
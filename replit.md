# DriftSignal - Marketplace Review & Complaint Manager

## Overview

DriftSignal is a SaaS platform for centralized management of customer reviews and complaints across multiple marketplace platforms (Amazon, eBay, Shopify, PayPal, Alibaba, and Website). The application provides AI-powered analysis, sentiment tracking, and workflow management for customer feedback. Built as a premium, enterprise-grade interface with glass-morphic aesthetics inspired by Linear, Notion, and Asana.

**Core Capabilities:**
- Unified dashboard for multi-marketplace review aggregation
- AI-powered sentiment analysis and categorization using Grok 4.1 Fast LLM
- Kanban-style workflow management (Open → In Progress → Resolved)
- Analytics and visualization for review trends and insights
- Email integration for customer communication via AgentMail and Outlook
- Theme switching (light/dark mode)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 23, 2025 - Settings Page & Integration Management

**Settings Page:**
- Created comprehensive Settings page at `/settings` for managing integrations and application preferences
- Displays real-time connection status for all three external integrations (AgentMail, Outlook, OpenRouter)
- Integration status cards with visual indicators (Connected/Disconnected badges)
- Test Connection functionality to verify integration health
- External links to Replit integrations panel for configuration
- Refresh Status button to update all integration statuses simultaneously

**API Endpoint:**
- Implemented `/api/integrations/status` endpoint to check connection status for all integrations
- Returns detailed status information including:
  - Connection state (connected/disconnected)
  - Integration-specific details (user info, API key status, error messages)
  - Graceful error handling for unconfigured integrations

**Technical Implementation:**
- Created `client/src/pages/Settings.tsx` component with integration status display
- Added API endpoint in `server/routes.ts` with status checks for AgentMail, Outlook, and OpenRouter
- Integration cards use Shadcn Card components with color-coded badges
- Test Connection buttons use React Query refetch with fresh data for accurate status updates
- Toast notifications provide user feedback for connection tests
- Added Settings to sidebar navigation and router

**Testing:**
- End-to-end tested Settings page navigation and display
- Verified integration status cards render correctly
- Confirmed Test Connection functionality with fresh data from refetch
- Tested Refresh Status button with proper loading states
- Validated navigation between Settings and other pages

### November 23, 2025 - Marketplace Filtering & Import Reviews

**Marketplace Filtering:**
- Implemented URL-based marketplace filtering using Wouter's `useSearch()` hook for reactive search param tracking
- Sidebar marketplace buttons toggle filters (click to filter, click again to clear)
- Dashboard reactively filters review cards based on URL query parameter (?marketplace=Amazon)
- Active marketplace indicated with visual styling in sidebar navigation
- Filtering logic integrated with existing sentiment, severity, status, and date filters
- Filtering preserves shareable state through URL parameters

**Import Reviews Modal:**
- Created ImportReviewsModal component with comprehensive CSV upload functionality
- Features include:
  - Marketplace selector dropdown (Amazon, eBay, Shopify, PayPal, Alibaba, Website)
  - Drag-and-drop file upload zone with visual feedback
  - CSV template download for proper formatting guidance
  - File validation (CSV only, max 5MB)
  - Disabled import button until file is selected
- Modal triggered from sidebar "Import Reviews" button
- Follows glassmorphic design aesthetic with Shadcn UI components

**Technical Implementation:**
- Updated `client/src/components/app-sidebar.tsx` with marketplace click handlers and import modal state
- Created `client/src/components/ImportReviewsModal.tsx` as standalone component
- Modified `client/src/pages/Dashboard.tsx` to use `useSearch()` hook for URL param reactivity
- Filter logic uses `useMemo` for performance with proper dependency tracking
- Toggle behavior: navigates to `/?marketplace=X` or `/` using Wouter's `useLocation()` hook

**Testing:**
- End-to-end tested marketplace filtering with all 6 marketplaces
- Verified toggle on/off functionality clears filters correctly
- Tested import modal opens with all required elements
- Confirmed URL state synchronization and reactive filtering

### November 23, 2025 - AI Integration and Email Threading

**AI-Powered Reply Generation:**
- Integrated Grok 4.1 Fast via OpenRouter for professional customer service response generation
- Created AI service layer (`server/ai/service.ts`) with OpenRouter client abstraction
- Implemented `/api/generate-reply` endpoint for real-time AI reply suggestions
- Connected ReviewDetailModal to AI endpoint with loading states and error handling
- Uses x-ai/grok-4.1-fast model optimized for customer support and agentic workflows
- Temperature 0.7 for balanced creativity in professional responses
- System prompts engineered for empathetic, solution-focused customer service tone

**AI Endpoint Design:**
- `/api/generate-reply`: Generates professional responses based on review content, sentiment, and severity
- `/api/analyze-review`: Available for future analysis of imported reviews (currently unused as mock data pre-populated)
- Graceful error handling with user-friendly toast notifications
- Environment variable: AI_INTEGRATIONS_OPENROUTER_API_KEY (managed via Replit Connectors)

**Email Conversation Threading:**
- Added intelligent email conversation grouping based on normalized subjects and metadata
- Implemented priority-based thread ID generation: provider threadId → inReplyTo → messageId → fallback composite
- Subject normalization strips all reply/forward prefixes while preserving original capitalization for display
- Thread UI with collapsible expand/collapse using Shadcn Collapsible component
- Visual indicators for reply count and unread messages in each thread
- Graceful error handling for AgentMail integration (returns empty response instead of HTTP 500)

**Technical Implementation:**
- Updated `/api/emails` endpoint to fetch from AgentMail inboxes API
- Added thread grouping logic in `server/routes.ts` with proper email validation using Zod
- Enhanced `shared/types.ts` with EmailThread interface and updated EmailListResponse
- Implemented collapsible thread UI in Dashboard with ChevronRight/ChevronDown icons
- Added comprehensive error handling for missing AgentMail and OpenRouter configurations

**Testing:**
- End-to-end tested AI reply generation with successful Grok 4.1 Fast API calls
- Verified graceful degradation when AgentMail is not configured
- Tested expand/collapse functionality for threaded conversations
- Validated proper handling of empty inbox state without error messages
- Confirmed professional, context-aware AI responses addressing customer concerns

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
- Current endpoints:
  - `/api/emails`: Email retrieval with conversation threading
  - `/api/send-email`: Send emails via Outlook integration
  - `/api/generate-reply`: AI-powered customer service response generation using Grok 4.1 Fast
  - `/api/analyze-review`: AI analysis for sentiment, severity, and category (available for future use)
  - `/api/integrations/status`: Connection status check for all external integrations (AgentMail, Outlook, OpenRouter)
- Custom logging middleware for request/response tracking
- JSON request/response handling with raw body access for webhooks
- Graceful error handling with fallback to empty responses for missing integrations

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
  - API structure: `client.inboxes.list()` for inboxes, `client.inboxes.messages.list(inboxId)` for messages
  - Graceful degradation when not configured (returns empty response)

- **Microsoft Graph API (Outlook)**: Email integration via `@microsoft/microsoft-graph-client`
  - Integration in `server/integrations/outlook.ts`
  - OAuth-based authentication through Replit Connectors
  - Token refresh handling with expiration checking

**Email Threading System:**
- Conversation grouping based on normalized email subjects
- Thread ID generation priority:
  1. Provider-supplied threadId (if available)
  2. inReplyTo field for reply chains
  3. messageId for unique identification
  4. Fallback: composite of normalized subject + sender email + message ID
- Subject normalization: iterative stripping of Re:/Fwd: prefixes
- Display preserves original capitalization while grouping uses normalized form
- Thread metadata: reply count, unread count, most recent message timestamp
- UI: Collapsible threads with expand/collapse functionality using Shadcn Collapsible component

**Replit Platform Integration:**
- Replit Connectors system for secure credential storage
- Environment variables: `REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY`, `WEB_REPL_RENEWAL`
- Development plugins: runtime error overlay, cartographer, dev banner

**AI/LLM Integration:**
- **OpenRouter + Grok 4.1 Fast**: Production AI integration for customer service reply generation
  - Model: x-ai/grok-4.1-fast (optimized for customer support and agentic workflows)
  - Integration: `server/ai/service.ts` with OpenRouter client wrapper
  - Base URL: https://openrouter.ai/api/v1
  - Authentication: AI_INTEGRATIONS_OPENROUTER_API_KEY via Replit Connectors
  - Temperature: 0.7 for reply generation (balanced creativity), 0.3 for analysis (deterministic)
  - Max tokens: 300 for concise replies, 500 for analysis
  - System prompts: Engineered for professional, empathetic customer service tone
  - Error handling: Graceful degradation with user-friendly error messages
- **AI Features:**
  - Real-time professional response generation addressing specific customer concerns
  - Available analysis capabilities: sentiment detection, severity assessment, category classification
  - Context-aware responses based on marketplace, review content, and customer sentiment
  - Integrated with ReviewDetailModal for seamless UX with loading states and toast notifications

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
# DriftSignal - Marketplace Review & Complaint Manager

## Overview

DriftSignal is a SaaS platform designed for centralized management of customer reviews and complaints across various marketplace platforms (Amazon, Shopify, Walmart, and Website). It offers AI-powered analysis, sentiment tracking, and workflow management for customer feedback. The platform features a premium, enterprise-grade interface with a glass-morphic design inspired by Linear, Notion, and Asana. Its core capabilities include unified multi-marketplace review aggregation, AI-powered sentiment analysis and categorization using Grok 4.1 Fast LLM, Kanban-style workflow management, analytics for review trends, email integration for customer communication, CSV/JSON file import, and theme switching.

## Recent Changes (November 24, 2025)

### UI/UX Refinements & Code Cleanup (Latest)
- **Added** blue gradient background theme
  - Light mode: Very light sky blue (top) transitioning to deeper blue (bottom-left)
  - Dark mode: Darker blue tones with same gradient direction
  - Gradient uses 30-60% opacity for premium glass-morphic aesthetic
  - Fixed background attachment for consistent visual experience while scrolling
- **Simplified** Settings page by removing duplicate importers
  - Removed redundant Amazon, Shopify, and Walmart import sections from Settings
  - All product imports now consolidated in Dashboard's "Import Product" modal
  - Settings page now focuses solely on integration status and configuration
  - Cleaned up unused imports and mutations (Input, Package, Download, useMutation)
- **Fixed** AgentMail integration display
  - Corrected client initialization from `environment` to `baseUrl`
  - Fixed status check to properly parse `inboxesResponse.inboxes` structure
  - AgentMail now shows as "Connected" in Settings page
- **Status**: Platform is production-ready with cleaner, more intuitive UI

### Code Optimization & Error Handling Hardening
- **Removed** 12 unused/duplicate files for cleaner codebase
  - Deleted entire `client/src/components/examples/` directory (11 duplicate files)
  - Deleted unused `AmazonReviewsPanel.tsx` component
- **Hardened** error handling across all API integrations
  - Backend: Regex-based Axesso error parsing with specific HTTP status codes (404, 403, 429)
  - Frontend: Content-Type-aware response parsing in all import mutations
  - Error messages now properly propagate from backend to frontend toast notifications
  - Graceful handling of both JSON and non-JSON error responses
- **Enhanced** Analytics with comprehensive filtering
  - Added Rating Distribution chart
  - Added Status Distribution chart
  - Implemented 6 filter types: date range, product, marketplace, sentiment, status, rating
  - Collapsible filter panel for better UX
- **Fixed** SelectItem validation errors by replacing empty string values with "all" constant
- **Tested** end-to-end functionality with Playwright
  - All pages (Dashboard, Analytics, Workflow, Settings) verified working
  - All UI components present and interactive
  - No critical bugs found

### Product Refresh Feature
- **Added** refresh button to each tracked product on Dashboard
  - Clicking refresh fetches the latest reviews from marketplace API
  - Uses duplicate detection to skip reviews already in database
  - Shows loading spinner during refresh operation
  - Updates last imported timestamp automatically
  - Displays toast notification with import results
- **Backend endpoint** `/api/products/refresh` handles re-importing for Amazon and Walmart
  - Accepts productId and platform as parameters
  - Returns `imported` and `skipped` counts
  - Invalidates product and review caches after successful import

### Database Migration to PostgreSQL
- **Migrated** from in-memory storage to persistent PostgreSQL database
  - Created `products` table with platform, productId, productName, and lastImported tracking
  - Updated `reviews` schema with `externalReviewId`, `productId`, and `productName` fields
  - Implemented DBStorage class with full CRUD operations for reviews and products
  - Configured WebSocket support for Neon serverless database connection (`ws` package)
- **Duplicate Prevention**: All import endpoints now check `externalReviewId` before inserting
  - Amazon, Walmart, and file imports skip duplicate reviews automatically
  - Import response includes `imported` and `skipped` counts
- **Product Tracking**: 
  - Products automatically tracked when reviews imported
  - Last import timestamp updated on each import
  - Review count per product calculated from database
- **Database Status**: PostgreSQL connected successfully, all data persists across restarts

### File Import Feature & Marketplace Cleanup
- **Implemented** CSV/JSON file import functionality with AI-powered processing
  - Backend endpoint `/api/reviews/import-file` using multer for file uploads
  - Supports CSV and JSON file formats (up to 10MB)
  - Automatically parses reviews and processes through AI for sentiment/category/severity analysis
  - Generates AI-suggested replies for each imported review
  - Template download feature for proper CSV format
- **Removed** non-functional marketplaces (eBay, Alibaba, PayPal) from the platform
  - Updated sidebar to only show: Amazon, Shopify, Walmart, Website
  - Updated import modal dropdown to match active marketplaces
  - Updated global type definitions to reflect active platforms only
- **Added** Export Data functionality - downloads filtered reviews as CSV
- **Added** platform icons (Amazon, Shopify, Walmart) to product tracking section

### Walmart Reviews Integration
- **Built** Walmart integration using Walmart API v2 via RapidAPI (walmart2.p.rapidapi.com)
- **Added** RAPIDAPI_KEY secret for Walmart API authentication
- **Implemented** product URL parsing to extract product IDs
- **Created** complete integration flow: URL input → RapidAPI search → AI analysis → Dashboard display
- **UI Updates**: Added Walmart integration card to Settings page with status indicator and importer section
- **Status**: Integration configured and ready for testing with Walmart product URLs

### Amazon Reviews Integration
- **Moved** Amazon import interface from Dashboard to Settings page for better organization
- **Built** complete AI-powered import pipeline: ASIN input → Axesso API fetch → AI analysis (sentiment/category/severity) → AI reply generation → PostgreSQL database storage → Dashboard display
- **Fixed** Axesso API integration issues:
  - Corrected base URL to `axesso-axesso-amazon-data-service-v1.p.rapidapi.com`
  - Updated endpoint path to `/amz/amazon-lookup-product` (confirmed working)
  - API now responds correctly with proper error messages
- **Updated** to use database storage with duplicate detection via externalReviewId
- **Current Status**: Integration configured and API responding correctly

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using Vite for fast development and builds. Client-side routing is handled by Wouter, and TanStack Query (React Query) manages server state and API data fetching. The UI is constructed with Shadcn/ui components, based on Radix UI primitives, styled using Tailwind CSS to achieve a glass-morphic aesthetic with custom design tokens. State management primarily uses React Query for server state and React Context for theme management. Key UI patterns include a filterable dashboard with review cards, a drag-and-drop Kanban board using `@hello-pangea/dnd`, modal-based detail views, and chart visualizations with Recharts.

### Backend Architecture
The backend uses Express.js with separate configurations for development (Vite middleware for HMR) and production (serving static assets). It provides RESTful APIs under the `/api` prefix for email management, AI-powered reply generation, review analysis, and integration status checks. The API design includes custom logging, JSON request/response handling, and graceful error handling.

### Data Storage Solutions
The application uses persistent PostgreSQL database storage powered by Neon serverless, accessed via the `@neondatabase/serverless` driver with WebSocket configuration. The schema, defined with Drizzle ORM, includes:
- **`reviews` table**: Stores all imported reviews with fields for externalReviewId (duplicate detection), marketplace, productId, title, content, customerName, customerEmail, rating, sentiment, category, severity, status, createdAt, aiSuggestedReply, and verification status.
- **`products` table**: Tracks imported products with platform, productId, productName, and lastImported timestamp.
- **`users` table**: User authentication and profile management.

An abstraction layer (`IStorage` interface, `DBStorage` implementation) provides clean separation between business logic and data persistence. The DBStorage class implements full CRUD operations for reviews and products, including duplicate detection via `checkReviewExists()` and product tracking methods. Database migrations are managed using Drizzle Kit (`npm run db:push`).

## External Dependencies

### Third-Party APIs
- **AgentMail API**: Used for email retrieval and management.
- **Microsoft Graph API (Outlook)**: Integrated for email sending functionalities.
- **Axesso Amazon Data Service API**: Utilized for fetching Amazon product reviews, product details, and offers via RapidAPI.
  - **Status**: Integration configured and API responding correctly
  - **Base URL**: `axesso-axesso-amazon-data-service-v1.p.rapidapi.com`
  - **Endpoint**: `/amz/amazon-lookup-product` (confirmed working)
  - **Known Limitation**: Free tier (BASIC plan - 50 requests/month) has limited product coverage. Many ASINs return "product not found" errors, likely due to Axesso's product indexing limitations or regional availability.
  - **Subscription Required**: User subscribed to RapidAPI free tier via api.rapidapi.com
- **SerpApi (Walmart)**: Used for fetching Walmart product reviews and details.
  - **Status**: Integration configured with SERPAPI_KEY
  - **Base URL**: `serpapi.com`
  - **Endpoints**: `/search.json?engine=walmart_product` for product data, `/search.json?engine=walmart_product_reviews` for reviews
  - **Authentication**: Uses SERPAPI_KEY secret
  - **Migration**: Replaced RapidAPI walmart2 (deprecated/unreliable) with SerpApi for better uptime and reliability
- **OpenRouter + Grok 4.1 Fast**: Provides AI capabilities for generating customer service replies and analyzing review sentiment, severity, and category.

### Replit Platform Integration
- **Replit Connectors**: Used for secure management of API keys and credentials, including `AXESSO_API_KEY`, `RAPIDAPI_KEY`, `AI_INTEGRATIONS_OPENROUTER_API_KEY`, and credentials for AgentMail and Outlook.
- **Environment Variables**: Leverages Replit's environment variables for configuration.

### Database Provider
- **Neon PostgreSQL**: Serverless PostgreSQL database used for production data storage.
# DriftSignal - Marketplace Review & Complaint Manager

## Overview

DriftSignal is a SaaS platform designed for centralized management of customer reviews and complaints across various marketplace platforms (Amazon, eBay, Shopify, PayPal, Alibaba, Walmart, and Website). It offers AI-powered analysis, sentiment tracking, and workflow management for customer feedback. The platform features a premium, enterprise-grade interface with a glass-morphic design inspired by Linear, Notion, and Asana. Its core capabilities include unified multi-marketplace review aggregation, AI-powered sentiment analysis and categorization using Grok 4.1 Fast LLM, Kanban-style workflow management, analytics for review trends, email integration for customer communication, and theme switching.

## Recent Changes (November 24, 2025)

### Walmart Reviews Integration
- **Built** Walmart integration using Walmart API v2 via RapidAPI (walmart2.p.rapidapi.com)
- **Added** RAPIDAPI_KEY secret for Walmart API authentication
- **Implemented** product URL parsing to extract product IDs
- **Created** complete integration flow: URL input → RapidAPI search → AI analysis → Dashboard display
- **UI Updates**: Added Walmart integration card to Settings page with status indicator and importer section
- **Status**: Integration configured and ready for testing with Walmart product URLs

### Amazon Reviews Integration (November 23, 2025)
- **Moved** Amazon import interface from Dashboard to Settings page for better organization
- **Built** complete AI-powered import pipeline: ASIN input → Axesso API fetch → AI analysis (sentiment/category/severity) → AI reply generation → in-memory storage → Dashboard display
- **Fixed** Axesso API integration issues:
  - Corrected base URL to `axesso-axesso-amazon-data-service-v1.p.rapidapi.com`
  - Updated endpoint path to `/amz/amazon-lookup-product` (confirmed working)
  - API now responds correctly with proper error messages
- **Current Status**: Import system fully functional, but Axesso free tier has very limited product coverage. Many ASINs cannot be found in their database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using Vite for fast development and builds. Client-side routing is handled by Wouter, and TanStack Query (React Query) manages server state and API data fetching. The UI is constructed with Shadcn/ui components, based on Radix UI primitives, styled using Tailwind CSS to achieve a glass-morphic aesthetic with custom design tokens. State management primarily uses React Query for server state and React Context for theme management. Key UI patterns include a filterable dashboard with review cards, a drag-and-drop Kanban board using `@hello-pangea/dnd`, modal-based detail views, and chart visualizations with Recharts.

### Backend Architecture
The backend uses Express.js with separate configurations for development (Vite middleware for HMR) and production (serving static assets). It provides RESTful APIs under the `/api` prefix for email management, AI-powered reply generation, review analysis, and integration status checks. The API design includes custom logging, JSON request/response handling, and graceful error handling.

### Data Storage Solutions
The application uses PostgreSQL, specifically Neon serverless, via the `@neondatabase/serverless` driver. The schema, defined with Drizzle ORM, includes `users` and `reviews` tables. An abstraction layer (`IStorage`) supports both in-memory storage for development/demo and PostgreSQL for production, with migrations managed by Drizzle Kit.

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
- **Walmart API v2 via RapidAPI**: Used for fetching Walmart product reviews and details.
  - **Status**: Integration configured with RAPIDAPI_KEY
  - **Base URL**: `walmart2.p.rapidapi.com`
  - **Endpoint**: `/search` for product search by ID
  - **Authentication**: Uses RAPIDAPI_KEY secret
- **OpenRouter + Grok 4.1 Fast**: Provides AI capabilities for generating customer service replies and analyzing review sentiment, severity, and category.

### Replit Platform Integration
- **Replit Connectors**: Used for secure management of API keys and credentials, including `AXESSO_API_KEY`, `RAPIDAPI_KEY`, `AI_INTEGRATIONS_OPENROUTER_API_KEY`, and credentials for AgentMail and Outlook.
- **Environment Variables**: Leverages Replit's environment variables for configuration.

### Database Provider
- **Neon PostgreSQL**: Serverless PostgreSQL database used for production data storage.
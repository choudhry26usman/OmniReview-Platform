# DriftSignal - Marketplace Review & Complaint Manager

## Overview

DriftSignal is a SaaS platform for centralized management of customer reviews and complaints across various marketplace platforms (Amazon, Shopify, Walmart, and Mailbox for email-imported reviews). It offers AI-powered analysis, sentiment tracking, and workflow management for customer feedback. The platform features a premium, enterprise-grade interface with a glass-morphic design, unified multi-marketplace review aggregation, AI-powered sentiment analysis and categorization using Grok 4.1 Fast LLM, Kanban-style workflow management, analytics for review trends, email integration for customer communication, CSV/JSON file import, and theme switching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, and Vite. It features a glass-morphic design inspired by Linear, Notion, and Asana, utilizing Shadcn/ui components (Radix UI primitives) and Tailwind CSS. The color scheme uses a vibrant blue as the primary color with a blue gradient background. Key UI patterns include a filterable dashboard with review cards, a drag-and-drop Kanban board, modal-based detail views, and Recharts for visualizations.

### Technical Implementations
The frontend uses Wouter for routing and TanStack Query for server state management. The backend is an Express.js application providing RESTful APIs for email management, AI reply generation, review analysis, and integration status checks. It includes custom logging, JSON handling, and robust error handling. Product refresh functionality allows fetching the latest reviews with duplicate detection. CSV/JSON file import supports AI-powered processing for sentiment, category, severity analysis, and AI-suggested replies.

### Feature Specifications
- **Multi-marketplace Integration**: Supports Amazon, Shopify, Walmart, and Mailbox (for Outlook email imports).
- **AI-Powered Analysis**: Sentiment, category, and severity analysis of reviews, along with AI-suggested replies using Grok 4.1 Fast LLM.
- **Workflow Management**: Kanban-style board for managing review statuses (open, in_progress, resolved).
- **Analytics**: Dashboard metrics, rating distribution, and status distribution charts with comprehensive filtering (date range, product, marketplace, sentiment, status, rating).
- **Email Integration**: Outlook-only architecture for automatic email monitoring, classification, and review import, as well as sending customer replies.
- **Data Import/Export**: CSV/JSON file import with AI processing; export filtered reviews as CSV.
- **Product Tracking**: Automatically tracks imported products, updates last import timestamps, and prevents duplicate reviews.
- **User Authentication**: Secure multi-user authentication via Replit Auth (OpenID Connect). Each user only sees their own reviews and products.
- **Account Management**: User profile display in sidebar footer with dropdown menu for account settings and sign-out.
- **AI Chatbot Assistant**: Floating chatbot button that opens a chat panel for answering common user questions about review management, navigation, and platform features. Powered by Grok AI.

### System Design Choices
- **Data Storage**: Persistent PostgreSQL database via Neon serverless, using Drizzle ORM for schema definition (`reviews`, `products`, `users`, `sessions` tables).
- **Abstraction Layer**: `DBStorage` class implements `IStorage` for CRUD operations, ensuring separation of concerns.
- **User Data Isolation**: Reviews and products are scoped by userId. Each user only sees and manages their own data.
- **Session Management**: PostgreSQL-backed session storage using connect-pg-simple for persistent sessions.
- **Authentication Flow**: Replit Auth with OpenID Connect. Routes: `/api/login`, `/api/logout`, `/api/callback`, `/api/auth/user`.
- **Error Handling**: Hardened error handling across all API integrations with proper message propagation.
- **Code Optimization**: Cleaned codebase by removing unused files and consolidating import sections.

## External Dependencies

### Third-Party APIs
- **Microsoft Graph API (Outlook)**: For email synchronization and sending.
- **Axesso Amazon Data Service API**: Fetches Amazon product reviews, details, and product titles via RapidAPI.
  - **Base URL**: `axesso-axesso-amazon-data-service-v1.p.rapidapi.com`
  - **Endpoint**: `/amz/amazon-lookup-product`
  - **Note**: Returns ~8-10 reviews per product with proper product names. Simpler and more reliable than alternatives.
- **SerpApi (Walmart)**: Fetches Walmart product reviews and details.
  - **Base URL**: `serpapi.com`
  - **Endpoints**: `/search.json?engine=walmart_product`, `/search.json?engine=walmart_product_reviews`
- **OpenRouter + Grok 4.1 Fast**: Provides AI capabilities for review analysis and reply generation.

### Replit Platform Integration
- **Replit Connectors**: Used for secure management of API keys and credentials (e.g., `AXESSO_API_KEY`, `RAPIDAPI_KEY`, `AI_INTEGRATIONS_OPENROUTER_API_KEY`).
- **Environment Variables**: For configuration.

### Database Provider
- **Neon PostgreSQL**: Serverless PostgreSQL for production data storage.
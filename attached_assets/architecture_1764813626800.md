# System Architecture Specification

## 1. High-Level Design
DriftSignal utilizes a modern **Client-Server Architecture** optimized for cloud deployment on Replit.
* **Architecture Pattern:** Single Page Application (SPA).
* **Frontend:** Decoupled React 18 frontend communicating via RESTful JSON APIs.
* **Backend:** Express.js monolith handling business logic, AI orchestration, and database transactions.

**This repository contains the Final Production Build**.

## 2. Component Diagram

[Client Layer: React 18 + Vite]
       |
       | (JSON / HTTPS)
       |
[Application Layer: Express.js]
       |
   +---+-------------------------+------------------+------------------+
   |                             |                  |                  |
   v                             v                  v                  v
[Neon PostgreSQL]          [Grok 4.1 AI]      [External APIs]    [Replit Auth]
(Drizzle ORM)              (via OpenRouter)   (Axesso/SerpApi)   (OpenID)

## 3. Detailed Tech Stack

### Frontend (User Experience)
* **Framework:** React 18 (TypeScript) built with Vite.
* **State Management:** **TanStack Query** (React Query) for server state caching and automatic re-fetching.
* **Routing:** **Wouter** (A minimalist alternative to React Router).
* **UI System:** **Shadcn/ui** primitives styled with **Tailwind CSS**.
* **Visual Style:** "Glass-morphism" aesthetic (inspired by Linear/Notion) with framer-motion animations.

### Backend (API Gateway)
* **Runtime:** Node.js.
* **Framework:** **Express.js** providing RESTful endpoints.
* **Validation:** Zod schema validation for all incoming API requests.
* **Error Handling:** Centralized error propagation middleware.

### Database & Persistence
* **Provider:** **Neon** (Serverless PostgreSQL).
* **ORM:** **Drizzle ORM** (TypeScript-first object relational mapper).
* **Schema:**
    * `users`: Identity and preferences.
    * `reviews`: Normalized feedback data.
    * `products`: Product metadata to prevent duplicate API fetches.
    * `sessions`: Persistent storage via `connect-pg-simple`.

### Intelligence Engine (AI)
* **Model:** **Grok 4.1 Fast** (via OpenRouter).
* **Reasoning:** Selected over GPT-3.5 for superior speed in real-time chat.
* **Function:** Performs sentiment analysis (0-100), severity scoring, and generates response drafts.

## 4. Data Integration Strategy
DriftSignal moves beyond simple scraping by leveraging specialized API proxies for reliability:

| Source | Integration Method | Purpose |
| :--- | :--- | :--- |
| **Amazon** | **Axesso Data Service** | Fetches product details and verified reviews via RapidAPI. |
| **Walmart (US)** | **SerpApi** | Real-time search and review extraction. |
| **Walmart (CA)** | **Apify Actor** | Specialized scraper for `.ca` domain nuances. |
| **Email** | **Microsoft Graph API** | Two-way sync for Outlook (Reading emails & Sending replies). |

## 5. Security & Optimization
* **User Isolation:** All database queries are strictly scoped by `userId`. Users cannot access data belonging to other accounts.
* **Credential Injection:** API keys (Axesso, OpenRouter, Neon) are injected via **Replit Connectors**, ensuring secrets never touch the client-side code.
* **Rate Limiting:** Backend implements delays and caching (via TanStack Query) to prevent hitting external API limits.

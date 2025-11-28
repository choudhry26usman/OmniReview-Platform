# System Architecture & Technical Specifications: DriftSignal

## 1. Executive Technical Summary
DriftSignal is architected as a **centralized intelligence platform** designed to solve the fragmentation of e-commerce data. Unlike traditional dashboarding tools that simply display data, DriftSignal functions as an **event-driven middleware** that sits between disparate marketplace APIs (Amazon, Shopify, Walmart) and Generative AI models.

The system utilizes a **Modular Monolith** architecture hosted on a containerized cloud environment (Replit). This approach ensures rapid deployment cycles while maintaining strict separation of concerns between the **Presentation Layer** (React), the **Business Logic Layer** (Node.js), and the **Intelligence Layer** (OpenAI).

**Key Architectural Principles:**
* **Asynchronous Processing:** Heavy AI tasks (like generating email drafts) are handled asynchronously to prevent blocking the user interface.
* **Stateless REST API:** The backend adheres to RESTful principles, ensuring scalability and ease of integration with future third-party tools.
* **Fail-Safe Data Ingestion:** The system implements "Graceful Degradation"—if the live Shopify API fails, the system automatically falls back to cached or mock data to ensure the demo never crashes.

---

## 2. The AI Ecosystem (Multi-Model Orchestration)
The platform does not rely on a single AI model. Instead, it uses a **Tiered Intelligence Strategy** to optimize for cost, speed, and quality.

### A. Runtime AI (The "Brain" of the App)
* **Tier 1: High-Reasoning Engine (GPT-4o)**
    * **Role:** Complex decision making.
    * **Tasks:** Sentiment Analysis (0-100 scoring), Root Cause Extraction (e.g., distinguishing "Damaged Box" from "Broken Product"), and Tone-Matching for email drafts.
    * **Prompt Strategy:** Uses "Few-Shot Prompting" with specific context regarding the user's business tone.
* **Tier 2: High-Velocity Engine (GPT-3.5 Turbo)**
    * **Role:** Classification & Tagging.
    * **Tasks:** Rapidly tagging incoming reviews into buckets (Shipping, Product, Service) at high volume and low cost.

### B. Development AI (The Build Stack)
* **Code Generation:** Replit Ghostwriter was utilized for real-time React component generation and debugging Node.js middleware.
* **Documentation Assistant:** Claude 3.5 Sonnet was leveraged to synthesize technical documentation and the user manual from raw code snippets.

---

## 3. High-Level Component Diagram

**[User Layer]** **[Application Layer]** **[Intelligence Layer]**
+-------------+          +---------------------+          +----------------------+
|             |  HTTPS   |                     |   API    |                      |
|  React.js   | <------> |  Node.js Gateway    | <------> |  OpenAI API          |
|  Frontend   |  JSON    |  (Express)          |          |  (GPT-4o / 3.5)      |
|             |          |                     |          |                      |
+------+------+          +----------+----------+          +----------------------+
       ^                            |
       | User Action                | Data Aggregation
       | (Click "Draft")            v
       |                 +---------------------+
       +-----------------|  Unified Data Mesh  |
                         +---------------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
    [Shopify Adapter]       [Walmart Scraper]       [Amazon Mock]
    (REST Admin API)        (Apify Actor)           (DummyJSON)

---

## 4. Detailed Technology Stack

### Frontend (Presentation)
* **Framework:** React 18 (bootstrapped via Vite for <300ms load times).
* **UI Library:** Tailwind CSS (Utility-first styling for rapid responsiveness).
* **State Management:** React Context API (Managing user session and review feeds).
* **Visualizations:** Lucide React (Dynamic iconography based on sentiment score).

### Backend (Business Logic)
* **Runtime:** Node.js v18 (LTS).
* **Server Framework:** Express.js (Lightweight middleware for routing).
* **HTTP Client:** Axios (Robust error handling for external API calls).
* **Email Transport:** Nodemailer (SMTP integration for Outlook/SendGrid).

### Data & Security
* **Persistence:** Replit Database (Key-Value store for user preferences).
* **Secret Management:** Environment Variables (`process.env`) used to sandbox API keys for OpenAI, Shopify, and Apify.
* **Data Normalization:** A custom middleware function (`normalizeReview()`) converts disparate JSON structures from Amazon/Shopify into a single, standardized schema before the UI renders it.

---

## 5. Future Roadmap (Scalability)
While the current Proof of Concept (PoC) uses In-Memory processing for speed, a production rollout would include:
1.  **Vector Database (Pinecone):** To store historical reviews for Long-Term Memory (RAG), allowing the AI to reference past complaints when drafting replies.
2.  **Queue System (Redis):** To handle high-volume webhooks from Shopify during Black Friday traffic spikes.
3.  **Auth0 Integration:** To replace Basic Auth with enterprise-grade SSO.

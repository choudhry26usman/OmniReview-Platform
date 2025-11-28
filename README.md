# DriftSignal: AI-Powered Review Aggregator

[![Run on Replit](https://replit.com/badge/github/reiddm1/DriftSignal)](https://replit.com/@reiddm1/DriftSignal)

### 🚀 Overview
**DriftSignal** is a centralized intelligence dashboard designed for small business owners to aggregate, analyze, and respond to customer feedback across multiple marketplaces (Amazon, Walmart, Shopify) from a single interface.

* **Live Demo:** [https://replit.com/@reiddm1/DriftSignal](https://replit.com/@reiddm1/DriftSignal)
* **Course:** MBA Program, Haskayne School of Business (Fall 2025)

---

### 🎯 The Business Problem
Small business owners lose an estimated 5-10 hours per week logging into disparate portals (Amazon Seller Central, Shopify Admin, Walmart Marketplace) to check reviews. Missing a critical negative review can result in account suspension or lost revenue.

**The Solution:** DriftSignal provides a "Single Pane of Glass" that uses Generative AI to:
1.  **Aggregate** reviews from restricted sources.
2.  **Triage** complaints by severity (e.g., separating "Shipping Delays" from "Product Defects").
3.  **Draft** professional, empathetic responses in seconds.

---

### ✨ Key Features
* **Unified Feed:** Pulls mock/live data from Amazon, Shopify, and Walmart into one sortable list.
* **AI Sentiment Engine:** Instantly tags incoming reviews as *Urgent*, *Positive*, or *Neutral* and identifies the root cause (e.g., "Broken Seal," "Late Delivery").
* **Smart Reply:** One-click generation of customer responses using context-aware AI agents.
* **Email Integration:** Seamlessly sends drafted responses via Outlook/SendGrid integration.

---

### 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS, Lucide Icons
* **Backend:** Node.js (Express), Replit DB
* **AI Models:** OpenAI GPT-4o (via API)
* **Data Sources:**
    * **Amazon:** Simulated via DummyJSON (due to SP-API restrictions)
    * **Shopify:** Admin API Integration
    * **Walmart:** Apify Web Scraper

---

### ⚙️ Setup & Installation

To run this project locally or on Replit:

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/choudhry26usman/OmniReview-Platform.git](https://github.com/choudhry26usman/OmniReview-Platform.git)
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env` file and add your keys (see `.env.example`):
    ```env
    OPENAI_API_KEY=sk-...
    SHOPIFY_ACCESS_TOKEN=...
    ```
4.  **Run the Server:**
    ```bash
    npm run

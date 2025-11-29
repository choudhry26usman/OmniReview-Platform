# DriftSignal

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue) ![Stack](https://img.shields.io/badge/tech-React%20%7C%20Node%20%7C%20OpenAI-orange)

DriftSignal is an AI-assisted customer intelligence platform designed to aggregate, analyze, and triage feedback from fragmented e-commerce channels. Built as a capstone project for the Haskayne MBA program, it demonstrates how Generative AI can solve the "Data Silo" problem for small businesses.

---

## The Problem: Feedback Fragmentation
Small merchants (SMBs) operate on multiple channels simultaneously—Amazon for volume, Shopify for brand, and Walmart for reach.
* **The Pain Point:** Merchants spend ~15% of their week logging into disparate portals to check reviews.
* **The Risk:** A negative review on Amazon (latency < 24 hrs) can degrade seller rating algorithms before the merchant even sees it.

## The Solution: Unified Intelligence
DriftSignal functions as a headless aggregator. It ingests unstructured text data from multiple sources, normalizes it into a standard JSON schema, and applies LLM (Large Language Model) reasoning to determine:
1.  **Sentiment Velocity:** Is the review urgent? (0-100 Score)
2.  **Root Cause:** Is this a Logistics failure or a Product failure?
3.  **Actionability:** Auto-drafts a context-aware response using RAG (Retrieval-Augmented Generation) principles.

---

## Technical Architecture & Simulation Strategy
Due to the strict security audits required for live production access to Amazon's SP-API, this project utilizes a Hybrid Data Strategy:

| Layer | Technology | Implementation Detail |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Component-based UI with Tailwind CSS for rapid state management. |
| **Backend** | Node.js (Express) | RESTful API gateway handling client requests and AI orchestration. |
| **Amazon Data** | **DummyJSON** | **Simulation:** We utilize the DummyJSON standard to mock high-volume transaction data, allowing us to stress-test the AI sorting logic without triggering Amazon's anti-bot defenses. |
| **Walmart Data** | **Apify** | **Scraping:** Live data is retrieved via a dedicated actor on the Apify platform to bypass simple HTML parsing limits. |
| **Intelligence** | **GPT-4o** | Utilizes "Few-Shot Prompting" to enforce JSON output for consistent frontend rendering. |

---

## Quick Start (Local & Replit)

**Prerequisites:** Node.js v18+, OpenAI API Key.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/choudhry26usman/DriftSignal.git](https://github.com/choudhry26usman/DriftSignal.git)
    cd DriftSignal
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Rename `.env.example` to `.env` and inject your keys:
    ```env
    OPENAI_API_KEY=sk-proj-...
    REPLIT_DB_URL=...
    ```

4.  **Launch**
    ```bash
    npm run dev
    ```

---


## 👤 Contributors
* **Product & Documentation:** Usman Choudhry
* **Lead Engineering:** Reid McGrath
* **QA & Strategy:** Sam Horton
* **Technical Writer:** Mike Prince-Wright
* **Product Marketing:** Mark Fiselier

*Licensed under MIT.*

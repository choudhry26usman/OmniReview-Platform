# DriftSignal: AI-Powered Review Management Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Stack](https://img.shields.io/badge/tech-Python%20%7C%20Flask%20%7C%20OpenAI-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**DriftSignal** is an AI-assisted customer intelligence platform designed to centralize, categorize, and respond to feedback for small ecommerce businesses. Built as a capstone project for the **Haskayne MBA program**, it addresses the "Death by a Thousand Tabs" problem facing multi-channel sellers.

---

## 🚩 The Business Problem
Small merchants (generating $50k-$500k/yr) operate on multiple channels—Amazon, Shopify, eBay, and Walmart.
* **The Chaos:** Sellers log into 5 different portals daily to check reviews.
* **The Risk:** 53% of consumers expect a response to negative reviews within a week. Missing a review on Amazon can degrade seller ratings before it's even seen.
* **The Gap:** Enterprise tools (Birdeye, Podium) cost $300-$500/month, which is unaffordable for small operators.

## ⚡ The Solution
DriftSignal functions as a centralized "Single Pane of Glass" dashboard.
1.  **Unified Feed:** Aggregates reviews from CSV imports (Amazon/eBay) and manual entry into one stream.
2.  **AI Categorization:** Automatically tags issues as *Shipping*, *Product Quality*, or *Customer Service*.
3.  **Severity Scoring:** Assigns a "Criticality" score based on sentiment intensity (not just star rating).
4.  **Smart Drafts:** Generates professional, empathetic response drafts in seconds using OpenAI.

---

## 🛠️ Technical Architecture
This project was built using **AI-Assisted Development** on Replit.

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Backend** | **Python (Flask)** | RESTful API endpoints for CRUD operations and AI orchestration. |
| **Frontend** | **Bootstrap 5** | Responsive HTML dashboard with Jinja2 templating. |
| **Database** | **PostgreSQL** | Relational data storage using SQLAlchemy ORM for Users and Reviews. |
| **Intelligence** | **OpenAI API** | GPT-3.5-turbo for sentiment classification and response generation. |
| **Development** | **Replit Agent** | utilized for scaffolding, debugging, and schema design. |

---

## Quick Start (Local & Replit)

**Prerequisites:** Python 3.10+, OpenAI API Key.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/choudhry26usman/DriftSignal.git](https://github.com/choudhry26usman/DriftSignal.git)
    cd DriftSignal
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment**
    Create a `.env` file:
    ```env
    OPENAI_API_KEY=sk-proj-...
    DATABASE_URL=postgresql://...
    SECRET_KEY=...
    ```

4.  **Run the App**
    ```bash
    python main.py
    ```

---

## 👥 The Drift Team (Haskayne MBA - ENTI633)
* **Sam:** Strategy & Product Management
* **Reid:** Development Lead
* **Usman:** GitHub & Product Management 
* **Mark:** Business Analysis
* **Mike:** QA & User Testing

---

*Licensed under the [MIT License](LICENSE).*



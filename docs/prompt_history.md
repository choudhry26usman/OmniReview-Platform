# Engineering Log: AI Prompt History

The following prompts were used with Replit AI Agent to build the core infrastructure of DriftSignal.

## Phase 1: Project Scaffolding
**Goal:** Set up the Python/Flask environment.
**Prompt:**
> "Create a Flask web application with user authentication, PostgreSQL database connection, and a basic dashboard route. Include SQLAlchemy models for Users and Reviews. Set up a proper project structure with separate files for models, routes, and configuration."
**Outcome:** AI generated `app.py`, `models.py`, `routes.py`, and `requirements.txt`. Saved ~4 hours of setup.

## Phase 2: Database Schema
**Goal:** Define the data model for reviews.
**Prompt:**
> "Add SQLAlchemy models for a review management system. The Review model should include: review_text (text), rating (integer 1-5), platform_source (string for Amazon/Shopify/eBay/Website), sentiment_score (float), category (string), severity (string), created_at (datetime), responded (boolean), and response_text (text). Create a proper relationship to the User model."
**Outcome:** AI generated the correct SQL relationships and Foreign Keys.

## Phase 3: Frontend Dashboard
**Goal:** Create the UI without writing CSS from scratch.
**Prompt:**
> "Create an HTML dashboard template using Bootstrap 5 that displays a list of reviews. Each review card should show: the review text, star rating (as visual stars), platform source with a colored badge, sentiment indicator (green/yellow/red), category tag, and severity level. Include a filter sidebar for platform, date range, and rating."
**Outcome:** Generated a responsive Bootstrap layout with correct Jinja2 loops.

## Phase 4: AI Sentiment Function
**Goal:** Connect to OpenAI.
**Prompt:**
> "Add a function that uses OpenAI's API to analyze the sentiment of a review. The function should: take review text as input, call GPT-3.5-turbo with a prompt asking for sentiment classification (positive/negative/neutral) and a severity score (1-10), parse the response to extract structured data, and return a dictionary with sentiment, severity, and confidence score."

## Phase 5: Debugging
**Goal:** Fix a SQL Delete error.
**Prompt:**
> "I'm getting a 'FOREIGN KEY constraint failed' error when trying to delete a user who has reviews. How do I fix the SQLAlchemy relationship to handle cascading deletes properly?"
**Outcome:** AI suggested adding `cascade='all, delete-orphan'` to the User model.

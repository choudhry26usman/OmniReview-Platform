import { useState, useEffect, useCallback } from "react";
import { TourContext } from "@/hooks/use-tour";
import { useLocation } from "wouter";
import "shepherd.js/dist/css/shepherd.css";

interface ShepherdTour {
  addSteps: (steps: object[]) => void;
  start: () => void;
  complete: () => void;
  cancel: () => void;
  isActive: () => boolean;
  on: (event: string, handler: () => void) => void;
}

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tour, setTour] = useState<ShepherdTour | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const loadShepherd = async () => {
      const { default: Shepherd } = await import("shepherd.js");

      const newTour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: "shepherd-theme-custom",
          scrollTo: { behavior: "smooth", block: "center" },
          cancelIcon: {
            enabled: true,
          },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 8,
        },
      });

      newTour.addSteps([
        // ===== WELCOME =====
        {
          id: "welcome",
          title: "Welcome to DriftSignal!",
          text: `
            <p>Let's take a quick tour of the platform to help you manage customer reviews across all your marketplaces.</p>
            <p class="mt-2 text-sm text-muted-foreground">We'll visit each module and explore the key features.</p>
          `,
          buttons: [
            {
              text: "Skip Tour",
              action() { this.complete(); },
              secondary: true,
            },
            {
              text: "Let's Go!",
              action() { this.next(); },
            },
          ],
        },

        // ===== DASHBOARD MODULE =====
        {
          id: "dashboard-intro",
          title: "Dashboard Overview",
          text: `
            <p>This is your <strong>Dashboard</strong> - your central hub for all reviews.</p>
            <p class="mt-2 text-sm">Here you can see tracked products, summary stats, and all imported reviews at a glance.</p>
          `,
          attachTo: {
            element: '[data-testid="link-dashboard"]',
            on: "right",
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "import-reviews",
          title: "Import Reviews",
          text: `
            <p><strong>Import Reviews</strong> from multiple sources:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Amazon (via product URL or ASIN)</li>
              <li>Walmart (via product URL)</li>
              <li>Shopify (via store connection)</li>
              <li>CSV/JSON file uploads</li>
              <li>Email inbox (Outlook)</li>
            </ul>
            <p class="mt-2 text-sm">Reviews are automatically analyzed by AI for sentiment, category, and severity.</p>
          `,
          attachTo: {
            element: '[data-testid="button-import"]',
            on: "right",
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "advanced-filters",
          title: "Advanced Filters",
          text: `
            <p>Use <strong>Advanced Filters</strong> to narrow down reviews by:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Marketplace (Amazon, Walmart, Shopify, Email)</li>
              <li>Date range</li>
              <li>Sentiment (positive/negative/neutral)</li>
              <li>Severity level</li>
              <li>Status (open/in-progress/resolved)</li>
              <li>Product</li>
            </ul>
            <p class="mt-2 text-sm">You can also export filtered data as CSV.</p>
          `,
          attachTo: {
            element: '[data-testid="button-filters"]',
            on: "right",
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "dashboard-stats",
          title: "Dashboard Stats",
          text: `
            <p>These <strong>stat cards</strong> give you a quick overview:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>Total Reviews</strong> - All imported reviews</li>
              <li><strong>Avg. Rating</strong> - Average star rating</li>
              <li><strong>Pending</strong> - Reviews awaiting action</li>
              <li><strong>Resolved</strong> - Completed reviews</li>
            </ul>
            <p class="mt-2 text-sm">Stats update based on your active filters.</p>
          `,
          attachTo: {
            element: '[data-testid="stat-total-reviews"]',
            on: "bottom",
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Go to Workflow",
              action() { 
                const el = document.querySelector('[data-testid="link-workflow"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.next(), 400);
              },
            },
          ],
        },

        // ===== WORKFLOW MODULE =====
        {
          id: "workflow-intro",
          title: "Workflow Management",
          text: `
            <p>Welcome to <strong>Workflow Management</strong>!</p>
            <p class="mt-2 text-sm">This Kanban-style board helps you organize and track review responses through different stages.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 400));
          },
          buttons: [
            {
              text: "Back",
              action() { 
                const el = document.querySelector('[data-testid="link-dashboard"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.back(), 400);
              },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "workflow-columns",
          title: "Kanban Columns",
          text: `
            <p>Reviews move through three stages:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>Open</strong> - New reviews needing attention</li>
              <li><strong>In Progress</strong> - Currently being handled</li>
              <li><strong>Resolved</strong> - Completed reviews</li>
            </ul>
            <p class="mt-2 text-sm"><strong>Drag and drop</strong> cards between columns to update their status instantly.</p>
          `,
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "workflow-filters",
          title: "Workflow Filters",
          text: `
            <p>Use the <strong>filter panel</strong> to focus on specific reviews:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Filter by product, marketplace, sentiment</li>
              <li>Filter by severity and rating</li>
              <li>Set date range for time-based views</li>
            </ul>
            <p class="mt-2 text-sm">Click on any card to view full details and generate AI replies.</p>
          `,
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Go to Analytics",
              action() { 
                const el = document.querySelector('[data-testid="link-analytics"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.next(), 400);
              },
            },
          ],
        },

        // ===== ANALYTICS MODULE =====
        {
          id: "analytics-intro",
          title: "Analytics Dashboard",
          text: `
            <p>Welcome to <strong>Analytics</strong>!</p>
            <p class="mt-2 text-sm">Visualize your review data with interactive charts and track trends over time.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 400));
          },
          buttons: [
            {
              text: "Back",
              action() { 
                const el = document.querySelector('[data-testid="link-workflow"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.back(), 400);
              },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "analytics-charts",
          title: "Analytics Charts",
          text: `
            <p>Key visualizations include:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>Rating Distribution</strong> - Star rating breakdown</li>
              <li><strong>Sentiment Analysis</strong> - Positive/negative/neutral split</li>
              <li><strong>Status Distribution</strong> - Open vs resolved reviews</li>
              <li><strong>Trends Over Time</strong> - Review patterns</li>
            </ul>
            <p class="mt-2 text-sm">All charts respect your active filters from the sidebar.</p>
          `,
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Go to Settings",
              action() { 
                const el = document.querySelector('[data-testid="link-settings"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.next(), 400);
              },
            },
          ],
        },

        // ===== SETTINGS MODULE =====
        {
          id: "settings-intro",
          title: "Settings & Integrations",
          text: `
            <p>Welcome to <strong>Settings</strong>!</p>
            <p class="mt-2 text-sm">Manage your integrations and check connection status for all services.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 400));
          },
          buttons: [
            {
              text: "Back",
              action() { 
                const el = document.querySelector('[data-testid="link-analytics"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.back(), 400);
              },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "settings-integrations",
          title: "Integration Status",
          text: `
            <p>Check the status of your integrations:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>AI (OpenRouter)</strong> - Powers sentiment analysis & replies</li>
              <li><strong>Amazon API</strong> - Fetches Amazon reviews</li>
              <li><strong>Walmart API</strong> - Fetches Walmart reviews</li>
              <li><strong>Outlook</strong> - Email sync & sending replies</li>
            </ul>
            <p class="mt-2 text-sm">Green checkmarks indicate active connections.</p>
          `,
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Go to Help & FAQ",
              action() { 
                const el = document.querySelector('[data-testid="link-faq"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.next(), 400);
              },
            },
          ],
        },

        // ===== FAQ MODULE =====
        {
          id: "faq-intro",
          title: "Help & FAQ",
          text: `
            <p>Welcome to <strong>Help & FAQ</strong>!</p>
            <p class="mt-2 text-sm">Find answers to common questions and learn how to get the most out of DriftSignal.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 400));
          },
          buttons: [
            {
              text: "Back",
              action() { 
                const el = document.querySelector('[data-testid="link-settings"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.back(), 400);
              },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "faq-features",
          title: "FAQ Topics",
          text: `
            <p>The FAQ covers key topics:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Importing reviews from marketplaces</li>
              <li>AI-powered analysis features</li>
              <li>Responding to reviews</li>
              <li>Managing workflow status</li>
              <li>Exporting data</li>
            </ul>
            <p class="mt-2 text-sm">You can restart this tour anytime from this page!</p>
          `,
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next",
              action() { this.next(); },
            },
          ],
        },

        // ===== RESPONDING TO REVIEWS =====
        {
          id: "responding-to-reviews",
          title: "Responding to Reviews",
          text: `
            <p><strong>How to respond to reviews:</strong></p>
            <ul class="mt-2 text-sm space-y-2">
              <li><strong>Amazon/Walmart/Shopify:</strong> Click a review, generate AI reply, then <strong>Copy Reply</strong> to paste in your seller portal.</li>
              <li><strong>Email (Mailbox):</strong> Click a review, generate AI reply, then <strong>Send via Outlook</strong> directly.</li>
            </ul>
            <p class="mt-2 text-sm">AI generates professional responses based on the review content and sentiment.</p>
          `,
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Finish Tour",
              action() { this.next(); },
            },
          ],
        },

        // ===== COMPLETE =====
        {
          id: "complete",
          title: "You're All Set!",
          text: `
            <p>Congratulations! You've completed the DriftSignal tour.</p>
            <p class="mt-2 text-sm"><strong>Quick recap:</strong></p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>Dashboard</strong> - View & filter all reviews</li>
              <li><strong>Workflow</strong> - Kanban board for status management</li>
              <li><strong>Analytics</strong> - Charts & trend analysis</li>
              <li><strong>Settings</strong> - Integration status</li>
              <li><strong>Help & FAQ</strong> - Support & this tour</li>
            </ul>
            <p class="mt-3 text-sm text-primary font-medium">Start importing reviews to get started!</p>
          `,
          buttons: [
            {
              text: "Go to Dashboard",
              action() { 
                const el = document.querySelector('[data-testid="link-dashboard"]') as HTMLElement;
                if (el) el.click();
                this.complete(); 
              },
            },
          ],
        },
      ]);

      newTour.on("complete", () => {
        setIsTourActive(false);
      });

      newTour.on("cancel", () => {
        setIsTourActive(false);
      });

      setTour(newTour);
    };

    loadShepherd();
  }, []);

  const startTour = useCallback(() => {
    if (tour) {
      navigate("/");
      setTimeout(() => {
        setIsTourActive(true);
        tour.start();
      }, 100);
    }
  }, [tour, navigate]);

  const endTour = useCallback(() => {
    if (tour) {
      tour.complete();
      setIsTourActive(false);
    }
  }, [tour]);

  return (
    <TourContext.Provider value={{ startTour, endTour, isTourActive }}>
      {children}
    </TourContext.Provider>
  );
}

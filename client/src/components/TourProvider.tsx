import { useState, useEffect, useCallback } from "react";
import { TourContext } from "@/hooks/use-tour";
import { useLocation } from "wouter";
import "shepherd.js/dist/css/shepherd.css";
import type Shepherd from "shepherd.js";

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tour, setTour] = useState<Shepherd.Tour | null>(null);
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
        {
          id: "welcome",
          title: "Welcome to DriftSignal!",
          text: `
            <p>Let's take a quick tour of the platform to help you manage customer reviews across all your marketplaces.</p>
            <p class="mt-2 text-sm text-muted-foreground">This tour will guide you through the key features.</p>
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
        {
          id: "sidebar-nav",
          title: "Navigation Sidebar",
          text: `
            <p>This is your main navigation. From here you can access:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>Dashboard</strong> - View all your reviews</li>
              <li><strong>Workflow</strong> - Manage review status</li>
              <li><strong>Analytics</strong> - Track trends</li>
              <li><strong>Settings</strong> - Configure integrations</li>
            </ul>
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
            <p><strong>Click this button</strong> to import reviews from:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Amazon (via product URL or ASIN)</li>
              <li>Walmart (via product URL)</li>
              <li>Shopify (via store connection)</li>
              <li>CSV/JSON file uploads</li>
              <li>Email inbox (Outlook)</li>
            </ul>
            <p class="mt-2 text-sm text-primary font-medium">Click "Import Reviews" to try it!</p>
          `,
          attachTo: {
            element: '[data-testid="button-import"]',
            on: "right",
          },
          advanceOn: {
            selector: '[data-testid="button-import"]',
            event: "click",
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Skip This Step",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "import-modal",
          title: "Import Modal",
          text: `
            <p>This is the Import Reviews modal. You can:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Select a marketplace tab</li>
              <li>Enter the product URL or ID</li>
              <li>Upload a CSV/JSON file</li>
            </ul>
            <p class="mt-2 text-sm">Reviews are automatically analyzed by AI for sentiment, category, and severity.</p>
            <p class="mt-2 text-sm text-primary font-medium">Close this modal to continue the tour.</p>
          `,
          attachTo: {
            element: '[role="dialog"]',
            on: "left",
          },
          buttons: [
            {
              text: "Continue Tour",
              action() { 
                const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]') as HTMLButtonElement;
                if (closeBtn) closeBtn.click();
                this.next(); 
              },
            },
          ],
        },
        {
          id: "marketplace-filters",
          title: "Marketplace Filters",
          text: `
            <p>Filter reviews by marketplace:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>All Marketplaces</strong> - See everything</li>
              <li><strong>Amazon</strong> - Amazon reviews only</li>
              <li><strong>Walmart</strong> - Walmart reviews only</li>
              <li><strong>Shopify</strong> - Shopify reviews only</li>
              <li><strong>Mailbox</strong> - Email imports</li>
            </ul>
          `,
          attachTo: {
            element: '[data-testid="link-marketplace-all"]',
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
            <p>Need more filtering options?</p>
            <p class="mt-2 text-sm">Use <strong>Advanced Filters</strong> to filter by:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Date range</li>
              <li>Sentiment (positive/negative/neutral)</li>
              <li>Severity level</li>
              <li>Status (open/in-progress/resolved)</li>
              <li>Product category</li>
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
          id: "go-to-workflow",
          title: "Workflow Management",
          text: `
            <p>Now let's see the <strong>Workflow Board</strong>!</p>
            <p class="mt-2 text-sm">This is where you organize review responses using a Kanban-style board.</p>
            <p class="mt-2 text-sm text-primary font-medium">Click "Workflow Management" to continue.</p>
          `,
          attachTo: {
            element: '[data-testid="link-workflow"]',
            on: "right",
          },
          advanceOn: {
            selector: '[data-testid="link-workflow"]',
            event: "click",
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Skip to Analytics",
              action() { 
                const el = document.querySelector('[data-testid="link-analytics"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.show("analytics-page"), 300);
              },
            },
          ],
        },
        {
          id: "workflow-page",
          title: "Kanban Workflow Board",
          text: `
            <p>This is your <strong>Workflow Board</strong>!</p>
            <ul class="mt-2 text-sm space-y-1">
              <li><strong>Open</strong> - New reviews needing attention</li>
              <li><strong>In Progress</strong> - Currently being handled</li>
              <li><strong>Resolved</strong> - Completed reviews</li>
            </ul>
            <p class="mt-2 text-sm">Drag and drop cards between columns to update their status.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 300));
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next: Analytics",
              action() { 
                const el = document.querySelector('[data-testid="link-analytics"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.next(), 300);
              },
            },
          ],
        },
        {
          id: "analytics-page",
          title: "Analytics Dashboard",
          text: `
            <p>Welcome to <strong>Analytics</strong>!</p>
            <p class="mt-2 text-sm">Here you can see:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Rating distribution charts</li>
              <li>Sentiment breakdowns</li>
              <li>Status distribution</li>
              <li>Trends over time</li>
            </ul>
            <p class="mt-2 text-sm">All charts respect your current filters.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 300));
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Next: Settings",
              action() { 
                const el = document.querySelector('[data-testid="link-settings"]') as HTMLElement;
                if (el) el.click();
                setTimeout(() => this.next(), 300);
              },
            },
          ],
        },
        {
          id: "settings-page",
          title: "Settings & Integrations",
          text: `
            <p>This is the <strong>Settings</strong> page.</p>
            <p class="mt-2 text-sm">Here you can:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Check API integration status</li>
              <li>Connect your Outlook email</li>
              <li>Verify AI, Amazon, and Walmart connections</li>
            </ul>
            <p class="mt-2 text-sm">Green checkmarks indicate active connections.</p>
          `,
          beforeShowPromise: function() {
            return new Promise<void>((resolve) => setTimeout(resolve, 300));
          },
          buttons: [
            {
              text: "Back",
              action() { this.back(); },
              secondary: true,
            },
            {
              text: "Final Step",
              action() { this.next(); },
            },
          ],
        },
        {
          id: "responding-to-reviews",
          title: "Responding to Reviews",
          text: `
            <p><strong>How to respond to reviews:</strong></p>
            <ul class="mt-2 text-sm space-y-2">
              <li><strong>Amazon/Walmart/Shopify:</strong> Click a review, go to Response tab, generate AI reply, then <strong>Copy Reply</strong> to paste in your seller portal.</li>
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
              action() { this.complete(); },
            },
          ],
        },
        {
          id: "complete",
          title: "You're All Set!",
          text: `
            <p>Congratulations! You now know how to use DriftSignal.</p>
            <p class="mt-2 text-sm"><strong>Quick recap:</strong></p>
            <ul class="mt-2 text-sm space-y-1">
              <li>Import reviews from marketplaces or files</li>
              <li>AI analyzes sentiment, category & severity</li>
              <li>Manage workflow with Kanban board</li>
              <li>Track analytics and trends</li>
              <li>Respond using AI-generated replies</li>
            </ul>
            <p class="mt-3 text-sm text-primary font-medium">Visit Help & FAQ anytime to restart this tour!</p>
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

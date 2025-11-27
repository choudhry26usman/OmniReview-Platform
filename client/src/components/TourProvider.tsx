import { useState, useEffect } from "react";
import { TourContext } from "@/hooks/use-tour";
import "shepherd.js/dist/css/shepherd.css";

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tour, setTour] = useState<any>(null);

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
        },
      });

      newTour.addSteps([
        {
          id: "welcome",
          title: "Welcome to DriftSignal",
          text: "Let's take a quick tour of the platform to get you started managing reviews across all your marketplaces.",
          buttons: [
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "dashboard",
          title: "Dashboard - Your Command Center",
          text: "This is your dashboard. All your reviews from Amazon, Walmart, Shopify, and email are aggregated here. You can see stats, filter by marketplace, and manage your feedback.",
          attachTo: {
            element: '[data-testid="page-dashboard"]',
            on: "bottom",
          },
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "review-cards",
          title: "Review Cards",
          text: "Each card shows a review with sentiment (positive/negative/neutral), AI category, and severity. Click any card to see full details and AI analysis.",
          attachTo: {
            element: '[data-testid="card-review"]',
            on: "top",
          },
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "ai-analysis",
          title: "AI-Powered Intelligence",
          text: "Our AI analyzes each review for sentiment, categorizes the issue from 12 product categories, assesses severity, and even suggests professional responses.",
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "workflow",
          title: "Workflow Board - Manage Your Pipeline",
          text: "Organize your review responses with our Kanban board. Drag reviews between Open, In Progress, and Resolved columns to track your team's progress.",
          attachTo: {
            element: '[data-testid="page-workflow"]',
            on: "bottom",
          },
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "analytics",
          title: "Analytics - Understand Your Feedback",
          text: "Track trends, see rating distributions, sentiment breakdowns, and status metrics. All charts respect your filters for deep insights.",
          attachTo: {
            element: '[data-testid="page-analytics"]',
            on: "bottom",
          },
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "respond",
          title: "Respond to Reviews",
          text: "For marketplace reviews (Amazon/Walmart/Shopify): Copy the AI-suggested reply and paste it into the seller portal. For email reviews: Send directly via Outlook.",
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "settings",
          title: "Settings & Integrations",
          text: "Verify your API integrations are active (AI, Amazon, Walmart, Outlook) and connect your email for importing customer messages.",
          attachTo: {
            element: '[data-testid="page-settings"]',
            on: "bottom",
          },
          buttons: [
            {
              action() {
                return this.back();
              },
              text: "Back",
            },
            {
              action() {
                return this.next();
              },
              text: "Next",
            },
          ],
        },
        {
          id: "complete",
          title: "You're All Set!",
          text: "You're ready to start managing reviews. Visit the FAQ page anytime to restart this tour or get answers to common questions.",
          buttons: [
            {
              action() {
                this.complete();
              },
              text: "Finish Tour",
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

  const startTour = () => {
    if (tour) {
      setIsTourActive(true);
      tour.start();
    }
  };

  const endTour = () => {
    if (tour) {
      tour.complete();
      setIsTourActive(false);
    }
  };

  return (
    <TourContext.Provider value={{ startTour, endTour, isTourActive }}>
      {children}
    </TourContext.Provider>
  );
}

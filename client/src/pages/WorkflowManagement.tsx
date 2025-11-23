import { useState } from "react";
import { WorkflowBoard, WorkflowColumn } from "@/components/WorkflowBoard";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";

const mockReviews = [
  {
    id: "k1",
    marketplace: "Amazon" as const,
    title: "Product arrived damaged, very disappointed",
    content: "I ordered this product with high expectations, but it arrived with visible damage to the packaging and the item itself. The customer service was slow to respond. I expected better quality control from this seller.",
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
    rating: 2,
    sentiment: "negative" as const,
    category: "defect",
    severity: "high" as const,
    status: "open",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "k2",
    marketplace: "eBay" as const,
    title: "Great product, fast shipping!",
    content: "Exactly as described, arrived two days early. Excellent packaging and the quality exceeded my expectations. Will definitely order from this seller again!",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@example.com",
    rating: 5,
    sentiment: "positive" as const,
    category: "shipping",
    severity: "low" as const,
    status: "resolved",
    createdAt: new Date("2024-01-14"),
  },
  {
    id: "k3",
    marketplace: "Shopify" as const,
    title: "Product is okay but customer service needs improvement",
    content: "The product itself is decent and works as advertised. However, I had a question before purchasing and it took 3 days to get a response. The quality is good but the support experience could be better.",
    customerName: "Mike Davis",
    customerEmail: "mike.davis@example.com",
    rating: 3,
    sentiment: "neutral" as const,
    category: "service",
    severity: "medium" as const,
    status: "in_progress",
    createdAt: new Date("2024-01-13"),
  },
  {
    id: "k4",
    marketplace: "PayPal" as const,
    title: "Wrong item sent, requesting refund",
    content: "I ordered a blue medium shirt but received a red small instead. This is completely wrong and I need this resolved immediately. I've been trying to contact support but haven't heard back.",
    customerName: "Emily Chen",
    customerEmail: "emily.chen@example.com",
    sentiment: "negative" as const,
    category: "shipping",
    severity: "critical" as const,
    status: "open",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "k5",
    marketplace: "Alibaba" as const,
    title: "Bulk order exceeded expectations",
    content: "Ordered 500 units for our retail business. Quality is consistent across all items, packaging was professional, and shipping was faster than quoted. Price point is excellent for the quality received.",
    customerName: "Robert Williams",
    customerEmail: "robert.w@example.com",
    rating: 5,
    sentiment: "positive" as const,
    category: "quality",
    severity: "low" as const,
    status: "resolved",
    createdAt: new Date("2024-01-12"),
  },
  {
    id: "k6",
    marketplace: "Website" as const,
    title: "Shipping took longer than expected",
    content: "The product is fine and as described, but it took 2 weeks to arrive when the website said 7-10 days. Would have been nice to get an update about the delay.",
    customerName: "Lisa Anderson",
    customerEmail: "lisa.a@example.com",
    rating: 3,
    sentiment: "neutral" as const,
    category: "shipping",
    severity: "medium" as const,
    status: "in_progress",
    createdAt: new Date("2024-01-11"),
  },
];

const mockColumns: WorkflowColumn[] = [
  {
    id: "open",
    title: "Open",
    reviews: [
      {
        id: "k1",
        marketplace: "Amazon",
        title: "Product arrived damaged, very disappointed",
        severity: "high",
        category: "defect",
      },
      {
        id: "k4",
        marketplace: "PayPal",
        title: "Wrong item sent, requesting refund",
        severity: "critical",
        category: "shipping",
      },
    ],
  },
  {
    id: "in_progress",
    title: "In Progress",
    reviews: [
      {
        id: "k3",
        marketplace: "Shopify",
        title: "Product is okay but customer service needs improvement",
        severity: "medium",
        category: "service",
      },
      {
        id: "k6",
        marketplace: "Website",
        title: "Shipping took longer than expected",
        severity: "medium",
        category: "shipping",
      },
    ],
  },
  {
    id: "resolved",
    title: "Resolved",
    reviews: [
      {
        id: "k2",
        marketplace: "eBay",
        title: "Great product, fast shipping!",
        severity: "low",
        category: "shipping",
      },
      {
        id: "k5",
        marketplace: "Alibaba",
        title: "Bulk order exceeded expectations",
        severity: "low",
        category: "quality",
      },
    ],
  },
];

export default function WorkflowManagement() {
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null);

  const handleReviewMove = (reviewId: string, sourceColumn: string, destColumn: string) => {
    console.log(`Review ${reviewId} moved from ${sourceColumn} to ${destColumn}`);
  };

  const handleCardClick = (reviewId: string) => {
    const review = mockReviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReview(review);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Workflow Management</h1>
        <p className="text-sm text-muted-foreground">
          Organize and track review progress by dragging cards between workflow stages
        </p>
      </div>

      <WorkflowBoard columns={mockColumns} onReviewMove={handleReviewMove} onCardClick={handleCardClick} />

      {selectedReview && (
        <ReviewDetailModal
          open={!!selectedReview}
          onOpenChange={(open) => !open && setSelectedReview(null)}
          review={selectedReview}
        />
      )}
    </div>
  );
}

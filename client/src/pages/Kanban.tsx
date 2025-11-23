import { KanbanBoard, KanbanColumn } from "@/components/KanbanBoard";

// todo: remove mock functionality
const mockColumns: KanbanColumn[] = [
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

export default function Kanban() {
  const handleReviewMove = (reviewId: string, sourceColumn: string, destColumn: string) => {
    console.log(`Review ${reviewId} moved from ${sourceColumn} to ${destColumn}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <p className="text-sm text-muted-foreground">
          Manage review workflow by dragging cards between columns
        </p>
      </div>

      <KanbanBoard columns={mockColumns} onReviewMove={handleReviewMove} />
    </div>
  );
}

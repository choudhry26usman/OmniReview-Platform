import { KanbanBoard } from '../KanbanBoard';

export default function KanbanBoardExample() {
  const mockColumns = [
    {
      id: "open",
      title: "Open",
      reviews: [
        {
          id: "1",
          marketplace: "Amazon" as const,
          title: "Product damaged",
          severity: "high",
          category: "defect",
        },
      ],
    },
    {
      id: "in_progress",
      title: "In Progress",
      reviews: [
        {
          id: "2",
          marketplace: "eBay" as const,
          title: "Slow shipping",
          severity: "medium",
          category: "shipping",
        },
      ],
    },
    {
      id: "resolved",
      title: "Resolved",
      reviews: [],
    },
  ];

  return (
    <div className="p-6">
      <KanbanBoard 
        columns={mockColumns} 
        onReviewMove={(id, from, to) => console.log(`Moved ${id} from ${from} to ${to}`)}
      />
    </div>
  );
}

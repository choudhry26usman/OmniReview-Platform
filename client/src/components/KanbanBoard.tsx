import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiAmazon, SiEbay, SiShopify, SiPaypal, SiAlibabadotcom } from "react-icons/si";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const marketplaceIcons = {
  Amazon: SiAmazon,
  eBay: SiEbay,
  Shopify: SiShopify,
  PayPal: SiPaypal,
  Alibaba: SiAlibabadotcom,
  Website: Globe,
};

export interface KanbanReview {
  id: string;
  marketplace: keyof typeof marketplaceIcons;
  title: string;
  severity: string;
  category: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  reviews: KanbanReview[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onReviewMove?: (reviewId: string, sourceColumn: string, destColumn: string) => void;
}

export function KanbanBoard({ columns: initialColumns, onReviewMove }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceReviews = Array.from(sourceColumn.reviews);
    const destReviews = source.droppableId === destination.droppableId 
      ? sourceReviews 
      : Array.from(destColumn.reviews);

    const [movedReview] = sourceReviews.splice(source.index, 1);
    destReviews.splice(destination.index, 0, movedReview);

    const newColumns = columns.map((col) => {
      if (col.id === source.droppableId) {
        return { ...col, reviews: sourceReviews };
      }
      if (col.id === destination.droppableId && source.droppableId !== destination.droppableId) {
        return { ...col, reviews: destReviews };
      }
      return col;
    });

    setColumns(newColumns);
    onReviewMove?.(draggableId, source.droppableId, destination.droppableId);
    console.log(`Moved review ${draggableId} from ${source.droppableId} to ${destination.droppableId}`);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{column.title}</h3>
              <Badge variant="secondary">{column.reviews.length}</Badge>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 space-y-3 rounded-md p-4 min-h-[500px]",
                    snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
                  )}
                  data-testid={`column-${column.id}`}
                >
                  {column.reviews.map((review, index) => {
                    const MarketplaceIcon = marketplaceIcons[review.marketplace];
                    return (
                      <Draggable key={review.id} draggableId={review.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "cursor-grab active:cursor-grabbing",
                              snapshot.isDragging && "shadow-lg"
                            )}
                            data-testid={`kanban-card-${review.id}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <MarketplaceIcon className="h-4 w-4" />
                                <Badge variant="outline" className="text-xs">
                                  {review.marketplace}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-sm font-medium line-clamp-2">
                                {review.title}
                              </p>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {review.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {review.severity}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

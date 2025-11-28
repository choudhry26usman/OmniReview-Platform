import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiAmazon, SiShopify } from "react-icons/si";
import { WalmartLogo } from "@/components/WalmartLogo";
import { Mail, Star, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const marketplaceIcons = {
  Amazon: SiAmazon,
  Shopify: SiShopify,
  Walmart: WalmartLogo,
  Mailbox: Mail,
};

const sentimentConfig = {
  positive: { icon: ThumbsUp, color: "text-green-600 dark:text-green-400" },
  negative: { icon: ThumbsDown, color: "text-red-600 dark:text-red-400" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
};

export interface WorkflowReview {
  id: string;
  marketplace: keyof typeof marketplaceIcons;
  title: string;
  severity: string;
  category: string;
  rating?: number;
  sentiment?: keyof typeof sentimentConfig;
}

export interface WorkflowColumn {
  id: string;
  title: string;
  reviews: WorkflowReview[];
}

interface WorkflowBoardProps {
  columns: WorkflowColumn[];
  onReviewMove?: (reviewId: string, sourceColumn: string, destColumn: string) => void;
  onCardClick?: (reviewId: string) => void;
}

const getColumnColor = (columnId: string, isDraggingOver: boolean) => {
  const baseColors = {
    open: isDraggingOver ? "bg-red-100 dark:bg-red-950/40" : "bg-red-50 dark:bg-red-950/20",
    in_progress: isDraggingOver ? "bg-yellow-100 dark:bg-yellow-950/40" : "bg-yellow-50 dark:bg-yellow-950/20",
    resolved: isDraggingOver ? "bg-green-100 dark:bg-green-950/40" : "bg-green-50 dark:bg-green-950/20",
  };
  return baseColors[columnId as keyof typeof baseColors] || (isDraggingOver ? "bg-accent/50" : "bg-muted/30");
};

export function WorkflowBoard({ columns: initialColumns, onReviewMove, onCardClick }: WorkflowBoardProps) {
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
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
                    "flex-1 space-y-3 rounded-md p-3 sm:p-4 min-h-[300px] lg:min-h-[500px]",
                    getColumnColor(column.id, snapshot.isDraggingOver)
                  )}
                  data-testid={`column-${column.id}`}
                >
                  {column.reviews.map((review, index) => {
                    const MarketplaceIcon = marketplaceIcons[review.marketplace];
                    return (
                      <Draggable key={review.id} draggableId={review.id} index={index}>
                        {(provided, snapshot) => {
                          const SentimentIcon = review.sentiment ? sentimentConfig[review.sentiment].icon : null;
                          const sentimentColor = review.sentiment ? sentimentConfig[review.sentiment].color : "";
                          
                          return (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onCardClick?.(review.id)}
                              className={cn(
                                "cursor-grab active:cursor-grabbing hover-elevate",
                                snapshot.isDragging && "shadow-lg"
                              )}
                              data-testid={`workflow-card-${review.id}`}
                            >
                              <CardHeader className="pb-2 space-y-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <MarketplaceIcon className="h-3.5 w-3.5" />
                                    <span className="text-xs text-muted-foreground">{review.marketplace}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {review.rating !== undefined && review.rating !== null && (
                                      <div className="flex items-center gap-0.5">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-medium">{Math.round(review.rating)}</span>
                                      </div>
                                    )}
                                    {SentimentIcon && (
                                      <SentimentIcon className={cn("h-3.5 w-3.5", sentimentColor)} />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <p className="text-xs font-medium line-clamp-2 leading-relaxed">
                                  {review.title}
                                </p>
                                <div className="flex gap-1.5 flex-wrap">
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    {review.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {review.severity}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }}
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

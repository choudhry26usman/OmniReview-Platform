import { useState, useMemo, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiAmazon, SiShopify } from "react-icons/si";
import { WalmartLogo } from "@/components/WalmartLogo";
import { Mail, Star, ThumbsUp, ThumbsDown, Minus, ChevronDown, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  productId: string | null;
  productName: string;
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

interface ProductGroup {
  productKey: string;
  productName: string;
  marketplace: string;
  reviews: WorkflowReview[];
}

const getColumnColor = (columnId: string, isDraggingOver: boolean) => {
  const baseColors = {
    open: isDraggingOver ? "bg-red-100 dark:bg-red-950/40" : "bg-red-50 dark:bg-red-950/20",
    in_progress: isDraggingOver ? "bg-yellow-100 dark:bg-yellow-950/40" : "bg-yellow-50 dark:bg-yellow-950/20",
    resolved: isDraggingOver ? "bg-green-100 dark:bg-green-950/40" : "bg-green-50 dark:bg-green-950/20",
  };
  return baseColors[columnId as keyof typeof baseColors] || (isDraggingOver ? "bg-accent/50" : "bg-muted/30");
};

function ReviewCard({ 
  review, 
  index, 
  onCardClick 
}: { 
  review: WorkflowReview; 
  index: number; 
  onCardClick?: (reviewId: string) => void;
}) {
  const MarketplaceIcon = marketplaceIcons[review.marketplace];
  const SentimentIcon = review.sentiment ? sentimentConfig[review.sentiment].icon : null;
  const sentimentColor = review.sentiment ? sentimentConfig[review.sentiment].color : "";

  return (
    <Draggable key={review.id} draggableId={review.id} index={index}>
      {(provided, snapshot) => (
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
      )}
    </Draggable>
  );
}

function ProductSwimlane({
  group,
  columnId,
  startIndex,
  onCardClick,
  defaultOpen = true,
}: {
  group: ProductGroup;
  columnId: string;
  startIndex: number;
  onCardClick?: (reviewId: string) => void;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const MarketplaceIcon = marketplaceIcons[group.marketplace as keyof typeof marketplaceIcons] || Package;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3">
      <CollapsibleTrigger 
        className="flex items-center justify-between w-full p-2 rounded-md bg-background/60 hover-elevate border border-border/50 text-left"
        data-testid={`swimlane-${columnId}-${group.productKey}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MarketplaceIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{group.productName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            {group.reviews.length}
          </Badge>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {group.reviews.map((review, idx) => (
          <ReviewCard
            key={review.id}
            review={review}
            index={startIndex + idx}
            onCardClick={onCardClick}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WorkflowBoard({ columns: initialColumns, onReviewMove, onCardClick }: WorkflowBoardProps) {
  const [columns, setColumns] = useState(initialColumns);

  // Sync columns state when props change (filtering, search, new data)
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Group reviews by product within each column
  const columnsWithGroups = useMemo(() => {
    return columns.map(column => {
      const groups: ProductGroup[] = [];
      const productMap = new Map<string, ProductGroup>();

      column.reviews.forEach(review => {
        const productKey = `${review.marketplace}|${review.productId || 'unknown'}`;
        
        if (!productMap.has(productKey)) {
          const group: ProductGroup = {
            productKey,
            productName: review.productName || review.productId || 'Unknown Product',
            marketplace: review.marketplace,
            reviews: [],
          };
          productMap.set(productKey, group);
          groups.push(group);
        }
        
        productMap.get(productKey)!.reviews.push(review);
      });

      return { ...column, groups };
    });
  }, [columns]);

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

  // Calculate start index for each group's reviews
  const getStartIndex = (columnGroups: ProductGroup[], groupIndex: number) => {
    let index = 0;
    for (let i = 0; i < groupIndex; i++) {
      index += columnGroups[i].reviews.length;
    }
    return index;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {columnsWithGroups.map((column) => (
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
                    "flex-1 rounded-md p-3 sm:p-4 min-h-[300px] lg:min-h-[500px] max-h-[70vh] overflow-y-auto",
                    getColumnColor(column.id, snapshot.isDraggingOver)
                  )}
                  data-testid={`column-${column.id}`}
                >
                  {column.groups.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No reviews
                    </div>
                  ) : column.groups.length === 1 ? (
                    // If only one product group, show cards directly without swimlane header
                    <div className="space-y-3">
                      {column.groups[0].reviews.map((review, idx) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          index={idx}
                          onCardClick={onCardClick}
                        />
                      ))}
                    </div>
                  ) : (
                    // Multiple product groups - show swimlanes
                    column.groups.map((group, groupIndex) => (
                      <ProductSwimlane
                        key={group.productKey}
                        group={group}
                        columnId={column.id}
                        startIndex={getStartIndex(column.groups, groupIndex)}
                        onCardClick={onCardClick}
                        defaultOpen={group.reviews.length <= 5}
                      />
                    ))
                  )}
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

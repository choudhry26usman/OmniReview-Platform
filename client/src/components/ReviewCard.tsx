import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, ThumbsDown, Minus, MessageSquare, Globe } from "lucide-react";
import { SiAmazon, SiShopify, SiWalmart } from "react-icons/si";
import { cn } from "@/lib/utils";

const marketplaceIcons = {
  Amazon: SiAmazon,
  Shopify: SiShopify,
  Walmart: SiWalmart,
  Website: Globe,
};

const sentimentConfig = {
  positive: { icon: ThumbsUp, color: "text-chart-2" },
  negative: { icon: ThumbsDown, color: "text-destructive" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
};

const severityStyles = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
} as const;

interface ReviewCardProps {
  id: string;
  marketplace: keyof typeof marketplaceIcons;
  title: string;
  content: string;
  customerName: string;
  rating?: number;
  sentiment: keyof typeof sentimentConfig;
  category: string;
  severity: keyof typeof severityStyles;
  status: string;
  createdAt: Date;
  onViewDetails: () => void;
}

export function ReviewCard({
  id,
  marketplace,
  title,
  content,
  customerName,
  rating,
  sentiment,
  category,
  severity,
  status,
  createdAt,
  onViewDetails,
}: ReviewCardProps) {
  const MarketplaceIcon = marketplaceIcons[marketplace];
  const SentimentIcon = sentimentConfig[sentiment].icon;

  return (
    <Card className="hover-elevate" data-testid={`card-review-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MarketplaceIcon className="h-5 w-5" />
            <Badge variant="outline" className="text-xs">
              {marketplace}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(severityStyles[severity], "capitalize")}
              data-testid={`badge-severity-${id}`}
            >
              {severity}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <h3 className="text-base font-medium line-clamp-2 mb-1" data-testid={`text-title-${id}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            by {customerName}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-1", sentimentConfig[sentiment].color)}>
            <SentimentIcon className="h-4 w-4" />
            <span className="text-sm font-medium capitalize">{sentiment}</span>
          </div>
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating}/5</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {status.replace("_", " ")}
          </Badge>
        </div>

        <p className="text-sm line-clamp-3 text-muted-foreground">
          {content}
        </p>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1"
          onClick={onViewDetails}
          data-testid={`button-view-details-${id}`}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

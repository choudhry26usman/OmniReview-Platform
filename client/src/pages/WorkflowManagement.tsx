import { useState, useMemo } from "react";
import { WorkflowBoard, WorkflowColumn } from "@/components/WorkflowBoard";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { Review, Product } from "@shared/schema";

type Marketplace = "Amazon" | "Shopify" | "Walmart" | "Mailbox";
type Sentiment = "positive" | "neutral" | "negative";
type Status = "open" | "in_progress" | "resolved";
type Severity = "low" | "medium" | "high" | "critical";

export default function WorkflowManagement() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Marketplace[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<Sentiment[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const { toast } = useToast();

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedProduct("all");
    setSelectedMarketplaces([]);
    setSelectedSentiments([]);
    setSelectedSeverities([]);
    setSelectedRatings([]);
  };

  const toggleMarketplace = (marketplace: Marketplace) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplace)
        ? prev.filter(m => m !== marketplace)
        : [...prev, marketplace]
    );
  };

  const toggleSentiment = (sentiment: Sentiment) => {
    setSelectedSentiments(prev =>
      prev.includes(sentiment)
        ? prev.filter(s => s !== sentiment)
        : [...prev, sentiment]
    );
  };

  const toggleRating = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const toggleSeverity = (severity: Severity) => {
    setSelectedSeverities(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const activeFilterCount = 
    (dateRange.from || dateRange.to ? 1 : 0) +
    (selectedProduct && selectedProduct !== 'all' ? 1 : 0) +
    selectedMarketplaces.length +
    selectedSentiments.length +
    selectedSeverities.length +
    selectedRatings.length;

  // Fetch tracked products
  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/products/tracked'],
  });

  const products = productsData?.products || [];

  // Fetch all imported reviews
  const { data: importedReviewsData } = useQuery<{ reviews: Review[]; total: number }>({
    queryKey: ["/api/reviews/imported"],
  });

  const allReviews = useMemo(() => {
    let reviews = importedReviewsData?.reviews || [];
    
    // Filter by selected product using pipe delimiter
    if (selectedProduct && selectedProduct !== "all") {
      const [platform, productId] = selectedProduct.split('|');
      reviews = reviews.filter(r => r.marketplace === platform && r.productId === productId);
    }
    
    // Filter by marketplace
    if (selectedMarketplaces.length > 0) {
      reviews = reviews.filter(r => selectedMarketplaces.includes(r.marketplace as Marketplace));
    }
    
    // Filter by sentiment
    if (selectedSentiments.length > 0) {
      reviews = reviews.filter(r => selectedSentiments.includes(r.sentiment as Sentiment));
    }
    
    // Filter by severity
    if (selectedSeverities.length > 0) {
      reviews = reviews.filter(r => selectedSeverities.includes(r.severity as Severity));
    }
    
    // Filter by rating
    if (selectedRatings.length > 0) {
      reviews = reviews.filter(r => selectedRatings.includes(Math.round(r.rating)));
    }
    
    // Filter by date range (with end-of-day handling)
    if (dateRange.from || dateRange.to) {
      reviews = reviews.filter(r => {
        const reviewDate = new Date(r.createdAt);
        if (dateRange.from && reviewDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (reviewDate > endOfDay) return false;
        }
        return true;
      });
    }
    
    return reviews;
  }, [importedReviewsData, selectedProduct, selectedMarketplaces, selectedSentiments, selectedSeverities, selectedRatings, dateRange]);

  // Organize reviews into columns by status
  const workflowColumns: WorkflowColumn[] = useMemo(() => {
    const openReviews = allReviews.filter(r => r.status === "open");
    const inProgressReviews = allReviews.filter(r => r.status === "in_progress");
    const resolvedReviews = allReviews.filter(r => r.status === "resolved");

    return [
      {
        id: "open",
        title: "Open",
        reviews: openReviews.map(r => ({
          id: r.id,
          marketplace: r.marketplace,
          title: r.title,
          severity: r.severity,
          category: r.category,
          rating: r.rating,
          sentiment: r.sentiment,
        })),
      },
      {
        id: "in_progress",
        title: "In Progress",
        reviews: inProgressReviews.map(r => ({
          id: r.id,
          marketplace: r.marketplace,
          title: r.title,
          severity: r.severity,
          category: r.category,
          rating: r.rating,
          sentiment: r.sentiment,
        })),
      },
      {
        id: "resolved",
        title: "Resolved",
        reviews: resolvedReviews.map(r => ({
          id: r.id,
          marketplace: r.marketplace,
          title: r.title,
          severity: r.severity,
          category: r.category,
          rating: r.rating,
          sentiment: r.sentiment,
        })),
      },
    ];
  }, [allReviews]);

  // Mutation to update review status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: string }) => {
      const response = await fetch(`/api/reviews/${reviewId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update review status");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      toast({
        title: "Status Updated",
        description: "Review status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update review status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReviewMove = (reviewId: string, _sourceColumn: string, destColumn: string) => {
    updateStatusMutation.mutate({ reviewId, status: destColumn });
  };

  const handleCardClick = (reviewId: string) => {
    const review = allReviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReview(review);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Management</h1>
          <p className="text-sm text-muted-foreground">
            Organize and track review progress by dragging cards between workflow stages
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary/20 border border-primary/30 text-foreground rounded-full px-4 text-sm"
                data-testid="button-toggle-filters-workflow"
              >
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} data-testid="button-clear-all-filters-workflow">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-sm" data-testid="button-date-range-filter-workflow">
                        <Calendar className="h-4 w-4 mr-2" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                          : 'Select date range'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="text-sm" data-testid="select-product-filter-workflow">
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      {products.map((product: any) => (
                        <SelectItem key={`${product.platform}|${product.productId}`} value={`${product.platform}|${product.productId}`}>
                          {product.productName} ({product.platform})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Marketplace</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['Amazon', 'Shopify', 'Walmart', 'Mailbox'] as Marketplace[]).map(marketplace => (
                      <Badge
                        key={marketplace}
                        variant={selectedMarketplaces.includes(marketplace) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate text-sm"
                        onClick={() => toggleMarketplace(marketplace)}
                        data-testid={`filter-marketplace-${marketplace.toLowerCase()}-workflow`}
                      >
                        {marketplace}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Sentiment</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['positive', 'neutral', 'negative'] as Sentiment[]).map(sentiment => (
                      <Badge
                        key={sentiment}
                        variant={selectedSentiments.includes(sentiment) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate capitalize text-sm"
                        onClick={() => toggleSentiment(sentiment)}
                        data-testid={`filter-sentiment-${sentiment}-workflow`}
                      >
                        {sentiment}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Severity</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['low', 'medium', 'high', 'critical'] as Severity[]).map(severity => (
                      <Badge
                        key={severity}
                        variant={selectedSeverities.includes(severity) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate capitalize text-sm"
                        onClick={() => toggleSeverity(severity)}
                        data-testid={`filter-severity-${severity}-workflow`}
                      >
                        {severity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Rating</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <Badge
                        key={rating}
                        variant={selectedRatings.includes(rating) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate text-sm"
                        onClick={() => toggleRating(rating)}
                        data-testid={`filter-rating-${rating}-workflow`}
                      >
                        {rating} ★
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <WorkflowBoard columns={workflowColumns} onReviewMove={handleReviewMove} onCardClick={handleCardClick} />

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

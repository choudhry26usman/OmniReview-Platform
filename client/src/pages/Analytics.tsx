import { useState, useMemo } from "react";
import { StatCard } from "@/components/StatCard";
import { 
  SentimentTrendChart, 
  CategoryDistributionChart, 
  MarketplaceDistributionChart,
  RatingDistributionChart,
  StatusDistributionChart
} from "@/components/AnalyticsCharts";
import { TrendingUp, TrendingDown, Star, Target, Calendar, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

type Marketplace = "Amazon" | "Shopify" | "Walmart" | "Mailbox";
type Sentiment = "positive" | "neutral" | "negative";
type Status = "open" | "in_progress" | "resolved";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Marketplace[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<Sentiment[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch tracked products
  const { data: productsData } = useQuery<{ products: any[] }>({
    queryKey: ['/api/products/tracked'],
  });

  const products = productsData?.products || [];

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange.from) {
      params.append('startDate', dateRange.from.toISOString());
    }
    if (dateRange.to) {
      params.append('endDate', dateRange.to.toISOString());
    }
    if (selectedProduct && selectedProduct !== 'all') {
      params.append('productId', selectedProduct);
    }
    if (selectedMarketplaces.length > 0) {
      params.append('marketplaces', selectedMarketplaces.join(','));
    }
    if (selectedSentiments.length > 0) {
      params.append('sentiments', selectedSentiments.join(','));
    }
    if (selectedStatuses.length > 0) {
      params.append('statuses', selectedStatuses.join(','));
    }
    if (selectedRatings.length > 0) {
      params.append('ratings', selectedRatings.join(','));
    }
    return params.toString();
  }, [dateRange, selectedProduct, selectedMarketplaces, selectedSentiments, selectedStatuses, selectedRatings]);

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics', queryParams],
    queryFn: async () => {
      const url = queryParams ? `/api/analytics?${queryParams}` : '/api/analytics';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const stats = analyticsData?.stats || {};
  const weeklyTrends = analyticsData?.weeklyTrends || {};
  const categoryCounts = analyticsData?.categoryCounts || {};
  const marketplaceCounts = analyticsData?.marketplaceCounts || {};
  const ratingCounts = analyticsData?.ratingCounts || {};
  const statusCounts = analyticsData?.statusCounts || {};

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedProduct("all");
    setSelectedMarketplaces([]);
    setSelectedSentiments([]);
    setSelectedStatuses([]);
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

  const toggleStatus = (status: Status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleRating = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const activeFilterCount = 
    (dateRange.from || dateRange.to ? 1 : 0) +
    (selectedProduct && selectedProduct !== 'all' ? 1 : 0) +
    selectedMarketplaces.length +
    selectedSentiments.length +
    selectedStatuses.length +
    selectedRatings.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Advanced data analysis with comprehensive filtering
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground rounded-full px-4"
                data-testid="button-date-range-header"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Date range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger 
              className="w-auto bg-primary/20 border-primary/30 text-foreground rounded-full px-4" 
              data-testid="select-product-header"
            >
              <SelectValue placeholder="Product Select filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {products.map((product: any) => (
                <SelectItem key={`${product.platform}-${product.productId}`} value={`${product.platform}-${product.productId}`}>
                  {product.productName} ({product.platform})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary/20 border border-primary/30 text-foreground rounded-full px-4"
                data-testid="button-toggle-filters"
              >
                Sentiment
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} data-testid="button-clear-all-filters">
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
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-date-range-filter">
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
                  <Label>Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger data-testid="select-product-filter">
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      {products.map((product: any) => (
                        <SelectItem key={`${product.platform}-${product.productId}`} value={`${product.platform}-${product.productId}`}>
                          {product.productName} ({product.platform})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Marketplace</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['Amazon', 'Shopify', 'Walmart', 'Mailbox'] as Marketplace[]).map(marketplace => (
                      <Badge
                        key={marketplace}
                        variant={selectedMarketplaces.includes(marketplace) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate"
                        onClick={() => toggleMarketplace(marketplace)}
                        data-testid={`filter-marketplace-${marketplace.toLowerCase()}`}
                      >
                        {marketplace}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sentiment</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['positive', 'neutral', 'negative'] as Sentiment[]).map(sentiment => (
                      <Badge
                        key={sentiment}
                        variant={selectedSentiments.includes(sentiment) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate capitalize"
                        onClick={() => toggleSentiment(sentiment)}
                        data-testid={`filter-sentiment-${sentiment}`}
                      >
                        {sentiment}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['open', 'in_progress', 'resolved'] as Status[]).map(status => (
                      <Badge
                        key={status}
                        variant={selectedStatuses.includes(status) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate capitalize"
                        onClick={() => toggleStatus(status)}
                        data-testid={`filter-status-${status}`}
                      >
                        {status.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <Badge
                        key={rating}
                        variant={selectedRatings.includes(rating) ? "default" : "outline"}
                        className="cursor-pointer hover-elevate"
                        onClick={() => toggleRating(rating)}
                        data-testid={`filter-rating-${rating}`}
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

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Positive Rate"
              value={`${stats.positiveRate || '0.0'}%`}
              icon={TrendingUp}
              subtitle={`${stats.totalReviews || 0} total reviews`}
              testId="stat-positive-rate"
              gradientClass="gradient-stat-1"
            />
            <StatCard
              title="Negative Rate"
              value={`${stats.negativeRate || '0.0'}%`}
              icon={TrendingDown}
              subtitle={`${stats.totalReviews || 0} total reviews`}
              testId="stat-negative-rate"
              gradientClass="gradient-stat-2"
            />
            <StatCard
              title="Resolution Rate"
              value={`${stats.resolutionRate || '0.0'}%`}
              icon={Target}
              subtitle={`${stats.totalReviews || 0} total reviews`}
              testId="stat-resolution-rate"
              gradientClass="gradient-stat-3"
            />
            <StatCard
              title="Avg Rating"
              value={`${stats.avgRating || '0.0'}`}
              icon={Star}
              subtitle="Out of 5 stars"
              testId="stat-avg-rating"
              gradientClass="gradient-stat-4"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentTrendChart data={weeklyTrends} />
            <CategoryDistributionChart data={categoryCounts} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketplaceDistributionChart data={marketplaceCounts} />
            <RatingDistributionChart data={ratingCounts} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDistributionChart data={statusCounts} />
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";
import { ImportReviewsModal } from "@/components/ImportReviewsModal";
import { ImportProductModal } from "@/components/ImportProductModal";
import { MessageSquare, TrendingUp, Clock, CheckCircle, Search, Upload, Download, Mail, RefreshCw, Loader2, Package, ShoppingCart, ExternalLink, Trash2, Calendar, X, ArrowUpDown, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiAmazon, SiShopify } from "react-icons/si";
import { WalmartLogo } from "@/components/WalmartLogo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

type Marketplace = "Amazon" | "Shopify" | "Walmart" | "Mailbox";
type Sentiment = "positive" | "neutral" | "negative";
type Status = "open" | "in_progress" | "resolved";
type Severity = "low" | "medium" | "high" | "critical";

// Mock reviews removed - now using only real imported reviews from Amazon/other sources
const mockReviews: any[] = [];

export default function Dashboard() {
  const searchString = useSearch();
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportProductModalOpen, setIsImportProductModalOpen] = useState(false);
  const [refreshingProductId, setRefreshingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<{ productId: string; platform: string; productName: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Marketplace[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<Sentiment[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "severity" | "status">("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");
  const { toast } = useToast();

  const handleClearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedProduct("all");
    setSelectedMarketplaces([]);
    setSelectedSentiments([]);
    setSelectedStatuses([]);
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
    selectedStatuses.length +
    selectedSeverities.length +
    selectedRatings.length;
  
  const [, navigate] = useLocation();



  const { data: importedReviewsData } = useQuery<{ reviews: typeof mockReviews; total: number }>({
    queryKey: ["/api/reviews/imported"],
  });

  const { data: productsData } = useQuery<{ 
    products: Array<{
      id: string;
      platform: string;
      productId: string;
      productName: string;
      reviewCount: number;
      lastImported: string;
    }>; 
    total: number 
  }>({
    queryKey: ["/api/products/tracked"],
  });

  const refreshProductMutation = useMutation({
    mutationFn: async ({ productId, platform, syncType }: { productId: string; platform: string; syncType: "quick" | "full" }) => {
      const response = await fetch("/api/products/refresh", {
        method: "POST",
        body: JSON.stringify({ productId, platform, syncType }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh reviews");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      setRefreshingProductId(null);
      
      const syncLabel = variables.syncType === "full" ? "Full Historical Sync" : "Quick Refresh";
      toast({
        title: `${syncLabel} Complete`,
        description: data.message || `Successfully refreshed reviews for product`,
      });
    },
    onError: (error: any, variables) => {
      setRefreshingProductId(null);
      toast({
        title: "Refresh Failed",
        description: error.message || "Could not refresh reviews. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefreshProduct = (productId: string, platform: string, syncType: "quick" | "full") => {
    setRefreshingProductId(productId);
    refreshProductMutation.mutate({ productId, platform, syncType });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async ({ productId, platform, deleteReviews }: { productId: string; platform: string; deleteReviews: boolean }) => {
      const response = await fetch("/api/products/delete", {
        method: "POST",
        body: JSON.stringify({ productId, platform, deleteReviews }),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete product");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      setDeletingProduct(null);
      
      toast({
        title: "Product Removed",
        description: data.message,
      });
    },
    onError: (error: any) => {
      setDeletingProduct(null);
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (deleteReviews: boolean) => {
    if (!deletingProduct) return;
    deleteProductMutation.mutate({
      productId: deletingProduct.productId,
      platform: deletingProduct.platform,
      deleteReviews,
    });
  };

  const isProductSelected = (platform: string, productId: string): boolean => {
    if (!selectedProduct || selectedProduct === "all") return false;
    return selectedProduct === `${platform}|${productId}`;
  };

  const handleProductCardClick = (platform: string, productId: string) => {
    const newValue = `${platform}|${productId}`;
    if (selectedProduct === newValue) {
      setSelectedProduct("all");
    } else {
      setSelectedProduct(newValue);
    }
  };

  const allReviews = useMemo(() => {
    const imported = importedReviewsData?.reviews || [];
    return [...mockReviews, ...imported];
  }, [importedReviewsData]);

  // Derive unique products from both tracked products AND reviews
  // This ensures orphaned reviews (where product was deleted) still appear in filters
  const uniqueProducts = useMemo(() => {
    const productMap = new Map<string, { platform: string; productId: string; productName: string; isTracked: boolean }>();
    
    // Add tracked products first
    productsData?.products.forEach(product => {
      const key = `${product.platform}|${product.productId}`;
      productMap.set(key, {
        platform: product.platform,
        productId: product.productId,
        productName: product.productName,
        isTracked: true,
      });
    });
    
    // Add products from reviews (may include orphaned products)
    allReviews.forEach(review => {
      const key = `${review.marketplace}|${review.productId}`;
      if (!productMap.has(key)) {
        productMap.set(key, {
          platform: review.marketplace,
          productId: review.productId,
          productName: review.productName || review.productId,
          isTracked: false,
        });
      }
    });
    
    return Array.from(productMap.values()).sort((a, b) => {
      // Sort tracked products first, then by name
      if (a.isTracked !== b.isTracked) return a.isTracked ? -1 : 1;
      return a.productName.localeCompare(b.productName);
    });
  }, [productsData, allReviews]);

  // Calculate dashboard metrics from actual data
  const metrics = useMemo(() => {
    const reviews = allReviews;
    const totalReviews = reviews.length;
    
    // Calculate average rating with defensive parsing
    const ratingsSum = reviews.reduce((sum, review) => {
      const rating = Number(review.rating);
      return sum + (isNaN(rating) ? 0 : rating);
    }, 0);
    const avgRating = totalReviews > 0 ? (ratingsSum / totalReviews).toFixed(1) : "0.0";
    
    // Calculate pending (open or in_progress status - all unresolved reviews)
    const pending = reviews.filter(r => 
      r.status === "open" || r.status === "in_progress"
    ).length;
    
    // Calculate resolved
    const resolved = reviews.filter(r => r.status === "resolved").length;
    
    return {
      totalReviews,
      avgRating,
      pending,
      resolved,
    };
  }, [allReviews]);

  const syncEmailsMutation = useMutation({
    mutationFn: async ({ syncType }: { syncType: "quick" | "full" }) => {
      const response = await fetch("/api/emails/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync emails");
      }
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
      const syncLabel = variables.syncType === "full" ? "Full Historical Sync" : "Quick Sync";
      toast({
        title: `${syncLabel} Complete`,
        description: `Imported ${data.imported} review(s) from Outlook. Skipped ${data.skipped} email(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync emails from Outlook.",
        variant: "destructive",
      });
    },
  });

  const handleSyncEmails = (syncType: "quick" | "full") => {
    syncEmailsMutation.mutate({ syncType });
  };

  const handleExportData = () => {
    if (filteredReviews.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no reviews matching your current filters.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Title", "Content", "Product ID", "Product Name", "Rating", "Sentiment", "Category", "Severity", "Status", "Marketplace", "Customer Name", "Date"];
    const csvData = filteredReviews.map(review => {
      const product = productsData?.products.find(
        (p: any) => p.platform === review.marketplace && p.productId === review.productId
      );
      return [
        review.title,
        review.content.replace(/"/g, '""'),
        review.productId || '',
        product?.productName || review.productId || 'Unknown Product',
        review.rating,
        review.sentiment,
        review.category,
        review.severity,
        review.status,
        review.marketplace,
        review.customerName || '',
        new Date(review.createdAt).toLocaleDateString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `driftsignal-reviews-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredReviews.length} reviews to CSV file.`,
    });
  };

  const filteredReviews = useMemo(() => {
    const filtered = allReviews.filter((review) => {
      const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           review.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Use new filter state variables
      const matchesSentiment = selectedSentiments.length === 0 || selectedSentiments.includes(review.sentiment as Sentiment);
      const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(review.severity as Severity);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(review.status as Status);
      const matchesMarketplace = selectedMarketplaces.length === 0 || selectedMarketplaces.includes(review.marketplace as Marketplace);
      const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(Math.round(review.rating));
      
      // Date range filter
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const reviewDate = new Date(review.createdAt);
        if (dateRange.from && reviewDate < dateRange.from) matchesDate = false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (reviewDate > endOfDay) matchesDate = false;
        }
      }
      
      // Product filter using pipe delimiter
      let matchesProduct = true;
      if (selectedProduct && selectedProduct !== "all") {
        const [platform, productId] = selectedProduct.split('|');
        matchesProduct = review.marketplace === platform && review.productId === productId;
      }
      
      return matchesSearch && matchesSentiment && matchesSeverity && matchesStatus && matchesDate && matchesMarketplace && matchesProduct && matchesRating;
    });
    
    // Sort the filtered reviews
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2 };
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "severity":
          return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
        case "status":
          return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
        default:
          return 0;
      }
    });
  }, [allReviews, searchQuery, selectedSentiments, selectedSeverities, selectedStatuses, selectedMarketplaces, selectedRatings, dateRange, selectedProduct, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSentiments, selectedSeverities, selectedStatuses, selectedMarketplaces, selectedRatings, dateRange, selectedProduct, sortBy]);

  // Paginated reviews
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReviews.slice(startIndex, startIndex + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReviews.length / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Centralized marketplace review and complaint management
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                disabled={syncEmailsMutation.isPending}
                data-testid="button-sync-emails"
              >
                {syncEmailsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Emails
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleSyncEmails("quick")}
                data-testid="button-quick-sync-emails"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Quick Refresh (24 hours)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSyncEmails("full")}
                data-testid="button-full-sync-emails"
              >
                <Download className="h-4 w-4 mr-2" />
                Full Historical Sync
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="default" 
            onClick={() => setIsImportProductModalOpen(true)}
            data-testid="button-import-product"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Import Product
          </Button>
          <Button 
            variant="default" 
            onClick={() => setIsImportModalOpen(true)}
            data-testid="button-import-reviews"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import File
          </Button>
          <Button 
            variant="default"
            onClick={handleExportData}
            data-testid="button-export-data"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {productsData && productsData.products.length > 0 && (
        <Card data-testid="card-tracked-products">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tracked Products
              </CardTitle>
              <CardDescription>
                Products you're monitoring for reviews and feedback
              </CardDescription>
            </div>
            <Badge variant="secondary" data-testid="badge-product-count">
              {productsData.total} {productsData.total === 1 ? 'product' : 'products'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {productsData.products.map((product) => (
                <Card 
                  key={product.id} 
                  className={`hover-elevate cursor-pointer transition-all ${
                    isProductSelected(product.platform, product.productId) 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : ''
                  }`}
                  onClick={() => handleProductCardClick(product.platform, product.productId)}
                  data-testid={`card-product-${product.productId}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted/50">
                        {product.platform === "Amazon" && <SiAmazon className="h-5 w-5" style={{ color: "#FF9900" }} />}
                        {product.platform === "Shopify" && <SiShopify className="h-5 w-5" style={{ color: "#7AB55C" }} />}
                        {product.platform === "Walmart" && <WalmartLogo className="h-5 w-5" />}
                        {product.platform === "Mailbox" && <Mail className="h-5 w-5" style={{ color: "#0078D4" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {product.platform}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {product.productId.length > 20 ? `${product.productId.slice(0, 20)}...` : product.productId}
                          </span>
                          {isProductSelected(product.platform, product.productId) && (
                            <Badge variant="default" className="text-xs">Filtered</Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-medium line-clamp-2 mb-2" data-testid={`text-product-name-${product.productId}`}>
                          {product.productName}
                        </h4>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <span data-testid={`text-review-count-${product.productId}`}>
                              {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                            </span>
                            <span>
                              Last: {new Date(product.lastImported).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                let url = '';
                                if (product.platform === 'Amazon') {
                                  url = `https://www.amazon.com/dp/${product.productId}`;
                                } else if (product.platform === 'Walmart') {
                                  url = `https://www.walmart.com/ip/${product.productId}`;
                                }
                                if (url) window.open(url, '_blank');
                              }}
                              title="View product on marketplace"
                              data-testid={`button-view-product-${product.productId}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={refreshingProductId === product.productId}
                                  title="Refresh reviews"
                                  data-testid={`button-refresh-${product.productId}`}
                                >
                                  {refreshingProductId === product.productId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem
                                  onClick={() => handleRefreshProduct(product.productId, product.platform, "quick")}
                                  data-testid={`button-quick-refresh-${product.productId}`}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Quick Refresh
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRefreshProduct(product.productId, product.platform, "full")}
                                  data-testid={`button-full-sync-${product.productId}`}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Full Historical Sync
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingProduct({
                                  productId: product.productId,
                                  platform: product.platform,
                                  productName: product.productName,
                                });
                              }}
                              title="Remove product"
                              data-testid={`button-delete-${product.productId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reviews"
          value={metrics.totalReviews.toString()}
          icon={MessageSquare}
          testId="stat-total-reviews"
          gradientClass="gradient-stat-1"
        />
        <StatCard
          title="Avg. Rating"
          value={metrics.avgRating}
          icon={TrendingUp}
          testId="stat-avg-rating"
          gradientClass="gradient-stat-2"
        />
        <StatCard
          title="Pending"
          value={metrics.pending.toString()}
          icon={Clock}
          testId="stat-pending"
          gradientClass="gradient-stat-3"
        />
        <StatCard
          title="Resolved"
          value={metrics.resolved.toString()}
          icon={CheckCircle}
          testId="stat-resolved"
          gradientClass="gradient-stat-4"
        />
      </div>


      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort-dashboard">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary/20 border border-primary/30 text-foreground rounded-full px-4 text-sm"
                data-testid="button-toggle-filters-dashboard"
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
            <Button variant="ghost" size="sm" onClick={handleClearFilters} data-testid="button-clear-all-filters-dashboard">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm">Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-sm" data-testid="button-date-range-filter-dashboard">
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
                      <SelectTrigger className="text-sm" data-testid="select-product-filter-dashboard">
                        <SelectValue placeholder="All products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All products</SelectItem>
                        {uniqueProducts.map((product) => (
                          <SelectItem key={`${product.platform}|${product.productId}`} value={`${product.platform}|${product.productId}`}>
                            {product.productName} ({product.platform}){!product.isTracked && " (untracked)"}
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
                          data-testid={`filter-marketplace-${marketplace.toLowerCase()}-dashboard`}
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
                          data-testid={`filter-sentiment-${sentiment}-dashboard`}
                        >
                          {sentiment}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['open', 'in_progress', 'resolved'] as Status[]).map(status => (
                        <Badge
                          key={status}
                          variant={selectedStatuses.includes(status) ? "default" : "outline"}
                          className="cursor-pointer hover-elevate capitalize text-sm"
                          onClick={() => toggleStatus(status)}
                          data-testid={`filter-status-${status}-dashboard`}
                        >
                          {status.replace('_', ' ')}
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
                          data-testid={`filter-severity-${severity}-dashboard`}
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
                          data-testid={`filter-rating-${rating}-dashboard`}
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
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedReviews.length} of {filteredReviews.length} reviews
          </span>
          <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[100px]" data-testid="select-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={viewMode === "cards" ? "default" : "ghost"}
            onClick={() => setViewMode("cards")}
            data-testid="button-view-cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "compact" ? "default" : "ghost"}
            onClick={() => setViewMode("compact")}
            data-testid="button-view-compact"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              {...review}
              onViewDetails={() => setSelectedReview(review)}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {paginatedReviews.map((review) => (
              <div
                key={review.id}
                className="flex items-center gap-4 p-4 hover-elevate cursor-pointer overflow-hidden"
                onClick={() => setSelectedReview(review)}
                data-testid={`row-review-${review.id}`}
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate max-w-[300px]">{review.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {review.marketplace}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{review.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge 
                    variant={review.sentiment === "negative" ? "destructive" : review.sentiment === "positive" ? "default" : "secondary"}
                    className="capitalize text-xs"
                  >
                    {review.sentiment}
                  </Badge>
                  <Badge 
                    variant={review.severity === "critical" ? "destructive" : review.severity === "high" ? "destructive" : "outline"}
                    className="capitalize text-xs"
                  >
                    {review.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground w-14 text-right">
                    {format(new Date(review.createdAt), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews found matching your filters</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  data-testid={`button-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedReview && (
        <ReviewDetailModal
          open={!!selectedReview}
          onOpenChange={(open) => !open && setSelectedReview(null)}
          review={selectedReview}
        />
      )}

      <ImportReviewsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />

      <ImportProductModal
        open={isImportProductModalOpen}
        onOpenChange={setIsImportProductModalOpen}
      />

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to remove "<span className="font-medium">{deletingProduct?.productName}</span>" from tracking.
              </p>
              <p>What would you like to do with the existing reviews?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDeleteProduct(false)}
              disabled={deleteProductMutation.isPending}
              data-testid="button-stop-tracking"
            >
              {deleteProductMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Stop Tracking
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteProduct(true)}
              disabled={deleteProductMutation.isPending}
              data-testid="button-delete-all"
            >
              {deleteProductMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete All Data
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

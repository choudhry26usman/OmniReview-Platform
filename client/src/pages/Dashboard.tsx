import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";
import { ImportReviewsModal } from "@/components/ImportReviewsModal";
import { ImportProductModal } from "@/components/ImportProductModal";
import { MessageSquare, TrendingUp, Clock, CheckCircle, Search, Upload, Download, Mail, RefreshCw, Loader2, Package, ShoppingCart, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiAmazon, SiShopify, SiWalmart } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Mock reviews removed - now using only real imported reviews from Amazon/other sources
const mockReviews: any[] = [];

export default function Dashboard() {
  const searchString = useSearch();
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportProductModalOpen, setIsImportProductModalOpen] = useState(false);
  const [refreshingProductId, setRefreshingProductId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const marketplaceFilter = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get('marketplace') || "all";
  }, [searchString]);
  
  const sentimentFilter = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get('sentiment') || "all";
  }, [searchString]);
  
  const severityFilter = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get('severity') || "all";
  }, [searchString]);
  
  const statusFilter = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get('status') || "all";
  }, [searchString]);
  
  const dateFilter = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get('date') || "all";
  }, [searchString]);



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
    mutationFn: async ({ productId, platform }: { productId: string; platform: string }) => {
      const response = await fetch("/api/products/refresh", {
        method: "POST",
        body: JSON.stringify({ productId, platform }),
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
      
      toast({
        title: "Reviews Refreshed",
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

  const handleRefreshProduct = (productId: string, platform: string) => {
    setRefreshingProductId(productId);
    refreshProductMutation.mutate({ productId, platform });
  };

  const allReviews = useMemo(() => {
    const imported = importedReviewsData?.reviews || [];
    return [...mockReviews, ...imported];
  }, [importedReviewsData]);

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
    mutationFn: async () => {
      const response = await fetch("/api/emails/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync emails");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
      toast({
        title: "Emails Synced",
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

  const handleSyncEmails = () => {
    syncEmailsMutation.mutate();
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

    const headers = ["Title", "Content", "Rating", "Sentiment", "Category", "Severity", "Status", "Marketplace", "Date"];
    const csvData = filteredReviews.map(review => [
      review.title,
      review.content.replace(/"/g, '""'),
      review.rating,
      review.sentiment,
      review.category,
      review.severity,
      review.status,
      review.marketplace,
      new Date(review.createdAt).toLocaleDateString()
    ]);

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
    return allReviews.filter((review) => {
      const matchesSearch = review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           review.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSentiment = sentimentFilter === "all" || review.sentiment === sentimentFilter;
      const matchesSeverity = severityFilter === "all" || review.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      const matchesMarketplace = marketplaceFilter === "all" || review.marketplace === marketplaceFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const now = new Date();
        const reviewDate = new Date(review.createdAt);
        const daysDiff = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === "today") matchesDate = daysDiff === 0;
        else if (dateFilter === "week") matchesDate = daysDiff <= 7;
        else if (dateFilter === "month") matchesDate = daysDiff <= 30;
        else if (dateFilter === "quarter") matchesDate = daysDiff <= 90;
        else if (dateFilter === "year") matchesDate = daysDiff <= 365;
      }
      
      return matchesSearch && matchesSentiment && matchesSeverity && matchesStatus && matchesDate && matchesMarketplace;
    });
  }, [allReviews, marketplaceFilter, searchQuery, sentimentFilter, severityFilter, statusFilter, dateFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Centralized marketplace review and complaint management
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="default" 
            onClick={handleSyncEmails}
            disabled={syncEmailsMutation.isPending}
            data-testid="button-sync-emails"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncEmailsMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Emails
          </Button>
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
                <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.productId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted/50">
                        {product.platform === "Amazon" && <SiAmazon className="h-5 w-5" style={{ color: "#FF9900" }} />}
                        {product.platform === "Shopify" && <SiShopify className="h-5 w-5" style={{ color: "#7AB55C" }} />}
                        {product.platform === "Walmart" && <SiWalmart className="h-5 w-5" style={{ color: "#0071CE" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {product.platform}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {product.productId}
                          </span>
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
                              onClick={() => {
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
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRefreshProduct(product.productId, product.platform)}
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
        />
        <StatCard
          title="Avg. Rating"
          value={metrics.avgRating}
          icon={TrendingUp}
          testId="stat-avg-rating"
        />
        <StatCard
          title="Pending"
          value={metrics.pending.toString()}
          icon={Clock}
          testId="stat-pending"
        />
        <StatCard
          title="Resolved"
          value={metrics.resolved.toString()}
          icon={CheckCircle}
          testId="stat-resolved"
        />
      </div>


      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReviews.map((review) => (
          <ReviewCard
            key={review.id}
            {...review}
            onViewDetails={() => setSelectedReview(review)}
          />
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews found matching your filters</p>
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
    </div>
  );
}

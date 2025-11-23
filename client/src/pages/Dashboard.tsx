import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";
import { ImportReviewsModal } from "@/components/ImportReviewsModal";
import { MessageSquare, TrendingUp, Clock, CheckCircle, Search, Upload, Download, Mail, RefreshCw, Loader2, Inbox, ChevronDown, ChevronRight, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import type { EmailListResponse, Email, EmailThread } from "@shared/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SiAmazon } from "react-icons/si";

// Mock reviews removed - now using only real imported reviews from Amazon/other sources
const mockReviews: any[] = [];

export default function Dashboard() {
  const searchString = useSearch();
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { toast } = useToast();
  
  const marketplaceFilter = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get('marketplace') || "all";
  }, [searchString]);

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const { data: emailData, refetch: refetchEmails, isFetching: isFetchingEmails, error: emailError } = useQuery<EmailListResponse>({
    queryKey: ["/api/emails"],
    enabled: false,
  });

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

  const allReviews = useMemo(() => {
    const imported = importedReviewsData?.reviews || [];
    return [...mockReviews, ...imported];
  }, [importedReviewsData]);

  const handleSyncEmails = async () => {
    try {
      const result = await refetchEmails();
      if (result.isError || !result.data) {
        throw new Error("Failed to fetch emails");
      }
      const emailCount = result.data.total || 0;
      toast({
        title: "Emails Synced",
        description: `Successfully synced ${emailCount} emails from AgentMail inbox.`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Could not sync emails. Please try again.",
        variant: "destructive",
      });
    }
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
        
        if (dateFilter === "7days") matchesDate = daysDiff <= 7;
        else if (dateFilter === "30days") matchesDate = daysDiff <= 30;
        else if (dateFilter === "90days") matchesDate = daysDiff <= 90;
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncEmails}
            disabled={isFetchingEmails}
            data-testid="button-sync-emails"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingEmails ? 'animate-spin' : ''}`} />
            Sync Emails
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            data-testid="button-import-reviews"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Reviews
          </Button>
          <Button data-testid="button-export-data">
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
                        {product.platform === "Amazon" && <SiAmazon className="h-5 w-5" />}
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
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span data-testid={`text-review-count-${product.productId}`}>
                            {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                          </span>
                          <span>
                            Last: {new Date(product.lastImported).toLocaleDateString()}
                          </span>
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
          value="142"
          icon={MessageSquare}
          trend={{ value: "12%", isPositive: true }}
          testId="stat-total-reviews"
        />
        <StatCard
          title="Avg. Rating"
          value="4.2"
          icon={TrendingUp}
          trend={{ value: "0.3", isPositive: true }}
          testId="stat-avg-rating"
        />
        <StatCard
          title="Pending"
          value="23"
          icon={Clock}
          testId="stat-pending"
        />
        <StatCard
          title="Resolved"
          value="119"
          icon={CheckCircle}
          trend={{ value: "8%", isPositive: true }}
          testId="stat-resolved"
        />
      </div>

      {emailData && emailData.threads && emailData.threads.length > 0 && (
        <Card data-testid="card-email-inbox">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Email Inbox
              </CardTitle>
              <CardDescription>
                Product review emails grouped by conversation
              </CardDescription>
            </div>
            <Badge variant="secondary" data-testid="badge-email-count">
              {emailData.total} emails ({emailData.threads.length} conversations)
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailData.threads.slice(0, 5).map((thread: EmailThread) => (
                <Collapsible 
                  key={thread.threadId}
                  open={expandedThreads.has(thread.threadId)}
                  onOpenChange={() => toggleThread(thread.threadId)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div 
                        className="flex items-start gap-3 p-3 hover-elevate active-elevate-2 cursor-pointer"
                        data-testid={`email-thread-${thread.threadId}`}
                      >
                        {expandedThreads.has(thread.threadId) ? (
                          <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        )}
                        <Mail className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-medium truncate">
                              {thread.emails[0].from.name || thread.emails[0].from.email}
                            </p>
                            {thread.emails.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {thread.emails.length} messages
                              </Badge>
                            )}
                            {thread.unreadCount > 0 && (
                              <Badge variant="default" className="text-xs">
                                {thread.unreadCount} new
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate mb-1">{thread.emails[0].subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{thread.emails[0].body}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(thread.lastReceivedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t space-y-2 p-3 bg-muted/30">
                        {thread.emails.slice(1).map((email: Email) => (
                          <div 
                            key={email.id}
                            className="p-3 rounded-md bg-background border"
                            data-testid={`email-item-${email.id}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{email.from.name || email.from.email}</p>
                              {!email.read && <Badge variant="default" className="text-xs">New</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 mb-1">{email.body}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(email.receivedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
            {emailData.threads.length > 5 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing 5 of {emailData.threads.length} conversations
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isFetchingEmails && !emailData && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading emails...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {emailError && (
        <Card className="border-destructive">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-destructive">
              <Mail className="h-5 w-5" />
              <p className="text-sm">Failed to load emails. Please try syncing again.</p>
            </div>
          </CardContent>
        </Card>
      )}

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
        
        <div className="flex gap-3 flex-wrap">
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-sentiment">
              <SelectValue placeholder="All Sentiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-severity">
              <SelectValue placeholder="All Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-date">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
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
    </div>
  );
}

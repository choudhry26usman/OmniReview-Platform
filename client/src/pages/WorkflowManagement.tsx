import { useState, useMemo } from "react";
import { WorkflowBoard, WorkflowColumn } from "@/components/WorkflowBoard";
import { ReviewDetailModal } from "@/components/ReviewDetailModal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function WorkflowManagement() {
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const { toast } = useToast();

  // Fetch tracked products
  const { data: productsData } = useQuery<{ products: any[] }>({
    queryKey: ['/api/products/tracked'],
  });

  const products = productsData?.products || [];

  // Fetch all imported reviews
  const { data: importedReviewsData } = useQuery<{ reviews: any[]; total: number }>({
    queryKey: ["/api/reviews/imported"],
  });

  const allReviews = useMemo(() => {
    const reviews = importedReviewsData?.reviews || [];
    
    // Filter by selected product
    if (selectedProduct && selectedProduct !== "all") {
      const [platform, productId] = selectedProduct.split('-');
      return reviews.filter(r => r.marketplace === platform && r.productId === productId);
    }
    
    return reviews;
  }, [importedReviewsData, selectedProduct]);

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
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update review status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReviewMove = (reviewId: string, sourceColumn: string, destColumn: string) => {
    console.log(`Review ${reviewId} moved from ${sourceColumn} to ${destColumn}`);
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
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger 
              className="w-auto bg-primary/20 border-primary/30 text-foreground rounded-full px-4 text-sm" 
              data-testid="select-product-workflow"
            >
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
      </div>

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

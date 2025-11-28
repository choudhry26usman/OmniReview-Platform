import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Zap, CheckCircle, XCircle, RefreshCw, Loader2, ShoppingCart, Store, UserCheck, History, Trash2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { format } from "date-fns";
import { SiAmazon, SiShopify } from "react-icons/si";
import { WalmartLogo } from "@/components/WalmartLogo";

interface ProductHistoryItem {
  id: string;
  userId: string;
  platform: string;
  productId: string;
  productName: string;
  deletedAt: string;
  reviewsDeleted: number;
}

interface IntegrationStatus {
  name: string;
  connected: boolean;
  details?: string;
  lastChecked?: string;
}

interface ConnectionStatusResponse {
  outlook: IntegrationStatus;
  openrouter: IntegrationStatus;
  axesso: IntegrationStatus;
  shopify: IntegrationStatus;
  walmart: IntegrationStatus;
}

export default function Settings() {
  const { toast } = useToast();
  const [showOutlookInstructions, setShowOutlookInstructions] = useState(false);
  const [outlookInstructions, setOutlookInstructions] = useState<string[]>([]);

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<ConnectionStatusResponse>({
    queryKey: ['/api/integrations/status'],
  });

  const { data: historyData } = useQuery<{ history: ProductHistoryItem[] }>({
    queryKey: ['/api/products/history'],
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/history'] });
      toast({
        title: "History Cleared",
        description: "Product history entry removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete history entry",
        variant: "destructive",
      });
    },
  });

  const readdProductMutation = useMutation({
    mutationFn: async (item: ProductHistoryItem) => {
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: item.platform,
          productId: item.productId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to re-add product");
      }
      return { ...await response.json(), historyId: item.id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/tracked'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/imported'] });
      // Remove from history after successful re-add
      deleteHistoryMutation.mutate(data.historyId);
      toast({
        title: "Product Re-added",
        description: `Imported ${data.imported || 0} new review(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Re-add Failed",
        description: error.message || "Could not re-add product",
        variant: "destructive",
      });
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Amazon":
        return <SiAmazon className="h-4 w-4" />;
      case "Shopify":
        return <SiShopify className="h-4 w-4" />;
      case "Walmart":
        return <WalmartLogo className="h-4 w-4" />;
      case "Mailbox":
        return <Mail className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const reconnectOutlookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/outlook/reconnect', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to get reconnection instructions');
      return response.json();
    },
    onSuccess: (data) => {
      setOutlookInstructions(data.instructions || []);
      setShowOutlookInstructions(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get reconnection instructions",
        variant: "destructive",
      });
    },
  });


  const handleTestConnection = async (integration: string) => {
    toast({
      title: "Testing connection...",
      description: `Checking ${integration} integration status`,
    });
    
    const { data } = await refetch();
    
    const status = data?.[integration as keyof ConnectionStatusResponse];
    if (status?.connected) {
      toast({
        title: "Connection successful",
        description: `${integration} is connected and working properly`,
      });
    } else {
      toast({
        title: "Connection failed",
        description: status?.details || `Unable to connect to ${integration}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AlertDialog open={showOutlookInstructions} onOpenChange={setShowOutlookInstructions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Outlook Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Follow these steps to change your Outlook account to <strong>drift_signal@outlook.com</strong>:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                {outlookInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground pt-2">
                After reconnecting, refresh this page to see the updated connection status.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integration Status</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your API connections and marketplace integrations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh-status"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Checking integration status...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {/* Outlook Integration */}
            <Card data-testid="card-integration-outlook">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Microsoft Outlook</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {statusData?.outlook.details || "Email integration for customer communication"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection('outlook')}
                      data-testid="button-test-outlook"
                    >
                      Test
                    </Button>
                    <Badge 
                      variant={statusData?.outlook.connected ? "default" : "destructive"}
                      data-testid="badge-outlook-status"
                    >
                      {statusData?.outlook.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* OpenRouter (Grok AI) Integration */}
            <Card data-testid="card-integration-openrouter">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Grok AI (OpenRouter)</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {statusData?.openrouter.details || "AI-powered analysis and reply generation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection('openrouter')}
                      data-testid="button-test-openrouter"
                    >
                      Test
                    </Button>
                    <Badge 
                      variant={statusData?.openrouter.connected ? "default" : "destructive"}
                      data-testid="badge-openrouter-status"
                    >
                      {statusData?.openrouter.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Amazon (Axesso) Integration */}
            <Card data-testid="card-integration-axesso">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Amazon (Axesso API)</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {statusData?.axesso.details || "Amazon product review imports"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection('axesso')}
                      data-testid="button-test-axesso"
                    >
                      Test
                    </Button>
                    <Badge 
                      variant={statusData?.axesso.connected ? "default" : "destructive"}
                      data-testid="badge-axesso-status"
                    >
                      {statusData?.axesso.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Shopify Integration */}
            <Card data-testid="card-integration-shopify">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Shopify</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {statusData?.shopify.details || "Shopify product review imports"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection('shopify')}
                      data-testid="button-test-shopify"
                    >
                      Test
                    </Button>
                    <Badge 
                      variant={statusData?.shopify.connected ? "default" : "destructive"}
                      data-testid="badge-shopify-status"
                    >
                      {statusData?.shopify.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Walmart Integration */}
            <Card data-testid="card-integration-walmart">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Walmart (SerpAPI)</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {statusData?.walmart.details || "Walmart product review imports"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection('walmart')}
                      data-testid="button-test-walmart"
                    >
                      Test
                    </Button>
                    <Badge 
                      variant={statusData?.walmart.connected ? "default" : "destructive"}
                      data-testid="badge-walmart-status"
                    >
                      {statusData?.walmart.connected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>

      <div className="pt-4">
        <p className="text-xs text-muted-foreground">
          API credentials are securely managed through Replit's encrypted secrets system. 
          Status indicators show real-time connection health for each integration.
        </p>
      </div>

      {/* Product History Section */}
      <div className="pt-8 border-t mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Previously Tracked Products</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Products you've removed from tracking. You can use these IDs to re-import them.
        </p>
        
        {historyData?.history && historyData.history.length > 0 ? (
          <div className="space-y-2">
            {historyData.history.map((item) => (
              <Card key={item.id} data-testid={`card-history-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-muted rounded-md shrink-0">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.platform}</span>
                          <span>-</span>
                          <span className="font-mono text-xs">{item.productId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          Removed {format(new Date(item.deletedAt), "MMM d, yyyy")}
                        </p>
                        {item.reviewsDeleted ? (
                          <Badge variant="destructive" className="text-xs">Reviews deleted</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Reviews kept</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          readdProductMutation.mutate(item);
                        }}
                        disabled={readdProductMutation.isPending}
                        data-testid={`button-readd-${item.id}`}
                      >
                        {readdProductMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-1" />
                        )}
                        Re-add
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHistoryMutation.mutate(item.id)}
                        disabled={deleteHistoryMutation.isPending}
                        data-testid={`button-delete-history-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No product history yet</p>
              <p className="text-sm">Removed products will appear here for easy re-adding</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}

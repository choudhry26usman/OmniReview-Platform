import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Zap, CheckCircle, XCircle, ExternalLink, RefreshCw, Loader2, ShoppingCart, Package, Download, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface IntegrationStatus {
  name: string;
  connected: boolean;
  details?: string;
  lastChecked?: string;
}

interface ConnectionStatusResponse {
  agentmail: IntegrationStatus;
  outlook: IntegrationStatus;
  openrouter: IntegrationStatus;
  axesso: IntegrationStatus;
  shopify: IntegrationStatus;
  walmart: IntegrationStatus;
}

export default function Settings() {
  const { toast } = useToast();
  const [asin, setAsin] = useState("");
  const [shopifyProductId, setShopifyProductId] = useState("");
  const [walmartProductUrl, setWalmartProductUrl] = useState("");

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<ConnectionStatusResponse>({
    queryKey: ['/api/integrations/status'],
  });

  const importMutation = useMutation({
    mutationFn: async (asinValue: string) => {
      const response = await fetch("/api/amazon/import-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin: asinValue }),
      });
      
      // Parse response based on Content-Type
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        // Non-JSON response (e.g., HTML error page)
        const text = await response.text();
        data = { error: "Server error occurred. Please try again later." };
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to import reviews");
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: `Imported ${data.imported} reviews for "${data.productName}". Check your Dashboard!`,
      });
      setAsin("");
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Please check your ASIN and try again",
      });
    },
  });

  const shopifyImportMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch("/api/shopify/import-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      
      // Parse response based on Content-Type
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: "Server error occurred. Please try again later." };
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to import reviews");
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: `Imported ${data.imported} reviews from Shopify. Check your Dashboard!`,
      });
      setShopifyProductId("");
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Please check your Shopify credentials and product ID",
      });
    },
  });

  const handleImportReviews = () => {
    const trimmedAsin = asin.trim();
    if (!trimmedAsin) {
      toast({
        variant: "destructive",
        title: "ASIN required",
        description: "Please enter an Amazon ASIN",
      });
      return;
    }
    importMutation.mutate(trimmedAsin);
  };

  const walmartImportMutation = useMutation({
    mutationFn: async (productUrl: string) => {
      const response = await fetch("/api/walmart/import-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl }),
      });
      
      // Parse response based on Content-Type
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: "Server error occurred. Please try again later." };
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to import reviews");
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: `Imported ${data.imported} reviews from Walmart. Check your Dashboard!`,
      });
      setWalmartProductUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/imported"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/tracked"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Please check your Walmart product URL",
      });
    },
  });

  const handleShopifyImport = () => {
    const trimmedId = shopifyProductId.trim();
    if (!trimmedId) {
      toast({
        variant: "destructive",
        title: "Product ID required",
        description: "Please enter a Shopify product ID",
      });
      return;
    }
    shopifyImportMutation.mutate(trimmedId);
  };

  const handleWalmartImport = () => {
    const trimmedUrl = walmartProductUrl.trim();
    if (!trimmedUrl) {
      toast({
        variant: "destructive",
        title: "Product URL required",
        description: "Please enter a Walmart product URL",
      });
      return;
    }
    walmartImportMutation.mutate(trimmedUrl);
  };

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your integrations and application preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="button-refresh-status"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        
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
          <div className="grid gap-4">
            {/* AgentMail Integration */}
            <Card data-testid="card-integration-agentmail">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">AgentMail</CardTitle>
                      <CardDescription>Email receiving and inbox management</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusData?.agentmail.connected ? "default" : "destructive"}
                    data-testid="badge-agentmail-status"
                  >
                    {statusData?.agentmail.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData?.agentmail.details && (
                  <p className="text-sm text-muted-foreground">
                    {statusData.agentmail.details}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('agentmail')}
                    data-testid="button-test-agentmail"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href="https://replit.com/~/settings/integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      data-testid="link-configure-agentmail"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Configure in Replit
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Outlook Integration */}
            <Card data-testid="card-integration-outlook">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Microsoft Outlook</CardTitle>
                      <CardDescription>Email sending and customer communication</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusData?.outlook.connected ? "default" : "destructive"}
                    data-testid="badge-outlook-status"
                  >
                    {statusData?.outlook.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData?.outlook.details && (
                  <p className="text-sm text-muted-foreground">
                    {statusData.outlook.details}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('outlook')}
                    data-testid="button-test-outlook"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href="https://replit.com/~/settings/integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      data-testid="link-configure-outlook"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Configure in Replit
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OpenRouter (Grok AI) Integration */}
            <Card data-testid="card-integration-openrouter">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">OpenRouter (Grok AI)</CardTitle>
                      <CardDescription>AI-powered reply generation and sentiment analysis</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusData?.openrouter.connected ? "default" : "destructive"}
                    data-testid="badge-openrouter-status"
                  >
                    {statusData?.openrouter.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData?.openrouter.details && (
                  <p className="text-sm text-muted-foreground">
                    {statusData.openrouter.details}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('openrouter')}
                    data-testid="button-test-openrouter"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href="https://replit.com/~/settings/integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      data-testid="link-configure-openrouter"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Configure in Replit
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Axesso (Amazon Data) Integration */}
            <Card data-testid="card-integration-axesso">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Axesso (Amazon Data)</CardTitle>
                      <CardDescription>E-commerce data extraction from Amazon and other marketplaces</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusData?.axesso.connected ? "default" : "destructive"}
                    data-testid="badge-axesso-status"
                  >
                    {statusData?.axesso.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData?.axesso.details && (
                  <p className="text-sm text-muted-foreground">
                    {statusData.axesso.details}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('axesso')}
                    data-testid="button-test-axesso"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Add API Key",
                        description: "Open the Secrets tool in Replit, then add AXESSO_API_KEY with your RapidAPI key",
                      });
                    }}
                    data-testid="link-configure-axesso"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    How to Add API Key
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shopify Integration */}
            <Card data-testid="card-integration-shopify">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Shopify</CardTitle>
                      <CardDescription>Connect to your Shopify store to import product reviews</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusData?.shopify.connected ? "default" : "destructive"}
                    data-testid="badge-shopify-status"
                  >
                    {statusData?.shopify.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData?.shopify.details && (
                  <p className="text-sm text-muted-foreground">
                    {statusData.shopify.details}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('shopify')}
                    data-testid="button-test-shopify"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Configure Shopify",
                        description: "Add SHOPIFY_SHOP (your-store.myshopify.com) and SHOPIFY_ACCESS_TOKEN to environment variables",
                      });
                    }}
                    data-testid="link-configure-shopify"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    How to Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Walmart Integration */}
            <Card data-testid="card-integration-walmart">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Walmart</CardTitle>
                      <CardDescription>Access Walmart product data and reviews via RapidAPI</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={statusData?.walmart.connected ? "default" : "destructive"}
                    data-testid="badge-walmart-status"
                  >
                    {statusData?.walmart.connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusData?.walmart.details && (
                  <p className="text-sm text-muted-foreground">
                    {statusData.walmart.details}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('walmart')}
                    data-testid="button-test-walmart"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Configure Walmart",
                        description: "Walmart uses RAPIDAPI_KEY from RapidAPI. Add it to your secrets.",
                      });
                    }}
                    data-testid="link-configure-walmart"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    How to Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Amazon Reviews Importer */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h2 className="text-lg font-semibold mb-1">Amazon Reviews Importer</h2>
          <p className="text-sm text-muted-foreground">
            Import Amazon product reviews and process them through AI for complaint management
          </p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle>Import from Amazon</CardTitle>
            </div>
            <CardDescription>
              Enter an Amazon ASIN to fetch reviews, analyze sentiment, and add them to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Amazon ASIN (e.g., B0C1ZQRKQ2)"
                value={asin}
                onChange={(e) => setAsin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleImportReviews();
                  }
                }}
                data-testid="input-asin-import"
              />
              <Button
                onClick={handleImportReviews}
                disabled={importMutation.isPending}
                data-testid="button-import-reviews"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import Reviews
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Reviews will be analyzed for sentiment, category, and severity</p>
              <p>• AI-generated replies will be created for each review</p>
              <p>• Imported reviews will appear on your Dashboard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopify Reviews Importer */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h2 className="text-lg font-semibold mb-1">Shopify Reviews Importer</h2>
          <p className="text-sm text-muted-foreground">
            Import Shopify product reviews and process them through AI for complaint management
          </p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <CardTitle>Import from Shopify</CardTitle>
            </div>
            <CardDescription>
              Enter a Shopify product ID to fetch reviews, analyze sentiment, and add them to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Shopify Product ID (e.g., gid://shopify/Product/7482579091675)"
                value={shopifyProductId}
                onChange={(e) => setShopifyProductId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleShopifyImport();
                  }
                }}
                data-testid="input-shopify-product-id"
              />
              <Button
                onClick={handleShopifyImport}
                disabled={shopifyImportMutation.isPending}
                data-testid="button-import-shopify-reviews"
              >
                {shopifyImportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import Reviews
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Reviews will be analyzed for sentiment, category, and severity</p>
              <p>• AI-generated replies will be created for each review</p>
              <p>• Imported reviews will appear on your Dashboard</p>
              <p>• Product ID format: gid://shopify/Product/[ID] or just the numeric ID</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Walmart Reviews Importer */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h2 className="text-lg font-semibold mb-1">Walmart Reviews Importer</h2>
          <p className="text-sm text-muted-foreground">
            Import Walmart product reviews and process them through AI for complaint management
          </p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <CardTitle>Import from Walmart</CardTitle>
            </div>
            <CardDescription>
              Enter a Walmart product URL to fetch reviews, analyze sentiment, and add them to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Walmart Product URL (e.g., https://www.walmart.com/ip/...)"
                value={walmartProductUrl}
                onChange={(e) => setWalmartProductUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleWalmartImport();
                  }
                }}
                data-testid="input-walmart-product-url"
              />
              <Button
                onClick={handleWalmartImport}
                disabled={walmartImportMutation.isPending}
                data-testid="button-import-walmart-reviews"
              >
                {walmartImportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Import Reviews
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Reviews will be analyzed for sentiment, category, and severity</p>
              <p>• AI-generated replies will be created for each review</p>
              <p>• Imported reviews will appear on your Dashboard</p>
              <p>• Uses RAPIDAPI_KEY from RapidAPI (walmart2.p.rapidapi.com)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          All integrations are managed through Replit's secure connector system. 
          Click "Configure in Replit" to set up or modify your integration credentials.
        </p>
      </div>
    </div>
  );
}

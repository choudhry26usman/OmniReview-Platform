import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Zap, CheckCircle, XCircle, ExternalLink, RefreshCw, Loader2, ShoppingCart, Store, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [showOutlookInstructions, setShowOutlookInstructions] = useState(false);
  const [outlookInstructions, setOutlookInstructions] = useState<string[]>([]);

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<ConnectionStatusResponse>({
    queryKey: ['/api/integrations/status'],
  });

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
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('outlook')}
                    data-testid="button-test-outlook"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => reconnectOutlookMutation.mutate()}
                    disabled={reconnectOutlookMutation.isPending}
                    data-testid="button-change-outlook-account"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Change Account
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


      <div className="pt-6 border-t">
        <p className="text-sm text-muted-foreground">
          All integrations are managed through Replit's secure connector system. 
          Click "Configure in Replit" to set up or modify your integration credentials.
        </p>
      </div>
    </div>
    </>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Zap, CheckCircle, XCircle, RefreshCw, Loader2, ShoppingCart, Store, UserCheck } from "lucide-react";
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
    </div>
    </>
  );
}

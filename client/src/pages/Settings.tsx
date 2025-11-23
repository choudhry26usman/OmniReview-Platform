import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Mail, Zap, CheckCircle, XCircle, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

export default function Settings() {
  const { toast } = useToast();

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<ConnectionStatusResponse>({
    queryKey: ['/api/integrations/status'],
  });

  const handleTestConnection = async (integration: string) => {
    toast({
      title: "Testing connection...",
      description: `Checking ${integration} integration status`,
    });
    
    await refetch();
    
    const status = statusData?.[integration as keyof ConnectionStatusResponse];
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
  );
}

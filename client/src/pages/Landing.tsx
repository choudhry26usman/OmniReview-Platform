import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, 
  MessageSquare, 
  Shield, 
  Zap, 
  Star, 
  TrendingUp
} from "lucide-react";
import driftSignalLogo from "@assets/generated_images/clean_wave_logo_no_background.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img 
            src={driftSignalLogo} 
            alt="DriftSignal Logo" 
            className="h-10 w-10"
          />
          <span className="text-2xl font-bold text-foreground">
            DriftSignal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleLogin}
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-foreground">Manage Marketplace Reviews</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              with AI-Powered Insights
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Centralize reviews from Amazon, Shopify, Walmart, and your email inbox. 
            Get AI-powered sentiment analysis and generate professional responses instantly.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="text-lg px-8"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-cyan-900/30 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Marketplace Dashboard</h3>
              <p className="text-muted-foreground">
                Aggregate reviews from Amazon, Shopify, Walmart, and email in one unified dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-green-900/30 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Automatic sentiment detection, severity assessment, and smart categorization using advanced AI.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-purple-900/30 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Reply Generation</h3>
              <p className="text-muted-foreground">
                Generate professional, context-aware responses to customer reviews with one click.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-yellow-900/30 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Workflow Management</h3>
              <p className="text-muted-foreground">
                Kanban-style board to track review status from open to resolved.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-rose-900/30 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track trends, rating distribution, and sentiment over time with powerful filters.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-cyan-900/30 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security with encrypted data storage and secure authentication.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center py-8 text-muted-foreground">
        <p>&copy; 2024 DriftSignal. All rights reserved.</p>
      </footer>
    </div>
  );
}

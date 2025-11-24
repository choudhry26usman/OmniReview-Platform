import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, ThumbsDown, Minus, Send, Save, Mail, Sparkles } from "lucide-react";
import { SiAmazon, SiEbay, SiShopify, SiPaypal, SiAlibabadotcom } from "react-icons/si";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const marketplaceIcons = {
  Amazon: SiAmazon,
  eBay: SiEbay,
  Shopify: SiShopify,
  PayPal: SiPaypal,
  Alibaba: SiAlibabadotcom,
  Website: Globe,
};

const sentimentConfig = {
  positive: { icon: ThumbsUp, color: "text-chart-2" },
  negative: { icon: ThumbsDown, color: "text-destructive" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
};

interface ReviewDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: {
    id: string;
    marketplace: keyof typeof marketplaceIcons;
    title: string;
    content: string;
    customerName: string;
    customerEmail?: string;
    rating?: number;
    sentiment: keyof typeof sentimentConfig;
    category: string;
    severity: string;
    status: string;
    createdAt: Date;
    aiSuggestedReply?: string;
  };
}

export function ReviewDetailModal({ open, onOpenChange, review }: ReviewDetailModalProps) {
  const [replyText, setReplyText] = useState(review.aiSuggestedReply || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const MarketplaceIcon = marketplaceIcons[review.marketplace];
  const SentimentIcon = sentimentConfig[review.sentiment].icon;

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; body: string }) => {
      return apiRequest("POST", "/api/send-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Your response has been sent via Outlook successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateAIReply = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/generate-reply", {
        reviewContent: review.content,
        customerName: review.customerName,
        marketplace: review.marketplace,
        sentiment: review.sentiment,
        severity: review.severity,
      });
      const data = await response.json();
      setReplyText(data.reply);
      toast({
        title: "AI Reply Generated",
        description: "Professional response has been generated using Grok AI.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate AI reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = () => {
    if (!review.customerEmail) {
      toast({
        title: "No Email Address",
        description: "Customer email address is not available.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      to: review.customerEmail,
      subject: `Re: ${review.title}`,
      body: replyText,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-review-detail">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <MarketplaceIcon className="h-6 w-6" />
            <Badge variant="outline">{review.marketplace}</Badge>
            <Badge variant="secondary">{review.category}</Badge>
          </div>
          <DialogTitle className="text-2xl">{review.title}</DialogTitle>
          <DialogDescription>
            Review from {review.customerName} • {new Date(review.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className={cn("flex items-center gap-2", sentimentConfig[review.sentiment].color)}>
                <SentimentIcon className="h-5 w-5" />
                <span className="font-medium capitalize">{review.sentiment}</span>
              </div>
              {review.rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{review.rating}/5</span>
                </div>
              )}
              <Badge>{review.severity} severity</Badge>
              <Badge variant="outline" className="capitalize">{review.status.replace("_", " ")}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{review.content}</p>
              </CardContent>
            </Card>

            {review.customerEmail && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {review.customerEmail}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Powered Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Identified Issues</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Primary concern: {review.category}</li>
                    <li>Sentiment detected: {review.sentiment}</li>
                    <li>Severity level: {review.severity}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommended Actions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Respond within 24 hours to maintain customer satisfaction</li>
                    <li>Acknowledge the specific issue mentioned in the review</li>
                    <li>Offer a resolution or compensation if applicable</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="response" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">AI-Suggested Response</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateAIReply}
                  disabled={isGenerating}
                  data-testid="button-generate-ai-reply"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate AI Reply"}
                </Button>
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-40"
                placeholder="AI-generated response will appear here..."
                data-testid="textarea-response"
              />
              <p className="text-xs text-muted-foreground">
                Edit the AI-generated response before sending via Outlook
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" data-testid="button-save-draft">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSendReply}
                disabled={sendEmailMutation.isPending || !replyText}
                data-testid="button-send-reply"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? "Sending..." : "Send via Outlook"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

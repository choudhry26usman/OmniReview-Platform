// Review types
export interface Review {
  id: string;
  marketplace: "Amazon" | "eBay" | "Shopify" | "PayPal" | "Alibaba" | "Website";
  title: string;
  content: string;
  customerName: string;
  customerEmail?: string;
  rating?: number;
  sentiment: "positive" | "negative" | "neutral";
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  status: string;
  createdAt: Date;
  aiSuggestedReply?: string;
}

// Email types for AgentMail integration
export interface Email {
  id: string;
  from: {
    name?: string;
    email: string;
  };
  subject: string;
  body: string;
  receivedAt: string;
  read?: boolean;
  threadId?: string; // Unique identifier for conversation thread
  inReplyTo?: string; // ID of email this is replying to
}

export interface EmailThread {
  threadId: string;
  subject: string;
  emails: Email[];
  lastReceivedAt: string;
  unreadCount: number;
}

export interface EmailListResponse {
  emails: Email[];
  threads: EmailThread[];
  total: number;
}

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

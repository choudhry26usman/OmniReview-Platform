import type { Express } from "express";
import { createServer, type Server } from "http";
import { getUncachableAgentMailClient } from "./integrations/agentmail";
import { getUncachableOutlookClient } from "./integrations/outlook";
import { testAxessoConnection } from "./integrations/axesso";
import { analyzeReview, generateReply } from "./ai/service";
import { z } from "zod";

// Email validation schema
const emailSchema = z.object({
  id: z.string(),
  from: z.object({
    name: z.string().optional(),
    email: z.string().email(),
  }),
  subject: z.string(),
  body: z.string(),
  receivedAt: z.string(),
  read: z.boolean().optional(),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
});

// Helper function to normalize subject for threading
function normalizeSubject(subject: string): string {
  let normalized = subject.trim();
  // Iteratively strip all leading reply/forward prefixes
  let prev = '';
  while (prev !== normalized) {
    prev = normalized;
    normalized = normalized.replace(/^(Re|Fwd|RE|FWD|Fw):\s*/i, '').trim();
  }
  return normalized.toLowerCase();
}

// Helper function to generate thread ID from email
function generateThreadId(email: any): string {
  // Priority 1: Use provider-supplied threadId if available
  if (email.threadId && typeof email.threadId === 'string') {
    return email.threadId;
  }
  
  // Priority 2: Use inReplyTo to link to parent message
  if (email.inReplyTo && typeof email.inReplyTo === 'string') {
    return email.inReplyTo;
  }
  
  // Priority 3: Use message ID if available
  if (email.messageId && typeof email.messageId === 'string') {
    return email.messageId;
  }
  
  // Fallback: Generate from normalized subject + sender email + message id for uniqueness
  // Include email.id to prevent collisions between different customers with same subject
  const normalized = normalizeSubject(email.subject || '');
  const senderEmail = email.from?.email || 'unknown';
  const emailId = email.id || '';
  const composite = `${normalized}:${senderEmail}:${emailId}`;
  return Buffer.from(composite).toString('base64').substring(0, 32);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Fetch emails from AgentMail
  app.get("/api/emails", async (req, res) => {
    try {
      const agentMail = await getUncachableAgentMailClient();
      
      // First, get list of inboxes
      let inboxesResponse: any;
      try {
        inboxesResponse = await (agentMail as any).inboxes.list();
      } catch (inboxError: any) {
        console.warn("Failed to list inboxes:", inboxError.message);
        // Return empty response instead of error if AgentMail is not configured
        return res.json({ emails: [], threads: [], total: 0 });
      }
      
      const inboxes = Array.isArray(inboxesResponse?.inboxes) ? inboxesResponse.inboxes : [];
      
      // If no inboxes, return empty response
      if (inboxes.length === 0) {
        console.log("No inboxes found in AgentMail");
        return res.json({ emails: [], threads: [], total: 0 });
      }
      
      // Fetch messages from all inboxes (or just the first one for now)
      const firstInbox = inboxes[0];
      console.log(`Fetching messages from inbox: ${firstInbox.id}`);
      
      let messagesResponse: any;
      try {
        messagesResponse = await (agentMail as any).inboxes.messages.list(firstInbox.id);
      } catch (messagesError: any) {
        console.warn("Failed to fetch messages:", messagesError.message);
        return res.json({ emails: [], threads: [], total: 0 });
      }
      
      // Defensive parsing with type validation
      const rawEmails = Array.isArray(messagesResponse?.messages) ? messagesResponse.messages : [];
      console.log(`Found ${rawEmails.length} messages`);
      
      // Validate each email and add threadId
      const validatedEmails = rawEmails
        .map((email: Record<string, any>) => {
          try {
            const parsed = emailSchema.parse(email);
            // Generate threadId using metadata or fallback to subject
            const threadId = generateThreadId(email);
            return { ...parsed, threadId };
          } catch (validationError) {
            console.warn("Invalid email record:", validationError);
            return null;
          }
        })
        .filter((email): email is z.infer<typeof emailSchema> => email !== null);
      
      // Group emails into threads
      const threadsMap = new Map<string, z.infer<typeof emailSchema>[]>();
      validatedEmails.forEach(email => {
        const threadId = email.threadId || email.id;
        if (!threadsMap.has(threadId)) {
          threadsMap.set(threadId, []);
        }
        threadsMap.get(threadId)!.push(email);
      });
      
      // Create thread objects
      const threads = Array.from(threadsMap.entries()).map(([threadId, emails]) => {
        // Sort emails by date (newest first)
        const sortedEmails = emails.sort((a, b) => 
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
        
        // Use original subject from most recent email (preserve casing)
        const originalSubject = sortedEmails[0].subject;
        // Strip reply prefixes but preserve original capitalization
        let displaySubject = originalSubject.trim();
        let prev = '';
        while (prev !== displaySubject) {
          prev = displaySubject;
          displaySubject = displaySubject.replace(/^(Re|Fwd|RE|FWD|Fw):\s*/i, '').trim();
        }
        
        return {
          threadId,
          subject: displaySubject,
          emails: sortedEmails,
          lastReceivedAt: sortedEmails[0].receivedAt,
          unreadCount: sortedEmails.filter(e => !e.read).length,
        };
      });
      
      // Sort threads by most recent email
      threads.sort((a, b) => 
        new Date(b.lastReceivedAt).getTime() - new Date(a.lastReceivedAt).getTime()
      );
      
      const total = typeof messagesResponse?.total === 'number' ? messagesResponse.total : validatedEmails.length;
      
      res.json({ emails: validatedEmails, threads, total });
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: "Failed to fetch emails", emails: [], threads: [], total: 0 });
    }
  });

  // Send email via Outlook
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const outlookClient = await getUncachableOutlookClient();
      
      const sendMail = {
        message: {
          subject: subject,
          body: {
            contentType: "Text",
            content: body
          },
          toRecipients: [
            {
              emailAddress: {
                address: to
              }
            }
          ]
        }
      };

      await outlookClient.api('/me/sendMail').post(sendMail);
      
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Analyze review with AI
  app.post("/api/analyze-review", async (req, res) => {
    try {
      const { reviewContent, customerName, marketplace } = req.body;

      if (!reviewContent) {
        return res.status(400).json({ error: "Review content is required" });
      }

      const analysis = await analyzeReview(
        reviewContent,
        customerName || "Customer",
        marketplace || "Unknown"
      );

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing review:", error);
      res.status(500).json({ error: "Failed to analyze review" });
    }
  });

  // Generate AI reply
  app.post("/api/generate-reply", async (req, res) => {
    try {
      const { reviewContent, customerName, marketplace, sentiment, severity } = req.body;

      if (!reviewContent) {
        return res.status(400).json({ error: "Review content is required" });
      }

      const reply = await generateReply(
        reviewContent,
        customerName || "Customer",
        marketplace || "Unknown",
        sentiment || "neutral",
        severity || "medium"
      );

      res.json({ reply });
    } catch (error) {
      console.error("Error generating AI reply:", error);
      res.status(500).json({ error: "Failed to generate AI reply" });
    }
  });

  // Test Axesso by fetching real Amazon product reviews
  app.post("/api/test-axesso", async (req, res) => {
    try {
      const { getProductReviews, searchProducts } = await import("./integrations/axesso");
      const { amazonUrl, action } = req.body;

      if (action === 'reviews' && amazonUrl) {
        const reviews = await getProductReviews(amazonUrl, 1);
        res.json({ success: true, data: reviews });
      } else if (action === 'search') {
        const keyword = req.body.keyword || 'laptop';
        const results = await searchProducts(keyword, 1);
        res.json({ success: true, data: results });
      } else {
        res.status(400).json({ error: "Invalid action or missing amazonUrl" });
      }
    } catch (error: any) {
      console.error("Axesso test error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch data from Axesso" });
    }
  });

  // Import Amazon reviews - fetch from Axesso and process through AI
  app.post("/api/amazon/import-reviews", async (req, res) => {
    try {
      const { asin } = req.body;
      
      if (!asin || typeof asin !== 'string') {
        return res.status(400).json({ error: "ASIN is required" });
      }
      
      // Fetch reviews from Axesso
      const { getProductReviews } = await import("./integrations/axesso");
      const result = await getProductReviews(asin);
      
      if (!result.reviews || result.reviews.length === 0) {
        return res.json({ 
          imported: 0, 
          message: "No reviews found for this ASIN" 
        });
      }

      console.log(`Processing ${result.reviews.length} reviews from Amazon...`);
      
      // Process each review through AI
      const processedReviews = [];
      for (const review of result.reviews) {
        try {
          // Axesso returns: text, userName, title, rating, date
          const reviewText = review.text || '';
          const userName = review.userName || 'Anonymous';
          const reviewTitle = review.title || 'Review';
          const ratingString = review.rating || '0';
          const reviewDate = review.date || new Date().toISOString();
          
          // Analyze the review
          const analysis = await analyzeReview(
            reviewText,
            userName,
            "Amazon"
          );

          // Generate AI reply
          const aiReply = await generateReply(
            reviewText,
            userName,
            "Amazon",
            analysis.sentiment,
            analysis.severity
          );

          const processedReview = {
            id: `amazon-${asin}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            marketplace: "Amazon" as const,
            title: reviewTitle,
            content: reviewText,
            customerName: userName,
            customerEmail: `${userName.toLowerCase().replace(/\s+/g, '.')}@amazon.customer`,
            rating: parseFloat(ratingString.replace(/[^\d.]/g, '')),
            sentiment: analysis.sentiment,
            category: analysis.category,
            severity: analysis.severity,
            status: "open",
            createdAt: new Date(reviewDate),
            aiSuggestedReply: aiReply,
            verified: true,
            asin: asin,
          };

          processedReviews.push(processedReview);
          console.log(`✓ Processed review from ${userName} (${analysis.sentiment}/${analysis.severity})`);
        } catch (error) {
          console.error(`Failed to process review:`, error);
        }
      }

      // Store in global reviews array (in-memory for now)
      if (!global.importedReviews) {
        global.importedReviews = [];
      }
      global.importedReviews.push(...processedReviews);

      console.log(`✓ Successfully imported ${processedReviews.length} reviews`);
      
      res.json({
        imported: processedReviews.length,
        asin,
        reviews: processedReviews
      });
    } catch (error: any) {
      console.error("Failed to import Amazon reviews:", error);
      res.status(500).json({ 
        error: error.message || "Failed to import Amazon reviews" 
      });
    }
  });

  // Fetch Amazon reviews by ASIN (preview only, no import)
  app.post("/api/amazon/reviews", async (req, res) => {
    try {
      const { asin } = req.body;
      
      if (!asin || typeof asin !== 'string') {
        return res.status(400).json({ error: "ASIN is required" });
      }
      
      // Import the function here to avoid circular dependencies
      const { getProductReviews } = await import("./integrations/axesso");
      
      const result = await getProductReviews(asin);
      
      res.json({
        asin,
        reviews: result.reviews || [],
        total: result.reviews?.length || 0
      });
    } catch (error: any) {
      console.error("Failed to fetch Amazon reviews:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch Amazon reviews" 
      });
    }
  });

  // Get all imported reviews
  app.get("/api/reviews/imported", async (req, res) => {
    try {
      const reviews = global.importedReviews || [];
      res.json({ reviews, total: reviews.length });
    } catch (error: any) {
      console.error("Failed to fetch imported reviews:", error);
      res.status(500).json({ error: "Failed to fetch imported reviews" });
    }
  });

  // Check integration status
  app.get("/api/integrations/status", async (req, res) => {
    const status = {
      agentmail: {
        name: "AgentMail",
        connected: false,
        details: "",
        lastChecked: new Date().toISOString(),
      },
      outlook: {
        name: "Microsoft Outlook",
        connected: false,
        details: "",
        lastChecked: new Date().toISOString(),
      },
      openrouter: {
        name: "OpenRouter (Grok AI)",
        connected: false,
        details: "",
        lastChecked: new Date().toISOString(),
      },
      axesso: {
        name: "Axesso (Amazon Data)",
        connected: false,
        details: "",
        lastChecked: new Date().toISOString(),
      },
    };

    // Check AgentMail
    try {
      const agentMail = await getUncachableAgentMailClient();
      const inboxes = await (agentMail as any).inboxes.list();
      status.agentmail.connected = true;
      status.agentmail.details = `Connected with ${inboxes.data?.length || 0} inbox(es)`;
    } catch (error: any) {
      status.agentmail.connected = false;
      status.agentmail.details = error.message || "Not configured";
    }

    // Check Outlook
    try {
      const outlookClient = await getUncachableOutlookClient();
      const user = await outlookClient.api('/me').get();
      status.outlook.connected = true;
      status.outlook.details = `Connected as ${user.displayName || user.mail || user.userPrincipalName}`;
    } catch (error: any) {
      status.outlook.connected = false;
      status.outlook.details = error.message || "Not configured";
    }

    // Check OpenRouter
    try {
      const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("API key not configured");
      }
      
      // Simple validation - just check if key exists
      status.openrouter.connected = true;
      status.openrouter.details = "API key configured (Grok 4.1 Fast model)";
    } catch (error: any) {
      status.openrouter.connected = false;
      status.openrouter.details = error.message || "API key not configured";
    }

    // Check Axesso
    try {
      const result = await testAxessoConnection();
      status.axesso.connected = result.connected;
      status.axesso.details = result.details;
    } catch (error: any) {
      status.axesso.connected = false;
      status.axesso.details = error.message || "API key not configured";
    }

    res.json(status);
  });

  const httpServer = createServer(app);
  return httpServer;
}

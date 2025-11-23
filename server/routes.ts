import type { Express } from "express";
import { createServer, type Server } from "http";
import { getUncachableAgentMailClient } from "./integrations/agentmail";
import { getUncachableOutlookClient } from "./integrations/outlook";
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

  // Generate AI reply using OpenRouter
  app.post("/api/generate-reply", async (req, res) => {
    try {
      const { reviewContent, sentiment, category } = req.body;

      if (!reviewContent) {
        return res.status(400).json({ error: "Review content is required" });
      }

      const prompt = `You are a professional customer service representative. Generate a professional, empathetic response to the following customer review.

Review: ${reviewContent}
Sentiment: ${sentiment}
Category: ${category}

Generate a professional response that:
1. Acknowledges the customer's concern
2. Shows empathy and understanding
3. Offers a solution or next steps
4. Maintains a professional and helpful tone
5. Is concise (2-3 paragraphs maximum)

Response:`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DEPLOYMENT_URL || "http://localhost:5000",
        },
        body: JSON.stringify({
          model: "x-ai/grok-2-1212",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || "Unable to generate response";

      res.json({ reply });
    } catch (error) {
      console.error("Error generating AI reply:", error);
      res.status(500).json({ error: "Failed to generate AI reply" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

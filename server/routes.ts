import type { Express } from "express";
import { createServer, type Server } from "http";
import { getUncachableOutlookClient } from "./integrations/outlook";
import { testAxessoConnection } from "./integrations/axesso";
import { testWalmartConnection } from "./integrations/walmart";
import { analyzeReview, generateReply, classifyEmail } from "./ai/service";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import multer from "multer";
import { parse } from "csv-parse/sync";

// Helper function to strip HTML tags and clean email content
function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Remove multiple spaces and trim
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

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
  // Setup Replit Auth
  await setupAuth(app);
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Fetch emails from Outlook and auto-import reviews
  app.get("/api/emails", async (req, res) => {
    try {
      const outlookClient = await getUncachableOutlookClient();
      
      // Fetch recent emails from Outlook inbox (last 50 messages)
      const messagesResponse = await outlookClient
        .api('/me/messages')
        .top(50)
        .select('id,subject,from,receivedDateTime,bodyPreview,body,conversationId,isRead')
        .orderby('receivedDateTime DESC')
        .get();
      
      const rawEmails = Array.isArray(messagesResponse?.value) ? messagesResponse.value : [];
      console.log(`Found ${rawEmails.length} Outlook messages`);
      
      // Transform Outlook messages to our email format
      const transformedEmails = rawEmails.map((msg: any) => ({
        id: msg.id,
        from: {
          name: msg.from?.emailAddress?.name || 'Unknown',
          email: msg.from?.emailAddress?.address || 'unknown@email.com',
        },
        subject: msg.subject || '(No Subject)',
        body: msg.body?.content || msg.bodyPreview || '',
        receivedAt: msg.receivedDateTime,
        read: msg.isRead || false,
        threadId: msg.conversationId,
      }));
      
      // Validate emails with schema
      const validatedEmails = transformedEmails
        .map((email: Record<string, any>) => {
          try {
            const parsed = emailSchema.parse(email);
            return parsed;
          } catch (validationError) {
            console.warn("Invalid email record:", validationError);
            return null;
          }
        })
        .filter((email: any): email is z.infer<typeof emailSchema> => email !== null);
      
      // Group emails into threads
      const threadsMap = new Map<string, z.infer<typeof emailSchema>[]>();
      validatedEmails.forEach((email: z.infer<typeof emailSchema>) => {
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
      
      res.json({ 
        emails: validatedEmails, 
        threads, 
        total: validatedEmails.length 
      });
    } catch (error: any) {
      console.error("Error fetching Outlook emails:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch emails", 
        emails: [], 
        threads: [], 
        total: 0 
      });
    }
  });

  // Sync Outlook emails and auto-import reviews using AI (user-scoped)
  app.post("/api/emails/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const outlookClient = await getUncachableOutlookClient();
      
      // Fetch recent emails from Outlook (last 24 hours recommended)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const messagesResponse = await outlookClient
        .api('/me/messages')
        .filter(`receivedDateTime ge ${oneDayAgo.toISOString()}`)
        .top(50)
        .select('id,subject,from,receivedDateTime,bodyPreview,body')
        .orderby('receivedDateTime DESC')
        .get();
      
      const rawEmails = Array.isArray(messagesResponse?.value) ? messagesResponse.value : [];
      console.log(`Syncing ${rawEmails.length} recent Outlook emails...`);
      
      let imported = 0;
      let skipped = 0;
      const importedReviews = [];
      
      for (const msg of rawEmails) {
        const rawEmailBody = msg.body?.content || msg.bodyPreview || '';
        const emailBody = stripHtmlTags(rawEmailBody);
        const senderName = msg.from?.emailAddress?.name || 'Unknown';
        const senderEmail = msg.from?.emailAddress?.address || '';
        const subject = msg.subject || '(No Subject)';
        
        // Skip if no meaningful content
        if (!emailBody || emailBody.length < 10) {
          skipped++;
          continue;
        }
        
        // Use AI to classify if this is a review/complaint
        const classification = await classifyEmail(subject, emailBody, senderName);
        
        console.log(`Email "${subject}" - Review: ${classification.isReviewOrComplaint} (${classification.confidence}% confidence)`);
        
        if (classification.isReviewOrComplaint && classification.confidence > 50) {
          // Check for duplicates using email ID
          const externalReviewId = `outlook-${msg.id}`;
          const existingReview = await storage.checkReviewExists(externalReviewId, 'Mailbox', userId);
          
          if (existingReview) {
            console.log(`Skipping duplicate review: ${subject}`);
            skipped++;
            continue;
          }
          
          // Analyze the review content
          const analysis = await analyzeReview(emailBody, senderName, 'Email');
          
          // Generate AI reply
          const aiReply = await generateReply(
            emailBody,
            senderName,
            'Email',
            analysis.sentiment,
            analysis.severity
          );
          
          // Import as review (with userId)
          const newReview = await storage.createReview({
            userId,
            externalReviewId,
            marketplace: 'Mailbox',
            productId: 'email-review',
            title: subject,
            content: emailBody.substring(0, 5000), // Limit content length
            customerName: senderName,
            customerEmail: senderEmail,
            rating: analysis.sentiment === 'positive' ? 5 : analysis.sentiment === 'negative' ? 1 : 3,
            sentiment: analysis.sentiment,
            category: analysis.category,
            severity: analysis.severity,
            createdAt: new Date(msg.receivedDateTime),
            status: 'open',
            aiSuggestedReply: aiReply,
            aiAnalysisDetails: JSON.stringify(analysis),
            verified: 0,
          });
          
          importedReviews.push(newReview);
          imported++;
          console.log(`✅ Imported review from ${senderName}: "${subject}"`);
        } else {
          skipped++;
        }
      }
      
      res.json({ 
        success: true,
        imported,
        skipped,
        total: rawEmails.length,
        message: `Imported ${imported} review(s), skipped ${skipped} email(s)`,
      });
    } catch (error: any) {
      console.error("Error syncing Outlook emails:", error);
      res.status(500).json({ error: error.message || "Failed to sync emails" });
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
        const reviews = await getProductReviews(amazonUrl);
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

  // Configure multer for file upload (in-memory storage)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Generic file import endpoint for CSV/JSON reviews (user-scoped)
  app.post("/api/reviews/import-file", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { marketplace } = req.body;
      if (!marketplace) {
        return res.status(400).json({ error: "Marketplace is required" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      let reviews: any[] = [];

      // Parse based on file type
      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        // Parse JSON
        reviews = JSON.parse(fileContent);
      } else if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
        // Parse CSV
        reviews = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } else {
        return res.status(400).json({ error: "Unsupported file type. Use CSV or JSON." });
      }

      if (!Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).json({ error: "No reviews found in file" });
      }

      console.log(`Processing ${reviews.length} reviews from file for ${marketplace}...`);

      // Process each review through AI
      const processedReviews = [];
      for (const review of reviews) {
        try {
          const reviewText = review.content || review.Content || review.text || '';
          const title = review.title || review.Title || '';
          const customerName = review.customerName || review['Customer Name'] || review.customer_name || 'Anonymous';
          const customerEmail = review.customerEmail || review['Customer Email'] || review.customer_email || '';
          const rating = parseInt(review.rating || review.Rating || '0');
          const createdAt = review.createdAt || review['Created At'] || review.created_at || new Date().toISOString();

          if (!reviewText) {
            console.log(`Skipping review with no content`);
            continue;
          }

          // Analyze review with AI
          const analysis = await analyzeReview(reviewText, customerName, marketplace);
          
          // Generate AI reply
          const aiReply = await generateReply(
            reviewText,
            customerName,
            marketplace,
            analysis.sentiment,
            analysis.severity
          );

          processedReviews.push({
            id: `${marketplace.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            marketplace,
            title: title || `Review from ${customerName}`,
            content: reviewText,
            customerName,
            customerEmail,
            rating: rating || undefined,
            sentiment: analysis.sentiment,
            category: analysis.category,
            severity: analysis.severity,
            status: "pending",
            createdAt: new Date(createdAt),
            aiSuggestedReply: aiReply,
            verified: false
          });
        } catch (reviewError) {
          console.error(`Error processing review:`, reviewError);
          continue;
        }
      }

      // Save all processed reviews to database with duplicate detection
      let importedCount = 0;
      let skippedCount = 0;
      
      for (const processedReview of processedReviews) {
        try {
          const externalReviewId = processedReview.id;
          
          // Check for duplicates
          if (externalReviewId) {
            const exists = await storage.checkReviewExists(externalReviewId, marketplace, userId);
            if (exists) {
              console.log(`⊘ Skipping duplicate review: ${externalReviewId}`);
              skippedCount++;
              continue;
            }
          }
          
          await storage.createReview({
            userId,
            externalReviewId,
            marketplace: processedReview.marketplace,
            productId: null,
            title: processedReview.title,
            content: processedReview.content,
            customerName: processedReview.customerName,
            customerEmail: processedReview.customerEmail,
            rating: processedReview.rating,
            sentiment: processedReview.sentiment,
            category: processedReview.category,
            severity: processedReview.severity,
            status: processedReview.status,
            createdAt: processedReview.createdAt,
            aiSuggestedReply: processedReview.aiSuggestedReply,
            aiAnalysisDetails: undefined,
            verified: processedReview.verified ? 1 : 0,
          });
          
          importedCount++;
        } catch (error) {
          console.error(`Failed to save review:`, error);
          skippedCount++;
        }
      }

      console.log(`Successfully imported ${importedCount} reviews from file (${skippedCount} duplicates skipped)`);

      res.json({ 
        imported: importedCount,
        skipped: skippedCount + (reviews.length - processedReviews.length),
        message: `Successfully imported ${importedCount} reviews`
      });
    } catch (error: any) {
      console.error("Error importing reviews from file:", error);
      res.status(500).json({ error: error.message || "Failed to import reviews" });
    }
  });

  // Import Amazon reviews - fetch from Axesso and process through AI (user-scoped)
  app.post("/api/amazon/import-reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      let { asin, productUrl } = req.body;
      
      // Accept either ASIN or productUrl
      const productIdentifier = productUrl || asin;
      
      if (!productIdentifier || typeof productIdentifier !== 'string') {
        return res.status(400).json({ error: "Product URL or ASIN is required" });
      }
      
      // Sanitize: remove invisible Unicode characters, whitespace, and trim
      const sanitized = productIdentifier
        .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // Remove invisible Unicode chars
        .trim();
      
      // Extract ASIN from URL if provided
      let extractedAsin = sanitized;
      if (sanitized.includes('amazon')) {
        // Try to extract ASIN from URL patterns like /dp/ASIN or /gp/product/ASIN
        const asinMatch = sanitized.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
        if (asinMatch) {
          extractedAsin = asinMatch[1];
        }
      }
      
      console.log(`Importing Amazon reviews for: ${sanitized} (ASIN: ${extractedAsin})`);
      
      // Try Apify first (supports more reviews), fall back to Axesso
      const { isApifyConfigured, getAmazonReviews, convertApifyReview } = await import("./integrations/apify");
      const { getProductReviews } = await import("./integrations/axesso");
      
      let rawReviews: any[] = [];
      let productName = `Amazon Product ${extractedAsin}`;
      let usedApify = false;
      
      const apifyConfigured = isApifyConfigured();
      console.log(`Apify configured: ${apifyConfigured}, APIFY_API_TOKEN exists: ${!!process.env.APIFY_API_TOKEN}`);
      
      if (apifyConfigured) {
        console.log("Using Apify for Amazon import (requesting 50 reviews)...");
        try {
          const { reviews: apifyReviews } = await getAmazonReviews(sanitized, 50);
          console.log(`Apify returned ${apifyReviews.length} reviews`);
          
          // Convert Apify reviews to standard format
          rawReviews = apifyReviews.map(review => {
            const converted = convertApifyReview(review);
            return {
              reviewId: converted.externalReviewId,
              text: converted.content,
              userName: converted.customerName,
              title: converted.title,
              rating: converted.rating.toString(),
              date: converted.reviewDate.toISOString(),
              verified: converted.verified,
            };
          });
          usedApify = true;
        } catch (error: any) {
          console.error("Apify failed with error:", error?.message || error);
          console.log("Falling back to Axesso...");
        }
      }
      
      // Fallback to Axesso if Apify not configured or failed
      if (rawReviews.length === 0) {
        console.log("Using Axesso for Amazon import (limited to ~8 reviews)...");
        const result = await getProductReviews(sanitized);
        rawReviews = result.reviews || [];
        productName = (result as any).productTitle || productName;
      }
      
      if (rawReviews.length === 0) {
        return res.json({ 
          imported: 0, 
          message: "No reviews found for this product" 
        });
      }
      
      console.log(`Fetched ${rawReviews.length} reviews via ${usedApify ? 'Apify' : 'Axesso'} for "${productName}"`);
      
      console.log(`Processing ${rawReviews.length} reviews for "${productName}" in parallel...`);
      
      // Filter out duplicates first
      const reviewsToProcess: Array<{
        review: any;
        externalReviewId: string | null;
        reviewText: string;
        userName: string;
        reviewTitle: string;
        ratingString: string;
        reviewDate: string;
      }> = [];
      
      let skippedCount = 0;
      
      for (const review of rawReviews) {
        const externalReviewId = (review as any).reviewId || (review as any).id || null;
        if (externalReviewId) {
          const exists = await storage.checkReviewExists(externalReviewId, "Amazon", userId);
          if (exists) {
            console.log(`⊘ Skipping duplicate review: ${externalReviewId}`);
            skippedCount++;
            continue;
          }
        }
        
        reviewsToProcess.push({
          review,
          externalReviewId,
          reviewText: review.text || '',
          userName: review.userName || 'Anonymous',
          reviewTitle: review.title || 'Review',
          ratingString: review.rating || '0',
          reviewDate: review.date || new Date().toISOString(),
        });
      }
      
      // Process reviews in parallel (batch of 5 for rate limiting)
      const BATCH_SIZE = 5;
      let importedCount = 0;
      
      for (let i = 0; i < reviewsToProcess.length; i += BATCH_SIZE) {
        const batch = reviewsToProcess.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.allSettled(
          batch.map(async ({ externalReviewId, reviewText, userName, reviewTitle, ratingString, reviewDate }) => {
            // Run analysis and reply generation in parallel
            const [analysis, aiReply] = await Promise.all([
              analyzeReview(reviewText, userName, "Amazon"),
              generateReply(reviewText, userName, "Amazon", "neutral", "medium") // Initial call, will be refined
            ]);

            // Save to database with userId
            await storage.createReview({
              userId,
              externalReviewId,
              marketplace: "Amazon",
              productId: extractedAsin,
              title: reviewTitle,
              content: reviewText,
              customerName: userName,
              customerEmail: `${userName.toLowerCase().replace(/\s+/g, '.')}@amazon.customer`,
              rating: Math.round(parseFloat(ratingString.replace(/[^\d.]/g, '')) || 0),
              sentiment: analysis.sentiment,
              category: analysis.category,
              severity: analysis.severity,
              status: "open",
              createdAt: new Date(reviewDate),
              aiSuggestedReply: aiReply,
              aiAnalysisDetails: JSON.stringify(analysis),
              verified: 1,
            });
            
            return { userName, sentiment: analysis.sentiment, severity: analysis.severity };
          })
        );
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            importedCount++;
            console.log(`✓ Imported review from ${result.value.userName} (${result.value.sentiment}/${result.value.severity})`);
          } else {
            console.error(`Failed to process review:`, result.reason);
            skippedCount++;
          }
        }
      }

      // Track the product in database (with userId)
      const existingProduct = await storage.getProductByIdentifier("Amazon", extractedAsin, userId);
      
      if (existingProduct) {
        await storage.updateProductLastImported(existingProduct.id);
        console.log(`✓ Updated product tracking for "${productName}"`);
      } else {
        await storage.createProduct({
          userId,
          platform: "Amazon",
          productId: extractedAsin,
          productName,
        });
        console.log(`✓ Added product to tracking: "${productName}"`);
      }

      console.log(`✓ Successfully imported ${importedCount} reviews for "${productName}" (${skippedCount} duplicates skipped)`);
      
      res.json({
        imported: importedCount,
        skipped: skippedCount,
        asin: extractedAsin,
        productName,
      });
    } catch (error: any) {
      console.error("Failed to import Amazon reviews:", error);
      
      // Parse error message and status
      const errorMessage = error.message || "";
      
      // Check if it's an Axesso API error with status code
      const axessoErrorMatch = errorMessage.match(/Axesso API error \((\d+)\)/);
      
      if (axessoErrorMatch) {
        const statusCode = parseInt(axessoErrorMatch[1]);
        
        // 404 - Product not found
        if (statusCode === 404 || errorMessage.includes("could not find product")) {
          return res.status(404).json({ 
            error: "Product not found. Please verify the ASIN or product URL and try again. Note: Axesso has limited product coverage on the free tier." 
          });
        }
        
        // 403 - Subscription issue
        if (statusCode === 403) {
          return res.status(403).json({ 
            error: "Axesso API access denied. Please check your subscription status on RapidAPI." 
          });
        }
        
        // 429 - Rate limit
        if (statusCode === 429) {
          return res.status(429).json({ 
            error: "Rate limit exceeded. Please try again later." 
          });
        }
        
        // Other Axesso errors
        return res.status(400).json({ 
          error: "Unable to fetch reviews from Amazon. Please check the ASIN/URL and try again." 
        });
      }
      
      // Non-Axesso errors
      res.status(500).json({ 
        error: error.message || "Failed to import Amazon reviews. Please try again." 
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

  // Get all imported reviews (user-scoped)
  app.get("/api/reviews/imported", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const reviews = await storage.getReviews(userId);
      res.json({ reviews, total: reviews.length });
    } catch (error: any) {
      console.error("Failed to fetch imported reviews:", error);
      res.status(500).json({ error: "Failed to fetch imported reviews" });
    }
  });

  // Update review status (for workflow management)
  app.patch("/api/reviews/:reviewId/status", async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { status } = req.body;

      if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status. Must be one of: open, in_progress, resolved" 
        });
      }

      await storage.updateReviewStatus(reviewId, status);
      res.json({ success: true, reviewId, status });
    } catch (error: any) {
      console.error("Failed to update review status:", error);
      res.status(500).json({ error: "Failed to update review status" });
    }
  });

  // Get analytics data (user-scoped)
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        productId, 
        marketplaces, 
        sentiments, 
        statuses, 
        ratings 
      } = req.query;
      
      // Get all reviews for this user
      const userId = req.user?.claims?.sub;
      const allReviews = await storage.getReviews(userId);
      
      // Apply filters
      let filteredReviews = allReviews;

      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        filteredReviews = filteredReviews.filter(r => {
          const reviewDate = new Date(r.createdAt);
          return reviewDate >= start && reviewDate <= end;
        });
      }

      // Filter by product
      if (productId) {
        const [platform, prodId] = (productId as string).split('-');
        filteredReviews = filteredReviews.filter(r => 
          r.marketplace === platform && r.productId === prodId
        );
      }

      // Filter by marketplaces
      if (marketplaces) {
        const marketplaceList = (marketplaces as string).split(',');
        filteredReviews = filteredReviews.filter(r => 
          marketplaceList.includes(r.marketplace)
        );
      }

      // Filter by sentiments
      if (sentiments) {
        const sentimentList = (sentiments as string).split(',');
        filteredReviews = filteredReviews.filter(r => 
          sentimentList.includes(r.sentiment)
        );
      }

      // Filter by statuses
      if (statuses) {
        const statusList = (statuses as string).split(',');
        filteredReviews = filteredReviews.filter(r => 
          statusList.includes(r.status)
        );
      }

      // Filter by ratings
      if (ratings) {
        const ratingList = (ratings as string).split(',').map(Number);
        filteredReviews = filteredReviews.filter(r => 
          r.rating && ratingList.includes(Math.floor(r.rating))
        );
      }

      // Calculate sentiment distribution
      const sentimentCounts = filteredReviews.reduce((acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Standardized category list
      const STANDARD_CATEGORIES = [
        "Product Quality",
        "Product Performance", 
        "Shipping & Delivery",
        "Packaging",
        "Customer Service",
        "Value & Pricing",
        "Sizing & Fit",
        "Color & Appearance",
        "Setup & Instructions",
        "Compatibility",
        "Safety Concern",
        "Praise & Satisfaction"
      ];

      // Map legacy categories to standardized ones
      const mapToStandardCategory = (category: string): string => {
        const categoryLower = category.toLowerCase();
        
        // Direct matches to standard categories
        for (const stdCat of STANDARD_CATEGORIES) {
          if (categoryLower === stdCat.toLowerCase()) return stdCat;
        }
        
        // Map common legacy categories
        if (categoryLower.includes('quality') || categoryLower.includes('durability') || categoryLower.includes('defect')) {
          return "Product Quality";
        }
        if (categoryLower.includes('performance') || categoryLower.includes('function') || categoryLower.includes('work')) {
          return "Product Performance";
        }
        if (categoryLower.includes('ship') || categoryLower.includes('delivery') || categoryLower.includes('arrive')) {
          return "Shipping & Delivery";
        }
        if (categoryLower.includes('packag') || categoryLower.includes('box')) {
          return "Packaging";
        }
        if (categoryLower.includes('service') || categoryLower.includes('support') || categoryLower.includes('response')) {
          return "Customer Service";
        }
        if (categoryLower.includes('price') || categoryLower.includes('value') || categoryLower.includes('cost') || categoryLower.includes('expensive')) {
          return "Value & Pricing";
        }
        if (categoryLower.includes('size') || categoryLower.includes('fit')) {
          return "Sizing & Fit";
        }
        if (categoryLower.includes('color') || categoryLower.includes('appearance') || categoryLower.includes('look') || categoryLower.includes('design')) {
          return "Color & Appearance";
        }
        if (categoryLower.includes('setup') || categoryLower.includes('install') || categoryLower.includes('instruction') || categoryLower.includes('assemble')) {
          return "Setup & Instructions";
        }
        if (categoryLower.includes('compat') || categoryLower.includes('work with')) {
          return "Compatibility";
        }
        if (categoryLower.includes('safe') || categoryLower.includes('hazard') || categoryLower.includes('danger')) {
          return "Safety Concern";
        }
        if (categoryLower.includes('great') || categoryLower.includes('love') || categoryLower.includes('recommend') || 
            categoryLower.includes('praise') || categoryLower.includes('satisfied') || categoryLower.includes('happy') ||
            categoryLower.includes('excellent') || categoryLower.includes('perfect') || categoryLower.includes('feature')) {
          return "Praise & Satisfaction";
        }
        
        // Default fallback based on sentiment if no match
        return "Product Performance";
      };

      // Calculate category distribution with standardized mapping
      const categoryCounts = filteredReviews.reduce((acc, r) => {
        const standardCategory = mapToStandardCategory(r.category);
        acc[standardCategory] = (acc[standardCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate marketplace distribution
      const marketplaceCounts = filteredReviews.reduce((acc, r) => {
        acc[r.marketplace] = (acc[r.marketplace] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate severity distribution
      const severityCounts = filteredReviews.reduce((acc, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate rating distribution
      const ratingCounts = filteredReviews.reduce((acc, r) => {
        if (r.rating) {
          const rating = Math.floor(r.rating);
          acc[rating] = (acc[rating] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      // Calculate status distribution
      const statusCounts = filteredReviews.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate weekly sentiment trends based on actual review dates (using reviewDate, not createdAt)
      const weeklyTrends: Record<string, { positive: number; neutral: number; negative: number }> = {};
      
      // Group reviews by their actual review week
      filteredReviews.forEach(r => {
        // Use the review creation date
        const reviewDate = new Date(r.createdAt);
        
        // Get start of week (Sunday)
        const startOfWeek = new Date(reviewDate);
        startOfWeek.setDate(reviewDate.getDate() - reviewDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Format as readable date range (e.g., "Nov 17-23")
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const weekKey = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endOfWeek.getDate()}`;
        
        if (!weeklyTrends[weekKey]) {
          weeklyTrends[weekKey] = { positive: 0, neutral: 0, negative: 0 };
        }
        
        weeklyTrends[weekKey][r.sentiment as 'positive' | 'neutral' | 'negative']++;
      });
      
      // Sort weeks chronologically and limit to last 12 weeks with data
      const sortedWeeks = Object.keys(weeklyTrends).sort((a, b) => {
        const parseWeekStart = (key: string) => {
          const [monthDay] = key.split('-');
          return new Date(`${monthDay} ${new Date().getFullYear()}`);
        };
        return parseWeekStart(a).getTime() - parseWeekStart(b).getTime();
      }).slice(-12);
      
      // Rebuild sorted trends object
      const sortedTrends: Record<string, { positive: number; neutral: number; negative: number }> = {};
      sortedWeeks.forEach(week => {
        sortedTrends[week] = weeklyTrends[week];
      });

      // Calculate stats
      const totalReviews = filteredReviews.length;
      const positiveRate = totalReviews > 0 ? (sentimentCounts.positive || 0) / totalReviews : 0;
      const negativeRate = totalReviews > 0 ? (sentimentCounts.negative || 0) / totalReviews : 0;
      const resolutionRate = totalReviews > 0 ? (statusCounts.resolved || 0) / totalReviews : 0;
      
      // Calculate average rating
      const reviewsWithRating = filteredReviews.filter(r => r.rating);
      const avgRating = reviewsWithRating.length > 0
        ? reviewsWithRating.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsWithRating.length
        : 0;

      res.json({
        stats: {
          totalReviews,
          positiveRate: (positiveRate * 100).toFixed(1),
          negativeRate: (negativeRate * 100).toFixed(1),
          resolutionRate: (resolutionRate * 100).toFixed(1),
          avgRating: avgRating.toFixed(1),
        },
        sentimentCounts,
        categoryCounts,
        marketplaceCounts,
        severityCounts,
        ratingCounts,
        statusCounts,
        weeklyTrends: sortedTrends,
      });
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get all tracked products (user-scoped)
  app.get("/api/products/tracked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const products = await storage.getProducts(userId);
      
      // Get review counts for each product
      const productsWithCounts = await Promise.all(
        products.map(async (product) => {
          const reviewCount = await storage.getReviewCountForProduct(product.platform, product.productId, userId);
          return {
            id: product.id,
            platform: product.platform,
            productId: product.productId,
            productName: product.productName,
            reviewCount,
            lastImported: product.lastImported?.toISOString() || new Date().toISOString(),
          };
        })
      );
      
      res.json({ products: productsWithCounts, total: productsWithCounts.length });
    } catch (error: any) {
      console.error("Failed to fetch tracked products:", error);
      res.status(500).json({ error: "Failed to fetch tracked products" });
    }
  });

  // Delete a tracked product (user-scoped)
  app.post("/api/products/delete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { productId, platform, deleteReviews } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      // Find the product first
      const product = await storage.getProductByIdentifier(platform, productId, userId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      let deletedReviewsCount = 0;
      
      // If deleteReviews is true, delete all reviews for this product
      if (deleteReviews) {
        deletedReviewsCount = await storage.deleteReviewsForProduct(platform, productId, userId);
        console.log(`Deleted ${deletedReviewsCount} reviews for product ${productId}`);
      }

      // Delete the product
      const deleted = await storage.deleteProduct(product.id, userId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete product" });
      }

      console.log(`Deleted product ${productId} (${platform}) for user ${userId}`);

      res.json({ 
        success: true, 
        message: deleteReviews 
          ? `Product removed and ${deletedReviewsCount} review(s) deleted`
          : "Product removed from tracking",
        deletedReviewsCount
      });
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Refresh reviews for a specific product (user-scoped)
  app.post("/api/products/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { productId, platform } = req.body;
      
      if (!productId || !platform) {
        return res.status(400).json({ error: "Product ID and platform are required" });
      }

      console.log(`Refreshing reviews for ${platform} product: ${productId}`);

      let importedCount = 0;
      let skippedCount = 0;

      // Fetch latest reviews based on platform
      if (platform === "Amazon") {
        // Try Apify first (supports amazon.ca, amazon.com, etc. with pagination)
        // Fall back to Axesso if Apify is not configured
        const { isApifyConfigured, getAmazonReviews, convertApifyReview } = await import("./integrations/apify");
        const { getProductReviews } = await import("./integrations/axesso");
        
        let reviewsToProcess: Array<any> = [];
        
        const apifyConfigured = isApifyConfigured();
        console.log(`Apify configured: ${apifyConfigured}, APIFY_API_TOKEN exists: ${!!process.env.APIFY_API_TOKEN}`);
        
        if (apifyConfigured) {
          console.log("Using Apify for Amazon reviews (requesting 50)...");
          try {
            const { reviews } = await getAmazonReviews(productId, 50);
            console.log(`Apify returned ${reviews.length} reviews`);
            
            for (const review of reviews) {
              const converted = convertApifyReview(review);
              const exists = await storage.checkReviewExists(converted.externalReviewId, "Amazon", userId);
              if (exists) {
                skippedCount++;
                continue;
              }
              reviewsToProcess.push({
                externalReviewId: converted.externalReviewId,
                reviewText: converted.content,
                userName: converted.customerName,
                reviewTitle: converted.title,
                ratingString: converted.rating.toString(),
                reviewDate: converted.reviewDate.toISOString(),
              });
            }
          } catch (error: any) {
            console.error("Apify failed with error:", error?.message || error);
            console.log("Falling back to Axesso...");
            reviewsToProcess = [];
          }
        }
        
        // Fallback to Axesso if Apify not configured or failed
        if (reviewsToProcess.length === 0 && skippedCount === 0) {
          console.log("Using Axesso for Amazon reviews (limited to ~8 reviews)... Reason: Apify not configured or failed");
          const result = await getProductReviews(productId);
          
          if (!result.reviews || result.reviews.length === 0) {
            return res.json({ 
              imported: 0,
              skipped: 0,
              message: "No reviews found for this product" 
            });
          }

          for (const review of result.reviews) {
            const externalReviewId = (review as any).reviewId || (review as any).id || null;
            if (externalReviewId) {
              const exists = await storage.checkReviewExists(externalReviewId, "Amazon", userId);
              if (exists) {
                skippedCount++;
                continue;
              }
            }
            reviewsToProcess.push({
              externalReviewId,
              reviewText: review.text || '',
              userName: review.userName || 'Anonymous',
              reviewTitle: review.title || 'Review',
              ratingString: review.rating || '0',
              reviewDate: review.date || new Date().toISOString(),
            });
          }
        }
        
        if (reviewsToProcess.length === 0 && skippedCount === 0) {
          return res.json({ 
            imported: 0,
            skipped: 0,
            message: "No reviews found for this product" 
          });
        }

        // Process in parallel batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < reviewsToProcess.length; i += BATCH_SIZE) {
          const batch = reviewsToProcess.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async ({ externalReviewId, reviewText, userName, reviewTitle, ratingString, reviewDate }) => {
              const [analysis, aiReply] = await Promise.all([
                analyzeReview(reviewText, userName, "Amazon"),
                generateReply(reviewText, userName, "Amazon", "neutral", "medium")
              ]);
              await storage.createReview({
                userId,
                externalReviewId,
                marketplace: "Amazon",
                productId,
                title: reviewTitle,
                content: reviewText,
                customerName: userName,
                customerEmail: `${userName.toLowerCase().replace(/\s+/g, '.')}@amazon.customer`,
                rating: Math.round(parseFloat(ratingString.replace(/[^\d.]/g, '')) || 0),
                sentiment: analysis.sentiment,
                category: analysis.category,
                severity: analysis.severity,
                status: "open",
                createdAt: new Date(reviewDate),
                aiSuggestedReply: aiReply,
                aiAnalysisDetails: JSON.stringify(analysis),
                verified: 1,
              });
            })
          );
          importedCount += batchResults.filter(r => r.status === 'fulfilled').length;
          skippedCount += batchResults.filter(r => r.status === 'rejected').length;
        }
      } else if (platform === "Walmart") {
        const { fetchWalmartProduct } = await import("./integrations/walmart");
        
        // Construct Walmart product URL
        const productUrl = `https://www.walmart.com/ip/${productId}`;
        const result = await fetchWalmartProduct(productUrl);
        
        if (!result.reviews || result.reviews.length === 0) {
          return res.json({ 
            imported: 0,
            skipped: 0,
            message: "No reviews found for this Walmart product" 
          });
        }

        // Filter duplicates first
        const reviewsToProcess: Array<any> = [];
        for (const review of result.reviews) {
          const externalReviewId = (review as any).reviewId || (review as any).id || null;
          if (externalReviewId) {
            const exists = await storage.checkReviewExists(externalReviewId, "Walmart", userId);
            if (exists) {
              skippedCount++;
              continue;
            }
          }
          reviewsToProcess.push({
            externalReviewId,
            reviewText: review.text || '',
            userName: review.reviewerName || 'Anonymous',
            reviewTitle: review.title || 'Review',
            rating: review.rating,
            reviewDate: review.date,
          });
        }

        // Process in parallel batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < reviewsToProcess.length; i += BATCH_SIZE) {
          const batch = reviewsToProcess.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map(async ({ externalReviewId, reviewText, userName, reviewTitle, rating, reviewDate }) => {
              const [analysis, aiReply] = await Promise.all([
                analyzeReview(reviewText, userName, "Walmart"),
                generateReply(reviewText, userName, "Walmart", "neutral", "medium")
              ]);
              await storage.createReview({
                userId,
                externalReviewId,
                marketplace: "Walmart",
                productId,
                title: reviewTitle,
                content: reviewText,
                customerName: userName,
                customerEmail: `${userName.toLowerCase().replace(/\s+/g, '.')}@walmart.customer`,
                rating: rating,
                sentiment: analysis.sentiment,
                category: analysis.category,
                severity: analysis.severity,
                status: "open",
                createdAt: new Date(reviewDate),
                aiSuggestedReply: aiReply,
                aiAnalysisDetails: JSON.stringify(analysis),
                verified: 1,
              });
            })
          );
          importedCount += batchResults.filter(r => r.status === 'fulfilled').length;
          skippedCount += batchResults.filter(r => r.status === 'rejected').length;
        }
      } else {
        return res.status(400).json({ error: "Unsupported platform for refresh" });
      }

      // Update last imported timestamp (with userId)
      const product = await storage.getProductByIdentifier(platform, productId, userId);
      if (product) {
        await storage.updateProductLastImported(product.id);
      }

      console.log(`✓ Refreshed ${platform} product: ${importedCount} new, ${skippedCount} duplicates`);
      
      res.json({
        imported: importedCount,
        skipped: skippedCount,
        message: importedCount > 0 
          ? `Imported ${importedCount} new review${importedCount !== 1 ? 's' : ''}`
          : "No new reviews found"
      });
    } catch (error: any) {
      console.error("Failed to refresh product reviews:", error);
      res.status(500).json({ 
        error: error.message || "Failed to refresh product reviews" 
      });
    }
  });

  // Import Shopify reviews - fetch from Shopify and process through AI
  app.post("/api/shopify/import-reviews", async (req, res) => {
    try {
      let { productId } = req.body;
      
      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: "Product ID is required" });
      }
      
      console.log(`Importing Shopify reviews for product: ${productId}`);
      
      // Fetch reviews from Shopify
      const { getProductReviews } = await import("./integrations/shopify");
      const result = await getProductReviews(productId);
      
      if (!result.reviews || result.reviews.length === 0) {
        return res.json({ 
          imported: 0, 
          message: "No reviews found for this product" 
        });
      }

      const productName = `Shopify Product ${productId.split('/').pop()}`;
      
      console.log(`Processing ${result.reviews.length} Shopify reviews...`);
      
      // Process each review through AI
      const processedReviews = [];
      for (const review of result.reviews) {
        try {
          const reviewText = review.content || '';
          const userName = review.author || 'Anonymous';
          const reviewTitle = review.title || 'Review';
          
          // Analyze the review
          const analysis = await analyzeReview(
            reviewText,
            userName,
            "Shopify"
          );

          // Generate AI reply
          const aiReply = await generateReply(
            reviewText,
            userName,
            "Shopify",
            analysis.sentiment,
            analysis.severity
          );

          const processedReview = {
            id: `shopify-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            marketplace: "Shopify" as const,
            title: reviewTitle,
            content: reviewText,
            customerName: userName,
            customerEmail: `${userName.toLowerCase().replace(/\s+/g, '.')}@shopify.customer`,
            rating: review.rating,
            sentiment: analysis.sentiment,
            category: analysis.category,
            severity: analysis.severity,
            status: "open",
            createdAt: new Date(review.createdAt),
            aiSuggestedReply: aiReply,
            verified: review.verified || false,
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

      // Track the product
      if (!global.trackedProducts) {
        global.trackedProducts = [];
      }
      
      const existingProductIndex = global.trackedProducts.findIndex(
        p => p.productId === productId && p.platform === "Shopify"
      );
      
      if (existingProductIndex >= 0) {
        global.trackedProducts[existingProductIndex] = {
          ...global.trackedProducts[existingProductIndex],
          reviewCount: global.trackedProducts[existingProductIndex].reviewCount + processedReviews.length,
          lastImported: new Date(),
        };
      } else {
        global.trackedProducts.push({
          id: `product-shopify-${productId}`,
          platform: "Shopify",
          productId,
          productName,
          reviewCount: processedReviews.length,
          lastImported: new Date(),
        });
      }

      console.log(`✓ Successfully imported ${processedReviews.length} Shopify reviews`);
      
      res.json({
        imported: processedReviews.length,
        productId,
        productName,
        reviews: processedReviews
      });
    } catch (error: any) {
      console.error("Failed to import Shopify reviews:", error);
      res.status(500).json({ 
        error: error.message || "Failed to import Shopify reviews" 
      });
    }
  });

  // Import Walmart reviews - fetch from Walmart and process through AI
  app.post("/api/walmart/import-reviews", async (req, res) => {
    try {
      let { productUrl } = req.body;
      
      if (!productUrl || typeof productUrl !== 'string') {
        return res.status(400).json({ error: "Walmart product URL is required" });
      }
      
      console.log(`Importing Walmart reviews for product: ${productUrl}`);
      
      // Fetch reviews from Walmart via Axesso
      const { fetchWalmartProduct } = await import("./integrations/walmart");
      const result = await fetchWalmartProduct(productUrl);
      
      if (!result.reviews || result.reviews.length === 0) {
        return res.json({ 
          imported: 0, 
          message: "No reviews found for this Walmart product" 
        });
      }

      const productName = result.productName;
      const productId = result.productId;
      
      console.log(`Processing ${result.reviews.length} Walmart reviews for "${productName}"...`);
      
      // Process each review through AI
      const processedReviews = [];
      for (const review of result.reviews) {
        try {
          const reviewText = review.text || '';
          const userName = review.reviewerName || 'Anonymous';
          const reviewTitle = review.title || 'Review';
          
          // Analyze the review
          const analysis = await analyzeReview(
            reviewText,
            userName,
            "Walmart"
          );

          // Generate AI reply
          const aiReply = await generateReply(
            reviewText,
            userName,
            "Walmart",
            analysis.sentiment,
            analysis.severity
          );

          const processedReview = {
            id: `walmart-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            marketplace: "Walmart" as const,
            title: reviewTitle,
            content: reviewText,
            customerName: userName,
            customerEmail: `${userName.toLowerCase().replace(/\s+/g, '.')}@walmart.customer`,
            rating: review.rating,
            sentiment: analysis.sentiment,
            category: analysis.category,
            severity: analysis.severity,
            status: "open",
            createdAt: new Date(review.date),
            aiSuggestedReply: aiReply,
            verified: true,
          };

          processedReviews.push(processedReview);
          console.log(`✓ Processed review from ${userName} (${analysis.sentiment}/${analysis.severity})`);
        } catch (error) {
          console.error(`Failed to process review:`, error);
        }
      }

      // Save all processed reviews to database
      let importedCount = 0;
      let skippedCount = 0;
      
      for (const processedReview of processedReviews) {
        try {
          // Extract a unique review identifier if available
          const externalReviewId = processedReview.id;
          
          // Check for duplicates
          if (externalReviewId) {
            const exists = await storage.checkReviewExists(externalReviewId, "Walmart");
            if (exists) {
              console.log(`⊘ Skipping duplicate review: ${externalReviewId}`);
              skippedCount++;
              continue;
            }
          }
          
          await storage.createReview({
            externalReviewId,
            marketplace: processedReview.marketplace,
            productId,
            title: processedReview.title,
            content: processedReview.content,
            customerName: processedReview.customerName,
            customerEmail: processedReview.customerEmail,
            rating: processedReview.rating,
            sentiment: processedReview.sentiment,
            category: processedReview.category,
            severity: processedReview.severity,
            status: processedReview.status,
            createdAt: processedReview.createdAt,
            aiSuggestedReply: processedReview.aiSuggestedReply,
            aiAnalysisDetails: undefined,
            verified: processedReview.verified ? 1 : 0,
          });
          
          importedCount++;
        } catch (error) {
          console.error(`Failed to save review:`, error);
          skippedCount++;
        }
      }

      // Track the product in database
      const existingProduct = await storage.getProductByIdentifier("Walmart", productId);
      
      if (existingProduct) {
        await storage.updateProductLastImported(existingProduct.id);
        console.log(`✓ Updated product tracking for "${productName}"`);
      } else {
        await storage.createProduct({
          platform: "Walmart",
          productId,
          productName,
        });
        console.log(`✓ Added product to tracking: "${productName}"`);
      }

      console.log(`✓ Successfully imported ${importedCount} Walmart reviews for "${productName}" (${skippedCount} duplicates skipped)`);
      
      res.json({
        imported: importedCount,
        skipped: skippedCount,
        productId,
        productName,
      });
    } catch (error: any) {
      console.error("Failed to import Walmart reviews:", error);
      res.status(500).json({ 
        error: error.message || "Failed to import Walmart reviews"
      });
    }
  });

  // Trigger Outlook reconnection
  app.post("/api/integrations/outlook/reconnect", async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: "Please reconnect Outlook in the Tools panel",
        instructions: [
          "1. Open the Tools panel (left sidebar in Replit)",
          "2. Find 'Outlook' in the list of integrations",
          "3. Click the settings icon or 'Disconnect' if currently connected",
          "4. Click 'Connect' to sign in with drift_signal@outlook.com",
          "5. Authorize the permissions when prompted by Microsoft"
        ]
      });
    } catch (error: any) {
      console.error("Error triggering Outlook reconnection:", error);
      res.status(500).json({ error: error.message || "Failed to trigger reconnection" });
    }
  });

  // Check integration status
  app.get("/api/integrations/status", async (req, res) => {
    const status = {
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
      shopify: {
        name: "Shopify",
        connected: false,
        details: "",
        lastChecked: new Date().toISOString(),
      },
      walmart: {
        name: "Walmart (Axesso)",
        connected: false,
        details: "",
        lastChecked: new Date().toISOString(),
      },
    };

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

    // Check Shopify
    try {
      const { testShopifyConnection } = await import("./integrations/shopify");
      const result = await testShopifyConnection();
      status.shopify.connected = result.connected;
      status.shopify.details = result.details;
    } catch (error: any) {
      status.shopify.connected = false;
      status.shopify.details = error.message || "Not configured";
    }

    // Check Walmart
    try {
      const result = await testWalmartConnection();
      status.walmart.connected = result.success;
      status.walmart.details = result.message;
    } catch (error: any) {
      status.walmart.connected = false;
      status.walmart.details = error.message || "Not configured";
    }

    res.json(status);
  });

  const httpServer = createServer(app);
  return httpServer;
}

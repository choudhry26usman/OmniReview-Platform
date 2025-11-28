interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENROUTER_BASE_URL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;

async function callOpenRouter(request: OpenRouterRequest): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://driftsignal.replit.app",
      "X-Title": "DriftSignal Review Manager",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}

export interface ReviewAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  reasoning: string;
  specificIssues: string[];
  positiveAspects: string[];
  keyPhrases: string[];
  customerEmotion: string;
  urgencyLevel: string;
  recommendedActions: string[];
}

export async function analyzeReview(
  reviewContent: string,
  customerName: string,
  marketplace: string
): Promise<ReviewAnalysis> {
  const systemPrompt = `You are an AI assistant analyzing customer reviews and complaints for an e-commerce business. 
Provide a comprehensive, detailed analysis of each review.

Sentiment options: positive, negative, neutral
Severity options: low (minor issue or praise), medium (moderate concern), high (serious problem), critical (urgent issue requiring immediate attention)

Category MUST be one of these standardized values (choose the closest match):
- "Product Quality" - issues with build, materials, durability, craftsmanship
- "Product Performance" - doesn't work as expected, functionality issues
- "Shipping & Delivery" - late delivery, damaged in transit, wrong item sent
- "Packaging" - poor packaging, damaged box, missing components
- "Customer Service" - support experience, response time, helpfulness
- "Value & Pricing" - too expensive, not worth the price, pricing concerns
- "Sizing & Fit" - wrong size, doesn't fit as described
- "Color & Appearance" - color mismatch, looks different than photos
- "Setup & Instructions" - difficult to assemble, poor instructions
- "Compatibility" - doesn't work with other products/systems
- "Safety Concern" - potential hazard, safety issue
- "Praise & Satisfaction" - for positive reviews expressing general satisfaction

Provide detailed analysis with:
- sentiment: overall sentiment (positive/negative/neutral)
- severity: severity level (low/medium/high/critical)
- category: MUST be one of the standardized categories listed above
- reasoning: brief explanation of the analysis
- specificIssues: array of specific problems mentioned (e.g., ["Audio cuts out during bass-heavy scenes", "External speakers required for acceptable sound"])
- positiveAspects: array of positive things mentioned, if any (e.g., ["Good picture quality", "Bright colors"])
- keyPhrases: 3-5 important quotes from the review (actual customer words)
- customerEmotion: emotional tone (e.g., "frustrated", "disappointed", "angry", "satisfied", "delighted")
- urgencyLevel: how quickly this needs attention (e.g., "Immediate - customer very dissatisfied", "Moderate - issue noted but not urgent")
- recommendedActions: 3-4 specific, actionable steps tailored to THIS review (not generic advice)

Respond ONLY with valid JSON format.`;

  const userPrompt = `Analyze this review from ${customerName} on ${marketplace}:

"${reviewContent}"

Provide your detailed analysis in JSON format with all fields: sentiment, severity, category, reasoning, specificIssues, positiveAspects, keyPhrases, customerEmotion, urgencyLevel, recommendedActions.`;

  const response = await callOpenRouter({
    model: "x-ai/grok-4.1-fast",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      sentiment: parsed.sentiment || "neutral",
      severity: parsed.severity || "medium",
      category: parsed.category || "general",
      reasoning: parsed.reasoning || "",
      specificIssues: parsed.specificIssues || [],
      positiveAspects: parsed.positiveAspects || [],
      keyPhrases: parsed.keyPhrases || [],
      customerEmotion: parsed.customerEmotion || "neutral",
      urgencyLevel: parsed.urgencyLevel || "moderate",
      recommendedActions: parsed.recommendedActions || [],
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return {
      sentiment: "neutral",
      severity: "medium",
      category: "general",
      reasoning: "Failed to analyze review",
      specificIssues: [],
      positiveAspects: [],
      keyPhrases: [],
      customerEmotion: "neutral",
      urgencyLevel: "moderate",
      recommendedActions: [],
    };
  }
}

export async function generateReply(
  reviewContent: string,
  customerName: string,
  marketplace: string,
  sentiment: string,
  severity: string
): Promise<string> {
  const systemPrompt = `You are a professional customer service representative writing responses to customer reviews and complaints.
Your tone should be:
- Empathetic and understanding
- Professional and courteous
- Solution-oriented
- Personalized to the customer and their specific concern

For positive reviews: Express gratitude and encourage continued engagement
For negative reviews: Acknowledge the issue, apologize sincerely, and offer a concrete solution or next step
For neutral reviews: Thank them for feedback and address any concerns mentioned`;

  const userPrompt = `Write a professional response to this ${sentiment} review (severity: ${severity}) from ${customerName} on ${marketplace}:

"${reviewContent}"

Write a response that addresses their concern directly and professionally. Keep it concise (2-4 sentences).`;

  const response = await callOpenRouter({
    model: "x-ai/grok-4.1-fast",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.trim();
}

export interface EmailClassification {
  isReviewOrComplaint: boolean;
  confidence: number;
  reasoning: string;
  suggestedAction: "import" | "ignore";
}

export interface ProductExtraction {
  productName: string | null;
  productId: string | null;
  confidence: number;
  reasoning: string;
}

export async function classifyEmail(
  emailSubject: string,
  emailBody: string,
  senderName: string
): Promise<EmailClassification> {
  const systemPrompt = `You are an AI assistant that classifies incoming emails to determine if they are customer reviews, complaints, or feedback about products/services.

Reviews and complaints typically:
- Mention product quality, shipping, customer service experiences
- Express satisfaction or dissatisfaction with a purchase
- Request refunds, replacements, or support
- Describe specific issues or praise specific features
- Include ratings or evaluations

NOT reviews/complaints:
- Newsletter subscriptions/unsubscriptions
- Marketing emails
- Order confirmations
- Shipping notifications
- Password resets
- Spam or promotional content

Respond in JSON format with: isReviewOrComplaint (boolean), confidence (0-100), reasoning (brief explanation), and suggestedAction ("import" or "ignore").`;

  const userPrompt = `Classify this email from ${senderName}:

Subject: "${emailSubject}"
Body: "${emailBody.substring(0, 500)}"

Is this a customer review or complaint that should be imported into our review management system?`;

  const response = await callOpenRouter({
    model: "x-ai/grok-4.1-fast",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 300,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      isReviewOrComplaint: parsed.isReviewOrComplaint || false,
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning || "",
      suggestedAction: parsed.suggestedAction || "ignore",
    };
  } catch (error) {
    console.error("Failed to parse AI classification response:", error);
    return {
      isReviewOrComplaint: false,
      confidence: 0,
      reasoning: "Failed to classify email",
      suggestedAction: "ignore",
    };
  }
}

export async function extractProductFromEmail(
  emailSubject: string,
  emailBody: string
): Promise<ProductExtraction> {
  const systemPrompt = `You are an AI assistant that extracts product information from customer emails.

Your task is to identify:
1. The product name - Extract the specific product name mentioned in the email
2. A short product ID - Create a unique, URL-safe identifier for tracking

Guidelines:
- Look for specific product names, model numbers, or descriptions
- If multiple products are mentioned, pick the main one being discussed
- The productId should be lowercase, hyphenated, max 30 characters (e.g., "blue-wireless-headphones", "kitchen-mixer-pro")
- If no specific product is mentioned, try to infer a general category (e.g., "shipping-issue", "customer-service")
- For order-related emails, use the product mentioned or "order-inquiry"

Respond in JSON format with: productName (string or null), productId (string or null), confidence (0-100), reasoning (brief explanation).`;

  const userPrompt = `Extract product information from this customer email:

Subject: "${emailSubject}"
Body: "${emailBody.substring(0, 1000)}"

What product or service is this email about?`;

  const response = await callOpenRouter({
    model: "x-ai/grok-4.1-fast",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 300,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    let productId = parsed.productId || null;
    if (productId) {
      productId = productId.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 30);
    }
    
    return {
      productName: parsed.productName || null,
      productId: productId,
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("Failed to parse product extraction response:", error);
    return {
      productName: null,
      productId: null,
      confidence: 0,
      reasoning: "Failed to extract product information",
    };
  }
}

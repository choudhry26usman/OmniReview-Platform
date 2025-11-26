/**
 * Apify Amazon Reviews Scraper Integration
 * Supports multiple Amazon domains including amazon.ca
 * Free tier: ~$5 worth of credits for new accounts
 * Documentation: https://apify.com/junglee/amazon-reviews-scraper/api
 */

const APIFY_BASE_URL = 'https://api.apify.com/v2';

interface ApifyReview {
  reviewTitle: string;
  reviewText: string;
  rating: number;
  reviewerName: string;
  reviewDate: string;
  verified: boolean;
  helpfulVotes?: number;
  images?: string[];
  asin: string;
  reviewId?: string;
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyDatasetResponse {
  data: {
    items: ApifyReview[];
  };
}

/**
 * Check if Apify is configured
 */
export function isApifyConfigured(): boolean {
  return !!process.env.APIFY_API_TOKEN;
}

/**
 * Get API token for Apify
 */
function getApiToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('Apify API token not configured. Add APIFY_API_TOKEN to secrets.');
  }
  return token;
}

/**
 * Extract ASIN from Amazon URL
 */
function extractAsin(urlOrAsin: string): string {
  if (!urlOrAsin.includes('/')) {
    return urlOrAsin;
  }
  
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i
  ];
  
  for (const pattern of patterns) {
    const match = urlOrAsin.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return urlOrAsin;
}

/**
 * Detect Amazon domain from URL
 */
function detectDomain(urlOrAsin: string): string {
  if (urlOrAsin.includes('amazon.ca')) return 'amazon.ca';
  if (urlOrAsin.includes('amazon.co.uk')) return 'amazon.co.uk';
  if (urlOrAsin.includes('amazon.de')) return 'amazon.de';
  if (urlOrAsin.includes('amazon.fr')) return 'amazon.fr';
  if (urlOrAsin.includes('amazon.es')) return 'amazon.es';
  if (urlOrAsin.includes('amazon.it')) return 'amazon.it';
  if (urlOrAsin.includes('amazon.co.jp')) return 'amazon.co.jp';
  if (urlOrAsin.includes('amazon.in')) return 'amazon.in';
  if (urlOrAsin.includes('amazon.com.au')) return 'amazon.com.au';
  if (urlOrAsin.includes('amazon.com.mx')) return 'amazon.com.mx';
  return 'amazon.com';
}

/**
 * Wait for Apify actor run to complete
 */
async function waitForRun(runId: string, token: string, maxWaitMs: number = 120000): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 3000;
  
  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`);
    
    if (!response.ok) {
      throw new Error(`Failed to check run status: ${response.status}`);
    }
    
    const data = await response.json() as { data: { status: string; defaultDatasetId: string } };
    
    if (data.data.status === 'SUCCEEDED') {
      return data.data.defaultDatasetId;
    }
    
    if (data.data.status === 'FAILED' || data.data.status === 'ABORTED') {
      throw new Error(`Apify run ${data.data.status}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Apify run timed out');
}

/**
 * Get Amazon product reviews using Apify
 * @param asinOrUrl - Amazon ASIN or product URL (supports amazon.ca, amazon.com, etc.)
 * @param maxReviews - Maximum number of reviews to fetch (default 100)
 */
export async function getAmazonReviews(
  asinOrUrl: string, 
  maxReviews: number = 100
): Promise<{ reviews: ApifyReview[], asin: string }> {
  const token = getApiToken();
  const asin = extractAsin(asinOrUrl);
  const domain = detectDomain(asinOrUrl);
  
  console.log(`Apify: Fetching up to ${maxReviews} reviews for ASIN ${asin} from ${domain}...`);
  
  const productUrl = `https://www.${domain}/dp/${asin}`;
  
  console.log(`Apify: Using product URL: ${productUrl}`);
  
  const runInput = {
    productUrls: [{ url: productUrl }],  // Must be array of objects with url field
    maxReviews: maxReviews,
    filterByRatings: ["allStars"],
    proxyConfiguration: {
      useApifyProxy: true
    }
  };
  
  const runResponse = await fetch(
    `${APIFY_BASE_URL}/acts/junglee~amazon-reviews-scraper/runs?token=${token}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(runInput)
    }
  );
  
  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    console.error(`Apify API error: ${runResponse.status} - ${errorText}`);
    throw new Error(`Apify API error (${runResponse.status}): ${errorText}`);
  }
  
  const runData = await runResponse.json() as ApifyRunResponse;
  const runId = runData.data.id;
  
  console.log(`Apify: Started run ${runId}, waiting for completion...`);
  
  const datasetId = await waitForRun(runId, token);
  
  const datasetResponse = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}&format=json`
  );
  
  if (!datasetResponse.ok) {
    throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
  }
  
  const reviews = await datasetResponse.json() as ApifyReview[];
  
  console.log(`Apify: Fetched ${reviews.length} reviews for ASIN ${asin}`);
  
  // Log first review to debug field mapping
  if (reviews.length > 0) {
    console.log(`Apify: Sample review structure:`, JSON.stringify(reviews[0], null, 2));
  }
  
  return { reviews, asin };
}

/**
 * Convert Apify review to standard format compatible with our system
 */
export function convertApifyReview(review: ApifyReview): {
  externalReviewId: string;
  marketplace: 'amazon';
  customerName: string;
  rating: number;
  title: string;
  content: string;
  reviewDate: Date;
  verified: boolean;
  productAsin?: string;
} {
  const reviewId = review.reviewId || 
    `apify-${review.asin}-${review.reviewerName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let parsedDate = new Date();
  if (review.reviewDate) {
    const parsed = new Date(review.reviewDate);
    if (!isNaN(parsed.getTime())) {
      parsedDate = parsed;
    }
  }
  
  return {
    externalReviewId: reviewId,
    marketplace: 'amazon',
    customerName: review.reviewerName || 'Amazon Customer',
    rating: Math.round(review.rating || 0),
    title: review.reviewTitle || '',
    content: review.reviewText || '',
    reviewDate: parsedDate,
    verified: review.verified || false,
    productAsin: review.asin
  };
}

/**
 * Walmart integration using Walmart API v2 via RapidAPI
 * Fetches product details and reviews from Walmart
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const WALMART_HOST = "walmart2.p.rapidapi.com";

interface WalmartReview {
  reviewText?: string;
  rating?: number;
  reviewerName?: string;
  reviewDate?: string;
  title?: string;
}

interface WalmartProductResponse {
  productTitle?: string;
  productDescription?: string;
  manufacturer?: string;
  reviews?: WalmartReview[];
  numberOfReviews?: number;
  averageRating?: number;
  responseStatus?: string;
  responseMessage?: string;
  // Search response fields
  items?: Array<{
    productName?: string;
    productId?: string;
    itemId?: string;
    reviews?: WalmartReview[];
    averageRating?: number;
    numReviews?: number;
  }>;
}

export interface WalmartReviewData {
  reviewerName: string;
  rating: number;
  title: string;
  text: string;
  date: string;
}

export interface WalmartProductData {
  productName: string;
  productId: string;
  reviews: WalmartReviewData[];
  totalReviews: number;
  averageRating: number;
}

/**
 * Check if Walmart/RapidAPI is configured
 */
export function isWalmartConfigured(): boolean {
  return !!RAPIDAPI_KEY;
}

/**
 * Extract product ID from Walmart URL
 */
function extractProductId(url: string): string | null {
  // Walmart URLs typically look like: https://www.walmart.com/ip/Product-Name/123456789
  const match = url.match(/\/ip\/[^/]+\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Walmart product details and reviews by product URL
 * @param productUrl - Full Walmart product URL (e.g., https://www.walmart.com/ip/...")
 */
export async function fetchWalmartProduct(productUrl: string): Promise<WalmartProductData> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY is not configured. Please add it to your environment variables.");
  }

  if (!productUrl.includes('walmart.com')) {
    throw new Error("Invalid Walmart URL. Please provide a valid walmart.com product URL.");
  }

  // Extract product ID from URL
  const productId = extractProductId(productUrl);
  if (!productId) {
    throw new Error("Could not extract product ID from URL. Please provide a valid Walmart product URL.");
  }

  try {
    // Try to search for the product using the product ID
    const searchUrl = `https://${WALMART_HOST}/search?query=${productId}`;
    
    console.log('[Walmart] Fetching product with ID:', productId);
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': WALMART_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Walmart] API error response:', errorText);
      
      if (response.status === 403) {
        throw new Error("API authentication failed. Please verify your RAPIDAPI_KEY is correct.");
      } else if (response.status === 404) {
        throw new Error("Product not found. Please check the Walmart product URL.");
      } else {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }

    const data: WalmartProductResponse = await response.json();
    console.log('[Walmart] API response:', JSON.stringify(data, null, 2));

    // Check if we got search results
    if (data.items && data.items.length > 0) {
      const product = data.items[0];
      const reviews: WalmartReviewData[] = (product.reviews || []).map(review => ({
        reviewerName: review.reviewerName || 'Anonymous',
        rating: review.rating || 0,
        title: review.title || '',
        text: review.reviewText || '',
        date: review.reviewDate || new Date().toISOString()
      }));

      return {
        productName: product.productName || 'Unknown Product',
        productId: product.productId || product.itemId || productId,
        reviews,
        totalReviews: product.numReviews || reviews.length,
        averageRating: product.averageRating || 0
      };
    }

    // Fallback: check if direct product data is available
    if (data.productTitle) {
      const reviews: WalmartReviewData[] = (data.reviews || []).map(review => ({
        reviewerName: review.reviewerName || 'Anonymous',
        rating: review.rating || 0,
        title: review.title || '',
        text: review.reviewText || '',
        date: review.reviewDate || new Date().toISOString()
      }));

      return {
        productName: data.productTitle,
        productId,
        reviews,
        totalReviews: data.numberOfReviews || reviews.length,
        averageRating: data.averageRating || 0
      };
    }

    throw new Error('No product data found. The product may not be available or indexed.');

  } catch (error) {
    console.error('[Walmart] Error fetching product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch Walmart product data');
  }
}

/**
 * Test Walmart API connection
 */
export async function testWalmartConnection(): Promise<{ success: boolean; message: string }> {
  if (!RAPIDAPI_KEY) {
    return {
      success: false,
      message: 'RAPIDAPI_KEY not configured'
    };
  }

  try {
    // Test with a simple search query
    const testUrl = `https://${WALMART_HOST}/search?query=xbox`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': WALMART_HOST
      }
    });

    // Even if the search returns no results, a proper API response means we're connected
    if (response.status === 403) {
      return {
        success: false,
        message: 'API key authentication failed'
      };
    }

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to Walmart API via RapidAPI'
      };
    }

    return {
      success: false,
      message: `API responded with status ${response.status}`
    };

  } catch (error) {
    console.error('[Walmart] Connection test error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
}

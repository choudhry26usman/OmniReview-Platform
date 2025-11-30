/**
 * Walmart integration using SerpApi (US) and Apify (Canada)
 * Fetches product details and reviews from Walmart
 */

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

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
 * Check if Walmart integration is configured
 * Returns true if either SerpApi (for US) or Apify (for Canada) is available
 */
export function isWalmartConfigured(): boolean {
  return !!SERPAPI_KEY || !!APIFY_API_TOKEN;
}

/**
 * Check if Walmart Canada is supported (requires Apify)
 */
export function isWalmartCanadaConfigured(): boolean {
  return !!APIFY_API_TOKEN;
}

/**
 * Extract product ID from Walmart URL
 * Supports US Walmart (walmart.com) URLs only
 * Example: https://www.walmart.com/ip/Product-Name/123456789
 * Note: Walmart Canada (walmart.ca) is not supported by SerpApi
 */
function extractProductId(url: string): string | null {
  // Match both numeric IDs (US) and alphanumeric IDs (Canada)
  // The ID is the last path segment after /ip/Product-Name/
  const match = url.match(/\/ip\/[^/]+\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Walmart Canada product details and reviews using Apify
 * @param productUrl - Full Walmart.ca product URL
 * @param maxReviews - Maximum number of reviews to fetch (default 50)
 */
async function fetchWalmartCanadaProduct(productUrl: string, maxReviews: number = 50): Promise<WalmartProductData> {
  if (!APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured. Please add it to your environment variables.");
  }

  const productId = extractProductId(productUrl);
  if (!productId) {
    throw new Error("Could not extract product ID from URL. Please provide a valid Walmart.ca product URL.");
  }

  console.log('[Walmart.ca] Starting Apify actor for product:', productId);

  try {
    // Start the Apify actor run synchronously and get dataset items
    const actorId = 'tri_angle~walmart-reviews-scraper';
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
    
    const response = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url: productUrl }],
        maxProductsPerStartUrl: 1,
        maxReviewsPerProduct: maxReviews
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Walmart.ca] Apify error response:', errorText);
      
      if (response.status === 401) {
        throw new Error("Apify API authentication failed. Please verify your APIFY_API_TOKEN is correct.");
      } else if (response.status === 402) {
        throw new Error("Apify API usage limit exceeded. Please check your Apify account credits.");
      } else {
        throw new Error(`Apify API request failed with status ${response.status}`);
      }
    }

    const data: any[] = await response.json();
    console.log('[Walmart.ca] Apify returned', data.length, 'items');

    if (!data || data.length === 0) {
      return {
        productName: 'Unknown Product',
        productId,
        reviews: [],
        totalReviews: 0,
        averageRating: 0
      };
    }

    // Extract product name from the first item with product info
    let productName = 'Unknown Product';
    let totalRating = 0;
    let ratingCount = 0;
    
    // Collect all reviews from the dataset
    const reviews: WalmartReviewData[] = [];
    
    for (const item of data) {
      // Try to get product name from any item that has it
      if (item.productName || item.product_name || item.title) {
        productName = item.productName || item.product_name || item.title;
      }
      
      // Check if this item is a review
      if (item.reviewText || item.review || item.text || item.content) {
        const rating = item.rating || item.stars || 0;
        reviews.push({
          reviewerName: item.author || item.authorName || item.reviewer || item.reviewerName || 'Anonymous',
          rating: typeof rating === 'number' ? rating : parseFloat(rating) || 0,
          title: item.reviewTitle || item.title || '',
          text: item.reviewText || item.review || item.text || item.content || '',
          date: item.date || item.reviewDate || item.reviewSubmissionTime || new Date().toISOString()
        });
        
        if (rating) {
          totalRating += rating;
          ratingCount++;
        }
      }
    }

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    console.log(`[Walmart.ca] Found ${reviews.length} reviews for "${productName}"`);

    return {
      productName,
      productId,
      reviews,
      totalReviews: reviews.length,
      averageRating
    };

  } catch (error) {
    console.error('[Walmart.ca] Error fetching product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch Walmart Canada product data');
  }
}

/**
 * Fetch Walmart product details and reviews by product URL
 * Routes to SerpApi (US) or Apify (Canada) based on URL
 * @param productUrl - Full Walmart product URL
 * @param fullSync - If true, fetch more reviews
 */
export async function fetchWalmartProduct(productUrl: string, fullSync: boolean = false): Promise<WalmartProductData> {
  // Check for Canadian Walmart - use Apify
  if (productUrl.includes('walmart.ca')) {
    if (!APIFY_API_TOKEN) {
      throw new Error("Walmart Canada requires APIFY_API_TOKEN. Please add it to your environment variables.");
    }
    return fetchWalmartCanadaProduct(productUrl, fullSync ? 100 : 50);
  }

  // US Walmart - use SerpApi
  if (!SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY is not configured. Please add it to your environment variables.");
  }

  // Only US Walmart is supported via SerpApi
  if (!productUrl.includes('walmart.com')) {
    throw new Error("Invalid Walmart URL. Please provide a valid walmart.com or walmart.ca product URL.");
  }

  // Extract product ID from URL
  const productId = extractProductId(productUrl);
  if (!productId) {
    throw new Error("Could not extract product ID from URL. Please provide a valid Walmart product URL.");
  }

  try {
    // Use SerpApi Walmart Product API
    const serpApiUrl = `https://serpapi.com/search.json?engine=walmart_product&product_id=${productId}&api_key=${SERPAPI_KEY}`;
    
    console.log('[Walmart] Fetching product with ID:', productId);
    const response = await fetch(serpApiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Walmart] SerpApi error response:', errorText);
      
      if (response.status === 401) {
        throw new Error("API authentication failed. Please verify your SERPAPI_KEY is correct.");
      } else if (response.status === 404) {
        throw new Error("Product not found. Please check the Walmart product URL.");
      } else {
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
    }

    const data: any = await response.json();
    console.log('[Walmart] SerpApi response received');

    // Extract product information
    const productName = data.product_result?.title || 'Unknown Product';
    const averageRating = data.product_result?.rating || 0;
    
    // Get reviews from SerpApi
    const reviewsData = data.reviews || [];
    const reviews: WalmartReviewData[] = reviewsData.map((review: any) => ({
      reviewerName: review.author || 'Anonymous',
      rating: review.rating || 0,
      title: review.title || '',
      text: review.review || review.text || '',
      date: review.date || new Date().toISOString()
    }));

    // If no reviews in main response or fullSync requested, try reviews endpoint
    if (reviews.length === 0 || fullSync) {
      console.log(`[Walmart] Fetching reviews separately (fullSync: ${fullSync})...`);
      
      const maxPages = fullSync ? 10 : 1; // Fetch up to 10 pages for full sync, 1 for quick
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages && currentPage <= maxPages) {
        const reviewsUrl = `https://serpapi.com/search.json?engine=walmart_product_reviews&product_id=${productId}&page=${currentPage}&api_key=${SERPAPI_KEY}`;
        
        const reviewsResponse = await fetch(reviewsUrl);
        if (reviewsResponse.ok) {
          const reviewsDataResponse: any = await reviewsResponse.json();
          const fetchedReviews = reviewsDataResponse.reviews || [];
          
          if (fetchedReviews.length === 0) {
            hasMorePages = false;
          } else {
            fetchedReviews.forEach((review: any) => {
              // Avoid duplicates by checking if review already exists
              const reviewId = review.review_id || review.id || `${review.author}-${review.date}`;
              const existsInList = reviews.some(r => 
                r.reviewerName === (review.author || 'Anonymous') && 
                r.text === (review.review || review.text || '')
              );
              
              if (!existsInList) {
                reviews.push({
                  reviewerName: review.author || 'Anonymous',
                  rating: review.rating || 0,
                  title: review.title || '',
                  text: review.review || review.text || '',
                  date: review.date || new Date().toISOString()
                });
              }
            });
            
            // Check if there are more pages
            hasMorePages = !!reviewsDataResponse.serpapi_pagination?.next;
            currentPage++;
            console.log(`[Walmart] Page ${currentPage - 1}: found ${fetchedReviews.length} reviews (total: ${reviews.length})`);
          }
        } else {
          hasMorePages = false;
        }
      }
    }

    return {
      productName,
      productId,
      reviews,
      totalReviews: data.product_result?.reviews_count || reviews.length,
      averageRating
    };

  } catch (error) {
    console.error('[Walmart] Error fetching product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch Walmart product data');
  }
}

/**
 * Test Walmart API connection using SerpApi
 */
export async function testWalmartConnection(): Promise<{ success: boolean; message: string }> {
  if (!SERPAPI_KEY) {
    return {
      success: false,
      message: 'SERPAPI_KEY not configured'
    };
  }

  try {
    // Use SerpApi account endpoint to verify API key validity
    const testUrl = `https://serpapi.com/account.json?api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(testUrl);

    if (response.status === 401) {
      return {
        success: false,
        message: 'API key authentication failed'
      };
    }

    if (response.ok) {
      const data = await response.json();
      // Check if we got valid account info back
      if (data.account_id || data.api_key_valid !== false) {
        return {
          success: true,
          message: 'Connected to SerpApi for Walmart data'
        };
      }
      return {
        success: false,
        message: 'Invalid API key response'
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

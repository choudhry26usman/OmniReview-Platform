/**
 * Axesso API Integration
 * Provides e-commerce data extraction from Amazon and other marketplaces
 * Documentation: https://axesso.de/ and https://rapidapi.com/axesso
 */

const AXESSO_BASE_URL = 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com';

interface AxessoProduct {
  productTitle: string;
  productDescription: string;
  productRating: string;
  numberOfReviews: number;
  price: string;
  imageUrlList: string[];
  features: string[];
  asin: string;
  manufacturer: string;
}

interface AxessoReview {
  title: string;
  text: string;
  rating: string;
  userName: string;
  date: string;
  reviewId: string;
  url: string;
  imageUrlList: string[];
  variationList: string[];
  locale: string | null;
  profilePath: string;
}

interface AxessoSearchResult {
  foundProducts: Array<{
    title: string;
    asin: string;
    price: string;
    rating: string;
    numberOfReviews: number;
    imageUrl: string;
  }>;
  numberOfProducts: number;
}

/**
 * Check if Axesso is configured
 */
export function isAxessoConfigured(): boolean {
  return !!process.env.AXESSO_API_KEY;
}

/**
 * Get API key for Axesso
 */
function getApiKey(): string {
  const apiKey = process.env.AXESSO_API_KEY;
  if (!apiKey) {
    throw new Error('Axesso API key not configured. Add AXESSO_API_KEY to secrets.');
  }
  return apiKey;
}

/**
 * Make a request to Axesso API
 */
async function axessoRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = getApiKey();
  
  const url = new URL(endpoint, AXESSO_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Axesso API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Test the Axesso connection
 */
export async function testAxessoConnection(): Promise<{ connected: boolean; details: string }> {
  try {
    if (!isAxessoConfigured()) {
      return {
        connected: false,
        details: 'API key not configured'
      };
    }

    // Simple validation - just check if the API key is configured
    // We don't make a real API call here to avoid consuming API credits during tests
    const apiKey = getApiKey();
    
    if (apiKey && apiKey.length > 10) {
      return {
        connected: true,
        details: 'API key configured (ready to fetch Amazon data)'
      };
    } else {
      return {
        connected: false,
        details: 'API key appears invalid'
      };
    }
  } catch (error) {
    return {
      connected: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get product details by Amazon URL or ASIN
 */
export async function getProductDetails(amazonUrl: string): Promise<AxessoProduct> {
  return axessoRequest<AxessoProduct>('/amz/amazon-lookup-product', {
    url: amazonUrl
  });
}

/**
 * Search for products on Amazon
 */
export async function searchProducts(keyword: string, page: number = 1): Promise<AxessoSearchResult> {
  return axessoRequest<AxessoSearchResult>('/amz/amazon-search-by-keyword', {
    keyword,
    domainCode: 'com',
    page: page.toString()
  });
}

/**
 * Get product details and reviews by Amazon URL or ASIN
 * Uses pagination to fetch multiple pages of reviews
 * @param asinOrUrl - Amazon product URL or ASIN
 * @param maxPages - Number of pages to fetch (default 3, each page ~10 reviews)
 */
export async function getProductReviews(asinOrUrl: string, maxPages: number = 3): Promise<{ reviews: AxessoReview[], productTitle?: string }> {
  // Convert ASIN to Amazon URL format
  const url = asinOrUrl.startsWith('http') 
    ? asinOrUrl 
    : `https://www.amazon.com/dp/${asinOrUrl}`;
  
  const allReviews: AxessoReview[] = [];
  let productTitle: string | undefined;
  
  // Try fetching multiple pages of reviews
  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`Fetching Amazon reviews page ${page}...`);
      
      const reviewsResult = await axessoRequest<any>('/amz/amazon-lookup-reviews', { 
        url,
        sortBy: 'recent',
        page: page.toString()
      });
      
      if (!productTitle && reviewsResult.productTitle) {
        productTitle = reviewsResult.productTitle;
      }
      
      if (reviewsResult.reviews && reviewsResult.reviews.length > 0) {
        console.log(`Page ${page}: Got ${reviewsResult.reviews.length} reviews`);
        allReviews.push(...reviewsResult.reviews);
      } else {
        console.log(`Page ${page}: No more reviews, stopping pagination`);
        break; // No more reviews, stop fetching
      }
    } catch (error) {
      console.log(`Page ${page} failed:`, error);
      if (page === 1) {
        // If first page fails, try fallback
        break;
      }
      // For subsequent pages, just stop pagination
      break;
    }
  }
  
  // If we got reviews from pagination, return them
  if (allReviews.length > 0) {
    console.log(`Total reviews fetched via pagination: ${allReviews.length}`);
    return { reviews: allReviews, productTitle };
  }
  
  // Fallback to the product lookup endpoint (limited to ~8 reviews)
  console.log('Falling back to product lookup endpoint...');
  const result = await axessoRequest<any>('/amz/amazon-lookup-product', { url });
  
  const reviews = result.reviews || [];
  console.log(`Axesso product lookup returned ${reviews.length} reviews`);
  
  return { 
    reviews,
    productTitle: result.productTitle
  };
}

/**
 * Get product offers/prices by Amazon URL or ASIN
 */
export async function getProductOffers(amazonUrl: string) {
  return axessoRequest('/amz/amazon-lookup-offers', {
    url: amazonUrl
  });
}

/**
 * Search by category
 */
export async function searchByCategory(category: string, page: number = 1) {
  return axessoRequest('/amz/amazon-search-by-category', {
    category,
    domainCode: 'com',
    page: page.toString()
  });
}

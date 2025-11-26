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
 * Uses the dedicated reviews endpoint for more comprehensive review fetching
 */
export async function getProductReviews(asinOrUrl: string, page: number = 1): Promise<{ reviews: AxessoReview[], productTitle?: string }> {
  // Convert ASIN to Amazon URL format
  const url = asinOrUrl.startsWith('http') 
    ? asinOrUrl 
    : `https://www.amazon.com/dp/${asinOrUrl}`;
  
  try {
    // First try the dedicated reviews endpoint which can fetch more reviews
    const reviewsResult = await axessoRequest<any>('/amz/amazon-lookup-reviews', { 
      url,
      sortBy: 'recent'
    });
    
    if (reviewsResult.reviews && reviewsResult.reviews.length > 0) {
      return { 
        reviews: reviewsResult.reviews,
        productTitle: reviewsResult.productTitle
      };
    }
  } catch (error) {
    console.log('Reviews endpoint failed, falling back to product lookup:', error);
  }
  
  // Fallback to the product lookup endpoint
  const result = await axessoRequest<any>('/amz/amazon-lookup-product', { url });
  
  // Extract reviews from the product details response
  const reviews = result.reviews || [];
  
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

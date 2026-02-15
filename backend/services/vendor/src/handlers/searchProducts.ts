import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  PaginatedResponse,
  Product
} from '@karmdeep/shared';

/**
 * Search products
 * Note: This is a simplified version. In production, use ElasticSearch or OpenSearch
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get search parameters
    const query = event.queryStringParameters?.q?.toLowerCase();
    const category = event.queryStringParameters?.category;
    const minPrice = event.queryStringParameters?.minPrice 
      ? parseFloat(event.queryStringParameters.minPrice) 
      : undefined;
    const maxPrice = event.queryStringParameters?.maxPrice 
      ? parseFloat(event.queryStringParameters.maxPrice) 
      : undefined;
    const availability = event.queryStringParameters?.availability;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    if (!query && !category) {
      return ResponseBuilder.validationError('Search query or category is required');
    }

    // Get products (simplified - in production use ElasticSearch)
    let result;
    if (category) {
      result = await DynamoDBService.query(
        `CATEGORY#${category}`,
        undefined,
        100
      );
    } else {
      // Scan all products (not recommended for production)
      result = await DynamoDBService.query(
        'PRODUCTS',
        undefined,
        100
      );
    }

    // Filter products based on search criteria
    let products = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...product } = item;
      return product as Product;
    });

    // Apply filters
    if (query) {
      products = products.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(query))
      );
    }

    if (minPrice !== undefined) {
      products = products.filter(p => p.pricing.basePrice >= minPrice);
    }

    if (maxPrice !== undefined) {
      products = products.filter(p => p.pricing.basePrice <= maxPrice);
    }

    if (availability) {
      products = products.filter(p => p.availability === availability);
    }

    // Limit results
    products = products.slice(0, limit);

    const response: PaginatedResponse<Product> = {
      items: products,
      total: products.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error searching products:', error);
    return ResponseBuilder.internalError('Failed to search products');
  }
}

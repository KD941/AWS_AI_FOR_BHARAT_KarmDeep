import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  PaginatedResponse,
  Product
} from '@karmdeep/shared';

/**
 * List products by vendor or category
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get query parameters
    const vendorId = event.queryStringParameters?.vendorId;
    const category = event.queryStringParameters?.category;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    let result;

    if (vendorId) {
      // Query products by vendor
      result = await DynamoDBService.query(
        `VENDOR#${vendorId}`,
        'begins_with(SK, :sk)',
        limit
      );
    } else if (category) {
      // Query products by category
      result = await DynamoDBService.query(
        `CATEGORY#${category}`,
        undefined,
        limit
      );
    } else {
      return ResponseBuilder.validationError('Either vendorId or category is required');
    }

    // Transform items
    const products = result.items
      .filter(item => item.SK?.startsWith('PRODUCT#'))
      .map(item => {
        const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...product } = item;
        return product as Product;
      });

    const response: PaginatedResponse<Product> = {
      items: products,
      total: products.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error listing products:', error);
    return ResponseBuilder.internalError('Failed to list products');
  }
}

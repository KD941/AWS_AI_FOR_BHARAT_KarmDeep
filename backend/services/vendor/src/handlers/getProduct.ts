import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  Product
} from '@karmdeep/shared';

/**
 * Get product details
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get product ID and vendor ID from path parameters
    const productId = event.pathParameters?.productId;
    const vendorId = event.pathParameters?.vendorId;

    if (!productId || !vendorId) {
      return ResponseBuilder.validationError('Product ID and Vendor ID are required');
    }

    // Get product from DynamoDB
    const item = await DynamoDBService.getItem(
      `VENDOR#${vendorId}`,
      `PRODUCT#${productId}`
    );

    if (!item) {
      return ResponseBuilder.notFound('Product');
    }

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...product } = item;

    return ResponseBuilder.success(product as Product);

  } catch (error) {
    console.error('Error getting product:', error);
    return ResponseBuilder.internalError('Failed to get product');
  }
}

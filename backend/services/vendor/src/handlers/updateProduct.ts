import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  isOwner,
  isAdmin
} from '@karmdeep/shared';

/**
 * Update product
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get IDs from path parameters
    const vendorId = event.pathParameters?.vendorId;
    const productId = event.pathParameters?.productId;

    if (!vendorId || !productId) {
      return ResponseBuilder.validationError('Vendor ID and Product ID are required');
    }

    // Check authorization
    if (!isOwner(authContext, vendorId) && !isAdmin(authContext)) {
      return ResponseBuilder.forbidden('Not authorized to update this product');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Allowed update fields
    const allowedFields = [
      'productName',
      'specifications',
      'pricing',
      'availability',
      'images',
      'certifications',
      'warranty'
    ];

    const updates: Record<string, any> = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return ResponseBuilder.validationError('No valid fields to update');
    }

    updates.updatedAt = new Date().toISOString();

    // Update in DynamoDB
    const updatedItem = await DynamoDBService.updateItem(
      `VENDOR#${vendorId}`,
      `PRODUCT#${productId}`,
      updates
    );

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...product } = updatedItem;

    return ResponseBuilder.success(product);

  } catch (error) {
    console.error('Error updating product:', error);
    return ResponseBuilder.internalError('Failed to update product');
  }
}

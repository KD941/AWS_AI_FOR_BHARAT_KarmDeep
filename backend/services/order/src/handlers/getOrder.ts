import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  isOwner,
  isAdmin,
  Order
} from '@karmdeep/shared';

/**
 * Get order details
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get order ID from path parameters
    const orderId = event.pathParameters?.orderId;
    if (!orderId) {
      return ResponseBuilder.validationError('Order ID is required');
    }

    // Get order from DynamoDB
    const item = await DynamoDBService.getItem(
      `ORDER#${orderId}`,
      'DETAILS'
    );

    if (!item) {
      return ResponseBuilder.notFound('Order');
    }

    const order = item as unknown as Order;

    // Check authorization - buyer, vendor, or admin can view
    if (!isOwner(authContext, order.buyerId) && 
        !isOwner(authContext, order.vendorId) && 
        !isAdmin(authContext)) {
      return ResponseBuilder.forbidden('Not authorized to view this order');
    }

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...orderData } = item;

    return ResponseBuilder.success(orderData as Order);

  } catch (error) {
    console.error('Error getting order:', error);
    return ResponseBuilder.internalError('Failed to get order');
  }
}

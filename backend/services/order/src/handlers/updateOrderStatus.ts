import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  isOwner,
  isAdmin,
  SNSService
} from '@karmdeep/shared';

/**
 * Update order status
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

    // Get order to check ownership
    const orderItem = await DynamoDBService.getItem(
      `ORDER#${orderId}`,
      'DETAILS'
    );

    if (!orderItem) {
      return ResponseBuilder.notFound('Order');
    }

    // Only vendor or admin can update order status
    if (!isOwner(authContext, orderItem.vendorId) && !isAdmin(authContext)) {
      return ResponseBuilder.forbidden('Not authorized to update this order');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    if (!body.status) {
      return ResponseBuilder.validationError('Status is required');
    }

    // Update order status
    const updates = {
      status: body.status,
      updatedAt: new Date().toISOString()
    };

    const updatedItem = await DynamoDBService.updateItem(
      `ORDER#${orderId}`,
      'DETAILS',
      updates
    );

    // Notify buyer via SNS
    if (process.env.ORDER_EVENTS_TOPIC_ARN) {
      await SNSService.publish(
        process.env.ORDER_EVENTS_TOPIC_ARN,
        {
          eventType: 'ORDER_STATUS_UPDATED',
          orderId,
          status: body.status,
          buyerId: orderItem.buyerId
        },
        `Order ${orderId} - Status: ${body.status}`
      );
    }

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...order } = updatedItem;

    return ResponseBuilder.success(order);

  } catch (error) {
    console.error('Error updating order status:', error);
    return ResponseBuilder.internalError('Failed to update order status');
  }
}

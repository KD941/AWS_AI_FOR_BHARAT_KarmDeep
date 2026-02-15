import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  PaginatedResponse,
  Order
} from '@karmdeep/shared';

/**
 * List orders for buyer or vendor
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get query parameters
    const buyerId = event.queryStringParameters?.buyerId;
    const vendorId = event.queryStringParameters?.vendorId;
    const status = event.queryStringParameters?.status;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    let result;

    if (buyerId) {
      // Query orders by buyer
      result = await DynamoDBService.query(
        `BUYER#${buyerId}`,
        'begins_with(SK, :sk)',
        limit
      );
    } else if (vendorId) {
      // Query orders by vendor
      result = await DynamoDBService.query(
        `VENDOR#${vendorId}`,
        'begins_with(SK, :sk)',
        limit
      );
    } else {
      return ResponseBuilder.validationError('Either buyerId or vendorId is required');
    }

    // Transform and filter items
    let orders = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...order } = item;
      return order as Order;
    });

    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    const response: PaginatedResponse<Order> = {
      items: orders,
      total: orders.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error listing orders:', error);
    return ResponseBuilder.internalError('Failed to list orders');
  }
}

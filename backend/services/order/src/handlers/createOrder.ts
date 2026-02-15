import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { SNS } from 'aws-sdk';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  Order,
  UserRole
} from '@karmdeep/shared';

const sns = new SNS();

/**
 * Create new order
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only manufacturers can create orders
    if (authContext.role !== UserRole.MANUFACTURER) {
      return ResponseBuilder.forbidden('Only manufacturers can create orders');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'vendorId',
      'productId',
      'quantity',
      'totalAmount',
      'currency',
      'shippingAddress'
    ]);

    // Create order
    const orderId = uuidv4();
    const buyerId = authContext.companyId || authContext.userId;
    const now = new Date().toISOString();

    const order: Order = {
      orderId,
      buyerId,
      vendorId: body.vendorId,
      productId: body.productId,
      quantity: body.quantity,
      totalAmount: body.totalAmount,
      currency: body.currency,
      status: 'PENDING',
      shippingAddress: body.shippingAddress,
      createdAt: now,
      updatedAt: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `ORDER#${orderId}`,
      SK: 'DETAILS',
      ...order,
      GSI1PK: `BUYER#${buyerId}`,
      GSI1SK: `ORDER#${orderId}`,
      GSI2PK: `VENDOR#${body.vendorId}`,
      GSI2SK: `ORDER#${orderId}`
    });

    // Notify vendor via SNS
    await sns.publish({
      TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN!,
      Message: JSON.stringify({
        eventType: 'ORDER_CREATED',
        order
      }),
      Subject: `New Order: ${orderId}`
    }).promise();

    return ResponseBuilder.success(order, 201);

  } catch (error) {
    console.error('Error creating order:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to create order');
  }
}

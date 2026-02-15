import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  UserRole,
  SNSService
} from '@karmdeep/shared';

/**
 * Update work order status
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get work order ID from path parameters
    const workOrderId = event.pathParameters?.workOrderId;
    if (!workOrderId) {
      return ResponseBuilder.validationError('Work Order ID is required');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Allowed update fields
    const updates: Record<string, any> = {};
    
    if (body.status) updates.status = body.status;
    if (body.findings) updates.findings = body.findings;
    if (body.partsUsed) updates.partsUsed = body.partsUsed;
    if (body.cost !== undefined) updates.cost = body.cost;
    
    if (body.status === 'COMPLETED') {
      updates.completedDate = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return ResponseBuilder.validationError('No valid fields to update');
    }

    updates.updatedAt = new Date().toISOString();

    // Update in DynamoDB
    const updatedItem = await DynamoDBService.updateItem(
      `WORKORDER#${workOrderId}`,
      'DETAILS',
      updates
    );

    // Notify on status change
    if (body.status && process.env.MAINTENANCE_EVENTS_TOPIC_ARN) {
      await SNSService.publish(
        process.env.MAINTENANCE_EVENTS_TOPIC_ARN,
        {
          eventType: 'WORK_ORDER_UPDATED',
          workOrderId,
          status: body.status
        },
        `Work Order ${workOrderId} - Status: ${body.status}`
      );
    }

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...workOrder } = updatedItem;

    return ResponseBuilder.success(workOrder);

  } catch (error) {
    console.error('Error updating work order:', error);
    return ResponseBuilder.internalError('Failed to update work order');
  }
}

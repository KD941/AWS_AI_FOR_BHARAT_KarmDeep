import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  PaginatedResponse,
  WorkOrder
} from '@karmdeep/shared';

/**
 * Get work orders for a technician or machine
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get query parameters
    const technicianId = event.queryStringParameters?.technicianId;
    const machineId = event.queryStringParameters?.machineId;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    let result;

    if (technicianId) {
      // Query by technician
      result = await DynamoDBService.query(
        `TECHNICIAN#${technicianId}`,
        undefined,
        limit
      );
    } else if (machineId) {
      // Query by machine
      result = await DynamoDBService.query(
        `MACHINE#${machineId}`,
        'begins_with(SK, :sk)',
        limit
      );
    } else {
      return ResponseBuilder.validationError('Either technicianId or machineId is required');
    }

    // Transform items
    const workOrders = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...workOrder } = item;
      return workOrder as WorkOrder;
    });

    const response: PaginatedResponse<WorkOrder> = {
      items: workOrders,
      total: workOrders.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error getting work orders:', error);
    return ResponseBuilder.internalError('Failed to get work orders');
  }
}

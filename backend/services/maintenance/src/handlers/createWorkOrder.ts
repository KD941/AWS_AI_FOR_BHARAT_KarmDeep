import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  WorkOrder,
  UserRole,
  SNSService
} from '@karmdeep/shared';

/**
 * Create work order
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only engineers and admins can create work orders
    if (authContext.role !== UserRole.ENGINEER && authContext.role !== UserRole.ADMIN) {
      return ResponseBuilder.forbidden('Only engineers can create work orders');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'machineId',
      'maintenanceType',
      'assignedTechnician',
      'scheduledDate'
    ]);

    // Create work order
    const workOrderId = uuidv4();
    const now = new Date().toISOString();

    const workOrder: WorkOrder = {
      workOrderId,
      machineId: body.machineId,
      scheduleId: body.scheduleId,
      maintenanceType: body.maintenanceType,
      assignedTechnician: body.assignedTechnician,
      scheduledDate: body.scheduledDate,
      status: 'CREATED',
      findings: body.findings,
      partsUsed: body.partsUsed,
      cost: body.cost
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `WORKORDER#${workOrderId}`,
      SK: 'DETAILS',
      ...workOrder,
      GSI1PK: `MACHINE#${body.machineId}`,
      GSI1SK: `WORKORDER#${workOrderId}`,
      GSI2PK: `TECHNICIAN#${body.assignedTechnician}`,
      GSI2SK: body.scheduledDate,
      createdAt: now
    });

    // Notify technician via SNS
    if (process.env.MAINTENANCE_EVENTS_TOPIC_ARN) {
      await SNSService.publish(
        process.env.MAINTENANCE_EVENTS_TOPIC_ARN,
        {
          eventType: 'WORK_ORDER_CREATED',
          workOrder
        },
        `New Work Order: ${workOrderId}`
      );
    }

    return ResponseBuilder.success(workOrder, 201);

  } catch (error) {
    console.error('Error creating work order:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to create work order');
  }
}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  MaintenanceSchedule,
  UserRole
} from '@karmdeep/shared';

/**
 * Create maintenance schedule
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only engineers and admins can create schedules
    if (authContext.role !== UserRole.ENGINEER && authContext.role !== UserRole.ADMIN) {
      return ResponseBuilder.forbidden('Only engineers can create maintenance schedules');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'machineId',
      'maintenanceType',
      'frequency',
      'nextDueDate',
      'instructions'
    ]);

    // Create schedule
    const scheduleId = uuidv4();
    const now = new Date().toISOString();

    const schedule: MaintenanceSchedule = {
      scheduleId,
      machineId: body.machineId,
      maintenanceType: body.maintenanceType,
      frequency: body.frequency,
      nextDueDate: body.nextDueDate,
      instructions: body.instructions,
      priority: body.priority || 'MEDIUM',
      createdAt: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `MACHINE#${body.machineId}`,
      SK: `SCHEDULE#${scheduleId}`,
      ...schedule,
      GSI1PK: `SCHEDULE#${scheduleId}`,
      GSI1SK: body.nextDueDate
    });

    return ResponseBuilder.success(schedule, 201);

  } catch (error) {
    console.error('Error creating maintenance schedule:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to create maintenance schedule');
  }
}

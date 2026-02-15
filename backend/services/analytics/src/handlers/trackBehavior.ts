import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  UserBehavior
} from '@karmdeep/shared';

/**
 * Track user behavior for analytics
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'action',
      'resourceType',
      'resourceId'
    ]);

    // Create behavior record
    const behaviorId = uuidv4();
    const sessionId = body.sessionId || uuidv4();
    const now = new Date().toISOString();

    const behavior: UserBehavior = {
      behaviorId,
      userId: authContext.userId,
      sessionId,
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      metadata: body.metadata || {},
      timestamp: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `USER#${authContext.userId}`,
      SK: `BEHAVIOR#${now}#${behaviorId}`,
      ...behavior,
      GSI1PK: `RESOURCE#${body.resourceType}#${body.resourceId}`,
      GSI1SK: now
    });

    return ResponseBuilder.success({ tracked: true }, 201);

  } catch (error) {
    console.error('Error tracking behavior:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to track behavior');
  }
}

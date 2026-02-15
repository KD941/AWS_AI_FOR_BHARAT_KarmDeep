import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { SNS } from 'aws-sdk';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  Tender,
  UserRole
} from '@karmdeep/shared';

const sns = new SNS();

/**
 * Create new tender
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only manufacturers can create tenders
    if (authContext.role !== UserRole.MANUFACTURER) {
      return ResponseBuilder.forbidden('Only manufacturers can create tenders');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'title',
      'description',
      'specifications',
      'commercialTerms',
      'deadline'
    ]);

    // Validate deadline is in future
    const deadline = new Date(body.deadline);
    if (deadline <= new Date()) {
      return ResponseBuilder.validationError('Deadline must be in the future');
    }

    // Create tender
    const tenderId = uuidv4();
    const buyerId = authContext.companyId || authContext.userId;
    const now = new Date().toISOString();

    const tender: Tender = {
      tenderId,
      buyerId,
      title: body.title,
      description: body.description,
      specifications: body.specifications,
      commercialTerms: body.commercialTerms,
      deadline: body.deadline,
      status: body.status || 'DRAFT',
      createdAt: now,
      updatedAt: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `TENDER#${tenderId}`,
      SK: 'REQUEST',
      ...tender,
      GSI1PK: `BUYER#${buyerId}`,
      GSI1SK: `TENDER#${tenderId}`
    });

    // If published, notify vendors via SNS
    if (tender.status === 'PUBLISHED') {
      await sns.publish({
        TopicArn: process.env.TENDER_EVENTS_TOPIC_ARN!,
        Message: JSON.stringify({
          eventType: 'TENDER_PUBLISHED',
          tender
        }),
        Subject: `New Tender: ${tender.title}`
      }).promise();
    }

    return ResponseBuilder.success(tender, 201);

  } catch (error) {
    console.error('Error creating tender:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to create tender');
  }
}

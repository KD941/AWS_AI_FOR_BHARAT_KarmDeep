import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  Tender
} from '@karmdeep/shared';

/**
 * Get tender details
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get tender ID from path parameters
    const tenderId = event.pathParameters?.tenderId;
    if (!tenderId) {
      return ResponseBuilder.validationError('Tender ID is required');
    }

    // Get tender from DynamoDB
    const item = await DynamoDBService.getItem(
      `TENDER#${tenderId}`,
      'REQUEST'
    );

    if (!item) {
      return ResponseBuilder.notFound('Tender');
    }

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, ...tender } = item;

    return ResponseBuilder.success(tender as Tender);

  } catch (error) {
    console.error('Error getting tender:', error);
    return ResponseBuilder.internalError('Failed to get tender');
  }
}

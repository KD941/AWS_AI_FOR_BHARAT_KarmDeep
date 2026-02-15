import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  PaginatedResponse,
  Tender
} from '@karmdeep/shared';

/**
 * List tenders
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get query parameters
    const status = event.queryStringParameters?.status;
    const buyerId = event.queryStringParameters?.buyerId;
    const limit = parseInt(event.queryStringParameters?.limit || '20');

    let result;

    if (buyerId) {
      // Query tenders by buyer
      result = await DynamoDBService.query(
        `BUYER#${buyerId}`,
        'begins_with(SK, :sk)',
        limit
      );
    } else {
      // Query all published tenders (simplified)
      result = await DynamoDBService.query(
        'TENDERS',
        undefined,
        limit
      );
    }

    // Filter by status if provided
    let tenders = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, ...tender } = item;
      return tender as Tender;
    });

    if (status) {
      tenders = tenders.filter(t => t.status === status);
    }

    const response: PaginatedResponse<Tender> = {
      items: tenders,
      total: tenders.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error listing tenders:', error);
    return ResponseBuilder.internalError('Failed to list tenders');
  }
}

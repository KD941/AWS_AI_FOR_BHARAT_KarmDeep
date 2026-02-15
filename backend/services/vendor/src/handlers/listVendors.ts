import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  PaginatedResponse,
  VendorProfile
} from '@karmdeep/shared';

/**
 * List all vendors with pagination
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get pagination parameters
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    const nextToken = event.queryStringParameters?.nextToken;

    // Query vendors (this is simplified - in production you'd use GSI)
    const result = await DynamoDBService.query(
      'VENDORS',
      'begins_with(SK, :sk)',
      limit,
      nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined
    );

    // Transform items
    const vendors = result.items.map(item => {
      const { PK, SK, GSI1PK, GSI1SK, ...vendor } = item;
      return vendor as VendorProfile;
    });

    const response: PaginatedResponse<VendorProfile> = {
      items: vendors,
      nextToken: result.lastEvaluatedKey 
        ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
        : undefined,
      total: vendors.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error listing vendors:', error);
    return ResponseBuilder.internalError('Failed to list vendors');
  }
}

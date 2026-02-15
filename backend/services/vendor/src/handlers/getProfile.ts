import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  VendorProfile
} from '@karmdeep/shared';

/**
 * Get vendor profile
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Get vendor ID from path parameters
    const vendorId = event.pathParameters?.vendorId;
    if (!vendorId) {
      return ResponseBuilder.validationError('Vendor ID is required');
    }

    // Get vendor profile from DynamoDB
    const item = await DynamoDBService.getItem(
      `VENDOR#${vendorId}`,
      'PROFILE'
    );

    if (!item) {
      return ResponseBuilder.notFound('Vendor');
    }

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, ...vendorProfile } = item;

    return ResponseBuilder.success(vendorProfile as VendorProfile);

  } catch (error) {
    console.error('Error getting vendor profile:', error);
    return ResponseBuilder.internalError('Failed to get vendor profile');
  }
}

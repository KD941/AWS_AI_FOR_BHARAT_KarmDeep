import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  isOwner,
  isAdmin,
  UserRole
} from '@karmdeep/shared';

/**
 * Update vendor profile
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

    // Check authorization
    if (!isOwner(authContext, vendorId) && !isAdmin(authContext)) {
      return ResponseBuilder.forbidden('Not authorized to update this profile');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Allowed update fields
    const allowedFields = [
      'companyName',
      'phoneNumber',
      'address',
      'certifications'
    ];

    const updates: Record<string, any> = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return ResponseBuilder.validationError('No valid fields to update');
    }

    // Add updated timestamp
    updates.updatedAt = new Date().toISOString();

    // Update in DynamoDB
    const updatedItem = await DynamoDBService.updateItem(
      `VENDOR#${vendorId}`,
      'PROFILE',
      updates
    );

    // Remove DynamoDB keys
    const { PK, SK, GSI1PK, GSI1SK, ...vendorProfile } = updatedItem;

    return ResponseBuilder.success(vendorProfile);

  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return ResponseBuilder.internalError('Failed to update vendor profile');
  }
}

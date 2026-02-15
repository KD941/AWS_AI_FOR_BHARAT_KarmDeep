import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  validateEmail,
  ValidationError,
  VendorProfile,
  UserRole
} from '@karmdeep/shared';

/**
 * Register new vendor
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only vendors can register
    if (authContext.role !== UserRole.VENDOR) {
      return ResponseBuilder.forbidden('Only vendors can register');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'companyName',
      'email',
      'phoneNumber',
      'address'
    ]);

    // Validate email
    if (!validateEmail(body.email)) {
      return ResponseBuilder.validationError('Invalid email format');
    }

    // Create vendor profile
    const vendorId = uuidv4();
    const now = new Date().toISOString();

    const vendorProfile: VendorProfile = {
      vendorId,
      companyName: body.companyName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      address: body.address,
      certifications: body.certifications || [],
      verificationStatus: 'PENDING',
      rating: 0,
      totalReviews: 0,
      createdAt: now,
      updatedAt: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `VENDOR#${vendorId}`,
      SK: 'PROFILE',
      ...vendorProfile,
      GSI1PK: `VENDOR_EMAIL#${body.email}`,
      GSI1SK: vendorId
    });

    return ResponseBuilder.success(vendorProfile, 201);

  } catch (error) {
    console.error('Error registering vendor:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to register vendor');
  }
}

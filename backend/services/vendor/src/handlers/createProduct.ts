import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  Product,
  UserRole
} from '@karmdeep/shared';

/**
 * Create new product
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only vendors can create products
    if (authContext.role !== UserRole.VENDOR) {
      return ResponseBuilder.forbidden('Only vendors can create products');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'productName',
      'category',
      'specifications',
      'pricing'
    ]);

    // Create product
    const productId = uuidv4();
    const vendorId = authContext.companyId || authContext.userId;
    const now = new Date().toISOString();

    const product: Product = {
      productId,
      vendorId,
      productName: body.productName,
      category: body.category,
      subcategory: body.subcategory,
      specifications: body.specifications,
      pricing: body.pricing,
      availability: body.availability || 'IN_STOCK',
      images: body.images || [],
      certifications: body.certifications || [],
      warranty: body.warranty || {
        duration: 12,
        unit: 'MONTHS',
        terms: 'Standard warranty'
      },
      createdAt: now,
      updatedAt: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `VENDOR#${vendorId}`,
      SK: `PRODUCT#${productId}`,
      ...product,
      GSI1PK: `CATEGORY#${body.category}`,
      GSI1SK: productId,
      GSI2PK: `PRODUCT#${productId}`,
      GSI2SK: vendorId
    });

    return ResponseBuilder.success(product, 201);

  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to create product');
  }
}

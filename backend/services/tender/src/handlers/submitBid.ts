import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  Bid,
  UserRole,
  Tender
} from '@karmdeep/shared';

/**
 * Submit bid for tender
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only vendors can submit bids
    if (authContext.role !== UserRole.VENDOR) {
      return ResponseBuilder.forbidden('Only vendors can submit bids');
    }

    // Get tender ID from path parameters
    const tenderId = event.pathParameters?.tenderId;
    if (!tenderId) {
      return ResponseBuilder.validationError('Tender ID is required');
    }

    // Check if tender exists and is open
    const tenderItem = await DynamoDBService.getItem(
      `TENDER#${tenderId}`,
      'REQUEST'
    );

    if (!tenderItem) {
      return ResponseBuilder.notFound('Tender');
    }

    const tender = tenderItem as unknown as Tender;
    if (tender.status !== 'PUBLISHED') {
      return ResponseBuilder.validationError('Tender is not open for bidding');
    }

    // Check if deadline has passed
    if (new Date(tender.deadline) < new Date()) {
      return ResponseBuilder.validationError('Tender deadline has passed');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'bidAmount',
      'currency',
      'technicalProposal',
      'commercialTerms',
      'validUntil'
    ]);

    // Create bid
    const bidId = uuidv4();
    const vendorId = authContext.companyId || authContext.userId;
    const now = new Date().toISOString();

    const bid: Bid = {
      bidId,
      tenderId,
      vendorId,
      bidAmount: body.bidAmount,
      currency: body.currency,
      technicalProposal: body.technicalProposal,
      commercialTerms: body.commercialTerms,
      validUntil: body.validUntil,
      status: 'SUBMITTED',
      submittedAt: now
    };

    // Save to DynamoDB
    await DynamoDBService.putItem({
      PK: `TENDER#${tenderId}`,
      SK: `BID#${vendorId}`,
      ...bid,
      GSI1PK: `VENDOR#${vendorId}`,
      GSI1SK: `BID#${bidId}`
    });

    return ResponseBuilder.success(bid, 201);

  } catch (error) {
    console.error('Error submitting bid:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to submit bid');
  }
}

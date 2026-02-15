import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  isOwner,
  isAdmin,
  PaginatedResponse,
  Bid
} from '@karmdeep/shared';

/**
 * Get bids for a tender
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

    // Get tender to check ownership
    const tenderItem = await DynamoDBService.getItem(
      `TENDER#${tenderId}`,
      'REQUEST'
    );

    if (!tenderItem) {
      return ResponseBuilder.notFound('Tender');
    }

    // Only tender owner or admin can view bids
    if (!isOwner(authContext, tenderItem.buyerId) && !isAdmin(authContext)) {
      return ResponseBuilder.forbidden('Not authorized to view bids');
    }

    // Get all bids for this tender
    const result = await DynamoDBService.query(
      `TENDER#${tenderId}`,
      'begins_with(SK, :sk)',
      50
    );

    // Transform items
    const bids = result.items
      .filter(item => item.SK.startsWith('BID#'))
      .map(item => {
        const { PK, SK, GSI1PK, GSI1SK, ...bid } = item;
        return bid as Bid;
      });

    const response: PaginatedResponse<Bid> = {
      items: bids,
      total: bids.length
    };

    return ResponseBuilder.success(response);

  } catch (error) {
    console.error('Error getting bids:', error);
    return ResponseBuilder.internalError('Failed to get bids');
  }
}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  ResponseBuilder,
  extractAuthContext,
  UserRole,
  PlatformMetrics
} from '@karmdeep/shared';

/**
 * Get platform-wide metrics
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only admins can view platform metrics
    if (authContext.role !== UserRole.ADMIN) {
      return ResponseBuilder.forbidden('Only admins can view platform metrics');
    }

    const period = event.queryStringParameters?.period || 'current_month';

    // In production, these would be calculated from actual data
    const metrics: PlatformMetrics = {
      totalUsers: 1250,
      activeUsers: 890,
      totalVendors: 45,
      totalProducts: 3200,
      totalOrders: 450,
      totalRevenue: 15000000,
      averageOrderValue: 33333,
      period
    };

    return ResponseBuilder.success(metrics);

  } catch (error) {
    console.error('Error getting platform metrics:', error);
    return ResponseBuilder.internalError('Failed to get platform metrics');
  }
}

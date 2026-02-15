import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  ProductRecommendation
} from '@karmdeep/shared';

/**
 * Get product recommendations for user
 * This is a simplified version - in production, this would call SageMaker endpoint
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    const limit = parseInt(event.queryStringParameters?.limit || '10');

    // Get user's recent behavior
    const behaviorResult = await DynamoDBService.query(
      `USER#${authContext.userId}`,
      'begins_with(SK, :sk)',
      20
    );

    // Simple recommendation logic (in production, use ML model)
    const viewedProducts = new Set<string>();
    const categoryInterests = new Map<string, number>();

    behaviorResult.items.forEach(item => {
      if (item.resourceType === 'PRODUCT') {
        viewedProducts.add(item.resourceId);
        
        // Track category interest
        const category = item.metadata?.category;
        if (category) {
          categoryInterests.set(
            category,
            (categoryInterests.get(category) || 0) + 1
          );
        }
      }
    });

    // Get top categories
    const topCategories = Array.from(categoryInterests.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    // Fetch products from top categories (simplified)
    const recommendations: ProductRecommendation[] = [];
    
    for (const category of topCategories) {
      const products = await DynamoDBService.query(
        `CATEGORY#${category}`,
        undefined,
        5
      );

      products.items.forEach(product => {
        if (!viewedProducts.has(product.productId)) {
          recommendations.push({
            productId: product.productId,
            score: 0.8,
            reason: `Based on your interest in ${category}`
          });
        }
      });

      if (recommendations.length >= limit) break;
    }

    return ResponseBuilder.success({
      recommendations: recommendations.slice(0, limit),
      basedOn: {
        viewedProducts: viewedProducts.size,
        topCategories
      }
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return ResponseBuilder.internalError('Failed to get recommendations');
  }
}

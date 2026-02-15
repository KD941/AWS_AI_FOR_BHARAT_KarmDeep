import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  DynamoDBService,
  ResponseBuilder,
  extractAuthContext,
  validateRequired,
  ValidationError,
  AnalyticsReport,
  UserRole
} from '@karmdeep/shared';

/**
 * Generate analytics report
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract auth context
    const authContext = extractAuthContext(event);
    if (!authContext) {
      return ResponseBuilder.unauthorized();
    }

    // Only admins can generate reports
    if (authContext.role !== UserRole.ADMIN) {
      return ResponseBuilder.forbidden('Only admins can generate reports');
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequired(body, [
      'reportType',
      'period'
    ]);

    const reportId = uuidv4();
    const now = new Date().toISOString();

    // Generate report based on type
    let metrics: Record<string, any> = {};
    let insights: string[] = [];

    switch (body.reportType) {
      case 'PROCUREMENT':
        metrics = await generateProcurementMetrics(body.period);
        insights = generateProcurementInsights(metrics);
        break;
      
      case 'VENDOR_PERFORMANCE':
        metrics = await generateVendorPerformanceMetrics(body.period);
        insights = generateVendorInsights(metrics);
        break;
      
      case 'MARKET_TRENDS':
        metrics = await generateMarketTrendsMetrics(body.period);
        insights = generateMarketInsights(metrics);
        break;
      
      case 'COST_OPTIMIZATION':
        metrics = await generateCostOptimizationMetrics(body.period);
        insights = generateCostInsights(metrics);
        break;
      
      default:
        return ResponseBuilder.validationError('Invalid report type');
    }

    const report: AnalyticsReport = {
      reportId,
      reportType: body.reportType,
      period: body.period,
      metrics,
      insights,
      generatedAt: now,
      generatedBy: authContext.userId
    };

    // Save report
    await DynamoDBService.putItem({
      PK: `REPORT#${reportId}`,
      SK: 'DETAILS',
      ...report,
      GSI1PK: `REPORT_TYPE#${body.reportType}`,
      GSI1SK: now
    });

    return ResponseBuilder.success(report, 201);

  } catch (error) {
    console.error('Error generating report:', error);

    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.message);
    }

    return ResponseBuilder.internalError('Failed to generate report');
  }
}

// Helper functions for metrics generation
async function generateProcurementMetrics(period: any): Promise<Record<string, any>> {
  // Simplified - in production, query actual data
  return {
    totalOrders: 150,
    totalValue: 5000000,
    averageOrderValue: 33333,
    topCategories: ['CNC Machines', 'VMC', '3D Printers'],
    averageLeadTime: 15
  };
}

function generateProcurementInsights(metrics: Record<string, any>): string[] {
  return [
    `Total procurement value: $${metrics.totalValue.toLocaleString()}`,
    `Average order value increased by 12% compared to previous period`,
    `Lead time reduced by 20% through digital tendering`
  ];
}

async function generateVendorPerformanceMetrics(period: any): Promise<Record<string, any>> {
  return {
    totalVendors: 45,
    activeVendors: 32,
    averageRating: 4.2,
    onTimeDeliveryRate: 0.87,
    topPerformers: ['Vendor A', 'Vendor B', 'Vendor C']
  };
}

function generateVendorInsights(metrics: Record<string, any>): string[] {
  return [
    `${metrics.activeVendors} active vendors out of ${metrics.totalVendors} total`,
    `Average vendor rating: ${metrics.averageRating}/5.0`,
    `On-time delivery rate: ${(metrics.onTimeDeliveryRate * 100).toFixed(1)}%`
  ];
}

async function generateMarketTrendsMetrics(period: any): Promise<Record<string, any>> {
  return {
    growingCategories: ['3D Printers', 'Automation Equipment'],
    decliningCategories: ['Manual Machines'],
    averagePriceChange: 0.05,
    demandGrowth: 0.15
  };
}

function generateMarketInsights(metrics: Record<string, any>): string[] {
  return [
    `Demand growth: ${(metrics.demandGrowth * 100).toFixed(1)}%`,
    `Growing categories: ${metrics.growingCategories.join(', ')}`,
    `Average price increase: ${(metrics.averagePriceChange * 100).toFixed(1)}%`
  ];
}

async function generateCostOptimizationMetrics(period: any): Promise<Record<string, any>> {
  return {
    potentialSavings: 250000,
    optimizationOpportunities: 12,
    averageSavingsPerOrder: 1667,
    recommendedActions: [
      'Consolidate orders with preferred vendors',
      'Negotiate volume discounts',
      'Optimize delivery schedules'
    ]
  };
}

function generateCostInsights(metrics: Record<string, any>): string[] {
  return [
    `Potential savings identified: $${metrics.potentialSavings.toLocaleString()}`,
    `${metrics.optimizationOpportunities} optimization opportunities found`,
    `Average savings per order: $${metrics.averageSavingsPerOrder.toLocaleString()}`
  ];
}

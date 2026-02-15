// Analytics Types

export interface UserBehavior {
  behaviorId: string;
  userId: string;
  sessionId: string;
  action: string;
  resourceType: 'PRODUCT' | 'VENDOR' | 'TENDER' | 'ORDER';
  resourceId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface ProductRecommendation {
  productId: string;
  score: number;
  reason: string;
}

export interface VendorRecommendation {
  vendorId: string;
  score: number;
  matchingCriteria: string[];
}

export interface AnalyticsReport {
  reportId: string;
  reportType: 'PROCUREMENT' | 'VENDOR_PERFORMANCE' | 'MARKET_TRENDS' | 'COST_OPTIMIZATION';
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: Record<string, any>;
  insights: string[];
  generatedAt: string;
  generatedBy: string;
}

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  period: string;
}

export interface VendorPerformance {
  vendorId: string;
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  onTimeDeliveryRate: number;
  responseTime: number;
  period: string;
}

export interface MarketTrend {
  category: string;
  demand: number;
  averagePrice: number;
  topVendors: string[];
  growthRate: number;
  period: string;
}

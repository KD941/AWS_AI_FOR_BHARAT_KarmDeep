// User Types
export enum UserRole {
  MANUFACTURER = 'MANUFACTURER',
  VENDOR = 'VENDOR',
  ENGINEER = 'ENGINEER',
  DELIVERY_AGENT = 'DELIVERY_AGENT',
  ADMIN = 'ADMIN'
}

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Vendor Types
export interface VendorProfile {
  vendorId: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  address: Address;
  certifications: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  vendorId: string;
  productName: string;
  category: string;
  subcategory?: string;
  specifications: Record<string, any>;
  pricing: {
    basePrice: number;
    currency: string;
    negotiable: boolean;
  };
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER';
  images: string[];
  certifications: string[];
  warranty: {
    duration: number;
    unit: 'MONTHS' | 'YEARS';
    terms: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Tender Types
export interface Tender {
  tenderId: string;
  buyerId: string;
  title: string;
  description: string;
  specifications: Record<string, any>;
  commercialTerms: {
    budget: number;
    currency: string;
    paymentTerms: string;
  };
  deadline: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'AWARDED';
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  bidId: string;
  tenderId: string;
  vendorId: string;
  bidAmount: number;
  currency: string;
  technicalProposal: string;
  commercialTerms: string;
  validUntil: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  submittedAt: string;
}

// Order Types
export interface Order {
  orderId: string;
  buyerId: string;
  vendorId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'INSTALLED' | 'COMPLETED' | 'CANCELLED';
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryTracking {
  deliveryId: string;
  orderId: string;
  deliveryAgentId: string;
  scheduledDate: string;
  actualDate?: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  trackingEvents: TrackingEvent[];
}

export interface TrackingEvent {
  eventId: string;
  eventType: string;
  description: string;
  timestamp: string;
  location?: string;
}

// Maintenance Types
export interface MaintenanceSchedule {
  scheduleId: string;
  machineId: string;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
  frequency: string;
  nextDueDate: string;
  instructions: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export interface WorkOrder {
  workOrderId: string;
  machineId: string;
  scheduleId?: string;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'EMERGENCY';
  assignedTechnician: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  findings?: string;
  partsUsed?: string[];
  cost?: number;
}

// Common Types
export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationParams {
  limit?: number;
  nextToken?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  total?: number;
}

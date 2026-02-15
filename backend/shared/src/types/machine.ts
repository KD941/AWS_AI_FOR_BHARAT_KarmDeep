// Machine and Installation Types

export interface Machine {
  machineId: string;
  orderId: string;
  productId: string;
  ownerId: string;
  serialNumber: string;
  installationDate: string;
  warrantyExpiryDate: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'DECOMMISSIONED';
  location: {
    facilityName: string;
    address: Address;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  specifications: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Installation {
  installationId: string;
  orderId: string;
  machineId: string;
  engineerId: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  checkpoints: InstallationCheckpoint[];
  photos: string[];
  digitalSignature?: string;
  notes?: string;
  createdAt: string;
}

export interface InstallationCheckpoint {
  checkpointId: string;
  name: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  completedAt?: string;
  notes?: string;
}

export interface MaintenanceHistory {
  historyId: string;
  machineId: string;
  workOrderId: string;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'EMERGENCY';
  performedBy: string;
  performedDate: string;
  findings: string;
  partsReplaced: PartReplacement[];
  cost: number;
  nextRecommendedDate?: string;
  createdAt: string;
}

export interface PartReplacement {
  partId: string;
  partName: string;
  quantity: number;
  cost: number;
}

// Import Address from main types
import { Address } from './index';

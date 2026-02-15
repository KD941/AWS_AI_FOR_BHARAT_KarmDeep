import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

/**
 * Extract and verify JWT token from event
 */
export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext | null {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;

    if (!decoded || !decoded.sub || !decoded.email) {
      return null;
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded['custom:role'] as UserRole,
      companyId: decoded['custom:companyId']
    };
  } catch (error) {
    console.error('Error extracting auth context:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(context: AuthContext, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(context.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(context: AuthContext): boolean {
  return context.role === UserRole.ADMIN;
}

/**
 * Check if user owns the resource
 */
export function isOwner(context: AuthContext, resourceOwnerId: string): boolean {
  return context.userId === resourceOwnerId || context.companyId === resourceOwnerId;
}

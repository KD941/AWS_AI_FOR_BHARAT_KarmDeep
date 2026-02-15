import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse } from '../types';

export class ResponseBuilder {
  /**
   * Success response
   */
  static success<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
    const response: ApiResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    };

    return {
      statusCode,
      headers: this.getHeaders(),
      body: JSON.stringify(response)
    };
  }

  /**
   * Error response
   */
  static error(
    code: string,
    message: string,
    statusCode: number = 400
  ): APIGatewayProxyResult {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    };

    return {
      statusCode,
      headers: this.getHeaders(),
      body: JSON.stringify(response)
    };
  }

  /**
   * Not found response
   */
  static notFound(resource: string): APIGatewayProxyResult {
    return this.error('NOT_FOUND', `${resource} not found`, 404);
  }

  /**
   * Unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized'): APIGatewayProxyResult {
    return this.error('UNAUTHORIZED', message, 401);
  }

  /**
   * Forbidden response
   */
  static forbidden(message: string = 'Forbidden'): APIGatewayProxyResult {
    return this.error('FORBIDDEN', message, 403);
  }

  /**
   * Validation error response
   */
  static validationError(message: string): APIGatewayProxyResult {
    return this.error('VALIDATION_ERROR', message, 400);
  }

  /**
   * Internal server error response
   */
  static internalError(message: string = 'Internal server error'): APIGatewayProxyResult {
    return this.error('INTERNAL_ERROR', message, 500);
  }

  /**
   * Get common headers
   */
  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

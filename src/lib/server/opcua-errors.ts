/**
 * OPC UA Error Handling Utilities
 * 
 * This file provides centralized error handling for OPC UA operations
 * to ensure consistent error responses across API routes and services.
 */

import { NextResponse } from "next/server";
import { getErrorMessage } from "../opcua-utils";

// ============================================================================
// Error Types
// ============================================================================

export class OPCUAConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OPCUAConnectionError";
  }
}

export class OPCUANotConnectedError extends Error {
  constructor() {
    super("Not connected to OPC UA server");
    this.name = "OPCUANotConnectedError";
  }
}

export class OPCUANodeError extends Error {
  constructor(message: string, public nodeId?: string) {
    super(message);
    this.name = "OPCUANodeError";
  }
}

export class OPCUASubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OPCUASubscriptionError";
  }
}

export class OPCUABrowseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OPCUABrowseError";
  }
}

export class OPCUAValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OPCUAValidationError";
  }
}

// ============================================================================
// Error Response Builders
// ============================================================================

/**
 * Create a standardized error response
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error details
 */
export function createErrorResponse(error: string | Error, status: number = 500): NextResponse {
  const message = typeof error === "string" ? error : getErrorMessage(error);
  
  return NextResponse.json(
    {
      error: message,
      details: typeof error === "object" ? error.message : undefined,
    },
    { status }
  );
}

/**
 * Create a "not connected" error response
 * @returns NextResponse with 503 status
 */
export function createNotConnectedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Not connected to OPC UA server",
      details: "Please connect to an OPC UA server before performing this operation",
    },
    { status: 503 }
  );
}

/**
 * Create a validation error response
 * @param message - Validation error message
 * @returns NextResponse with 400 status
 */
export function createValidationErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: "Validation error",
      details: message,
    },
    { status: 400 }
  );
}

/**
 * Create a success response
 * @param data - Optional data to include
 * @param message - Optional success message
 * @returns NextResponse with success data
 */
export function createSuccessResponse<T>(data?: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

// ============================================================================
// API Route Error Handler Wrapper
// ============================================================================

/**
 * Wrap an API route handler with try-catch error handling
 * @param handler - Async handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((error) => {
    console.error("API Error:", error);
    return createErrorResponse(error);
  });
}

/**
 * Wrap an API route handler with connection check
 * @param isConnected - Function to check connection status
 * @param handler - Async handler function
 * @returns Wrapped handler with connection check
 */
export async function withConnectionCheck(
  isConnected: () => boolean,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  if (!isConnected()) {
    return createNotConnectedResponse();
  }
  return handler();
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate required field
 * @param value - Value to check
 * @param fieldName - Name of the field
 * @throws OPCUAValidationError if value is missing
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === "") {
    throw new OPCUAValidationError(`${fieldName} is required`);
  }
}

/**
 * Validate array field
 * @param value - Value to check
 * @param fieldName - Name of the field
 * @throws OPCUAValidationError if value is not an array
 */
export function validateArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new OPCUAValidationError(`${fieldName} must be an array`);
  }
}

/**
 * Validate endpoint URL
 * @param endpointUrl - Endpoint URL to validate
 * @throws OPCUAValidationError if invalid
 */
export function validateEndpointUrl(endpointUrl: string): void {
  validateRequired(endpointUrl, "endpointUrl");
  
  try {
    new URL(endpointUrl);
  } catch {
    throw new OPCUAValidationError("Invalid endpoint URL format");
  }
}

/**
 * Validate node ID
 * @param nodeId - Node ID to validate
 * @throws OPCUAValidationError if invalid
 */
export function validateNodeId(nodeId: string): void {
  validateRequired(nodeId, "nodeId");
  
  // Basic validation for common OPC UA node ID formats
  const isValid = /^ns=\d+;[isgb]=.+$|^i=\d+$|^s=.+$|^g=.+$|^b=.+$/.test(nodeId);
  if (!isValid) {
    throw new OPCUAValidationError("Invalid node ID format");
  }
}

/**
 * Validate data type
 * @param dataType - Data type string to validate
 * @param validTypes - Array of valid data type names
 * @throws OPCUAValidationError if invalid
 */
export function validateDataType(dataType: string, validTypes: string[]): void {
  validateRequired(dataType, "dataType");
  
  if (!validTypes.includes(dataType)) {
    throw new OPCUAValidationError(
      `Invalid dataType. Valid types: ${validTypes.join(", ")}`
    );
  }
}

// ============================================================================
// Service Error Handler
// ============================================================================

/**
 * Handle service-level errors with proper error classification
 * @param error - Unknown error
 * @param context - Context for the error (e.g., operation name)
 * @returns Classified error
 */
export function handleServiceError(error: unknown, context: string): Error {
  const message = getErrorMessage(error);
  console.error(`OPC UA Service Error [${context}]:`, error);
  
  // Re-throw if already a known error type
  if (
    error instanceof OPCUAConnectionError ||
    error instanceof OPCUANotConnectedError ||
    error instanceof OPCUANodeError ||
    error instanceof OPCUASubscriptionError ||
    error instanceof OPCUABrowseError ||
    error instanceof OPCUAValidationError
  ) {
    return error as Error;
  }
  
  // Classify based on message content
  if (message.includes("connect") || message.includes("connection")) {
    return new OPCUAConnectionError(message);
  }
  if (message.includes("not connected")) {
    return new OPCUANotConnectedError();
  }
  if (message.includes("node") || message.includes("NodeId")) {
    return new OPCUANodeError(message);
  }
  if (message.includes("subscription")) {
    return new OPCUASubscriptionError(message);
  }
  if (message.includes("browse")) {
    return new OPCUABrowseError(message);
  }
  
  // Default to generic error
  return new Error(message);
}

// ============================================================================
// Async Error Handler Wrapper
// ============================================================================

/**
 * Wrap an async function with error handling and logging
 * @param fn - Async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  context: string
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleServiceError(error, context);
    }
  };
}

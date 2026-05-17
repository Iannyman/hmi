/**
 * S7 Error Handling Utilities
 *
 * Self-contained error handling for S7 operations.
 * Does not modify or depend on opcua-errors.ts.
 */

import { NextResponse } from "next/server";

// ============================================================================
// Error Types
// ============================================================================

export class S7ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S7ConnectionError";
  }
}

export class S7NotConnectedError extends Error {
  constructor() {
    super("Not connected to S7 PLC");
    this.name = "S7NotConnectedError";
  }
}

export class S7ReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S7ReadError";
  }
}

export class S7WriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S7WriteError";
  }
}

export class S7ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S7ValidationError";
  }
}

// ============================================================================
// Response Builders
// ============================================================================

export function createSuccessResponse<T>(data?: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

export function createErrorResponse(error: string | Error, status: number = 500): NextResponse {
  const message = typeof error === "string" ? error : error.message;

  return NextResponse.json(
    {
      error: message,
      details: typeof error === "object" ? error.message : undefined,
    },
    { status }
  );
}

export function createNotConnectedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Not connected to S7 PLC",
      details: "Please connect to an S7 PLC before performing this operation",
    },
    { status: 503 }
  );
}

export function createValidationErrorResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      error: "Validation error",
      details: message,
    },
    { status: 400 }
  );
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === "") {
    throw new S7ValidationError(`${fieldName} is required`);
  }
}

export function validateS7Address(address: string): void {
  validateRequired(address, "address");

  const isValid = /^DB\d+,(X\d+\.\d+(\.\d+)?|INT\d+(\.\d+)?|DINT\d+(\.\d+)?|REAL\d+(\.\d+)?|LREAL\d+(\.\d+)?|BYTE\d+(\.\d+)?|WORD\d+(\.\d+)?|DWORD\d+(\.\d+)?|CHAR\d+(\.\d+)?|S\d+\.\d+(\.\d+)?|[A-Z]\d+(\.\d+)?)$/i.test(address);
  if (!isValid) {
    throw new S7ValidationError(`Invalid S7 address format: "${address}". Expected format: DB<number>,<TYPE><offset> (e.g. DB1,REAL4, DB2,DINT0.10)`);
  }
}

export function validateS7Host(host: string): void {
  validateRequired(host, "host");

  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
  const isHostname = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(host);
  if (!isIp && !isHostname) {
    throw new S7ValidationError(`Invalid host: "${host}"`);
  }
}

// ============================================================================
// Service Error Handler
// ============================================================================

export function handleServiceError(error: unknown, context: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`S7 Service Error [${context}]:`, error);

  if (
    error instanceof S7ConnectionError ||
    error instanceof S7NotConnectedError ||
    error instanceof S7ReadError ||
    error instanceof S7WriteError ||
    error instanceof S7ValidationError
  ) {
    return error as Error;
  }

  if (message.includes("connect") || message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT")) {
    return new S7ConnectionError(message);
  }

  return new Error(message);
}

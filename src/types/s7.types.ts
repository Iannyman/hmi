/**
 * S7 PLC Communication Type Definitions
 *
 * Types for direct Siemens S7 PLC communication via nodes7.
 * Used for reading/writing PLC data blocks (DBs) with a predefined address map.
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface S7Config {
  host: string;
  port?: number;
  rack?: number;
  slot?: number;
}

// ============================================================================
// Address Map Types
// ============================================================================

export type S7ElementType = 'X' | 'BYTE' | 'WORD' | 'INT' | 'DWORD' | 'DINT' | 'REAL' | 'LREAL' | 'CHAR' | 'STRING';

export interface S7AddressEntry {
  name: string;
  address: string;
  description?: string;
  readOnly?: boolean;
}

export interface S7ArrayEntry extends S7AddressEntry {
  elementType: S7ElementType;
  elementSize: number;
  length: number;
}

// ============================================================================
// Value Types
// ============================================================================

export interface S7Value {
  name: string;
  address: string;
  value: unknown;
  quality: 'good' | 'bad';
  timestamp: Date;
}

// ============================================================================
// Connection Types
// ============================================================================

export interface S7ConnectionStatus {
  connected: boolean;
  host?: string;
  port?: number;
  rack?: number;
  slot?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface S7SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface S7ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type S7Response<T = unknown> = S7SuccessResponse<T> | S7ErrorResponse;

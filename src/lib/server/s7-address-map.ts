/**
 * S7 Address Map Configuration
 *
 * Predefined mapping of friendly names to S7 DB addresses.
 * This is the single source of truth for address definitions.
 *
 * Address format: DB<number>,<TYPE><offset>[.arrayLength]
 * Examples: DB1,REAL4 | DB2,DINT0.10 | DB1,X8.0
 */

import { S7AddressEntry, S7ArrayEntry } from "@/types/s7.types";

export const S7_ADDRESS_MAP: (S7AddressEntry | S7ArrayEntry)[] = [
  // DB2 — 3 arrays of 10 DINTs each
  {
    name: "db2_array1",
    address: "DB2,DINT0.10",
    description: "Array 1 — 10 DINTs starting at byte 0",
    elementType: "DINT",
    elementSize: 4,
    length: 10,
  },
  {
    name: "db2_array2",
    address: "DB2,DINT40.10",
    description: "Array 2 — 10 DINTs starting at byte 40",
    elementType: "DINT",
    elementSize: 4,
    length: 10,
  },
  {
    name: "db2_array3",
    address: "DB2,DINT80.10",
    description: "Array 3 — 10 DINTs starting at byte 80",
    elementType: "DINT",
    elementSize: 4,
    length: 10,
  },
];

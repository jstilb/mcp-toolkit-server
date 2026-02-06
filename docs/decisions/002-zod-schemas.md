# ADR-002: Zod for Input Validation

## Status
Accepted

## Date
2026-02-06

## Context
MCP tool inputs come from LLM-generated JSON. We need robust validation with clear error messages and TypeScript type inference.

## Decision
Use Zod schemas for all tool inputs. Schemas serve as both validation and type source.

## Consequences
**Positive:** Type-safe inputs, auto-generated types, clear validation errors, composable schemas.
**Negative:** Additional dependency, schema definitions alongside tool code.

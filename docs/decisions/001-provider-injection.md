# ADR-001: Provider Dependency Injection

## Status
Accepted

## Date
2026-02-06

## Context
MCP tools need to call external services (LLMs, search APIs, weather APIs). We need a way to:
1. Run demos without API keys
2. Test without network calls
3. Swap providers without changing tool code

## Decision
Use interface-based dependency injection. All external services are abstracted behind TypeScript interfaces. A factory function creates mock or production providers based on config.

## Consequences
**Positive:** Zero-config demos, fast tests, easy to add new providers.
**Negative:** Extra indirection, need to maintain mock fidelity.

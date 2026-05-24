# Idempotency Gateway (Pay-Once Protocol)

## 1. Overview

This project implements an **Idempotency Gateway API** for a payment system.  
It ensures that a payment request is processed **exactly once**, even if the client retries multiple times due to network failures.

This prevents:
- Double charging
- Duplicate transactions
- Retry-based inconsistencies

---

## 2. Architecture Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Store

    Client->>API: POST /process-payment (Idempotency-Key)
    API->>Store: Check existing key

    alt Key does not exist
        API->>Store: Save request (processing)
        API->>API: Process payment (2s delay)
        API->>Store: Save final response (completed)
        API->>Client: Return response (201)
    end

    alt Key exists + same payload
        API->>Client: Return cached response (X-Cache-Hit: true)
    end

    alt Key exists + different payload
        API->>Client: Return 409 Conflict
    end
```

  ## 3. Setup Instructions

### Install dependencies
```bash
npm install

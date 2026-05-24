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
````````

    ## 3. Setup Instructions

    ### Install dependencies

    npm install

    ### Start Redis

    Start Redis

    ### Run server

    npm start

    ** http://localhost:3000**


    ## 4. API Documentation

    ### Endpoint

**POST /process-payment**

**Headers**
Content-Type: application/json
Idempotency-Key: unique-key-123
Request Body

{
  "amount": 100,
  "currency": "RWF"
}

** Responses**
✅ First Request (201)
{
  "message": "Charged 100 RWF"
}
♻️ Duplicate Request

Header:

X-Cache-Hit: true

Response:

{
  "message": "Charged 100 RWF"
}

❌ Conflict (409)

{
  "error": "Idempotency key already used for a different request body."
}

### 5. Design Decisions

**1. Idempotency-Key Strategy**

Used to uniquely identify payment requests and prevent duplicate processing.

#### 2. Payload Normalization

Request bodies are normalized before comparison to avoid mismatches caused by key order differences.

#### 3. Storage Layer

In-memory / Redis-compatible storage used to track request state:

processing
completed

#### 4. Conflict Handling

If the same key is reused with a different payload, the request is rejected with 409 Conflict.
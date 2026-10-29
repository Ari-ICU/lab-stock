# 📊 CSD LabStock: System Architecture & Workflow Diagrams

> **Visual flowcharts and entity relationships for the CSD LabStock Platform.**
> This directory contains native Draw.io XML files (`.drawio`) for local IDE editing, along with interactive GitHub-rendered Mermaid diagrams displayed below.

---

## 📑 Diagram Directory

| Diagram | Description | Native Editor File |
| :--- | :--- | :--- |
| 🤝 **Equipment Check-Out Workflow** | Concurrency-safe lending, barcode lookup, ACID row-level locking, and cache eviction | [`checkout-workflow.drawio`](./checkout-workflow.drawio) |
| 🔐 **Authentication & RBAC Security** | Rate limiting, Bcrypt password hashing, HS256 JWT tokens, and RBAC middleware | [`auth-workflow.drawio`](./auth-workflow.drawio) |
| 🔄 **Equipment Return & Inspection** | Check-in procedure, physical inspection checklist, defect routing, and status restoration | [`return-workflow.drawio`](./return-workflow.drawio) |
| 📦 **Atomic Stock Adjustment** | Non-negative inventory enforcement, single-query atomic updates, and low-stock alerts | [`stock-workflow.drawio`](./stock-workflow.drawio) |
| 🗄️ **Relational Database ERD** | Complete PostgreSQL database schema with primary and foreign key constraints | [`database-erd.drawio`](./database-erd.drawio) • [`schema.dbml`](./schema.dbml) |

---

## 1. 🤝 Concurrency-Safe Equipment Check-Out & Lending Workflow

```mermaid
flowchart TD
    Start(["🟢 START: Student or Faculty Requests Equipment"]) --> Scan["🔍 Identify Equipment<br/>Scan Barcode or QR with Camera<br/>or Search Serial or SKU"]
    Scan --> DecideAvail{"Is Equipment<br/>Available in Lab?"}
    
    DecideAvail -- No --> AlertLoaned["⚠️ Alert: Already On Loan<br/>Display Active Borrower Dossier<br/>and Scheduled Due Date"]
    AlertLoaned --> EndReject(["🔴 END: Check-Out Denied"])
    
    DecideAvail -- Yes --> FillForm["📝 Fill Check-Out Form<br/>Borrower Name, Student ID, Role,<br/>Course or Class, and Return Due Date"]
    FillForm --> DispatchAPI["📡 Client Dispatches Request<br/>POST /api/v1/loans/checkout"]
    DispatchAPI --> GuardAuth{"Valid JWT and<br/>loan:checkout Permission?"}
    
    GuardAuth -- No --> AuthErr["⛔ 401 or 403 Forbidden<br/>Unauthorized Session"]
    GuardAuth -- Yes --> DBTx["🔒 PostgreSQL Transaction BEGIN<br/>SELECT * FROM assets WHERE id = $1 FOR UPDATE<br/>Pessimistic Row-Level Lock"]
    
    DBTx --> RaceCheck{"Status<br/>Still Available?"}
    RaceCheck -- Conflict --> Rollback["⏪ ROLLBACK Transaction<br/>409 Conflict: Double-booking avoided"]
    
    RaceCheck -- Verified --> Commit["💾 INSERT INTO loans<br/>UPDATE assets SET loan_status = 'on_loan'<br/>COMMIT Transaction"]
    
    Commit --> EvictCache["⚡ In-Memory Cache Invalidation<br/>Evict keys matching loans and assets"]
    EvictCache --> UIUpdate["📱 Client UI Update<br/>201 Created and Toast Alert<br/>Auto-redirect to /loans/id Dossier"]
    UIUpdate --> Success(["🟢 SUCCESS: Equipment Issued and In Custody"])

    classDef green fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46;
    classDef amber fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#92400e;
    classDef red fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#991b1b;
    classDef blue fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    classDef purple fill:#f5f3ff,stroke:#8b5cf6,stroke-width:2px,color:#5b21b6;
    
    class Start,Success green;
    class DecideAvail,GuardAuth,RaceCheck amber;
    class AlertLoaned,EndReject,AuthErr,Rollback red;
    class Scan,FillForm,DispatchAPI,UIUpdate blue;
    class DBTx,Commit,EvictCache purple;
```

---

## 2. 🔐 Authentication, JWT & RBAC Security Workflow

```mermaid
flowchart TD
    ClientReq(["🌐 Client Request: POST /api/v1/auth/login"]) --> RateLimit{"IP Under Rate Limit?<br/>10 attempts per 15 min"}
    RateLimit -- Exceeded --> BlockIP["⛔ 429 Too Many Requests<br/>Brute-Force Lockout"]
    
    RateLimit -- Allowed --> LookupUser["🔍 PostgreSQL Query<br/>SELECT * FROM users WHERE email = $1"]
    LookupUser --> UserExists{"User Found and<br/>Status == 'active'?"}
    UserExists -- No --> ErrCreds["❌ 401 Unauthorized<br/>Invalid Credentials"]
    
    UserExists -- Yes --> CheckPwd["🔐 Bcrypt Password Verification<br/>bcrypt.compare with Salted Hash"]
    CheckPwd --> PwdMatch{"Password Matches?"}
    PwdMatch -- No --> ErrCreds
    
    PwdMatch -- Yes --> SignJWT["🔑 Generate HS256 JWT Token<br/>Payload: id, email, role, permissions<br/>Expires In: 24 Hours"]
    SignJWT --> AuditLogin["📝 Write Audit Log: user:login"]
    AuditLogin --> ReturnToken["📦 Return 200 OK + JWT Token + User Profile"]
    
    ReturnToken --> APIReq(["📡 Next API Request: Bearer Token in Header"])
    APIReq --> VerifyJWT{"Valid Signature and<br/>Not Expired?"}
    VerifyJWT -- Invalid --> Err401["⛔ 401 Unauthorized"]
    
    VerifyJWT -- Valid --> CheckRole{"Has Required<br/>Permission Flag?"}
    CheckRole -- Missing --> Err403["⛔ 403 Forbidden: Insufficient Privileges"]
    CheckRole -- Authorized --> ExecRoute(["🟢 Route Handler Executes"])

    classDef green fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46;
    classDef amber fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#92400e;
    classDef red fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#991b1b;
    classDef blue fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    
    class ClientReq,ExecRoute green;
    class RateLimit,UserExists,PwdMatch,VerifyJWT,CheckRole amber;
    class BlockIP,ErrCreds,Err401,Err403 red;
    class LookupUser,CheckPwd,SignJWT,AuditLogin,ReturnToken,APIReq blue;
```

---

## 3. 🔄 Equipment Check-In & Physical Return Inspection

```mermaid
flowchart TD
    StartReturn(["🟢 START: Borrower Returns Equipment to Lab"]) --> IdentifyLoan["🔍 Lookup Active Loan Record<br/>Scan Barcode on Device or Enter Loan ID"]
    IdentifyLoan --> InspectHW["🔬 Physical Condition Inspection<br/>Check Power Cable, Display, Ports, Accessories"]
    
    InspectHW --> ConditionDecision{"Equipment Condition<br/>Satisfactory?"}
    
    ConditionDecision -- Damaged or Faulty --> LogDefect["⚠️ Flag for Maintenance<br/>Select Defect Preset: RMA or Repair Needed<br/>Schedule Service in /maintenance"]
    LogDefect --> CloseLoanMaint["💾 Database Transaction<br/>UPDATE loans SET status = 'returned'<br/>UPDATE assets SET status = 'maintenance', loan_status = 'available'<br/>COMMIT"]
    
    ConditionDecision -- Operational --> CloseLoanGood["💾 Database Transaction<br/>UPDATE loans SET status = 'returned', actual_return_date = NOW()<br/>UPDATE assets SET loan_status = 'available', current_borrower = NULL<br/>COMMIT"]
    
    CloseLoanMaint --> EvictReturnCache["⚡ Cache Eviction: loans and assets"]
    CloseLoanGood --> EvictReturnCache
    
    EvictReturnCache --> ReturnSuccess(["🟢 SUCCESS: Custody Closed and Stock Restored to Room"])

    classDef green fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46;
    classDef amber fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#92400e;
    classDef red fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#991b1b;
    classDef blue fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    
    class StartReturn,ReturnSuccess green;
    class ConditionDecision amber;
    class LogDefect red;
    class IdentifyLoan,InspectHW,CloseLoanGood,CloseLoanMaint,EvictReturnCache blue;
```

---

## 4. 📦 Atomic Consumables Stock Adjustment

```mermaid
flowchart TD
    StartStock(["🟢 Inventory Adjustment Request: PATCH /api/v1/stock/id/adjust"]) --> ValidatePayload{"Valid delta quantity?<br/>Example: +5 or -2"}
    ValidatePayload -- Invalid --> ErrBadPayload["❌ 400 Bad Request"]
    
    ValidatePayload -- Valid --> CheckAuth{"Has stock:update<br/>Permission?"}
    CheckAuth -- No --> ErrStockAuth["⛔ 403 Forbidden"]
    
    CheckAuth -- Yes --> AtomicQuery["🔒 PostgreSQL Atomic UPDATE<br/>UPDATE stock_items<br/>SET quantity = quantity + $delta<br/>WHERE id = $id AND (quantity + $delta) >= 0<br/>RETURNING quantity, min_threshold"]
    
    AtomicQuery --> ResultCheck{"Rows Affected == 1?"}
    ResultCheck -- 0 Rows --> ErrNegative["⚠️ 400 Conflict: Insufficient Stock<br/>Prevents negative consumable balance"]
    
    ResultCheck -- 1 Row --> StatusUpdate["🔄 Dynamic Status Evaluation<br/>qty is 0: out of stock<br/>qty below threshold: low stock<br/>qty above threshold: in stock"]
    
    StatusUpdate --> EvictStockCache["⚡ Invalidate Cache: stock prefix"]
    EvictStockCache --> ReturnUpdated["📦 Return 200 OK with New Balance and Computed Status"]
    ReturnUpdated --> EndStock(["🟢 Stock Updated and Synced Across All Clients"])

    classDef green fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46;
    classDef amber fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#92400e;
    classDef red fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#991b1b;
    classDef blue fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af;
    
    class StartStock,EndStock green;
    class ValidatePayload,CheckAuth,ResultCheck amber;
    class ErrBadPayload,ErrStockAuth,ErrNegative red;
    class AtomicQuery,StatusUpdate,EvictStockCache,ReturnUpdated blue;
```

---

## 5. 🗄️ Relational Database Schema (ERD)

```mermaid
erDiagram
    LOCATIONS ||--o{ ASSETS : hosts
    LOCATIONS ||--o{ STOCK_ITEMS : stores
    ASSETS ||--o{ LOANS : "checked out via"
    ASSETS ||--o{ TRANSFERS : "relocated via"
    ASSETS ||--o{ MAINTENANCE_LOGS : "serviced via"
    USERS ||--o{ LOANS : "authorizes"
    USERS ||--o{ AUDIT_LOGS : "performs"

    LOCATIONS {
        uuid id PK
        varchar code UK
        varchar name
        varchar building
        varchar room
        varchar subnet
        int capacity
    }

    ASSETS {
        uuid id PK
        varchar serial_number UK
        varchar name
        varchar model
        uuid location_id FK
        varchar placement_rack
        varchar status
        varchar loan_status
        varchar current_borrower
        date loan_due_date
    }

    STOCK_ITEMS {
        uuid id PK
        varchar code UK
        varchar name
        varchar category
        int quantity
        int min_threshold
        varchar status
        uuid location_id FK
    }

    LOANS {
        uuid id PK
        uuid asset_id FK
        varchar borrower_name
        varchar borrower_role
        varchar borrower_contact
        varchar course_or_class
        date borrow_date
        date expected_return_date
        date actual_return_date
        varchar status
    }

    MAINTENANCE_LOGS {
        uuid id PK
        uuid asset_id FK
        varchar type
        date scheduled_date
        varchar technician
        varchar status
        text notes
    }
```

---

## 🛠️ Editing Diagrams

1. **In VS Code / Antigravity**: Open any `.drawio` file directly with the **Draw.io Integration** extension.
2. **In Browser**: Navigate to **[app.diagrams.net](https://app.diagrams.net)** and drag-and-drop any `.drawio` file into the canvas.
3. **Database DBML**: Open [`schema.dbml`](./schema.dbml) in **[dbdiagram.io](https://dbdiagram.io)** for interactive relational inspection.

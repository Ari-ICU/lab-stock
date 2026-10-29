# 🔬 CSD LabStock: Enterprise Faculty Laboratory & Inventory Management System

> **A high-performance, concurrency-safe, full-stack platform for University & Enterprise Computer Science Laboratory Assets, Consumable Inventory, and Student Equipment Lending.**

[![Node.js Version](https://img.shields.io/badge/Node.js-24.x%20LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js Version](https://img.shields.io/badge/Next.js-16.x%20App%20Router-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📑 Table of Contents

- [1. Executive Summary & Proposal Overview](#1-executive-summary--proposal-overview)
- [2. Problem Statement & Motivation](#2-problem-statement--motivation)
- [3. Proposed Solution & Key Objectives](#3-proposed-solution--key-objectives)
- [4. System Architecture](#4-system-architecture)
- [5. Core Modules & Functionality](#5-core-modules--functionality)
- [6. Visual Workflow Flowcharts (Draw.io)](#6-visual-workflow-flowcharts-drawio)
- [7. Security & Concurrency Engineering](#7-security--concurrency-engineering)
- [8. Database Schema & Data Dictionary](#8-database-schema--data-dictionary)
- [9. API Reference & Swagger Documentation](#9-api-reference--swagger-documentation)
- [10. Installation & Deployment Guide](#10-installation--deployment-guide)
- [11. Project Proposal Presentation Highlights](#11-project-proposal-presentation-highlights)

---

## 1. Executive Summary & Proposal Overview

Academic computer science departments and engineering research laboratories manage thousands of high-value hardware assets (servers, enterprise Cisco switches, routers, workstations, optical microscopes) alongside fast-moving consumable inventory (cables, monitors, adapters, microcontrollers). 

**CSD LabStock** is a modern, enterprise-grade laboratory operations platform engineered to digitize, secure, and streamline laboratory resource management. Built using **Next.js 16**, **Node.js 24**, and **PostgreSQL**, the system provides real-time multi-user concurrency control, camera barcode scanning, role-based access control (RBAC), and automated audit reporting.

```
                      ┌─────────────────────────────────────────┐
                      │          Next.js 16 Client UI           │
                      │ (App Router, Tailwind v4, Lucide Icons) │
                      └────────────────────┬────────────────────┘
                                           │ HTTPS / REST API / ETags
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │         Express Backend Gateway         │
                      │ (Helmet, CORS, Rate Limit, In-Mem Cache)│
                      └────────────────────┬────────────────────┘
                                           │ Layered Architecture
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │           PostgreSQL Database           │
                      │  (ACID Transactions, Row Locks, Pools) │
                      └─────────────────────────────────────────┘
```

---

## 2. Problem Statement & Motivation

Traditional university laboratories suffer from recurring operational bottlenecks:

| Pain Point | Impact on Faculty & Students | How LabStock Solves It |
| :--- | :--- | :--- |
| **Manual Paper & Excel Logs** | Lost equipment, illegible signatures, and uncoordinated records across lab rooms. | Centralized database with instant barcode lookup and audit trails. |
| **Race Conditions & Double-Booking** | Two students borrow the same remaining laptop or router simultaneously. | **Pessimistic Row-Level Locking (`FOR UPDATE`)** in atomic database transactions. |
| **Untracked Custody & Overdue Loans** | Devices borrowed for weekend capstones are never returned on time. | Real-time overdue warning engine with borrower profile dossiers. |
| **Slow Multi-User Performance** | System crawls when dozens of lab students access the catalog during class. | **Sub-millisecond In-Memory Caching** with instant write-invalidation. |
| **Room Relocation Chaos** | Hardware moved for workshops without documentation, causing lost inventory. | Physical room relocation logs tracking operator identity and transfer rationale. |

---

## 3. Proposed Solution & Key Objectives

1. **Precision Fleet Oversight:** Map every connected laboratory room (building, room number, IP subnet) to its active device fleets and consumable stock.
2. **Concurrency-Safe Lending:** Implement cryptographic ACID transactions guaranteeing that simultaneous check-out requests cannot cause negative inventory or double-booking.
3. **Sub-Millisecond Read Latency:** Cache catalog reads in high-speed RAM with automatic tag-based eviction upon write/update operations.
4. **Comprehensive Audit Compliance:** Provide 1-click formatted CSV/Excel exports for faculty administration and accreditation reviews.
5. **Zero-Friction Mobile & Desktop UI:** Provide responsive, accessible dashboards with 1-click serial number copying and camera-based QR/barcode scanning.

---

## 4. System Architecture

The platform follows a strict **Layered Clean Architecture**:

```
client/ (Next.js 16 Frontend)
 ├── src/app/
 │    ├── locations/       # Laboratory facilities & room fleet pages
 │    │    └── [id]/       # Dedicated lab room inventory dossier
 │    ├── assets/          # Hardware equipment management
 │    │    └── [id]/       # Equipment specifications & maintenance
 │    ├── stock/           # Consumables, peripherals & stationery
 │    │    └── [id]/       # Stock levels & atomic adjustment
 │    ├── loans/           # Device check-outs & room relocations
 │    │    └── [id]/       # Dedicated individual loan dossiers
 │    └── settings/        # Faculty user preferences & system settings
 ├── src/components/       # Reusable UI widgets, Modals, DatePickers
 └── src/context/          # Global state management & toast notifications

server/ (Node.js 24 Express Backend)
 ├── src/routes/           # Route definitions with RBAC permissions
 ├── src/controllers/      # HTTP request handling & async wrappers
 ├── src/validations/      # Express-validator DTO validation rules
 ├── src/services/         # Core business logic & database transactions
 ├── src/models/           # Parameterized PostgreSQL data queries
 ├── src/utils/            # JWT auth, Bcrypt passwords, Cache service
 ├── src/middleware/       # Auth guards, security headers, rate limiting
 └── src/config/           # Database pool tuning, Swagger OpenAPI specs
```

---

## 5. Core Modules & Functionality

### 1. 🏢 Laboratory Facility & Room Management
* Interactive map of connected engineering classrooms (e.g. *Computer & Network Lab 102B*, *Software Engineering Lab 204A*).
* Real-time telemetry: Subnet tracking (`192.168.102.0/24`), device counts, and operational health status.
* Combined room fleet view: displays both stationary hardware and consumable peripherals in one view.

### 2. 💻 Hardware Asset Management
* Tracks serial numbers, manufacturer models, placement racks, and warranty calibration dates.
* Status tracking: `Operational`, `In Use`, or `Maintenance`.
* Visual barcode identifier generator with live webcam scanner integration.

### 3. 📦 Consumables & Peripheral Inventory
* Manages cables, monitors, keyboards, lab kits, and IC components.
* Configurable low-stock thresholds with automatic status computation (`in_stock`, `low_stock`, `out_of_stock`).
* **Atomic Quantity Adjustments:** `PATCH /api/v1/stock/:id/adjust` allows instantaneous increment/decrement without race conditions.

### 4. 🤝 Equipment Lending & Custody Check-Out
* Check-out equipment to students, lecturers, lab assistants, or technicians.
* Custody duration tracking with due date calendars and relative overdue countdowns.
* **Dedicated Loan Dossiers (`/loans/[id]`):** Comprehensive view of borrower identity, student ID, course/project, condition notes, and 1-click check-in.
* Check-in condition inspection presets:
  - `✓ Tested & Fully Functional`
  - `✓ Power Adapter & Cables Returned`
  - `⚠ Minor Surface Wear`
  - `⚠ Requires Software Reset`

### 5. 🔄 Physical Room Relocations (Transfers)
* Log hardware relocations across lab rooms with authorized operator tracking and workshop reason presets.

---

## 6. Visual Workflow Flowcharts (Draw.io & GitHub Native)

The project includes 4 complete, presentation-ready **workflow flowcharts** located in the [`docs/diagrams/`](docs/diagrams) directory. You can open and edit them inside VS Code with the **Draw.io Integration** extension, or inspect the interactive GitHub-rendered flowcharts below:

| Flowchart Diagram | Focus Area & Decision Logic | Editor Source File |
| :--- | :--- | :--- |
| 🤝 **Equipment Check-Out** | Barcode scan, availability validation, PostgreSQL `SELECT ... FOR UPDATE` row lock, race condition prevention, and cache eviction | [`checkout-workflow.drawio`](docs/diagrams/checkout-workflow.drawio) |
| 🔐 **Authentication & RBAC** | Rate limiting, Bcrypt password compare, HS256 JWT signing, and route permission middleware guards | [`auth-workflow.drawio`](docs/diagrams/auth-workflow.drawio) |
| 🔄 **Equipment Check-In & Return** | Active loan lookup, physical condition inspection checklist, damage service flagging, and status restoration | [`return-workflow.drawio`](docs/diagrams/return-workflow.drawio) |
| 📦 **Consumables Stock Adjustment** | Atomic decrement (`WHERE quantity >= 0`), non-negative inventory enforcement, and low-stock threshold triggers | [`stock-workflow.drawio`](docs/diagrams/stock-workflow.drawio) |

### 🤝 Equipment Check-Out & Lending Workflow

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

### 🔐 Authentication, JWT & RBAC Security Workflow

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

## 7. Security & Concurrency Engineering

### Enterprise Concurrency Protection
To prevent double-booking when multiple students attempt to check out the same device simultaneously, the system employs **Pessimistic Row-Level Locking** within atomic PostgreSQL transactions:

```sql
-- Prevents race conditions during check-out
BEGIN;
SELECT id, name, serial_number, loan_status 
FROM assets 
WHERE id = $1 
FOR UPDATE;

-- Validates status and commits atomically
INSERT INTO loans (...) VALUES (...);
UPDATE assets SET loan_status = 'on_loan', current_borrower = $2 WHERE id = $1;
COMMIT;
```

### High-Performance Caching Layer (`server/src/utils/cache.ts`)
* **Sub-Millisecond Reads:** Serves catalog and location queries from RAM in **< 0.5ms**.
* **Zero Stale Data:** Any mutation (`POST`, `PUT`, `DELETE`, `CHECKOUT`, `CHECKIN`) immediately triggers prefix-based cache invalidation (`stock:*`, `asset:*`, `loan:*`), ensuring other users instantly see updated counts.

### Security Defenses
* **Authentication:** Stateless HS256 JSON Web Tokens (JWT) signed with 24-hour expiration.
* **Password Hashing:** Bcrypt with 12 salt rounds and constant-time string comparison.
* **Perimeter Defense:** Helmet HTTP security headers, strict CORS, prototype pollution sanitization, and IP rate limiting (300 req / 15 min globally; 10 req / 15 min for auth).

---

## 7. Database Schema & Data Dictionary

The PostgreSQL database enforces relational integrity via UUID primary keys and foreign key constraints:

```mermaid
erDiagram
    LOCATIONS ||--o{ ASSETS : hosts
    LOCATIONS ||--o{ STOCK_ITEMS : stores
    ASSETS ||--o{ LOANS : "checked out via"
    ASSETS ||--o{ TRANSFERS : "relocated via"
    USERS ||--o{ AUDIT_LOGS : performs

    LOCATIONS {
        uuid id PK
        varchar code UK
        varchar name
        varchar building
        varchar room
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
        text notes
    }

    TRANSFERS {
        uuid id PK
        uuid asset_id FK
        uuid from_location_id FK
        uuid to_location_id FK
        date transfer_date
        varchar transferred_by
        text reason
    }
```

---

## 8. API Reference & Swagger Documentation

Interactive OpenAPI 3.0 documentation is available at **`http://localhost:5001/api/docs`**.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & receive JWT token | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/v1/locations` | List all connected laboratory rooms | `location:read` |
| `GET` | `/api/v1/assets` | Filterable equipment fleet list | `asset:read` |
| `POST` | `/api/v1/assets` | Register new hardware device | `asset:create` |
| `GET` | `/api/v1/stock` | Query inventory catalog & stock levels | `stock:read` |
| `PATCH`| `/api/v1/stock/:id/adjust` | Concurrency-safe quantity change (`+` / `-`) | `stock:update` |
| `GET` | `/api/v1/loans` | List active, overdue, and returned loans | `loan:read` |
| `POST` | `/api/v1/loans/checkout` | Check out equipment with row-level lock | `loan:checkout` |
| `POST` | `/api/v1/loans/:id/return` | Check in returned equipment with notes | `loan:return` |

---

## 9. Installation & Deployment Guide

### Prerequisites
- **Node.js**: v20+ (v24 LTS recommended)
- **PostgreSQL**: v15+ installed and running
- **Package Manager**: `npm`

### 1. Database Setup
Ensure PostgreSQL is active. The backend will automatically create the `lab_stock` database on initial boot if missing.
```bash
# Default connection string (customizable in server/.env)
postgresql://postgres:postgres@localhost:5432/lab_stock
```

### 2. Backend Setup (`server`)
```bash
cd server
npm install
npm run build
npm start
# Server listens on http://localhost:5001
# Swagger docs available at http://localhost:5001/api/docs
```

### 3. Frontend Setup (`client`)
```bash
cd client
npm install
npm run dev
# Web application live on http://localhost:3000
```

---

## 10. Project Proposal Presentation Highlights

*When presenting this project for an academic defense, stakeholder demo, or funding proposal, highlight these differentiators:*

1. **Enterprise-Grade Concurrency Protection:** Unlike basic CRUD apps that crash or oversell when two users act simultaneously, LabStock uses database-level ACID transactions and row locking.
2. **Stateless Scalability:** Built with cryptographic JWT tokens, allowing zero-downtime load balancing across multiple worker processes (PM2 cluster mode) or containers.
3. **Sub-Millisecond Read Performance:** Combines in-memory LRU caching with instant mutation invalidation, preventing database contention.
4. **Complete Audit Trail:** Tracks borrower identity, student ID numbers, course codes, inspection conditions, and equipment movement histories.
5. **Modern, Accessible UI:** Developed with Next.js 16 and Tailwind CSS v4, featuring unified headers, 1-click clipboard actions, and dedicated dossiers for every asset, stock item, and loan record.

---

## 📄 License
This project is licensed under the MIT License — open for academic and faculty operational use.


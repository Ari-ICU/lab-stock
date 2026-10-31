-- ==========================================================
-- Lab Stock Management System - PostgreSQL Database Schema
-- Compatible with PostgreSQL 13+
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(80) NOT NULL DEFAULT 'Faculty Lecturer',
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    department VARCHAR(150),
    assigned_labs TEXT[] DEFAULT ARRAY['all']::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent column addition for existing deployments
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_labs TEXT[] DEFAULT ARRAY['all']::TEXT[];

-- 2. LAB LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    room VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 30,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE locations ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. INVENTORY & STOCK (Stationery, Printer Ink, Hardware Tools, Consumables)
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Office Stationery', 'Printer Ink & Toner', 'Tools & Equipment', etc.
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'Units',
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    rack VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'in_stock', -- 'in_stock', 'low_stock', 'out_of_stock'
    min_threshold INT DEFAULT 10,
    expiry_date VARCHAR(80),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HARDWARE ASSETS (PCs, Cisco Switches, Routers, ACs, Projectors)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(150) NOT NULL,
    total_units INT DEFAULT 1,
    unit_type VARCHAR(50) DEFAULT 'Units',
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    placement_rack VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'operational', -- 'operational', 'in_use', 'maintenance'
    loan_status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'on_loan'
    current_borrower VARCHAR(150),
    loan_due_date DATE,
    next_calibration VARCHAR(80),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. DEVICE LOANS & CHECK-OUTS
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    borrower_name VARCHAR(150) NOT NULL,
    borrower_role VARCHAR(80) NOT NULL DEFAULT 'Student',
    borrower_contact VARCHAR(100),
    course_or_class VARCHAR(150),
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'returned', 'overdue'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ASSET RELOCATIONS & MOVEMENTS
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transferred_by VARCHAR(150) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. MAINTENANCE & AUDIT LOGS
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    asset_name VARCHAR(200) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    technician VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PURCHASE & PROCUREMENT REQUISITIONS
CREATE TABLE IF NOT EXISTS purchase_requests (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    target_room VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'Units',
    estimated_cost VARCHAR(50),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    requested_by VARCHAR(150) NOT NULL,
    requester_role VARCHAR(100) NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ROOM FACILITY & CONDITION INVENTORY (Location-Centric Bulk Furniture & Equipment)
CREATE TABLE IF NOT EXISTS room_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    group_type VARCHAR(50) NOT NULL, -- 'FURNITURE', 'ELECTRICAL', 'IT_HARDWARE', 'SAFETY_MISC'
    brand_spec VARCHAR(150),
    unit VARCHAR(50) DEFAULT 'pcs',
    qty_working INT DEFAULT 0,
    qty_broken INT DEFAULT 0,
    qty_maintenance INT DEFAULT 0,
    remarks TEXT,
    last_audited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE room_inventory ADD COLUMN IF NOT EXISTS stock_item_id UUID REFERENCES stock_items(id) ON DELETE SET NULL;
ALTER TABLE room_inventory ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;

-- Location enhancements for room matrix & auditing
ALTER TABLE locations ADD COLUMN IF NOT EXISTS floor INT DEFAULT 1;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT 'COMPUTER_LAB';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_audited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS audited_by VARCHAR(150);

ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS image_url TEXT;

-- INDEXES for Query Performance
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_items_status ON stock_items(status);
CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);


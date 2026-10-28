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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. LAB LOCATIONS
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    room VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- INDEXES for Query Performance
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_items_status ON stock_items(status);
CREATE INDEX IF NOT EXISTS idx_assets_serial ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);


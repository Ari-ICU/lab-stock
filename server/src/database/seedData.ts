import { query } from '../config/database.js';

export const seedLocations = [
  {
    code: 'LOC-102B',
    name: 'Computer & Network Lab 102B',
    building: 'Engineering Block A',
    room: 'Room 102B',
    floor: 1,
    room_type: 'COMPUTER_LAB',
    capacity: 40,
    last_audited_at: '2026-10-28',
    audited_by: 'Dr. Heng Sovannarith',
  },
  {
    code: 'LOC-206',
    name: 'Network & Server Lab 206',
    building: 'Engineering Block A',
    room: 'Room 206',
    floor: 2,
    room_type: 'COMPUTER_LAB',
    capacity: 32,
    last_audited_at: '2026-10-29',
    audited_by: 'John Doe',
  },
  {
    code: 'LOC-201',
    name: 'Software Engineering & AI Lab 201',
    building: 'Engineering Block A',
    room: 'Room 201',
    floor: 2,
    room_type: 'COMPUTER_LAB',
    capacity: 40,
    last_audited_at: '2026-10-25',
    audited_by: 'Thoeurn Ratha',
  },
  {
    code: 'LOC-203',
    name: 'Electronics & Embedded IoT Lab 203',
    building: 'Engineering Block A',
    room: 'Room 203',
    floor: 2,
    room_type: 'COMPUTER_LAB',
    capacity: 30,
    last_audited_at: '2026-10-24',
    audited_by: 'Dr. Heng Sovannarith',
  },
  {
    code: 'LOC-305',
    name: 'Cybersecurity & Cloud Lab 305',
    building: 'Engineering Block B',
    room: 'Room 305',
    floor: 3,
    room_type: 'COMPUTER_LAB',
    capacity: 36,
    last_audited_at: '2026-10-27',
    audited_by: 'Thoeurn Ratha',
  },
  {
    code: 'LOC-102',
    name: 'Hardware Staging & Maintenance Depot',
    building: 'Basement Facility',
    room: 'Room 102',
    floor: 0,
    room_type: 'STORAGE',
    capacity: 12,
    last_audited_at: '2026-10-30',
    audited_by: 'Dr. Heng Sovannarith',
  },
];

/**
 * Serialized Hardware Assets (PCs, Projectors, Switches, Firewalls, Access Points, Lab Instruments)
 * Strictly distinct from Central Inventory (`seedStock`) and Room Facility Inventory (`seedRoomInventory`).
 */
export const seedAssets = [
  // Room 102B
  {
    serial_number: 'OPT-102B-01-TO-24',
    name: 'Dell OptiPlex 7090 Workstations (Lab 102B)',
    model: 'Dell OptiPlex 7090 Core i7 / 16GB / 512GB SSD',
    total_units: 40,
    unit_type: 'Workstations',
    room: 'Room 102B',
    placement_rack: 'Computer Lab Room 102B (Student Benches 1-20)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Fleet of 40 student workstations deployed across laboratory benches in Room 102B.',
  },
  {
    serial_number: 'EPS-L630U-8812',
    name: 'Epson EB-2250U Laser Projector & Screen (Lab 102B)',
    model: 'Epson EB-2250U 5000 Lumens Full HD + 120" Screen',
    total_units: 1,
    unit_type: 'Projector',
    room: 'Room 102B',
    placement_rack: 'Computer Lab Room 102B (Ceiling Center Mount)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    description: 'High-lumen ceiling projector with motorized 120-inch screen dedicated to Room 102B lectures.',
  },
  {
    serial_number: 'SW-CORE-3850-X1',
    name: 'Cisco Catalyst 3850 48-Port Gigabit PoE+ Switch',
    model: 'WS-C3850-48P-L Stackable Layer 3 Switch',
    total_units: 1,
    unit_type: 'Switch',
    room: 'Room 102B',
    placement_rack: 'Room 102B - MDF Core Server Rack 42U (U22-U23)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'Core distribution switch connecting all student workstations and patch panels.',
  },
  {
    serial_number: 'AP-WIFI6-102B-01',
    name: 'Cisco Catalyst 9120AX Series Wi-Fi 6 Access Point',
    model: 'C9120AXI-B Dual-Band 802.11ax Ceiling AP',
    total_units: 1,
    unit_type: 'Access Point',
    room: 'Room 102B',
    placement_rack: 'Room 102B - Ceiling Center Grid',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'Provides high-density 802.11ax wireless connectivity across Lab 102B.',
  },

  // Room 201
  {
    serial_number: 'PREC-201-AI-01-12',
    name: 'Dell Precision 3660 GPU Workstations (Lab 201)',
    model: 'Core i9-13900K / RTX 4080 / 64GB RAM / 2TB NVMe',
    total_units: 12,
    unit_type: 'Workstations',
    room: 'Room 201',
    placement_rack: 'Software Engineering & AI Lab Room 201 (Row A-B)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'AI & Machine Learning student workstations equipped with dedicated RTX GPUs.',
  },
  {
    serial_number: 'HP-ELITE-201-01-28',
    name: 'HP EliteDesk 800 G6 Student PCs (Lab 201)',
    model: 'HP EliteDesk 800 G6 Core i7 / RTX 3060 / 16GB RAM',
    total_units: 28,
    unit_type: 'Workstations',
    room: 'Room 201',
    placement_rack: 'Software Engineering & AI Lab Room 201 (Row C-D)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Software engineering student workstations supporting containerization and coursework labs.',
  },
  {
    serial_number: 'SNY-PHZ60-201',
    name: 'Sony VPL-PHZ60 6000-Lumen Laser Projector (Lab 201)',
    model: '3LCD Laser WUXGA Installation Projector',
    total_units: 1,
    unit_type: 'Projector',
    room: 'Room 201',
    placement_rack: 'Software Engineering & AI Lab Room 201',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    description: 'Installation projector for AI Lab lectures and research presentations.',
  },
  {
    serial_number: 'FCM2016L38X',
    name: 'Cisco Catalyst 3850 24-Port PoE+ IP Base Switch',
    model: 'WS-C3850-24P-S Multi-Layer Switch',
    total_units: 1,
    unit_type: 'Switch',
    room: 'Room 201',
    placement_rack: 'Software Engineering & AI Lab Room 201',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'High-speed gigabit switch serving development pod network ports.',
  },

  // Room 206
  {
    serial_number: 'OPT-206-NET-01-32',
    name: 'Dell OptiPlex 7090 Dual-NIC Workstations (Lab 206)',
    model: 'Dell OptiPlex 7090 Core i7 / 32GB RAM / Dual GbE NIC',
    total_units: 32,
    unit_type: 'Workstations',
    room: 'Room 206',
    placement_rack: 'Network & Server Lab Room 206 (Stations 1-32)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Dual-NIC networking workstations configured for virtualized routing and packet capture labs.',
  },
  {
    serial_number: 'FOC2341S5K2',
    name: 'Cisco Nexus 93180YC-FX3 100G Leaf Switch',
    model: 'N9K-C93180YC-FX3 48x25G / 6x100G QSFP28',
    total_units: 1,
    unit_type: 'Switch',
    room: 'Room 206',
    placement_rack: 'Network & Server Lab Room 206 - Rack 01',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    description: 'Data center leaf switch serving virtual server test environments.',
  },

  // Room 203
  {
    serial_number: 'RGL-DS1054Z-203',
    name: 'Rigol DS1054Z 4-Channel Digital Oscilloscopes (Lab 203)',
    model: 'DS1054Z 50MHz 1GSa/s 4-Channel Bench Scope',
    total_units: 6,
    unit_type: 'Oscilloscopes',
    room: 'Room 203',
    placement_rack: 'Electronics & Embedded IoT Lab Room 203 (Benches 1-6)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Four-channel digital storage oscilloscopes for embedded systems signal analysis.',
  },

  // Room 305
  {
    serial_number: 'LNV-M70S-305-01-36',
    name: 'Lenovo ThinkCentre M70s Security Workstations (Lab 305)',
    model: 'Lenovo ThinkCentre M70s Core i7 / 16GB / 512GB NVMe',
    total_units: 36,
    unit_type: 'Workstations',
    room: 'Room 305',
    placement_rack: 'Cybersecurity & Cloud Lab Room 305 (Benches 1-18)',
    status: 'in_use',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Hardened lab workstations isolating VM sandboxes for cybersecurity and cloud coursework.',
  },
  {
    serial_number: 'BNQ-MH560-305',
    name: 'BenQ MH560 Full HD DLP Projector (Lab 305)',
    model: 'BenQ MH560 3800lm 1080p DLP Projector',
    total_units: 1,
    unit_type: 'Projector',
    room: 'Room 305',
    placement_rack: 'Cybersecurity Lab Room 305 (Ceiling Mount)',
    status: 'maintenance',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    description: 'Scheduled for replacement projector lamp assembly.',
  },
  {
    serial_number: 'USG-405-SEC-01',
    name: 'Fortinet FortiGate 100F Enterprise Firewall',
    model: 'FG-100F Dual 10GE SFP+ / 16x GE RJ45',
    total_units: 1,
    unit_type: 'Firewall',
    room: 'Room 305',
    placement_rack: 'Cybersecurity Lab Room 305 - Core Security Rack',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    description: 'Next-generation perimeter firewall configured for student ethical hacking tests.',
  },

  // Room 102 Staging Depot
  {
    serial_number: 'FLK-DSX8000-102',
    name: 'Fluke Networks DSX-8000 CableAnalyzer Certifier',
    model: 'DSX2-8000-PRO Cat 8 / Class I/II Field Tester',
    total_units: 1,
    unit_type: 'Tester',
    room: 'Room 102',
    placement_rack: 'Hardware Staging & Maintenance Depot (Secure Locker A1)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Portable copper & fiber certification instrument shared for inter-lab cabling audits.',
  },
];

/**
 * Central Depot Stock Inventory (Consumables, Cables, Optical Spares, Peripherals, Toner & Hand Tools).
 * Stationed exclusively in Room 102 (Staging & Supply Depot) with zero overlap with Hardware Assets or Room Inventory.
 */
export const seedStock = [
  {
    code: 'CBL-CAT6-BLU-1M',
    name: 'Cat6 UTP RJ45 Patch Cables 1-Meter (Blue)',
    category: 'Cables & Accessories',
    quantity: 150,
    unit: 'Pcs',
    room: 'Room 102',
    rack: 'Depot Rack S1 - Copper Cabling Bin',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: '100% pure copper Gigabit Ethernet patch cords held in central spares.',
  },
  {
    code: 'CBL-OM3-LC-3M',
    name: 'OM3 Multimode LC-LC Duplex Fiber Patch Cords (3m)',
    category: 'Cables & Accessories',
    quantity: 24,
    unit: 'Pcs',
    room: 'Room 102',
    rack: 'Depot Rack S1 - Fiber Tray',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    description: 'Aqua OM3 10Gb multimode duplex LC fiber patch cords for rack uplinks.',
  },
  {
    code: 'CBL-HDMI20-5M',
    name: 'Braided HDMI 2.0 High-Speed Display Cables (5m)',
    category: 'Cables & Accessories',
    quantity: 14,
    unit: 'Pcs',
    room: 'Room 102',
    rack: 'Depot Rack S2 - AV Spares Drawer',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: '4K60 replacement HDMI cables for lecturer podiums and classroom displays.',
  },
  {
    code: 'SFPP-10G-SR-CISCO',
    name: 'Cisco 10GBASE-SR SFP+ Optical Transceiver Modules',
    category: 'Network Modules',
    quantity: 16,
    unit: 'Units',
    room: 'Room 102',
    rack: 'Depot Rack S1 - Optical Module Tray',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    description: 'Multimode 850nm 10G pluggable optical spare modules for switch uplinks.',
  },
  {
    code: 'CON-RJ45-CAT6-100',
    name: 'Shielded RJ45 Cat6 Modular Crimp Plugs (100-Pack)',
    category: 'Network Spares',
    quantity: 8,
    unit: 'Packs',
    room: 'Room 102',
    rack: 'Depot Bin B4 - Termination Consumables',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'Gold-plated pass-through RJ45 connectors for networking lab cabling exercises.',
  },
  {
    code: 'PER-MS-DELL-116',
    name: 'Dell Optical USB Mice (MS116 Replacement Spares)',
    category: 'Mice & Keyboards',
    quantity: 18,
    unit: 'Pieces',
    room: 'Room 102',
    rack: 'Depot Shelf SHF-01',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    description: 'Unboxed spare Dell wired USB optical mice for faulty workstation replacements.',
  },
  {
    code: 'PER-KB-DELL-216',
    name: 'Dell Wired USB Keyboards (KB216 Replacement Spares)',
    category: 'Mice & Keyboards',
    quantity: 15,
    unit: 'Pieces',
    room: 'Room 102',
    rack: 'Depot Shelf SHF-01',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Spare wired USB keyboards with Khmer/English layout awaiting room issue.',
  },
  {
    code: 'PER-MON-P2419H',
    name: 'Dell 24" FHD IPS Replacement Monitors (P2419H Spares)',
    category: 'Monitors',
    quantity: 6,
    unit: 'Units',
    room: 'Room 102',
    rack: 'Depot Shelf SHF-02',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    description: 'Hot-swap 24-inch Full HD IPS spare monitors for student benches.',
  },
  {
    code: 'SUP-TONER-05A',
    name: 'HP LaserJet 05A (CE505A) Black Toner Cartridges',
    category: 'Printer Ink & Toner',
    quantity: 6,
    unit: 'Cartridges',
    room: 'Room 102',
    rack: 'Depot Cabinet C2 - Print Consumables',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
    description: 'High-yield laser toner cartridges for department examination printing.',
  },
  {
    code: 'SUP-MRK-4PK',
    name: 'Dry-Erase Whiteboard Marker Sets (4-Color Box)',
    category: 'Office Stationery',
    quantity: 24,
    unit: 'Boxes',
    room: 'Room 102',
    rack: 'Depot Cabinet C1 - Teaching Stationery',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
    description: 'Refillable dry-erase whiteboard marker packs issued to instructors across classrooms.',
  },
  {
    code: 'TOOL-IFIXIT-PRO',
    name: 'iFixit Pro Tech Electronics & PC Repair Tool Kits',
    category: 'Tools & Equipment',
    quantity: 3,
    unit: 'Kits',
    room: 'Room 102',
    rack: 'Depot Workbench T1',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Precision driver bit sets and ESD-safe prying tools for desktop & hardware repairs.',
  },
  {
    code: 'TOOL-CRIMP-NET',
    name: 'Klein Tools RJ45 Network Crimping & Continuity Kits',
    category: 'Tools & Equipment',
    quantity: 5,
    unit: 'Kits',
    room: 'Room 102',
    rack: 'Depot Workbench T2',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Modular RJ45 crimpers, punch-down tools, and wiremap testers for lab cable prep.',
  },
];

export const seedLoans = [
  {
    serial_number: 'SW-CORE-3850-X1',
    borrower_name: 'Sokha Chan',
    borrower_role: 'Student',
    borrower_contact: 'sokha.chan@student.edu (Tel: 012 345 678)',
    course_or_class: 'Advanced Network Routing Capstone (Class CS-Y4)',
    borrow_date: '2026-10-26',
    expected_return_date: '2026-11-05',
    status: 'active',
    notes: 'Checked out for weekend branch-office VPN and OSPF routing topology simulation project.',
  },
  {
    serial_number: 'EPS-L630U-8812',
    borrower_name: 'Dr. Heng Sovannarith',
    borrower_role: 'Lecturer',
    borrower_contact: 'heng.sovannarith@rupp.edu.kh',
    course_or_class: 'Departmental Research Symposium (Room 201)',
    borrow_date: '2026-10-20',
    expected_return_date: '2026-10-21',
    actual_return_date: '2026-10-21',
    status: 'returned',
    notes: 'Used for annual engineering symposium keynote and returned in pristine condition.',
  },
];

export const seedTransfers = [
  {
    serial_number: 'SW-CORE-3850-X1',
    from_room: 'Room 102',
    to_room: 'Room 102B',
    transfer_date: '2026-10-22',
    transferred_by: 'Thoeurn Ratha',
    reason: 'Permanent deployment to Room 102B to support student CCNA practicals.',
  },
  {
    serial_number: 'FCM2016L38X',
    from_room: 'Room 102B',
    to_room: 'Room 206',
    transfer_date: '2026-10-24',
    transferred_by: 'Chan Vicheka',
    reason: 'Reallocated to Room 206 switch rack for enterprise networking lab session.',
  },
];

export const seedMaintenance = [
  // 1. Dell OptiPlex 7090 Workstations (Lab 102B)
  {
    serial_number: 'OPT-102B-01-TO-24',
    asset_name: 'Dell OptiPlex 7090 Workstations (Lab 102B)',
    type: 'Firmware Upgrade',
    date: '2026-10-25',
    technician: 'Thoeurn Ratha',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 0,
    quantity: 40,
    unit: 'Workstations',
    notes: 'Golden master OS image deployed across all student workstations. Deep Freeze enabled for disk freeze.',
  },
  {
    serial_number: 'OPT-102B-01-TO-24',
    asset_name: 'Dell OptiPlex 7090 Workstations (Lab 102B)',
    type: 'Routine Inspection',
    date: '2026-03-18',
    technician: 'Thoeurn Ratha',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 35.0,
    quantity: 40,
    unit: 'Workstations',
    notes: 'Spring semester hardware audit: CPU heatsink dust vacuuming, RAM reseating, and thermal paste reapplication on Row 1-4.',
  },
  {
    serial_number: 'OPT-102B-01-TO-24',
    asset_name: 'Dell OptiPlex 7090 Workstations (Lab 102B)',
    type: 'Firmware Upgrade',
    date: '2025-09-12',
    technician: 'Thoeurn Ratha',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 0,
    quantity: 40,
    unit: 'Workstations',
    notes: 'Initial lab commissioning: BIOS UEFI v1.14 security update, TPM 2.0 enablement, and Gigabit PXE boot configuration.',
  },

  // 2. Facility Air Conditioners (Lab 102B)
  {
    serial_number: 'DKN-FTKC60U-102B',
    asset_name: 'Panasonic 2.5HP Inverter Split Air Conditioners (Lab 102B)',
    type: 'Port Audit',
    date: '2026-11-02',
    technician: 'HVAC Maintenance Team',
    status: 'In Progress',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 45.0,
    quantity: 2,
    unit: 'AC Units',
    notes: 'Bimonthly dust filter wash, evaporator coil sanitizing, and refrigerant pressure test for dual units.',
  },
  {
    serial_number: 'DKN-FTKC60U-102B',
    asset_name: 'Panasonic 2.5HP Inverter Split Air Conditioners (Lab 102B)',
    type: 'Routine Inspection',
    date: '2026-06-15',
    technician: 'HVAC Maintenance Team',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 60.0,
    quantity: 2,
    unit: 'AC Units',
    notes: 'Summer peak load preventive service: Blower fan balanced, condensate tray disinfected, current draw tested at 9.2A.',
  },
  {
    serial_number: 'DKN-FTKC60U-102B',
    asset_name: 'Panasonic 2.5HP Inverter Split Air Conditioners (Lab 102B)',
    type: 'Emergency Repair',
    date: '2025-11-18',
    technician: 'HVAC Maintenance Team',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 85.0,
    quantity: 2,
    unit: 'AC Units',
    notes: 'Replaced faulty outdoor condenser run capacitor (45uF) on Unit A and recharged 400g R32 refrigerant.',
  },

  // 3. Epson EB-2250U Laser Projector
  {
    serial_number: 'EPS-L630U-8812',
    asset_name: 'Epson EB-2250U Laser Projector & Screen (Lab 102B)',
    type: 'Port Audit',
    date: '2026-10-20',
    technician: 'Audio-Visual Staff',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 20.0,
    quantity: 1,
    unit: 'Projector',
    notes: 'Optical lens cleaned, motorized screen limit switches calibrated, HDMI signal verified.',
  },
  {
    serial_number: 'EPS-L630U-8812',
    asset_name: 'Epson EB-2250U Laser Projector & Screen (Lab 102B)',
    type: 'Calibration',
    date: '2026-04-10',
    technician: 'Audio-Visual Staff',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 25.0,
    quantity: 1,
    unit: 'Projector',
    notes: 'Semi-annual keystone correction and color temperature calibration (6500K D65 standard). Air filter cleaned.',
  },

  // 4. Cisco Catalyst 3850 Switch (Lab 102B)
  {
    serial_number: 'SW-CORE-3850-X1',
    asset_name: 'Cisco Catalyst 3850 48-Port Gigabit PoE+ Switch',
    type: 'Firmware Upgrade',
    date: '2026-11-15',
    technician: 'Cisco TAC Support',
    status: 'Pending',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 150.0,
    quantity: 1,
    unit: 'Switch',
    notes: 'Scheduled IOS-XE upgrade to 17.9.4a LTS and verify 48 port VLAN mappings.',
  },
  {
    serial_number: 'SW-CORE-3850-X1',
    asset_name: 'Cisco Catalyst 3850 48-Port Gigabit PoE+ Switch',
    type: 'Port Audit',
    date: '2026-05-14',
    technician: 'Cisco TAC Support',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 120.0,
    quantity: 1,
    unit: 'Switch',
    notes: 'Mid-year 10Gbps optical uplink test, PoE+ budget verification across 48 ports, and LLDP neighbor audit.',
  },
  {
    serial_number: 'SW-CORE-3850-X1',
    asset_name: 'Cisco Catalyst 3850 48-Port Gigabit PoE+ Switch',
    type: 'Routine Inspection',
    date: '2025-11-04',
    technician: 'Thoeurn Ratha',
    status: 'Completed',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    location: 'Computer & Network Lab 102B',
    cost: 0,
    quantity: 1,
    unit: 'Switch',
    notes: 'Initial rack installation in MDF Rack 42U, dual redundant PSU power validation, and StackWise cable link test.',
  },
];

export const seedPurchaseRequests = [
  {
    id: 'REQ-2026-001',
    title: 'Cat6A UTP RJ45 2-Meter Factory Blue Patch Cords (Pack of 50)',
    category: 'Cables & Accessories',
    target_room: 'Room 102B',
    quantity: 2,
    unit: 'Boxes',
    estimated_cost: '$140.00',
    priority: 'high',
    status: 'pending',
    reason: 'Current supply in Room 102B is critically low; needed for 24 student workstation benches before upcoming semester exam.',
    requested_by: 'Thoeurn Ratha',
    requester_role: 'Faculty Lecturer',
    request_date: '2026-10-28',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    notes: 'Submitted for department director review. Awaiting budget sign-off.',
  },
  {
    id: 'REQ-2026-002',
    title: 'Cisco 10GBASE-SR SFP+ 850nm Optical Transceiver Modules',
    category: 'Networking Equipment',
    target_room: 'Room 206',
    quantity: 8,
    unit: 'Units',
    estimated_cost: '$320.00',
    priority: 'medium',
    status: 'approved',
    reason: 'Expansion of 10Gbps fiber uplinks between Rack 01 switch and student server cluster in Room 206.',
    requested_by: 'Thoeurn Ratha',
    requester_role: 'Faculty Lecturer',
    request_date: '2026-10-25',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    notes: 'Approved by Dr. Heng Sovannarith. University procurement vendor contacted.',
  },
  {
    id: 'REQ-2026-003',
    title: 'HP LaserJet 05A (CE505A) High-Yield Black Toner Cartridges',
    category: 'Printer Supplies',
    target_room: 'Room 102B',
    quantity: 4,
    unit: 'Cartridges',
    estimated_cost: '$180.00',
    priority: 'urgent',
    status: 'ordered',
    reason: 'Faculty laboratory report printer is showing low toner warning. Needed for student assignment printouts.',
    requested_by: 'Thoeurn Ratha',
    requester_role: 'Faculty Lecturer',
    request_date: '2026-10-24',
    image_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
    notes: 'PO issued to supplier. Expected delivery early next week.',
  },
  {
    id: 'REQ-2026-004',
    title: 'iFixit Pro Tech Electronics & Computer Repair Tool Kit',
    category: 'Electronics & Tools',
    target_room: 'Room 102',
    quantity: 2,
    unit: 'Kits',
    estimated_cost: '$150.00',
    priority: 'medium',
    status: 'fulfilled',
    reason: 'Replacement precision screwdrivers and anti-static wrist straps for hardware maintenance depot workbench.',
    requested_by: 'Thoeurn Ratha',
    requester_role: 'Faculty Lecturer',
    request_date: '2026-10-15',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    notes: 'Delivered and verified by Dr. Heng Sovannarith. Stationed at Basement Depot Room 102.',
  },
];

/**
 * Classroom / Room Inventory items are strictly synced from Central Inventory (`seedStock`)
 * and Hardware Assets (`seedAssets`). Unlinked standalone room records are intentionally omitted
 * so rooms never display phantom items that do not exist in Inventory or Hardware Assets.
 */
export const seedRoomInventory: Array<{
  room_code: string;
  name: string;
  group_type: string;
  brand_spec?: string;
  unit?: string;
  qty_working?: number;
  qty_broken?: number;
  qty_maintenance?: number;
  remarks?: string;
}> = [];

/**
 * Legacy stock codes that previously duplicated Room Facility Inventory (`seedRoomInventory`)
 * or Hardware Assets (`seedAssets`). Removed cleanly on re-seed without touching custom user stock.
 */
export const LEGACY_OVERLAPPING_STOCK_CODES = [
  'TBL-102B-DESK',
  'CHR-102B-SWIV',
  'WBD-DEPT-MAG',
  'HVAC-AC-PANASONIC-25HP',
  'ELEC-LED-TUBE-36W',
  'ELEC-PWR-STRIP-8',
  'SAFE-FIRE-CO2-5KG',
  'TBL-102B-LEC',
  'CHR-FAC-HIGH',
  'TBL-206-MOD',
  'CHR-206-SWIV',
  'CAB-102B-STL',
  'TBL-CONF-10',
  'CHR-CONF-STK',
  'TBL-ESD-BENCH',
  'MON-102B-P2419H',
  'MS-102B-MS116',
  'KB-102B-KB216',
  'MON-201-U2724K',
  'MS-201-MX3S',
];

export async function seedAllData(): Promise<void> {
  console.log('🌱 Populating database tables with clean, non-overlapping fleet records...');

  // 1. Seed Locations
  const locationMap = new Map<string, string>();
  for (const loc of seedLocations) {
    const res = await query(
      `INSERT INTO locations (code, name, room, building, capacity, floor, room_type, last_audited_at, audited_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, room = EXCLUDED.room, building = EXCLUDED.building, capacity = EXCLUDED.capacity,
           floor = EXCLUDED.floor, room_type = EXCLUDED.room_type, last_audited_at = EXCLUDED.last_audited_at,
           audited_by = EXCLUDED.audited_by
       RETURNING id, room, code`,
      [
        loc.code,
        loc.name,
        loc.room,
        loc.building,
        loc.capacity,
        loc.floor || 1,
        loc.room_type || 'COMPUTER_LAB',
        loc.last_audited_at || null,
        loc.audited_by || null,
      ]
    );
    if (res.rows[0]) {
      locationMap.set(loc.room, res.rows[0].id);
      locationMap.set(loc.code, res.rows[0].id);
    }
  }
  console.log(`✅ Seeded ${seedLocations.length} University Laboratory Locations.`);

  // 2. Seed Hardware Assets
  for (const a of seedAssets) {
    const locId = locationMap.get(a.room) || null;
    await query(
      `INSERT INTO assets (
         serial_number, name, model, total_units, unit_type, 
         location_id, placement_rack, status, loan_status, image_url, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (serial_number) DO UPDATE
       SET name = EXCLUDED.name, model = EXCLUDED.model, total_units = EXCLUDED.total_units,
           unit_type = EXCLUDED.unit_type, location_id = EXCLUDED.location_id,
           placement_rack = EXCLUDED.placement_rack, status = EXCLUDED.status,
           image_url = EXCLUDED.image_url, description = EXCLUDED.description`,
      [
        a.serial_number,
        a.name,
        a.model,
        a.total_units,
        a.unit_type,
        locId,
        a.placement_rack,
        a.status,
        a.loan_status,
        a.image_url,
        a.description,
      ]
    );
  }
  console.log(`✅ Seeded ${seedAssets.length} Distinct Hardware Assets.`);

  // 3. Remove legacy overlapping stock codes before seeding clean Central Inventory Stock
  await query('DELETE FROM room_inventory');
  await query('DELETE FROM stock_items WHERE code = ANY($1::text[])', [
    LEGACY_OVERLAPPING_STOCK_CODES,
  ]);

  for (const s of seedStock) {
    const locId = locationMap.get(s.room) || null;
    await query(
      `INSERT INTO stock_items (
         code, name, category, quantity, unit, 
         location_id, rack, status, image_url, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, category = EXCLUDED.category, quantity = EXCLUDED.quantity,
           unit = EXCLUDED.unit, location_id = EXCLUDED.location_id, rack = EXCLUDED.rack,
           status = EXCLUDED.status, image_url = EXCLUDED.image_url, description = EXCLUDED.description`,
      [
        s.code,
        s.name,
        s.category,
        s.quantity,
        s.unit,
        locId,
        s.rack,
        s.status,
        s.image_url,
        s.description,
      ]
    );
  }
  console.log(`✅ Seeded ${seedStock.length} Distinct Central Inventory Items.`);

  // 4. Seed Loans (idempotent by asset_id + borrow_date + borrower_name)
  for (const l of seedLoans) {
    const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [l.serial_number]);
    const assetId = assetRes.rows[0]?.id;
    if (assetId) {
      const existing = await query(
        `SELECT 1 FROM loans WHERE asset_id = $1 AND borrow_date = $2 AND borrower_name = $3 LIMIT 1`,
        [assetId, l.borrow_date, l.borrower_name]
      );
      if (existing.rowCount === 0) {
        await query(
          `INSERT INTO loans (
             asset_id, borrower_name, borrower_role, borrower_contact, course_or_class,
             borrow_date, expected_return_date, actual_return_date, status, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            assetId,
            l.borrower_name,
            l.borrower_role,
            l.borrower_contact,
            l.course_or_class,
            l.borrow_date,
            l.expected_return_date,
            l.actual_return_date || null,
            l.status,
            l.notes,
          ]
        );
      }
    }
  }
  console.log(`✅ Verified ${seedLoans.length} Device Loans.`);

  // 5. Seed Transfers (idempotent by asset_id + transfer_date)
  for (const t of seedTransfers) {
    const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [t.serial_number]);
    const assetId = assetRes.rows[0]?.id;
    const fromLocId = locationMap.get(t.from_room) || null;
    const toLocId = locationMap.get(t.to_room) || null;
    if (assetId) {
      const existing = await query(
        `SELECT 1 FROM transfers WHERE asset_id = $1 AND transfer_date = $2 LIMIT 1`,
        [assetId, t.transfer_date]
      );
      if (existing.rowCount === 0) {
        await query(
          `INSERT INTO transfers (asset_id, from_location_id, to_location_id, transfer_date, transferred_by, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [assetId, fromLocId, toLocId, t.transfer_date, t.transferred_by, t.reason]
        );
      }
    }
  }
  console.log(`✅ Verified ${seedTransfers.length} Laboratory Relocations.`);

  // 6. Seed Maintenance Records (idempotent by serial_number + date + type)
  for (const m of seedMaintenance) {
    const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [m.serial_number]);
    const assetId = assetRes.rows[0]?.id || null;
    const existing = await query(
      `SELECT 1 FROM maintenance_records WHERE serial_number = $1 AND date = $2 AND type = $3 LIMIT 1`,
      [m.serial_number, m.date, m.type]
    );
    if (existing.rowCount === 0) {
      await query(
        `INSERT INTO maintenance_records (asset_id, asset_name, serial_number, type, date, technician, status, notes, image_url, location, cost, quantity, unit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          assetId,
          m.asset_name,
          m.serial_number,
          m.type,
          m.date,
          m.technician,
          m.status,
          m.notes,
          m.image_url,
          m.location,
          m.cost,
          m.quantity,
          m.unit,
        ]
      );
    }
  }
  console.log(`✅ Verified ${seedMaintenance.length} Maintenance & Audit Records.`);

  // 7. Seed Purchase Requests
  for (const r of seedPurchaseRequests) {
    await query(
      `INSERT INTO purchase_requests (
         id, title, category, target_room, quantity, unit,
         estimated_cost, priority, status, reason, requested_by, requester_role, request_date, image_url, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE
       SET status = EXCLUDED.status, notes = EXCLUDED.notes, image_url = EXCLUDED.image_url`,
      [
        r.id,
        r.title,
        r.category,
        r.target_room,
        r.quantity,
        r.unit,
        r.estimated_cost,
        r.priority,
        r.status,
        r.reason,
        r.requested_by,
        r.requester_role,
        r.request_date,
        r.image_url,
        r.notes,
      ]
    );
  }
  console.log(`✅ Seeded ${seedPurchaseRequests.length} Purchase Requisition Requests.`);

  // 8. Seed Room Facility Inventory (Strictly Fixtures, Furniture, Electrical & Safety)
  for (const inv of seedRoomInventory) {
    const roomId = locationMap.get(inv.room_code);
    if (roomId) {
      await query(
        `INSERT INTO room_inventory (room_id, name, group_type, brand_spec, unit, qty_working, qty_broken, qty_maintenance, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          roomId,
          inv.name,
          inv.group_type,
          inv.brand_spec || null,
          inv.unit || 'pcs',
          inv.qty_working || 0,
          inv.qty_broken || 0,
          inv.qty_maintenance || 0,
          inv.remarks || null,
        ]
      );
    }
  }
  console.log(`✅ Seeded ${seedRoomInventory.length} Distinct Room Facility Inventory Records.`);
}

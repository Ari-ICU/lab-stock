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
    image_url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
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
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
];

export const seedAssets = [
  {
    serial_number: 'OPT-102B-01-TO-24',
    name: 'Desktop PC System Unit',
    model: 'Dell OptiPlex 7090 Core i7 / 16GB / 512GB SSD',
    total_units: 40,
    unit_type: 'units',
    room: 'Room 102B',
    placement_rack: 'Computer Lab Room 102B (Student Benches 1-20)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Fleet of 40 student workstations deployed across laboratory benches in Room 102B.',
  },
  {
    serial_number: 'EPS-L630U-8812',
    name: 'LCD Projector & Screen',
    model: 'Epson EB-2250U 5000 Lumens Full HD + 120" Screen',
    total_units: 1,
    unit_type: 'sets',
    room: 'Room 102B',
    placement_rack: 'Computer Lab Room 102B (Ceiling Center Mount)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80',
    description: 'High-lumen laser projector dedicated to lecturer teaching.',
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
    unit_type: 'Unit',
    room: 'Room 102B',
    placement_rack: 'Room 102B - Ceiling Center Grid',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: 'Provides high-density 802.11ax wireless connectivity across Lab 102B.',
  },
  {
    serial_number: 'PREC-201-AI-01-12',
    name: 'Dell Precision 3660 GPU Workstations (Lab 201)',
    model: 'Core i9-13900K / RTX 4080 / 64GB RAM / 2TB NVMe',
    total_units: 12,
    unit_type: 'Workstations',
    room: 'Room 201',
    placement_rack: 'Software Engineering & AI Lab Room 201',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'AI & Machine Learning student workstations equipped with dedicated RTX GPUs.',
  },
  {
    serial_number: 'SNY-PHZ60-201',
    name: 'Sony VPL-PHZ60 6000-Lumen Laser Projector (Lab 201)',
    model: '3LCD Laser WUXGA Installation Projector',
    total_units: 1,
    unit_type: 'Unit',
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
];

export const seedStock = [
  {
    code: 'TBL-102B-DESK',
    name: 'Student Computer Desk',
    category: 'Department Tables & Desks',
    quantity: 60,
    unit: 'sets',
    room: 'Room 102B',
    rack: 'Student Rows 1-4 (Benches 1-20 in Room 102B + Spares in Depot)',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
    description: 'Dual-station wooden desks with heavy-duty steel frame, cable channel raceways, and CPU holder bays.',
  },
  {
    code: 'CHR-102B-SWIV',
    name: 'Student Chair',
    category: 'Department Chairs & Seating',
    quantity: 120,
    unit: 'pcs',
    room: 'Room 102B',
    rack: 'Workstations 1-20 (40 in Room 102B, 32 in Room 206, 48 in Storage)',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80',
    description: 'Heavy-duty ergonomic mid-back breathable mesh student swivel chairs with adjustable height pneumatics.',
  },
  {
    code: 'WBD-DEPT-MAG',
    name: 'Whiteboard & Marker Tray',
    category: 'Classroom Fixtures',
    quantity: 12,
    unit: 'pcs',
    room: 'Room 102B',
    rack: 'Front Lecture Wall & Collab Area',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
    description: 'Porcelain-on-steel magnetic dry-erase lecture boards (2.4m x 1.2m) with integrated marker tray.',
  },
  {
    code: 'HVAC-AC-PANASONIC-25HP',
    name: 'Air Conditioner',
    category: 'Electrical & HVAC',
    quantity: 16,
    unit: 'units',
    room: 'Room 102B',
    rack: 'Wall Perimeter (Units A & B Window Side)',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
    description: 'Panasonic 2.5HP Inverter Split Unit air conditioners with nanoe-X air purification.',
  },
  {
    code: 'ELEC-LED-TUBE-36W',
    name: 'Ceiling LED Tube Light',
    category: 'Electrical & HVAC',
    quantity: 80,
    unit: 'pcs',
    room: 'Room 102B',
    rack: 'Ceiling Grid Rows 1-5',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    description: 'Philips 36W LED Tube 4000K Neutral White commercial ceiling lights.',
  },
  {
    code: 'ELEC-PWR-STRIP-8',
    name: 'Wall Power Sockets & Strips',
    category: 'Electrical & HVAC',
    quantity: 60,
    unit: 'pcs',
    room: 'Room 102B',
    rack: 'Student Benches 1-20',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    description: 'Schneider Electric 8-way surge-protected bench power distribution strips.',
  },
  {
    code: 'SAFE-FIRE-CO2-5KG',
    name: 'Fire Extinguisher',
    category: 'Safety & Miscellaneous',
    quantity: 16,
    unit: 'units',
    room: 'Room 102B',
    rack: 'Entrance Door Wall Bracket',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    description: 'CO2 5KG clean-agent gas fire extinguisher certified for electrical lab environments.',
  },
  {
    code: 'TBL-102B-LEC',
    name: 'Faculty Lecturer Demonstration Table & Lectern Desk',
    category: 'Department Tables & Desks',
    quantity: 2,
    unit: 'Tables',
    room: 'Room 102B',
    rack: 'Instructor Podium & Demo Bench',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
    description: 'Faculty instructor teaching workstation desk with motorized height adjustment, HDMI/Type-C AV pass-through ports, and master lab power kill-switch.',
  },
  {
    code: 'CHR-FAC-HIGH',
    name: 'Faculty Ergonomic High-Back Executive Chairs',
    category: 'Department Chairs & Seating',
    quantity: 6,
    unit: 'Chairs',
    room: 'Room 102B',
    rack: 'Faculty Office & Instructor Podiums',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80',
    description: 'Executive ergonomic high-back chairs with adjustable headrest, 3D armrests, and synchro-tilt mechanism reserved for faculty professors.',
  },
  {
    code: 'TBL-206-MOD',
    name: 'Networking & Systems Lab Modular Work Tables',
    category: 'Department Tables & Desks',
    quantity: 16,
    unit: 'Tables',
    room: 'Room 206',
    rack: 'Server Pod Rows A-D',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
    description: 'Modular heavy-gauge steel frame networking lab tables with anti-scratch laminate tops, lockable casters, and dual PDU power channels.',
  },
  {
    code: 'CHR-206-SWIV',
    name: 'Heavy-Duty Student Lab Swivel Chairs (Room 206)',
    category: 'Department Chairs & Seating',
    quantity: 32,
    unit: 'Chairs',
    room: 'Room 206',
    rack: 'Server Pod Stations 1-16',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    description: 'High-density foam reinforced swivel chairs designed for extended 4-hour networking and ethical hacking practical laboratory sessions.',
  },
  {
    code: 'CAB-102B-STL',
    name: 'Heavy-Duty Dual-Door Steel Storage Cabinets',
    category: 'Storage Cabinets & Lockers',
    quantity: 8,
    unit: 'Cabinets',
    room: 'Room 102B',
    rack: 'Rear Wall Perimeter Storage Bay',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    description: 'Reinforced dual-door gauge steel storage cabinets with 4 adjustable load-bearing shelves (150kg/shelf) and three-point cylinder keyed security lock.',
  },
  {
    code: 'WBD-DEPT-MAG',
    name: 'Wall-Mounted Magnetic Dry-Erase Whiteboards (2.4m x 1.2m)',
    category: 'Classroom Fixtures',
    quantity: 6,
    unit: 'Boards',
    room: 'Room 102B',
    rack: 'Front Lecture Wall & Collab Area',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
    description: 'Porcelain-on-steel magnetic dry-erase lecture boards with anti-glare finish, aluminum frame, and integrated full-length pen & duster tray.',
  },
  {
    code: 'TBL-CONF-10',
    name: 'Department Conference & Faculty Meeting Table (10-Seater)',
    category: 'Department Tables & Desks',
    quantity: 2,
    unit: 'Tables',
    room: 'Room 201',
    rack: 'Department Meeting & Thesis Room',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
    description: '10-person department boardroom table with pop-up AC power ports, RJ-45 jacks, and central cable management core for faculty project reviews.',
  },
  {
    code: 'CHR-CONF-STK',
    name: 'Department Conference & Thesis Defense Stacking Chairs',
    category: 'Department Chairs & Seating',
    quantity: 30,
    unit: 'Chairs',
    room: 'Room 201',
    rack: 'Conference Area & Wall Stacks',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=600&q=80',
    description: 'Padded chrome-frame conference chairs with durable fabric upholstery, stackable up to 10 high for department seminars and thesis defenses.',
  },
  {
    code: 'TBL-ESD-BENCH',
    name: 'Electronics Repair Workbench Tables (Anti-Static ESD)',
    category: 'Department Tables & Desks',
    quantity: 4,
    unit: 'Benches',
    room: 'Hardware Staging & Maintenance Depot',
    rack: 'Hardware Diagnostic Workbenches A-D',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Ground-isolated anti-static ESD dissipation workbenches with overhead LED illumination, power strip rails, and solder fume extraction ports.',
  },
  {
    code: 'MON-102B-P2419H',
    name: 'Dell 24" FHD IPS Monitors (Student Benches 1-24)',
    category: 'Monitors',
    quantity: 24,
    unit: 'Units',
    room: 'Room 102B',
    rack: 'Student Benches 1-24',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    description: '24-inch Full HD 1080p IPS Dell display monitors connected to student desktop towers.',
  },
  {
    code: 'MS-102B-MS116',
    name: 'Dell Optical USB Mice (Lab 102B In-Use + Spares)',
    category: 'Mice & Keyboards',
    quantity: 28,
    unit: 'Pieces',
    room: 'Room 102B',
    rack: 'Benches & Shelf SHF-01',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    description: 'Standard Dell wired USB optical scroll mice (24 deployed on desks + 4 spare in shelf).',
  },
  {
    code: 'KB-102B-KB216',
    name: 'Dell Multimedia USB Keyboards (Lab 102B In-Use + Spares)',
    category: 'Mice & Keyboards',
    quantity: 28,
    unit: 'Pieces',
    room: 'Room 102B',
    rack: 'Benches & Shelf SHF-01',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Dell wired USB keyboards with Khmer/English character layout.',
  },
  {
    code: 'MON-201-U2724K',
    name: 'Dell UltraSharp 27" 4K USB-C Hub Monitors (U2723QE)',
    category: 'Monitors',
    quantity: 12,
    unit: 'Units',
    room: 'Room 201',
    rack: 'Developer Pods 1-12',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    description: '27-inch 4K IPS Black technology monitors for AI software development pods.',
  },
  {
    code: 'MS-201-MX3S',
    name: 'Logitech MX Master 3S Wireless Developer Mice',
    category: 'Mice & Keyboards',
    quantity: 12,
    unit: 'Pieces',
    room: 'Room 201',
    rack: 'Developer Pods 1-12',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    description: 'High-precision wireless developer mice with MagSpeed electromagnetic scrolling.',
  },
  {
    code: 'CBL-CAT6-BLU-1M',
    name: 'Cat6 UTP RJ45 Patch Cables 1-Meter (Blue)',
    category: 'Cables & Adapters',
    quantity: 150,
    unit: 'Pcs',
    room: 'Room 102B',
    rack: 'MDF Server Rack Cabling Bin',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    description: '100% pure copper Gigabit Ethernet patch cords for workstation bench hookups.',
  },
  {
    code: 'SFPP-10G-SR-CISCO',
    name: 'Cisco 10GBASE-SR SFP+ Optical Transceiver Modules',
    category: 'Network Modules',
    quantity: 16,
    unit: 'Units',
    room: 'Room 206',
    rack: 'Server Rack 01 - Optical Tray',
    status: 'in_stock',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    description: 'Multimode 850nm 10G optical modules for inter-switch trunk links.',
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
  {
    serial_number: 'OPT-102B-01-TO-24',
    asset_name: 'Dell OptiPlex 7090 (24 Desktops in 102B)',
    type: 'Firmware Upgrade',
    date: '2026-10-25',
    technician: 'Thoeurn Ratha',
    status: 'Completed',
    notes: 'Golden master OS image deployed across all 24 student workstations. Deep Freeze enabled for disk freeze.',
  },
  {
    serial_number: 'DKN-FTKC60U-102B',
    asset_name: 'Daikin 2.5 HP Air Conditioners (Lab 102B)',
    type: 'Port Audit',
    date: '2026-11-02',
    technician: 'HVAC Maintenance Team',
    status: 'In Progress',
    notes: 'Bimonthly dust filter wash, evaporator coil sanitizing, and refrigerant pressure test for dual units.',
  },
  {
    serial_number: 'EPS-L630U-8812',
    asset_name: 'Epson PowerLite Laser Projector (Lab 102B)',
    type: 'Port Audit',
    date: '2026-10-20',
    technician: 'Audio-Visual Staff',
    status: 'Completed',
    notes: 'Laser optical engine cleaned, motorized screen limit switches calibrated, HDMI 2.1 signal verified at 4K.',
  },
  {
    serial_number: 'FCW2348L09M',
    asset_name: 'Cisco C9300 48P Switch (Lab 102B)',
    type: 'Firmware Upgrade',
    date: '2026-11-15',
    technician: 'Cisco TAC Support',
    status: 'Pending',
    notes: 'Scheduled IOS-XE upgrade to 17.9.4a LTS and verify 24 port VLAN mappings.',
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

export const seedRoomInventory = [
  // Room 102B
  {
    room_code: 'LOC-102B',
    stock_code: 'CHR-102B-SWIV',
    name: 'Student Chair',
    group_type: 'FURNITURE',
    brand_spec: 'Heavy-duty Ergonomic Mesh Swivel',
    unit: 'pcs',
    qty_working: 38,
    qty_broken: 2,
    qty_maintenance: 0,
    remarks: '2 chairs have broken castor wheels in back row',
  },
  {
    room_code: 'LOC-102B',
    stock_code: 'TBL-102B-DESK',
    name: 'Student Computer Desk',
    group_type: 'FURNITURE',
    brand_spec: 'Dual-station Wooden Desk with cable channel',
    unit: 'sets',
    qty_working: 20,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'All 20 dual desks grounded and sturdy',
  },
  {
    room_code: 'LOC-102B',
    stock_code: 'HVAC-AC-PANASONIC-25HP',
    name: 'Air Conditioner',
    group_type: 'ELECTRICAL',
    brand_spec: 'Panasonic 2.5HP Inverter Split Unit',
    unit: 'units',
    qty_working: 1,
    qty_broken: 1,
    qty_maintenance: 0,
    remarks: 'Unit B (window side) water leak and compressor rattles',
  },
  {
    room_code: 'LOC-102B',
    stock_code: 'ELEC-LED-TUBE-36W',
    name: 'Ceiling LED Tube Light',
    group_type: 'ELECTRICAL',
    brand_spec: 'Philips 36W LED Tube 4000K Neutral White',
    unit: 'pcs',
    qty_working: 8,
    qty_broken: 2,
    qty_maintenance: 0,
    remarks: '2 tubes flickering above Lecturer podium',
  },
  {
    room_code: 'LOC-102B',
    asset_serial: 'OPT-102B-01-TO-24',
    name: 'Desktop PC System Unit',
    group_type: 'IT_HARDWARE',
    brand_spec: 'Dell OptiPlex 7090 Core i7 / 16GB / 512GB SSD',
    unit: 'units',
    qty_working: 38,
    qty_broken: 1,
    qty_maintenance: 1,
    remarks: 'Station #14 PSU failure; Station #22 under RAM replacement',
  },
  {
    room_code: 'LOC-102B',
    asset_serial: 'EPS-L630U-8812',
    name: 'LCD Projector & Screen',
    group_type: 'IT_HARDWARE',
    brand_spec: 'Epson EB-2250U 5000 Lumens Full HD + 120" Motorized Screen',
    unit: 'sets',
    qty_working: 1,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Lamp timer 310h (Good condition)',
  },
  {
    room_code: 'LOC-102B',
    stock_code: 'WBD-DEPT-MAG',
    name: 'Whiteboard & Marker Tray',
    group_type: 'FURNITURE',
    brand_spec: 'Porcelain Magnetic 2.4m x 1.2m Wall Mounted',
    unit: 'pcs',
    qty_working: 1,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Clean surface, markers stocked',
  },
  {
    room_code: 'LOC-102B',
    stock_code: 'ELEC-PWR-STRIP-8',
    name: 'Wall Power Sockets & Strips',
    group_type: 'ELECTRICAL',
    brand_spec: 'Schneider Electric 8-way Surge Protected Strip',
    unit: 'pcs',
    qty_working: 20,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'All 20 bench strips tested safe',
  },
  {
    room_code: 'LOC-102B',
    stock_code: 'SAFE-FIRE-CO2-5KG',
    name: 'Fire Extinguisher',
    group_type: 'SAFETY_MISC',
    brand_spec: 'CO2 5KG Clean Agent Gas Extinguisher',
    unit: 'units',
    qty_working: 1,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Pressure gauge in green zone. Next inspection 2027-01',
  },
  // Room 206
  {
    room_code: 'LOC-206',
    name: 'Student Chair',
    group_type: 'FURNITURE',
    brand_spec: 'Ergonomic Mid-Back Mesh',
    unit: 'pcs',
    qty_working: 32,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'All chairs in prime condition',
  },
  {
    room_code: 'LOC-206',
    name: 'Student Computer Desk',
    group_type: 'FURNITURE',
    brand_spec: 'Dual-station Heavy Steel Frame',
    unit: 'sets',
    qty_working: 16,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Equipped with ESD grounding pads',
  },
  {
    room_code: 'LOC-206',
    name: 'Air Conditioner',
    group_type: 'ELECTRICAL',
    brand_spec: 'Daikin 2.5HP Inverter Ceiling Cassette',
    unit: 'units',
    qty_working: 2,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Both units running at 21°C server lab standard',
  },
  {
    room_code: 'LOC-206',
    name: 'Desktop PC System Unit',
    group_type: 'IT_HARDWARE',
    brand_spec: 'Dell OptiPlex 7090 Core i7 / 32GB RAM / Dual NIC',
    unit: 'units',
    qty_working: 32,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'All dual-NIC networking rigs verified',
  },
  {
    room_code: 'LOC-206',
    name: '42U Server Rack Enclosure',
    group_type: 'IT_HARDWARE',
    brand_spec: 'APC NetShelter SX 42U Server Rack',
    unit: 'units',
    qty_working: 2,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Locked and keyed to Primary Admin',
  },
  // Room 201
  {
    room_code: 'LOC-201',
    name: 'Student Chair',
    group_type: 'FURNITURE',
    brand_spec: 'Ergonomic Mid-Back Mesh',
    unit: 'pcs',
    qty_working: 37,
    qty_broken: 3,
    qty_maintenance: 0,
    remarks: '3 chairs have cracked lumbar supports in Row 4',
  },
  {
    room_code: 'LOC-201',
    name: 'Student Computer Desk',
    group_type: 'FURNITURE',
    brand_spec: 'Dual-station Wooden Desk',
    unit: 'sets',
    qty_working: 20,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Good condition',
  },
  {
    room_code: 'LOC-201',
    name: 'Air Conditioner',
    group_type: 'ELECTRICAL',
    brand_spec: 'Panasonic 2.5HP Inverter Split Unit',
    unit: 'units',
    qty_working: 2,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Filters cleaned 2026-10-20',
  },
  {
    room_code: 'LOC-201',
    name: 'Desktop PC System Unit',
    group_type: 'IT_HARDWARE',
    brand_spec: 'HP EliteDesk 800 G6 Core i7 / RTX 3060 AI Rig',
    unit: 'units',
    qty_working: 39,
    qty_broken: 1,
    qty_maintenance: 0,
    remarks: 'Station #08 motherboard error (beeps on POST)',
  },
  // Room 203
  {
    room_code: 'LOC-203',
    name: 'Student Stool / Chair',
    group_type: 'FURNITURE',
    brand_spec: 'Anti-Static ESD Workbench Stool',
    unit: 'pcs',
    qty_working: 28,
    qty_broken: 2,
    qty_maintenance: 0,
    remarks: '2 hydraulic lift cylinders sink under weight',
  },
  {
    room_code: 'LOC-203',
    name: 'Wall Fan',
    group_type: 'ELECTRICAL',
    brand_spec: 'Mitsubishi 16" Heavy Wall Mount Fan',
    unit: 'units',
    qty_working: 4,
    qty_broken: 1,
    qty_maintenance: 0,
    remarks: 'Fan #3 motor buzzing and refuses to oscillate',
  },
  {
    room_code: 'LOC-203',
    name: 'Air Conditioner',
    group_type: 'ELECTRICAL',
    brand_spec: 'Panasonic 2.5HP Inverter Split Unit',
    unit: 'units',
    qty_working: 1,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Operational',
  },
  // Room 305
  {
    room_code: 'LOC-305',
    name: 'Student Chair',
    group_type: 'FURNITURE',
    brand_spec: 'Ergonomic Mid-Back Mesh',
    unit: 'pcs',
    qty_working: 36,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'All 36 chairs in good shape',
  },
  {
    room_code: 'LOC-305',
    name: 'Air Conditioner',
    group_type: 'ELECTRICAL',
    brand_spec: 'Panasonic 2.5HP Inverter Split Unit',
    unit: 'units',
    qty_working: 1,
    qty_broken: 1,
    qty_maintenance: 0,
    remarks: 'Unit A blowing warm air (refrigerant leak detected)',
  },
  {
    room_code: 'LOC-305',
    name: 'LCD Projector & Screen',
    group_type: 'IT_HARDWARE',
    brand_spec: 'BenQ MH560 Full HD 3800lm DLP',
    unit: 'sets',
    qty_working: 0,
    qty_broken: 1,
    qty_maintenance: 0,
    remarks: 'Lamp indicator red, bulb shattered during evening lecture',
  },
  {
    room_code: 'LOC-305',
    name: 'Desktop PC System Unit',
    group_type: 'IT_HARDWARE',
    brand_spec: 'Lenovo ThinkCentre M70s Core i7 / 16GB',
    unit: 'units',
    qty_working: 35,
    qty_broken: 0,
    qty_maintenance: 1,
    remarks: 'PC #19 SSD failed SMART test, pending ghost clone',
  },
  // Room 102
  {
    room_code: 'LOC-102',
    name: 'Heavy-duty Metal Storage Rack',
    group_type: 'FURNITURE',
    brand_spec: '5-Tier Industrial Galvanized Steel 500KG Shelf',
    unit: 'units',
    qty_working: 6,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Securely bolted to concrete floor',
  },
  {
    room_code: 'LOC-102',
    name: 'Repair & Diagnostic Work Table',
    group_type: 'FURNITURE',
    brand_spec: 'Hardwood Heavy Workbench 2m x 1m',
    unit: 'sets',
    qty_working: 3,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Includes integrated vices and power strip',
  },
  {
    room_code: 'LOC-102',
    name: 'Spare Student Chairs (Buffer)',
    group_type: 'FURNITURE',
    brand_spec: 'Ergonomic Mesh Mixed Stock',
    unit: 'pcs',
    qty_working: 15,
    qty_broken: 8,
    qty_maintenance: 0,
    remarks: '8 units awaiting replacement castors and gas cylinders',
  },
  {
    room_code: 'LOC-102',
    name: 'Fire Extinguisher',
    group_type: 'SAFETY_MISC',
    brand_spec: 'ABC Dry Chemical Powder 9KG',
    unit: 'units',
    qty_working: 2,
    qty_broken: 0,
    qty_maintenance: 0,
    remarks: 'Inspected and certified 2026-09',
  },
];

export async function seedAllData(): Promise<void> {
  console.log('🌱 Populating database tables with institutional fleet records...');

  // 1. Seed Locations
  const locationMap = new Map<string, string>();
  for (const loc of seedLocations) {
    const res = await query(
      `INSERT INTO locations (code, name, room, building, capacity, floor, room_type, last_audited_at, audited_by, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, room = EXCLUDED.room, building = EXCLUDED.building, capacity = EXCLUDED.capacity,
           floor = EXCLUDED.floor, room_type = EXCLUDED.room_type, last_audited_at = EXCLUDED.last_audited_at,
           audited_by = EXCLUDED.audited_by, image_url = EXCLUDED.image_url
       RETURNING id, room, code`,
      [loc.code, loc.name, loc.room, loc.building, loc.capacity, (loc as any).floor || 1, (loc as any).room_type || 'COMPUTER_LAB', (loc as any).last_audited_at || null, (loc as any).audited_by || null, loc.image_url]
    );
    if (res.rows[0]) {
      locationMap.set(loc.room, res.rows[0].id);
      locationMap.set(loc.code, res.rows[0].id);
    }
  }
  console.log(`✅ Seeded ${seedLocations.length} University Laboratory Locations.`);

  // 2. Seed Assets
  const assetMap = new Map<string, string>();
  for (const a of seedAssets) {
    const locId = locationMap.get(a.room) || null;
    const res = await query(
      `INSERT INTO assets (
         serial_number, name, model, total_units, unit_type, 
         location_id, placement_rack, status, loan_status, image_url, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (serial_number) DO UPDATE
       SET name = EXCLUDED.name, model = EXCLUDED.model, total_units = EXCLUDED.total_units,
           unit_type = EXCLUDED.unit_type, location_id = EXCLUDED.location_id,
           placement_rack = EXCLUDED.placement_rack, status = EXCLUDED.status,
           image_url = EXCLUDED.image_url, description = EXCLUDED.description
       RETURNING id, serial_number`,
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
    if (res.rows[0]) {
      assetMap.set(a.serial_number, res.rows[0].id);
    }
  }
  console.log(`✅ Seeded ${seedAssets.length} Hardware Assets.`);

  // 3. Seed Stock Items
  const stockMap = new Map<string, string>();
  for (const s of seedStock) {
    const locId = locationMap.get(s.room) || null;
    const res = await query(
      `INSERT INTO stock_items (
         code, name, category, quantity, unit, 
         location_id, rack, status, image_url, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, category = EXCLUDED.category, quantity = EXCLUDED.quantity,
           unit = EXCLUDED.unit, location_id = EXCLUDED.location_id, rack = EXCLUDED.rack,
           status = EXCLUDED.status, image_url = EXCLUDED.image_url, description = EXCLUDED.description
       RETURNING id, code`,
      [s.code, s.name, s.category, s.quantity, s.unit, locId, s.rack, s.status, s.image_url, s.description]
    );
    if (res.rows[0]) {
      stockMap.set(s.code, res.rows[0].id);
    }
  }
  console.log(`✅ Seeded ${seedStock.length} Consumable Inventory Items.`);

  // 4. Seed Loans
  for (const l of seedLoans) {
    const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [l.serial_number]);
    const assetId = assetRes.rows[0]?.id;
    if (assetId) {
      await query(
        `INSERT INTO loans (
           asset_id, borrower_name, borrower_role, borrower_contact, course_or_class,
           borrow_date, expected_return_date, actual_return_date, status, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING`,
        [
          assetId,
          l.borrower_name,
          l.borrower_role,
          l.borrower_contact,
          l.course_or_class,
          l.borrow_date,
          l.expected_return_date,
          (l as any).actual_return_date || null,
          l.status,
          l.notes,
        ]
      );
    }
  }
  console.log(`✅ Seeded ${seedLoans.length} Device Loans.`);

  // 5. Seed Transfers
  for (const t of seedTransfers) {
    const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [t.serial_number]);
    const assetId = assetRes.rows[0]?.id;
    const fromLocId = locationMap.get(t.from_room) || null;
    const toLocId = locationMap.get(t.to_room) || null;
    if (assetId) {
      await query(
        `INSERT INTO transfers (asset_id, from_location_id, to_location_id, transfer_date, transferred_by, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [assetId, fromLocId, toLocId, t.transfer_date, t.transferred_by, t.reason]
      );
    }
  }
  console.log(`✅ Seeded ${seedTransfers.length} Laboratory Relocations.`);

  // 6. Seed Maintenance Records
  for (const m of seedMaintenance) {
    const assetRes = await query('SELECT id FROM assets WHERE serial_number = $1', [m.serial_number]);
    const assetId = assetRes.rows[0]?.id || null;
    await query(
      `INSERT INTO maintenance_records (asset_id, asset_name, serial_number, type, date, technician, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [assetId, m.asset_name, m.serial_number, m.type, m.date, m.technician, m.status, m.notes]
    );
  }
  console.log(`✅ Seeded ${seedMaintenance.length} Maintenance & Audit Records.`);

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

  // 8. Seed Room Facility Inventory (Bulk Furniture, HVAC, Classroom Equipment)
  await query('DELETE FROM room_inventory');
  for (const inv of seedRoomInventory) {
    const roomId = locationMap.get(inv.room_code);
    const stockId = (inv as any).stock_code ? stockMap.get((inv as any).stock_code) || null : null;
    const assetId = (inv as any).asset_serial ? assetMap.get((inv as any).asset_serial) || null : null;
    if (roomId) {
      await query(
        `INSERT INTO room_inventory (room_id, stock_item_id, asset_id, name, group_type, brand_spec, unit, qty_working, qty_broken, qty_maintenance, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          roomId,
          stockId,
          assetId,
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
  console.log(`✅ Seeded ${seedRoomInventory.length} Room Facility Inventory Records.`);
}


import { query } from '../config/database.js';

export const seedLocations = [
  {
    code: 'LOC-102B',
    name: 'Computer & Network Lab 102B',
    building: 'Engineering Block A',
    room: 'Room 102B',
    capacity: 32,
    image_url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'LOC-206',
    name: 'Network & Server Lab 206',
    building: 'Engineering Block A',
    room: 'Room 206',
    capacity: 28,
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'LOC-201',
    name: 'Software Engineering & AI Lab 201',
    building: 'Engineering Block A',
    room: 'Room 201',
    capacity: 24,
    image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'LOC-203',
    name: 'Electronics & Embedded IoT Lab 203',
    building: 'Engineering Block A',
    room: 'Room 203',
    capacity: 20,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'LOC-305',
    name: 'Cybersecurity & Cloud Lab 305',
    building: 'Engineering Block B',
    room: 'Room 305',
    capacity: 30,
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    code: 'LOC-102',
    name: 'Hardware Staging & Maintenance Depot',
    building: 'Basement Facility',
    room: 'Room 102',
    capacity: 15,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  },
];

export const seedAssets = [
  {
    serial_number: 'OPT-102B-01-TO-24',
    name: 'Dell OptiPlex 7090 Desktop Workstations',
    model: 'OptiPlex 7090 MT / Core i7 / 16GB / 512GB SSD',
    total_units: 24,
    unit_type: 'Desktops',
    room: 'Room 102B',
    placement_rack: 'Computer Lab Room 102B (Student Benches 1-24)',
    status: 'operational',
    loan_status: 'available',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    description: 'Fleet of 24 student workstations deployed across laboratory benches.',
  },
  {
    serial_number: 'EPS-L630U-8812',
    name: 'Epson PowerLite 4K Laser Ceiling Projector',
    model: 'PowerLite L630U 6200-Lumen WUXGA Laser',
    total_units: 1,
    unit_type: 'Unit',
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
    requested_by: 'Chan Vicheka',
    requester_role: 'Lab Assistant',
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
    requested_by: 'Chan Vicheka',
    requester_role: 'Lab Assistant',
    request_date: '2026-10-15',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    notes: 'Delivered and verified by Dr. Heng Sovannarith. Stationed at Basement Depot Room 102.',
  },
];

export async function seedAllData(): Promise<void> {
  console.log('🌱 Populating database tables with institutional fleet records...');

  // 1. Seed Locations
  const locationMap = new Map<string, string>();
  for (const loc of seedLocations) {
    const res = await query(
      `INSERT INTO locations (code, name, room, building, capacity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, room = EXCLUDED.room, building = EXCLUDED.building, image_url = EXCLUDED.image_url
       RETURNING id, room`,
      [loc.code, loc.name, loc.room, loc.building, loc.capacity, loc.image_url]
    );
    if (res.rows[0]) {
      locationMap.set(loc.room, res.rows[0].id);
    }
  }
  console.log(`✅ Seeded ${seedLocations.length} University Laboratory Locations.`);

  // 2. Seed Assets
  for (const a of seedAssets) {
    const locId = locationMap.get(a.room) || null;
    await query(
      `INSERT INTO assets (
         serial_number, name, model, total_units, unit_type, 
         location_id, placement_rack, status, loan_status, image_url, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (serial_number) DO UPDATE
       SET total_units = EXCLUDED.total_units, location_id = EXCLUDED.location_id, image_url = EXCLUDED.image_url`,
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
  console.log(`✅ Seeded ${seedAssets.length} Hardware Assets.`);

  // 3. Seed Stock Items
  for (const s of seedStock) {
    const locId = locationMap.get(s.room) || null;
    await query(
      `INSERT INTO stock_items (
         code, name, category, quantity, unit, 
         location_id, rack, status, image_url, description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (code) DO UPDATE
       SET quantity = EXCLUDED.quantity, location_id = EXCLUDED.location_id, image_url = EXCLUDED.image_url`,
      [s.code, s.name, s.category, s.quantity, s.unit, locId, s.rack, s.status, s.image_url, s.description]
    );
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
}


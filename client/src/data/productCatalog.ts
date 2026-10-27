export interface ProductModelInfo {
  barcode: string; // barcode or part number
  altCodes?: string[]; // alternate barcodes, UPC, EAN, or serial formats
  modelNumber: string;
  productName: string;
  brand: string;
  category: string;
  ports?: string;
  specs: string;
  power?: string;
  formFactor: string;
  defaultLocation: string;
  defaultRack: string;
  inStockQuantity?: number;
  unit: string;
}

export const productCatalog: ProductModelInfo[] = [
  {
    barcode: '0882658847219',
    altCodes: ['C9300-48P-A', 'C9300-48P', 'FCW2348L09M'],
    modelNumber: 'C9300-48P-A',
    productName: 'Cisco Catalyst 9300 48-Port PoE+ Network Switch',
    brand: 'Cisco Systems',
    category: 'L3 Enterprise Managed Switch',
    ports: '48x 10/100/1000 Ethernet PoE+ ports, 4x 10G SFP+ Uplink Module slots',
    specs: '437W PoE Power budget, 256 Gbps switching capacity, StackWise-480 stacking support, Cisco DNA ready',
    power: 'Dual Redundant 715W AC Power Supply',
    formFactor: '1U Rackmount (19")',
    defaultLocation: 'MDF Core Server Room B04',
    defaultRack: 'MDF Core Server Rack 42U (Slot U14-U15)',
    inStockQuantity: 2,
    unit: 'Units',
  },
  {
    barcode: '0882658823107',
    altCodes: ['C9200L-24P-4G-E', 'C9200L-24P', 'NET-SW-9200L'],
    modelNumber: 'C9200L-24P-4G-E',
    productName: 'Cisco Catalyst 9200L 24-Port Full PoE+ Gigabit Switch',
    brand: 'Cisco Systems',
    category: 'Access Layer Managed Switch',
    ports: '24x 1G RJ45 PoE+, 4x 1G SFP fixed uplinks',
    specs: '370W PoE budget, 56 Gbps switching bandwidth, Cisco IOS XE Lite',
    power: 'Fixed 500W AC Internal PSU',
    formFactor: '1U Rackmount',
    defaultLocation: 'Cisco Networking Lab Rm 301',
    defaultRack: 'IDF Distribution Rack 24U (Slot U10)',
    inStockQuantity: 4,
    unit: 'Units',
  },
  {
    barcode: '0848248039210',
    altCodes: ['FG-100F', 'FGT-100F', 'FGT100F-8921-A'],
    modelNumber: 'FG-100F',
    productName: 'Fortinet FortiGate 100F Next-Generation Firewall',
    brand: 'Fortinet',
    category: 'Enterprise Security Gateway / Firewall',
    ports: '2x 10GE SFP+ FortiLink, 4x GE SFP, 16x GE RJ45, 2x WAN GE RJ45, 1x DMZ',
    specs: '1 Gbps Threat Protection throughput, 1.5 Gbps SSL Inspection, 10 Gbps Firewall throughput, ASIC SOC4 accelerated',
    power: 'Dual Redundant Internal Power Supplies',
    formFactor: '1U Rackmount',
    defaultLocation: 'Datacenter Server Rm B04',
    defaultRack: 'Edge Firewall & DMZ Cabinet (Slot U12)',
    inStockQuantity: 1,
    unit: 'Units',
  },
  {
    barcode: '0882658492013',
    altCodes: ['ISR4451-X/K9', 'ISR4451-X', 'FOC21342X89'],
    modelNumber: 'ISR4451-X/K9',
    productName: 'Cisco 4451 Integrated Services Enterprise Router',
    brand: 'Cisco Systems',
    category: 'Edge & Branch Core Router',
    ports: '4x built-in 10/100/1000 Ethernet ports with SFP/RJ45 combo, 3x NIM slots, 2x E-WIC slots',
    specs: '1 Gbps to 2 Gbps scalable WAN aggregate throughput, Cisco ONE software, Hardware crypto acceleration',
    power: 'Dual Redundant Modular Power Supplies',
    formFactor: '2U Rackmount',
    defaultLocation: 'Cisco Networking Lab Rm 301',
    defaultRack: 'IDF Distribution Rack 24U (Slot U06-U07)',
    inStockQuantity: 2,
    unit: 'Units',
  },
  {
    barcode: '0883049582019',
    altCodes: ['SFP-10G-SR', 'NET-SFP-10G-SR', '10G-SFP-SR'],
    modelNumber: 'SFP-10G-SR',
    productName: 'Cisco 10GBASE-SR SFP+ Multi-Mode Optical Transceiver',
    brand: 'Cisco Systems',
    category: 'Optical Transceiver Module',
    ports: 'LC Duplex Optical Connector (850nm wavelength)',
    specs: '10 Gbps data transfer rate up to 300m reach on OM3 Multimode Fiber (MMF), DOM / DDM digital optical monitoring',
    power: 'Max 1.0W Low Power Consumption',
    formFactor: 'SFP+ Hot-Pluggable Module',
    defaultLocation: 'Datacenter Server Rm B04',
    defaultRack: 'MDF Core Server Rack 42U (Drawer D-01)',
    inStockQuantity: 24,
    unit: 'Units',
  },
  {
    barcode: '0883049582026',
    altCodes: ['SFP-10G-LR', 'NET-SFP-10G-LR', '10G-SFP-LR'],
    modelNumber: 'SFP-10G-LR',
    productName: 'Cisco 10GBASE-LR SFP+ Single-Mode Optical Transceiver',
    brand: 'Cisco Systems',
    category: 'Optical Transceiver Module',
    ports: 'LC Duplex Optical Connector (1310nm DFB laser)',
    specs: '10 Gbps line rate up to 10 km reach on Single-Mode Fiber (SMF, OS2), DOM / DDM diagnostics support',
    power: 'Max 1.5W Low Power Consumption',
    formFactor: 'SFP+ Hot-Pluggable Module',
    defaultLocation: 'Datacenter Server Rm B04',
    defaultRack: 'MDF Core Server Rack 42U (Drawer D-01)',
    inStockQuantity: 12,
    unit: 'Units',
  },
  {
    barcode: '0754508930124',
    altCodes: ['DSX-8000', 'FLK-8000-992', 'FLK-DSX-8000'],
    modelNumber: 'DSX-8000 Versiv',
    productName: 'Fluke Networks DSX-8000 CableAnalyzer Category 8 / Class I/II',
    brand: 'Fluke Networks',
    category: 'Network Certification & Diagnostic Tool',
    ports: 'Modular Versiv Mainframe with Cat 8 Permanent Link and Channel Adapters',
    specs: 'Certifies Cat 6A / Class EA in 8 seconds, Level 2G accuracy up to 2 GHz, Shield integrity & resistance unbalance test',
    power: 'Rechargeable Li-Ion battery pack (8 hours continuous test)',
    formFactor: 'Handheld Field Rugged Diagnostic Tester',
    defaultLocation: 'Hardware Assembly Prep Rm 102',
    defaultRack: 'Patch Cord & Spares Storage Unit',
    inStockQuantity: 1,
    unit: 'Units',
  },
  {
    barcode: '0190017329104',
    altCodes: ['AP-535', 'JZ336A', 'NET-WIFI-AP535'],
    modelNumber: 'Aruba AP-535 (JZ336A)',
    productName: 'Aruba AP-535 Unified Wi-Fi 6 (802.11ax) Campus Access Point',
    brand: 'Aruba / HPE',
    category: 'Enterprise Wireless Access Point',
    ports: '1x HPE Smart Rate 2.5G/5G RJ45 (PoE PD 802.3bt/at), 1x 1G RJ45, 1x USB 2.0 host',
    specs: '4x4 MU-MIMO dual radio 5GHz (2.4 Gbps) & 2.4GHz (1.15 Gbps), BLE and Zigbee IoT radio integration',
    power: 'PoE+ 802.3at / 802.3bt or 48V DC adapter',
    formFactor: 'Ceiling / Wall Mount Access Point',
    defaultLocation: 'Engineering Block A',
    defaultRack: 'IDF Distribution Rack 24U',
    inStockQuantity: 6,
    unit: 'Units',
  },
  {
    barcode: '0712398402914',
    altCodes: ['CAB-CAT6A-2M', 'CAT6A-BLU-2M'],
    modelNumber: 'CAT6A-10G-BLU-2M',
    productName: 'Cat6A UTP 10-Gigabit Snagless RJ45 Patch Cable 2m (Blue)',
    brand: 'NetLab ProSeries',
    category: 'Network Copper Cabling',
    ports: '2x Gold-Plated 50µm RJ45 Modular Connectors',
    specs: '500 MHz transmission frequency, 10GBase-T certified, 26 AWG Stranded Bare Copper, CM Flammability rated',
    formFactor: 'Flexible Patch Cord',
    defaultLocation: 'Cisco Networking Lab Rm 301',
    defaultRack: 'IDF Distribution Rack 24U',
    inStockQuantity: 50,
    unit: 'Cables',
  },
];

export function findProductByBarcode(code: string): ProductModelInfo | null {
  const cleanCode = code.trim().toLowerCase();
  for (const product of productCatalog) {
    if (product.barcode.toLowerCase() === cleanCode) return product;
    if (product.modelNumber.toLowerCase() === cleanCode) return product;
    if (product.altCodes?.some((alt) => alt.toLowerCase() === cleanCode)) return product;
  }
  return null;
}

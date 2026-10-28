import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Lab Stock Management API',
    version: '1.0.0',
    description: `
**Faculty Laboratory Inventory, Asset & Loan Management API**
- Royal University of Phnom Penh (RUPP) STEM Network
- Enterprise Authentication via Cryptographically Signed JSON Web Tokens (JWT, HS256).
- Granular Role-Based Access Control (RBAC) with Wildcards (*).
- Full PostgreSQL Relational Persistence for Stock, Assets, Loans & Locations.

### How to Authenticate:
* **Option 1 (Direct Admin Token):** Copy the administrative JWT token below, click **Authorize 🔓** at the top right, and paste it:
\`\`\`text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
\`\`\`

* **Option 2 (Login with Credentials):** Execute \`POST /api/v1/auth/login\` with:
  * **Email:** \`sovannarith@lab.edu\`
  * **Password:** \`password123\`
  Then copy the returned \`token\` into the **Authorize 🔓** dialog.
`,
    contact: {
      name: 'Lab IT Systems Support',
      email: 'sovannarith@lab.edu',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API Version 1 Gateway',
    },
    {
      url: 'http://localhost:5001/api/v1',
      description: 'Local Fleet Development',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Input your Bearer token (without "Bearer " prefix). E.g. paste your JWT.',
      },
    },
    schemas: {
      // --- Auth Schemas ---
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sovannarith@lab.edu' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Dr. John Doe' },
          email: { type: 'string', format: 'email', example: 'john.doe@lab.edu' },
          password: { type: 'string', format: 'password', example: 'SecureP@ssw0rd2026' },
          role: { type: 'string', example: 'Faculty Lecturer' },
          department: { type: 'string', example: 'Computer Science & Networking' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string' },
          is_admin: { type: 'boolean' },
          department: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },

      // --- Stock Schemas ---
      StockItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'SKU-RJ45-CAT6' },
          name: { type: 'string', example: 'RJ-45 Cat6 Shielded Modular Connectors' },
          category: { type: 'string', example: 'Cables & Accessories' },
          quantity: { type: 'integer', example: 150 },
          unit: { type: 'string', example: 'Pack (100pcs)' },
          location_id: { type: 'string', format: 'uuid', nullable: true },
          location_name: { type: 'string', example: 'Computer & Network Lab 102B' },
          rack: { type: 'string', example: 'Storage Cabinet B1' },
          status: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock'], example: 'in_stock' },
          min_threshold: { type: 'integer', example: 20 },
          expiry_date: { type: 'string', example: 'Warranty Active' },
          image_url: { type: 'string', nullable: true },
          description: { type: 'string', example: 'Cat6 8P8C gold-plated connectors for laboratory network patching' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateStockRequest: {
        type: 'object',
        required: ['code', 'name', 'category', 'quantity'],
        properties: {
          code: { type: 'string', example: 'SKU-FIBER-LC' },
          name: { type: 'string', example: 'OM4 LC-LC Duplex Fiber Patch Cable (2m)' },
          category: { type: 'string', example: 'Cables & Accessories' },
          quantity: { type: 'integer', example: 45 },
          unit: { type: 'string', example: 'Cables' },
          location_id: { type: 'string', format: 'uuid' },
          rack: { type: 'string', example: 'Fiber Bin 03' },
          min_threshold: { type: 'integer', example: 10 },
          expiry_date: { type: 'string', example: 'Active' },
          image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400' },
          description: { type: 'string', example: '10Gbps OM4 laser-optimized multimode fiber' },
        },
      },

      // --- Asset Schemas ---
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          serial_number: { type: 'string', example: 'CSCO-CAT9300-01' },
          name: { type: 'string', example: 'Cisco Catalyst 9300 48-Port PoE+ Managed Switch' },
          model: { type: 'string', example: 'C9300-48P-A' },
          total_units: { type: 'integer', example: 1 },
          unit_type: { type: 'string', example: 'Units' },
          location_id: { type: 'string', format: 'uuid', nullable: true },
          location_name: { type: 'string', example: 'Computer & Network Lab 102B' },
          placement_rack: { type: 'string', example: '42U Main Server Rack (U18-U19)' },
          status: { type: 'string', enum: ['operational', 'in_use', 'maintenance'], example: 'operational' },
          loan_status: { type: 'string', enum: ['available', 'on_loan'], example: 'available' },
          current_borrower: { type: 'string', nullable: true },
          loan_due_date: { type: 'string', format: 'date', nullable: true },
          next_calibration: { type: 'string', example: '2027-01-15' },
          image_url: { type: 'string', nullable: true },
          description: { type: 'string', example: 'Layer 3 enterprise switch for student routing topology labs' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateAssetRequest: {
        type: 'object',
        required: ['serial_number', 'name', 'model'],
        properties: {
          serial_number: { type: 'string', example: 'OPT-7090-09' },
          name: { type: 'string', example: 'Dell OptiPlex 7090 Desktop Workstation' },
          model: { type: 'string', example: 'Core i7-11700 / 32GB RAM / 1TB NVMe' },
          total_units: { type: 'integer', example: 1 },
          unit_type: { type: 'string', example: 'Units' },
          location_id: { type: 'string', format: 'uuid' },
          placement_rack: { type: 'string', example: 'Student Bench 03' },
          status: { type: 'string', enum: ['operational', 'in_use', 'maintenance'], example: 'operational' },
          image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400' },
          description: { type: 'string', example: 'Student lab machine with Ubuntu 24.04 LTS & Wireshark' },
        },
      },

      // --- Loan Schemas ---
      Loan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          asset_id: { type: 'string', format: 'uuid' },
          asset_name: { type: 'string', example: 'Cisco ISR 4331 Router' },
          serial_number: { type: 'string', example: 'ISR4331-K9-02' },
          borrower_name: { type: 'string', example: 'Sokha Chan' },
          borrower_role: { type: 'string', example: 'Student' },
          borrower_contact: { type: 'string', example: '+855 12 345 678' },
          course_or_class: { type: 'string', example: 'CS402: Advanced Network Design' },
          borrow_date: { type: 'string', format: 'date', example: '2026-10-26' },
          expected_return_date: { type: 'string', format: 'date', example: '2026-11-02' },
          actual_return_date: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['active', 'returned', 'overdue'], example: 'active' },
          notes: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CheckoutRequest: {
        type: 'object',
        required: ['asset_id', 'borrower_name', 'expected_return_date'],
        properties: {
          asset_id: { type: 'string', format: 'uuid', example: 'e39b7bf6-82dc-4613-810a-b5860d5b62b1' },
          borrower_name: { type: 'string', example: 'Sokha Chan' },
          borrower_role: { type: 'string', example: 'Student' },
          borrower_contact: { type: 'string', example: '+855 98 765 432' },
          course_or_class: { type: 'string', example: 'Telecommunications Lab Year 4' },
          borrow_date: { type: 'string', format: 'date', example: '2026-10-28' },
          expected_return_date: { type: 'string', format: 'date', example: '2026-11-04' },
          notes: { type: 'string', example: 'Borrowed for final year capstone demo' },
        },
      },
      ReturnRequest: {
        type: 'object',
        properties: {
          notes: { type: 'string', example: 'Device examined, power adapter and console cable returned in good condition' },
        },
      },

      // --- Location Schemas ---
      Location: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'L102B' },
          name: { type: 'string', example: 'Computer & Network Lab 102B' },
          room: { type: 'string', example: 'Rm 102B' },
          building: { type: 'string', example: 'Engineering Block A' },
          capacity: { type: 'integer', example: 35 },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateLocationRequest: {
        type: 'object',
        required: ['code', 'name', 'room', 'building'],
        properties: {
          code: { type: 'string', example: 'L206' },
          name: { type: 'string', example: 'Network & Server Lab 206' },
          room: { type: 'string', example: 'Rm 206' },
          building: { type: 'string', example: 'Engineering Block A' },
          capacity: { type: 'integer', example: 30 },
        },
      },

      // --- Generic Responses ---
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          code: { type: 'string', example: 'PERMISSION_DENIED' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
  },
  paths: {
    // ========================================================
    // AUTHENTICATION
    // ========================================================
    '/auth/login': {
      post: {
        summary: 'Authenticate credentials and obtain signed JWT',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Authentication successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve currently authenticated session user profile',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Active user profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/verify': {
      post: {
        summary: 'Inspect and cryptographically verify token claims',
        tags: ['Authentication'],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Token verified successfully' } },
      },
    },

    // ========================================================
    // CONSUMABLES & STOCK INVENTORY
    // ========================================================
    '/stock': {
      get: {
        summary: 'List all consumables & stock items with optional filters',
        tags: ['Stock & Inventory'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category (e.g. Cables & Accessories)' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock'] } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Fuzzy search by name, SKU, or description' },
        ],
        responses: {
          200: {
            description: 'Inventory items retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/StockItem' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Register a new consumable or inventory stock item',
        tags: ['Stock & Inventory'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStockRequest' } } },
        },
        responses: {
          201: { description: 'Stock item registered successfully' },
          409: { description: 'Conflict: Item code/SKU already exists' },
        },
      },
    },
    '/stock/{id}': {
      get: {
        summary: 'Get single stock item by UUID',
        tags: ['Stock & Inventory'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Stock item found' },
          404: { description: 'Item not found' },
        },
      },
      put: {
        summary: 'Update stock item details (quantity, status, location)',
        tags: ['Stock & Inventory'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          200: { description: 'Stock item updated successfully' },
          404: { description: 'Item not found' },
        },
      },
      delete: {
        summary: 'Delete stock item from inventory',
        tags: ['Stock & Inventory'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Stock item deleted' },
          404: { description: 'Item not found' },
        },
      },
    },

    // ========================================================
    // HARDWARE ASSETS
    // ========================================================
    '/assets': {
      get: {
        summary: 'List all lab hardware devices & assets',
        tags: ['Hardware Assets'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['operational', 'in_use', 'maintenance'] } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by device name, serial number, or model' },
        ],
        responses: {
          200: {
            description: 'Assets retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Asset' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Register a new hardware device / asset',
        tags: ['Hardware Assets'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssetRequest' } } },
        },
        responses: {
          201: { description: 'Hardware asset created' },
          409: { description: 'Serial number already registered' },
        },
      },
    },
    '/assets/{id}': {
      get: {
        summary: 'Get single hardware asset by UUID',
        tags: ['Hardware Assets'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Asset details retrieved' },
          404: { description: 'Asset not found' },
        },
      },
      put: {
        summary: 'Update asset specifications, status, or location',
        tags: ['Hardware Assets'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          200: { description: 'Asset updated successfully' },
          404: { description: 'Asset not found' },
        },
      },
      delete: {
        summary: 'Decommission and remove hardware asset',
        tags: ['Hardware Assets'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Asset deleted' },
          404: { description: 'Asset not found' },
        },
      },
    },

    // ========================================================
    // DEVICE LOANS & CHECKOUTS
    // ========================================================
    '/loans': {
      get: {
        summary: 'List all equipment loan records',
        tags: ['Device Loans'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'returned', 'overdue'] } },
        ],
        responses: {
          200: {
            description: 'Loan transactions retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Loan' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/loans/{id}': {
      get: {
        summary: 'Get single loan record by ID',
        tags: ['Device Loans'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Loan details retrieved' },
          404: { description: 'Loan record not found' },
        },
      },
    },
    '/loans/checkout': {
      post: {
        summary: 'Check out equipment device to borrower (locks asset)',
        tags: ['Device Loans'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckoutRequest' } } },
        },
        responses: {
          201: { description: 'Loan created and asset loan_status changed to on_loan' },
          409: { description: 'Device is already checked out to another borrower' },
        },
      },
    },
    '/loans/{id}/return': {
      post: {
        summary: 'Check in returned device (releases asset to available)',
        tags: ['Device Loans'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReturnRequest' } } },
        },
        responses: {
          200: { description: 'Device returned and asset released back to inventory' },
          409: { description: 'Loan is already returned' },
        },
      },
    },

    // ========================================================
    // LAB LOCATIONS
    // ========================================================
    '/locations': {
      get: {
        summary: 'List all laboratory rooms & facilities',
        tags: ['Lab Locations'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Locations list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Location' } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Add a new laboratory facility or room',
        tags: ['Lab Locations'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLocationRequest' } } },
        },
        responses: {
          201: { description: 'Location registered successfully' },
          409: { description: 'Location code already exists' },
        },
      },
    },
    '/locations/{id}': {
      get: {
        summary: 'Get single lab location by UUID',
        tags: ['Lab Locations'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Location retrieved' },
          404: { description: 'Location not found' },
        },
      },
    },
  },
};

export function setupSwagger(app: Application) {
  const customCss = `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 24px 0 }
    .swagger-ui .info .title { font-family: system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 28px }
  `;

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss,
      customSiteTitle: 'Lab Stock API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );

  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openApiSpec);
  });
}

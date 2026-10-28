import swaggerUi from 'swagger-ui-express';
import { Application, Request, Response } from 'express';

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Lab Stock Management API',
    version: '1.0.0',
    description: `
**Faculty Laboratory Inventory & Asset Management API**
- Royal University of Phnom Penh (RUPP) STEM Network
- Enterprise Authentication via Cryptographically Signed JSON Web Tokens (JWT, HS256).
- Role-Based Access Control (RBAC) with granular permission scopes.
- High-work-factor Bcrypt Password Hashing (Salt Work Factor: 12).
- Complete PostgreSQL Relational Database Persistence.

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
      description: 'Local Production Fleet',
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
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'sovannarith@lab.edu',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
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
      AuthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          message: { type: 'string', example: 'Authentication successful' },
          token: { type: 'string', description: 'Cryptographically signed JWT' },
          user: { $ref: '#/components/schemas/UserResponse' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          code: { type: 'string', example: 'UNAUTHORIZED' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate credentials and obtain signed JWT',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: {
            description: 'Validation error (missing or malformed email/password)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          401: {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          429: {
            description: 'Rate limit exceeded (brute-force defense)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Provision a new institutional faculty or admin account',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Account successfully created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    user: { $ref: '#/components/schemas/UserResponse' },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden: Requires Administrator privileges' },
          409: { description: 'Conflict: Email address is already registered' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve currently authenticated session user profile',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    user: { $ref: '#/components/schemas/UserResponse' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized: Invalid or expired token' },
        },
      },
    },
    '/auth/verify': {
      post: {
        summary: 'Cryptographically verify token signature and inspect RBAC claims',
        tags: ['Authentication'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token verified successfully',
          },
          401: { description: 'Token signature invalid or expired' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        summary: 'Change password for currently authenticated user',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Password updated successfully' },
          400: { description: 'Validation error: Weak new password' },
          401: { description: 'Unauthorized or incorrect current password' },
        },
      },
    },
    '/auth/admin-only': {
      get: {
        summary: 'Administrative gatekeeper test endpoint',
        tags: ['Permissions & Roles'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Access granted to administrator zone' },
          403: { description: 'Access denied: Requires administrator privilege' },
        },
      },
    },
    '/auth/faculty-only': {
      get: {
        summary: 'Faculty Lecturer & Admin gatekeeper test endpoint',
        tags: ['Permissions & Roles'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Access granted to faculty zone' },
          403: { description: 'Access denied: Requires faculty or admin role' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'System health check',
        tags: ['System'],
        responses: {
          200: { description: 'API gateway is running healthy' },
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

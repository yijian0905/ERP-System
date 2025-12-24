// Database seed script
import { PrismaClient } from '../generated/prisma-client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All permissions that can be assigned to roles
const ALL_PERMISSIONS = [
  // User management
  { code: 'users:view', name: 'View Users', description: 'Can view user list and details', module: 'users', action: 'view', sortOrder: 1 },
  { code: 'users:create', name: 'Create Users', description: 'Can create new users', module: 'users', action: 'create', sortOrder: 2 },
  { code: 'users:update', name: 'Update Users', description: 'Can update user information', module: 'users', action: 'update', sortOrder: 3 },
  { code: 'users:delete', name: 'Delete Users', description: 'Can delete users', module: 'users', action: 'delete', sortOrder: 4 },

  // Role management
  { code: 'roles:view', name: 'View Roles', description: 'Can view roles and permissions', module: 'roles', action: 'view', sortOrder: 1 },
  { code: 'roles:create', name: 'Create Roles', description: 'Can create new roles', module: 'roles', action: 'create', sortOrder: 2 },
  { code: 'roles:update', name: 'Update Roles', description: 'Can update role permissions', module: 'roles', action: 'update', sortOrder: 3 },
  { code: 'roles:delete', name: 'Delete Roles', description: 'Can delete custom roles', module: 'roles', action: 'delete', sortOrder: 4 },

  // Product management
  { code: 'products:view', name: 'View Products', description: 'Can view product catalog', module: 'products', action: 'view', sortOrder: 1 },
  { code: 'products:create', name: 'Create Products', description: 'Can create new products', module: 'products', action: 'create', sortOrder: 2 },
  { code: 'products:update', name: 'Update Products', description: 'Can update product information', module: 'products', action: 'update', sortOrder: 3 },
  { code: 'products:delete', name: 'Delete Products', description: 'Can delete products', module: 'products', action: 'delete', sortOrder: 4 },

  // Inventory management
  { code: 'inventory:view', name: 'View Inventory', description: 'Can view inventory levels', module: 'inventory', action: 'view', sortOrder: 1 },
  { code: 'inventory:adjust', name: 'Adjust Inventory', description: 'Can make inventory adjustments', module: 'inventory', action: 'adjust', sortOrder: 2 },
  { code: 'inventory:transfer', name: 'Transfer Inventory', description: 'Can transfer stock between warehouses', module: 'inventory', action: 'transfer', sortOrder: 3 },

  // Customer management
  { code: 'customers:view', name: 'View Customers', description: 'Can view customer list', module: 'customers', action: 'view', sortOrder: 1 },
  { code: 'customers:create', name: 'Create Customers', description: 'Can create new customers', module: 'customers', action: 'create', sortOrder: 2 },
  { code: 'customers:update', name: 'Update Customers', description: 'Can update customer information', module: 'customers', action: 'update', sortOrder: 3 },
  { code: 'customers:delete', name: 'Delete Customers', description: 'Can delete customers', module: 'customers', action: 'delete', sortOrder: 4 },

  // Supplier management
  { code: 'suppliers:view', name: 'View Suppliers', description: 'Can view supplier list', module: 'suppliers', action: 'view', sortOrder: 1 },
  { code: 'suppliers:create', name: 'Create Suppliers', description: 'Can create new suppliers', module: 'suppliers', action: 'create', sortOrder: 2 },
  { code: 'suppliers:update', name: 'Update Suppliers', description: 'Can update supplier information', module: 'suppliers', action: 'update', sortOrder: 3 },
  { code: 'suppliers:delete', name: 'Delete Suppliers', description: 'Can delete suppliers', module: 'suppliers', action: 'delete', sortOrder: 4 },

  // Order management
  { code: 'orders:view', name: 'View Orders', description: 'Can view orders', module: 'orders', action: 'view', sortOrder: 1 },
  { code: 'orders:create', name: 'Create Orders', description: 'Can create new orders', module: 'orders', action: 'create', sortOrder: 2 },
  { code: 'orders:update', name: 'Update Orders', description: 'Can update orders', module: 'orders', action: 'update', sortOrder: 3 },
  { code: 'orders:delete', name: 'Delete Orders', description: 'Can delete orders', module: 'orders', action: 'delete', sortOrder: 4 },
  { code: 'orders:approve', name: 'Approve Orders', description: 'Can approve pending orders', module: 'orders', action: 'approve', sortOrder: 5 },

  // Invoice management
  { code: 'invoices:view', name: 'View Invoices', description: 'Can view invoices', module: 'invoices', action: 'view', sortOrder: 1 },
  { code: 'invoices:create', name: 'Create Invoices', description: 'Can create new invoices', module: 'invoices', action: 'create', sortOrder: 2 },
  { code: 'invoices:update', name: 'Update Invoices', description: 'Can update invoices', module: 'invoices', action: 'update', sortOrder: 3 },
  { code: 'invoices:delete', name: 'Delete Invoices', description: 'Can delete invoices', module: 'invoices', action: 'delete', sortOrder: 4 },
  { code: 'invoices:send', name: 'Send Invoices', description: 'Can send invoices to customers', module: 'invoices', action: 'send', sortOrder: 5 },

  // Payment management
  { code: 'payments:view', name: 'View Payments', description: 'Can view payment records', module: 'payments', action: 'view', sortOrder: 1 },
  { code: 'payments:create', name: 'Create Payments', description: 'Can record payments', module: 'payments', action: 'create', sortOrder: 2 },
  { code: 'payments:update', name: 'Update Payments', description: 'Can update payment records', module: 'payments', action: 'update', sortOrder: 3 },

  // Reports
  { code: 'reports:view', name: 'View Reports', description: 'Can view reports and analytics', module: 'reports', action: 'view', sortOrder: 1 },
  { code: 'reports:export', name: 'Export Reports', description: 'Can export reports to file', module: 'reports', action: 'export', sortOrder: 2 },

  // Settings
  { code: 'settings:view', name: 'View Settings', description: 'Can view system settings', module: 'settings', action: 'view', sortOrder: 1 },
  { code: 'settings:update', name: 'Update Settings', description: 'Can modify system settings', module: 'settings', action: 'update', sortOrder: 2 },

  // Audit logs (L3)
  { code: 'audit:view', name: 'View Audit Logs', description: 'Can view audit trail', module: 'audit', action: 'view', sortOrder: 1 },

  // AI features (L2/L3)
  { code: 'ai:predictions', name: 'AI Predictions', description: 'Can use predictive analytics', module: 'ai', action: 'predictions', sortOrder: 1 },
  { code: 'ai:chat', name: 'AI Chat Assistant', description: 'Can use AI chat assistant', module: 'ai', action: 'chat', sortOrder: 2 },
];

// Default system roles with their permission codes
const DEFAULT_SYSTEM_ROLES = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all system features',
    color: 'red',
    isSystem: true,
    permissionCodes: ALL_PERMISSIONS.map(p => p.code),
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Can manage operations but cannot modify system settings or roles',
    color: 'blue',
    isSystem: true,
    permissionCodes: ALL_PERMISSIONS
      .filter(p => !p.code.startsWith('roles:') && !p.code.startsWith('settings:') && p.code !== 'audit:view')
      .map(p => p.code),
  },
  {
    name: 'user',
    displayName: 'Standard User',
    description: 'Basic access for day-to-day operations',
    color: 'green',
    isSystem: true,
    permissionCodes: [
      'products:view',
      'inventory:view',
      'customers:view',
      'customers:create',
      'suppliers:view',
      'orders:view',
      'orders:create',
      'invoices:view',
      'invoices:create',
      'payments:view',
      'reports:view',
    ],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to the system',
    color: 'gray',
    isSystem: true,
    permissionCodes: ALL_PERMISSIONS.filter(p => p.action === 'view').map(p => p.code),
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed permissions (global, not tenant-specific)
  console.log('📜 Seeding permissions...');
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        description: perm.description,
        module: perm.module,
        action: perm.action,
        sortOrder: perm.sortOrder,
      },
      create: perm,
    });
  }
  console.log(`✅ Created/updated ${ALL_PERMISSIONS.length} permissions`);

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      status: 'ACTIVE',
      tier: 'L2',
      settings: {
        company: {
          name: 'Demo Company Ltd.',
          address: '123 Business Street',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
          phone: '+1 (555) 123-4567',
          email: 'info@demo-company.com',
          website: 'https://demo-company.com',
          taxId: 'US123456789',
        },
        regional: {
          timezone: 'America/Los_Angeles',
          currency: 'USD',
          currencySymbol: '$',
          locale: 'en-US',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: 'HH:mm',
          numberFormat: {
            decimalSeparator: '.',
            thousandsSeparator: ',',
            decimalPlaces: 2,
          },
        },
        invoice: {
          prefix: 'INV-',
          nextNumber: 1001,
          dueDays: 30,
          taxRate: 8.25,
          showLogo: true,
          showPaymentInfo: true,
        },
        order: {
          salesOrderPrefix: 'SO-',
          purchaseOrderPrefix: 'PO-',
          nextSalesOrderNumber: 1001,
          nextPurchaseOrderNumber: 1001,
          requireApproval: false,
          autoConfirmOrders: false,
        },
        inventory: {
          trackBatches: true,
          trackSerialNumbers: false,
          trackExpiry: true,
          allowNegativeStock: false,
          lowStockAlertEnabled: true,
          lowStockAlertThreshold: 10,
        },
        notifications: {
          emailNotifications: true,
          lowStockAlerts: true,
          orderAlerts: true,
          paymentAlerts: true,
          dailyDigest: false,
          weeklyReport: true,
        },
        security: {
          mfaRequired: false,
          mfaEnforced: false,
          sessionTimeout: 480,
          maxFailedLogins: 5,
          lockoutDuration: 30,
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: false,
          passwordExpiryDays: 0,
        },
      },
    },
  });

  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create system roles for the tenant
  console.log('👥 Creating system roles for tenant...');
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

  const createdRoles: Record<string, string> = {};

  for (const roleData of DEFAULT_SYSTEM_ROLES) {
    const existingRole = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: roleData.name },
    });

    if (!existingRole) {
      const role = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          color: roleData.color,
          isSystem: roleData.isSystem,
          isActive: true,
        },
      });

      // Create role permissions
      const permissionIds = roleData.permissionCodes
        .map(code => permissionMap.get(code))
        .filter((id): id is string => id !== undefined);

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      createdRoles[roleData.name] = role.id;
      console.log(`   ✅ Created role: ${roleData.displayName} with ${permissionIds.length} permissions`);
    } else {
      createdRoles[roleData.name] = existingRole.id;
      console.log(`   ℹ️ Role already exists: ${roleData.displayName}`);
    }
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo-company.com' } },
    update: {
      roleId: createdRoles['admin'],
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo-company.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      roleId: createdRoles['admin'],
      isActive: true,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'manager@demo-company.com' } },
    update: {
      roleId: createdRoles['manager'],
    },
    create: {
      tenantId: tenant.id,
      email: 'manager@demo-company.com',
      name: 'Manager User',
      password: hashedPassword,
      role: 'MANAGER',
      roleId: createdRoles['manager'],
      isActive: true,
    },
  });

  console.log(`✅ Created manager user: ${managerUser.email}`);

  // Create license
  const license = await prisma.license.create({
    data: {
      tenantId: tenant.id,
      tier: 'L2',
      licenseKey: `L2-${tenant.id.slice(0, 8).toUpperCase()}-DEMO`,
      features: {
        inventory: true,
        basicReports: true,
        invoicing: true,
        customers: true,
        products: true,
        orders: true,
        warehouses: true,
        predictiveAnalytics: true,
        demandForecasting: true,
        advancedReports: true,
        multiWarehouse: true,
        batchTracking: true,
        aiChatAssistant: false,
        schemaIsolation: false,
        customIntegrations: false,
        auditLogs: false,
        multiCurrency: false,
        advancedPermissions: false,
        apiAccess: false,
      },
      maxUsers: 10,
      maxProducts: 1000,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      isActive: true,
    },
  });

  console.log(`✅ Created license: ${license.licenseKey}`);

  // Create default warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      address: '123 Warehouse Drive, San Francisco, CA 94105',
      phone: '+1 (555) 123-4567',
      email: 'warehouse@demo-company.com',
      manager: 'John Smith',
      type: 'WAREHOUSE',
      isDefault: true,
      isActive: true,
    },
  });

  console.log(`✅ Created warehouse: ${warehouse.name}`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Office Supplies',
        slug: 'office-supplies',
        description: 'Office and stationery supplies',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Furniture',
        slug: 'furniture',
        description: 'Office furniture and fixtures',
        sortOrder: 3,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[0].id,
        sku: 'ELEC-001',
        barcode: '1234567890123',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        unit: 'pcs',
        price: 29.99,
        cost: 15.00,
        taxRate: 8.25,
        minStock: 10,
        maxStock: 200,
        reorderPoint: 20,
        reorderQty: 50,
        status: 'ACTIVE',
        images: ['https://example.com/mouse.jpg'],
        attributes: { color: 'Black', connectivity: 'Wireless' },
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[0].id,
        sku: 'ELEC-002',
        barcode: '1234567890124',
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with Cherry MX switches',
        unit: 'pcs',
        price: 149.99,
        cost: 75.00,
        taxRate: 8.25,
        minStock: 5,
        maxStock: 100,
        reorderPoint: 10,
        reorderQty: 25,
        status: 'ACTIVE',
        images: ['https://example.com/keyboard.jpg'],
        attributes: { switchType: 'Cherry MX Red', layout: 'Full Size' },
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[1].id,
        sku: 'OFFC-001',
        barcode: '1234567890125',
        name: 'A4 Copy Paper (500 sheets)',
        description: 'High-quality A4 copy paper, 80gsm',
        unit: 'ream',
        price: 8.99,
        cost: 4.50,
        taxRate: 0,
        minStock: 50,
        maxStock: 1000,
        reorderPoint: 100,
        reorderQty: 200,
        status: 'ACTIVE',
        images: [],
        attributes: { size: 'A4', weight: '80gsm' },
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[2].id,
        sku: 'FURN-001',
        barcode: '1234567890126',
        name: 'Ergonomic Office Chair',
        description: 'Adjustable ergonomic office chair with lumbar support',
        unit: 'pcs',
        price: 299.99,
        cost: 150.00,
        taxRate: 8.25,
        minStock: 5,
        maxStock: 50,
        reorderPoint: 5,
        reorderQty: 10,
        status: 'ACTIVE',
        images: ['https://example.com/chair.jpg'],
        attributes: { material: 'Mesh', adjustable: true },
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create inventory for products
  await Promise.all(
    products.map((product, index) =>
      prisma.inventoryItem.create({
        data: {
          tenantId: tenant.id,
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: (index + 1) * 25,
          reservedQty: 0,
          availableQty: (index + 1) * 25,
          costPrice: product.cost,
        },
      })
    )
  );

  console.log(`✅ Created inventory items for ${products.length} products`);

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-001',
        name: 'Acme Corporation',
        type: 'COMPANY',
        email: 'purchasing@acme.com',
        phone: '+1 (555) 234-5678',
        taxId: 'US987654321',
        billingAddress: {
          street: '456 Corporate Blvd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
        },
        shippingAddress: {
          street: '456 Corporate Blvd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
        },
        paymentTerms: 30,
        creditLimit: 50000,
        currentBalance: 0,
        tags: ['enterprise', 'priority'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-002',
        name: 'TechStart Inc.',
        type: 'COMPANY',
        email: 'orders@techstart.io',
        phone: '+1 (555) 345-6789',
        billingAddress: {
          street: '789 Startup Lane',
          city: 'San Jose',
          state: 'CA',
          postalCode: '95101',
          country: 'USA',
        },
        paymentTerms: 15,
        creditLimit: 10000,
        currentBalance: 0,
        tags: ['startup', 'tech'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        code: 'CUST-003',
        name: 'John Doe',
        type: 'INDIVIDUAL',
        email: 'john.doe@email.com',
        phone: '+1 (555) 456-7890',
        mobile: '+1 (555) 456-7891',
        billingAddress: {
          street: '123 Main St',
          city: 'Oakland',
          state: 'CA',
          postalCode: '94601',
          country: 'USA',
        },
        paymentTerms: 0,
        creditLimit: 1000,
        currentBalance: 0,
        tags: ['individual'],
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create sample supplier
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: tenant.id,
      code: 'SUP-001',
      name: 'Global Electronics Supply',
      contactPerson: 'Jane Wilson',
      email: 'sales@globalelec.com',
      phone: '+1 (555) 567-8901',
      website: 'https://globalelec.com',
      address: {
        street: '100 Industrial Park',
        city: 'Shenzhen',
        country: 'China',
      },
      paymentTerms: 45,
      currency: 'USD',
      leadTime: 14,
      minimumOrder: 500,
      rating: 4,
      tags: ['electronics', 'asia'],
      isActive: true,
    },
  });

  console.log(`✅ Created supplier: ${supplier.name}`);

  // Link supplier to products
  await Promise.all(
    products
      .filter((p) => p.categoryId === categories[0].id)
      .map((product) =>
        prisma.supplierProduct.create({
          data: {
            tenantId: tenant.id,
            supplierId: supplier.id,
            productId: product.id,
            supplierSku: `GES-${product.sku}`,
            unitPrice: product.cost.toNumber() * 0.8, // 20% margin
            minOrderQty: 10,
            leadTime: 14,
            isPreferred: true,
          },
        })
      )
  );

  console.log('✅ Linked supplier to products');

  // Create platform admin (for Admin Portal)
  console.log('\n👤 Creating platform admin...');
  const platformAdminPassword = await bcrypt.hash('Admin@123', 12);

  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@platform.local' },
    update: {},
    create: {
      email: 'admin@platform.local',
      name: 'Platform Administrator',
      password: platformAdminPassword,
      role: 'SUPER_ADMIN',
      department: 'Technology',
      isActive: true,
    },
  });

  console.log(`✅ Created platform admin: ${platformAdmin.email}`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('');
  console.log('   ERP System (Tenant Users):');
  console.log('   ├── Admin: admin@demo-company.com / password123');
  console.log('   └── Manager: manager@demo-company.com / password123');
  console.log('');
  console.log('   Admin Portal (Platform Management):');
  console.log('   └── Platform Admin: admin@platform.local / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


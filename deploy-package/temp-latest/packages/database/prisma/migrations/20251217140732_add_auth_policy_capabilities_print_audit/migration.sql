/*
  Warnings:

  - You are about to drop the `assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `einvoice_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `einvoice_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `einvoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_movements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoice_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leaves` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lhdn_credentials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lhdn_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `licenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payrolls` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `positions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recruitment_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recruitment_jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supplier_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tenants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `training_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trainings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `warehouses` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LicenseTier" AS ENUM ('L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "AuthPolicyPrimary" AS ENUM ('password', 'sso');

-- CreateEnum
CREATE TYPE "AuthPolicyMfa" AS ENUM ('off', 'optional', 'required');

-- CreateEnum
CREATE TYPE "AuthPolicyIdentifier" AS ENUM ('email', 'username');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('WAREHOUSE', 'STORE', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PURCHASE', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN_IN', 'RETURN_OUT', 'DAMAGE', 'EXPIRED', 'INITIAL');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY', 'GOVERNMENT', 'NONPROFIT');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SALES', 'PURCHASE', 'RETURN', 'TRANSFER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'PROFORMA');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('RECEIVED', 'REFUND', 'CREDIT', 'ADVANCE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CURRENT', 'FIXED');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('IT_EQUIPMENT', 'FURNITURE', 'VEHICLE', 'MACHINERY', 'OFFICE_EQUIPMENT', 'CASH', 'ACCOUNTS_RECEIVABLE', 'INVENTORY', 'INVESTMENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DISPOSED', 'RESERVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE', 'NONE');

-- CreateEnum
CREATE TYPE "EInvoiceType" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'REFUND_NOTE', 'SELF_BILLED', 'SELF_BILLED_CREDIT_NOTE', 'SELF_BILLED_DEBIT_NOTE', 'SELF_BILLED_REFUND_NOTE');

-- CreateEnum
CREATE TYPE "EInvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SUBMITTED', 'VALID', 'INVALID', 'CANCELLED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "LhdnEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- DropForeignKey
ALTER TABLE "public"."assets" DROP CONSTRAINT "assets_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendances" DROP CONSTRAINT "attendances_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendances" DROP CONSTRAINT "attendances_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."categories" DROP CONSTRAINT "categories_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."categories" DROP CONSTRAINT "categories_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."departments" DROP CONSTRAINT "departments_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."departments" DROP CONSTRAINT "departments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."departments" DROP CONSTRAINT "departments_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."einvoice_items" DROP CONSTRAINT "einvoice_items_einvoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."einvoice_items" DROP CONSTRAINT "einvoice_items_invoice_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."einvoice_logs" DROP CONSTRAINT "einvoice_logs_einvoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."einvoices" DROP CONSTRAINT "einvoices_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."einvoices" DROP CONSTRAINT "einvoices_original_einvoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."einvoices" DROP CONSTRAINT "einvoices_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_department_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_position_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_items" DROP CONSTRAINT "inventory_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_items" DROP CONSTRAINT "inventory_items_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_items" DROP CONSTRAINT "inventory_items_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_movements" DROP CONSTRAINT "inventory_movements_from_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_movements" DROP CONSTRAINT "inventory_movements_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_movements" DROP CONSTRAINT "inventory_movements_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_movements" DROP CONSTRAINT "inventory_movements_to_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."inventory_movements" DROP CONSTRAINT "inventory_movements_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_items" DROP CONSTRAINT "invoice_items_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_items" DROP CONSTRAINT "invoice_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leaves" DROP CONSTRAINT "leaves_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leaves" DROP CONSTRAINT "leaves_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."lhdn_credentials" DROP CONSTRAINT "lhdn_credentials_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."lhdn_tokens" DROP CONSTRAINT "lhdn_tokens_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."licenses" DROP CONSTRAINT "licenses_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_received_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_items" DROP CONSTRAINT "payroll_items_payroll_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_items" DROP CONSTRAINT "payroll_items_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payrolls" DROP CONSTRAINT "payrolls_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payrolls" DROP CONSTRAINT "payrolls_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."positions" DROP CONSTRAINT "positions_department_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."positions" DROP CONSTRAINT "positions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recruitment_applications" DROP CONSTRAINT "recruitment_applications_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recruitment_applications" DROP CONSTRAINT "recruitment_applications_job_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recruitment_applications" DROP CONSTRAINT "recruitment_applications_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recruitment_jobs" DROP CONSTRAINT "recruitment_jobs_department_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recruitment_jobs" DROP CONSTRAINT "recruitment_jobs_position_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recruitment_jobs" DROP CONSTRAINT "recruitment_jobs_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."roles" DROP CONSTRAINT "roles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."supplier_products" DROP CONSTRAINT "supplier_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."supplier_products" DROP CONSTRAINT "supplier_products_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."suppliers" DROP CONSTRAINT "suppliers_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."training_records" DROP CONSTRAINT "training_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."training_records" DROP CONSTRAINT "training_records_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."training_records" DROP CONSTRAINT "training_records_training_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."trainings" DROP CONSTRAINT "trainings_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."warehouses" DROP CONSTRAINT "warehouses_tenant_id_fkey";

-- DropTable
DROP TABLE "public"."assets";

-- DropTable
DROP TABLE "public"."attendances";

-- DropTable
DROP TABLE "public"."audit_logs";

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."customers";

-- DropTable
DROP TABLE "public"."departments";

-- DropTable
DROP TABLE "public"."einvoice_items";

-- DropTable
DROP TABLE "public"."einvoice_logs";

-- DropTable
DROP TABLE "public"."einvoices";

-- DropTable
DROP TABLE "public"."employees";

-- DropTable
DROP TABLE "public"."inventory_items";

-- DropTable
DROP TABLE "public"."inventory_movements";

-- DropTable
DROP TABLE "public"."invoice_items";

-- DropTable
DROP TABLE "public"."invoices";

-- DropTable
DROP TABLE "public"."leaves";

-- DropTable
DROP TABLE "public"."lhdn_credentials";

-- DropTable
DROP TABLE "public"."lhdn_tokens";

-- DropTable
DROP TABLE "public"."licenses";

-- DropTable
DROP TABLE "public"."order_items";

-- DropTable
DROP TABLE "public"."orders";

-- DropTable
DROP TABLE "public"."payments";

-- DropTable
DROP TABLE "public"."payroll_items";

-- DropTable
DROP TABLE "public"."payrolls";

-- DropTable
DROP TABLE "public"."permissions";

-- DropTable
DROP TABLE "public"."positions";

-- DropTable
DROP TABLE "public"."products";

-- DropTable
DROP TABLE "public"."recruitment_applications";

-- DropTable
DROP TABLE "public"."recruitment_jobs";

-- DropTable
DROP TABLE "public"."refresh_tokens";

-- DropTable
DROP TABLE "public"."role_permissions";

-- DropTable
DROP TABLE "public"."roles";

-- DropTable
DROP TABLE "public"."supplier_products";

-- DropTable
DROP TABLE "public"."suppliers";

-- DropTable
DROP TABLE "public"."tenants";

-- DropTable
DROP TABLE "public"."training_records";

-- DropTable
DROP TABLE "public"."trainings";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."warehouses";

-- DropEnum
DROP TYPE "public"."ApplicationStatus";

-- DropEnum
DROP TYPE "public"."AssetCategory";

-- DropEnum
DROP TYPE "public"."AssetStatus";

-- DropEnum
DROP TYPE "public"."AssetType";

-- DropEnum
DROP TYPE "public"."AttendanceStatus";

-- DropEnum
DROP TYPE "public"."CustomerType";

-- DropEnum
DROP TYPE "public"."DepreciationMethod";

-- DropEnum
DROP TYPE "public"."EInvoiceStatus";

-- DropEnum
DROP TYPE "public"."EInvoiceType";

-- DropEnum
DROP TYPE "public"."EmploymentStatus";

-- DropEnum
DROP TYPE "public"."EmploymentType";

-- DropEnum
DROP TYPE "public"."Gender";

-- DropEnum
DROP TYPE "public"."InvoiceStatus";

-- DropEnum
DROP TYPE "public"."InvoiceType";

-- DropEnum
DROP TYPE "public"."LeaveStatus";

-- DropEnum
DROP TYPE "public"."LeaveType";

-- DropEnum
DROP TYPE "public"."LhdnEnvironment";

-- DropEnum
DROP TYPE "public"."LicenseTier";

-- DropEnum
DROP TYPE "public"."MaritalStatus";

-- DropEnum
DROP TYPE "public"."MovementType";

-- DropEnum
DROP TYPE "public"."OrderStatus";

-- DropEnum
DROP TYPE "public"."OrderType";

-- DropEnum
DROP TYPE "public"."PaymentMethod";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."PaymentType";

-- DropEnum
DROP TYPE "public"."PayrollItemType";

-- DropEnum
DROP TYPE "public"."PayrollStatus";

-- DropEnum
DROP TYPE "public"."ProductStatus";

-- DropEnum
DROP TYPE "public"."RecruitmentStatus";

-- DropEnum
DROP TYPE "public"."TenantStatus";

-- DropEnum
DROP TYPE "public"."TrainingRecordStatus";

-- DropEnum
DROP TYPE "public"."TrainingStatus";

-- DropEnum
DROP TYPE "public"."UserRole";

-- DropEnum
DROP TYPE "public"."WarehouseType";

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(255),
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "tier" "LicenseTier" NOT NULL DEFAULT 'L1',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "auth_policy_primary" "AuthPolicyPrimary" NOT NULL DEFAULT 'password',
    "auth_policy_mfa" "AuthPolicyMfa" NOT NULL DEFAULT 'off',
    "auth_policy_identifier" "AuthPolicyIdentifier" NOT NULL DEFAULT 'email',
    "auth_policy_allow_fallback" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "role_id" UUID,
    "avatar" VARCHAR(500),
    "phone" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(45),
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tier" "LicenseTier" NOT NULL,
    "license_key" VARCHAR(255) NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "max_products" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "sku" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(50) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "max_stock" INTEGER NOT NULL DEFAULT 10000,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "reorder_qty" INTEGER NOT NULL DEFAULT 0,
    "weight" DECIMAL(10,3),
    "dimensions" JSONB,
    "images" JSONB NOT NULL DEFAULT '[]',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "manager" VARCHAR(255),
    "type" "WarehouseType" NOT NULL DEFAULT 'WAREHOUSE',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,
    "available_qty" INTEGER NOT NULL DEFAULT 0,
    "batch_number" VARCHAR(100),
    "lot_number" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "expiry_date" TIMESTAMP(3),
    "location" VARCHAR(100),
    "cost_price" DECIMAL(12,2),
    "last_counted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "from_warehouse_id" UUID,
    "to_warehouse_id" UUID,
    "user_id" UUID NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(12,2),
    "reference" VARCHAR(100),
    "reference_type" VARCHAR(50),
    "batch_number" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "mobile" VARCHAR(50),
    "fax" VARCHAR(50),
    "website" VARCHAR(255),
    "tax_id" VARCHAR(50),
    "billing_address" JSONB,
    "shipping_address" JSONB,
    "payment_terms" INTEGER NOT NULL DEFAULT 30,
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_person" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "mobile" VARCHAR(50),
    "fax" VARCHAR(50),
    "website" VARCHAR(255),
    "tax_id" VARCHAR(50),
    "address" JSONB,
    "bank_details" JSONB,
    "payment_terms" INTEGER NOT NULL DEFAULT 30,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "lead_time" INTEGER NOT NULL DEFAULT 7,
    "minimum_order" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "rating" SMALLINT,
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_sku" VARCHAR(100),
    "unit_price" DECIMAL(12,2) NOT NULL,
    "min_order_qty" INTEGER NOT NULL DEFAULT 1,
    "lead_time" INTEGER,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "last_order_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "customer_id" UUID,
    "supplier_id" UUID,
    "warehouse_id" UUID,
    "created_by_id" UUID NOT NULL,
    "approved_by_id" UUID,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "shipped_date" TIMESTAMP(3),
    "delivered_date" TIMESTAMP(3),
    "shipping_address" JSONB,
    "billing_address" JSONB,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_type" VARCHAR(20),
    "total" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "exchange_rate" DECIMAL(10,6) NOT NULL DEFAULT 1,
    "payment_terms" INTEGER,
    "payment_method" VARCHAR(50),
    "notes" TEXT,
    "internal_notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "shipped_qty" INTEGER NOT NULL DEFAULT 0,
    "received_qty" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_type" VARCHAR(20),
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID,
    "customer_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'INVOICE',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "exchange_rate" DECIMAL(10,6) NOT NULL DEFAULT 1,
    "notes" TEXT,
    "terms" TEXT,
    "footer" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "product_id" UUID,
    "sku" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID,
    "customer_id" UUID NOT NULL,
    "received_by_id" UUID NOT NULL,
    "payment_number" VARCHAR(50) NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'RECEIVED',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "exchange_rate" DECIMAL(10,6) NOT NULL DEFAULT 1,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" VARCHAR(255),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "entity_name" VARCHAR(255),
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "request_id" VARCHAR(100),
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "asset_tag" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "asset_type" "AssetType" NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "location" VARCHAR(255) NOT NULL,
    "assigned_to" VARCHAR(255),
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "purchase_cost" DECIMAL(12,2) NOT NULL,
    "current_value" DECIMAL(12,2) NOT NULL,
    "depreciation_method" "DepreciationMethod" NOT NULL DEFAULT 'STRAIGHT_LINE',
    "useful_life_years" INTEGER,
    "salvage_value" DECIMAL(12,2),
    "warranty_expiry" TIMESTAMP(3),
    "serial_number" VARCHAR(100),
    "manufacturer" VARCHAR(255),
    "model" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "einvoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "invoice_type" "EInvoiceType" NOT NULL,
    "status" "EInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "lhdn_uuid" VARCHAR(100),
    "lhdn_long_id" VARCHAR(255),
    "lhdn_submission_uid" VARCHAR(100),
    "submitted_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "request_json" JSONB,
    "response_json" JSONB,
    "document_hash" VARCHAR(255),
    "reject_reason" TEXT,
    "validation_errors" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_retry_at" TIMESTAMP(3),
    "original_einvoice_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "einvoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "einvoice_items" (
    "id" UUID NOT NULL,
    "einvoice_id" UUID NOT NULL,
    "invoice_item_id" UUID,
    "classification_code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit_code" VARCHAR(10) NOT NULL,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "tax_type" VARCHAR(10) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "tax_exempt_reason" VARCHAR(255),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "einvoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "einvoice_logs" (
    "id" UUID NOT NULL,
    "einvoice_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "status" "EInvoiceStatus" NOT NULL,
    "message" TEXT,
    "request_data" JSONB,
    "response_data" JSONB,
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "einvoice_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lhdn_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "access_token" TEXT NOT NULL,
    "token_type" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lhdn_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lhdn_credentials" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" VARCHAR(255) NOT NULL,
    "client_secret_encrypted" TEXT NOT NULL,
    "tin" VARCHAR(50) NOT NULL,
    "brn" VARCHAR(50),
    "id_type" VARCHAR(20) NOT NULL,
    "id_value" VARCHAR(50) NOT NULL,
    "environment" "LhdnEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lhdn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_capabilities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_audits" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_id" UUID NOT NULL,
    "document_number" VARCHAR(100),
    "printer_name" VARCHAR(255),
    "paper_size" VARCHAR(20),
    "copies" INTEGER NOT NULL DEFAULT 1,
    "print_mode" VARCHAR(20),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "print_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_tier_idx" ON "tenants"("tier");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_id_idx" ON "users"("tenant_id", "role_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_is_active_idx" ON "users"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE INDEX "roles_tenant_id_is_active_idx" ON "roles"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_tenant_id_idx" ON "licenses"("tenant_id");

-- CreateIndex
CREATE INDEX "licenses_license_key_idx" ON "licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_expires_at_idx" ON "licenses"("expires_at");

-- CreateIndex
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- CreateIndex
CREATE INDEX "categories_tenant_id_parent_id_idx" ON "categories"("tenant_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_slug_key" ON "categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_category_id_idx" ON "products"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_status_idx" ON "products"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "products_tenant_id_name_idx" ON "products"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_barcode_key" ON "products"("tenant_id", "barcode");

-- CreateIndex
CREATE INDEX "warehouses_tenant_id_idx" ON "warehouses"("tenant_id");

-- CreateIndex
CREATE INDEX "warehouses_tenant_id_is_default_idx" ON "warehouses"("tenant_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_tenant_id_code_key" ON "warehouses"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_idx" ON "inventory_items"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_product_id_idx" ON "inventory_items"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_warehouse_id_idx" ON "inventory_items"("tenant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_expiry_date_idx" ON "inventory_items"("tenant_id", "expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_tenant_id_product_id_warehouse_id_batch_num_key" ON "inventory_items"("tenant_id", "product_id", "warehouse_id", "batch_number");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_idx" ON "inventory_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_product_id_idx" ON "inventory_movements"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_type_idx" ON "inventory_movements"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_created_at_idx" ON "inventory_movements"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_reference_idx" ON "inventory_movements"("tenant_id", "reference");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "customers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "customers_tenant_id_type_idx" ON "customers"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "customers_tenant_id_is_active_idx" ON "customers"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_code_key" ON "customers"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_name_idx" ON "suppliers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_is_active_idx" ON "suppliers"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenant_id_code_key" ON "suppliers"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "supplier_products_tenant_id_idx" ON "supplier_products"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_products_product_id_idx" ON "supplier_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_products_tenant_id_supplier_id_product_id_key" ON "supplier_products"("tenant_id", "supplier_id", "product_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_type_idx" ON "orders"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "orders_tenant_id_status_idx" ON "orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "orders_tenant_id_customer_id_idx" ON "orders"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_supplier_id_idx" ON "orders"("tenant_id", "supplier_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_order_date_idx" ON "orders"("tenant_id", "order_date");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_customer_id_idx" ON "invoices"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_issue_date_idx" ON "invoices"("tenant_id", "issue_date");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_due_date_idx" ON "invoices"("tenant_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_product_id_idx" ON "invoice_items"("product_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_customer_id_idx" ON "payments"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_invoice_id_idx" ON "payments"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_payment_date_idx" ON "payments"("tenant_id", "payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tenant_id_payment_number_key" ON "payments"("tenant_id", "payment_number");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_user_id_idx" ON "audit_logs"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_idx" ON "audit_logs"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_entity_id_idx" ON "audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_action_idx" ON "audit_logs"("tenant_id", "action");

-- CreateIndex
CREATE INDEX "assets_tenant_id_idx" ON "assets"("tenant_id");

-- CreateIndex
CREATE INDEX "assets_tenant_id_asset_type_idx" ON "assets"("tenant_id", "asset_type");

-- CreateIndex
CREATE INDEX "assets_tenant_id_category_idx" ON "assets"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "assets_tenant_id_status_idx" ON "assets"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "assets_tenant_id_location_idx" ON "assets"("tenant_id", "location");

-- CreateIndex
CREATE UNIQUE INDEX "assets_tenant_id_asset_tag_key" ON "assets"("tenant_id", "asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "einvoices_lhdn_uuid_key" ON "einvoices"("lhdn_uuid");

-- CreateIndex
CREATE INDEX "einvoices_tenant_id_idx" ON "einvoices"("tenant_id");

-- CreateIndex
CREATE INDEX "einvoices_tenant_id_status_idx" ON "einvoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "einvoices_tenant_id_invoice_id_idx" ON "einvoices"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "einvoices_lhdn_uuid_idx" ON "einvoices"("lhdn_uuid");

-- CreateIndex
CREATE INDEX "einvoices_lhdn_submission_uid_idx" ON "einvoices"("lhdn_submission_uid");

-- CreateIndex
CREATE INDEX "einvoice_items_einvoice_id_idx" ON "einvoice_items"("einvoice_id");

-- CreateIndex
CREATE INDEX "einvoice_logs_einvoice_id_idx" ON "einvoice_logs"("einvoice_id");

-- CreateIndex
CREATE INDEX "einvoice_logs_einvoice_id_created_at_idx" ON "einvoice_logs"("einvoice_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "lhdn_tokens_tenant_id_key" ON "lhdn_tokens"("tenant_id");

-- CreateIndex
CREATE INDEX "lhdn_tokens_tenant_id_idx" ON "lhdn_tokens"("tenant_id");

-- CreateIndex
CREATE INDEX "lhdn_tokens_expires_at_idx" ON "lhdn_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "lhdn_credentials_tenant_id_key" ON "lhdn_credentials"("tenant_id");

-- CreateIndex
CREATE INDEX "lhdn_credentials_tenant_id_idx" ON "lhdn_credentials"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_capabilities_tenant_id_idx" ON "tenant_capabilities"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_capabilities_code_idx" ON "tenant_capabilities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_capabilities_tenant_id_code_key" ON "tenant_capabilities"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "print_audits_tenant_id_idx" ON "print_audits"("tenant_id");

-- CreateIndex
CREATE INDEX "print_audits_tenant_id_user_id_idx" ON "print_audits"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "print_audits_tenant_id_document_type_idx" ON "print_audits"("tenant_id", "document_type");

-- CreateIndex
CREATE INDEX "print_audits_tenant_id_print_timestamp_idx" ON "print_audits"("tenant_id", "print_timestamp");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einvoices" ADD CONSTRAINT "einvoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einvoices" ADD CONSTRAINT "einvoices_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einvoices" ADD CONSTRAINT "einvoices_original_einvoice_id_fkey" FOREIGN KEY ("original_einvoice_id") REFERENCES "einvoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einvoice_items" ADD CONSTRAINT "einvoice_items_einvoice_id_fkey" FOREIGN KEY ("einvoice_id") REFERENCES "einvoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einvoice_items" ADD CONSTRAINT "einvoice_items_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "einvoice_logs" ADD CONSTRAINT "einvoice_logs_einvoice_id_fkey" FOREIGN KEY ("einvoice_id") REFERENCES "einvoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lhdn_tokens" ADD CONSTRAINT "lhdn_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lhdn_credentials" ADD CONSTRAINT "lhdn_credentials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_capabilities" ADD CONSTRAINT "tenant_capabilities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_audits" ADD CONSTRAINT "print_audits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_audits" ADD CONSTRAINT "print_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

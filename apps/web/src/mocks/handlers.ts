/**
 * MSW Request Handlers
 * Central export of all API mock handlers
 */

import { productsHandlers } from './handlers/products';
import { customersHandlers } from './handlers/customers';
import { ordersHandlers } from './handlers/orders';
import { invoicesHandlers } from './handlers/invoices';
import { paymentsHandlers } from './handlers/payments';
import { inventoryHandlers } from './handlers/inventory';
import { requisitionsHandlers, costCentersHandlers } from './handlers/requisitions';
import { assetsHandlers } from './handlers/assets';
import { recurringHandlers } from './handlers/recurring';
import { usersHandlers } from './handlers/users';
import { auditHandlers } from './handlers/audit';
import { dashboardHandlers } from './handlers/dashboard';
import { reportsHandlers } from './handlers/reports';
import { aiChatHandlers } from './handlers/ai-chat';
import { suppliersHandlers } from './handlers/suppliers';
import { warehousesHandlers } from './handlers/warehouses';

export const handlers = [
    ...productsHandlers,
    ...customersHandlers,
    ...ordersHandlers,
    ...invoicesHandlers,
    ...paymentsHandlers,
    ...inventoryHandlers,
    ...requisitionsHandlers,
    ...costCentersHandlers,
    ...assetsHandlers,
    ...recurringHandlers,
    ...usersHandlers,
    ...auditHandlers,
    ...dashboardHandlers,
    ...reportsHandlers,
    ...aiChatHandlers,
    ...suppliersHandlers,
    ...warehousesHandlers,
];

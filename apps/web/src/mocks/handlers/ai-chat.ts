/**
 * AI Chat MSW Handlers
 */
import { http, HttpResponse } from 'msw';

const mockSessions = [
    {
        id: '1',
        title: 'Inventory Analysis',
        createdAt: '2024-12-15T10:00:00Z',
        lastMessageAt: '2024-12-15T10:30:00Z',
    },
    {
        id: '2',
        title: 'Sales Forecast Help',
        createdAt: '2024-12-14T09:00:00Z',
        lastMessageAt: '2024-12-14T09:45:00Z',
    },
];

const mockResponses: Record<string, string> = {
    inventory: 'Based on your current inventory levels, I recommend restocking the following items: Wireless Mouse (current: 150, reorder point: 30), USB-C Hub (current: 75, reorder point: 20). Both items are above their reorder points.',
    sales: 'Looking at your sales data, you\'ve had a 12.5% increase in revenue this month compared to last month. Your top-selling product is the Wireless Mouse with 1,250 units sold.',
    default: 'I\'m your ERP AI assistant. I can help you with inventory analysis, sales forecasting, customer insights, and more. What would you like to know?',
};

export const aiChatHandlers = [
    // GET /api/v1/ai/sessions
    http.get('/api/v1/ai/sessions', () => {
        return HttpResponse.json({
            success: true,
            data: mockSessions,
        });
    }),

    // POST /api/v1/ai/chat
    http.post('/api/v1/ai/chat', async ({ request }) => {
        const body = await request.json() as { message: string };
        const message = body.message?.toLowerCase() || '';

        let response = mockResponses.default;
        if (message.includes('inventory')) {
            response = mockResponses.inventory;
        } else if (message.includes('sales') || message.includes('revenue')) {
            response = mockResponses.sales;
        }

        return HttpResponse.json({
            success: true,
            data: {
                id: String(Date.now()),
                role: 'assistant',
                content: response,
                createdAt: new Date().toISOString(),
            },
        });
    }),

    // POST /api/v1/ai/sessions
    http.post('/api/v1/ai/sessions', async ({ request }) => {
        const body = await request.json() as { title?: string };
        const newSession = {
            id: String(mockSessions.length + 1),
            title: body.title || 'New Conversation',
            createdAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
        };
        mockSessions.push(newSession);
        return HttpResponse.json({ success: true, data: newSession }, { status: 201 });
    }),
];

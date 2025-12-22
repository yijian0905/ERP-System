/**
 * Users MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockUsers } from '../data/users';

export const usersHandlers = [
    // GET /api/v1/users
    http.get('/api/v1/users', () => {
        return HttpResponse.json({
            success: true,
            data: mockUsers,
            meta: { total: mockUsers.length, page: 1, limit: 50 },
        });
    }),

    // GET /api/v1/users/:id
    http.get('/api/v1/users/:id', ({ params }) => {
        const user = mockUsers.find((u) => u.id === params.id);
        if (!user) {
            return HttpResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: user });
    }),

    // POST /api/v1/users
    http.post('/api/v1/users', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        const newUser = {
            id: String(mockUsers.length + 1),
            isActive: true,
            lastLogin: null,
            createdAt: new Date().toISOString().split('T')[0],
            ...body,
        };
        mockUsers.push(newUser);
        return HttpResponse.json({ success: true, data: newUser }, { status: 201 });
    }),

    // PATCH /api/v1/users/:id
    http.patch('/api/v1/users/:id', async ({ params, request }) => {
        const index = mockUsers.findIndex((u) => u.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
        const body = await request.json() as Record<string, unknown>;
        mockUsers[index] = { ...mockUsers[index], ...body };
        return HttpResponse.json({ success: true, data: mockUsers[index] });
    }),

    // DELETE /api/v1/users/:id
    http.delete('/api/v1/users/:id', ({ params }) => {
        const index = mockUsers.findIndex((u) => u.id === params.id);
        if (index === -1) {
            return HttpResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
        mockUsers.splice(index, 1);
        return HttpResponse.json({ success: true, data: { message: 'User deleted' } });
    }),
];

import 'dotenv/config';

import { buildServer } from './server.js';
import { logger } from './lib/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  try {
    const server = await buildServer();

    await server.listen({ port: PORT, host: HOST });

    logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
    logger.info(`📚 API Documentation at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

main();


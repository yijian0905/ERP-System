/**
 * MSW Browser Worker Setup
 * @see https://mswjs.io/docs/integrations/browser
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

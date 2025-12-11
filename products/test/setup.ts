import { Registry } from 'prom-client';

// Ensure prom-client registry is reset between tests
(global as any).__PROM_REGISTRY__ = new Registry();


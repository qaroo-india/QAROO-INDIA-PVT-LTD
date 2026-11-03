/**
 * Compatibility rate-limit store for serverless environment.
 * Express-rate-limit defaults to standard MemoryStore when undefined.
 */

export const sharedStore = (_name) => undefined;

export class MongoRateLimitStore {
  constructor(_name) {}
}

export default { sharedStore, MongoRateLimitStore };

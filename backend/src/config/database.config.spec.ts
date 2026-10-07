import { databaseConfig } from './database.config';

describe('production schema safety', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.DB_SYNCHRONIZE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not synchronize production schemas by default', () => {
    expect(databaseConfig().synchronize).toBe(false);
  });

  it('allows explicit first-time schema initialization', () => {
    process.env.DB_SYNCHRONIZE = 'true';
    expect(databaseConfig().synchronize).toBe(true);
  });

  it('preserves the development default and supports disabling it', () => {
    process.env.NODE_ENV = 'development';
    expect(databaseConfig().synchronize).toBe(true);
    process.env.DB_SYNCHRONIZE = 'false';
    expect(databaseConfig().synchronize).toBe(false);
  });
});

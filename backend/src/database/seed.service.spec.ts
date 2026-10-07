import { SeedService } from './seed.service';

describe('production seed safety', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not access repositories or reset passwords in production', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      SEED_ENABLED: 'true',
    };
    const repository = {
      query: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const service = new SeedService(
      repository as never,
      repository as never,
      repository as never,
      repository as never,
    );
    await service.onModuleInit();
    await service.onApplicationBootstrap();
    expect(repository.query).not.toHaveBeenCalled();
    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});

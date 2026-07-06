import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../src/interfaces/http/health/health.controller';
import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn().mockResolvedValue({ status: 'ok', details: {} }),
    };

    const mockMemoryIndicator = {
      checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
      checkRSS: jest.fn().mockResolvedValue({ memory_rss: { status: 'up' } }),
    };

    const mockDiskIndicator = {
      checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: MemoryHealthIndicator, useValue: mockMemoryIndicator },
        { provide: DiskHealthIndicator, useValue: mockDiskIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('check() calls HealthCheckService.check()', async () => {
    await controller.check();
    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
  });

  it('check() returns status ok', async () => {
    const result = await controller.check();
    expect(result).toMatchObject({ status: 'ok' });
  });
});

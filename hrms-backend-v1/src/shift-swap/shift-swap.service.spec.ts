import { Test, TestingModule } from '@nestjs/testing';
import { ShiftSwapService } from './shift-swap.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ShiftSwapService', () => {
  let service: ShiftSwapService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftSwapService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
            schedule: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
            },
            shiftSwapRequest: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            shiftAssignmentOverride: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              upsert: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ShiftSwapService>(ShiftSwapService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });
});

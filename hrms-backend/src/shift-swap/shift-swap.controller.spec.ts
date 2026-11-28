import { Test, TestingModule } from '@nestjs/testing';
import { ShiftSwapController } from './shift-swap.controller';
import { ShiftSwapService } from './shift-swap.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('ShiftSwapController', () => {
  let controller: ShiftSwapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftSwapController],
      providers: [
        {
          provide: ShiftSwapService,
          useValue: {
            createRequest: jest.fn(),
            respondToRequest: jest.fn(),
            approveRequest: jest.fn(),
            cancelRequest: jest.fn(),
            acknowledgeCancellation: jest.fn(),
            approveCancellation: jest.fn(),
            getMyRequests: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ShiftSwapController>(ShiftSwapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

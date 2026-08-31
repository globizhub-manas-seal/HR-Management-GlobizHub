import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('EmployeeController', () => {
  let controller: EmployeeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: Reflector, useValue: new Reflector() },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

// user/user.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createEmployee(dto: CreateEmployeeDto, adminUser: any) {
    if (!adminUser.isAdmin) {
      throw new ForbiddenException('Apenas admins podem criar funcionários.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        isAdmin: false,
        companyId: adminUser.companyId,
      },
    });
  }

  async getEmployees(adminUser: any) {
    if (!adminUser.isAdmin){
      throw new ForbiddenException('Only admins can list employees.');
    }
    return this.prisma.user.findMany({
      where: { companyId: adminUser.companyId},
    });
  }
}

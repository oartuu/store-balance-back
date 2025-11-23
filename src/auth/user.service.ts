// user/user.service.ts
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
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

    const valid = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (valid) {
      throw new BadRequestException('Email já cadastrado.');
    }


    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        isAdmin: dto.isAdmin,
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
  async getUserDetails(user: any) {
    const userData = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        isAdmin: true,
        name: true,
      },
    });

    if (!userData) {
      throw new Error('User not found');
    }

    // `user` aqui é um objeto que tem `id` e `name`
    return userData;
  }
}

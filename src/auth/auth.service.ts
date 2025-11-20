import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async registerAdmin(dto: RegisterAdminDto) {
    /* --------------------CREATE COMPANY-----------------------*/
    const existingCompany = await this.prisma.company.findUnique({
      where: { name: dto.companyName },
    });
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingCompany) {
      throw new ForbiddenException('Empresa já cadastrada');
    }

    if (existingEmail) {
      throw new ForbiddenException('Email já cadastrado');
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
      },
    });

    /* --------------------CREATE COMPANY LINKED ADMIN-----------------------*/

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        isAdmin: true,
        companyId: company.id,
      },
    });
    const token = await this.generateToken(user);

    return { user, company, token };
  }
  /* --------------------GENERATE JWT-----------------------*/
  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      isAdmin: user.isAdmin,
    };

    return this.jwt.sign(payload);
  }

  /* --------------------CREATE EMPLOYEE-----------------------*/

  async createEmployee(dto: CreateEmployeeDto, adminUser: any) {
    if (!adminUser.isAdmin) {
      throw new ForbiddenException('Only admins can create employees.');
    }
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ForbiddenException('Email já cadastrado');
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

  /* --------------------USER LOGIN-----------------------*/

  async login(dto: LoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { name: dto.company },
    });

    if (!company) throw new ForbiddenException('Company not found');

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, companyId: company.id },
    });

    if (!user) throw new ForbiddenException('User or password invalid');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new ForbiddenException('User or password invalid');

    const token = await this.generateToken(user);

    return { user, token };
  }
}

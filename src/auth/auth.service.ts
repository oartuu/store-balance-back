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
    // 1️⃣ Criar empresa
    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
      },
    });

    // 2️⃣ Criar usuário admin vinculado à empresa
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

    // 3️⃣ Gerar token JWT
    const token = await this.generateToken(user);

    return { user, company, token };
  }

  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      isAdmin: user.isAdmin,
    };

    return this.jwt.sign(payload);
  }

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

  async login(dto: LoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { name: dto.company },
    });

    if (!company) throw new ForbiddenException('Empresa não encontrada');

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, companyId: company.id },
    });

    if (!user) throw new ForbiddenException('Usuário ou senha inválidos');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new ForbiddenException('Usuário ou senha inválidos');

    const token = await this.generateToken(user);

    return { user, token };
  }
}

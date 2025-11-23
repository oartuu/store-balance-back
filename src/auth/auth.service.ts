import { Injectable, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
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
      throw new BadRequestException('Empresa já cadastrada');
    }

    if (existingEmail) {
      throw new BadRequestException('Email já cadastrado');
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
    const accessToken = await this.generateAccessToken(user);
    const refreshTokenId = await this.generateRefreshTokenId(user);

    return { accessToken, refreshTokenId, user };
  }

  private async generateAccessToken(user: any) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      isAdmin: user.isAdmin,
    };
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
    });
  }
  /* --------------------GENERATE REFRESH TOKEN-----------------------*/
  private async generateRefreshTokenId(user: any) {
    // calcula o UNIX para o expiresAt
    const expireStr = this.config.get('JWT_REFRESH_EXPIRES_IN'); // ex: "7d"
    const ms = require('ms');
    const expiresInMs = ms(expireStr);

    // converte para segundos usando dayjs
    const expiresAtUnix = dayjs().add(expiresInMs, 'millisecond').unix();

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: expiresAtUnix,
      },
    });

    return refreshTokenRecord.id;
  }
  /* --------------------USER LOGIN-----------------------*/

  async login(dto: LoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { name: dto.companyName },
    });

    if (!company) throw new BadRequestException('Company not found');

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, companyId: company.id },
    });

    if (!user) throw new ForbiddenException('User or password invalid');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new ForbiddenException('User or password invalid');

    const accessToken = await this.generateAccessToken(user);
    const refreshTokenId = await this.generateRefreshTokenId(user);

    return { accessToken, refreshTokenId, user };
  }
//logout
  async logout(refreshTokenId: string) {
    if (!refreshTokenId) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Tenta deletar o token no banco
    await this.prisma.refreshToken.delete({
      where: { id: refreshTokenId },
    });

    // (Opcional) Se você quiser, pode também deletar todos os tokens do usuário:
    // await this.prisma.refreshToken.deleteMany({ where: { userId: userId } });

    return { ok: true };
  }

  /* -------------------- REFRESH TOKENS -----------------------*/
  async refreshTokens(oldRefreshTokenId: string) {
    // 1. Buscar no banco o token antigo
    const existing = await this.prisma.refreshToken.findUnique({
      where: { id: oldRefreshTokenId },
    });
    if (!existing) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // 2. Verificar se expirou
    const nowUnix = dayjs().unix();
    if (existing.expiresAt < nowUnix) {
      // token expirou — remover e negar
      await this.prisma.refreshToken.delete({
        where: { id: oldRefreshTokenId },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    // 3. Obter o usuário
    const user = await this.prisma.user.findUnique({
      where: { id: existing.userId },
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 4. Gerar novos tokens
    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshTokenId = await this.generateRefreshTokenId(user);

    // 5. Deletar o refresh token antigo (rotação)
    await this.prisma.refreshToken.delete({
      where: { id: oldRefreshTokenId },
    });

    return {
      accessToken: newAccessToken,
      refreshTokenId: newRefreshTokenId,
      user,
    };
  }
}
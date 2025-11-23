import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshDto } from './dto/refresh-tokens.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private config: ConfigService,
  ) {}

  /* ---------------------------- REGISTER ADMIN + COMPANY -----------------*/
  @Post('register')
  async registerAdmin(
    @Body() dto: RegisterAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshTokenId, user } =
      await this.authService.registerAdmin(dto);
    res.cookie('refreshTokenId', refreshTokenId, {
      httpOnly: true,
      secure: true, // garante envio só via HTTPS em produção
      sameSite: 'strict', // ou o que fizer sentido pra sua política
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')), // milissegundos
    });

    res.cookie('userName', user.name, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });
    res.cookie('isAdmin', user.isAdmin, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });

    return { accessToken };
  }

  /* --------------------USER LOGIN-----------------------*/
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshTokenId, user } = await this.authService.login(dto);

    // define o cookie com o refreshTokenId
    res.cookie('refreshTokenId', refreshTokenId, {
      httpOnly: true,
      secure: true, // garante envio só via HTTPS em produção
      sameSite: 'strict', // ou o que fizer sentido pra sua política
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')), // milissegundos
    });
    res.cookie('userName', user.name, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });
    res.cookie('isAdmin', user.isAdmin, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });


    // retorna o access token no body (ou outros dados que você quiser)

    return { accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshTokenId = req.cookies['refreshTokenId'];

    // Chama serviço para deletar refresh token no DB
    await this.authService.logout(refreshTokenId);

    // Limpa o cookie no client
    res.clearCookie('refreshTokenId', {
      httpOnly: true,
      secure: true, // depende do seu ambiente
      sameSite: 'strict',
      path: '/', // importante: usar o mesmo path que você usou ao setar
    });
    
    res.clearCookie('isAdmin', {
      httpOnly: false,
      secure: true, // depende do seu ambiente
      sameSite: 'strict',
      path: '/', // importante: usar o mesmo path que você usou ao setar
    });
    res.clearCookie('userName', {
      httpOnly: false,
      secure: true, // depende do seu ambiente
      sameSite: 'strict',
      path: '/', // importante: usar o mesmo path que você usou ao setar
    });
    

    return { message: 'Logout successful' };
  }

  /* --------------------CREATE EMPLOYEE (ADMIN ONLY)-----------------------*/

  @UseGuards(JwtAuthGuard)
  @Post('employees')
  async createEmployee(@Body() dto: CreateEmployeeDto, @Req() req) {
    // req.user é injetado pelo JWT guard e contém: userId, companyId, isAdmin
    return this.userService.createEmployee(dto, req.user);
  }
  /* --------------------LIST EMPLOYEES (ADMIN ONLY)-----------------------*/
  @UseGuards(JwtAuthGuard)
  @Get('employees')
  async getEmployees(@Req() req) {
    return this.userService.getEmployees(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserDetails(@Req() req, @Res({ passthrough: true }) res: Response) {
    const data = await this.userService.getUserDetails(req.user);

    res.cookie('userName', data.name, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });
    res.cookie('isAdmin', data.isAdmin, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });

    return data;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenId = req.cookies['refreshTokenId'];
    if (!refreshTokenId) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const { accessToken, refreshTokenId: newRefreshTokenId,user } =
      await this.authService.refreshTokens(refreshTokenId);

    // define o novo cookie
    res.cookie('refreshTokenId', newRefreshTokenId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });
    res.cookie('userName', user.name, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });
    res.cookie('isAdmin', user.isAdmin, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: require('ms')(this.config.get('JWT_REFRESH_EXPIRES_IN')),
    });

    // devolve o novo access token
    return { accessToken };
  }
}

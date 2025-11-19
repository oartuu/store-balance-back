import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  /* ---------------------------- REGISTER ADMIN + COMPANY -----------------*/
  @Post('register')
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  /* --------------------USER LOGIN-----------------------*/
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /* --------------------CREATE EMPLOYEE (ADMIN ONLY)-----------------------*/

  @UseGuards(JwtAuthGuard)
  @Post('employees')
  async createEmployee(@Body() dto: CreateEmployeeDto, @Req() req) {
    // req.user é injetado pelo JWT guard e contém: userId, companyId, isAdmin
    return this.userService.createEmployee(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('employees')
  async getEmployees(@Req() req) {
    return this.userService.getEmployees(req.user.companyId);
  }
}

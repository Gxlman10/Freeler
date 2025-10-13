import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

class LoginDto {
  email!: string;
  password!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('empresa/login')
  async loginEmpresa(@Body() dto: LoginDto) {
    const token = await this.auth.loginEmpresa(dto.email, dto.password);
    if (!token) throw new UnauthorizedException('INVALID_CREDENTIALS');
    return token;
  }

  @Post('freeler/login')
  async loginFreeler(@Body() dto: LoginDto) {
    const token = await this.auth.loginFreeler(dto.email, dto.password);
    if (!token) throw new UnauthorizedException('INVALID_CREDENTIALS');
    return token;
  }
}

export default AuthController;

import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './infrastructure/dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { CreateEmpresaUseCase } from '../empresas/application/use-cases/create-empresa.use-case';
import { CreateUsuarioEmpresaUseCase } from '../usuarios-empresa/application/use-cases/create-usuario-empresa.use-case';
import { RegisterEmpresaDto } from './infrastructure/dto/register-empresa.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly createEmpresaUC: CreateEmpresaUseCase,
    private readonly createUsuarioEmpresaUC: CreateUsuarioEmpresaUseCase,
  ) {}

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

  // Registro de Empresa + Usuario empresa (admin por defecto) devolviendo JWT
  @Post('empresa/register')
  async registerEmpresa(@Body() dto: RegisterEmpresaDto) {
    const empresa = await this.createEmpresaUC.execute({
      razon_social: dto.nombre_empresa,
      ruc: dto.ruc,
      direccion: dto.direccion,
      telefono: dto.telefono,
      email: dto.email,
    });

    const usuario = await this.createUsuarioEmpresaUC.execute({
      id_empresa: Number(empresa.id_empresa),
      // id_rol opcional; si hay seed de roles puedes setear 1 o 2. Lo dejamos sin asignar.
      id_rol: 1,
      nombres: 'Admin',
      apellidos: 'Empresa',
      email: dto.email,
      password: dto.password,
      estado: 1,
    } as unknown as any);

    const payload = {
      sub: (usuario as any).id_usuario_empresa,
      type: 'empresa' as const,
      email: usuario.email,
      role: 'admin' as const,
    };
    return { access_token: await this.jwt.signAsync(payload) };
  }
}

export default AuthController;

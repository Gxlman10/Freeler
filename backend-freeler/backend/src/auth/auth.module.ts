import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosEmpresaModule } from '../usuarios-empresa/usuarios-empresa.module';
import { UsuariosFreelerModule } from '../usuarios-freeler/usuarios-freeler.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('jwt.secret'),
        signOptions: { expiresIn: cfg.get<string>('jwt.expiresIn') },
      }),
    }),
    UsuariosEmpresaModule,
    UsuariosFreelerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

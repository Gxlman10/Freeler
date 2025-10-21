import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioFreelerEntity } from './infrastructure/entities/usuario-freeler.entity';
import { UsuariosFreelerController } from './presentation/usuarios-freeler.controller';
import { USUARIO_FREELER_REPOSITORY } from './application/interfaces/usuario-freeler.repository.interface';
import { TypeormUsuarioFreelerRepository } from './infrastructure/repositories/typeorm-usuario-freeler.repository';

import { RegisterUsuarioFreelerUseCase } from './application/use-cases/register-usuario-freeler.use-case';
import { FindUsuarioFreelerUseCase } from './application/use-cases/find-usuario-freeler.use-case';
import { UpdateUsuarioFreelerUseCase } from './application/use-cases/update-usuario-freeler.use-case';
import { GetUsuarioStatsUseCase } from './application/use-cases/get-usuario-stats.use-case';
import { ListUsuariosFreelerUseCase } from './application/use-cases/list-usuarios-freeler.use-case';
import { SoftDeleteUsuarioFreelerUseCase } from './application/use-cases/soft-delete-usuario-freeler.use-case';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioFreelerEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('jwt.secret'),
        signOptions: { expiresIn: cfg.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [UsuariosFreelerController],
  providers: [
    {
      provide: USUARIO_FREELER_REPOSITORY,
      useClass: TypeormUsuarioFreelerRepository,
    },
    RegisterUsuarioFreelerUseCase,
    FindUsuarioFreelerUseCase,
    UpdateUsuarioFreelerUseCase,
    GetUsuarioStatsUseCase,
    ListUsuariosFreelerUseCase,
    SoftDeleteUsuarioFreelerUseCase,
  ],
  exports: [USUARIO_FREELER_REPOSITORY],
})
export class UsuariosFreelerModule {}
export default UsuariosFreelerModule;

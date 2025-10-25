import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './shared/infrastructure/config/app.config';
import dbConfig from './shared/infrastructure/config/database.config';
import jwtConfig from './shared/infrastructure/config/jwt.config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Features
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosFreelerModule } from './usuarios-freeler/usuarios-freeler.module';
import { EmpresasModule } from './empresas/empresas.module';
import { UsuariosEmpresaModule } from './usuarios-empresa/usuarios-empresa.module';
import { LeadsModule } from './leads/leads.module';
import { ComisionesModule } from './comisiones/comisiones.module';
import { AsignacionesModule } from './asignaciones/asignaciones.module';
import { CampanasModule } from './campanas/campanas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, jwtConfig],
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.get<{
          host: string;
          port: number;
          name: string;
          user: string;
          pass: string;
          ssl?: boolean;
        }>('database');

        if (!db) {
          throw new Error('Database configuration is not defined');
        }

        const useSsl = Boolean(db.ssl);
        const sslOptions = useSsl ? { rejectUnauthorized: false } : false;

        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          database: db.name,
          username: db.user,
          password: db.pass,
          entities: [__dirname + '/**/*.entity.{ts,js}'],
          autoLoadEntities: true,
          synchronize: false,
          schema: 'freeler',
          logging: ['error', 'query'],
          ssl: sslOptions,
          extra: {
            // mantiene conexiones activas más tiempo (RDS)
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 10,
          },
        };
      },
    }),

    // Features
    AuthModule,
    RolesModule,
    UsuariosFreelerModule,
    EmpresasModule,
    UsuariosEmpresaModule,
    LeadsModule,
    ComisionesModule,
    AsignacionesModule,
    CampanasModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.getNumber('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'media_service_db'),
        autoLoadEntities: true,
        synchronize: configService.getBoolean('DB_SYNCHRONIZE', false),
        migrationsRun: configService.getBoolean('DB_MIGRATIONS_RUN', false),
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      }),
    }),
  ],
})
export class DatabaseModule {}

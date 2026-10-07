import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DistrictsModule } from './modules/districts/districts.module';
import { MahallasModule } from './modules/mahallas/mahallas.module';
import { RolesModule } from './modules/roles/roles.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { ReviewQueueModule } from './modules/review-queue/review-queue.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    DistrictsModule,
    MahallasModule,
    RolesModule,
    CitizensModule,
    SurveysModule,
    ReviewQueueModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}

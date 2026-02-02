import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from './companies/companies.module';
import { SitesModule } from './sites/sites.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // これでアプリ全体で .env を使える
    }),
    CompaniesModule,
    SitesModule,
    SchedulesModule,
  ],
})
export class AppModule {}
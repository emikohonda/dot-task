import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from './companies/companies.module';
import { SitesModule } from './sites/sites.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ContractorsModule } from './contractors/contractors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // これでアプリ全体で .env を使える
    }),
    CompaniesModule,
    ContractorsModule,
    SitesModule,
    SchedulesModule,
  ],
})
export class AppModule {}
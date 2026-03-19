// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from './companies/companies.module';
import { SitesModule } from './sites/sites.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ContractorsModule } from './contractors/contractors.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CompaniesModule,
    ContractorsModule,
    SitesModule,
    SchedulesModule,
    EmployeesModule,
  ],
})
export class AppModule {}
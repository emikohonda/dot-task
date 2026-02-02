// src/companies/dto/create-company.dto.ts
export class CreateCompanyDto {
  name: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}
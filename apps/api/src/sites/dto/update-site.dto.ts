// apps/api/src/sites/dto/update-site.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteDto } from './create-site.dto';

export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
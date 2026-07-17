// apps/api/src/contractors/contractors.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { ContractorsService } from "./contractors.service";
import { CreateContractorDto } from "./dto/create-contractor.dto";
import { UpdateContractorDto } from "./dto/update-contractor.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrganizationMembershipGuard } from "../auth/organization-membership.guard";
import { CurrentMembership } from "../auth/current-membership.decorator";
import type { AuthMembership } from "../auth/auth-membership.type";

@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller("contractors")
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  create(
    @CurrentMembership() membership: AuthMembership,
    @Body() createContractorDto: CreateContractorDto
  ) {
    return this.contractorsService.create(
      membership.organizationId,
      createContractorDto
    );
  }

  @Get()
  findAll(
    @CurrentMembership() membership: AuthMembership,
    @Query("keyword") keyword?: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("offset", new ParseIntPipe({ optional: true })) offset?: number
  ) {
    return this.contractorsService.findAll(membership.organizationId, {
      keyword,
      limit,
      offset,
    });
  }

  @Get(":id")
  findOne(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.contractorsService.findOne(membership.organizationId, id);
  }

  @Patch(":id")
  update(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateContractorDto: UpdateContractorDto
  ) {
    return this.contractorsService.update(
      membership.organizationId,
      id,
      updateContractorDto
    );
  }

  @Delete(":id")
  remove(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.contractorsService.remove(membership.organizationId, id);
  }
}

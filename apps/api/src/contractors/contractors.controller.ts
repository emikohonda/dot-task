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
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth-user.type";

@UseGuards(JwtAuthGuard)
@Controller("contractors")
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() createContractorDto: CreateContractorDto
  ) {
    return this.contractorsService.create(
      user.organizationId,
      createContractorDto
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("keyword") keyword?: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("offset", new ParseIntPipe({ optional: true })) offset?: number
  ) {
    return this.contractorsService.findAll(user.organizationId, {
      keyword,
      limit,
      offset,
    });
  }

  @Get(":id")
  findOne(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.contractorsService.findOne(user.organizationId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateContractorDto: UpdateContractorDto
  ) {
    return this.contractorsService.update(
      user.organizationId,
      id,
      updateContractorDto
    );
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.contractorsService.remove(user.organizationId, id);
  }
}
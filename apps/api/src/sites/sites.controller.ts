// apps/api/src/sites/sites.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from "@nestjs/common";
import { SitesService } from "./sites.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";

@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  findAll(
    @Query("keyword")   keyword?:   string,
    @Query("companyId") companyId?: string,
    @Query("status")    status?:    string,
    @Query("tab")       tab?:       string,       // "active" | "done"
    @Query("sortDate")  sortDate?:  string,       // "asc" | "desc"
    @Query("monthFrom") monthFrom?: string,       // "YYYY-MM"
    @Query("monthTo")   monthTo?:   string,       // "YYYY-MM"
    @Query("limit",  new ParseIntPipe({ optional: true })) limit?:  number,
    @Query("offset", new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.sitesService.findAll({
      keyword,
      companyId,
      status,
      tab,
      sortDate,
      monthFrom,
      monthTo,
      limit,
      offset,
    });
  }

  @Get(":id")
  findOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.sitesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(id, updateSiteDto);
  }

  @Delete(":id")
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.sitesService.remove(id);
  }

  @Get(":id/schedules")
  findSchedulesBySiteId(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.sitesService.findSchedulesBySiteId(id, limit ?? 3);
  }
}

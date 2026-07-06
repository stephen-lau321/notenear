import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { DemandService } from "./demand.service";
import { CreateDemandDto } from "./dto/create-demand.dto";
import { CollectorAuthGuard } from "../common/guards/collector-auth.guard";

@Controller("demands")
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  /** 采集器提交需求（X-API-Key认证） */
  @Post()
  @UseGuards(CollectorAuthGuard)
  create(@Body() dto: CreateDemandDto) {
    return this.demandService.create(dto);
  }

  /** 需求列表（管理员/老师查看） */
  @Get()
  list(
    @Query("city") city?: string,
    @Query("instrument") instrument?: string,
    @Query("status") status?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string
  ) {
    return this.demandService.list({
      city,
      instrument,
      status,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  /** 需求详情 */
  @Get(":id")
  getById(@Param("id") id: string) {
    return this.demandService.getById(id);
  }

  /** 重新评分 */
  @Post(":id/rescore")
  rescore(@Param("id") id: string) {
    return this.demandService.rescore(id);
  }
}

import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { InstrumentService } from "./instrument.service";

@ApiTags("乐器")
@Controller({ path: "instruments", version: "1" })
export class InstrumentController {
  constructor(private svc: InstrumentService) {}

  @Get()
  @ApiOperation({ summary: "获取所有乐器（按分类分组）" })
  list() {
    return this.svc.listGrouped();
  }
}

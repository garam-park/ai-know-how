import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { APIResponse } from "@shared/types";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  getHealth(): APIResponse<{ status: string }> {
    return this.appService.getHealth();
  }
}

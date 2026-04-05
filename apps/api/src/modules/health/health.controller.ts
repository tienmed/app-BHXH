import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      service: "app-bhxh-api",
      date: "2026-04-03",
      mode: "pilot-skeleton"
    };
  }
}

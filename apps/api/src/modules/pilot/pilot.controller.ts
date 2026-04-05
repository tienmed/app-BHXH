import { Controller, Get } from "@nestjs/common";

@Controller("pilot")
export class PilotController {
  @Get("context")
  getContext() {
    return {
      careSetting: "outpatient",
      specialty: "internal-medicine",
      behavior: "recommendation-only",
      protocolSource: "Ministry of Health seed guidance",
      customizationMode: "future clinic-level overrides"
    };
  }
}

import { Controller, Post, Body } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  async chat(@Body() body: { history: any[], context: any }) {
    const reply = await this.aiService.chatWithDoctor(body.history, body.context);
    return { reply };
  }

  @Post("patient-guide")
  async getPatientGuide(@Body() context: { diagnoses: string[], medications: string[], cls: string[] }) {
    const guide = await this.aiService.generatePatientGuide(context);
    return { guide };
  }
}

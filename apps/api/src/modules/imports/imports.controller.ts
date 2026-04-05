import { Controller, Post } from "@nestjs/common";
import { ImportsService } from "./imports.service";

@Controller("imports")
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post("preview-sheets")
  previewSheets() {
    return this.importsService.getGoogleSheetsTemplate();
  }

  @Post("seed")
  async runSeed() {
    return await this.importsService.importSeedData();
  }
}

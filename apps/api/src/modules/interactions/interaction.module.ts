import { Module } from "@nestjs/common";
import { InteractionController } from "./interaction.controller";
import { InteractionService } from "./interaction.service";
import { PrismaService } from "../../common/prisma.service";
import { InteractionReportCronService } from "./interaction-report-cron.service";

@Module({
    controllers: [InteractionController],
    providers: [InteractionService, PrismaService, InteractionReportCronService],
    exports: [InteractionService]
})
export class InteractionModule { }

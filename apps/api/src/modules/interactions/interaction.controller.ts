import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { InteractionService } from "./interaction.service";

@Controller("interactions")
export class InteractionController {
    constructor(private readonly interactionService: InteractionService) { }

    @Post("feedback")
    async submitFeedback(@Body() payload: any) {
        return this.interactionService.saveFeedback(payload);
    }

    @Get("feedback")
    async getPeerFeedback(
        @Query("icdCode") icdCode: string,
        @Query("targetName") targetName: string
    ) {
        return this.interactionService.getRecentFeedback(icdCode, targetName);
    }

    @Post("dismissal")
    async trackDismissal(@Body() payload: any) {
        return this.interactionService.saveDismissal(payload);
    }
}

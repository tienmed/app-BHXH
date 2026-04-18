import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class InteractionService {
    constructor(private prisma: PrismaService) { }

    async saveFeedback(payload: any) {
        try {
            if (!this.prisma.doctorFeedback) return { ok: false };
            return await this.prisma.doctorFeedback.create({
                data: {
                    icdCode: payload.icdCode,
                    icdName: payload.icdName,
                    feedbackType: payload.feedbackType,
                    targetType: payload.targetType,
                    targetName: payload.targetName,
                    note: payload.note,
                    doctorId: payload.doctorId || "anonymous"
                }
            });
        } catch (error) {
            return { ok: false };
        }
    }

    async getRecentFeedback(icdCode: string, targetName: string) {
        try {
            if (!this.prisma.doctorFeedback) return [];
            return await this.prisma.doctorFeedback.findMany({
                where: {
                    icdCode,
                    targetName,
                    targetType: { not: "general" }
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    note: true,
                    doctorId: true,
                    createdAt: true,
                    feedbackType: true
                }
            });
        } catch (error) {
            return [];
        }
    }

    async saveDismissal(payload: any) {
        try {
            if (!this.prisma.doctorDismissal) return { ok: false };
            return await this.prisma.doctorDismissal.create({
                data: {
                    icdCode: payload.icdCode,
                    itemType: payload.itemType,
                    itemCode: payload.itemCode || payload.itemName,
                    itemName: payload.itemName,
                    reason: payload.reason,
                    doctorId: payload.doctorId || "anonymous"
                }
            });
        } catch (error) {
            return { ok: false };
        }
    }
}

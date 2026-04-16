import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class InteractionService {
    constructor(private prisma: PrismaService) { }

    async saveFeedback(payload: any) {
        return this.prisma.doctorFeedback.create({
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
    }

    async getRecentFeedback(icdCode: string, targetName: string) {
        return this.prisma.doctorFeedback.findMany({
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
    }

    async saveDismissal(payload: any) {
        return this.prisma.doctorDismissal.create({
            data: {
                icdCode: payload.icdCode,
                itemType: payload.itemType,
                itemCode: payload.itemCode || payload.itemName,
                itemName: payload.itemName,
                reason: payload.reason,
                doctorId: payload.doctorId || "anonymous"
            }
        });
    }
}

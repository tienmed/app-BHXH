import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.warn("Could not connect to database. Prisma actions will fail, but API remains online for CSV-based logic.");
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

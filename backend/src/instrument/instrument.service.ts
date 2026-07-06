import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InstrumentService {
  constructor(private prisma: PrismaService) {}

  async listGrouped() {
    // Use raw SQL since Prisma client may not have 'category' field
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      "SELECT id, name, category FROM instruments ORDER BY category ASC, name ASC"
    );

    // Group by category
    const groups: Record<string, { category: string; items: { id: string; name: string }[] }> = {};
    for (const row of rows) {
      const cat = row.category || "其他";
      if (!groups[cat]) groups[cat] = { category: cat, items: [] };
      groups[cat].items.push({ id: row.id, name: row.name });
    }

    return Object.values(groups).map((g) => ({
      category: g.category,
      instruments: g.items,
    }));
  }
}

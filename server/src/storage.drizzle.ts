import type { Delivery, DeliveryInput } from "../../shared/schema";

// Dynamically import Drizzle and pg-core at runtime so the project can compile
// when `drizzle-orm` is not installed. If Drizzle is available the storage will
// initialize itself; otherwise methods will throw so callers can fallback.
export class DrizzleStorage {
  private db: any | undefined;
  private deliveries: any | undefined;
  private ready: Promise<void>;

  constructor(databaseUrl: string) {
    this.db = undefined;
    this.deliveries = undefined;
    this.ready = (async () => {
      try {
        const _req: any = eval("require");
        const pgMod = _req("pg");
        const Pool = pgMod?.Pool ?? pgMod?.default?.Pool;
        const pool = new Pool({ connectionString: databaseUrl });

        const drizzleMod = _req("drizzle-orm/node-postgres");
        const pgCore = _req("drizzle-orm/pg-core");

        const { pgTable, serial, text, numeric, timestamp } = pgCore as any;

        this.deliveries = pgTable("deliveries", {
          id: serial("id").primaryKey(),
          customername: text("customername").notNull(),
          chicktype: text("chicktype").notNull(),
          loadedboxweight: numeric("loadedboxweight").notNull(),
          emptyboxweight: numeric("emptyboxweight").notNull(),
          netweight: numeric("netweight").notNull(),
          notes: text("notes"),
          createdat: timestamp("createdat").defaultNow(),
        });

        this.db = (drizzleMod as any).drizzle(pool);
      } catch (err) {
        // Drizzle (or its peer deps) are not available — keep disabled.
        // Caller should fallback to another storage implementation.
        // eslint-disable-next-line no-console
        console.warn("Drizzle not available; DrizzleStorage disabled:", err);
        this.db = undefined;
        this.deliveries = undefined;
      }
    })();
  }

  private async ensureReady() {
    await this.ready;
    if (!this.db || !this.deliveries) throw new Error("Drizzle not initialized");
  }

  async list(): Promise<Delivery[]> {
    await this.ensureReady();
    const rows = await this.db.select().from(this.deliveries).orderBy(this.deliveries.createdat.desc);
    return rows.map((r: any) => ({
      id: Number(r.id),
      customerName: r.customername,
      chickType: r.chicktype,
      loadedBoxWeight: Number(r.loadedboxweight),
      emptyBoxWeight: Number(r.emptyboxweight),
      netWeight: Number(r.netweight),
      notes: r.notes,
      createdAt: r.createdat instanceof Date ? r.createdat.toISOString() : String(r.createdat),
    }));
  }

  async create(input: DeliveryInput): Promise<Delivery> {
    await this.ensureReady();
    const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
    const [{ id, createdat }] = await this.db
      .insert(this.deliveries)
      .values({
        customername: input.customerName,
        chicktype: input.chickType,
        loadedboxweight: input.loadedBoxWeight,
        emptyboxweight: input.emptyBoxWeight,
        netweight: netWeight,
        notes: input.notes ?? null,
      })
      .returning({ id: this.deliveries.id, createdat: this.deliveries.createdat });

    return {
      id: Number(id),
      customerName: input.customerName,
      chickType: input.chickType,
      loadedBoxWeight: input.loadedBoxWeight,
      emptyBoxWeight: input.emptyBoxWeight,
      netWeight,
      notes: input.notes,
      createdAt: createdat instanceof Date ? createdat.toISOString() : String(createdat),
    } as Delivery;
  }
}

export type { Delivery, DeliveryInput };

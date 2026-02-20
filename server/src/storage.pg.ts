import { Pool } from "pg";
import { Delivery, DeliveryInput } from "../../shared/schema";

export class PostgresStorage {
  private pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async list(): Promise<Delivery[]> {
    const res = await this.pool.query(`
      SELECT id, customername, chicktype, loadedboxweight, emptyboxweight, netweight, notes, createdat
      FROM deliveries
      ORDER BY createdat DESC
    `);
    return res.rows.map((r: any) => ({
      id: r.id,
      customerName: r.customername,
      chickType: r.chicktype,
      loadedBoxWeight: Number(r.loadedboxweight),
      emptyBoxWeight: Number(r.emptyboxweight),
      netWeight: Number(r.netweight),
      notes: r.notes,
      createdAt: r.createdat.toISOString(),
    }));
  }

  async create(input: DeliveryInput): Promise<Delivery> {
    const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
    const res = await this.pool.query(
      `INSERT INTO deliveries (customername, chicktype, loadedboxweight, emptyboxweight, netweight, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, createdat`,
      [
        input.customerName,
        input.chickType,
        input.loadedBoxWeight,
        input.emptyBoxWeight,
        netWeight,
        input.notes ?? null,
      ]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      customerName: input.customerName,
      chickType: input.chickType,
      loadedBoxWeight: input.loadedBoxWeight,
      emptyBoxWeight: input.emptyBoxWeight,
      netWeight,
      notes: input.notes,
      createdAt: row.createdat.toISOString(),
    } as Delivery;
  }
}

export type { Delivery, DeliveryInput };

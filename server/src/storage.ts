import { Delivery, DeliveryInput } from "../../shared/schema";
import { InMemoryStorage as MEM } from "./storage.mem";

export interface IStorage {
  list(): Promise<Delivery[]>;
  create(input: DeliveryInput): Promise<Delivery>;
  delete(id: number): Promise<boolean>;
}

export async function createStorage(): Promise<IStorage> {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      // Prefer Drizzle-backed storage if available
      // @ts-ignore
      const { DrizzleStorage } = await import("./storage.drizzle");
      return new DrizzleStorage(url);
    } catch (err) {
      try {
        // fallback to simple pg-backed storage
        // @ts-ignore
        const { PostgresStorage } = await import("./storage.pg");
        return new PostgresStorage(url);
      } catch (err2) {
        // fallback to in-memory if no DB driver available
        // eslint-disable-next-line no-console
        console.warn("Postgres/Drizzle unavailable, falling back to in-memory storage:", err2);
        return new MEM();
      }
    }
  }
  return new MEM();
}

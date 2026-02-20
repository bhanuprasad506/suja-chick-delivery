import express from "express";
import dotenv from "dotenv";
import { DeliveryInputSchema } from "../../shared/schema";
import { createStorage } from "./storage";

dotenv.config();

const app = express();
app.use(express.json());

let storageInstance: any = null;
createStorage().then((s) => {
  storageInstance = s;
}).catch((err: any) => {
  // eslint-disable-next-line no-console
  console.error("Failed to initialize storage:", err);
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/deliveries", async (_req, res) => {
  const items = await (storageInstance ?? (await createStorage())).list();
  res.json(items);
});

app.post("/deliveries", async (req, res) => {
  const parsed = DeliveryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const store = storageInstance ?? (await createStorage());
  const created = await (typeof store.then === "function" ? (await store).create(parsed.data) : store.create(parsed.data));
  res.status(201).json(created);
});

app.delete("/deliveries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const store = storageInstance ?? (await createStorage());
  const deleted = await (typeof store.then === "function" ? (await store).delete(id) : store.delete(id));
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Delivery not found" });
  }
});

const PORT = process.env.PORT ?? 4000;
app.listen(Number(PORT), () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

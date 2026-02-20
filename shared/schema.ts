import { z } from "zod";

export const ChickType = z.enum(["Boiler", "Layer", "Natukodi", "Lingapuram"]);

export const DeliveryInputSchema = z.object({
  customerName: z.string().min(1),
  chickType: ChickType,
  loadedBoxWeight: z.number(),
  emptyBoxWeight: z.number(),
  numberOfBoxes: z.number().int().min(1).optional(),
  notes: z.string().optional(),
});

export const DeliverySchema = DeliveryInputSchema.extend({
  id: z.number(),
  netWeight: z.number(),
  createdAt: z.string(),
});

export type DeliveryInput = z.infer<typeof DeliveryInputSchema>;
export type Delivery = z.infer<typeof DeliverySchema>;

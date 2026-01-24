"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverySchema = exports.DeliveryInputSchema = exports.ChickType = void 0;
const zod_1 = require("zod");
exports.ChickType = zod_1.z.enum(["Boiler", "Layer", "Natukodi", "Lingapuram"]);
exports.DeliveryInputSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1),
    chickType: exports.ChickType,
    loadedBoxWeight: zod_1.z.number(),
    emptyBoxWeight: zod_1.z.number(),
    notes: zod_1.z.string().optional(),
});
exports.DeliverySchema = exports.DeliveryInputSchema.extend({
    id: zod_1.z.number(),
    netWeight: zod_1.z.number(),
    createdAt: zod_1.z.string(),
});

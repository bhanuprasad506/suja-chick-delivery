import { Delivery, DeliveryInput } from "../../shared/schema";

export class InMemoryStorage {
  private items: Delivery[] = [];
  private idCounter = 1;

  async list() {
    return this.items.slice().reverse();
  }

  async create(input: DeliveryInput) {
    const netWeight = input.loadedBoxWeight - input.emptyBoxWeight;
    const item: Delivery = {
      id: this.idCounter++,
      netWeight,
      createdAt: new Date().toISOString(),
      ...input,
    } as Delivery;
    this.items.push(item);
    return item;
  }

  async delete(id: number) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}

export type { Delivery, DeliveryInput };

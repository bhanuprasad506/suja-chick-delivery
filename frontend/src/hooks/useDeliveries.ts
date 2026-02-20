import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeliveryInput, Delivery } from "../../shared/schema";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function fetchDeliveries(): Promise<Delivery[]> {
  const res = await fetch(`${API_BASE}/deliveries`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function postDelivery(input: DeliveryInput): Promise<Delivery> {
  const res = await fetch(`${API_BASE}/deliveries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

export function useDeliveries() {
  const qc = useQueryClient();
  const q = useQuery(["deliveries"], fetchDeliveries, { staleTime: 1000 * 60 });

  const m = useMutation((v: DeliveryInput) => postDelivery(v), {
    onSuccess: () => qc.invalidateQueries(["deliveries"]),
  });

  return {
    data: q.data,
    isLoading: q.isLoading,
    addDelivery: (v: DeliveryInput) => m.mutateAsync(v),
  };
}

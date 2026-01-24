-- 0001_create_deliveries.sql
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  customername TEXT NOT NULL,
  chicktype TEXT NOT NULL,
  loadedboxweight NUMERIC NOT NULL,
  emptyboxweight NUMERIC NOT NULL,
  netweight NUMERIC NOT NULL,
  notes TEXT,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT now()
);

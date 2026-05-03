-- Setup PostGIS para DeliveryZone
-- Rama: feat/zonas-delivery-multiplicador
--
-- Este script se corre UNA SOLA VEZ después de aplicar `prisma db push`,
-- para crear el índice GiST que Prisma no genera por sí mismo cuando el
-- campo es de tipo Unsupported("geometry(Polygon, 4326)").
--
-- Si ya está creado el índice, IF NOT EXISTS evita el error.
--
-- Uso (Windows + Docker Postgres puerto 5436):
--   docker exec -it moovy-postgres psql -U postgres -d moovy -f /tmp/setup-postgis-zones.sql
--   o copiando el archivo:
--   docker cp scripts/setup-postgis-zones.sql moovy-postgres:/tmp/
--   docker exec moovy-postgres psql -U postgres -d moovy -f /tmp/setup-postgis-zones.sql
--
-- Verificar que PostGIS extension ya está instalada (Moovy la usa para tracking GPS):
--   SELECT * FROM pg_extension WHERE extname = 'postgis';

-- Habilitar extensión PostGIS si no está (defensivo, debería estar ya).
CREATE EXTENSION IF NOT EXISTS postgis;

-- Índice GiST sobre la columna polygon de DeliveryZone.
-- Permite que ST_Contains, ST_Intersects, ST_Within sean O(log N) en vez de O(N).
-- Crítico cuando hay >10 zonas o >100 pedidos/min.
CREATE INDEX IF NOT EXISTS "DeliveryZone_polygon_gist_idx"
    ON "DeliveryZone"
    USING GIST ("polygon");

-- Verificación: listar índices de DeliveryZone para confirmar que se creó.
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'DeliveryZone'
ORDER BY indexname;

-- Resultado esperado: ver "DeliveryZone_polygon_gist_idx" en la lista junto con
-- los índices auto-generados por Prisma (DeliveryZone_pkey, etc).

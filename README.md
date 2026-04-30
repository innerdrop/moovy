# MOOVY

**Marketplace + tienda + delivery en Ushuaia, Argentina.**

Plataforma multi-rol que conecta comercios locales, vendedores marketplace, repartidores y compradores. Diferenciador clave: el comercio cobra al instante, comisiones desde 8% (vs 25-30% de competidores), soporte humano local.

🌐 [somosmoovy.com](https://somosmoovy.com)

---

## Stack

- **Frontend**: Next.js 16 (Turbopack) + React 19 + TypeScript + Tailwind 4
- **Backend**: API Routes + Prisma 5 + PostgreSQL 15 + PostGIS
- **Auth**: NextAuth v5 (JWT, credentials-only)
- **Real-time**: Socket.IO 4 + Web Push VAPID
- **Pagos**: MercadoPago Checkout Pro
- **Maps**: Google Maps + Places API (New) + Routes API
- **State**: Zustand (cart, favorites, toast, points)
- **Logging**: Pino + audit logs en DB
- **Deploy**: PowerShell scripts + SSH a VPS Hostinger

---

## Estructura

```
src/app/(store)/        Tienda pública + buyer auth
src/app/repartidor/     Portal driver
src/app/comercios/      Portal merchant
src/app/vendedor/       Portal seller marketplace
src/app/ops/            Panel admin/operaciones
src/app/api/            ~170 route handlers
src/components/         ~80 componentes
src/lib/                ~37 utils (auth, MP, email, assignment-engine, points, roles)
src/hooks/              12 hooks
src/store/              4 Zustand stores
scripts/                start.ps1, finish.ps1, devmain.ps1, rollback.ps1, socket-server.ts, validate-*.ts
prisma/schema.prisma    ~30 modelos con PostGIS
```

---

## Setup local

### Pre-requisitos

- Node.js 20+
- Docker Desktop (PostgreSQL + PostGIS corren en container)
- Git

### Primera instalación

```bash
# 1. Clonar
git clone https://github.com/innerdrop/moovy.git
cd moovy

# 2. Instalar dependencias
npm install

# 3. Levantar Postgres + PostGIS en Docker
docker-compose up -d

# 4. Configurar .env (pedirle a Mauro las variables, no van a git)
cp .env.example .env  # editar con valores reales

# 5. Aplicar schema y seed
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts

# 6. Crear admin OPS
npx tsx scripts/create-admin.ts tu-email@ejemplo.com
```

### Workflow diario

```bash
# Levantar Next.js + Socket.IO en paralelo
npm run dev:full

# O cada uno por separado:
npm run dev          # Next.js en :3000
npm run socket       # Socket.IO en :3001
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Trabajar en una feature

```powershell
# Crear rama desde develop
.\scripts\start.ps1 fix/mi-feature

# ... hacer cambios ...

# Cerrar rama (commit + push + merge a develop)
.\scripts\finish.ps1
```

`finish.ps1` auto-genera entry en `.claude/CHANGELOG.md` con el mensaje de commit + archivos tocados.

---

## Deploy a producción

```powershell
# Validación previa (sin cambios reales)
.\scripts\devmain.ps1 -DryRun

# Deploy real
.\scripts\devmain.ps1
```

📖 **Ver guía completa**: [`DEPLOY_GUIA.md`](./DEPLOY_GUIA.md) — incluye setup SSH, troubleshooting, rollback, modos del script.

---

## Documentación

| Documento | Para qué |
|---|---|
| [`.claude/CLAUDE.md`](./.claude/CLAUDE.md) | Info canónica: stack, modelos, reglas de negocio (Biblia v3), decisiones arquitectónicas, mentalidad CEO/CTO |
| [`.claude/CHANGELOG.md`](./.claude/CHANGELOG.md) | Histórico de ramas (no se carga auto, consulta bajo demanda) |
| [`.claude/CHANGELOG-auditorias.md`](./.claude/CHANGELOG-auditorias.md) | Auditorías históricas archivadas |
| [`DEPLOY_GUIA.md`](./DEPLOY_GUIA.md) | Cómo deployar a producción |
| [`ISSUES.md`](./ISSUES.md) | Issues abiertos |
| [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) | Dashboard del estado actual |
| [`docs/prompts-cowork/PROMPT_5_DIARIO_FINAL.md`](./docs/prompts-cowork/PROMPT_5_DIARIO_FINAL.md) | Prompt para sesiones diarias con Claude |
| [`docs/guias/`](./docs/guias/) | Guías técnicas (push, integración) |
| [`docs/referencias/`](./docs/referencias/) | Brand assets, reportes, investigación |
| [`docs/catalogs/`](./docs/catalogs/) | CSVs de productos para importar |
| [`docs/formales/Manual-OPS-MOOVY.docx`](./docs/formales/Manual-OPS-MOOVY.docx) | Manual operativo |

---

## Reglas de negocio (resumen)

- Comisión comercio MES 1: **0%** | MES 2+: **8% base, dinámico por tier** (BRONCE 8% → DIAMANTE 5%)
- Comisión seller marketplace: **12%** desde día 1
- Repartidor: **80%** del costo real del viaje
- 1 punto MOOVER = $1 ARS de descuento (max 20% del subtotal, min 500 pts para canjear)
- Earn rate: 10pts/$1.000 (MOOVER básico), hasta 20pts/$1.000 (BLACK)

📖 Reglas completas en [`.claude/CLAUDE.md`](./.claude/CLAUDE.md) sección "Biblia Financiera v3".

---

## Marca

| Elemento | Valor |
|---|---|
| Color principal | Rojo `#e60012` (MOOVY) |
| Color secundario | Violeta `#7C3AED` (Marketplace) |
| Tipografía | Plus Jakarta Sans |
| Filosofía pública | Nunca mencionar competidores |

---

## Soporte

¿Problema en producción? Verificar primero:

```bash
curl -i https://somosmoovy.com/api/health
```

Debería responder `200` con `"status": "healthy"` y `database` + `socketServer` ambos en `"ok"`.

Si algo no anda, revisar [`DEPLOY_GUIA.md`](./DEPLOY_GUIA.md) sección "Troubleshooting".

---

## Licencia

Propietario. © Moovy 2026.

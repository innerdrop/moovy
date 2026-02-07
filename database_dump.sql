--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_referredById_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_senderId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_chatId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportChat" DROP CONSTRAINT IF EXISTS "SupportChat_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Referral" DROP CONSTRAINT IF EXISTS "Referral_referrerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Referral" DROP CONSTRAINT IF EXISTS "Referral_refereeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."PointsTransaction" DROP CONSTRAINT IF EXISTS "PointsTransaction_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_addressId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Merchant" DROP CONSTRAINT IF EXISTS "Merchant_ownerId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_userId_fkey";
DROP INDEX IF EXISTS public."User_referralCode_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."SavedCart_userId_key";
DROP INDEX IF EXISTS public."Referral_refereeId_key";
DROP INDEX IF EXISTS public."Product_slug_key";
DROP INDEX IF EXISTS public."ProductCategory_productId_categoryId_key";
DROP INDEX IF EXISTS public."Order_orderNumber_key";
DROP INDEX IF EXISTS public."Merchant_slug_key";
DROP INDEX IF EXISTS public."MerchantCategory_merchantId_categoryId_key";
DROP INDEX IF EXISTS public."MerchantAcquiredProduct_merchantId_productId_key";
DROP INDEX IF EXISTS public."Driver_userId_key";
DROP INDEX IF EXISTS public."Category_slug_key";
DROP INDEX IF EXISTS public."Category_name_key";
DROP INDEX IF EXISTS public."CartItem_userId_productId_variantId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."SupportChat" DROP CONSTRAINT IF EXISTS "SupportChat_pkey";
ALTER TABLE IF EXISTS ONLY public."StoreSettings" DROP CONSTRAINT IF EXISTS "StoreSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."SavedCart" DROP CONSTRAINT IF EXISTS "SavedCart_pkey";
ALTER TABLE IF EXISTS ONLY public."Referral" DROP CONSTRAINT IF EXISTS "Referral_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."PointsTransaction" DROP CONSTRAINT IF EXISTS "PointsTransaction_pkey";
ALTER TABLE IF EXISTS ONLY public."PointsConfig" DROP CONSTRAINT IF EXISTS "PointsConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderBackup" DROP CONSTRAINT IF EXISTS "OrderBackup_pkey";
ALTER TABLE IF EXISTS ONLY public."Merchant" DROP CONSTRAINT IF EXISTS "Merchant_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_pkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."SupportMessage";
DROP TABLE IF EXISTS public."SupportChat";
DROP TABLE IF EXISTS public."StoreSettings";
DROP TABLE IF EXISTS public."SavedCart";
DROP TABLE IF EXISTS public."Referral";
DROP TABLE IF EXISTS public."ProductVariant";
DROP TABLE IF EXISTS public."ProductImage";
DROP TABLE IF EXISTS public."ProductCategory";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."PointsTransaction";
DROP TABLE IF EXISTS public."PointsConfig";
DROP TABLE IF EXISTS public."OrderItem";
DROP TABLE IF EXISTS public."OrderBackup";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."MerchantCategory";
DROP TABLE IF EXISTS public."MerchantAcquiredProduct";
DROP TABLE IF EXISTS public."Merchant";
DROP TABLE IF EXISTS public."Driver";
DROP TABLE IF EXISTS public."Category";
DROP TABLE IF EXISTS public."CartItem";
DROP TABLE IF EXISTS public."Address";
DROP EXTENSION IF EXISTS postgis;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text NOT NULL,
    street text NOT NULL,
    number text NOT NULL,
    apartment text,
    neighborhood text,
    city text DEFAULT 'Ushuaia'::text NOT NULL,
    province text DEFAULT 'Tierra del Fuego'::text NOT NULL,
    "zipCode" text,
    latitude double precision,
    longitude double precision,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Address" OWNER TO postgres;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "variantId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "allowIndividualPurchase" boolean DEFAULT true NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    "parentId" text
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: Driver; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Driver" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "vehicleType" text,
    "vehicleBrand" text,
    "vehicleModel" text,
    "vehicleYear" integer,
    "vehicleColor" text,
    "licensePlate" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "totalDeliveries" integer DEFAULT 0 NOT NULL,
    rating double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "availabilityStatus" text DEFAULT 'FUERA_DE_SERVICIO'::text NOT NULL,
    "lastLocationAt" timestamp(3) without time zone,
    latitude double precision,
    longitude double precision,
    ubicacion public.geography(Point,4326)
);


ALTER TABLE public."Driver" OWNER TO postgres;

--
-- Name: Merchant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Merchant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    banner text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isOpen" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    email text,
    phone text,
    address text,
    latitude double precision,
    longitude double precision,
    "deliveryRadiusKm" double precision DEFAULT 5 NOT NULL,
    "deliveryTimeMin" integer DEFAULT 30 NOT NULL,
    "deliveryTimeMax" integer DEFAULT 45 NOT NULL,
    "deliveryFee" double precision DEFAULT 0 NOT NULL,
    "minOrderAmount" double precision DEFAULT 0 NOT NULL,
    cuit text,
    category text DEFAULT 'Otro'::text,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "adminNotes" text,
    "bankAccount" text,
    "businessName" text,
    "commissionRate" double precision DEFAULT 8 NOT NULL,
    cuil text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "facebookUrl" text,
    "instagramUrl" text,
    "isPremium" boolean DEFAULT false NOT NULL,
    "ownerBirthDate" timestamp(3) without time zone,
    "ownerDni" text,
    "premiumTier" text DEFAULT 'basic'::text,
    "premiumUntil" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "whatsappNumber" text,
    ubicacion public.geography(Point,4326)
);


ALTER TABLE public."Merchant" OWNER TO postgres;

--
-- Name: MerchantAcquiredProduct; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MerchantAcquiredProduct" (
    id text NOT NULL,
    "merchantId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MerchantAcquiredProduct" OWNER TO postgres;

--
-- Name: MerchantCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MerchantCategory" (
    id text NOT NULL,
    "merchantId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MerchantCategory" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text NOT NULL,
    "addressId" text NOT NULL,
    "merchantId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paymentId" text,
    "paymentStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "paymentMethod" text,
    subtotal double precision NOT NULL,
    "deliveryFee" double precision DEFAULT 0 NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    "distanceKm" double precision,
    "deliveryNotes" text,
    "estimatedTime" integer,
    "driverId" text,
    "deliveryStatus" text,
    "deliveredAt" timestamp(3) without time zone,
    "deliveryPhoto" text,
    "customerNotes" text,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cancelReason" text,
    "commissionPaid" boolean DEFAULT false NOT NULL,
    "driverRating" integer,
    "merchantPayout" double precision DEFAULT 0,
    "moovyCommission" double precision DEFAULT 0,
    "ratedAt" timestamp(3) without time zone,
    "ratingComment" text,
    "assignmentAttempts" integer DEFAULT 0 NOT NULL,
    "assignmentExpiresAt" timestamp(3) without time zone,
    "attemptedDriverIds" text,
    "lastAssignmentAt" timestamp(3) without time zone,
    "pendingDriverId" text
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- Name: OrderBackup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderBackup" (
    id text NOT NULL,
    "backupName" text NOT NULL,
    "orderData" text NOT NULL,
    "orderId" text,
    "orderNumber" text,
    total double precision,
    "deletedBy" text,
    "deletedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderBackup" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    quantity integer NOT NULL,
    "variantName" text,
    subtotal double precision NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: PointsConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PointsConfig" (
    id text DEFAULT 'points_config'::text NOT NULL,
    "pointsPerDollar" double precision DEFAULT 1 NOT NULL,
    "minPurchaseForPoints" double precision DEFAULT 0 NOT NULL,
    "pointsValue" double precision DEFAULT 0.01 NOT NULL,
    "minPointsToRedeem" integer DEFAULT 100 NOT NULL,
    "maxDiscountPercent" double precision DEFAULT 50 NOT NULL,
    "signupBonus" integer DEFAULT 100 NOT NULL,
    "referralBonus" integer DEFAULT 200 NOT NULL,
    "reviewBonus" integer DEFAULT 10 NOT NULL,
    "pointsExpireDays" integer,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PointsConfig" OWNER TO postgres;

--
-- Name: PointsTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PointsTransaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "orderId" text,
    type text NOT NULL,
    amount integer NOT NULL,
    "balanceAfter" integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PointsTransaction" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "merchantId" text,
    price double precision NOT NULL,
    "costPrice" double precision NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 5 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductCategory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "categoryId" text NOT NULL
);


ALTER TABLE public."ProductCategory" OWNER TO postgres;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    alt text,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO postgres;

--
-- Name: ProductVariant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductVariant" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    price double precision,
    stock integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ProductVariant" OWNER TO postgres;

--
-- Name: Referral; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Referral" (
    id text NOT NULL,
    "referrerId" text NOT NULL,
    "refereeId" text NOT NULL,
    "codeUsed" text NOT NULL,
    "referrerPoints" integer DEFAULT 50 NOT NULL,
    "refereePoints" integer DEFAULT 100 NOT NULL,
    status text DEFAULT 'COMPLETED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Referral" OWNER TO postgres;

--
-- Name: SavedCart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SavedCart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    items jsonb NOT NULL,
    "merchantId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SavedCart" OWNER TO postgres;

--
-- Name: StoreSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StoreSettings" (
    id text DEFAULT 'settings'::text NOT NULL,
    "isOpen" boolean DEFAULT true NOT NULL,
    "closedMessage" text DEFAULT 'Estamos cerrados. ??Volvemos pronto!'::text NOT NULL,
    "isMaintenanceMode" boolean DEFAULT false NOT NULL,
    "maintenanceMessage" text DEFAULT '??Volvemos pronto! Estamos trabajando para mejorar tu experiencia.'::text NOT NULL,
    "fuelPricePerLiter" double precision DEFAULT 1200 NOT NULL,
    "fuelConsumptionPerKm" double precision DEFAULT 0.06 NOT NULL,
    "baseDeliveryFee" double precision DEFAULT 500 NOT NULL,
    "maintenanceFactor" double precision DEFAULT 1.35 NOT NULL,
    "freeDeliveryMinimum" double precision,
    "maxDeliveryDistance" double precision DEFAULT 15 NOT NULL,
    "storeName" text DEFAULT 'Moovy Ushuaia'::text NOT NULL,
    "storeAddress" text DEFAULT 'Ushuaia, Tierra del Fuego'::text NOT NULL,
    "originLat" double precision DEFAULT '-54.8019'::numeric NOT NULL,
    "originLng" double precision DEFAULT '-68.3030'::numeric NOT NULL,
    "whatsappNumber" text,
    phone text,
    email text,
    schedule text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "promoPopupButtonText" text DEFAULT 'Ver m??s'::text,
    "promoPopupDismissable" boolean DEFAULT true NOT NULL,
    "promoPopupEnabled" boolean DEFAULT false NOT NULL,
    "promoPopupImage" text,
    "promoPopupLink" text,
    "promoPopupMessage" text,
    "promoPopupTitle" text,
    "showComerciosCard" boolean DEFAULT true NOT NULL,
    "showRepartidoresCard" boolean DEFAULT true NOT NULL,
    "tiendaMaintenance" boolean DEFAULT false NOT NULL,
    "maxCategoriesHome" integer DEFAULT 6 NOT NULL
);


ALTER TABLE public."StoreSettings" OWNER TO postgres;

--
-- Name: SupportChat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportChat" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "merchantId" text,
    subject text,
    status text DEFAULT 'open'::text NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportChat" OWNER TO postgres;

--
-- Name: SupportMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportMessage" (
    id text NOT NULL,
    "chatId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    "isFromAdmin" boolean DEFAULT false NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SupportMessage" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    "firstName" text,
    "lastName" text,
    phone text,
    role text DEFAULT 'USER'::text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "pointsBalance" integer DEFAULT 0 NOT NULL,
    "pendingBonusPoints" integer DEFAULT 0 NOT NULL,
    "bonusActivated" boolean DEFAULT false NOT NULL,
    "referralCode" text NOT NULL,
    "referredById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Address" (id, "userId", label, street, number, apartment, neighborhood, city, province, "zipCode", latitude, longitude, "isDefault", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmkx4m5bu00035jchkrxfk4cy	cmkvbvo87002br0gkyyz8i0cs	CasaEjemplo	Kuanip	190	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.816358	-68.3253491	t	2026-01-27 21:46:32.441	2026-01-27 21:46:32.441	\N
cmkx4m5kg00055jchyl2qklvb	cmkvbvo87002br0gkyyz8i0cs	Entrega	Kuanip	190	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-01-27 21:46:32.752	2026-01-27 21:46:32.752	\N
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "userId", "productId", quantity, "variantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, slug, description, image, "isActive", "order", "createdAt", "updatedAt", "allowIndividualPurchase", price, "parentId") FROM stdin;
cml0zoxi500dhygioxr9f0loc	Juegos	juegos			t	0	2026-01-30 14:39:48.893	2026-02-05 22:01:55.038	t	0	cml9lh7l90000qxvofmv8r1i7
cmkvbvo1n0002r0gklrqbox7o	Hamburguesas	hamburguesas	\N	\N	t	1	2026-01-26 15:34:21.563	2026-02-05 15:11:49.689	t	0	cml9lh7l90000qxvofmv8r1i7
cmkvbvo3b0003r0gk2uttx4lq	Sushi	sushi	\N	\N	t	3	2026-01-26 15:34:21.563	2026-02-05 15:11:49.693	t	0	cml9lh7l90000qxvofmv8r1i7
cmkvbvo3k0004r0gkby3xi0g4	Pizzas	pizzas	\N	\N	t	2	2026-01-26 15:34:21.563	2026-02-05 15:11:49.698	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow3e0000ygiogdypolr3	Combos	combos	\N	\N	t	0	2026-01-30 14:39:47.065	2026-02-05 15:11:49.701	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow6h000fygio11bf03c6	Gaseosas	gaseosas	\N	\N	t	0	2026-01-30 14:39:47.178	2026-02-05 15:11:49.704	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow6y000kygio98l495ny	Hielo & Otros	hielo-otros	\N	\N	t	0	2026-01-30 14:39:47.195	2026-02-05 15:11:49.708	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow7d000pygioyc93s0na	Aperitivos	aperitivos	\N	\N	t	0	2026-01-30 14:39:47.209	2026-02-05 15:11:49.713	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow7t000uygio3e9l5uwk	Snacks	snacks	\N	\N	t	0	2026-01-30 14:39:47.225	2026-02-05 15:11:49.716	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow88000zygioaxhmxkcx	Aguas & Jugos	aguas-jugos	\N	\N	t	0	2026-01-30 14:39:47.24	2026-02-05 15:11:49.72	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zow9t0019ygioovj10h90	Cervezas	cervezas	\N	\N	t	0	2026-01-30 14:39:47.297	2026-02-05 15:11:49.724	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zowft0028ygioo962wjej	Golosinas	golosinas	\N	\N	t	0	2026-01-30 14:39:47.514	2026-02-05 15:11:49.729	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zoxcb00beygiop03ia9ox	Vinos	vinos	\N	\N	t	0	2026-01-30 14:39:48.683	2026-02-05 15:11:49.733	t	0	cml9lh7l90000qxvofmv8r1i7
cml0zox2g007iygioza8q1bmh	Escenciales	escenciales			t	0	2026-01-30 14:39:48.329	2026-02-05 15:11:49.739	t	5000	cml9lh7l90000qxvofmv8r1i7
cml9lh7l90000qxvofmv8r1i7	Kioscos y Almacenes	kioscos-y-almacenes	Paquete completo para kioscos y almacenes. Incluye todas las subcategor??as de productos.		t	0	2026-02-05 15:11:49.678	2026-02-05 22:11:09.031	t	50000	\N
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Driver" (id, "userId", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor", "licensePlate", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt", "availabilityStatus", "lastLocationAt", latitude, longitude, ubicacion) FROM stdin;
cmkvbvo7w0026r0gkcidihjmf	cmkvbvo7s0023r0gk3wyvfr2v	BICICLETA	\N	\N	\N	\N	\N	t	f	0	\N	2026-01-26 15:34:21.789	2026-01-26 15:34:21.789	FUERA_DE_SERVICIO	\N	\N	\N	\N
cmkvbvo83002ar0gkqelv54hh	cmkvbvo800027r0gksb401d3p	AUTO	\N	\N	\N	\N	XYZ 999	t	f	0	\N	2026-01-26 15:34:21.795	2026-01-26 15:34:21.795	FUERA_DE_SERVICIO	\N	\N	\N	\N
cmkvbvo7n0022r0gkuu9g9uab	cmkvbvo7j001zr0gkayjq633k	MOTO	\N	\N	\N	\N	ABC 001	t	t	0	\N	2026-01-26 15:34:21.779	2026-02-07 12:39:22.36	DISPONIBLE	2026-02-07 12:37:43.661	-54.83158543699068	-68.35031579717959	0101000020E6100000250AF3926B1651C038DA3F64716A4BC0
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", cuit, category, "ownerId", "createdAt", "updatedAt", "adminNotes", "bankAccount", "businessName", "commissionRate", cuil, "displayOrder", "facebookUrl", "instagramUrl", "isPremium", "ownerBirthDate", "ownerDni", "premiumTier", "premiumUntil", "startedAt", "whatsappNumber", ubicacion) FROM stdin;
cmkvbvo6k001gr0gknt85jfb9	COMERCIO 3	comercio-3	Sushi fresco preparado por chefs expertos	\N	\N	t	t	t	comercio3@somosmoovy.com	+54 9 2901 000000	Ushuaia, Tierra del Fuego	\N	\N	5	30	45	0	0	\N	Sushi	cmkvbvo6g001dr0gkkc3uxs3s	2026-01-26 15:34:21.74	2026-01-26 15:34:21.74	\N	\N	\N	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N
cmkvbvo3z0008r0gkc7qfxplz	COMERCIO 1	comercio-1	Las mejores hamburguesas de Ushuaia	\N	\N	t	t	t	comercio1@somosmoovy.com	+54 9 2901 000000	Kuanip 190	-54.816358	-68.3253491	5	30	45	0	0	\N	Restaurante	cmkvbvo3s0005r0gkpul7pexf	2026-01-26 15:34:21.645	2026-01-28 13:41:49.576	\N	\N	\N	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N
cmkvbvo5b000ur0gk0eib5xpt	DUTY FREE SHOP	comercio-2	Atlantico Sur	/uploads/products/1769985188152-IMG_5352.jpg	\N	t	t	t	comercio2@somosmoovy.com	+54 9 2901 000000	Ushuaia, Tierra del Fuego	0	0	5	30	45	0	0	\N	Otro	cmkvbvo57000rr0gkp7ff55ji	2026-01-26 15:34:21.695	2026-02-01 22:33:48.38	\N	\N	DUTY FREE SHOP	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N
\.


--
-- Data for Name: MerchantAcquiredProduct; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantAcquiredProduct" (id, "merchantId", "productId", "createdAt") FROM stdin;
cml59f75h0002o6e3vphx0rb1	cmkvbvo5b000ur0gk0eib5xpt	cml0zow75000mygiogcrr8zbt	2026-02-02 14:23:15.7
cml9mbl3v002ipwgo2qwcqpwt	cmkvbvo3z0008r0gkc7qfxplz	cml0zoxgv00czygioguxjupzm	2026-02-05 15:35:26.875
cmla0px9x00083ivo8kv2kj8j	cmkvbvo3z0008r0gkc7qfxplz	cml0zoxff00cfygioxzxvf05c	2026-02-05 22:18:30.452
cmla0pxad000a3ivo04d6zcef	cmkvbvo3z0008r0gkc7qfxplz	cml0zoxf000caygiowbgdvncd	2026-02-05 22:18:30.47
cmla0pxai000c3ivoelw64ggy	cmkvbvo3z0008r0gkc7qfxplz	cml0zoxen00c5ygio59ae7h5l	2026-02-05 22:18:30.474
\.


--
-- Data for Name: MerchantCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantCategory" (id, "merchantId", "categoryId", "createdAt") FROM stdin;
cml4plu6i0001fdp1feofy8vw	cmkvbvo3z0008r0gkc7qfxplz	cmkvbvo1n0002r0gklrqbox7o	2026-02-02 05:08:33.16
cml4plu7o0003fdp1n5rq2uwp	cmkvbvo5b000ur0gk0eib5xpt	cmkvbvo3k0004r0gkby3xi0g4	2026-02-02 05:08:33.204
cml4plu8e0007fdp1p8cx3xdn	cmkvbvo6k001gr0gknt85jfb9	cmkvbvo3b0003r0gk2uttx4lq	2026-02-02 05:08:33.23
cml4plu9o000hfdp1d39wsm6d	cmkvbvo5b000ur0gk0eib5xpt	cml0zoxi500dhygioxr9f0loc	2026-02-02 05:08:33.276
cml4pluas000pfdp13nd43jz5	cmkvbvo5b000ur0gk0eib5xpt	cml0zoxcb00beygiop03ia9ox	2026-02-02 05:08:33.317
cml4plubl000tfdp1ehfpn7kt	cmkvbvo3z0008r0gkc7qfxplz	cml0zox2g007iygioza8q1bmh	2026-02-02 05:08:33.345
cml4plucm000xfdp1cz0s8if5	cmkvbvo5b000ur0gk0eib5xpt	cml0zox2g007iygioza8q1bmh	2026-02-02 05:08:33.383
cml58vbzw000bil4eqyun1uh9	cmkvbvo5b000ur0gk0eib5xpt	cml0zowft0028ygioo962wjej	2026-02-02 14:07:48.86
cml74o41z000tq92movqshcs2	cmkvbvo3z0008r0gkc7qfxplz	cml0zoxcb00beygiop03ia9ox	2026-02-03 21:45:45.862
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveryStatus", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt", "cancelReason", "commissionPaid", "driverRating", "merchantPayout", "moovyCommission", "ratedAt", "ratingComment", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "lastAssignmentAt", "pendingDriverId") FROM stdin;
\.


--
-- Data for Name: OrderBackup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderBackup" (id, "backupName", "orderData", "orderId", "orderNumber", total, "deletedBy", "deletedAt", "createdAt") FROM stdin;
cml2cogab00004do07i3opcyy	backup-2026-01-31-13-31-07	{"id":"cmkx4m5kx00085jchw3o33xbn","orderNumber":"MOV-UM5B","userId":"cmkvbvo87002br0gkyyz8i0cs","addressId":"cmkx4m5kg00055jchyl2qklvb","merchantId":"cmkvbvo3z0008r0gkc7qfxplz","status":"CANCELLED","paymentId":null,"paymentStatus":"PENDING","paymentMethod":"cash","subtotal":5000,"deliveryFee":675,"discount":0,"total":5675,"distanceKm":null,"deliveryNotes":null,"estimatedTime":null,"driverId":null,"deliveryStatus":null,"deliveredAt":null,"deliveryPhoto":null,"customerNotes":null,"adminNotes":null,"createdAt":"2026-01-27T21:46:32.769Z","updatedAt":"2026-01-28T13:15:43.967Z","cancelReason":"Solicitud del cliente","commissionPaid":false,"driverRating":null,"merchantPayout":4600,"moovyCommission":400,"ratedAt":null,"ratingComment":null,"assignmentAttempts":1,"assignmentExpiresAt":"2026-01-27T21:48:38.527Z","attemptedDriverIds":null,"lastAssignmentAt":"2026-01-27T21:47:38.527Z","pendingDriverId":"cmkvbvo7n0022r0gkuu9g9uab","items":[{"id":"cmkx4m5l3000a5jchtgrn4mq9","orderId":"cmkx4m5kx00085jchw3o33xbn","productId":"cmkvbvo4s000mr0gkm6bpedcj","name":"Hamburguesa Veggie","price":5000,"quantity":1,"variantName":null,"subtotal":5000}],"address":{"id":"cmkx4m5kg00055jchyl2qklvb","userId":"cmkvbvo87002br0gkyyz8i0cs","label":"Entrega","street":"Kuanip","number":"190","apartment":null,"neighborhood":null,"city":"Ushuaia","province":"Tierra del Fuego","zipCode":null,"latitude":null,"longitude":null,"isDefault":false,"createdAt":"2026-01-27T21:46:32.752Z","updatedAt":"2026-01-27T21:46:32.752Z","deletedAt":null},"user":{"id":"cmkvbvo87002br0gkyyz8i0cs","name":"CLIENTE 1","email":"cliente1@somosmoovy.com","phone":null},"driver":null,"merchant":{"id":"cmkvbvo3z0008r0gkc7qfxplz","name":"COMERCIO 1"}}	cmkx4m5kx00085jchw3o33xbn	MOV-UM5B	5675	cmkvbvo1d0000r0gkyait4f0l	2026-01-31 13:31:07.762	2026-01-31 13:31:07.762
cml84z2n1000uq92mi19hrzem	backup-2026-02-04-14-42-03	{"id":"cml5g9doj0003q92mnorsx1xg","orderNumber":"MOV-B84E","userId":"cmkvbvo87002br0gkyyz8i0cs","addressId":"cmkx4m5bu00035jchkrxfk4cy","merchantId":"cmkvbvo5b000ur0gk0eib5xpt","status":"PENDING","paymentId":null,"paymentStatus":"PENDING","paymentMethod":"cash","subtotal":5800,"deliveryFee":1094,"discount":0,"total":6894,"distanceKm":2.153061907209533,"deliveryNotes":null,"estimatedTime":null,"driverId":null,"deliveryStatus":null,"deliveredAt":null,"deliveryPhoto":null,"customerNotes":null,"adminNotes":null,"createdAt":"2026-02-02T17:34:41.539Z","updatedAt":"2026-02-02T17:34:41.539Z","cancelReason":null,"commissionPaid":false,"driverRating":null,"merchantPayout":5336,"moovyCommission":464,"ratedAt":null,"ratingComment":null,"assignmentAttempts":0,"assignmentExpiresAt":null,"attemptedDriverIds":null,"lastAssignmentAt":null,"pendingDriverId":null,"items":[{"id":"cml5g9doy0005q92mfv5mw6jo","orderId":"cml5g9doj0003q92mnorsx1xg","productId":"cml4byqzr000r7c7e1teso4bl","name":"Alma Mora Malbec","price":5800,"quantity":1,"variantName":null,"subtotal":5800}],"address":{"id":"cmkx4m5bu00035jchkrxfk4cy","userId":"cmkvbvo87002br0gkyyz8i0cs","label":"CasaEjemplo","street":"Kuanip","number":"190","apartment":null,"neighborhood":null,"city":"Ushuaia","province":"Tierra del Fuego","zipCode":null,"latitude":-54.816358,"longitude":-68.3253491,"isDefault":true,"createdAt":"2026-01-27T21:46:32.441Z","updatedAt":"2026-01-27T21:46:32.441Z","deletedAt":null},"user":{"id":"cmkvbvo87002br0gkyyz8i0cs","name":"CLIENTE 1","email":"cliente1@somosmoovy.com","phone":null},"driver":null,"merchant":{"id":"cmkvbvo5b000ur0gk0eib5xpt","name":"DUTY FREE SHOP"}}	cml5g9doj0003q92mnorsx1xg	MOV-B84E	6894	cmkvbvo1d0000r0gkyait4f0l	2026-02-04 14:42:03.421	2026-02-04 14:42:03.421
cml84z2ng000vq92m39pk6kyi	backup-2026-02-04-14-42-03	{"id":"cml74ibyn000cq92mauc78ta5","orderNumber":"MOV-MAUZ","userId":"cmkvbvo87002br0gkyyz8i0cs","addressId":"cmkx4m5bu00035jchkrxfk4cy","merchantId":"cmkvbvo5b000ur0gk0eib5xpt","status":"PENDING","paymentId":null,"paymentStatus":"PENDING","paymentMethod":"cash","subtotal":5800,"deliveryFee":1094,"discount":0,"total":6894,"distanceKm":2.153061907209533,"deliveryNotes":null,"estimatedTime":null,"driverId":null,"deliveryStatus":null,"deliveredAt":null,"deliveryPhoto":null,"customerNotes":null,"adminNotes":null,"createdAt":"2026-02-03T21:41:16.174Z","updatedAt":"2026-02-03T21:41:16.174Z","cancelReason":null,"commissionPaid":false,"driverRating":null,"merchantPayout":5336,"moovyCommission":464,"ratedAt":null,"ratingComment":null,"assignmentAttempts":0,"assignmentExpiresAt":null,"attemptedDriverIds":null,"lastAssignmentAt":null,"pendingDriverId":null,"items":[{"id":"cml74ibz0000eq92m5xsrv7cv","orderId":"cml74ibyn000cq92mauc78ta5","productId":"cml4byqzr000r7c7e1teso4bl","name":"Alma Mora Malbec","price":5800,"quantity":1,"variantName":null,"subtotal":5800}],"address":{"id":"cmkx4m5bu00035jchkrxfk4cy","userId":"cmkvbvo87002br0gkyyz8i0cs","label":"CasaEjemplo","street":"Kuanip","number":"190","apartment":null,"neighborhood":null,"city":"Ushuaia","province":"Tierra del Fuego","zipCode":null,"latitude":-54.816358,"longitude":-68.3253491,"isDefault":true,"createdAt":"2026-01-27T21:46:32.441Z","updatedAt":"2026-01-27T21:46:32.441Z","deletedAt":null},"user":{"id":"cmkvbvo87002br0gkyyz8i0cs","name":"CLIENTE 1","email":"cliente1@somosmoovy.com","phone":null},"driver":null,"merchant":{"id":"cmkvbvo5b000ur0gk0eib5xpt","name":"DUTY FREE SHOP"}}	cml74ibyn000cq92mauc78ta5	MOV-MAUZ	6894	cmkvbvo1d0000r0gkyait4f0l	2026-02-04 14:42:03.436	2026-02-04 14:42:03.436
cml84z2nk000wq92mxxj64wul	backup-2026-02-04-14-42-03	{"id":"cml74mvr9000mq92m1gxpxtry","orderNumber":"MOV-9YAT","userId":"cmkvbvo87002br0gkyyz8i0cs","addressId":"cmkx4m5bu00035jchkrxfk4cy","merchantId":"cmkvbvo5b000ur0gk0eib5xpt","status":"PENDING","paymentId":null,"paymentStatus":"PENDING","paymentMethod":"cash","subtotal":5800,"deliveryFee":1094,"discount":0,"total":6894,"distanceKm":2.153061907209533,"deliveryNotes":null,"estimatedTime":null,"driverId":null,"deliveryStatus":null,"deliveredAt":null,"deliveryPhoto":null,"customerNotes":null,"adminNotes":null,"createdAt":"2026-02-03T21:44:48.453Z","updatedAt":"2026-02-03T21:44:48.453Z","cancelReason":null,"commissionPaid":false,"driverRating":null,"merchantPayout":5336,"moovyCommission":464,"ratedAt":null,"ratingComment":null,"assignmentAttempts":0,"assignmentExpiresAt":null,"attemptedDriverIds":null,"lastAssignmentAt":null,"pendingDriverId":null,"items":[{"id":"cml74mvrj000oq92m5o130y5a","orderId":"cml74mvr9000mq92m1gxpxtry","productId":"cml4byqzr000r7c7e1teso4bl","name":"Alma Mora Malbec","price":5800,"quantity":1,"variantName":null,"subtotal":5800}],"address":{"id":"cmkx4m5bu00035jchkrxfk4cy","userId":"cmkvbvo87002br0gkyyz8i0cs","label":"CasaEjemplo","street":"Kuanip","number":"190","apartment":null,"neighborhood":null,"city":"Ushuaia","province":"Tierra del Fuego","zipCode":null,"latitude":-54.816358,"longitude":-68.3253491,"isDefault":true,"createdAt":"2026-01-27T21:46:32.441Z","updatedAt":"2026-01-27T21:46:32.441Z","deletedAt":null},"user":{"id":"cmkvbvo87002br0gkyyz8i0cs","name":"CLIENTE 1","email":"cliente1@somosmoovy.com","phone":null},"driver":null,"merchant":{"id":"cmkvbvo5b000ur0gk0eib5xpt","name":"DUTY FREE SHOP"}}	cml74mvr9000mq92m1gxpxtry	MOV-9YAT	6894	cmkvbvo1d0000r0gkyait4f0l	2026-02-04 14:42:03.44	2026-02-04 14:42:03.44
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", name, price, quantity, "variantName", subtotal) FROM stdin;
\.


--
-- Data for Name: PointsConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsConfig" (id, "pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus", "reviewBonus", "pointsExpireDays", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PointsTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsTransaction" (id, "userId", "orderId", type, amount, "balanceAfter", description, "createdAt") FROM stdin;
cmkvj5b3m000bx4sibigqvnp7	cmkvbvo87002br0gkyyz8i0cs	cmkvj5b2d0006x4sizpce7878	EARN	5500	5500	Ganaste 5500 puntos por tu compra	2026-01-26 18:57:48.658
cmkwnxrq500073gi83oyv3dw6	cmkvbvo87002br0gkyyz8i0cs	cmkwnxrp700023gi8dhser2xe	EARN	5000	10500	Ganaste 5000 puntos por tu compra	2026-01-27 13:59:41.214
cmkwovhht000asb5dy5bwlaaj	cmkvbvo87002br0gkyyz8i0cs	cmkwovhgx0005sb5dvxrny8it	EARN	5000	15500	Ganaste 5000 puntos por tu compra	2026-01-27 14:25:54.257
cmkwp6cd90008yu0grupva08c	cmkvbvo87002br0gkyyz8i0cs	cmkwp6ccd0003yu0gx3st7i7c	EARN	5000	20500	Ganaste 5000 puntos por tu compra	2026-01-27 14:34:20.829
cmkwpmxfr0008pbe7d3fvp6i5	cmkvbvo87002br0gkyyz8i0cs	cmkwpmxej0003pbe7b2eda2e2	EARN	5000	25500	Ganaste 5000 puntos por tu compra	2026-01-27 14:47:14.632
cmkwq5mqc0008ragwni7viznp	cmkvbvo87002br0gkyyz8i0cs	cmkwq5mop0003ragwp2hrjnoh	EARN	5000	30500	Ganaste 5000 puntos por tu compra	2026-01-27 15:01:47.22
cmkwuye7k0008e7wghl9xu1fh	cmkvbvo87002br0gkyyz8i0cs	cmkwuye6q0003e7wgbqb3yvzd	EARN	5000	35500	Ganaste 5000 puntos por tu compra	2026-01-27 17:16:07.665
cmkx4m5ml000d5jchc27d1hx4	cmkvbvo87002br0gkyyz8i0cs	cmkx4m5kx00085jchw3o33xbn	EARN	5000	40500	Ganaste 5000 puntos por tu compra	2026-01-27 21:46:32.829
cml4b0i4x00077c7ehfcf870b	cmkvbvo87002br0gkyyz8i0cs	\N	GIFT_SENT	-5000	35500	Regalo de 5000 puntos a CLIENTE 2	2026-02-01 22:20:03.153
cml4b0i5a00097c7eghjtxgis	cmkvbvo8c002dr0gk22kda2cw	\N	GIFT_RECEIVED	5000	5000	Regalo de 5000 puntos de CLIENTE 1	2026-02-01 22:20:03.167
cml5g9dpw0008q92m3x9ggaak	cmkvbvo87002br0gkyyz8i0cs	cml5g9doj0003q92mnorsx1xg	EARN	5800	41300	Ganaste 5800 puntos por tu compra	2026-02-02 17:34:41.588
cml74ic01000hq92m8dqtg150	cmkvbvo87002br0gkyyz8i0cs	cml74ibyn000cq92mauc78ta5	EARN	5800	47100	Ganaste 5800 puntos por tu compra	2026-02-03 21:41:16.225
cml74mvsh000rq92mxaqx3req	cmkvbvo87002br0gkyyz8i0cs	cml74mvr9000mq92m1gxpxtry	EARN	5800	52900	Ganaste 5800 puntos por tu compra	2026-02-03 21:44:48.497
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "createdAt", "updatedAt") FROM stdin;
cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	comercio-1-hamburguesa-doble	\N	cmkvbvo3z0008r0gkc7qfxplz	7500	4500	100	5	t	f	2026-01-26 15:34:21.668	2026-01-26 15:34:21.668
cmkvbvo5s0012r0gknilcgfre	Pizza Pepperoni	comercio-2-pizza-pepperoni	\N	cmkvbvo5b000ur0gk0eib5xpt	7000	4200	100	5	t	f	2026-01-26 15:34:21.712	2026-01-26 15:34:21.712
cmkvbvo650018r0gkp96zwmxm	Pizza 4 Quesos	comercio-2-pizza-4-quesos	\N	cmkvbvo5b000ur0gk0eib5xpt	7500	4500	100	5	t	f	2026-01-26 15:34:21.725	2026-01-26 15:34:21.725
cmkvbvo6n001ir0gkd49h1c39	Roll California	comercio-3-roll-california	\N	cmkvbvo6k001gr0gknt85jfb9	4500	2700	100	5	t	f	2026-01-26 15:34:21.743	2026-01-26 15:34:21.743
cmkvbvo76001ur0gk6sv6o03m	Combo 30 piezas	comercio-3-combo-30-piezas	\N	cmkvbvo6k001gr0gknt85jfb9	12000	7200	100	5	t	f	2026-01-26 15:34:21.762	2026-01-26 15:34:21.762
cmkvbvo5f000wr0gkwdsxy501	Pizza Margherita	comercio-2-pizza-margherita	\N	cmkvbvo5b000ur0gk0eib5xpt	6000	3600	100	5	t	f	2026-01-26 15:34:21.699	2026-02-02 04:55:08.176
cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	comercio-1-hamburguesa-veggie	\N	cmkvbvo3z0008r0gkc7qfxplz	5000	3000	93	5	t	f	2026-01-26 15:34:21.676	2026-01-27 21:46:32.783
cml4byrg9000y7c7e678cio8s	PRIME x3 - Tachas	prime-x3-tachas-c1mad-cmkvb	Textura con puntos en relieve para un placer extremo.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	100	5	t	f	2026-02-01 22:46:41.53	2026-02-01 22:46:41.53
cml0zowjo0039ygioqg9zzfwy	INMORTAL	inmortal-23xop	2 Fernet 750ml + 4 Coca-Colca 2.25lts + 4 Hielo 2kg + 2 Sprite 2.25 + 1 Gancia 950ml + 2 Citric 1lt + 2 Papas Lays 234gr + 2 Pack x6 Budweiser + 8 Speed + 2 Smirnoff + 1 Campari	\N	144900	0	0	5	t	f	2026-01-30 14:39:47.653	2026-02-02 04:46:05.46
cml0zow4q0002ygio1z3yvt0a	COMBO CAMPARI	combo-campari-u5htv	INCLUYE: 1 Campari 1lt. + 2 Jugos Citric 1L + 1 Hielo 2Kg	\N	23900	0	0	5	t	f	2026-01-30 14:39:47.113	2026-02-02 04:46:05.46
cml0zowle003eygio2lvjmvh5	Cepita Naranja 1.5L	cepita-naranja-1-5l-r21co	Tamao: 1.5L - Sabor: Naranja	\N	0	0	0	5	t	f	2026-01-30 14:39:47.715	2026-02-05 15:19:54.638
cml0zox4n008eygioznyef44n	Grolsch 473	grolsch-473-3p50o	Tamao: 473ml	\N	2600	0	0	5	t	f	2026-01-30 14:39:48.407	2026-02-05 15:23:43.406
cmkvbvo6w001or0gkh6my0iu3	Roll Salmn	comercio-3-roll-salm??n	\N	cmkvbvo6k001gr0gknt85jfb9	5500	3300	100	5	t	f	2026-01-26 15:34:21.752	2026-02-04 16:09:55.035
cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	comercio-1-hamburguesa-cl??sica	\N	cmkvbvo3z0008r0gkc7qfxplz	5500	3300	99	5	t	f	2026-01-26 15:34:21.655	2026-02-04 16:09:55.04
cml4byqzb000o7c7e8hie5vrz	Santa Julia Tardo 	santa-julia-tard-o-ymuzp-cmkvb	Vino dulce natural de cosecha tarda. Presenta aromas intensos a miel, flores blancas y frutas tropicales maduras. En boca es untuoso, con buena acidez que equilibra su dulzura, ideal para acompaar postres, quesos azules o disfrutar solo como vino de sobremesa. / 500ml	cmkvbvo5b000ur0gk0eib5xpt	7000	0	100	5	t	f	2026-02-01 22:46:40.919	2026-02-04 16:09:55.053
cml4byrgf00117c7e9qixucyd	PRIME x3 - Super Fino	prime-x3-super-fino-elo3i-cmkvb	Sensacin natural, casi como no sentir nada.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	100	5	t	f	2026-02-01 22:46:41.535	2026-02-04 16:09:55.057
cml4byrgm00147c7e88j2quw8	PRIME x3 - Ultra Fino	prime-x3-ultra-fino-1qxtg-cmkvb	Diseado para mxima sensibilidad sin perder proteccin.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	100	5	t	f	2026-02-01 22:46:41.543	2026-02-04 16:09:55.066
cml4byrgs00177c7erghv3whj	PRIME x3 - Extra Lubricado	prime-x3-extra-lubricado-rymvx-cmkvb	Ms suavidad y deslizamiento para una experiencia cmoda y segura.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	100	5	t	f	2026-02-01 22:46:41.548	2026-02-04 16:09:55.069
cml0zown8003oygiot5n7mxeu	Fernet Branca 1L	fernet-branca-1l-ds4uw	Tamao: 1L	\N	15800	0	0	5	t	f	2026-01-30 14:39:47.78	2026-02-04 16:09:55.079
cml0zowns003tygiovi25qjmj	Fernet Branca 450ml	fernet-branca-450ml-dyye5	Tamao: 450ml	\N	7800	0	0	5	t	f	2026-01-30 14:39:47.8	2026-02-04 16:09:55.081
cml0zowo9003yygio9oge7o70	Aquarius Manzana 2.25L	aquarius-manzana-2-25l-60ro3	Tamao: 2.25L - Sabor: Manzana	\N	0	0	0	5	t	f	2026-01-30 14:39:47.817	2026-02-05 15:18:30.267
cml0zowmr003jygioz946gzop	Aquarius Manzana 1.5L	aquarius-manzana-1-5l-s8pzr	Tamao: 1.5L - Sabor: Manzana	\N	0	0	0	5	t	f	2026-01-30 14:39:47.763	2026-02-05 15:19:41.929
cml0zow5p0007ygio5orv9auu	COMBO HEINEKEN	combo-heineken-72nho	INCLUYE: 2 Packs Heineken x6 473ml (12u) + 1 Papas Lays 234gr	\N	45900	0	0	5	t	f	2026-01-30 14:39:47.15	2026-02-02 04:46:05.46
cml0zow75000mygiogcrr8zbt	Hielo	hielo-edowg	Peso: 2Kg	\N	2800	0	8	5	t	f	2026-01-30 14:39:47.201	2026-02-02 04:46:05.46
cml0zow80000wygio5p7qiekz	Mani King	mani-king-6a3c4	Peso: 350gr	\N	3400	0	0	5	t	f	2026-01-30 14:39:47.232	2026-02-02 04:46:05.46
cml0zowdh001lygioya8h5i2e	Beagle GOLDEN ALE	beagle-golden-ale-pro8q	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.429	2026-02-02 04:46:05.46
cml0zowe0001qygio6770tgax	Beagle IPA	beagle-ipa-4ii91	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.448	2026-02-02 04:46:05.46
cml0zowfz002aygiojnu5ohfc	Snickers	snickers-ipbq6	Peso: 48gr	\N	2700	0	0	5	t	f	2026-01-30 14:39:47.52	2026-02-02 04:46:05.46
cml0zowgd002fygio0lfk2i5a	Beldent	beldent-a1y54	Tipo: Chicle Sabor: Menta	\N	800	0	0	5	t	f	2026-01-30 14:39:47.533	2026-02-02 04:46:05.46
cml0zowgp002kygioovdzms2z	COMBO GANCIA	combo-gancia-6drif	INCLUYE: 1 Gancia 950ml + 2 Sprite 2.25lts + 1 Hielo 2kg	\N	23900	0	0	5	t	f	2026-01-30 14:39:47.545	2026-02-02 04:46:05.46
cml0zowh0002pygioxd363dfm	COMBO SMIRNOFF I	combo-smirnoff-i-axmqm	INCLUYE: 1 Smirnoff + 2 Jugo Citric Naranja + 1 Hielo 2kg	\N	21900	0	0	5	t	f	2026-01-30 14:39:47.556	2026-02-02 04:46:05.46
cml0zowhc002uygio6f32lu5f	COMBO SMIRNOF II	combo-smirnof-ii-0pojt	INCLUYE: 1 Smirnoff + 6 Speed + 1 Hielo 2kg	\N	22900	0	0	5	t	f	2026-01-30 14:39:47.569	2026-02-02 04:46:05.46
cml0zowhp002zygio7dlj16vo	ESTALLIDO	estallido-t5a1o	1 Fernet 750ml + 1 Coca-Colca 2.25lts + 2 Hielo 2kg + 1 Sprite 2.25 + 1 Gancia 950ml + 1 Citric 1lt + 1 Papas Lays 234gr	\N	52900	0	0	5	t	f	2026-01-30 14:39:47.582	2026-02-02 04:46:05.46
cml0zowie0034ygiof9mv6db3	DESCONTROL	descontrol-akrna	1 Fernet 750ml + 2 Coca-Colca 2.25lts + 2 Hielo 2kg + 2 Sprite 2.25 + 1 Gancia 950ml + 1 Citric 1lt + 1 Papas Lays 234gr + 1 Pack x6 Budweiser + 4 Speed + 1 Smirnoff + 1 Campari + 1 Mani King 350gr	\N	92900	0	0	5	t	f	2026-01-30 14:39:47.606	2026-02-02 04:46:05.46
cml0zowqu004xygio8gd5lji9	Smirnoff Saborizado	smirnoff-saborizado-cr1xl	Sabor: Manzana	\N	7900	0	0	5	t	f	2026-01-30 14:39:47.911	2026-02-02 04:46:05.46
cml0zowr60052ygio5vs5guko	Smirnoff Saborizado	smirnoff-saborizado-mo1f9	Sabor: Raspberry (Frambuesa)	\N	7900	0	0	5	t	f	2026-01-30 14:39:47.922	2026-02-02 04:46:05.46
cml0zowxe005wygiov269jwk7	Pringles Original	pringles-original-94k27	Sabor: Original	\N	4900	0	0	5	t	f	2026-01-30 14:39:48.146	2026-02-02 04:46:05.46
cml0zowxt0061ygiotw053nid	Pringles C&C	pringles-c-c-h64dd	Sabor: Crema y Cebolla	\N	4900	0	0	5	t	f	2026-01-30 14:39:48.162	2026-02-02 04:46:05.46
cml0zowya0066ygiojto1x270	Pringles Cheddar	pringles-cheddar-obgel	Sabor: Cheddar	\N	4900	0	0	5	t	f	2026-01-30 14:39:48.178	2026-02-02 04:46:05.46
cml0zowzt006bygioyd5qgwrz	COMBO SMIRNOFF III	combo-smirnoff-iii-c5o7g	1 Smirnoff Raspberry + 2 Jugos Cepita de Naranja + 1 Hielo 2kg	\N	22900	0	0	5	t	f	2026-01-30 14:39:48.233	2026-02-02 04:46:05.46
cml0zox0p006qygiokxghthwu	Beldent Menta Fuerte	beldent-menta-fuerte-2qd4b	Tipo: Chicle Sabor: Menta Fuerte	\N	800	0	0	5	t	f	2026-01-30 14:39:48.266	2026-02-02 04:46:05.46
cml0zow6p000hygiopw2vu03p	Coca-Cola Original 2.25L	coca-cola-original-2-25l-u6mpq	Sabor: Original / Tamao: 2.25L	\N	5600	0	0	5	t	f	2026-01-30 14:39:47.186	2026-02-04 16:09:55.118
cml0zow7k000rygio0puif8b9	Fernet Branca 750ml	fernet-branca-750ml-h56w4	Tamao: 750ml	\N	11800	0	10	5	t	f	2026-01-30 14:39:47.217	2026-02-04 16:09:55.122
cml0zow9d0016ygioct95ivho	Pritty Limon	pritty-limon-ax5nn	Tamao: 3lts.	\N	3900	0	0	5	t	f	2026-01-30 14:39:47.282	2026-02-04 16:09:55.126
cml0zowf30020ygiokvon5so2	Beagle RED ALE	beagle-red-ale-sn9gw	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.488	2026-02-05 15:24:13.628
cml0zowb9001gygio24q9x8t6	Heineken 473ml	heineken-473ml-2kaly	Tamao: 473ml	\N	3000	0	0	5	t	f	2026-01-30 14:39:47.35	2026-02-04 16:09:55.134
cml0zowfk0025ygio3h126xw8	COMBO BUDWEISER	combo-budweiser-k91af	INCLUYE: 2 Packs x6 (473ml) + Man King 350gr	\N	27900	0	0	5	t	f	2026-01-30 14:39:47.505	2026-02-04 16:09:55.139
cml0zowom0043ygio6tfq2n03	Sprite 2.25L	sprite-2-25l-uzkls	Sabor: Original / Tamao: 2.25L	\N	5600	0	0	5	t	f	2026-01-30 14:39:47.83	2026-02-04 16:09:55.143
cml0zowox0048ygio4b8w3urg	Fanta 2.25L	fanta-2-25l-wmo3g	Tamao: 2.25L	\N	5600	0	0	5	t	f	2026-01-30 14:39:47.842	2026-02-04 16:09:55.147
cml0zowp8004dygiol581vqi1	Coca-Cola Original 1.5L	coca-cola-original-1-5l-dv91f	Sabor: Original / Tamao: 1.5L	\N	4100	0	0	5	t	f	2026-01-30 14:39:47.852	2026-02-04 16:09:55.15
cml0zowq2004nygior4436bal	Coca-Cola Original 500ml	coca-cola-original-500ml-hc71q	Sabor: Original / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:47.882	2026-02-04 16:09:55.157
cml0zowqh004sygioga4f4iy2	Coca-Cola ZERO 500ml 	coca-cola-zero-500ml-u5ltp	Sabor: ZERO Azcar / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:47.897	2026-02-04 16:09:55.161
cml0zowrk0057ygiorb7d6oxh	Monster Energy	monster-energy-uztpg	Tamao: 473ml Sabor: Mango Loco	\N	2800	0	0	5	t	f	2026-01-30 14:39:47.936	2026-02-04 16:09:55.165
cml0zowrz005cygioueghi4vl	Schweppes Agua Tnica 	schweppes-agua-t-nica-0ja4o	Sabor: Agua Tnica / Tamao: 1.5L	\N	3900	0	0	5	t	f	2026-01-30 14:39:47.951	2026-02-04 16:09:55.168
cml0zowse005hygiobekdaz6j	Schweppes ZERO	schweppes-zero-5mykg	Sabor: Pomelo (ZERO Azcar) - Tamao: 1.5L	\N	3900	0	0	5	t	f	2026-01-30 14:39:47.966	2026-02-04 16:09:55.172
cml0zowtg005mygiowcmp14n6	Aperol	aperol-zmfz5	Tamao: 1L / Aperitivo italiano, suave y refrescante, con notas ctricas y amargas. Ideal para Spritz	\N	9200	0	0	5	t	f	2026-01-30 14:39:48.004	2026-02-04 16:09:55.177
cml0zowvn005rygioi8nffkhm	Papel OCB	papel-ocb-h8wei	OCB Premium 1 1/4 ? Papel de liar ultrafino, resistente y de combustin lenta. Ideal para una experiencia suave y uniforme.	\N	1100	0	0	5	t	f	2026-01-30 14:39:48.084	2026-02-04 16:09:55.183
cml0zox0e006lygiokpyhzec3	Pack Schneider x6	pack-schneider-x6-zhrfx	Presentacin: 6 latas de 473ml	\N	18500	0	0	5	t	f	2026-01-30 14:39:48.254	2026-02-05 15:26:36.115
cml0zow8g0011ygio9sfyb99t	Jugo Citric Naranja	jugo-citric-naranja-n6rb6	1lt.	\N	3800	0	0	5	t	f	2026-01-30 14:39:47.248	2026-02-05 15:20:12.511
cml0zowak001bygio5h4kurkv	Pack Heineken x6	pack-heineken-x6-34mzu	Presentacin: 6 latas de 473ml	\N	17900	0	0	5	t	f	2026-01-30 14:39:47.324	2026-02-05 15:23:57.84
cml0zowei001vygiodkveoc6a	Beagle CREAM STOUT	beagle-cream-stout-ie3g0	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.466	2026-02-05 15:24:27.147
cml0zox04006gygio9ubnror0	Schneider 710	schneider-710-9cesa	Tamao: 710ml	\N	3100	0	7	5	t	f	2026-01-30 14:39:48.244	2026-02-05 15:24:43.738
cml0zox11006vygioa94dtj8p	Dr. Lemon Mojito	dr-lemon-mojito-wfy1f	Dr. Lemon 1L / Sabor: Mojito	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.277	2026-02-02 04:46:05.46
cml0zox8d009xygioncst3s0p	Cadbury Yoghurt Frutilla	cadbury-yoghurt-frutilla-9ahno	Chocolate con relleno cremoso de yogur y frutilla. Dulce y fresco en cada mordida.	\N	4400	0	0	5	t	f	2026-01-30 14:39:48.541	2026-02-02 04:46:05.46
cml0zox3x0084ygioltkcm1lw	PRIME x3 - Tachas	prime-x3-tachas-c1mad	Textura con puntos en relieve para un placer extremo.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.381	2026-02-02 04:46:05.46
cml0zox1n0075ygiodagb9vrs	Dr. Lemon Limn	dr-lemon-lim-n-yocv9	Dr. Lemon 1L / Sabor: Limn	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.3	2026-02-04 16:09:55.237
cml0zox1z007aygiog2zkyy5c	Dr. Lemon Pomelo	dr-lemon-pomelo-sic0j	Tamao: 1L / Sabor: Pomelo	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.311	2026-02-04 16:09:55.241
cml0zox29007fygiof4pu0iul	Dr. Lemon Red Berries	dr-lemon-red-berries-mgw2b	Tamao: 1L / Sabor: Red Berries	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.321	2026-02-04 16:09:55.244
cml0zox5b008oygio4sapfs3r	Gin Aconcagua	gin-aconcagua-lzjld	Gin artesanal argentino inspirado en el Monte Aconcagua. Destilado con botnicos seleccionados como enebro, limn, coriandro y raz de regaliz, ofreciendo un perfil fresco y equilibrado. Ideal para ccteles de autor.	\N	18900	0	0	5	t	f	2026-01-30 14:39:48.432	2026-02-04 16:09:55.262
cml0zox5o008tygiokfvsztne	Sprite 500ml 	sprite-500ml-o1aa7	Sabor: Limn / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:48.444	2026-02-04 16:09:55.266
cml0zox5z008yygiom00r8ays	Fanta 500ml	fanta-500ml-9h3sh	Sabor: Naranja / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:48.456	2026-02-04 16:09:55.27
cml0zox6d0093ygioa81bx75u	Sprite 1.5L	sprite-1-5l-a6lpe	Sabor: Limn / Tamao: 1.5L	\N	4100	0	0	5	t	f	2026-01-30 14:39:48.469	2026-02-04 16:09:55.273
cml0zox6p0098ygiowvsurzap	Coca-Cola ZERO 2.25L	coca-cola-zero-2-25l-5fvmy	Sabor: Zero Azcar / Tamao: 2.25	\N	5600	0	2	5	t	f	2026-01-30 14:39:48.481	2026-02-04 16:09:55.277
cml0zox72009dygio38cyirwe	Coca-Cola ZERO 1.5L	coca-cola-zero-1-5l-n7wg0	Sabor: Zero Azcar / Tamao: 1.5L	\N	4100	0	0	5	t	f	2026-01-30 14:39:48.494	2026-02-04 16:09:55.281
cml0zoxen00c5ygio59ae7h5l	Patagonia Amber Lager	patagonia-amber-lager-1fsxc	Cerveza mbar con maltas caramelo. Sabor suave y equilibrado, con notas tostadas y dulces, ideal para acompaar carnes y quesos. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.768	2026-02-05 15:22:24.977
cml0zox7o009nygiowzm8n5yl	Skittles Original	skittles-original-853fl	Un arcoris de sabores frutales en cada bocado. Ideal para compartir o disfrutar solo.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.516	2026-02-04 16:09:55.288
cml5aso2100023wnr30xn3opl	Hielo	hielo-edowg-cmkvb	Peso: 2Kg	cmkvbvo5b000ur0gk0eib5xpt	2800	0	100	5	t	f	2026-02-02 15:01:43.753	2026-02-06 16:33:59.517
cml0zox81009sygio2ncmfp1d	Cofler Block con Man (170 g)	cofler-block-con-man-170-g-tbww6	Clsico chocolate con leche y trozos de man crocante. Pura energa y placer.	\N	6400	0	0	5	t	f	2026-01-30 14:39:48.529	2026-02-04 16:09:55.293
cml0zox3b007uygioav0tg4yb	PRIME x3 - Super Fino	prime-x3-super-fino-elo3i	Sensacin natural, casi como no sentir nada.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.359	2026-02-04 16:09:55.296
cml0zox2z007pygiobsolx9xx	PRIME x3 - Ultra Fino	prime-x3-ultra-fino-1qxtg	Diseado para mxima sensibilidad sin perder proteccin.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.347	2026-02-04 16:09:55.299
cml0zox2m007kygionvlt3o8t	PRIME x3 - Extra Lubricado	prime-x3-extra-lubricado-rymvx	Ms suavidad y deslizamiento para una experiencia cmoda y segura.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.335	2026-02-04 16:09:55.302
cml0zox8p00a2ygioh19l6m0b	Monster Ultra Ros (Zero Sugar)	monster-ultra-ros-zero-sugar-dakl3	Refrescante, sin azcar y con notas frutales suaves. Perfecta para mantenerte activo.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.553	2026-02-04 16:09:55.305
cml0zox9200a7ygio0efcdj61	Monster Zero Ultra (Zero Sugar)	monster-zero-ultra-zero-sugar-w4kis	Ligero, ctrico y sin azcar. Energa limpia con sabor suave.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.566	2026-02-04 16:09:55.308
cml0zox9h00acygiolnd64ft8	Monster Reserve White Pineapple	monster-reserve-white-pineapple-2bzaa	Extico y vibrante, con sabor a anan blanco. Potencia tropical en cada lata.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.581	2026-02-04 16:09:55.311
cml0zox9u00ahygiozoemhaqh	Monster Pipeline Punch	monster-pipeline-punch-876h8	Mezcla frutal intensa con un golpe de energa. La favorita de los fanticos.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.594	2026-02-04 16:09:55.314
cml0zoxa500amygionh3y1q6d	Monster Ultra Sunrise	monster-ultra-sunrise-4bcvx	Energa con un toque ctrico-naranja. Refrescante como un amanecer.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.605	2026-02-04 16:09:55.316
cml0zoxah00arygioyaama0lz	Campari 1L	campari-1l-1ywoo	Clsico aperitivo italiano de sabor amargo y verstil. Infaltable en cocktails.	\N	12200	0	0	5	t	f	2026-01-30 14:39:48.617	2026-02-04 16:09:55.318
cml0zoxau00awygioh4bs1cx3	Mac Baren Choice Dark #16 (30 g)	mac-baren-choice-dark-16-30-g-9xg5r	Tabaco premium de liar con un toque de vainilla oscura. Su sabor suave y aromtico lo convierte en una experiencia elegante y placentera, ideal para quienes buscan calidad y carcter en cada armado.	\N	7800	0	0	5	t	f	2026-01-30 14:39:48.63	2026-02-04 16:09:55.32
cml0zoxb800b1ygioiiwxif4g	Tonking Filter Tips	tonking-filter-tips-7v6r1	Papel filtrante plegado, prctico y limpio. Brinda comodidad y evita partculas.	\N	600	0	0	5	t	f	2026-01-30 14:39:48.644	2026-02-04 16:09:55.323
cml0zoxbj00b6ygiopg5m1taj	Quilmes Sin Alcohol (473 ml)	quilmes-sin-alcohol-473-ml-8auyi	Lager sin alcohol, fresca y ligera, con sabor tradicional Quilmes intacto.	\N	3000	0	0	5	t	f	2026-01-30 14:39:48.655	2026-02-05 15:22:42.626
cml0zoxds00bvygio560hm6i1	Sidra 1888	sidra-1888-82pds	Sidra artesanal con equilibrio dulce-cido, notas frutales y burbujeo sutil.	\N	8500	0	0	5	t	f	2026-01-30 14:39:48.737	2026-02-04 16:09:55.327
cml0zoxe600c0ygiovoegpiac	Schweppes Citrus	schweppes-citrus-6drqf	Refresco gasificado con sabor ctrico nico, mezcla equilibrada de lima, limn y pomelo. Refrescante y verstil, ideal para tomar solo o como mixer en tragos. / 1L	\N	3900	0	0	5	t	f	2026-01-30 14:39:48.75	2026-02-04 16:09:55.329
cml0zoxc000bbygio75uu8yhv	Patagonia Lager del Sur	patagonia-lager-del-sur-je5tm	Lager rubia patagnica, equilibrada y refrescante. Ideal para comidas informales. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.672	2026-02-05 15:21:18.737
cml0zox7c009iygiotcrj6j2m	Cepita Manzana 1.5L	cepita-manzana-1-5l-h3n0a	Sabor: Manzana / Tamao: 1.5L	\N	0	0	0	5	t	f	2026-01-30 14:39:48.504	2026-02-05 15:18:08.037
cml0zox4z008jygio02is6mvc	Pack Grolsch x6 	pack-grolsch-x6-tuy39	Presentacin: 6 latas de 473ml	\N	14900	0	0	5	t	f	2026-01-30 14:39:48.419	2026-02-05 15:23:17.674
cml0zoxjd00dyygioh61ksw73	TEST	test-vxtbb	Es solo una prueba	\N	1	0	0	5	t	f	2026-01-30 14:39:48.938	2026-02-02 04:46:05.46
cml0zoxjs00e3ygio9a05ejwj	Internet1	internet1-awd7b	25MB Simetricos	\N	1	0	100	5	t	f	2026-01-30 14:39:48.952	2026-02-02 04:46:05.46
cml0zoxk500e8ygiot97181nk	COMBO PIZZA I	combo-pizza-i-94orm	INCLUYE: 2 Pizzas + 1 Coca- Cola 2.5L + ENVIO A TODA LA CIUDAD!	\N	25900	0	6	5	t	f	2026-01-30 14:39:48.966	2026-02-02 04:46:05.46
cml0zoxkx00eiygiopvf28d81	COMBO PIZZA II	combo-pizza-ii-8pwvg	INCLUYE: 2 Pizzas + 2 Shneider 710ml + ENVIO A TODA LA CIUDAD!	\N	25900	0	2	5	t	f	2026-01-30 14:39:48.993	2026-02-02 04:46:05.46
cml0zoxlj00esygio5j1ge0c7	COMBO FERNET 750	combo-fernet-750-da8in	INCLUYE: 1 Fernet 750ml + 2 Coca-Cola 2.5lts + 1 Bolsa de Hielo 2Kg	\N	22900	0	9	5	t	f	2026-01-30 14:39:49.015	2026-02-02 04:46:05.46
cml0zoxlw00exygioqz1ixhfv	Falafel	falafel-vfyd7	Croquetas de garbazo	\N	6000	0	3	5	t	f	2026-01-30 14:39:49.028	2026-02-02 04:46:05.46
cml0zox3l007zygioc3mh42x3	PRIME x3 - Mega	prime-x3-mega-ycsm6	Mayor comodidad con un ancho extra para un ajuste perfecto.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.369	2026-02-02 04:46:05.46
cml4byqzx000u7c7eqibp2yi7	Santa Julia Chenin Dulce Natural	santa-julia-chenin-dulce-natural-lzdnj-cmkvb	Vino blanco dulce de color amarillo verdoso. Destaca por sus aromas a durazno blanco, damasco, hierbas frescas y toques ctricos como limn y pomelo. En boca, es suave, delicado, con equilibrio entre acidez y azcar natural, y un final untuoso. Ideal como aperitivo o para acompaar snacks, mariscos o postres ctricos.	cmkvbvo5b000ur0gk0eib5xpt	6100	0	100	5	t	f	2026-02-01 22:46:40.942	2026-02-04 16:09:55.047
cml0zoxcy00blygio420b0myj	Santa Julia Chenin Dulce Natural	santa-julia-chenin-dulce-natural-lzdnj	Vino blanco dulce de color amarillo verdoso. Destaca por sus aromas a durazno blanco, damasco, hierbas frescas y toques ctricos como limn y pomelo. En boca, es suave, delicado, con equilibrio entre acidez y azcar natural, y un final untuoso. Ideal como aperitivo o para acompaar snacks, mariscos o postres ctricos.	\N	6100	0	0	5	t	f	2026-01-30 14:39:48.706	2026-02-05 15:08:25.955
cml0zoxff00cfygioxzxvf05c	Patagonia 24.7 Session IPA	patagonia-24-7-session-ipa-3027e	IPA ligera de bajo alcohol (4,2%), con lpulo patagnico. Refrescante, ctrica y fcil de tomar en cualquier momento. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.795	2026-02-05 15:21:59.88
cml0zoxf000caygiowbgdvncd	Patagonia Vera IPA	patagonia-vera-ipa-6uha3	New England IPA de amargor moderado y final fresco. Aromas tropicales y ctricos intensos, con cuerpo sedoso y balanceado. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.781	2026-02-05 15:20:35.458
cml0zoxfr00ckygiolp4urnlv	Red Bull Energy Drink 350ml	red-bull-energy-drink-350ml-vwscy	Bebida energtica con cafena y taurina, ideal para activar cuerpo y mente. / Tamao: 250ml	\N	4400	0	0	5	t	f	2026-01-30 14:39:48.807	2026-02-04 16:09:55.339
cml0zoxg300cpygiokvdxmmnr	Red Bull Energy Drink 4 Pack	red-bull-energy-drink-4-pack-fapw4	Pack de 4 latas de energa instantnea con el clsico sabor Red Bull.	\N	15900	0	0	5	t	f	2026-01-30 14:39:48.819	2026-02-04 16:09:55.342
cml0zoxgg00cuygio8t57k88f	Papas Lay?s Clsicas 234g	papas-lay-s-cl-sicas-234g-f1u0s	Papas fritas crocantes con sal, hechas con solo 3 ingredientes: papa, aceite y sal. / Peso: 234g	\N	6900	0	0	5	t	f	2026-01-30 14:39:48.832	2026-02-04 16:09:55.344
cml0zoxh900d4ygiouyhb0xwz	Ferrero Rocher 24u	ferrero-rocher-24u-flkcq	Bombones de avellana y chocolate, envueltos en un icnico dorado, perfectos para regalar.	\N	19000	0	0	5	t	f	2026-01-30 14:39:48.861	2026-02-04 16:09:55.349
cml0zoxhl00d9ygio8w4zfg5q	Filtros Gizeh Slim 6mm (150u)	filtros-gizeh-slim-6mm-150u-iisw0	Filtros slim de 6 mm, con sistema Lick & Stick para un armado prctico.	\N	2300	0	0	5	t	f	2026-01-30 14:39:48.873	2026-02-04 16:09:55.351
cml0zoxhx00deygiot4ymu3zq	Stamps Filter Tips XL (50 hojas)	stamps-filter-tips-xl-50-hojas-4dfii	Filtros de cartn extra grandes para armar, resistentes y fciles de usar. Brindan mejor soporte, evitan el paso de partculas y hacen ms cmodo cada armado.	\N	1100	0	0	5	t	f	2026-01-30 14:39:48.886	2026-02-04 16:09:55.353
cml0zoxib00djygio6fdcrswa	Cartas UNO	cartas-uno-ae47f	Clsico juego de cartas para 2 a 10 jugadores. Dinmico y divertido, combina colores y nmeros con cartas especiales que cambian el rumbo del juego. Ideal para todas las edades.	\N	6900	0	0	5	t	f	2026-01-30 14:39:48.899	2026-02-04 16:09:55.356
cml0zoxin00doygio8ns8h67a	Jenga de Madera	jenga-de-madera-oxm01	Clsico juego de destreza y equilibrio con bloques de madera. Ideal para jugar en grupo, poner a prueba la paciencia y la precisin, diversin asegurada en cada movimiento!	\N	9900	0	0	5	t	f	2026-01-30 14:39:48.911	2026-02-04 16:09:55.358
cml0zoxdc00bqygio9vxh4n01	Santa Julia Tardo 	santa-julia-tard-o-ymuzp	Vino dulce natural de cosecha tarda. Presenta aromas intensos a miel, flores blancas y frutas tropicales maduras. En boca es untuoso, con buena acidez que equilibra su dulzura, ideal para acompaar postres, quesos azules o disfrutar solo como vino de sobremesa. / 500ml	\N	7000	0	0	5	t	f	2026-01-30 14:39:48.721	2026-02-05 15:09:14.798
cml0zoxcl00bgygiol97fx66b	Alma Mora Malbec	alma-mora-malbec-ryms4	Vino tinto argentino de color rojo intenso. Destaca por sus aromas a ciruelas y frutos rojos maduros, con un delicado toque de vainilla. Su sabor es carnoso, de cuerpo pleno, con final largo y equilibrado entre fruta y roble. Perfecto para acompaar carnes rojas, cordero o pato.	\N	5800	0	0	5	t	f	2026-01-30 14:39:48.694	2026-02-04 16:09:55.363
cml0zoxiz00dtygiolm6z1u4v	Cartas Espaolas x50	cartas-espa-olas-x50-cu1ei	Baraja tradicional espaola, plastificada y lavable. Resistente y prctica, perfecta para juegos clsicos como Truco, Escoba o Chin Chn.	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.923	2026-02-04 16:09:55.365
cml0zoxkj00edygioodeptpo9	Coca-Cola Original 2.5L	coca-cola-original-2-5l-hr14d	Sabor: Original / Tamao: 2.5L	\N	5800	0	12	5	t	f	2026-01-30 14:39:48.979	2026-02-04 16:09:55.367
cml0zoxl700enygion9pq2g1d	PROMO FERNET	promo-fernet-fd2dv	Incluye: 1 Fernet 750ml + 1 Coca-Cola 2.5L + 1 Hielo 2KG + ENVO A TODA LA CIUDAD!	\N	19900	0	9	5	t	f	2026-01-30 14:39:49.004	2026-02-04 16:09:55.369
cml0zoxgv00czygioguxjupzm	Heineken 1L	heineken-1l-gnnkt	Cerveza lager premium de origen holands, fresca, balanceada y de calidad internacional. / Tamao: 1L	\N	4800	0	0	5	t	f	2026-01-30 14:39:48.847	2026-02-05 15:17:48.366
cml4byqzr000r7c7e1teso4bl	Alma Mora Malbec	alma-mora-malbec-ryms4-cmkvb	Vino tinto argentino de color rojo intenso. Destaca por sus aromas a ciruelas y frutos rojos maduros, con un delicado toque de vainilla. Su sabor es carnoso, de cuerpo pleno, con final largo y equilibrado entre fruta y roble. Perfecto para acompaar carnes rojas, cordero o pato.	cmkvbvo5b000ur0gk0eib5xpt	5800	0	97	5	t	f	2026-02-01 22:46:40.936	2026-02-04 16:09:55.374
cml4bpile000h7c7e66as2x35	Apple iPhone 17 Pro Max (256 GB) - Naranja csmico	apple-iphone-17-pro-max-(256-gb)---naranja-c??smico-1769985570141	iPhone 17 Pro Max. El iPhone ms poderoso hasta ahora. Espectacular pantalla de 6.9 pulgadas , diseo\r\nunibody de aluminio, chip A19 Pro, cmaras traseras de\r\n48 MP y la mayor duracin de batera hasta ahora.\r\n? DISENO UNIBODY. PARA UNA POTENCIA FUERA DE SERIE.\r\nGracias a su diseo unibody de aluminio forjado en caliente, este es el iPhone ms poderoso que existe.\r\n? CERAMIC SHIELD SUPERRESISTENTE. DELANTE Y ATRS. El Ceramic Shield protege la parte posterior del iPhone 17 Pro Max y lo vuelve 4 veces ms resistente a los golpes?\r\n. Y el nuevo frente de Ceramic\r\nShield 2 tiene una resistencia a los rayones 3 veces mayor?\r\n? EL MEJOR SISTEMA DE CMARAS PRO.\r\nEquipado con cmaras traseras de 48 MP y zoom de 8x de calidad ptica, el mayor rango de zoom que se haya visto en un iPhone. Es como tener 8 lentes profesionales en tu bolsillo.\r\n? CMARA FRONTAL CENTER STAGE DE 18 MP.	cmkvbvo5b000ur0gk0eib5xpt	2650000	1855000	100	5	t	f	2026-02-01 22:39:30.145	2026-02-04 16:09:55.061
cml0zow64000cygioah9y72ik	COMBO BALBO	combo-balbo-1ezfw	INCLUYE: 2 vinos Via De Balbo + 1 Pritty 3lts + 1 Hielo 2Kg	\N	21900	0	0	5	t	f	2026-01-30 14:39:47.165	2026-02-04 16:09:55.112
cml0zowpo004iygioicsf2599	CHOCOTORTA - Porcion Individual	chocotorta-porcion-individual-j1gek	Chocotorta cremosa y deliciosa. Capas de galletitas Chocolinas, dulce de leche y queso crema. El postre argentino ms pedido, listo para disfrutar bien fro.	\N	5900	0	0	5	t	f	2026-01-30 14:39:47.869	2026-02-04 16:09:55.154
cml0zox1c0070ygioteseuznh	Dr. Lemon Vodka	dr-lemon-vodka-lxcop	Tamao: 1L / Sabor: Vodka	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.288	2026-02-04 16:09:55.233
cml0zox4b0089ygiouy3moewv	Takis	takis-2ipci	Snack de maz enrollado con intenso sabor a aj picante y limn. Crocantes, cidos y explosivos. / Tamao: 89gr	\N	1900	0	0	5	t	f	2026-01-30 14:39:48.395	2026-02-04 16:09:55.248
cml9mbzy6002lpwgoivafmptj	Heineken 1L	heineken-1l-gnnkt-cmkvb	Cerveza lager premium de origen holands, fresca, balanceada y de calidad internacional. / Tamao: 1L	cmkvbvo3z0008r0gkc7qfxplz	4800	0	100	5	t	f	2026-02-05 15:35:46.11	2026-02-05 15:35:46.11
cmla0qhux000f3ivobd1ursts	Patagonia Amber Lager	patagonia-amber-lager-1fsxc-cmkvb	Cerveza mbar con maltas caramelo. Sabor suave y equilibrado, con notas tostadas y dulces, ideal para acompaar carnes y quesos. / Tamao: 740ml	cmkvbvo3z0008r0gkc7qfxplz	5000	0	100	5	t	f	2026-02-05 22:18:57.128	2026-02-05 22:18:57.128
cmla0qhvm000k3ivo0mka6fph	Patagonia 24.7 Session IPA	patagonia-24-7-session-ipa-3027e-cmkvb	IPA ligera de bajo alcohol (4,2%), con lpulo patagnico. Refrescante, ctrica y fcil de tomar en cualquier momento. / Tamao: 740ml	cmkvbvo3z0008r0gkc7qfxplz	5000	0	100	5	t	f	2026-02-05 22:18:57.155	2026-02-05 22:18:57.155
cml4pahxe0001g0s2gf3mvkrd	Cartas UNO	cartas-uno-ae47f-cmkvb	Clsico juego de cartas para 2 a 10 jugadores. Dinmico y divertido, combina colores y nmeros con cartas especiales que cambian el rumbo del juego. Ideal para todas las edades.	cmkvbvo5b000ur0gk0eib5xpt	6900	0	100	5	t	f	2026-02-02 04:59:44.042	2026-02-06 15:56:52.637
cml4pai550007g0s2rc70nru6	Cartas Espaolas x50	cartas-espa-olas-x50-cu1ei-cmkvb	Baraja tradicional espaola, plastificada y lavable. Resistente y prctica, perfecta para juegos clsicos como Truco, Escoba o Chin Chn.	cmkvbvo5b000ur0gk0eib5xpt	5000	0	100	5	t	f	2026-02-02 04:59:44.344	2026-02-06 16:41:10.069
cmla0qhvu000p3ivoez0th7no	Patagonia Vera IPA	patagonia-vera-ipa-6uha3-cmkvb	New England IPA de amargor moderado y final fresco. Aromas tropicales y ctricos intensos, con cuerpo sedoso y balanceado. / Tamao: 740ml	cmkvbvo3z0008r0gkc7qfxplz	5000	0	100	5	t	f	2026-02-05 22:18:57.162	2026-02-07 00:31:48.174
cmlbnnt2b000210ncti5soy3s	Beldent	beldent-a1y54-cmkvb	Tipo: Chicle Sabor: Menta	cmkvbvo5b000ur0gk0eib5xpt	800	0	100	5	t	f	2026-02-07 01:48:29.026	2026-02-07 01:48:29.026
cmlbnu9v5000910ncd7gj7dmy	Snickers	snickers-ipbq6-cmkvb	Peso: 48gr	cmkvbvo5b000ur0gk0eib5xpt	2700	0	100	5	t	f	2026-02-07 01:53:30.735	2026-02-07 01:53:30.735
cml4pai4d0004g0s232dhvgsh	Jenga de Madera	jenga-de-madera-oxm01-cmkvb	Clsico juego de destreza y equilibrio con bloques de madera. Ideal para jugar en grupo, poner a prueba la paciencia y la precisin, diversin asegurada en cada movimiento!	cmkvbvo5b000ur0gk0eib5xpt	9900	0	100	5	t	f	2026-02-02 04:59:44.317	2026-02-07 01:56:19.017
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, "productId", "categoryId") FROM stdin;
cmkvbvo4f000er0gkmtl80gp8	cmkvbvo47000ar0gk4zi9lpbi	cmkvbvo1n0002r0gklrqbox7o
cmkvbvo4p000kr0gk0qsv173x	cmkvbvo4j000gr0gkdnii5wl3	cmkvbvo1n0002r0gklrqbox7o
cmkvbvo50000qr0gk6pg7dmxn	cmkvbvo4s000mr0gkm6bpedcj	cmkvbvo1n0002r0gklrqbox7o
cmkvbvo5o0010r0gkxap611d6	cmkvbvo5f000wr0gkwdsxy501	cmkvbvo3k0004r0gkby3xi0g4
cmkvbvo610016r0gksnidfwdh	cmkvbvo5s0012r0gknilcgfre	cmkvbvo3k0004r0gkby3xi0g4
cmkvbvo6c001cr0gk2vlwowd5	cmkvbvo650018r0gkp96zwmxm	cmkvbvo3k0004r0gkby3xi0g4
cmkvbvo6t001mr0gkcykryeg0	cmkvbvo6n001ir0gkd49h1c39	cmkvbvo3b0003r0gk2uttx4lq
cmkvbvo73001sr0gk2vhua2de	cmkvbvo6w001or0gkh6my0iu3	cmkvbvo3b0003r0gk2uttx4lq
cmkvbvo7e001yr0gkfrgrsuhq	cmkvbvo76001ur0gk6sv6o03m	cmkvbvo3b0003r0gk2uttx4lq
cml0zow4q0004ygio2m2fzzes	cml0zow4q0002ygio1z3yvt0a	cml0zow3e0000ygiogdypolr3
cml0zow5q0009ygioo8i8hfsf	cml0zow5p0007ygio5orv9auu	cml0zow3e0000ygiogdypolr3
cml0zow65000eygio16qxi4d4	cml0zow64000cygioah9y72ik	cml0zow3e0000ygiogdypolr3
cml0zow6p000jygiox780gu1s	cml0zow6p000hygiopw2vu03p	cml0zow6h000fygio11bf03c6
cml0zow75000oygio5n845skq	cml0zow75000mygiogcrr8zbt	cml0zow6y000kygio98l495ny
cml0zow7k000tygios6dsw1w4	cml0zow7k000rygio0puif8b9	cml0zow7d000pygioyc93s0na
cml0zow80000yygioiw2do8w3	cml0zow80000wygio5p7qiekz	cml0zow7t000uygio3e9l5uwk
cml0zow9d0018ygio04mzu7px	cml0zow9d0016ygioct95ivho	cml0zow6h000fygio11bf03c6
cml0zowb9001iygio1e2jzrrn	cml0zowb9001gygio24q9x8t6	cml0zow9t0019ygioovj10h90
cml0zowdh001nygiovsevkzz7	cml0zowdh001lygioya8h5i2e	cml0zow9t0019ygioovj10h90
cml0zowe0001sygioihwrb0hk	cml0zowe0001qygio6770tgax	cml0zow9t0019ygioovj10h90
cml0zowfk0027ygioevtrzyi6	cml0zowfk0025ygio3h126xw8	cml0zow3e0000ygiogdypolr3
cml0zowfz002cygiota1mngtt	cml0zowfz002aygiojnu5ohfc	cml0zowft0028ygioo962wjej
cml0zowgd002hygioa8tlg65x	cml0zowgd002fygio0lfk2i5a	cml0zowft0028ygioo962wjej
cml0zowgp002mygio4b04xd7k	cml0zowgp002kygioovdzms2z	cml0zow3e0000ygiogdypolr3
cml0zowh0002rygio3ptbxz0r	cml0zowh0002pygioxd363dfm	cml0zow3e0000ygiogdypolr3
cml0zowhc002wygioj9moaekn	cml0zowhc002uygio6f32lu5f	cml0zow3e0000ygiogdypolr3
cml0zowhq0031ygiolyo0331v	cml0zowhp002zygio7dlj16vo	cml0zow3e0000ygiogdypolr3
cml0zowie0036ygiob7sgqz5f	cml0zowie0034ygiof9mv6db3	cml0zow3e0000ygiogdypolr3
cml0zowjo003bygioujbmn7va	cml0zowjo0039ygioqg9zzfwy	cml0zow3e0000ygiogdypolr3
cml0zown8003qygiov1x8uxye	cml0zown8003oygiot5n7mxeu	cml0zow7d000pygioyc93s0na
cml0zowns003vygiombqrsmx1	cml0zowns003tygiovi25qjmj	cml0zow7d000pygioyc93s0na
cml0zowom0045ygiok1r3yypq	cml0zowom0043ygio6tfq2n03	cml0zow6h000fygio11bf03c6
cml0zowox004aygio447frdjq	cml0zowox0048ygio4b8w3urg	cml0zow6h000fygio11bf03c6
cml0zowp8004fygion9kwl6qe	cml0zowp8004dygiol581vqi1	cml0zow6h000fygio11bf03c6
cml0zowpo004kygiouy18wg56	cml0zowpo004iygioicsf2599	cml0zow7t000uygio3e9l5uwk
cml0zowq2004pygiorbsx6yx6	cml0zowq2004nygior4436bal	cml0zow6h000fygio11bf03c6
cml0zowqh004uygiovqt137sj	cml0zowqh004sygioga4f4iy2	cml0zow6h000fygio11bf03c6
cml0zowqu004zygiopjikyqkf	cml0zowqu004xygio8gd5lji9	cml0zow7d000pygioyc93s0na
cml0zowr60054ygioxlvvooe0	cml0zowr60052ygio5vs5guko	cml0zow7d000pygioyc93s0na
cml0zowrk0059ygiocq0lnro7	cml0zowrk0057ygiorb7d6oxh	cml0zow6h000fygio11bf03c6
cml0zowrz005eygio544jlkn2	cml0zowrz005cygioueghi4vl	cml0zow6h000fygio11bf03c6
cml0zowse005jygioiufr2gzn	cml0zowse005hygiobekdaz6j	cml0zow6h000fygio11bf03c6
cml0zowtg005oygioneaueish	cml0zowtg005mygiowcmp14n6	cml0zow7d000pygioyc93s0na
cml0zowvn005tygioism4oa2s	cml0zowvn005rygioi8nffkhm	cml0zow6y000kygio98l495ny
cml0zowxe005yygiomvs25by9	cml0zowxe005wygiov269jwk7	cml0zow7t000uygio3e9l5uwk
cml0zowxu0063ygio4a802dxv	cml0zowxt0061ygiotw053nid	cml0zow7t000uygio3e9l5uwk
cml0zowya0068ygiokwyau955	cml0zowya0066ygiojto1x270	cml0zow7t000uygio3e9l5uwk
cml0zowzt006dygiow45d90wf	cml0zowzt006bygioyd5qgwrz	cml0zow3e0000ygiogdypolr3
cml0zox0p006sygioiky2suvi	cml0zox0p006qygiokxghthwu	cml0zowft0028ygioo962wjej
cml0zox11006xygio2o5mhdnp	cml0zox11006vygioa94dtj8p	cml0zow7d000pygioyc93s0na
cml0zox1c0072ygiocibm25og	cml0zox1c0070ygioteseuznh	cml0zow7d000pygioyc93s0na
cml0zox1n0077ygioemg4mtd4	cml0zox1n0075ygiodagb9vrs	cml0zow7d000pygioyc93s0na
cml0zox1z007cygiobuuofncl	cml0zox1z007aygiog2zkyy5c	cml0zow7d000pygioyc93s0na
cml0zox29007hygio9czpny01	cml0zox29007fygiof4pu0iul	cml0zow7d000pygioyc93s0na
cml0zox2m007mygiop4akxxlf	cml0zox2m007kygionvlt3o8t	cml0zox2g007iygioza8q1bmh
cml0zox2z007rygiogq2vcrym	cml0zox2z007pygiobsolx9xx	cml0zox2g007iygioza8q1bmh
cml0zox3b007wygiow5dkj55n	cml0zox3b007uygioav0tg4yb	cml0zox2g007iygioza8q1bmh
cml0zox3l0081ygioomd7ddjr	cml0zox3l007zygioc3mh42x3	cml0zox2g007iygioza8q1bmh
cml0zox3x0086ygio8cb0zn20	cml0zox3x0084ygioltkcm1lw	cml0zox2g007iygioza8q1bmh
cml0zox4b008bygiosehsn4iu	cml0zox4b0089ygiouy3moewv	cml0zow7t000uygio3e9l5uwk
cml0zox5b008qygiohbicl637	cml0zox5b008oygio4sapfs3r	cml0zow7d000pygioyc93s0na
cml0zox5o008vygiob5d2cyvw	cml0zox5o008tygiokfvsztne	cml0zow6h000fygio11bf03c6
cml0zox5z0090ygiov1ge5a3z	cml0zox5z008yygiom00r8ays	cml0zow6h000fygio11bf03c6
cml0zox6d0095ygio550akroh	cml0zox6d0093ygioa81bx75u	cml0zow6h000fygio11bf03c6
cml0zox6p009aygiomt798sqb	cml0zox6p0098ygiowvsurzap	cml0zow6h000fygio11bf03c6
cml0zox72009fygiomm4ffope	cml0zox72009dygio38cyirwe	cml0zow6h000fygio11bf03c6
cml0zox7o009pygio2lb3jk69	cml0zox7o009nygiowzm8n5yl	cml0zowft0028ygioo962wjej
cml0zox81009uygiofc61372h	cml0zox81009sygio2ncmfp1d	cml0zowft0028ygioo962wjej
cml0zox8d009zygioxz2o5xqa	cml0zox8d009xygioncst3s0p	cml0zowft0028ygioo962wjej
cml0zox8p00a4ygio20etnj69	cml0zox8p00a2ygioh19l6m0b	cml0zow6h000fygio11bf03c6
cml0zox9200a9ygioxn0o0z0f	cml0zox9200a7ygio0efcdj61	cml0zow6h000fygio11bf03c6
cml0zox9h00aeygiojkyqm9zc	cml0zox9h00acygiolnd64ft8	cml0zow6h000fygio11bf03c6
cml0zox9u00ajygio2l2ptr7n	cml0zox9u00ahygiozoemhaqh	cml0zow6h000fygio11bf03c6
cml0zoxa500aoygiob9fa82p1	cml0zoxa500amygionh3y1q6d	cml0zow6h000fygio11bf03c6
cml0zoxah00atygiolgs2gers	cml0zoxah00arygioyaama0lz	cml0zow7d000pygioyc93s0na
cml0zoxau00ayygiolk8jxwmd	cml0zoxau00awygioh4bs1cx3	cml0zow6y000kygio98l495ny
cml0zoxb800b3ygior36vltm4	cml0zoxb800b1ygioiiwxif4g	cml0zow6y000kygio98l495ny
cml0zoxcl00biygioiq5kclv0	cml0zoxcl00bgygiol97fx66b	cml0zoxcb00beygiop03ia9ox
cml0zoxds00bxygio6jpflcw3	cml0zoxds00bvygio560hm6i1	cml0zow7d000pygioyc93s0na
cml0zoxe600c2ygiorjb757gu	cml0zoxe600c0ygiovoegpiac	cml0zow6h000fygio11bf03c6
cml0zoxfr00cmygiofdmzmkng	cml0zoxfr00ckygiolp4urnlv	cml0zow6h000fygio11bf03c6
cml0zoxg300crygiocebwpla5	cml0zoxg300cpygiokvdxmmnr	cml0zow6h000fygio11bf03c6
cml0zoxgg00cwygiocbj76ywv	cml0zoxgg00cuygio8t57k88f	cml0zow7t000uygio3e9l5uwk
cml0zoxh900d6ygioukw7zkwa	cml0zoxh900d4ygiouyhb0xwz	cml0zowft0028ygioo962wjej
cml0zoxhl00dbygiogabdsz61	cml0zoxhl00d9ygio8w4zfg5q	cml0zow6y000kygio98l495ny
cml0zoxhx00dgygiovvagp52s	cml0zoxhx00deygiot4ymu3zq	cml0zow6y000kygio98l495ny
cml0zoxib00dlygioiuv3b5gy	cml0zoxib00djygio6fdcrswa	cml0zoxi500dhygioxr9f0loc
cml0zoxin00dqygio795yl5hx	cml0zoxin00doygio8ns8h67a	cml0zoxi500dhygioxr9f0loc
cml0zoxiz00dvygio0qfonn9a	cml0zoxiz00dtygiolm6z1u4v	cml0zoxi500dhygioxr9f0loc
cml0zoxjd00e0ygioe0dqvs3c	cml0zoxjd00dyygioh61ksw73	cml0zow3e0000ygiogdypolr3
cml0zoxjs00e5ygio7yz608g4	cml0zoxjs00e3ygio9a05ejwj	cml0zow3e0000ygiogdypolr3
cml0zoxk500eaygiobo64pfn2	cml0zoxk500e8ygiot97181nk	cml0zow3e0000ygiogdypolr3
cml0zoxkj00efygiouxke0v2d	cml0zoxkj00edygioodeptpo9	cml0zow6h000fygio11bf03c6
cml0zoxkx00ekygioryuha5km	cml0zoxkx00eiygiopvf28d81	cml0zow3e0000ygiogdypolr3
cml0zoxl700epygion55b8go6	cml0zoxl700enygion9pq2g1d	cml0zow3e0000ygiogdypolr3
cml0zoxlj00euygione2s5j0x	cml0zoxlj00esygio5j1ge0c7	cml0zow3e0000ygiogdypolr3
cml4bsfaq000m7c7eico5kfzh	cml4bpile000h7c7e66as2x35	cml0zox2g007iygioza8q1bmh
cml4byqzc000q7c7ef5d1tozx	cml4byqzb000o7c7e8hie5vrz	cml0zoxcb00beygiop03ia9ox
cml4byqzr000t7c7ekgprdc3c	cml4byqzr000r7c7e1teso4bl	cml0zoxcb00beygiop03ia9ox
cml4byqzy000w7c7e6vspnx8x	cml4byqzx000u7c7eqibp2yi7	cml0zoxcb00beygiop03ia9ox
cml4byrg900107c7excq4fonp	cml4byrg9000y7c7e678cio8s	cml0zox2g007iygioza8q1bmh
cml4byrgf00137c7eyda1ukpb	cml4byrgf00117c7e9qixucyd	cml0zox2g007iygioza8q1bmh
cml4byrgm00167c7e5c8hmf3n	cml4byrgm00147c7e88j2quw8	cml0zox2g007iygioza8q1bmh
cml4byrgs00197c7e73jpl6p3	cml4byrgs00177c7erghv3whj	cml0zox2g007iygioza8q1bmh
cml9lcueb000epwgotyr3lbiw	cml0zoxcy00blygio420b0myj	cml0zoxcb00beygiop03ia9ox
cml9ldw32000ipwgo62ze74ya	cml0zoxdc00bqygio9vxh4n01	cml0zoxcb00beygiop03ia9ox
cml9lowcu000lpwgoxfgxb42b	cml0zoxgv00czygioguxjupzm	cml0zow9t0019ygioovj10h90
cml9lpbj8000opwgo6fxinyjx	cml0zox7c009iygiotcrj6j2m	cml0zow88000zygioaxhmxkcx
cml9lpsor000rpwgon9q2b5f0	cml0zowo9003yygio9oge7o70	cml0zow88000zygioaxhmxkcx
cml9lrbzd000xpwgol25z3m8u	cml0zowmr003jygioz946gzop	cml0zow88000zygioaxhmxkcx
cml9lrlse0010pwgo4c88qu7t	cml0zowle003eygio2lvjmvh5	cml0zow88000zygioaxhmxkcx
cml9lrzku0013pwgo4uq4m0o3	cml0zow8g0011ygio9sfyb99t	cml0zow88000zygioaxhmxkcx
cml9lshaa0016pwgot0l5s04f	cml0zoxf000caygiowbgdvncd	cml0zow9t0019ygioovj10h90
cml9lteoh001cpwgohodteru2	cml0zoxc000bbygio75uu8yhv	cml0zow9t0019ygioovj10h90
cml9luafc001ipwgoifjvls0e	cml0zoxff00cfygioxzxvf05c	cml0zow9t0019ygioovj10h90
cml9lutsh001lpwgodz4ctb5p	cml0zoxen00c5ygio59ae7h5l	cml0zow9t0019ygioovj10h90
cml9lv7eq001opwgo6s62948g	cml0zoxbj00b6ygiopg5m1taj	cml0zow9t0019ygioovj10h90
cml9lvyga001rpwgo4z6dfwg6	cml0zox4z008jygio02is6mvc	cml0zow9t0019ygioovj10h90
cml9lwib1001upwgo1654kf3p	cml0zox4n008eygioznyef44n	cml0zow9t0019ygioovj10h90
cml9lwtg0001xpwgouoxnardd	cml0zowak001bygio5h4kurkv	cml0zow9t0019ygioovj10h90
cml9lx5mj0020pwgosg9j1tdb	cml0zowf30020ygiokvon5so2	cml0zow9t0019ygioovj10h90
cml9lxg230023pwgonc69vrv5	cml0zowei001vygiodkveoc6a	cml0zow9t0019ygioovj10h90
cml9lxsuy0026pwgo8nl1cnih	cml0zox04006gygio9ubnror0	cml0zow9t0019ygioovj10h90
cml9m07kj0029pwgoccv9t9qd	cml0zox0e006lygiokpyhzec3	cml0zow9t0019ygioovj10h90
cml9mbzy6002opwgo8l7pylti	cml9mbzy6002lpwgoivafmptj	cml0zow9t0019ygioovj10h90
cmla0qhux000i3ivo8zaczx91	cmla0qhux000f3ivobd1ursts	cml0zow9t0019ygioovj10h90
cmla0qhvm000n3ivo56yaiam4	cmla0qhvm000k3ivo0mka6fph	cml0zow9t0019ygioovj10h90
cmlb2izyu00033f2js8l4mkcz	cml4pahxe0001g0s2gf3mvkrd	cml0zoxi500dhygioxr9f0loc
cmlb3uq610003r2kswi6plo1e	cml5aso2100023wnr30xn3opl	cml0zow6y000kygio98l495ny
cmlb43yfu0003iudhc1oxf036	cml4pai550007g0s2rc70nru6	cml0zoxi500dhygioxr9f0loc
cmlbkx71g000711wbsfq71qfx	cmla0qhvu000p3ivoez0th7no	cml0zow9t0019ygioovj10h90
cmlbnnt2b000410ncvhe6q2zf	cmlbnnt2b000210ncti5soy3s	cml0zowft0028ygioo962wjej
cmlbnu9v5000b10nce85qh9o6	cmlbnu9v5000910ncd7gj7dmy	cml0zowft0028ygioo962wjej
cmlbnxvr7000g10nc98k5zitm	cml4pai4d0004g0s232dhvgsh	cml0zoxi500dhygioxr9f0loc
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductImage" (id, "productId", url, alt, "order") FROM stdin;
cmkvbvo4c000cr0gkfjyw00lx	cmkvbvo47000ar0gk4zi9lpbi	https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400	Hamburguesa Cl??sica	0
cmkvbvo4n000ir0gkd4q8mze5	cmkvbvo4j000gr0gkdnii5wl3	https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400	Hamburguesa Doble	0
cmkvbvo4w000or0gkhcn5xku3	cmkvbvo4s000mr0gkm6bpedcj	https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400	Hamburguesa Veggie	0
cmkvbvo5j000yr0gkdnm4pds1	cmkvbvo5f000wr0gkwdsxy501	https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400	Pizza Margherita	0
cmkvbvo5x0014r0gkezdjzc28	cmkvbvo5s0012r0gknilcgfre	https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400	Pizza Pepperoni	0
cmkvbvo68001ar0gkrvepubof	cmkvbvo650018r0gkp96zwmxm	https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400	Pizza 4 Quesos	0
cmkvbvo6q001kr0gk3t9shxed	cmkvbvo6n001ir0gkd49h1c39	https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400	Roll California	0
cmkvbvo70001qr0gkoy36b1tu	cmkvbvo6w001or0gkh6my0iu3	https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400	Roll Salm??n	0
cmkvbvo7a001wr0gkgtk8ta04	cmkvbvo76001ur0gk6sv6o03m	https://images.unsplash.com/photo-1553621042-f6e147245754?w=400	Combo 30 piezas	0
cml4bpilf000i7c7e3ok5m1v2	cml4bpile000h7c7e66as2x35	/uploads/products/1769985460341-IMG_5353.jpg	Apple iPhone 17 Pro Max (256 GB) - Naranja c??smico	0
cml9lcue0000dpwgoshscyu0f	cml0zoxcy00blygio420b0myj	/uploads/products/1770304101427-798464-800-600.webp	\N	0
cml9lowcg000kpwgoc2vzk63q	cml0zoxgv00czygioguxjupzm	/uploads/products/1770304665330-HEINEKEN_1L.webp	\N	0
cml9lpbj0000npwgoz11u30r3	cml0zox7c009iygiotcrj6j2m	/uploads/products/1770304684596-CEPITA_MANZANA_1.5LTS.webp	\N	0
cml9lpsoh000qpwgobiw9l54p	cml0zowo9003yygio9oge7o70	/uploads/products/1770304706896-AQUARIUS_MANZANA_2.25lts.webp	\N	0
cml9lrbz0000wpwgom6s07hav	cml0zowmr003jygioz946gzop	/uploads/products/1770304779969-AQUARIUS_MANZANA_1,5.webp	\N	0
cml9lrls6000zpwgor2h6yh2p	cml0zowle003eygio2lvjmvh5	/uploads/products/1770304792812-CEPITA_NARANJA_1.5.webp	\N	0
cml9lrzki0012pwgo8j6n1p6b	cml0zow8g0011ygio9sfyb99t	/uploads/products/1770304809624-CITRIC_1L.webp	\N	0
cml9lsha10015pwgoa6ffo4tt	cml0zoxf000caygiowbgdvncd	/uploads/products/1770304831534-PATAGONIA_IPA_(3).webp	\N	0
cml9lteoa001bpwgosbvz5ff5	cml0zoxc000bbygio75uu8yhv	/uploads/products/1770304876406-PATAGONIA_AMBER_LARGER.webp	\N	0
cml9luaf9001hpwgo7y6sdaq4	cml0zoxff00cfygioxzxvf05c	/uploads/products/1770304917592-PATAGONIA_AMBER_DEL_SUR.webp	\N	0
cml9lutsd001kpwgoi28hgkru	cml0zoxen00c5ygio59ae7h5l	/uploads/products/1770304942603-PATAGONIA_24.7.webp	\N	0
cml9lv7em001npwgog6rp8exw	cml0zoxbj00b6ygiopg5m1taj	/uploads/products/1770304960531-QUILMES_SIN_ALCOHOL.webp	\N	0
cml9lvyg3001qpwgosolhk5d8	cml0zox4z008jygio02is6mvc	/uploads/products/1770304995056-OCB_(2).webp	\N	0
cml9lwiap001tpwgo2zvpv0iv	cml0zox4n008eygioznyef44n	/uploads/products/1770305021031-OCB.webp	\N	0
cml9lwtft001wpwgo0fcebi7g	cml0zowak001bygio5h4kurkv	/uploads/products/1770305035529-HEINEKEN_X6.webp	\N	0
cml9lx5md001zpwgopauii2pi	cml0zowf30020ygiokvon5so2	/uploads/products/1770305051620-BEAGLE_RED_ALE.webp	\N	0
cml9lxg1g0022pwgoaoyr4ruc	cml0zowei001vygiodkveoc6a	/uploads/products/1770305065414-BEAGLE_CREAM_STOUT.webp	\N	0
cml9lxsug0025pwgolnlv4x92	cml0zox04006gygio9ubnror0	/uploads/products/1770305081726-SCHNEIDER_710.webp	\N	0
cml9m07k40028pwgoenuw32rj	cml0zox0e006lygiokpyhzec3	/uploads/products/1770305193738-SCHNEIDER_X6.webp	\N	0
cml9mbzy6002mpwgo0cagjn6f	cml9mbzy6002lpwgoivafmptj	/uploads/products/1770304665330-HEINEKEN_1L.webp	\N	0
cmla0qhux000g3ivoyehmt2vp	cmla0qhux000f3ivobd1ursts	/uploads/products/1770304942603-PATAGONIA_24.7.webp	\N	0
cmla0qhvm000l3ivozv6aoui7	cmla0qhvm000k3ivo0mka6fph	/uploads/products/1770304917592-PATAGONIA_AMBER_DEL_SUR.webp	\N	0
cmla1pswa00011n5tgx1s7xym	cml0zoxlw00exygioqz1ixhfv	/uploads/products/1770009341029-Falafel-S2.jpg	Falafel	0
cmlb2izxv00013f2j5ydexy4b	cml4pahxe0001g0s2gf3mvkrd	/uploads/products/1770393410511-shopping.webp	Cartas UNO	0
cmlb3uq5r0001r2ksz0swko1n	cml5aso2100023wnr30xn3opl	/uploads/products/1770395638228-bolsas-para-hielo-8dc50f6d8b6d31da4917151919184635-640-0.webp	Hielo	0
cmlb43yf50001iudhbyab5qou	cml4pai550007g0s2rc70nru6	/uploads/products/1770396068991-images_(2).webp	Cartas Espaolas x50	0
cmlbkx711000411wb8ou3vx51	cmla0qhvu000p3ivoez0th7no	/uploads/products/1770304831534-PATAGONIA_IPA_(3).webp	Patagonia Vera IPA	0
cmlbkx711000511wbdz7qmhlq	cmla0qhvu000p3ivoez0th7no	/uploads/products/1770424251256-IMG_2575.webp	Patagonia Vera IPA	1
cmlbnxvqm000c10ncme5mrkdu	cml4pai4d0004g0s232dhvgsh	/uploads/products/1770396731350-81yiXHwgQWL._AC_SL1500_.webp	Jenga de Madera	0
cmlbnxvqm000d10ncko5izowf	cml4pai4d0004g0s232dhvgsh	/uploads/products/1770429373951-images_(3).webp	Jenga de Madera	1
cmlbnxvqm000e10ncxk7psmu1	cml4pai4d0004g0s232dhvgsh	/uploads/products/1770429377602-reglas-del-jenga.webp	Jenga de Madera	2
\.


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductVariant" (id, "productId", name, price, stock, "isActive") FROM stdin;
\.


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Referral" (id, "referrerId", "refereeId", "codeUsed", "referrerPoints", "refereePoints", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: SavedCart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SavedCart" (id, "userId", items, "merchantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "isMaintenanceMode", "maintenanceMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt", "promoPopupButtonText", "promoPopupDismissable", "promoPopupEnabled", "promoPopupImage", "promoPopupLink", "promoPopupMessage", "promoPopupTitle", "showComerciosCard", "showRepartidoresCard", "tiendaMaintenance", "maxCategoriesHome") FROM stdin;
settings	f	Estamos cerrados. ??Volvemos pronto!	f	??Volvemos pronto! Estamos trabajando para mejorar tu experiencia.	1200	0.06	500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-02-03 21:43:04.763	Participa ahora!	t	f			Sorteo Febrero 2026	Super Promo!	t	t	f	10
\.


--
-- Data for Name: SupportChat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportChat" (id, "userId", "merchantId", subject, status, "lastMessageAt", "createdAt", "updatedAt") FROM stdin;
cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	cmkvbvo3z0008r0gkc7qfxplz	Consulta general	open	2026-01-30 14:45:33.241	2026-01-28 13:22:27.178	2026-01-30 14:45:33.243
cml4bel44000b7c7ees7j69cp	cmkvbvo57000rr0gkp7ff55ji	cmkvbvo5b000ur0gk0eib5xpt	Morochito	open	2026-02-01 22:31:52.056	2026-02-01 22:31:00.194	2026-02-01 22:31:52.058
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportMessage" (id, "chatId", "senderId", content, "isFromAdmin", "isRead", "createdAt") FROM stdin;
cml0zvrzs0001ej7x1xmw25fh	cmky21qlm0001120mrqtgicuc	cmkvbvo1d0000r0gkyait4f0l	Hola!	t	t	2026-01-30 14:45:08.344
cml0zwb760005ej7xijggxlzx	cmky21qlm0001120mrqtgicuc	cmkvbvo1d0000r0gkyait4f0l	En qu?? podemos ayudarte?	t	t	2026-01-30 14:45:33.234
cml4bfp4f000f7c7es5ik8ofq	cml4bel44000b7c7ees7j69cp	cmkvbvo1d0000r0gkyait4f0l	Vos tambien!	t	t	2026-02-01 22:31:52.047
cmky21qlm0003120mro03s073	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Pregunta 1	f	t	2026-01-28 13:22:27.178
cmky22d2h0005120muqi30wzc	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Hola!	f	t	2026-01-28 13:22:56.297
cmky22kac0007120m65nvqe8w	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Hola!	f	t	2026-01-28 13:23:05.652
cml0zw1fh0003ej7xjt0e252l	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Como estas?	f	t	2026-01-30 14:45:20.573
cml4bel44000d7c7ez1scpq8s	cml4bel44000b7c7ees7j69cp	cmkvbvo57000rr0gkp7ff55ji	Eres muy lindo	f	t	2026-02-01 22:31:00.194
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "deletedAt") FROM stdin;
cmkvbvo6g001dr0gkkc3uxs3s	comercio3@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	COMERCIO 3	\N	\N	\N	MERCHANT	\N	\N	0	0	f	cmkvbvo6g001er0gksdi7wmsv	\N	2026-01-26 15:34:21.736	2026-01-26 15:34:21.736	\N	\N	\N
cmkvbvo7s0023r0gk3wyvfr2v	rider2@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	RIDER 2	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmkvbvo7s0024r0gkvoz8se8y	\N	2026-01-26 15:34:21.784	2026-01-26 15:34:21.784	\N	\N	\N
cmkvbvo800027r0gksb401d3p	rider3@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	RIDER 3	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmkvbvo800028r0gk3g91rt9h	\N	2026-01-26 15:34:21.792	2026-01-26 15:34:21.792	\N	\N	\N
cmkvbvo8f002fr0gks60vb2et	cliente3@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	CLIENTE 3	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmkvbvo8f002gr0gkxvsgolli	\N	2026-01-26 15:34:21.808	2026-01-26 15:34:21.808	\N	\N	\N
cmkvbvo8c002dr0gk22kda2cw	cliente2@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	CLIENTE 2	\N	\N	\N	CLIENT	\N	\N	5000	0	f	cmkvbvo8c002er0gk53tvzvvh	\N	2026-01-26 15:34:21.804	2026-02-01 22:21:09.161	\N	\N	\N
cmkvbvo3s0005r0gkpul7pexf	comercio1@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	COMERCIO 1	\N	\N	\N	MERCHANT	\N	\N	0	0	f	cmkvbvo3s0006r0gkc8178zq4	\N	2026-01-26 15:34:21.64	2026-02-05 21:58:01.784	\N	\N	\N
cmkvbvo1d0000r0gkyait4f0l	admin@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	Admin MOOVY	\N	\N	\N	ADMIN	\N	\N	0	0	f	cmkvbvo1e0001r0gk770gtuc2	\N	2026-01-26 15:34:21.552	2026-02-05 21:58:34.612	\N	\N	\N
cmkvbvo57000rr0gkp7ff55ji	comercio2@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	 				MERCHANT	\N	\N	0	0	f	cmkvbvo57000sr0gkah2nixeg	\N	2026-01-26 15:34:21.692	2026-02-07 01:55:59.576	\N	\N	\N
cmlbofjvu0002mqdpmdns2wmk	ing.iyad@gmail.com	$2b$10$Dh5H4ps/PMUnkYwWTT.Ci.2id/EIt7MG6SZXjdQ9AV3kJjg/VAFw2	Iyad Marmoud	Iyad	Marmoud	+54 2901611605	USER	\N	\N	0	250	f	MOV-V45Z	\N	2026-02-07 02:10:03.497	2026-02-07 02:12:39.158	\N	\N	\N
cmkvbvo87002br0gkyyz8i0cs	cliente1@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	CLIENTE 1	\N	\N	\N	CLIENT	\N	\N	52900	0	t	cmkvbvo87002cr0gkde84ikuu	\N	2026-01-26 15:34:21.799	2026-02-07 15:42:37.208	\N	\N	\N
cmkvbvo7j001zr0gkayjq633k	rider1@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	RIDER 1	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmkvbvo7j0020r0gkqwydz0pt	\N	2026-01-26 15:34:21.776	2026-02-07 17:29:59.539	\N	\N	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
699be6ce-51dd-4c00-a648-45dfe658eb87	36b8448f8c1663e967fb3a82dcd713f01f594f64194113653517af61309b641a	2026-01-26 15:34:16.651737+00	20260121033318_init	\N	\N	2026-01-26 15:34:16.414777+00	1
28bfdd2d-09ee-4803-9a7a-51877f74fcd2	76d3a145c52f9b3c7722940213b6e39a2f1cc0e1bbc0da9090f7dcf24c06fefc	2026-01-26 15:34:18.020115+00	20260126153417_add_driver_tracking	\N	\N	2026-01-26 15:34:17.949878+00	1
19264024-2c11-4535-9469-11d6117cecc1	9ae001d1fb584efeaf654a580150910755fe14907f5292e652a69efea12fc6b0	2026-01-26 15:56:30.634388+00	20260126155630_add_geolocation_logistics	\N	\N	2026-01-26 15:56:30.615414+00	1
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (id);


--
-- Name: MerchantAcquiredProduct MerchantAcquiredProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantAcquiredProduct"
    ADD CONSTRAINT "MerchantAcquiredProduct_pkey" PRIMARY KEY (id);


--
-- Name: MerchantCategory MerchantCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantCategory"
    ADD CONSTRAINT "MerchantCategory_pkey" PRIMARY KEY (id);


--
-- Name: Merchant Merchant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_pkey" PRIMARY KEY (id);


--
-- Name: OrderBackup OrderBackup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderBackup"
    ADD CONSTRAINT "OrderBackup_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PointsConfig PointsConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PointsConfig"
    ADD CONSTRAINT "PointsConfig_pkey" PRIMARY KEY (id);


--
-- Name: PointsTransaction PointsTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PointsTransaction"
    ADD CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductVariant ProductVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Referral Referral_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_pkey" PRIMARY KEY (id);


--
-- Name: SavedCart SavedCart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavedCart"
    ADD CONSTRAINT "SavedCart_pkey" PRIMARY KEY (id);


--
-- Name: StoreSettings StoreSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StoreSettings"
    ADD CONSTRAINT "StoreSettings_pkey" PRIMARY KEY (id);


--
-- Name: SupportChat SupportChat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportChat"
    ADD CONSTRAINT "SupportChat_pkey" PRIMARY KEY (id);


--
-- Name: SupportMessage SupportMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CartItem_userId_productId_variantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CartItem_userId_productId_variantId_key" ON public."CartItem" USING btree ("userId", "productId", "variantId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Driver_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Driver_userId_key" ON public."Driver" USING btree ("userId");


--
-- Name: MerchantAcquiredProduct_merchantId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MerchantAcquiredProduct_merchantId_productId_key" ON public."MerchantAcquiredProduct" USING btree ("merchantId", "productId");


--
-- Name: MerchantCategory_merchantId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MerchantCategory_merchantId_categoryId_key" ON public."MerchantCategory" USING btree ("merchantId", "categoryId");


--
-- Name: Merchant_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Merchant_slug_key" ON public."Merchant" USING btree (slug);


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: ProductCategory_productId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductCategory_productId_categoryId_key" ON public."ProductCategory" USING btree ("productId", "categoryId");


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Referral_refereeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Referral_refereeId_key" ON public."Referral" USING btree ("refereeId");


--
-- Name: SavedCart_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SavedCart_userId_key" ON public."SavedCart" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_referralCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_referralCode_key" ON public."User" USING btree ("referralCode");


--
-- Name: Address Address_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Driver Driver_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MerchantAcquiredProduct MerchantAcquiredProduct_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantAcquiredProduct"
    ADD CONSTRAINT "MerchantAcquiredProduct_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MerchantAcquiredProduct MerchantAcquiredProduct_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantAcquiredProduct"
    ADD CONSTRAINT "MerchantAcquiredProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MerchantCategory MerchantCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantCategory"
    ADD CONSTRAINT "MerchantCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MerchantCategory MerchantCategory_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantCategory"
    ADD CONSTRAINT "MerchantCategory_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Merchant Merchant_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public."Address"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PointsTransaction PointsTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PointsTransaction"
    ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductVariant ProductVariant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Referral Referral_refereeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Referral Referral_referrerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportChat SupportChat_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportChat"
    ADD CONSTRAINT "SupportChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportMessage SupportMessage_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."SupportChat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportMessage SupportMessage_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_referredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--


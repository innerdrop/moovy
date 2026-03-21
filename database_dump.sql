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


--
-- Name: AssignmentOutcomeEnum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssignmentOutcomeEnum" AS ENUM (
    'ACCEPTED',
    'REJECTED',
    'TIMEOUT',
    'SKIPPED'
);


ALTER TYPE public."AssignmentOutcomeEnum" OWNER TO postgres;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'DRIVER_ASSIGNED',
    'DRIVER_ARRIVED',
    'PICKED_UP',
    'DELIVERED'
);


ALTER TYPE public."DeliveryStatus" OWNER TO postgres;

--
-- Name: DeliveryType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliveryType" AS ENUM (
    'IMMEDIATE',
    'SCHEDULED'
);


ALTER TYPE public."DeliveryType" OWNER TO postgres;

--
-- Name: PendingAssignmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PendingAssignmentStatus" AS ENUM (
    'WAITING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."PendingAssignmentStatus" OWNER TO postgres;

--
-- Name: UserRoleType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRoleType" AS ENUM (
    'USER',
    'ADMIN',
    'COMERCIO',
    'DRIVER',
    'SELLER'
);


ALTER TYPE public."UserRoleType" OWNER TO postgres;

--
-- Name: VehicleTypeEnum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VehicleTypeEnum" AS ENUM (
    'BIKE',
    'MOTO',
    'CAR',
    'TRUCK'
);


ALTER TYPE public."VehicleTypeEnum" OWNER TO postgres;

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
-- Name: AssignmentLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AssignmentLog" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "driverId" text NOT NULL,
    "attemptNumber" integer DEFAULT 1 NOT NULL,
    "notifiedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "respondedAt" timestamp(3) without time zone,
    outcome public."AssignmentOutcomeEnum" DEFAULT 'ACCEPTED'::public."AssignmentOutcomeEnum" NOT NULL,
    "distanceKm" double precision
);


ALTER TABLE public."AssignmentLog" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "userId" text NOT NULL,
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

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
    "parentId" text,
    icon text,
    scope text DEFAULT 'BOTH'::text NOT NULL,
    "isStarter" boolean DEFAULT false NOT NULL,
    "starterPrice" double precision
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: DeliveryRate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryRate" (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    "basePriceArs" double precision NOT NULL,
    "pricePerKmArs" double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryRate" OWNER TO postgres;

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
    ubicacion public.geography(Point,4326),
    "acceptedTermsAt" timestamp(3) without time zone,
    cuit text,
    "dniDorsoUrl" text,
    "dniFrenteUrl" text,
    "licenciaUrl" text,
    "seguroUrl" text,
    "vtvUrl" text
);


ALTER TABLE public."Driver" OWNER TO postgres;

--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Favorite" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "merchantId" text,
    "productId" text,
    "listingId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Favorite" OWNER TO postgres;

--
-- Name: HeroSlide; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HeroSlide" (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    "buttonText" text NOT NULL,
    "buttonLink" text NOT NULL,
    gradient text DEFAULT 'from-[#e60012] via-[#ff2a3a] to-[#ff6b6b]'::text NOT NULL,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HeroSlide" OWNER TO postgres;

--
-- Name: Listing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Listing" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    title text NOT NULL,
    description text,
    price double precision NOT NULL,
    stock integer DEFAULT 1 NOT NULL,
    condition text DEFAULT 'NUEVO'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "categoryId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "heightCm" double precision,
    "lengthCm" double precision,
    "weightKg" double precision,
    "widthCm" double precision
);


ALTER TABLE public."Listing" OWNER TO postgres;

--
-- Name: ListingImage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ListingImage" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    url text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ListingImage" OWNER TO postgres;

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
    ubicacion public.geography(Point,4326),
    "mpAccessToken" text,
    "mpEmail" text,
    "mpLinkedAt" timestamp(3) without time zone,
    "mpRefreshToken" text,
    "mpUserId" text,
    rating double precision,
    "acceptedPrivacyAt" timestamp(3) without time zone,
    "acceptedTermsAt" timestamp(3) without time zone,
    "constanciaAfipUrl" text,
    "habilitacionMunicipalUrl" text,
    "registroSanitarioUrl" text,
    "scheduleEnabled" boolean DEFAULT false NOT NULL,
    "scheduleJson" text
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
-- Name: MoovyConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MoovyConfig" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MoovyConfig" OWNER TO postgres;

--
-- Name: MpWebhookLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MpWebhookLog" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "eventType" text NOT NULL,
    "resourceId" text NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MpWebhookLog" OWNER TO postgres;

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
    "lastAssignmentAt" timestamp(3) without time zone,
    "pendingDriverId" text,
    "isPickup" boolean DEFAULT false NOT NULL,
    "attemptedDriverIds" jsonb,
    "isMultiVendor" boolean DEFAULT false NOT NULL,
    "mpMerchantOrderId" text,
    "mpPaymentId" text,
    "mpPreferenceId" text,
    "mpStatus" text,
    "paidAt" timestamp(3) without time zone,
    "merchantRating" integer,
    "merchantRatingComment" text,
    "sellerRating" integer,
    "sellerRatingComment" text,
    "deliveryType" public."DeliveryType" DEFAULT 'IMMEDIATE'::public."DeliveryType" NOT NULL,
    "scheduledConfirmedAt" timestamp(3) without time zone,
    "scheduledSlotEnd" timestamp(3) without time zone,
    "scheduledSlotStart" timestamp(3) without time zone,
    "deliveryStatus" public."DeliveryStatus",
    "deletedAt" timestamp(3) without time zone
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
    "productId" text,
    name text NOT NULL,
    price double precision NOT NULL,
    quantity integer NOT NULL,
    "variantName" text,
    subtotal double precision NOT NULL,
    "subOrderId" text,
    "listingId" text,
    "packageCategoryName" text
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- Name: PackageCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PackageCategory" (
    id text NOT NULL,
    name text NOT NULL,
    "maxWeightGrams" integer NOT NULL,
    "maxLengthCm" integer NOT NULL,
    "maxWidthCm" integer NOT NULL,
    "maxHeightCm" integer NOT NULL,
    "volumeScore" integer NOT NULL,
    "allowedVehicles" text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PackageCategory" OWNER TO postgres;

--
-- Name: PackagePricingTier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PackagePricingTier" (
    id text NOT NULL,
    name text NOT NULL,
    "minItems" integer NOT NULL,
    "maxItems" integer,
    "pricePerItem" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PackagePricingTier" OWNER TO postgres;

--
-- Name: PackagePurchase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PackagePurchase" (
    id text NOT NULL,
    "merchantId" text NOT NULL,
    "purchaseType" text NOT NULL,
    "categoryId" text,
    "productIds" text,
    "itemCount" integer DEFAULT 0 NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'ARS'::text NOT NULL,
    "paymentStatus" text DEFAULT 'pending'::text NOT NULL,
    "paymentMethod" text,
    "mpPreferenceId" text,
    "mpPaymentId" text,
    "mpExternalRef" text,
    "importStatus" text DEFAULT 'pending'::text NOT NULL,
    "importedCount" integer DEFAULT 0 NOT NULL,
    "importedAt" timestamp(3) without time zone,
    "promoCode" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PackagePurchase" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "mpPaymentId" text NOT NULL,
    "mpStatus" text NOT NULL,
    "mpStatusDetail" text,
    amount double precision NOT NULL,
    currency text DEFAULT 'ARS'::text NOT NULL,
    "payerEmail" text,
    "paymentMethod" text,
    "rawPayload" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: PendingAssignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PendingAssignment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "currentDriverId" text,
    "attemptNumber" integer DEFAULT 1 NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    status public."PendingAssignmentStatus" DEFAULT 'WAITING'::public."PendingAssignmentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PendingAssignment" OWNER TO postgres;

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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "packageCategoryId" text
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
-- Name: PushSubscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PushSubscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PushSubscription" OWNER TO postgres;

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
-- Name: SellerAvailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SellerAvailability" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "isPaused" boolean DEFAULT false NOT NULL,
    "pauseEndsAt" timestamp(3) without time zone,
    "preparationMinutes" integer DEFAULT 15 NOT NULL,
    "scheduleEnabled" boolean DEFAULT false NOT NULL,
    "scheduleJson" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SellerAvailability" OWNER TO postgres;

--
-- Name: SellerProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SellerProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "displayName" text,
    bio text,
    avatar text,
    "bankAlias" text,
    "bankCbu" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "totalSales" integer DEFAULT 0 NOT NULL,
    rating double precision,
    "commissionRate" double precision DEFAULT 12 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "mpAccessToken" text,
    "mpEmail" text,
    "mpLinkedAt" timestamp(3) without time zone,
    "mpRefreshToken" text,
    "mpUserId" text,
    "acceptedTermsAt" timestamp(3) without time zone,
    cuit text
);


ALTER TABLE public."SellerProfile" OWNER TO postgres;

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
    "maxCategoriesHome" integer DEFAULT 6 NOT NULL,
    "heroSliderInterval" integer DEFAULT 5000 NOT NULL,
    "promoBannerButtonLink" text DEFAULT '/productos?categoria=pizzas'::text NOT NULL,
    "promoBannerButtonText" text DEFAULT 'Ver locales'::text NOT NULL,
    "promoBannerEnabled" boolean DEFAULT true NOT NULL,
    "promoBannerImage" text,
    "promoBannerSubtitle" text DEFAULT '2x1 en locales seleccionados de 20hs a 23hs.'::text NOT NULL,
    "promoBannerTitle" text DEFAULT 'Noches de
Pizza & Pelis'::text NOT NULL,
    "riderCommissionPercent" double precision DEFAULT 80 NOT NULL,
    "heroSliderEnabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."StoreSettings" OWNER TO postgres;

--
-- Name: SubOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SubOrder" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "merchantId" text,
    "sellerId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    subtotal double precision NOT NULL,
    "deliveryFee" double precision DEFAULT 0 NOT NULL,
    discount double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    "driverId" text,
    "moovyCommission" double precision DEFAULT 0,
    "sellerPayout" double precision DEFAULT 0,
    "paymentStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "deliveredAt" timestamp(3) without time zone,
    "deliveryPhoto" text,
    "driverRating" integer,
    "assignmentAttempts" integer DEFAULT 0 NOT NULL,
    "assignmentExpiresAt" timestamp(3) without time zone,
    "attemptedDriverIds" jsonb,
    "pendingDriverId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "mpTransferId" text,
    "paidOutAt" timestamp(3) without time zone,
    "payoutStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "deliveryStatus" public."DeliveryStatus"
);


ALTER TABLE public."SubOrder" OWNER TO postgres;

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
    "deletedAt" timestamp(3) without time zone,
    "privacyConsentAt" timestamp(3) without time zone,
    "termsConsentAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserRole" (
    id text NOT NULL,
    "userId" text NOT NULL,
    role public."UserRoleType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "activatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO postgres;

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
cmlcf8agf0004n1z3kfbpgcs6	cmlbofjvu0002mqdpmdns2wmk	Prueba3	Kuanip	490	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.81706399999999	-68.32997759999999	t	2026-02-07 14:40:14.319	2026-02-07 14:40:14.319	\N
cmlcf8anz0006n1z3ggxt13zo	cmlbofjvu0002mqdpmdns2wmk	Entrega	Kuanip	490	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-02-07 14:40:14.591	2026-02-07 14:40:14.591	\N
cmlehunug0003hsibquex9up7	cmlbofjvu0002mqdpmdns2wmk	Entrega	Alfonsina Storni	2067	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-02-09 01:29:09.688	2026-02-09 01:29:09.688	\N
cmlej4c490003wel8hzk2lxwe	cmlbofjvu0002mqdpmdns2wmk	Mau	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-02-09 02:04:40.666	2026-02-09 02:04:40.666	\N
cmlej4cd90005wel8530ngbox	cmlbofjvu0002mqdpmdns2wmk	Entrega	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-02-09 02:04:40.989	2026-02-09 02:04:40.989	\N
cmkx4m5kg00055jchyl2qklvb	cmkvbvo87002br0gkyyz8i0cs	Entrega	Kuanip	190	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-01-27 21:46:32.752	2026-02-10 18:10:05.265	2026-02-10 18:10:05.263
cmkx4m5bu00035jchkrxfk4cy	cmkvbvo87002br0gkyyz8i0cs	CasaEjemplo	Kuanip	190	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.816358	-68.3253491	f	2026-01-27 21:46:32.441	2026-02-10 18:19:23.14	2026-02-10 18:19:23.139
cmlgxg5y70003jitzc6n7c58k	cmkvbvo8c002dr0gk22kda2cw	Mi Casa	Kuanip	190	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.816358	-68.3253491	t	2026-02-10 18:21:19.52	2026-02-10 18:21:19.52	\N
cmlgy31wz000212bbnnivbgw2	cmkvbvo87002br0gkyyz8i0cs	Mi Casa	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	t	2026-02-10 18:39:07.38	2026-02-10 18:39:07.38	\N
cmlh7mcz2000357g2et4e1hgx	cmlbofjvu0002mqdpmdns2wmk	Trabajo	Avenida Leandro Alem	629	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.7993321	-68.31213869999999	f	2026-02-10 23:06:04.718	2026-02-10 23:06:04.718	\N
cmlh7md6n000557g2s4glzzdi	cmlbofjvu0002mqdpmdns2wmk	Entrega	Avenida Leandro Alem	629	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-02-10 23:06:04.991	2026-02-10 23:06:04.991	\N
cmlllpkaz0002xm58rfj12zcn	cmlbofjvu0002mqdpmdns2wmk	Entrega	Avenida Leandro Alem	629	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.7993321	-68.31213869999999	f	2026-02-14 00:51:33.515	2026-02-14 00:51:33.515	\N
cmmh3ilkw0004fri2auy4f4np	cmmccgicu0002lw51r2qy0lcr	Entrega	Retiro en local	S/N	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-03-08 01:50:53.12	2026-03-10 13:37:20.383	2026-03-10 13:37:20.381
cmmknnivk0006nmo1h3eznt7q	cmmccgicu0002lw51r2qy0lcr	Mi Casa	Salta	2283	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8083051	-68.3361407	t	2026-03-10 13:37:53.744	2026-03-10 13:37:53.744	\N
\.


--
-- Data for Name: AssignmentLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AssignmentLog" (id, "orderId", "driverId", "attemptNumber", "notifiedAt", "respondedAt", outcome, "distanceKm") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, action, "entityType", "entityId", "userId", details, "createdAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "userId", "productId", quantity, "variantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, slug, description, image, "isActive", "order", "createdAt", "updatedAt", "allowIndividualPurchase", price, "parentId", icon, scope, "isStarter", "starterPrice") FROM stdin;
cml0zow7d000pygioyc93s0na	Aperitivos	aperitivos	\N	\N	f	12	2026-01-30 14:39:47.209	2026-03-16 02:42:49.724	t	0	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cml0zox2g007iygioza8q1bmh	Escenciales	escenciales			f	9	2026-01-30 14:39:48.329	2026-03-16 02:42:49.723	t	5000	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cml0zow6y000kygio98l495ny	Hielo & Otros	hielo-otros	\N	\N	f	11	2026-01-30 14:39:47.195	2026-03-16 02:42:49.724	t	0	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cml0zow3e0000ygiogdypolr3	Combos	combos	\N	\N	f	10	2026-01-30 14:39:47.065	2026-03-16 02:42:49.723	t	0	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cml0zowft0028ygioo962wjej	Golosinas	golosinas	\N	\N	f	8	2026-01-30 14:39:47.514	2026-03-16 02:42:49.723	t	0	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cml0zow88000zygioaxhmxkcx	Aguas & Jugos	aguas-jugos	\N	\N	f	13	2026-01-30 14:39:47.24	2026-03-16 02:42:49.724	t	0	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cmkvbvo3b0003r0gk2uttx4lq	Sushi	sushi	\N	\N	f	14	2026-01-26 15:34:21.563	2026-03-16 02:42:49.74	t	0	cml9lh7l90000qxvofmv8r1i7	\N	BOTH	f	\N
cml0zow6h000fygio11bf03c6	Gaseosas	gaseosas	\N	\N	t	2	2026-01-30 14:39:47.178	2026-03-18 02:29:34.09	t	0	cml9lh7l90000qxvofmv8r1i7	gaseosas	BOTH	f	\N
cmmxyds9e000c67no4b9d17dj	Veh├¡culos	vehiculos	Motos, autos, repuestos	\N	t	104	2026-03-19 20:59:15.41	2026-03-19 20:59:15.41	t	0	\N	car	MARKETPLACE	f	\N
cml0zow9t0019ygioovj10h90	Cervezas	cervezas	\N	\N	t	3	2026-01-30 14:39:47.297	2026-03-18 02:29:40.372	t	0	cml9lh7l90000qxvofmv8r1i7	cervezas	BOTH	f	\N
cmmxyds9p000d67noivcdz0wx	Gaming	gaming	Consolas, juegos, perif├⌐ricos	\N	t	105	2026-03-19 20:59:15.422	2026-03-19 20:59:15.422	t	0	\N	gamepad	MARKETPLACE	f	\N
cml0zoxcb00beygiop03ia9ox	Vinos	vinos	\N	\N	t	5	2026-01-30 14:39:48.683	2026-03-18 02:29:50.533	t	0	cml9lh7l90000qxvofmv8r1i7	vinos	BOTH	f	\N
cmkvbvo3k0004r0gkby3xi0g4	Pizzas	pizzas	\N	\N	t	6	2026-01-26 15:34:21.563	2026-03-18 02:30:03.678	t	0	cml9lh7l90000qxvofmv8r1i7	pizzas	BOTH	f	\N
cmmxyds9z000e67nosw90mwtb	Beb├⌐s y Ni├▒os	bebes-y-ninos	Ropa infantil, juguetes, cochecitos	\N	t	106	2026-03-19 20:59:15.431	2026-03-19 20:59:15.431	t	0	\N	baby	MARKETPLACE	f	\N
cmmxydsa7000f67noxzj1phle	Herramientas	herramientas	Herramientas, materiales, jard├¡n	\N	t	107	2026-03-19 20:59:15.439	2026-03-19 20:59:15.439	t	0	\N	wrench	MARKETPLACE	f	\N
cmmxydsae000g67nogurnnr17	Libros y M├║sica	libros-y-musica	Libros, instrumentos, vinilos	\N	t	108	2026-03-19 20:59:15.446	2026-03-19 20:59:15.446	t	0	\N	book	MARKETPLACE	f	\N
cmmxydsak000h67nomltsntt8	Belleza	belleza	Perfumes, maquillaje, cuidado personal	\N	t	109	2026-03-19 20:59:15.452	2026-03-19 20:59:15.452	t	0	\N	sparkles	MARKETPLACE	f	\N
cmmxyds72000167notemlkzgg	Cafeter├¡as	cafeterias	Caf├⌐s, panader├¡as, medialunas	\N	t	2	2026-03-19 20:59:15.326	2026-03-19 21:03:40.224	t	0	\N	coffee	STORE	f	\N
cmkvbvo1n0002r0gklrqbox7o	Hamburguesas	hamburguesas	\N	\N	t	0	2026-01-26 15:34:21.563	2026-03-20 01:24:46.543	t	0	cml9lh7l90000qxvofmv8r1i7	burger	BOTH	f	\N
cml9lh7l90000qxvofmv8r1i7	Kioscos	kioscos	Paquete completo para kioscos y almacenes. Incluye todas las subcategor????as de productos.		t	1	2026-02-05 15:11:49.678	2026-03-16 02:42:49.704	t	50000	\N	kiosko	BOTH	f	\N
cml0zow7t000uygio3e9l5uwk	Snacks	snacks	\N	\N	t	4	2026-01-30 14:39:47.225	2026-03-16 02:42:49.712	t	0	cml9lh7l90000qxvofmv8r1i7	snacks	BOTH	f	\N
cml0zoxi500dhygioxr9f0loc	Juegos	juegos	\N		t	7	2026-01-30 14:39:48.893	2026-03-16 02:42:49.713	t	0	cml9lh7l90000qxvofmv8r1i7	juegos	BOTH	f	\N
cmmxyds6h000067noqs54ndly	Comidas	comidas	Restaurantes, rotiser├¡as, cocinas	\N	t	1	2026-03-19 20:59:15.305	2026-03-19 20:59:15.305	t	0	\N	restaurant	STORE	f	\N
cmmxyds78000267norgvru2sp	Supermercado	supermercado	Almacenes, despensas, mayoristas	\N	t	3	2026-03-19 20:59:15.333	2026-03-19 20:59:15.333	t	0	\N	shopping-cart	STORE	f	\N
cmmxyds7i000367nov1i9w8om	Bebidas	bebidas	Vinotecas, distribuidoras, cervecer├¡as	\N	t	4	2026-03-19 20:59:15.342	2026-03-19 20:59:15.342	t	0	\N	wine	STORE	f	\N
cmmxyds7p000467nonoovar4p	Farmacia	farmacia	Farmacias, diet├⌐ticas, salud	\N	t	5	2026-03-19 20:59:15.349	2026-03-19 20:59:15.349	t	0	\N	pill	STORE	f	\N
cmmxyds7y000567no94mlojnz	Kiosco	kiosco	Kioscos, golosinas, snacks	\N	t	6	2026-03-19 20:59:15.359	2026-03-19 20:59:15.359	t	0	\N	candy	STORE	f	\N
cmmxyds85000667noqxpxfzem	Mascotas	mascotas	Veterinarias, pet shops	\N	t	7	2026-03-19 20:59:15.365	2026-03-19 20:59:15.365	t	0	\N	pet	STORE	f	\N
cmmxyds8e000767noz2esrz1t	Helados	helados	Helader├¡as, postres	\N	t	8	2026-03-19 20:59:15.374	2026-03-19 20:59:15.374	t	0	\N	ice-cream	STORE	f	\N
cmmxyds8l000867norchk83j6	Electr├│nica	electronica	Celulares, notebooks, tablets, c├ímaras	\N	t	100	2026-03-19 20:59:15.381	2026-03-19 20:59:15.381	t	0	\N	smartphone	MARKETPLACE	f	\N
cmmxyds8t000967no71yzzham	Ropa y Calzado	ropa-y-calzado	Ropa, zapatillas, accesorios	\N	t	101	2026-03-19 20:59:15.39	2026-03-19 20:59:15.39	t	0	\N	shirt	MARKETPLACE	f	\N
cmmxyds91000a67no90xgr43a	Hogar	hogar	Muebles, decoraci├│n, electrodom├⌐sticos	\N	t	102	2026-03-19 20:59:15.398	2026-03-19 20:59:15.398	t	0	\N	home	MARKETPLACE	f	\N
cmmxyds98000b67no64kexi6x	Deportes	deportes	Equipamiento, camping, ski, bicicletas	\N	t	103	2026-03-19 20:59:15.404	2026-03-19 20:59:15.404	t	0	\N	dumbbell	MARKETPLACE	f	\N
\.


--
-- Data for Name: DeliveryRate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryRate" (id, "categoryId", "basePriceArs", "pricePerKmArs", "isActive", "createdAt", "updatedAt") FROM stdin;
cmmoa04o10006kki3d0j4uhn2	cmmoa04mg0000kki3x0ye9ow8	800	200	t	2026-03-13 02:26:51.937	2026-03-13 02:26:51.937
cmmoa04og0008kki3jn4ykqte	cmmoa04n20001kki3nj9xiboq	1200	300	t	2026-03-13 02:26:51.952	2026-03-13 02:26:51.952
cmmoa04ot000akki3eohaxf5q	cmmoa04n70002kki3zbhqpbh8	1800	400	t	2026-03-13 02:26:51.965	2026-03-13 02:26:51.965
cmmoa04oz000ckki3rdd2ff47	cmmoa04nd0003kki3rrle4wkf	2500	500	t	2026-03-13 02:26:51.971	2026-03-13 02:26:51.971
cmmoa04pi000ekki3yakggwtl	cmmoa04nk0004kki3qu13bhp7	4000	700	t	2026-03-13 02:26:51.99	2026-03-13 02:26:51.99
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Driver" (id, "userId", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor", "licensePlate", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt", "availabilityStatus", "lastLocationAt", latitude, longitude, ubicacion, "acceptedTermsAt", cuit, "dniDorsoUrl", "dniFrenteUrl", "licenciaUrl", "seguroUrl", "vtvUrl") FROM stdin;
cmkvbvo83002ar0gkqelv54hh	cmkvbvo800027r0gksb401d3p	AUTO	\N	\N	\N	\N	XYZ 999	t	f	0	\N	2026-01-26 15:34:21.795	2026-01-26 15:34:21.795	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmkvbvo7n0022r0gkuu9g9uab	cmkvbvo7j001zr0gkayjq633k	MOTO	\N	\N	\N	\N	ABC 001	t	f	0	5	2026-01-26 15:34:21.779	2026-03-03 13:58:30.373	FUERA_DE_SERVICIO	2026-03-03 20:04:20.942	-54.83147198372479	-68.3503032829467	0101000020E610000000FC755E6B1651C0B1D188AC6D6A4BC0	\N	\N	\N	\N	\N	\N	\N
cmll8sicl000313qm1g3d96bh	cmll8sibt000013qm7mi6wqby	BICICLETA	\N	\N	\N	\N	LT001	t	t	0	\N	2026-02-13 18:49:55.941	2026-02-13 18:49:55.941	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sid7000713qm50t6ujl0	cmll8sid3000413qmi2i1plv9	AUTO	\N	\N	\N	\N	LT002	t	t	0	\N	2026-02-13 18:49:55.964	2026-02-13 18:49:55.964	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sidg000b13qm57jublf6	cmll8sidb000813qmeg8nm49u	MOTO	\N	\N	\N	\N	LT003	t	f	0	\N	2026-02-13 18:49:55.973	2026-02-13 18:49:55.973	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sidp000f13qmc1ka7pmt	cmll8sidk000c13qm6iq8nspy	BICICLETA	\N	\N	\N	\N	LT004	t	f	0	\N	2026-02-13 18:49:55.981	2026-02-13 18:49:55.981	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sie1000j13qmr6kgf5yj	cmll8sidt000g13qmyv17wjq2	AUTO	\N	\N	\N	\N	LT005	t	t	0	\N	2026-02-13 18:49:55.993	2026-02-13 18:49:55.993	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sie9000n13qmg7emevre	cmll8sie6000k13qm4a2yizrg	MOTO	\N	\N	\N	\N	LT006	t	t	0	\N	2026-02-13 18:49:56.002	2026-02-13 18:49:56.002	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8siei000r13qmmksrp2mt	cmll8sied000o13qm4islyzz4	BICICLETA	\N	\N	\N	\N	LT007	t	t	0	\N	2026-02-13 18:49:56.01	2026-02-13 18:49:56.01	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8siep000v13qm1icmft5f	cmll8siel000s13qm3t04jyui	AUTO	\N	\N	\N	\N	LT008	t	t	0	\N	2026-02-13 18:49:56.017	2026-02-13 18:49:56.017	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8siew000z13qmrcnep855	cmll8sies000w13qmn1xgvuis	MOTO	\N	\N	\N	\N	LT009	t	t	0	\N	2026-02-13 18:49:56.024	2026-02-13 18:49:56.024	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sif3001313qm64cqr9kw	cmll8sif0001013qmurb3656o	BICICLETA	\N	\N	\N	\N	LT010	t	t	0	\N	2026-02-13 18:49:56.032	2026-02-13 18:49:56.032	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sifa001713qmegmz473q	cmll8sif6001413qmj7excudw	AUTO	\N	\N	\N	\N	LT011	t	t	0	\N	2026-02-13 18:49:56.038	2026-02-13 18:49:56.038	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sigb001b13qmontmw93b	cmll8sig7001813qmeqh3czd7	MOTO	\N	\N	\N	\N	LT012	t	t	0	\N	2026-02-13 18:49:56.075	2026-02-13 18:49:56.075	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sigi001f13qmh25n9j0i	cmll8sigf001c13qm9pu40nkd	BICICLETA	\N	\N	\N	\N	LT013	t	f	0	\N	2026-02-13 18:49:56.082	2026-02-13 18:49:56.082	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sigp001j13qmz09spqoa	cmll8sigl001g13qmvxjkbqor	AUTO	\N	\N	\N	\N	LT014	t	t	0	\N	2026-02-13 18:49:56.089	2026-02-13 18:49:56.089	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sigw001n13qm2ipu31zs	cmll8sigt001k13qmjaa7y9lm	MOTO	\N	\N	\N	\N	LT015	t	t	0	\N	2026-02-13 18:49:56.096	2026-02-13 18:49:56.096	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sih1001r13qmd365c11p	cmll8sigz001o13qmxwlyyajt	BICICLETA	\N	\N	\N	\N	LT016	t	t	0	\N	2026-02-13 18:49:56.102	2026-02-13 18:49:56.102	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sih7001v13qm8dt63259	cmll8sih4001s13qmtolt4a4c	AUTO	\N	\N	\N	\N	LT017	t	t	0	\N	2026-02-13 18:49:56.107	2026-02-13 18:49:56.107	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sihc001z13qmo3s7zkdi	cmll8siha001w13qm5qq1i5aq	MOTO	\N	\N	\N	\N	LT018	t	f	0	\N	2026-02-13 18:49:56.113	2026-02-13 18:49:56.113	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sihi002313qmrh6ha1d4	cmll8sihf002013qm3zoqvghv	BICICLETA	\N	\N	\N	\N	LT019	t	t	0	\N	2026-02-13 18:49:56.118	2026-02-13 18:49:56.118	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmll8sihn002713qmbe6s1ag3	cmll8sihk002413qmd0kdzb4y	AUTO	\N	\N	\N	\N	LT020	t	t	0	\N	2026-02-13 18:49:56.123	2026-02-13 18:49:56.123	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmkvbvo7w0026r0gkcidihjmf	cmkvbvo7s0023r0gk3wyvfr2v	BICICLETA	\N	\N	\N	\N	\N	t	t	0	\N	2026-01-26 15:34:21.789	2026-02-27 17:18:30.704	OCUPADO	2026-02-27 17:21:10.451	-54.81224460256284	-68.32797463717198	0101000020E61000008D245589FD1451C0122E92A1F7674BC0	\N	\N	\N	\N	\N	\N	\N
cmmcd9q4i0009lw513bcw6zhl	cmmccgicu0002lw51r2qy0lcr	\N	\N	\N	\N	\N	\N	t	t	0	\N	2026-03-04 18:25:04.387	2026-03-13 18:19:38.44	DISPONIBLE	2026-03-15 21:49:01.657	-54.83182722912501	-68.35039150963401	0101000020E610000025AB82D06C1651C0D2818C50796A4BC0	\N	\N	\N	\N	\N	\N	\N
cmmcbie8v00047jiyj312nd99	cmkvbvo87002br0gkyyz8i0cs	\N	\N	\N	\N	\N	\N	t	f	0	\N	2026-03-04 17:35:49.662	2026-03-06 15:15:46.56	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cmmf6kkze000gls5dzqdbbkh5	cmmf6jzoy0007ls5ddo24lmq3	\N	\N	\N	\N	\N	\N	t	f	0	\N	2026-03-06 17:40:52.154	2026-03-15 20:20:18.692	FUERA_DE_SERVICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Favorite" (id, "userId", "merchantId", "productId", "listingId", "createdAt") FROM stdin;
cmmxwidkn0001bf6tglfqsn39	cmmccgicu0002lw51r2qy0lcr	\N	cmkvbvo47000ar0gk4zi9lpbi	\N	2026-03-19 20:06:50.421
\.


--
-- Data for Name: HeroSlide; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HeroSlide" (id, title, subtitle, "buttonText", "buttonLink", gradient, image, "isActive", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Listing" (id, "sellerId", title, description, price, stock, condition, "isActive", "categoryId", "createdAt", "updatedAt", "heightCm", "lengthCm", "weightKg", "widthCm") FROM stdin;
cmmcirfv00001e2e0dp5feq0y	cmmcipevr0001wwz9f4r8bo4v	Bicicleta de montana usada	Rodado 29, en buen estado	150000	0	USADO	t	\N	2026-03-04 20:58:48.972	2026-03-17 02:01:51.893	\N	\N	\N	\N
\.


--
-- Data for Name: ListingImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ListingImage" (id, "listingId", url, "order") FROM stdin;
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", cuit, category, "ownerId", "createdAt", "updatedAt", "adminNotes", "bankAccount", "businessName", "commissionRate", cuil, "displayOrder", "facebookUrl", "instagramUrl", "isPremium", "ownerBirthDate", "ownerDni", "premiumTier", "premiumUntil", "startedAt", "whatsappNumber", ubicacion, "mpAccessToken", "mpEmail", "mpLinkedAt", "mpRefreshToken", "mpUserId", rating, "acceptedPrivacyAt", "acceptedTermsAt", "constanciaAfipUrl", "habilitacionMunicipalUrl", "registroSanitarioUrl", "scheduleEnabled", "scheduleJson") FROM stdin;
cmkvbvo6k001gr0gknt85jfb9	COMERCIO 3	comercio-3	Sushi fresco preparado por chefs expertos	\N	\N	t	t	t	comercio3@somosmoovy.com	+54 9 2901 000000	Ushuaia, Tierra del Fuego	\N	\N	5	30	45	0	0	\N	Sushi	cmkvbvo6g001dr0gkkc3uxs3s	2026-01-26 15:34:21.74	2026-01-26 15:34:21.74	\N	\N	\N	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
cmkvbvo3z0008r0gkc7qfxplz	COMERCIO 1	comercio-1	Las mejores hamburguesas de Ushuaia	\N	\N	t	t	t	comercio1@somosmoovy.com	+54 9 2901 000000	Kuanip 190	-54.816358	-68.3253491	5	30	45	0	0	\N	Restaurante	cmkvbvo3s0005r0gkpul7pexf	2026-01-26 15:34:21.645	2026-01-28 13:41:49.576	\N	\N	\N	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
cmkvbvo5b000ur0gk0eib5xpt	DUTY FREE SHOP	comercio-2	Atlantico Sur	/uploads/products/1769985188152-IMG_5352.jpg	\N	t	t	t	comercio2@somosmoovy.com	+54 9 2901 000000	Ushuaia, Tierra del Fuego	0	0	5	30	45	0	0	\N	Otro	cmkvbvo57000rr0gkp7ff55ji	2026-01-26 15:34:21.695	2026-02-01 22:33:48.38	\N	\N	DUTY FREE SHOP	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
cmmf8ls6b000qls5diw4zr8hb	Arepa M├¼a	arepa-m-a	Nuevo comercio Moovy	\N	\N	t	t	f	iyadmarmoud@gmail.com	+5492901611605	Av. Alem 4611	\N	\N	5	30	45	0	0	\N	Restaurante	cmmf8ls5o000nls5duy2v9y9v	2026-03-06 18:37:47.363	2026-03-06 18:39:25.295	\N	\N	Arepa M├¼a	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
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
-- Data for Name: MoovyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MoovyConfig" (id, key, value, description, "updatedAt") FROM stdin;
cmmoa04pn000fkki3h04vlmly	driver_response_timeout_seconds	20	Segundos que un repartidor tiene para aceptar/rechazar una oferta	2026-03-13 02:26:51.996
cmmoa04pv000gkki3yzdgp20h	merchant_confirm_timeout_seconds	180	Segundos que un comercio tiene para confirmar un pedido nuevo	2026-03-13 02:26:52.003
cmmoa04q2000hkki31kjutbm7	max_delivery_distance_km	50	Distancia m├íxima de entrega en kil├│metros	2026-03-13 02:26:52.01
cmmoa04q5000ikki3d0ldbdms	min_order_amount_ars	500	Monto m├¡nimo de pedido en pesos argentinos	2026-03-13 02:26:52.014
cmmoa04qb000jkki3o7oxaqni	seller_commission_pct	10	Porcentaje de comisi├│n predeterminado para vendedores	2026-03-13 02:26:52.02
cmmoa04qg000kkki3782ov5bc	driver_commission_pct	15	Porcentaje de comisi├│n predeterminado para repartidores	2026-03-13 02:26:52.024
cmmoa04qk000lkki32sww59f3	max_assignment_attempts	5	Intentos m├íximos para asignar un repartidor antes de escalar a ops	2026-03-13 02:26:52.029
cmmoa04qo000mkki3jpbr47lq	assignment_rating_radius_meters	300	Radio en metros para priorizar repartidores por rating	2026-03-13 02:26:52.032
cmmoa04qt000nkki3j0ano3oc	scheduled_notify_before_minutes	30	Minutos antes de un pedido programado para notificar al comercio	2026-03-13 02:26:52.038
cmmoa04qx000okki3zotf53bv	scheduled_cancel_if_no_confirm_minutes	10	Minutos para cancelar autom├íticamente si no hay confirmaci├│n de pedido programado	2026-03-13 02:26:52.042
cmmwun5f70004srrhthabwvsf	hero_title	Todo Ushuaia en\ntu puerta.	Hero config: hero_title	2026-03-19 02:26:47.726
cmmwun5i30005srrh7pt8vsti	hero_subtitle	Pedidos de comercios locales en minutos	Hero config: hero_subtitle	2026-03-19 02:26:47.727
cmmwun5ip0006srrh069m0l5h	hero_cta_text		Hero config: hero_cta_text	2026-03-19 02:26:47.733
cmmwun5iq0007srrh2cklseza	hero_cta_link		Hero config: hero_cta_link	2026-03-19 02:26:47.733
cmmwun5iy0009srrhdrsk64pw	hero_search_placeholder	┬┐Qu├⌐ quer├⌐s pedir?	Hero config: hero_search_placeholder	2026-03-19 02:26:47.74
cmmwun5ix0008srrhvem8ju4i	hero_search_enabled	true	Hero config: hero_search_enabled	2026-03-19 02:26:47.735
cmmwun5j8000asrrho78aav66	hero_person_image	/hero-person.png	Hero config: hero_person_image	2026-03-19 02:26:47.741
cmmwun5jb000csrrh12wfvv3n	hero_person_enabled	true	Hero config: hero_person_enabled	2026-03-19 02:26:47.743
cmmwun5j9000bsrrh94l1ku86	hero_bg_gradient	linear-gradient(135deg, #a3000c 0%, #cc000f 25%, #e60012 50%, #ff1a2e 75%, #ff4d5e 100%)	Hero config: hero_bg_gradient	2026-03-19 02:26:47.732
cmmwun5k8000dsrrhz0ys0a8b	hero_bg_color	#e60012	Hero config: hero_bg_color	2026-03-19 02:26:47.729
cmmwun5l4000esrrhdl6fkpoe	hero_bg_image		Hero config: hero_bg_image	2026-03-19 02:26:47.732
\.


--
-- Data for Name: MpWebhookLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MpWebhookLog" (id, "eventId", "eventType", "resourceId", processed, "createdAt") FROM stdin;
cmmjq5kop000xqjqupllhvkej	c7604493-9f14-41da-b7e7-e980402cd514	payment	1345333515	t	2026-03-09 22:00:08.953
cmmjt2mxh001bqjqumw6gbjxa	1c138f9d-8879-4dac-bd44-c273b5abcd4c	payment	1326507530	t	2026-03-09 23:21:50.741
cmmjt3gar001fqjqu4p1rdhhw	5bee6aed-11a2-4f30-a481-6305eb31b4df	payment	1326507536	t	2026-03-09 23:22:28.803
cmmju3zq300112wtgo67qmxp5	d2c8cab7-f010-4eae-baa3-bd84b90bbd9d	payment	1326509282	t	2026-03-09 23:50:53.595
cmmju8le8001f2wtgk36cfekq	c900795f-f100-44d6-9b4c-80ab9b76287a	payment	1326507804	t	2026-03-09 23:54:28.305
cmmjucm5e000cc82w6os1bsg2	b82b59f8-227d-4a3a-8d53-3d54e9452e0b	payment	1326509324	t	2026-03-09 23:57:35.907
cmmjuwjur000b9b3guf6ywmhp	b57811be-9efe-4ad2-996a-b0b00b7cdda9	payment	1326509448	t	2026-03-10 00:13:06.051
cmmjxt34x000c9g052hi1q6is	7bf9dd33-2263-4e89-879c-02e049226a49	payment	1326510022	t	2026-03-10 01:34:23.265
cmmkmw7jr000auexnpwha5ffi	67e32016-f407-4e2a-9dba-a62070422a8b	payment	1326511454	t	2026-03-10 13:16:39.351
cmmpb8ukv000pek19rb7tac7g	6026cecc-42b7-471d-b711-24eaf6496485	payment	1326564220	t	2026-03-13 19:49:24.56
cmmpo0kjl000sek19n63uxoch	b7751860-8eed-4e0c-9612-9d35edc095d0	payment	1326563108	t	2026-03-14 01:46:53.31
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt", "cancelReason", "commissionPaid", "driverRating", "merchantPayout", "moovyCommission", "ratedAt", "ratingComment", "assignmentAttempts", "assignmentExpiresAt", "lastAssignmentAt", "pendingDriverId", "isPickup", "attemptedDriverIds", "isMultiVendor", "mpMerchantOrderId", "mpPaymentId", "mpPreferenceId", "mpStatus", "paidAt", "merchantRating", "merchantRatingComment", "sellerRating", "sellerRatingComment", "deliveryType", "scheduledConfirmedAt", "scheduledSlotEnd", "scheduledSlotStart", "deliveryStatus", "deletedAt") FROM stdin;
cmmtyvduq0002l01qzhv4xsxd	MOV-CQ62	cmmccgicu0002lw51r2qy0lcr	cmmknnivk0006nmo1h3eznt7q	\N	AWAITING_PAYMENT	\N	PENDING	mercadopago	150000	0	0	150000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 02:01:51.841	2026-03-17 02:01:52.876	\N	f	\N	0	0	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-be9b5592-7bb5-4d42-b22b-4b259456113f	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	\N
cmld9zrfv0003eba1d9k8ksn8	MOV-MG9V	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	735	0	6235	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 05:01:24.522	2026-03-15 20:19:32.817	Pedido duplicado	f	\N	5060	440	\N	\N	1	\N	2026-02-08 05:01:56.915	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmld805ul00036bogt2zjm7i5	MOV-FCRS	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	735	0	5735	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 04:05:43.956	2026-03-15 20:19:32.817	Hhhhhh	f	\N	4600	400	\N	\N	1	\N	2026-02-08 04:08:46.458	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmld85kx6000c6bogl8knjs4q	MOV-SZ79	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	735	0	5735	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 04:09:56.778	2026-03-15 20:19:32.817	Jkkkk	f	\N	4600	400	\N	\N	1	\N	2026-02-08 04:10:13.176	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmld6tuz90003142vg3e3nr6b	MOV-LGHG	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	735	0	6235	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 03:32:50.323	2026-03-15 20:19:32.817	Limpieza administrativa - El pedido ya no existe	f	\N	5060	440	\N	\N	0	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmld8y3lr0003vk3jaqffbx5f	MOV-6D7H	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	735	0	6235	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 04:32:07.359	2026-03-15 20:19:32.817	Hhj	f	\N	5060	440	\N	\N	1	\N	2026-02-08 04:32:45.407	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmld8b7nl000l6bog0j1o7iu7	MOV-E7DD	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	735	0	6235	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 04:14:19.52	2026-03-15 20:19:32.817	Jjh	f	\N	5060	440	\N	\N	1	\N	2026-02-08 04:15:04.222	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmld9js9l0003zm5oqx2o93go	MOV-NRVE	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	735	0	6235	0.3067622966847363	\N	\N	\N	\N	\N	\N	\N	2026-02-08 04:48:59.096	2026-03-15 20:19:32.817	Pedido duplicado	f	\N	5060	440	\N	\N	1	\N	2026-02-08 04:53:23.514	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlh7md9u000857g29h19vi7g	MOV-FDFD	cmlbofjvu0002mqdpmdns2wmk	cmlh7md6n000557g2s4glzzdi	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	1079	0	6079	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:06:05.107	2026-03-15 20:19:32.817	Solicitud del cliente	f	\N	4600	400	\N	\N	0	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlh7p3la000i57g28ij29w1u	MOV-N3VZ	cmlbofjvu0002mqdpmdns2wmk	cmlh7mcz2000357g2et4e1hgx	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	1079	0	6079	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:08:12.526	2026-03-15 20:19:32.817	Solicitud del cliente	f	\N	4600	400	\N	\N	1	2026-02-10 23:13:47.145	2026-02-10 23:08:47.145	cmkvbvo7w0026r0gkcidihjmf	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlh80fw20004ljt24xvjrupg	MOV-FMZR	cmlbofjvu0002mqdpmdns2wmk	cmlh7mcz2000357g2et4e1hgx	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	1079	0	6079	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:17:01.681	2026-03-15 20:19:32.817	Error en el pedido	f	\N	4600	400	\N	\N	1	\N	2026-02-10 23:17:43.194	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlh7ro8y0004h90l1z1568vl	MOV-GSTY	cmlbofjvu0002mqdpmdns2wmk	cmlh7mcz2000357g2et4e1hgx	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	1079	0	6079	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:10:12.61	2026-03-15 20:19:32.817	Solicitud del cliente	f	\N	4600	400	\N	\N	1	2026-02-10 23:15:31.572	2026-02-10 23:10:31.573	cmkvbvo7w0026r0gkcidihjmf	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmll7nbp0000381hq1vqyvwr9	MOV-T9NB	cmkvbvo8c002dr0gk22kda2cw	cmlgxg5y70003jitzc6n7c58k	cmkvbvo3z0008r0gkc7qfxplz	COMPLETED	\N	PENDING	cash	5500	675	0	6175	\N	\N	\N	cmkvbvo7n0022r0gkuu9g9uab	2026-02-13 18:22:50.553	\N	\N	\N	2026-02-13 18:17:54.42	2026-03-15 20:19:32.817	\N	f	5	5060	440	2026-02-13 18:23:00.068	\N	1	\N	2026-02-13 18:21:05.464	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmm509g3i000ghhwz6rpafd5g	MOV-WBAL	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	7500	1075	0	8575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-27 14:46:33.15	2026-03-15 20:19:32.817	Falta de stock	f	\N	6900	600	\N	\N	1	2026-02-27 14:52:26.674	2026-02-27 14:47:26.675	cmkvbvo7n0022r0gkuu9g9uab	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlplppli000313mzusgf0iv0	MOV-WCVP	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	1075	0	6575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-16 20:02:45.074	2026-03-15 20:19:32.817	Problema con el pago	f	\N	5060	440	\N	\N	1	2026-02-16 20:07:56.032	2026-02-16 20:02:56.032	cmkvbvo7n0022r0gkuu9g9uab	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmm50el1h0017hhwz0apjomes	MOV-UVAE	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	1075	0	6575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-27 14:50:32.837	2026-03-15 20:19:32.817	Direcci??n de entrega incorrecta	f	\N	5060	440	\N	\N	2	2026-02-27 15:01:11.761	2026-02-27 14:56:11.762	cmkvbvo7n0022r0gkuu9g9uab	f	["cmkvbvo7w0026r0gkcidihjmf"]	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlplqsyn000c13mz4zcy57pz	MOV-4URU	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	1075	0	6575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-16 20:03:36.094	2026-03-15 20:19:32.817	Problema con el pago	f	\N	5060	440	\N	\N	1	2026-02-16 20:08:45.818	2026-02-16 20:03:45.818	cmkvbvo7n0022r0gkuu9g9uab	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmmh48g39001tfri20cvyj4tq	MOV-VNAQ	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 02:10:59.061	2026-03-15 20:19:20.382	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-8770a432-ac20-4362-8858-114e59b88cf4	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:20.38
cmmhvg9do0003kwe098uvdqb3	MOV-7XQR	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 14:52:53.242	2026-03-15 20:19:20.382	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-a09c0058-631f-4daf-90a1-b851ca6b6586	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:20.38
cmmh3s53z000wfri23hrqhxyq	MOV-QD9A	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	7500	0	0	7500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 01:58:18.335	2026-03-15 20:19:28.423	\N	f	\N	6900	600	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-03479dc0-9dfc-4b16-82bf-629bf6264ca8	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:28.421
cmmh3zuvt0017fri2owxfqh9g	MOV-DZUS	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	7500	0	0	7500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 02:04:18.329	2026-03-15 20:19:28.423	\N	f	\N	6900	600	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-7ff0b40c-aa1b-4298-88f4-d58ab3ec1f7d	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:28.421
cmmh46jaz001ifri2xv3o3kdq	MOV-J6TF	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 02:09:29.915	2026-03-15 20:19:28.423	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-e5d1d2a7-6a0a-4358-a2c4-5da91d2c1efd	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:28.421
cmm4vflql0007hhwz0hpm20w2	MOV-HBXD	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	7500	1075	0	8575	2.05617032868614	\N	\N	cmkvbvo7w0026r0gkcidihjmf	\N	\N	\N	\N	2026-02-27 12:31:22.317	2026-03-15 20:19:32.817	Falta de stock	f	\N	6900	600	\N	\N	1	\N	2026-02-27 12:33:40.548	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmmi68t1e000fi6946bx2jmem	MOV-E5GP	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	15000	0	0	15000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 19:55:01.25	2026-03-15 20:19:12.422	\N	f	\N	13800	1200	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-db27effc-481a-427a-b423-297583341291	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi6j7kg000ri694vobfo5ac	MOV-JPTY	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	10000	0	0	10000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 20:03:06.64	2026-03-15 20:19:12.422	\N	f	\N	9200	800	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-251d833c-fd91-4762-9d05-5aea51711d86	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi8q6pv0020i694r7j084nz	MOV-2474	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:04:31.363	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-519f466b-6243-40c1-ab82-f911bc0731e2	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmpb84hn000hek19csh5pqz9	MOV-4U98	cmmccgicu0002lw51r2qy0lcr	cmmknnivk0006nmo1h3eznt7q	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	30000	895	0	30895	1.131360086435887	perro 	\N	\N	\N	\N	\N	\N	2026-03-13 19:48:50.747	2026-03-15 20:19:06.8	\N	f	\N	27600	2400	\N	\N	0	\N	\N	\N	f	\N	f	\N	1326564220	40783970-55c5e06b-d093-4c64-833f-c12cb82bc9dc	approved	2026-03-13 19:49:25.368	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:06.798
cmmi6os8k0012i694hrat70ko	MOV-KLQ7	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 20:07:26.705	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-7e472aa7-2282-43bc-bc8a-660ca13477f3	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi6s70b001ei694w8wrbz0a	MOV-LVLE	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	15000	0	0	15000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 20:10:05.819	2026-03-15 20:19:12.422	\N	f	\N	13800	1200	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-f209db78-fd8e-4bae-8a56-ad78cfd357a5	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi8pt08001pi694m5ep0zgb	MOV-RYB3	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:04:13.592	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-00e46774-5281-4312-a16d-e7d193a33486	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi68e860003i694ypol6vno	MOV-TYKA	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	0	0	5000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 19:54:42.053	2026-03-15 20:19:12.422	Tiempo de espera excedido	f	\N	4600	400	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi8vm6w002ci694vc0su6wl	MOV-9H3W	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	15000	0	0	15000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:08:44.696	2026-03-15 20:19:12.422	\N	f	\N	13800	1200	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-66626083-6339-45ec-8b63-1557fd584a88	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi8xg48002yi694ak2683jo	MOV-V2BP	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:10:10.137	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-9ec5f318-c358-4983-82d6-088e61f14c1a	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi986mh0003tszvezfaz15c	MOV-F4JR	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	16500	0	0	16500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:18:31.049	2026-03-15 20:19:12.422	\N	f	\N	15180	1320	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-6ef4237b-09a7-4463-9702-bd9f96095109	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi986vh000dtszv7cwx3z3t	MOV-KXH6	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:18:31.372	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-15cac486-5aca-4e9a-9776-a563318170f4	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi99ltp000qtszv7jmf7rtn	MOV-7ZVX	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:19:37.405	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-94698182-dbc4-474b-8dbe-f7a505d10333	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi9ev8o0013tszv905wbc51	MOV-TE6B	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	15000	0	0	15000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:23:42.888	2026-03-15 20:19:12.422	\N	f	\N	13800	1200	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-f8ef23d7-860f-4210-a678-08fe4f3aa4ac	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi9gax4001etszv2jmvbwqn	MOV-QKLC	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:24:49.864	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-7cd3f087-806e-4cfb-9840-0add8103ccf2	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi9pc46001ptszvf3yrf3p2	MOV-LFVX	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:31:51.318	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-130c9062-2f08-4cae-b041-36c2bbb5cf73	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmia7bl50020tszvif0zjp90	MOV-44PL	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:45:50.442	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-6370206e-7b6b-46f8-9889-fe61e84a1219	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmiafamt002ctszv3rzwtaw7	MOV-VJNJ	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	16500	0	0	16500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:52:02.454	2026-03-15 20:19:12.422	\N	f	\N	15180	1320	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-a49fa3fb-44db-4e92-83e4-129e7b9e8e22	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmib8meh0002xdlk0f0r7by2	MOV-A4FW	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 22:14:50.729	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-fc56f10f-0767-401e-8dcd-53a5e417e017	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmib9n01000exdlkgm5x9yf1	MOV-LSVE	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	2700	0	0	2700	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 22:15:38.161	2026-03-15 20:19:12.422	\N	f	\N	2484	216	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-c4213d0a-5754-43bf-ad8e-79f31cedb204	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmibafax000txdlkgdytpoo5	MOV-9MM9	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 22:16:14.841	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-c5d8acd1-cfd2-450e-b86c-720978fa04fc	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmj7h4eq0004tzd2q7g06zav	MOV-E4LK	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	15000	0	0	15000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 13:17:15.026	2026-03-15 20:19:12.422	\N	f	\N	13800	1200	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-ee294a37-f640-43d6-b98d-72f49cc3ecbd	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjgt78o0004vqe43py8xwsu	MOV-3Y9X	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	22500	0	0	22500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 17:38:35.111	2026-03-15 20:19:12.422	\N	f	\N	20700	1800	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-5d64eb9d-8fe3-4053-a85c-d1f200b0372d	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjhdugn000ivqe4ylixlqjc	MOV-UXU2	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5000	0	0	5000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 17:54:38.327	2026-03-15 20:19:12.422	\N	f	\N	4600	400	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-64efb9dc-f473-4b58-ab16-593193bf358b	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjhg4ub000uvqe4931iubcs	MOV-VGPT	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	15000	0	0	15000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 17:56:25.091	2026-03-15 20:19:12.422	\N	f	\N	13800	1200	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	3010611064-2ef57109-ff1c-44d6-8b6a-a3e9bb65ea1e	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmi8wqht002ni694r0tgzntl	MOV-JYT2	cmlbofjvu0002mqdpmdns2wmk	cmlcf8agf0004n1z3kfbpgcs6	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 21:09:36.93	2026-03-15 20:19:12.422	Error en el pedido	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjmejzt000313h69pv3bb2e	MOV-36HU	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 20:15:09.496	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-61b329f7-191e-4840-bbe5-7366b9022b24	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjngga7000f13h6q00mzd4k	MOV-82TL	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	11000	0	0	11000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 20:44:37.614	2026-03-15 20:19:12.422	\N	f	\N	10120	880	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-607030c4-958c-4965-a2b2-c63f2fa8b330	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjnillx000q13h6ohyn3f00	MOV-CY6J	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	11000	0	0	11000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 20:46:17.829	2026-03-15 20:19:12.422	\N	f	\N	10120	880	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-8390903b-8600-4635-b7ee-587c5b7efe36	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjnpm4z001113h6rlkebpb5	MOV-VNXK	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	11000	0	0	11000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 20:51:45.107	2026-03-15 20:19:12.422	\N	f	\N	10120	880	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-31b334e7-c45a-40f0-9e59-e2c132a5c5b4	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjnv4w7001d13h6a0kohkmt	MOV-ZGEQ	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	30000	0	0	30000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 20:56:02.696	2026-03-15 20:19:12.422	\N	f	\N	27600	2400	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-83659f01-ed35-4010-a4b0-25d5b3208436	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjo2mfs00035szntcqry54b	MOV-5SFC	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 21:01:52.024	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-11f98bce-f84c-4c94-b15f-9f49d21130c4	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjonk4d0005e4tps7bjklqf	MOV-8QQG	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	24000	0	0	24000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 21:18:08.796	2026-03-15 20:19:12.422	\N	f	\N	22080	1920	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-6a606213-99b3-4a6c-987a-5a06b739de12	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjotffg0004cp9j58hl5r1o	MOV-X3SP	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	22500	0	0	22500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 21:22:42.652	2026-03-15 20:19:12.422	\N	f	\N	20700	1800	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-6bb75a68-6403-442f-9dce-eed75e20b222	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjpb9o60003lcz4uah18rmw	MOV-NWHL	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 21:36:34.996	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-20c8ecfc-819d-46f0-935f-2e4a9213e500	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjpve2i0003qjqu6f5qgwws	MOV-RWQJ	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	7500	0	0	7500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 21:52:13.818	2026-03-15 20:19:12.422	\N	f	\N	6900	600	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-d005cb2e-753f-4631-8511-8727ca9292de	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjpxp3e000eqjqu27tj55va	MOV-GQ6T	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 21:54:01.418	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-1f0b3afd-62dd-4458-b2bf-86967e342aad	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmju7u2900172wtgq7k80ztj	MOV-KXV7	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	7500	0	0	7500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 23:53:52.881	2026-03-15 20:19:12.422	\N	f	\N	6900	600	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326507804	40783970-6fb869e0-377b-438e-821e-f370eac896e6	approved	2026-03-09 23:54:29.099	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjt1xl90013qjquuvusvhwj	MOV-MQMZ	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	22500	0	0	22500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 23:21:17.901	2026-03-15 20:19:12.422	Pago rechazado por MercadoPago	f	\N	20700	1800	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326507536	40783970-e296f389-46c7-4a7b-b95f-3d44a377c884	approved	2026-03-09 23:22:29.481	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmju1wl1000h2wtgyyhnryw8	MOV-UBH9	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	22500	0	0	22500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 23:49:16.213	2026-03-15 20:19:12.422	\N	f	\N	20700	1800	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	40783970-44df4838-2c7a-4f01-9670-10f12a2b8fc8	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmju3aj0000t2wtgc0urwiyf	MOV-P6Y8	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	37500	0	0	37500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 23:50:20.94	2026-03-15 20:19:12.422	\N	f	\N	34500	3000	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326509282	40783970-cddb6e48-587c-4941-bb47-a90a47987343	approved	2026-03-09 23:50:54.279	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjubodi0004c82wpyrce2eh	MOV-R2AQ	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	11000	0	0	11000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 23:56:52.134	2026-03-15 20:19:12.422	\N	f	\N	10120	880	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326509324	40783970-b090d16d-5700-4bd4-9a60-ea66c7d117cb	approved	2026-03-09 23:57:36.637	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjuvxb400039b3g0awpn9q2	MOV-DGT3	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:12:36.832	2026-03-15 20:19:12.422	\N	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326509448	40783970-c48077a3-ffbe-4ff6-9849-cd1784f80f6f	approved	2026-03-10 00:13:06.699	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmkmv9b60002uexnjzhmthp4	MOV-GJCP	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	\N	CONFIRMED	\N	PAID	mercadopago	150000	0	0	150000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 13:15:54.976	2026-03-15 20:19:12.422	\N	f	\N	0	0	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326511454	40783970-1292c87f-b5e0-4910-8352-9e0eb5742a7d	approved	2026-03-10 13:16:40.092	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjxsel200049g05uqzedyyr	MOV-HAUY	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	27500	0	0	27500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 01:33:51.445	2026-03-15 20:19:12.422	\N	f	\N	25300	2200	\N	\N	0	\N	\N	\N	t	\N	f	\N	1326510022	40783970-43adb11f-445b-4625-a6dd-2abfc529ff19	approved	2026-03-10 01:34:23.955	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmjq4pdu000pqjquqne4ez8z	MOV-9VKR	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	DELIVERED	\N	PAID	mercadopago	7500	0	0	7500	\N	\N	\N	cmmcd9q4i0009lw513bcw6zhl	2026-03-12 21:35:51.636	\N	\N	\N	2026-03-09 21:59:28.386	2026-03-15 20:19:12.422	\N	f	\N	6900	600	\N	\N	0	\N	\N	\N	t	\N	f	\N	1345333515	40783970-201e0610-3fc0-4cc0-8260-8314b02dc814	approved	2026-03-09 22:00:10.001	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmp90pm40004148upedkvg87	MOV-5S2U	cmmccgicu0002lw51r2qy0lcr	cmmknnivk0006nmo1h3eznt7q	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	27500	895	0	28395	1.131360086435887	Cuidado con el perro!!!!	\N	\N	\N	\N	\N	\N	2026-03-13 18:47:05.644	2026-03-15 20:19:12.422	\N	f	\N	25300	2200	\N	\N	0	\N	\N	\N	f	\N	f	\N	\N	40783970-5ab6773c-c300-4957-9299-d995ae45234a	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmpb6o150005ek194ozksuha	MOV-J65K	cmmccgicu0002lw51r2qy0lcr	cmmknnivk0006nmo1h3eznt7q	cmkvbvo3z0008r0gkc7qfxplz	AWAITING_PAYMENT	\N	PENDING	mercadopago	5000	895	0	5895	1.131360086435887	CUIDADO CON EL PERRO	\N	\N	\N	\N	\N	\N	2026-03-13 19:47:42.76	2026-03-15 20:19:12.422	\N	f	\N	4600	400	\N	\N	0	\N	\N	\N	f	\N	f	\N	\N	40783970-69241d9b-dea5-48e6-9d73-4df2e7387e25	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmp92tsx000g148u0eoa5u7z	MOV-TDL6	cmmccgicu0002lw51r2qy0lcr	cmmknnivk0006nmo1h3eznt7q	cmkvbvo3z0008r0gkc7qfxplz	CONFIRMED	\N	PAID	mercadopago	38500	895	0	39395	1.131360086435887	GUARDA CON EL PERRO	\N	\N	\N	\N	\N	\N	2026-03-13 18:48:44.386	2026-03-15 20:19:12.422	\N	f	\N	35420	3080	\N	\N	0	\N	\N	\N	f	\N	f	\N	1326563108	40783970-0c6cf03d-3f93-48cb-84ea-619d81a1a57a	approved	2026-03-14 01:46:54.14	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmju1iwe00052wtg1522vv6t	MOV-BSFM	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	10000	0	0	10000	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 23:48:58.477	2026-03-15 20:19:12.422	El comercio no confirm├│ el pedido a tiempo	f	\N	9200	800	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmmknp3lk0009nmo1pq62hkyy	MOV-2NLY	cmmccgicu0002lw51r2qy0lcr	cmmknnivk0006nmo1h3eznt7q	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	895	0	6395	1.131360086435887	\N	\N	\N	\N	\N	\N	\N	2026-03-10 13:39:07.256	2026-03-15 20:19:12.422	El comercio no confirm├│ el pedido a tiempo	f	\N	5060	440	\N	\N	0	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:12.421
cmlh8dvr30004118zljbhq35i	MOV-T4SD	cmlbofjvu0002mqdpmdns2wmk	cmlh7mcz2000357g2et4e1hgx	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5000	1079	0	6079	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:27:28.767	2026-03-15 20:19:32.817	Solicitud del cliente	f	\N	4600	400	\N	\N	1	2026-02-10 23:33:21.475	2026-02-10 23:28:21.475	cmkvbvo7w0026r0gkcidihjmf	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlh8lqcu000d118z52zga4uw	MOV-FMQE	cmlbofjvu0002mqdpmdns2wmk	cmlh7mcz2000357g2et4e1hgx	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	7500	1079	0	8579	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:33:35.022	2026-03-15 20:19:32.817	Solicitud del cliente	f	\N	6900	600	\N	\N	3	\N	2026-02-10 23:44:20.062	\N	f	["cmkvbvo7w0026r0gkcidihjmf", "cmkvbvo7n0022r0gkuu9g9uab"]	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlh976u1000n118zi5vy0czv	MOV-KCMH	cmlbofjvu0002mqdpmdns2wmk	cmlh7mcz2000357g2et4e1hgx	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	7500	1079	0	8579	2.073853894658736	\N	\N	\N	\N	\N	\N	\N	2026-02-10 23:50:16.153	2026-03-15 20:19:32.817	Pedido de prueba - limpieza	f	\N	6900	600	\N	\N	1	2026-02-10 23:55:42.285	2026-02-10 23:50:42.285	cmkvbvo7w0026r0gkcidihjmf	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmlpb836y00042494e95414ok	MOV-ZHHW	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	1075	0	6575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-16 15:09:06.729	2026-03-15 20:19:32.817	Solicitud del cliente	f	\N	5060	440	\N	\N	3	\N	2026-02-16 20:01:56.154	\N	f	["cmkvbvo7n0022r0gkuu9g9uab"]	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmm50cja8000yhhwzfoxfjbja	MOV-UGCY	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	5500	1075	0	6575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-27 14:48:57.248	2026-03-15 20:19:32.817	Pedido duplicado	f	\N	5060	440	\N	\N	1	2026-02-27 14:54:05.347	2026-02-27 14:49:05.347	cmkvbvo7n0022r0gkuu9g9uab	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmm50bnlx000phhwzp0gavi4w	MOV-NMH7	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	7500	1075	0	8575	2.05617032868614	\N	\N	\N	\N	\N	\N	\N	2026-02-27 14:48:16.197	2026-03-15 20:19:32.817	Cliente no responde	f	\N	6900	600	\N	\N	1	2026-02-27 14:53:32.493	2026-02-27 14:48:32.494	cmkvbvo7n0022r0gkuu9g9uab	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmm55nmj50002tgn808kguji8	MOV-3KVM	cmkvbvo87002br0gkyyz8i0cs	cmlgy31wz000212bbnnivbgw2	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	cash	2700	1075	0	3775	2.05617032868614	\N	\N	cmkvbvo7w0026r0gkcidihjmf	\N	\N	\N	\N	2026-02-27 17:17:32.751	2026-03-15 20:19:32.817	Direcci??n de entrega incorrecta	f	\N	2484	216	\N	\N	1	\N	2026-02-27 17:18:04.334	\N	f	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmmh3illw0007fri2mop7wxp3	MOV-DYNE	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	mercadopago	7500	0	0	7500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 01:50:53.155	2026-03-15 20:19:32.817	Error al crear preferencia de pago	f	\N	6900	600	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
cmmh3mnlk000lfri2ih7hck7b	MOV-XD4V	cmmccgicu0002lw51r2qy0lcr	cmmh3ilkw0004fri2auy4f4np	cmkvbvo3z0008r0gkc7qfxplz	CANCELLED	\N	PENDING	mercadopago	5500	0	0	5500	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-08 01:54:02.36	2026-03-15 20:19:32.817	Error al crear preferencia de pago	f	\N	5060	440	\N	\N	0	\N	\N	\N	t	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	IMMEDIATE	\N	\N	\N	\N	2026-03-15 20:19:32.815
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

COPY public."OrderItem" (id, "orderId", "productId", name, price, quantity, "variantName", subtotal, "subOrderId", "listingId", "packageCategoryName") FROM stdin;
cmld6tv060005142vzkfrjnmf	cmld6tuz90003142vg3e3nr6b	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmld805vc00056bogayhhtwd9	cmld805ul00036bogt2zjm7i5	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmld85kxh000e6bogcr7gk8o6	cmld85kx6000c6bogl8knjs4q	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmld8b7ny000n6bog0sbw8xff	cmld8b7nl000l6bog0j1o7iu7	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmld8y3mh0005vk3jubff9wj1	cmld8y3lr0003vk3jaqffbx5f	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmld9js9z0005zm5oztbag3ll	cmld9js9l0003zm5oqx2o93go	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmld9zrgd0005eba142o7yohm	cmld9zrfv0003eba1d9k8ksn8	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmlh7mda7000a57g2rwacl9gu	cmlh7md9u000857g29h19vi7g	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmlh7p3mr000k57g21kzcxwgn	cmlh7p3la000i57g28ij29w1u	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmlh7ro930006h90l7rkpmyhz	cmlh7ro8y0004h90l1z1568vl	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmlh80fwa0006ljt2oakyt5ni	cmlh80fw20004ljt24xvjrupg	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmlh8dvr80006118zrak23r52	cmlh8dvr30004118zljbhq35i	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	\N	\N	\N
cmlh8lqcz000f118zz8dfy20w	cmlh8lqcu000d118z52zga4uw	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	\N	\N	\N
cmlh976u5000p118zyig1qeoo	cmlh976u1000n118zi5vy0czv	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	\N	\N	\N
cmll7nbpb000581hqbzge08ii	cmll7nbp0000381hq1vqyvwr9	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmlpb83c600062494vg9m7orm	cmlpb836y00042494e95414ok	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmlplppm9000513mz3h35nw45	cmlplppli000313mzusgf0iv0	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmlplqszf000e13mz0nqvki6f	cmlplqsyn000c13mz4zcy57pz	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmm4vflr30009hhwz01tyf45i	cmm4vflql0007hhwz0hpm20w2	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	\N	\N	\N
cmm509gbd000ihhwzu2he08bj	cmm509g3i000ghhwz6rpafd5g	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	\N	\N	\N
cmm50bnm8000rhhwzv6fgq7em	cmm50bnlx000phhwzp0gavi4w	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	\N	\N	\N
cmm50cjai0010hhwzfhxqrmh2	cmm50cja8000yhhwzfoxfjbja	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmm50el1m0019hhwzfkghba1a	cmm50el1h0017hhwz0apjomes	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	\N	\N	\N
cmm55nmqg0004tgn865rlvaa9	cmm55nmj50002tgn808kguji8	cml4byrg9000y7c7e678cio8s	PRIME x3 - Tachas	2700	1	\N	2700	\N	\N	\N
cmmh3ilm90009fri21htua1ho	cmmh3illw0007fri2mop7wxp3	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmh3iln6000bfri270s9dts1	\N	\N
cmmh3mnlv000nfri2hn41wius	cmmh3mnlk000lfri2ih7hck7b	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmh3mnn8000pfri2cp3ga2rt	\N	\N
cmmh3s543000yfri2sigdinx2	cmmh3s53z000wfri23hrqhxyq	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmh3s54i0010fri22xdhkpur	\N	\N
cmmh3zuwd0019fri2802rq899	cmmh3zuvt0017fri2owxfqh9g	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmh3zuy4001bfri2yxo41xpy	\N	\N
cmmh46jb8001kfri2mzuydp8g	cmmh46jaz001ifri2xv3o3kdq	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmh46jbp001mfri2wj4h39sf	\N	\N
cmmh48g3g001vfri2zgguzqve	cmmh48g39001tfri20cvyj4tq	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmh48g3r001xfri2saosjiem	\N	\N
cmmhvg9jo0005kwe0b2vgod11	cmmhvg9do0003kwe098uvdqb3	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmhvg9r60007kwe0ez39anyb	\N	\N
cmmi68e930005i694r5jj79od	cmmi68e860003i694ypol6vno	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	cmmi68eab0007i694a2m4odog	\N	\N
cmmi68t1g000hi6944viuqjj7	cmmi68t1e000fi6946bx2jmem	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	2	\N	15000	cmmi68t1r000ji694hu7be3oo	\N	\N
cmmi6j7kl000ti694380ya8v2	cmmi6j7kg000ri694vobfo5ac	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	2	\N	10000	cmmi6j7l0000vi6943xg86gcf	\N	\N
cmmi6os8u0014i6948llaj0e7	cmmi6os8k0012i694hrat70ko	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi6os980016i694cnoe05yt	\N	\N
cmmi6s70l001gi6948tqxhbv0	cmmi6s70b001ei694w8wrbz0a	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	3	\N	15000	cmmi6s710001ii694sxypg84b	\N	\N
cmmi8pt0g001ri6949zpsz43d	cmmi8pt08001pi694m5ep0zgb	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi8pt0u001ti694mvn1bchu	\N	\N
cmmi8q6q30022i694qlz3fxci	cmmi8q6pv0020i694r7j084nz	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi8q6ql0024i694dpu68gut	\N	\N
cmmi8vm73002ei6942j0jqduz	cmmi8vm6w002ci694vc0su6wl	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	3	\N	15000	cmmi8vm7a002gi6942ohab9h3	\N	\N
cmmi8wqi2002pi694ofo2et2m	cmmi8wqht002ni694r0tgzntl	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi8wqii002ri694ml0s6qdl	\N	\N
cmmi8xg4b0030i694ukvm3qek	cmmi8xg48002yi694ak2683jo	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi8xg4i0032i694kpis59xx	\N	\N
cmmi986ms0005tszvkwsxg169	cmmi986mh0003tszvezfaz15c	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	3	\N	16500	cmmi986n80007tszvjnzmkpbg	\N	\N
cmmi986vn000ftszvjl60jzjx	cmmi986vh000dtszv7cwx3z3t	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi986w0000htszvt5294r2j	\N	\N
cmmi99ltu000stszvsyipw3k8	cmmi99ltp000qtszv7jmf7rtn	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi99lu2000utszvskb0d29r	\N	\N
cmmi9ev8t0015tszv19r21e35	cmmi9ev8o0013tszv905wbc51	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	2	\N	15000	cmmi9ev950017tszvx9w6aky6	\N	\N
cmmi9gaxa001gtszvtr3c0sez	cmmi9gax4001etszv2jmvbwqn	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi9gaxh001itszvxlwq2xdo	\N	\N
cmmi9pc4j001rtszv9ed8t4rs	cmmi9pc46001ptszvf3yrf3p2	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmi9pc52001ttszv4frvxqy1	\N	\N
cmmia7ble0022tszvlk276kbe	cmmia7bl50020tszvif0zjp90	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmia7bls0024tszv0npuowhi	\N	\N
cmmiafan2002etszvkgyiw2w7	cmmiafamt002ctszv3rzwtaw7	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	3	\N	16500	cmmiafanh002gtszvq18k3lm7	\N	\N
cmmib8mf20004xdlkdgyqqyim	cmmib8meh0002xdlk0f0r7by2	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmib8mg70006xdlk5hoyh6mu	\N	\N
cmmib9n05000gxdlkdfffciws	cmmib9n01000exdlkgm5x9yf1	cml4byrgf00117c7e9qixucyd	PRIME x3 - Super Fino	2700	1	\N	2700	cmmib9n0l000ixdlkrigcq461	\N	\N
cmmibafb5000vxdlkw9jgbgnl	cmmibafax000txdlkgdytpoo5	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmibafbm000xxdlkj8at5gvl	\N	\N
cmmj7h4f30006tzd2oqbg3fte	cmmj7h4eq0004tzd2q7g06zav	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	2	\N	15000	cmmj7h4g70008tzd28tfbgodu	\N	\N
cmmjgt7910006vqe4kf625e3z	cmmjgt78o0004vqe43py8xwsu	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	3	\N	22500	cmmjgt79p0008vqe4nadrzepk	\N	\N
cmmjhdugx000kvqe4zohjyw0v	cmmjhdugn000ivqe4ylixlqjc	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	cmmjhduhe000mvqe4u7kh1k0m	\N	\N
cmmjhg4uh000wvqe4wm7geoyy	cmmjhg4ub000uvqe4931iubcs	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	2	\N	15000	cmmjhg4uv000yvqe4hizoib4x	\N	\N
cmmjmek06000513h6pumn3hsb	cmmjmejzt000313h69pv3bb2e	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmjmek0u000713h6ipxbxl1w	\N	\N
cmmjnggad000h13h6s1mhmwzh	cmmjngga7000f13h6q00mzd4k	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	2	\N	11000	cmmjnggar000j13h6nnvodi4y	\N	\N
cmmjnilmg000s13h6xmtmaq5x	cmmjnillx000q13h6ohyn3f00	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	2	\N	11000	cmmjnilni000u13h6ymh535l4	\N	\N
cmmjnpm55001313h6gy48u09w	cmmjnpm4z001113h6rlkebpb5	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	2	\N	11000	cmmjnpm5p001513h6kcsz3awx	\N	\N
cmmjnv4wj001f13h6p744y69g	cmmjnv4w7001d13h6a0kohkmt	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	4	\N	30000	cmmjnv4wx001h13h6k4di210a	\N	\N
cmmjo2mfy00055sznoul1uf6g	cmmjo2mfs00035szntcqry54b	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmjo2mg900075sznr68skaj6	\N	\N
cmmjonk4k0007e4tpagtny1i7	cmmjonk4d0005e4tps7bjklqf	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	3	\N	16500	cmmjonk53000be4tpinl6205g	\N	\N
cmmjonk4w0009e4tpzcsg032y	cmmjonk4d0005e4tps7bjklqf	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmjonk53000be4tpinl6205g	\N	\N
cmmjotffr0006cp9j70hz72oz	cmmjotffg0004cp9j58hl5r1o	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	3	\N	22500	cmmjotfgd0008cp9jjqzc0w3w	\N	\N
cmmjpb9of0005lcz4u0cgb97t	cmmjpb9o60003lcz4uah18rmw	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmjpb9p50007lcz444kysvjb	\N	\N
cmmjpve2r0005qjqu0mwz9ewg	cmmjpve2i0003qjqu6f5qgwws	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmjpve3f0007qjquls2d2f3p	\N	\N
cmmjpxp3l000gqjqubzcx8z2k	cmmjpxp3e000eqjqu27tj55va	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmjpxp40000iqjqu3sdhy90m	\N	\N
cmmjq4pe3000rqjqubr9t5hdc	cmmjq4pdu000pqjquqne4ez8z	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmjq4pem000tqjqult4jdbxw	\N	\N
cmmjt1xlh0015qjquonmdtd6e	cmmjt1xl90013qjquuvusvhwj	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	3	\N	22500	cmmjt1xly0017qjqu7szrgolc	\N	\N
cmmju1iwt00072wtgpi2fji3k	cmmju1iwe00052wtg1522vv6t	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	2	\N	10000	cmmju1ixn00092wtgtu4vjbd5	\N	\N
cmmju1wlc000j2wtgcgi6evxj	cmmju1wl1000h2wtgyyhnryw8	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	3	\N	22500	cmmju1wmf000l2wtgzogppd7j	\N	\N
cmmju3aj6000v2wtgfkqpc792	cmmju3aj0000t2wtgc0urwiyf	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	5	\N	37500	cmmju3aji000x2wtgv4uxaynp	\N	\N
cmmju7u2i00192wtgd9qysvz6	cmmju7u2900172wtgq7k80ztj	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	1	\N	7500	cmmju7u33001b2wtgkx3uhav8	\N	\N
cmmjubody0006c82wviwpm5nb	cmmjubodi0004c82wpyrce2eh	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	2	\N	11000	cmmjuboei0008c82wewt8q0gm	\N	\N
cmmjuvxbc00059b3gc29wk56u	cmmjuvxb400039b3g0awpn9q2	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmjuvxbu00079b3giijaecfa	\N	\N
cmmjxsem000069g05hvdv459q	cmmjxsel200049g05uqzedyyr	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	5	\N	27500	cmmjxsemn00089g05pc2wps8q	\N	\N
cmmkmv9bt0004uexnf5y344t1	cmmkmv9b60002uexnjzhmthp4	\N	Bicicleta de montana usada	150000	1	\N	150000	\N	cmmcirfv00001e2e0dp5feq0y	\N
cmmknp3nv000bnmo1weowwj3o	cmmknp3lk0009nmo1pq62hkyy	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	1	\N	5500	cmmknp3sk000dnmo1tg6d08hi	\N	\N
cmmp90pmo0006148udw2vswzq	cmmp90pm40004148upedkvg87	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	5	\N	27500	cmmp90pni0008148ur9py2uie	\N	\N
cmmp92tt6000i148u0n9hsox7	cmmp92tsx000g148u0eoa5u7z	cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	5500	7	\N	38500	cmmp92ttq000k148ujsovrry5	\N	\N
cmmpb6o2c0007ek19wf4bskc2	cmmpb6o150005ek194ozksuha	cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	5000	1	\N	5000	cmmpb6o2z0009ek195nhypeii	\N	\N
cmmpb84hr000jek19g1juebnf	cmmpb84hn000hek19csh5pqz9	cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	7500	4	\N	30000	cmmpb84hz000lek191pmsuqht	\N	\N
cmmtyvdvg0004l01qwgi249ii	cmmtyvduq0002l01qzhv4xsxd	\N	Bicicleta de montana usada	150000	1	\N	150000	\N	cmmcirfv00001e2e0dp5feq0y	\N
\.


--
-- Data for Name: PackageCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackageCategory" (id, name, "maxWeightGrams", "maxLengthCm", "maxWidthCm", "maxHeightCm", "volumeScore", "allowedVehicles", "isActive", "displayOrder", "createdAt", "updatedAt") FROM stdin;
cmmoa04mg0000kki3x0ye9ow8	MICRO	500	20	15	10	1	{BIKE,MOTO,CAR,TRUCK}	t	1	2026-03-13 02:26:51.879	2026-03-13 02:26:51.879
cmmoa04n20001kki3nj9xiboq	SMALL	2000	35	25	20	3	{BIKE,MOTO,CAR,TRUCK}	t	2	2026-03-13 02:26:51.903	2026-03-13 02:26:51.903
cmmoa04n70002kki3zbhqpbh8	MEDIUM	5000	50	40	30	6	{MOTO,CAR,TRUCK}	t	3	2026-03-13 02:26:51.907	2026-03-13 02:26:51.907
cmmoa04nk0004kki3qu13bhp7	XL	50000	150	100	100	20	{TRUCK}	t	5	2026-03-13 02:26:51.92	2026-03-13 02:26:51.92
cmmoa04nd0003kki3rrle4wkf	LARGE	15000	80	60	50	10	{TRUCK,CAR}	t	4	2026-03-13 02:26:51.913	2026-03-13 19:58:43.063
\.


--
-- Data for Name: PackagePricingTier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackagePricingTier" (id, name, "minItems", "maxItems", "pricePerItem", "totalPrice", "isActive", "order", "createdAt") FROM stdin;
cmmy4emvg0000kvd70ylhg1hb	Pack x10	10	10	300	3000	t	1	2026-03-19 23:47:52.78
\.


--
-- Data for Name: PackagePurchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackagePurchase" (id, "merchantId", "purchaseType", "categoryId", "productIds", "itemCount", amount, currency, "paymentStatus", "paymentMethod", "mpPreferenceId", "mpPaymentId", "mpExternalRef", "importStatus", "importedCount", "importedAt", "promoCode", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "orderId", "mpPaymentId", "mpStatus", "mpStatusDetail", amount, currency, "payerEmail", "paymentMethod", "rawPayload", "createdAt", "updatedAt") FROM stdin;
cmmjq5lhb000zqjqugyg8i599	cmmjq4pdu000pqjquqne4ez8z	1345333515	approved	accredited	7500	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129806175036, "data": {"id": "1345333515"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-09T22:00:04Z"}	2026-03-09 22:00:09.983	2026-03-09 22:00:09.983
cmmjt2ngz001dqjqu8essdcyy	cmmjt1xl90013qjquuvusvhwj	1326507530	rejected	cc_rejected_other_reason	22500	ARS	\N	credit_card	{"id": 129808657018, "data": {"id": "1326507530"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-09T23:21:48Z"}	2026-03-09 23:21:51.443	2026-03-09 23:21:51.443
cmmjt3gtf001hqjqubk4b3x4n	cmmjt1xl90013qjquuvusvhwj	1326507536	approved	accredited	22500	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129688032379, "data": {"id": "1326507536"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-09T23:22:26Z"}	2026-03-09 23:22:29.475	2026-03-09 23:22:29.475
cmmju408w00132wtgaw6nzbww	cmmju3aj0000t2wtgc0urwiyf	1326509282	approved	accredited	37500	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129688896003, "data": {"id": "1326509282"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-09T23:50:50Z"}	2026-03-09 23:50:54.273	2026-03-09 23:50:54.273
cmmju8m03001h2wtg8d5v3df4	cmmju7u2900172wtgq7k80ztj	1326507804	approved	accredited	7500	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129809664344, "data": {"id": "1326507804"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-09T23:54:25Z"}	2026-03-09 23:54:29.092	2026-03-09 23:54:29.092
cmmjucmpi000ec82w63czyxmm	cmmjubodi0004c82wpyrce2eh	1326509324	approved	accredited	11000	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129689060739, "data": {"id": "1326509324"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-09T23:57:33Z"}	2026-03-09 23:57:36.631	2026-03-09 23:57:36.631
cmmjuwkck000d9b3gokho5tm5	cmmjuvxb400039b3g0awpn9q2	1326509448	approved	accredited	5500	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129689421811, "data": {"id": "1326509448"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-10T00:13:03Z"}	2026-03-10 00:13:06.692	2026-03-10 00:13:06.692
cmmjxt3nu000e9g05hkd13kq3	cmmjxsel200049g05uqzedyyr	1326510022	approved	accredited	27500	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129691520755, "data": {"id": "1326510022"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-10T01:34:20Z"}	2026-03-10 01:34:23.946	2026-03-10 01:34:23.946
cmmkmw83j000cuexnvot8gx2i	cmmkmv9b60002uexnjzhmthp4	1326511454	approved	accredited	150000	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129701500531, "data": {"id": "1326511454"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-10T13:16:37Z"}	2026-03-10 13:16:40.063	2026-03-10 13:16:40.063
cmmpb8v6w000rek19ilflrrj9	cmmpb84hn000hek19csh5pqz9	1326564220	approved	accredited	30895	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129799034787, "data": {"id": "1326564220"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-13T19:49:21Z"}	2026-03-13 19:49:25.352	2026-03-13 19:49:25.352
cmmpo0l64000uek194t5nf4nd	cmmp92tsx000g148u0eoa5u7z	1326563108	approved	accredited	39395	ARS	test_user_80507629@testuser.com	credit_card	{"id": 129809357199, "data": {"id": "1326563108"}, "type": "payment", "action": "payment.created", "user_id": "40783970", "live_mode": false, "api_version": "v1", "date_created": "2026-03-13T18:49:11Z"}	2026-03-14 01:46:54.123	2026-03-14 01:46:54.123
\.


--
-- Data for Name: PendingAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PendingAssignment" (id, "orderId", "currentDriverId", "attemptNumber", "expiresAt", status, "createdAt", "updatedAt") FROM stdin;
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
cmlcf8ass000en1z3fhxjv68f	cmlbofjvu0002mqdpmdns2wmk	cmlcf8aoz0009n1z3kfdaga3x	EARN	5000	5000	Ganaste 5000 puntos por tu compra	2026-02-07 14:40:14.765
cmlcf8avh000hn1z33i4w2mm9	cmlbofjvu0002mqdpmdns2wmk	cmlcf8aoz0009n1z3kfdaga3x	BONUS	250	5250	???? ??Bono de bienvenida activado!	2026-02-07 14:40:14.861
cmlchajvg0008y7eqru6xh7li	cmlbofjvu0002mqdpmdns2wmk	cmlchajgh0003y7eqn8kh7p4c	EARN	5500	10750	Ganaste 5500 puntos por tu compra	2026-02-07 15:37:59.067
cmld6tv2k0008142vf6oq43cz	cmlbofjvu0002mqdpmdns2wmk	cmld6tuz90003142vg3e3nr6b	EARN	5500	16250	Ganaste 5500 puntos por tu compra	2026-02-08 03:32:50.444
cmld7d0ay0008k5e2xo0j64kt	cmlbofjvu0002mqdpmdns2wmk	cmld7d08s0003k5e2fkvjq69j	EARN	5000	21250	Ganaste 5000 puntos por tu compra	2026-02-08 03:47:43.691
cmld8067100086bogl3u3qqhe	cmlbofjvu0002mqdpmdns2wmk	cmld805ul00036bogt2zjm7i5	EARN	5000	26250	Ganaste 5000 puntos por tu compra	2026-02-08 04:05:44.413
cmld85kyj000h6bogigdioqtl	cmlbofjvu0002mqdpmdns2wmk	cmld85kx6000c6bogl8knjs4q	EARN	5000	31250	Ganaste 5000 puntos por tu compra	2026-02-08 04:09:56.827
cmld8b7p7000q6bogrjt72y7y	cmlbofjvu0002mqdpmdns2wmk	cmld8b7nl000l6bog0j1o7iu7	EARN	5500	36750	Ganaste 5500 puntos por tu compra	2026-02-08 04:14:19.579
cmld8fhwz000z6bogzu0gyhgk	cmlbofjvu0002mqdpmdns2wmk	cmld8fhv5000u6bogoi0fw1g2	EARN	5500	42250	Ganaste 5500 puntos por tu compra	2026-02-08 04:17:39.443
cmld8y3of0008vk3j28v4pnq7	cmlbofjvu0002mqdpmdns2wmk	cmld8y3lr0003vk3jaqffbx5f	EARN	5500	47750	Ganaste 5500 puntos por tu compra	2026-02-08 04:32:07.456
cmld9jsb10008zm5o35k3ea7g	cmlbofjvu0002mqdpmdns2wmk	cmld9js9l0003zm5oqx2o93go	EARN	5500	53250	Ganaste 5500 puntos por tu compra	2026-02-08 04:48:59.149
cmld9zrhw0008eba1nii9ua6c	cmlbofjvu0002mqdpmdns2wmk	cmld9zrfv0003eba1d9k8ksn8	EARN	5500	58750	Ganaste 5500 puntos por tu compra	2026-02-08 05:01:24.596
cmlda8e8a0008qasdpv4sxuvk	cmlbofjvu0002mqdpmdns2wmk	cmlda8e6l0003qasdm8tvsjrk	EARN	5500	64250	Ganaste 5500 puntos por tu compra	2026-02-08 05:08:07.306
cmldakml7000hqasdxiawrmro	cmlbofjvu0002mqdpmdns2wmk	cmldakmjh000cqasdpdwddd1e	EARN	5500	69750	Ganaste 5500 puntos por tu compra	2026-02-08 05:17:38.01
cmldauwct000qqasd6gosqrq1	cmlbofjvu0002mqdpmdns2wmk	cmldauwau000lqasd5dxxpzsa	EARN	5000	74750	Ganaste 5000 puntos por tu compra	2026-02-08 05:25:37.23
cmldb3gu70008ml0qk4fo61th	cmlbofjvu0002mqdpmdns2wmk	cmldb3gsm0003ml0q488oj7xk	EARN	5500	80250	Ganaste 5500 puntos por tu compra	2026-02-08 05:32:17.024
cmldbgdmv000hml0qi19elm9t	cmlbofjvu0002mqdpmdns2wmk	cmldbgdlc000cml0qmqqa4slj	EARN	5500	85750	Ganaste 5500 puntos por tu compra	2026-02-08 05:42:19.399
cmlehunuw000bhsib3cpi27ho	cmlbofjvu0002mqdpmdns2wmk	cmlehunul0006hsibtxg3pui8	EARN	5000	90750	Ganaste 5000 puntos por tu compra	2026-02-09 01:29:09.704
cmlej4cdt000dwel8cax5rwte	cmlbofjvu0002mqdpmdns2wmk	cmlej4cde0008wel8fmvtwfo1	EARN	5000	95750	Ganaste 5000 puntos por tu compra	2026-02-09 02:04:41.009
cmlh7mday000d57g203tqvz0y	cmlbofjvu0002mqdpmdns2wmk	cmlh7md9u000857g29h19vi7g	EARN	5000	100750	Ganaste 5000 puntos por tu compra	2026-02-10 23:06:05.146
cmlh7p3y8000n57g2c0n0zvjt	cmlbofjvu0002mqdpmdns2wmk	cmlh7p3la000i57g28ij29w1u	EARN	5000	105750	Ganaste 5000 puntos por tu compra	2026-02-10 23:08:12.992
cmlh7ro9u0009h90lx8irue0f	cmlbofjvu0002mqdpmdns2wmk	cmlh7ro8y0004h90l1z1568vl	EARN	5000	110750	Ganaste 5000 puntos por tu compra	2026-02-10 23:10:12.642
cmlh80fwx0009ljt270mygz2a	cmlbofjvu0002mqdpmdns2wmk	cmlh80fw20004ljt24xvjrupg	EARN	5000	115750	Ganaste 5000 puntos por tu compra	2026-02-10 23:17:01.713
cmlh8dvrp0009118zmo9b49qu	cmlbofjvu0002mqdpmdns2wmk	cmlh8dvr30004118zljbhq35i	EARN	5000	120750	Ganaste 5000 puntos por tu compra	2026-02-10 23:27:28.789
cmlh8lqdr000i118zljwj7jz8	cmlbofjvu0002mqdpmdns2wmk	cmlh8lqcu000d118z52zga4uw	EARN	7500	128250	Ganaste 7500 puntos por tu compra	2026-02-10 23:33:35.056
cmlh976uv000s118z2u2pbl9x	cmlbofjvu0002mqdpmdns2wmk	cmlh976u1000n118zi5vy0czv	EARN	7500	135750	Ganaste 7500 puntos por tu compra	2026-02-10 23:50:16.184
cmll7nbq3000881hqpgh1tzec	cmkvbvo8c002dr0gk22kda2cw	cmll7nbp0000381hq1vqyvwr9	EARN	5500	10500	Ganaste 5500 puntos por tu compra	2026-02-13 18:17:54.46
cmlllpkde000axm589i2za11v	cmlbofjvu0002mqdpmdns2wmk	cmlllpkc10005xm58ty8kfgo9	EARN	2700	138450	Ganaste 2700 puntos por tu compra	2026-02-14 00:51:33.602
cmllx29vk00097ebea16a6zp5	cmkvbvo87002br0gkyyz8i0cs	cmllx29um00047ebe815rghio	EARN	5500	58400	Ganaste 5500 puntos por tu compra	2026-02-14 06:09:22.305
cmlpb83hv00092494e0nr4b7e	cmkvbvo87002br0gkyyz8i0cs	cmlpb836y00042494e95414ok	EARN	5500	63900	Ganaste 5500 puntos por tu compra	2026-02-16 15:09:07.123
cmlplppo6000813mzrqs2f11z	cmkvbvo87002br0gkyyz8i0cs	cmlplppli000313mzusgf0iv0	EARN	5500	69400	Ganaste 5500 puntos por tu compra	2026-02-16 20:02:45.174
cmlplqt9g000h13mzo4sr8jgr	cmkvbvo87002br0gkyyz8i0cs	cmlplqsyn000c13mz4zcy57pz	EARN	5500	74900	Ganaste 5500 puntos por tu compra	2026-02-16 20:03:36.485
cmm4vfls2000chhwzut0brqrc	cmkvbvo87002br0gkyyz8i0cs	cmm4vflql0007hhwz0hpm20w2	EARN	7500	82400	Ganaste 7500 puntos por tu compra	2026-02-27 12:31:22.371
cmm509gmg000lhhwz4ihgpdpf	cmkvbvo87002br0gkyyz8i0cs	cmm509g3i000ghhwz6rpafd5g	EARN	7500	89900	Ganaste 7500 puntos por tu compra	2026-02-27 14:46:33.832
cmm50bnn7000uhhwz713x5rj1	cmkvbvo87002br0gkyyz8i0cs	cmm50bnlx000phhwzp0gavi4w	EARN	7500	97400	Ganaste 7500 puntos por tu compra	2026-02-27 14:48:16.244
cmm50cjcz0013hhwzwazmjl9h	cmkvbvo87002br0gkyyz8i0cs	cmm50cja8000yhhwzfoxfjbja	EARN	5500	102900	Ganaste 5500 puntos por tu compra	2026-02-27 14:48:57.348
cmm50el2m001chhwzr4y5s024	cmkvbvo87002br0gkyyz8i0cs	cmm50el1h0017hhwz0apjomes	EARN	5500	108400	Ganaste 5500 puntos por tu compra	2026-02-27 14:50:32.879
cmm55nms20007tgn8kwnpuo6g	cmkvbvo87002br0gkyyz8i0cs	cmm55nmj50002tgn808kguji8	EARN	2700	111100	Ganaste 2700 puntos por tu compra	2026-02-27 17:17:33.074
cmmh3ilo3000efri2uh8im2c1	cmmccgicu0002lw51r2qy0lcr	cmmh3illw0007fri2mop7wxp3	EARN	7500	7500	Ganaste 7500 puntos por tu compra	2026-03-08 01:50:53.236
cmmh3ilos000hfri2dkq3d2kg	cmmccgicu0002lw51r2qy0lcr	cmmh3illw0007fri2mop7wxp3	BONUS	100	7600	≡ƒÄë ┬íBono de bienvenida activado!	2026-03-08 01:50:53.261
cmmh3mnqw000sfri28817yt24	cmmccgicu0002lw51r2qy0lcr	cmmh3mnlk000lfri2ih7hck7b	EARN	5500	13100	Ganaste 5500 puntos por tu compra	2026-03-08 01:54:02.553
cmmh3s5590013fri2dik4c16y	cmmccgicu0002lw51r2qy0lcr	cmmh3s53z000wfri23hrqhxyq	EARN	7500	20600	Ganaste 7500 puntos por tu compra	2026-03-08 01:58:18.381
cmmh3zv0x001efri2rxgim86g	cmmccgicu0002lw51r2qy0lcr	cmmh3zuvt0017fri2owxfqh9g	EARN	7500	28100	Ganaste 7500 puntos por tu compra	2026-03-08 02:04:18.514
cmmh46jch001pfri2r9p8wnqs	cmmccgicu0002lw51r2qy0lcr	cmmh46jaz001ifri2xv3o3kdq	EARN	5500	33600	Ganaste 5500 puntos por tu compra	2026-03-08 02:09:29.969
cmmh48g4h0020fri2e5fy2lj2	cmmccgicu0002lw51r2qy0lcr	cmmh48g39001tfri20cvyj4tq	EARN	5500	39100	Ganaste 5500 puntos por tu compra	2026-03-08 02:10:59.106
cmmhvg9wo000akwe0o4a15nnj	cmmccgicu0002lw51r2qy0lcr	cmmhvg9do0003kwe098uvdqb3	EARN	5500	44600	Ganaste 5500 puntos por tu compra	2026-03-08 14:52:53.929
cmmi68edf000ai694sl8xfute	cmmccgicu0002lw51r2qy0lcr	cmmi68e860003i694ypol6vno	EARN	5000	49600	Ganaste 5000 puntos por tu compra	2026-03-08 19:54:42.243
cmmi68t2a000mi6949hs4th4u	cmmccgicu0002lw51r2qy0lcr	cmmi68t1e000fi6946bx2jmem	EARN	15000	64600	Ganaste 15000 puntos por tu compra	2026-03-08 19:55:01.282
cmmi6j7lp000yi694j3actd9c	cmmccgicu0002lw51r2qy0lcr	cmmi6j7kg000ri694vobfo5ac	EARN	10000	74600	Ganaste 10000 puntos por tu compra	2026-03-08 20:03:06.685
cmmi6os9y0019i6940u7rm15h	cmmccgicu0002lw51r2qy0lcr	cmmi6os8k0012i694hrat70ko	EARN	5500	80100	Ganaste 5500 puntos por tu compra	2026-03-08 20:07:26.758
cmmi6s72j001li6949d8nbfrc	cmmccgicu0002lw51r2qy0lcr	cmmi6s70b001ei694w8wrbz0a	EARN	15000	95100	Ganaste 15000 puntos por tu compra	2026-03-08 20:10:05.9
cmmi8pt1l001wi694amdzljo0	cmlbofjvu0002mqdpmdns2wmk	cmmi8pt08001pi694m5ep0zgb	EARN	5500	143950	Ganaste 5500 puntos por tu compra	2026-03-08 21:04:13.641
cmmi8q6sh0027i694d0a8kmn8	cmlbofjvu0002mqdpmdns2wmk	cmmi8q6pv0020i694r7j084nz	EARN	5500	149450	Ganaste 5500 puntos por tu compra	2026-03-08 21:04:31.457
cmmi8vm7u002ji694p78g3cxc	cmmccgicu0002lw51r2qy0lcr	cmmi8vm6w002ci694vc0su6wl	EARN	15000	110100	Ganaste 15000 puntos por tu compra	2026-03-08 21:08:44.73
cmmi8wqjw002ui694t89z5e3t	cmlbofjvu0002mqdpmdns2wmk	cmmi8wqht002ni694r0tgzntl	EARN	5500	154950	Ganaste 5500 puntos por tu compra	2026-03-08 21:09:37.004
cmmi8xg510035i6948u5rw1fc	cmlbofjvu0002mqdpmdns2wmk	cmmi8xg48002yi694ak2683jo	EARN	5500	160450	Ganaste 5500 puntos por tu compra	2026-03-08 21:10:10.165
cmmi986o6000atszv4cpqebzp	cmmccgicu0002lw51r2qy0lcr	cmmi986mh0003tszvezfaz15c	EARN	16500	126600	Ganaste 16500 puntos por tu compra	2026-03-08 21:18:31.11
cmmi986x2000ktszvxh902c8z	cmlbofjvu0002mqdpmdns2wmk	cmmi986vh000dtszv7cwx3z3t	EARN	5500	165950	Ganaste 5500 puntos por tu compra	2026-03-08 21:18:31.43
cmmi99luo000xtszvcbxvfn02	cmlbofjvu0002mqdpmdns2wmk	cmmi99ltp000qtszv7jmf7rtn	EARN	5500	171450	Ganaste 5500 puntos por tu compra	2026-03-08 21:19:37.44
cmmi9eva1001atszvhgihc2gx	cmmccgicu0002lw51r2qy0lcr	cmmi9ev8o0013tszv905wbc51	EARN	15000	141600	Ganaste 15000 puntos por tu compra	2026-03-08 21:23:42.937
cmmi9gaxy001ltszvuxzorckv	cmmccgicu0002lw51r2qy0lcr	cmmi9gax4001etszv2jmvbwqn	EARN	5500	147100	Ganaste 5500 puntos por tu compra	2026-03-08 21:24:49.895
cmmi9pc60001wtszvylrjvp8b	cmmccgicu0002lw51r2qy0lcr	cmmi9pc46001ptszvf3yrf3p2	EARN	5500	152600	Ganaste 5500 puntos por tu compra	2026-03-08 21:31:51.384
cmmia7bmh0027tszvqsahyco5	cmmccgicu0002lw51r2qy0lcr	cmmia7bl50020tszvif0zjp90	EARN	5500	158100	Ganaste 5500 puntos por tu compra	2026-03-08 21:45:50.489
cmmiafao5002jtszv5swl4hcr	cmmccgicu0002lw51r2qy0lcr	cmmiafamt002ctszv3rzwtaw7	EARN	16500	174600	Ganaste 16500 puntos por tu compra	2026-03-08 21:52:02.501
cmmib8mjc0009xdlkkmcx8u0n	cmmccgicu0002lw51r2qy0lcr	cmmib8meh0002xdlk0f0r7by2	EARN	5500	180100	Ganaste 5500 puntos por tu compra	2026-03-08 22:14:50.904
cmmib9n14000lxdlkbbalzyy1	cmlbofjvu0002mqdpmdns2wmk	cmmib9n01000exdlkgm5x9yf1	EARN	2700	174150	Ganaste 2700 puntos por tu compra	2026-03-08 22:15:38.201
cmmibafdg0010xdlk5emi3st5	cmmccgicu0002lw51r2qy0lcr	cmmibafax000txdlkgdytpoo5	EARN	5500	185600	Ganaste 5500 puntos por tu compra	2026-03-08 22:16:14.933
cmmj7h4j3000btzd253pntyl5	cmmccgicu0002lw51r2qy0lcr	cmmj7h4eq0004tzd2q7g06zav	EARN	15000	200600	Ganaste 15000 puntos por tu compra	2026-03-09 13:17:15.184
cmmjgt7av000bvqe4mukgkuir	cmmccgicu0002lw51r2qy0lcr	cmmjgt78o0004vqe43py8xwsu	EARN	22500	223100	Ganaste 22500 puntos por tu compra	2026-03-09 17:38:35.191
cmmjhduid000pvqe4ne1l9ymj	cmmccgicu0002lw51r2qy0lcr	cmmjhdugn000ivqe4ylixlqjc	EARN	5000	228100	Ganaste 5000 puntos por tu compra	2026-03-09 17:54:38.389
cmmjhg4vq0011vqe4nzohdzyg	cmmccgicu0002lw51r2qy0lcr	cmmjhg4ub000uvqe4931iubcs	EARN	15000	243100	Ganaste 15000 puntos por tu compra	2026-03-09 17:56:25.143
cmmjmek23000a13h6pibw5mqi	cmmccgicu0002lw51r2qy0lcr	cmmjmejzt000313h69pv3bb2e	EARN	5500	248600	Ganaste 5500 puntos por tu compra	2026-03-09 20:15:09.58
cmmjnggbd000m13h6k8aciov6	cmmccgicu0002lw51r2qy0lcr	cmmjngga7000f13h6q00mzd4k	EARN	11000	259600	Ganaste 11000 puntos por tu compra	2026-03-09 20:44:37.657
cmmjnilow000x13h6o2biwnn1	cmmccgicu0002lw51r2qy0lcr	cmmjnillx000q13h6ohyn3f00	EARN	11000	270600	Ganaste 11000 puntos por tu compra	2026-03-09 20:46:17.936
cmmjnpm6j001813h6nfjg7ibh	cmmccgicu0002lw51r2qy0lcr	cmmjnpm4z001113h6rlkebpb5	EARN	11000	281600	Ganaste 11000 puntos por tu compra	2026-03-09 20:51:45.164
cmmjnv4xs001k13h6fdkb7w7c	cmmccgicu0002lw51r2qy0lcr	cmmjnv4w7001d13h6a0kohkmt	EARN	30000	311600	Ganaste 30000 puntos por tu compra	2026-03-09 20:56:02.752
cmmjo2mh0000a5sznwzn1j7pz	cmmccgicu0002lw51r2qy0lcr	cmmjo2mfs00035szntcqry54b	EARN	5500	317100	Ganaste 5500 puntos por tu compra	2026-03-09 21:01:52.068
cmmjonk5y000ee4tpvnnp8msv	cmmccgicu0002lw51r2qy0lcr	cmmjonk4d0005e4tps7bjklqf	EARN	24000	341100	Ganaste 24000 puntos por tu compra	2026-03-09 21:18:08.854
cmmjotfhg000bcp9jhammh5zq	cmmccgicu0002lw51r2qy0lcr	cmmjotffg0004cp9j58hl5r1o	EARN	22500	363600	Ganaste 22500 puntos por tu compra	2026-03-09 21:22:42.724
cmmjpb9qc000alcz4vfa8f7ks	cmmccgicu0002lw51r2qy0lcr	cmmjpb9o60003lcz4uah18rmw	EARN	5500	369100	Ganaste 5500 puntos por tu compra	2026-03-09 21:36:35.077
cmmjpve4h000aqjqubcvyr4pv	cmmccgicu0002lw51r2qy0lcr	cmmjpve2i0003qjqu6f5qgwws	EARN	7500	376600	Ganaste 7500 puntos por tu compra	2026-03-09 21:52:13.889
cmmjpxp4q000lqjqu2bwhs6qs	cmmccgicu0002lw51r2qy0lcr	cmmjpxp3e000eqjqu27tj55va	EARN	5500	382100	Ganaste 5500 puntos por tu compra	2026-03-09 21:54:01.466
cmmjq4pfn000wqjqu9iuefmdn	cmmccgicu0002lw51r2qy0lcr	cmmjq4pdu000pqjquqne4ez8z	EARN	7500	389600	Ganaste 7500 puntos por tu compra	2026-03-09 21:59:28.452
cmmjt1xmt001aqjqu8tst7ezf	cmmccgicu0002lw51r2qy0lcr	cmmjt1xl90013qjquuvusvhwj	EARN	22500	412100	Ganaste 22500 puntos por tu compra	2026-03-09 23:21:17.957
cmmju1iyt000c2wtg3fg8oans	cmmccgicu0002lw51r2qy0lcr	cmmju1iwe00052wtg1522vv6t	EARN	10000	422100	Ganaste 10000 puntos por tu compra	2026-03-09 23:48:58.565
cmmju1wpx000o2wtgwpluvd3m	cmmccgicu0002lw51r2qy0lcr	cmmju1wl1000h2wtgyyhnryw8	EARN	22500	444600	Ganaste 22500 puntos por tu compra	2026-03-09 23:49:16.39
cmmju3ak700102wtgm3b236rf	cmmccgicu0002lw51r2qy0lcr	cmmju3aj0000t2wtgc0urwiyf	EARN	37500	482100	Ganaste 37500 puntos por tu compra	2026-03-09 23:50:20.983
cmmju7u4c001e2wtg3u05idej	cmmccgicu0002lw51r2qy0lcr	cmmju7u2900172wtgq7k80ztj	EARN	7500	489600	Ganaste 7500 puntos por tu compra	2026-03-09 23:53:52.956
cmmjuboga000bc82wiy5wz0xp	cmmccgicu0002lw51r2qy0lcr	cmmjubodi0004c82wpyrce2eh	EARN	11000	500600	Ganaste 11000 puntos por tu compra	2026-03-09 23:56:52.235
cmmjuvxcz000a9b3ghoh64z1x	cmmccgicu0002lw51r2qy0lcr	cmmjuvxb400039b3g0awpn9q2	EARN	5500	506100	Ganaste 5500 puntos por tu compra	2026-03-10 00:12:36.899
cmmjxseot000b9g058koo7s43	cmmccgicu0002lw51r2qy0lcr	cmmjxsel200049g05uqzedyyr	EARN	27500	533600	Ganaste 27500 puntos por tu compra	2026-03-10 01:33:51.581
cmmkmv9do0009uexn5stxaw3w	cmmccgicu0002lw51r2qy0lcr	cmmkmv9b60002uexnjzhmthp4	EARN	150000	683600	Ganaste 150000 puntos por tu compra	2026-03-10 13:15:55.069
cmmknp3vr000gnmo1r4x7d9ha	cmmccgicu0002lw51r2qy0lcr	cmmknp3lk0009nmo1pq62hkyy	EARN	5500	689100	Ganaste 5500 puntos por tu compra	2026-03-10 13:39:07.623
cmmp90pop000b148u9qjio4nr	cmmccgicu0002lw51r2qy0lcr	cmmp90pm40004148upedkvg87	EARN	27500	716600	Ganaste 27500 puntos por tu compra	2026-03-13 18:47:05.738
cmmp92tui000n148u8lo6tvco	cmmccgicu0002lw51r2qy0lcr	cmmp92tsx000g148u0eoa5u7z	EARN	38500	755100	Ganaste 38500 puntos por tu compra	2026-03-13 18:48:44.442
cmmpb6o45000cek19r267ceyt	cmmccgicu0002lw51r2qy0lcr	cmmpb6o150005ek194ozksuha	EARN	5000	760100	Ganaste 5000 puntos por tu compra	2026-03-13 19:47:42.869
cmmpb84ik000oek19scx6en4c	cmmccgicu0002lw51r2qy0lcr	cmmpb84hn000hek19csh5pqz9	EARN	30000	790100	Ganaste 30000 puntos por tu compra	2026-03-13 19:48:50.781
cmmtyvdxr0009l01q9k16rqdk	cmmccgicu0002lw51r2qy0lcr	cmmtyvduq0002l01qzhv4xsxd	EARN	150000	940100	Ganaste 150000 puntos por tu compra	2026-03-17 02:01:51.952
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "createdAt", "updatedAt", "packageCategoryId") FROM stdin;
cmkvbvo5s0012r0gknilcgfre	Pizza Pepperoni	comercio-2-pizza-pepperoni	\N	cmkvbvo5b000ur0gk0eib5xpt	7000	4200	100	5	t	f	2026-01-26 15:34:21.712	2026-01-26 15:34:21.712	\N
cmkvbvo650018r0gkp96zwmxm	Pizza 4 Quesos	comercio-2-pizza-4-quesos	\N	cmkvbvo5b000ur0gk0eib5xpt	7500	4500	100	5	t	f	2026-01-26 15:34:21.725	2026-01-26 15:34:21.725	\N
cmkvbvo6n001ir0gkd49h1c39	Roll California	comercio-3-roll-california	\N	cmkvbvo6k001gr0gknt85jfb9	4500	2700	100	5	t	f	2026-01-26 15:34:21.743	2026-01-26 15:34:21.743	\N
cmkvbvo76001ur0gk6sv6o03m	Combo 30 piezas	comercio-3-combo-30-piezas	\N	cmkvbvo6k001gr0gknt85jfb9	12000	7200	100	5	t	f	2026-01-26 15:34:21.762	2026-01-26 15:34:21.762	\N
cmkvbvo5f000wr0gkwdsxy501	Pizza Margherita	comercio-2-pizza-margherita	\N	cmkvbvo5b000ur0gk0eib5xpt	6000	3600	100	5	t	f	2026-01-26 15:34:21.699	2026-02-02 04:55:08.176	\N
cml0zowjo0039ygioqg9zzfwy	INMORTAL	inmortal-23xop	2 Fernet 750ml + 4 Coca-Colca 2.25lts + 4 Hielo 2kg + 2 Sprite 2.25 + 1 Gancia 950ml + 2 Citric 1lt + 2 Papas Lays 234gr + 2 Pack x6 Budweiser + 8 Speed + 2 Smirnoff + 1 Campari	\N	144900	0	0	5	t	f	2026-01-30 14:39:47.653	2026-02-02 04:46:05.46	\N
cml0zow4q0002ygio1z3yvt0a	COMBO CAMPARI	combo-campari-u5htv	INCLUYE: 1 Campari 1lt. + 2 Jugos Citric 1L + 1 Hielo 2Kg	\N	23900	0	0	5	t	f	2026-01-30 14:39:47.113	2026-02-02 04:46:05.46	\N
cml0zowle003eygio2lvjmvh5	Cepita Naranja 1.5L	cepita-naranja-1-5l-r21co	Tamao: 1.5L - Sabor: Naranja	\N	0	0	0	5	t	f	2026-01-30 14:39:47.715	2026-02-05 15:19:54.638	\N
cml0zox4n008eygioznyef44n	Grolsch 473	grolsch-473-3p50o	Tamao: 473ml	\N	2600	0	0	5	t	f	2026-01-30 14:39:48.407	2026-02-05 15:23:43.406	\N
cml4byqzb000o7c7e8hie5vrz	Santa Julia Tardo 	santa-julia-tard-o-ymuzp-cmkvb	Vino dulce natural de cosecha tarda. Presenta aromas intensos a miel, flores blancas y frutas tropicales maduras. En boca es untuoso, con buena acidez que equilibra su dulzura, ideal para acompaar postres, quesos azules o disfrutar solo como vino de sobremesa. / 500ml	cmkvbvo5b000ur0gk0eib5xpt	7000	0	100	5	t	f	2026-02-01 22:46:40.919	2026-02-04 16:09:55.053	\N
cml4byrgm00147c7e88j2quw8	PRIME x3 - Ultra Fino	prime-x3-ultra-fino-1qxtg-cmkvb	Diseado para mxima sensibilidad sin perder proteccin.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	100	5	t	f	2026-02-01 22:46:41.543	2026-02-04 16:09:55.066	\N
cml0zown8003oygiot5n7mxeu	Fernet Branca 1L	fernet-branca-1l-ds4uw	Tamao: 1L	\N	15800	0	0	5	t	f	2026-01-30 14:39:47.78	2026-02-04 16:09:55.079	\N
cml0zowns003tygiovi25qjmj	Fernet Branca 450ml	fernet-branca-450ml-dyye5	Tamao: 450ml	\N	7800	0	0	5	t	f	2026-01-30 14:39:47.8	2026-02-04 16:09:55.081	\N
cml0zowo9003yygio9oge7o70	Aquarius Manzana 2.25L	aquarius-manzana-2-25l-60ro3	Tamao: 2.25L - Sabor: Manzana	\N	0	0	0	5	t	f	2026-01-30 14:39:47.817	2026-02-05 15:18:30.267	\N
cml0zowmr003jygioz946gzop	Aquarius Manzana 1.5L	aquarius-manzana-1-5l-s8pzr	Tamao: 1.5L - Sabor: Manzana	\N	0	0	0	5	t	f	2026-01-30 14:39:47.763	2026-02-05 15:19:41.929	\N
cml0zow5p0007ygio5orv9auu	COMBO HEINEKEN	combo-heineken-72nho	INCLUYE: 2 Packs Heineken x6 473ml (12u) + 1 Papas Lays 234gr	\N	45900	0	0	5	t	f	2026-01-30 14:39:47.15	2026-02-02 04:46:05.46	\N
cml0zow75000mygiogcrr8zbt	Hielo	hielo-edowg	Peso: 2Kg	\N	2800	0	8	5	t	f	2026-01-30 14:39:47.201	2026-02-02 04:46:05.46	\N
cml0zow80000wygio5p7qiekz	Mani King	mani-king-6a3c4	Peso: 350gr	\N	3400	0	0	5	t	f	2026-01-30 14:39:47.232	2026-02-02 04:46:05.46	\N
cml0zowdh001lygioya8h5i2e	Beagle GOLDEN ALE	beagle-golden-ale-pro8q	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.429	2026-02-02 04:46:05.46	\N
cml0zowe0001qygio6770tgax	Beagle IPA	beagle-ipa-4ii91	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.448	2026-02-02 04:46:05.46	\N
cml0zowfz002aygiojnu5ohfc	Snickers	snickers-ipbq6	Peso: 48gr	\N	2700	0	0	5	t	f	2026-01-30 14:39:47.52	2026-02-02 04:46:05.46	\N
cml0zowgd002fygio0lfk2i5a	Beldent	beldent-a1y54	Tipo: Chicle Sabor: Menta	\N	800	0	0	5	t	f	2026-01-30 14:39:47.533	2026-02-02 04:46:05.46	\N
cml0zowgp002kygioovdzms2z	COMBO GANCIA	combo-gancia-6drif	INCLUYE: 1 Gancia 950ml + 2 Sprite 2.25lts + 1 Hielo 2kg	\N	23900	0	0	5	t	f	2026-01-30 14:39:47.545	2026-02-02 04:46:05.46	\N
cml0zowh0002pygioxd363dfm	COMBO SMIRNOFF I	combo-smirnoff-i-axmqm	INCLUYE: 1 Smirnoff + 2 Jugo Citric Naranja + 1 Hielo 2kg	\N	21900	0	0	5	t	f	2026-01-30 14:39:47.556	2026-02-02 04:46:05.46	\N
cml0zowhc002uygio6f32lu5f	COMBO SMIRNOF II	combo-smirnof-ii-0pojt	INCLUYE: 1 Smirnoff + 6 Speed + 1 Hielo 2kg	\N	22900	0	0	5	t	f	2026-01-30 14:39:47.569	2026-02-02 04:46:05.46	\N
cml0zowhp002zygio7dlj16vo	ESTALLIDO	estallido-t5a1o	1 Fernet 750ml + 1 Coca-Colca 2.25lts + 2 Hielo 2kg + 1 Sprite 2.25 + 1 Gancia 950ml + 1 Citric 1lt + 1 Papas Lays 234gr	\N	52900	0	0	5	t	f	2026-01-30 14:39:47.582	2026-02-02 04:46:05.46	\N
cml0zowie0034ygiof9mv6db3	DESCONTROL	descontrol-akrna	1 Fernet 750ml + 2 Coca-Colca 2.25lts + 2 Hielo 2kg + 2 Sprite 2.25 + 1 Gancia 950ml + 1 Citric 1lt + 1 Papas Lays 234gr + 1 Pack x6 Budweiser + 4 Speed + 1 Smirnoff + 1 Campari + 1 Mani King 350gr	\N	92900	0	0	5	t	f	2026-01-30 14:39:47.606	2026-02-02 04:46:05.46	\N
cml0zowqu004xygio8gd5lji9	Smirnoff Saborizado	smirnoff-saborizado-cr1xl	Sabor: Manzana	\N	7900	0	0	5	t	f	2026-01-30 14:39:47.911	2026-02-02 04:46:05.46	\N
cml0zowr60052ygio5vs5guko	Smirnoff Saborizado	smirnoff-saborizado-mo1f9	Sabor: Raspberry (Frambuesa)	\N	7900	0	0	5	t	f	2026-01-30 14:39:47.922	2026-02-02 04:46:05.46	\N
cml0zowxe005wygiov269jwk7	Pringles Original	pringles-original-94k27	Sabor: Original	\N	4900	0	0	5	t	f	2026-01-30 14:39:48.146	2026-02-02 04:46:05.46	\N
cml0zowxt0061ygiotw053nid	Pringles C&C	pringles-c-c-h64dd	Sabor: Crema y Cebolla	\N	4900	0	0	5	t	f	2026-01-30 14:39:48.162	2026-02-02 04:46:05.46	\N
cml0zowya0066ygiojto1x270	Pringles Cheddar	pringles-cheddar-obgel	Sabor: Cheddar	\N	4900	0	0	5	t	f	2026-01-30 14:39:48.178	2026-02-02 04:46:05.46	\N
cml0zowzt006bygioyd5qgwrz	COMBO SMIRNOFF III	combo-smirnoff-iii-c5o7g	1 Smirnoff Raspberry + 2 Jugos Cepita de Naranja + 1 Hielo 2kg	\N	22900	0	0	5	t	f	2026-01-30 14:39:48.233	2026-02-02 04:46:05.46	\N
cml0zox0p006qygiokxghthwu	Beldent Menta Fuerte	beldent-menta-fuerte-2qd4b	Tipo: Chicle Sabor: Menta Fuerte	\N	800	0	0	5	t	f	2026-01-30 14:39:48.266	2026-02-02 04:46:05.46	\N
cml0zow6p000hygiopw2vu03p	Coca-Cola Original 2.25L	coca-cola-original-2-25l-u6mpq	Sabor: Original / Tamao: 2.25L	\N	5600	0	0	5	t	f	2026-01-30 14:39:47.186	2026-02-04 16:09:55.118	\N
cml4byrg9000y7c7e678cio8s	PRIME x3 - Tachas	prime-x3-tachas-c1mad-cmkvb	Textura con puntos en relieve para un placer extremo.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	99	5	t	f	2026-02-01 22:46:41.53	2026-02-27 17:17:33.039	\N
cml0zow7k000rygio0puif8b9	Fernet Branca 750ml	fernet-branca-750ml-h56w4	Tamao: 750ml	\N	11800	0	10	5	t	f	2026-01-30 14:39:47.217	2026-02-04 16:09:55.122	\N
cml0zow9d0016ygioct95ivho	Pritty Limon	pritty-limon-ax5nn	Tamao: 3lts.	\N	3900	0	0	5	t	f	2026-01-30 14:39:47.282	2026-02-04 16:09:55.126	\N
cml0zowf30020ygiokvon5so2	Beagle RED ALE	beagle-red-ale-sn9gw	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.488	2026-02-05 15:24:13.628	\N
cmkvbvo6w001or0gkh6my0iu3	Roll Salmn	comercio-3-roll-salm-sss-sn	\N	cmkvbvo6k001gr0gknt85jfb9	5500	3300	100	5	t	f	2026-01-26 15:34:21.752	2026-03-17 13:31:53.784	\N
cml0zowb9001gygio24q9x8t6	Heineken 473ml	heineken-473ml-2kaly	Tamao: 473ml	\N	3000	0	0	5	t	f	2026-01-30 14:39:47.35	2026-02-04 16:09:55.134	\N
cml0zowfk0025ygio3h126xw8	COMBO BUDWEISER	combo-budweiser-k91af	INCLUYE: 2 Packs x6 (473ml) + Man King 350gr	\N	27900	0	0	5	t	f	2026-01-30 14:39:47.505	2026-02-04 16:09:55.139	\N
cml0zowom0043ygio6tfq2n03	Sprite 2.25L	sprite-2-25l-uzkls	Sabor: Original / Tamao: 2.25L	\N	5600	0	0	5	t	f	2026-01-30 14:39:47.83	2026-02-04 16:09:55.143	\N
cml0zowox0048ygio4b8w3urg	Fanta 2.25L	fanta-2-25l-wmo3g	Tamao: 2.25L	\N	5600	0	0	5	t	f	2026-01-30 14:39:47.842	2026-02-04 16:09:55.147	\N
cml0zowp8004dygiol581vqi1	Coca-Cola Original 1.5L	coca-cola-original-1-5l-dv91f	Sabor: Original / Tamao: 1.5L	\N	4100	0	0	5	t	f	2026-01-30 14:39:47.852	2026-02-04 16:09:55.15	\N
cml0zowq2004nygior4436bal	Coca-Cola Original 500ml	coca-cola-original-500ml-hc71q	Sabor: Original / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:47.882	2026-02-04 16:09:55.157	\N
cml0zowqh004sygioga4f4iy2	Coca-Cola ZERO 500ml 	coca-cola-zero-500ml-u5ltp	Sabor: ZERO Azcar / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:47.897	2026-02-04 16:09:55.161	\N
cml0zowrk0057ygiorb7d6oxh	Monster Energy	monster-energy-uztpg	Tamao: 473ml Sabor: Mango Loco	\N	2800	0	0	5	t	f	2026-01-30 14:39:47.936	2026-02-04 16:09:55.165	\N
cml0zowrz005cygioueghi4vl	Schweppes Agua Tnica 	schweppes-agua-t-nica-0ja4o	Sabor: Agua Tnica / Tamao: 1.5L	\N	3900	0	0	5	t	f	2026-01-30 14:39:47.951	2026-02-04 16:09:55.168	\N
cml0zowse005hygiobekdaz6j	Schweppes ZERO	schweppes-zero-5mykg	Sabor: Pomelo (ZERO Azcar) - Tamao: 1.5L	\N	3900	0	0	5	t	f	2026-01-30 14:39:47.966	2026-02-04 16:09:55.172	\N
cml0zowtg005mygiowcmp14n6	Aperol	aperol-zmfz5	Tamao: 1L / Aperitivo italiano, suave y refrescante, con notas ctricas y amargas. Ideal para Spritz	\N	9200	0	0	5	t	f	2026-01-30 14:39:48.004	2026-02-04 16:09:55.177	\N
cml0zowvn005rygioi8nffkhm	Papel OCB	papel-ocb-h8wei	OCB Premium 1 1/4 ? Papel de liar ultrafino, resistente y de combustin lenta. Ideal para una experiencia suave y uniforme.	\N	1100	0	0	5	t	f	2026-01-30 14:39:48.084	2026-02-04 16:09:55.183	\N
cml0zox0e006lygiokpyhzec3	Pack Schneider x6	pack-schneider-x6-zhrfx	Presentacin: 6 latas de 473ml	\N	18500	0	0	5	t	f	2026-01-30 14:39:48.254	2026-02-05 15:26:36.115	\N
cml0zow8g0011ygio9sfyb99t	Jugo Citric Naranja	jugo-citric-naranja-n6rb6	1lt.	\N	3800	0	0	5	t	f	2026-01-30 14:39:47.248	2026-02-05 15:20:12.511	\N
cml0zowak001bygio5h4kurkv	Pack Heineken x6	pack-heineken-x6-34mzu	Presentacin: 6 latas de 473ml	\N	17900	0	0	5	t	f	2026-01-30 14:39:47.324	2026-02-05 15:23:57.84	\N
cml0zowei001vygiodkveoc6a	Beagle CREAM STOUT	beagle-cream-stout-ie3g0	1lt.	\N	5000	0	0	5	t	f	2026-01-30 14:39:47.466	2026-02-05 15:24:27.147	\N
cml0zox04006gygio9ubnror0	Schneider 710	schneider-710-9cesa	Tamao: 710ml	\N	3100	0	7	5	t	f	2026-01-30 14:39:48.244	2026-02-05 15:24:43.738	\N
cml0zox11006vygioa94dtj8p	Dr. Lemon Mojito	dr-lemon-mojito-wfy1f	Dr. Lemon 1L / Sabor: Mojito	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.277	2026-02-02 04:46:05.46	\N
cml0zox8d009xygioncst3s0p	Cadbury Yoghurt Frutilla	cadbury-yoghurt-frutilla-9ahno	Chocolate con relleno cremoso de yogur y frutilla. Dulce y fresco en cada mordida.	\N	4400	0	0	5	t	f	2026-01-30 14:39:48.541	2026-02-02 04:46:05.46	\N
cml0zox3x0084ygioltkcm1lw	PRIME x3 - Tachas	prime-x3-tachas-c1mad	Textura con puntos en relieve para un placer extremo.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.381	2026-02-02 04:46:05.46	\N
cml0zox1n0075ygiodagb9vrs	Dr. Lemon Limn	dr-lemon-lim-n-yocv9	Dr. Lemon 1L / Sabor: Limn	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.3	2026-02-04 16:09:55.237	\N
cml0zox1z007aygiog2zkyy5c	Dr. Lemon Pomelo	dr-lemon-pomelo-sic0j	Tamao: 1L / Sabor: Pomelo	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.311	2026-02-04 16:09:55.241	\N
cml0zox29007fygiof4pu0iul	Dr. Lemon Red Berries	dr-lemon-red-berries-mgw2b	Tamao: 1L / Sabor: Red Berries	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.321	2026-02-04 16:09:55.244	\N
cml0zox5b008oygio4sapfs3r	Gin Aconcagua	gin-aconcagua-lzjld	Gin artesanal argentino inspirado en el Monte Aconcagua. Destilado con botnicos seleccionados como enebro, limn, coriandro y raz de regaliz, ofreciendo un perfil fresco y equilibrado. Ideal para ccteles de autor.	\N	18900	0	0	5	t	f	2026-01-30 14:39:48.432	2026-02-04 16:09:55.262	\N
cml0zox5o008tygiokfvsztne	Sprite 500ml 	sprite-500ml-o1aa7	Sabor: Limn / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:48.444	2026-02-04 16:09:55.266	\N
cml0zox5z008yygiom00r8ays	Fanta 500ml	fanta-500ml-9h3sh	Sabor: Naranja / Tamao: 500ml	\N	1800	0	0	5	t	f	2026-01-30 14:39:48.456	2026-02-04 16:09:55.27	\N
cml0zox6d0093ygioa81bx75u	Sprite 1.5L	sprite-1-5l-a6lpe	Sabor: Limn / Tamao: 1.5L	\N	4100	0	0	5	t	f	2026-01-30 14:39:48.469	2026-02-04 16:09:55.273	\N
cml0zox6p0098ygiowvsurzap	Coca-Cola ZERO 2.25L	coca-cola-zero-2-25l-5fvmy	Sabor: Zero Azcar / Tamao: 2.25	\N	5600	0	2	5	t	f	2026-01-30 14:39:48.481	2026-02-04 16:09:55.277	\N
cml0zox72009dygio38cyirwe	Coca-Cola ZERO 1.5L	coca-cola-zero-1-5l-n7wg0	Sabor: Zero Azcar / Tamao: 1.5L	\N	4100	0	0	5	t	f	2026-01-30 14:39:48.494	2026-02-04 16:09:55.281	\N
cml0zoxen00c5ygio59ae7h5l	Patagonia Amber Lager	patagonia-amber-lager-1fsxc	Cerveza mbar con maltas caramelo. Sabor suave y equilibrado, con notas tostadas y dulces, ideal para acompaar carnes y quesos. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.768	2026-02-05 15:22:24.977	\N
cml0zox7o009nygiowzm8n5yl	Skittles Original	skittles-original-853fl	Un arcoris de sabores frutales en cada bocado. Ideal para compartir o disfrutar solo.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.516	2026-02-04 16:09:55.288	\N
cml5aso2100023wnr30xn3opl	Hielo	hielo-edowg-cmkvb	Peso: 2Kg	cmkvbvo5b000ur0gk0eib5xpt	2800	0	100	5	t	f	2026-02-02 15:01:43.753	2026-02-06 16:33:59.517	\N
cml0zox81009sygio2ncmfp1d	Cofler Block con Man (170 g)	cofler-block-con-man-170-g-tbww6	Clsico chocolate con leche y trozos de man crocante. Pura energa y placer.	\N	6400	0	0	5	t	f	2026-01-30 14:39:48.529	2026-02-04 16:09:55.293	\N
cml0zox3b007uygioav0tg4yb	PRIME x3 - Super Fino	prime-x3-super-fino-elo3i	Sensacin natural, casi como no sentir nada.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.359	2026-02-04 16:09:55.296	\N
cml0zox2z007pygiobsolx9xx	PRIME x3 - Ultra Fino	prime-x3-ultra-fino-1qxtg	Diseado para mxima sensibilidad sin perder proteccin.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.347	2026-02-04 16:09:55.299	\N
cml0zox2m007kygionvlt3o8t	PRIME x3 - Extra Lubricado	prime-x3-extra-lubricado-rymvx	Ms suavidad y deslizamiento para una experiencia cmoda y segura.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.335	2026-02-04 16:09:55.302	\N
cml0zox8p00a2ygioh19l6m0b	Monster Ultra Ros (Zero Sugar)	monster-ultra-ros-zero-sugar-dakl3	Refrescante, sin azcar y con notas frutales suaves. Perfecta para mantenerte activo.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.553	2026-02-04 16:09:55.305	\N
cml0zox9200a7ygio0efcdj61	Monster Zero Ultra (Zero Sugar)	monster-zero-ultra-zero-sugar-w4kis	Ligero, ctrico y sin azcar. Energa limpia con sabor suave.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.566	2026-02-04 16:09:55.308	\N
cml0zox9h00acygiolnd64ft8	Monster Reserve White Pineapple	monster-reserve-white-pineapple-2bzaa	Extico y vibrante, con sabor a anan blanco. Potencia tropical en cada lata.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.581	2026-02-04 16:09:55.311	\N
cml0zox9u00ahygiozoemhaqh	Monster Pipeline Punch	monster-pipeline-punch-876h8	Mezcla frutal intensa con un golpe de energa. La favorita de los fanticos.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.594	2026-02-04 16:09:55.314	\N
cml0zoxa500amygionh3y1q6d	Monster Ultra Sunrise	monster-ultra-sunrise-4bcvx	Energa con un toque ctrico-naranja. Refrescante como un amanecer.	\N	2800	0	0	5	t	f	2026-01-30 14:39:48.605	2026-02-04 16:09:55.316	\N
cml0zoxah00arygioyaama0lz	Campari 1L	campari-1l-1ywoo	Clsico aperitivo italiano de sabor amargo y verstil. Infaltable en cocktails.	\N	12200	0	0	5	t	f	2026-01-30 14:39:48.617	2026-02-04 16:09:55.318	\N
cml0zoxau00awygioh4bs1cx3	Mac Baren Choice Dark #16 (30 g)	mac-baren-choice-dark-16-30-g-9xg5r	Tabaco premium de liar con un toque de vainilla oscura. Su sabor suave y aromtico lo convierte en una experiencia elegante y placentera, ideal para quienes buscan calidad y carcter en cada armado.	\N	7800	0	0	5	t	f	2026-01-30 14:39:48.63	2026-02-04 16:09:55.32	\N
cml0zoxb800b1ygioiiwxif4g	Tonking Filter Tips	tonking-filter-tips-7v6r1	Papel filtrante plegado, prctico y limpio. Brinda comodidad y evita partculas.	\N	600	0	0	5	t	f	2026-01-30 14:39:48.644	2026-02-04 16:09:55.323	\N
cml0zoxbj00b6ygiopg5m1taj	Quilmes Sin Alcohol (473 ml)	quilmes-sin-alcohol-473-ml-8auyi	Lager sin alcohol, fresca y ligera, con sabor tradicional Quilmes intacto.	\N	3000	0	0	5	t	f	2026-01-30 14:39:48.655	2026-02-05 15:22:42.626	\N
cml0zoxds00bvygio560hm6i1	Sidra 1888	sidra-1888-82pds	Sidra artesanal con equilibrio dulce-cido, notas frutales y burbujeo sutil.	\N	8500	0	0	5	t	f	2026-01-30 14:39:48.737	2026-02-04 16:09:55.327	\N
cml0zoxe600c0ygiovoegpiac	Schweppes Citrus	schweppes-citrus-6drqf	Refresco gasificado con sabor ctrico nico, mezcla equilibrada de lima, limn y pomelo. Refrescante y verstil, ideal para tomar solo o como mixer en tragos. / 1L	\N	3900	0	0	5	t	f	2026-01-30 14:39:48.75	2026-02-04 16:09:55.329	\N
cml0zoxc000bbygio75uu8yhv	Patagonia Lager del Sur	patagonia-lager-del-sur-je5tm	Lager rubia patagnica, equilibrada y refrescante. Ideal para comidas informales. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.672	2026-02-05 15:21:18.737	\N
cml0zox7c009iygiotcrj6j2m	Cepita Manzana 1.5L	cepita-manzana-1-5l-h3n0a	Sabor: Manzana / Tamao: 1.5L	\N	0	0	0	5	t	f	2026-01-30 14:39:48.504	2026-02-05 15:18:08.037	\N
cml0zox4z008jygio02is6mvc	Pack Grolsch x6 	pack-grolsch-x6-tuy39	Presentacin: 6 latas de 473ml	\N	14900	0	0	5	t	f	2026-01-30 14:39:48.419	2026-02-05 15:23:17.674	\N
cml0zoxjd00dyygioh61ksw73	TEST	test-vxtbb	Es solo una prueba	\N	1	0	0	5	t	f	2026-01-30 14:39:48.938	2026-02-02 04:46:05.46	\N
cml0zoxjs00e3ygio9a05ejwj	Internet1	internet1-awd7b	25MB Simetricos	\N	1	0	100	5	t	f	2026-01-30 14:39:48.952	2026-02-02 04:46:05.46	\N
cml0zoxk500e8ygiot97181nk	COMBO PIZZA I	combo-pizza-i-94orm	INCLUYE: 2 Pizzas + 1 Coca- Cola 2.5L + ENVIO A TODA LA CIUDAD!	\N	25900	0	6	5	t	f	2026-01-30 14:39:48.966	2026-02-02 04:46:05.46	\N
cml0zoxkx00eiygiopvf28d81	COMBO PIZZA II	combo-pizza-ii-8pwvg	INCLUYE: 2 Pizzas + 2 Shneider 710ml + ENVIO A TODA LA CIUDAD!	\N	25900	0	2	5	t	f	2026-01-30 14:39:48.993	2026-02-02 04:46:05.46	\N
cml0zoxlw00exygioqz1ixhfv	Falafel	falafel-vfyd7	Croquetas de garbazo	\N	6000	0	3	5	t	f	2026-01-30 14:39:49.028	2026-02-02 04:46:05.46	\N
cml0zox3l007zygioc3mh42x3	PRIME x3 - Mega	prime-x3-mega-ycsm6	Mayor comodidad con un ancho extra para un ajuste perfecto.	\N	2700	0	0	5	t	f	2026-01-30 14:39:48.369	2026-02-02 04:46:05.46	\N
cml4byqzx000u7c7eqibp2yi7	Santa Julia Chenin Dulce Natural	santa-julia-chenin-dulce-natural-lzdnj-cmkvb	Vino blanco dulce de color amarillo verdoso. Destaca por sus aromas a durazno blanco, damasco, hierbas frescas y toques ctricos como limn y pomelo. En boca, es suave, delicado, con equilibrio entre acidez y azcar natural, y un final untuoso. Ideal como aperitivo o para acompaar snacks, mariscos o postres ctricos.	cmkvbvo5b000ur0gk0eib5xpt	6100	0	100	5	t	f	2026-02-01 22:46:40.942	2026-02-04 16:09:55.047	\N
cml0zoxcy00blygio420b0myj	Santa Julia Chenin Dulce Natural	santa-julia-chenin-dulce-natural-lzdnj	Vino blanco dulce de color amarillo verdoso. Destaca por sus aromas a durazno blanco, damasco, hierbas frescas y toques ctricos como limn y pomelo. En boca, es suave, delicado, con equilibrio entre acidez y azcar natural, y un final untuoso. Ideal como aperitivo o para acompaar snacks, mariscos o postres ctricos.	\N	6100	0	0	5	t	f	2026-01-30 14:39:48.706	2026-02-05 15:08:25.955	\N
cml0zoxff00cfygioxzxvf05c	Patagonia 24.7 Session IPA	patagonia-24-7-session-ipa-3027e	IPA ligera de bajo alcohol (4,2%), con lpulo patagnico. Refrescante, ctrica y fcil de tomar en cualquier momento. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.795	2026-02-05 15:21:59.88	\N
cml0zoxf000caygiowbgdvncd	Patagonia Vera IPA	patagonia-vera-ipa-6uha3	New England IPA de amargor moderado y final fresco. Aromas tropicales y ctricos intensos, con cuerpo sedoso y balanceado. / Tamao: 740ml	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.781	2026-02-05 15:20:35.458	\N
cml0zoxfr00ckygiolp4urnlv	Red Bull Energy Drink 350ml	red-bull-energy-drink-350ml-vwscy	Bebida energtica con cafena y taurina, ideal para activar cuerpo y mente. / Tamao: 250ml	\N	4400	0	0	5	t	f	2026-01-30 14:39:48.807	2026-02-04 16:09:55.339	\N
cml0zoxg300cpygiokvdxmmnr	Red Bull Energy Drink 4 Pack	red-bull-energy-drink-4-pack-fapw4	Pack de 4 latas de energa instantnea con el clsico sabor Red Bull.	\N	15900	0	0	5	t	f	2026-01-30 14:39:48.819	2026-02-04 16:09:55.342	\N
cml0zoxgg00cuygio8t57k88f	Papas Lay?s Clsicas 234g	papas-lay-s-cl-sicas-234g-f1u0s	Papas fritas crocantes con sal, hechas con solo 3 ingredientes: papa, aceite y sal. / Peso: 234g	\N	6900	0	0	5	t	f	2026-01-30 14:39:48.832	2026-02-04 16:09:55.344	\N
cml0zoxh900d4ygiouyhb0xwz	Ferrero Rocher 24u	ferrero-rocher-24u-flkcq	Bombones de avellana y chocolate, envueltos en un icnico dorado, perfectos para regalar.	\N	19000	0	0	5	t	f	2026-01-30 14:39:48.861	2026-02-04 16:09:55.349	\N
cml0zoxhl00d9ygio8w4zfg5q	Filtros Gizeh Slim 6mm (150u)	filtros-gizeh-slim-6mm-150u-iisw0	Filtros slim de 6 mm, con sistema Lick & Stick para un armado prctico.	\N	2300	0	0	5	t	f	2026-01-30 14:39:48.873	2026-02-04 16:09:55.351	\N
cml0zoxhx00deygiot4ymu3zq	Stamps Filter Tips XL (50 hojas)	stamps-filter-tips-xl-50-hojas-4dfii	Filtros de cartn extra grandes para armar, resistentes y fciles de usar. Brindan mejor soporte, evitan el paso de partculas y hacen ms cmodo cada armado.	\N	1100	0	0	5	t	f	2026-01-30 14:39:48.886	2026-02-04 16:09:55.353	\N
cml0zoxib00djygio6fdcrswa	Cartas UNO	cartas-uno-ae47f	Clsico juego de cartas para 2 a 10 jugadores. Dinmico y divertido, combina colores y nmeros con cartas especiales que cambian el rumbo del juego. Ideal para todas las edades.	\N	6900	0	0	5	t	f	2026-01-30 14:39:48.899	2026-02-04 16:09:55.356	\N
cml0zoxin00doygio8ns8h67a	Jenga de Madera	jenga-de-madera-oxm01	Clsico juego de destreza y equilibrio con bloques de madera. Ideal para jugar en grupo, poner a prueba la paciencia y la precisin, diversin asegurada en cada movimiento!	\N	9900	0	0	5	t	f	2026-01-30 14:39:48.911	2026-02-04 16:09:55.358	\N
cml0zoxdc00bqygio9vxh4n01	Santa Julia Tardo 	santa-julia-tard-o-ymuzp	Vino dulce natural de cosecha tarda. Presenta aromas intensos a miel, flores blancas y frutas tropicales maduras. En boca es untuoso, con buena acidez que equilibra su dulzura, ideal para acompaar postres, quesos azules o disfrutar solo como vino de sobremesa. / 500ml	\N	7000	0	0	5	t	f	2026-01-30 14:39:48.721	2026-02-05 15:09:14.798	\N
cml0zoxcl00bgygiol97fx66b	Alma Mora Malbec	alma-mora-malbec-ryms4	Vino tinto argentino de color rojo intenso. Destaca por sus aromas a ciruelas y frutos rojos maduros, con un delicado toque de vainilla. Su sabor es carnoso, de cuerpo pleno, con final largo y equilibrado entre fruta y roble. Perfecto para acompaar carnes rojas, cordero o pato.	\N	5800	0	0	5	t	f	2026-01-30 14:39:48.694	2026-02-04 16:09:55.363	\N
cml0zoxiz00dtygiolm6z1u4v	Cartas Espaolas x50	cartas-espa-olas-x50-cu1ei	Baraja tradicional espaola, plastificada y lavable. Resistente y prctica, perfecta para juegos clsicos como Truco, Escoba o Chin Chn.	\N	5000	0	0	5	t	f	2026-01-30 14:39:48.923	2026-02-04 16:09:55.365	\N
cml0zoxkj00edygioodeptpo9	Coca-Cola Original 2.5L	coca-cola-original-2-5l-hr14d	Sabor: Original / Tamao: 2.5L	\N	5800	0	12	5	t	f	2026-01-30 14:39:48.979	2026-02-04 16:09:55.367	\N
cml0zoxl700enygion9pq2g1d	PROMO FERNET	promo-fernet-fd2dv	Incluye: 1 Fernet 750ml + 1 Coca-Cola 2.5L + 1 Hielo 2KG + ENVO A TODA LA CIUDAD!	\N	19900	0	9	5	t	f	2026-01-30 14:39:49.004	2026-02-04 16:09:55.369	\N
cml0zoxgv00czygioguxjupzm	Heineken 1L	heineken-1l-gnnkt	Cerveza lager premium de origen holands, fresca, balanceada y de calidad internacional. / Tamao: 1L	\N	4800	0	0	5	t	f	2026-01-30 14:39:48.847	2026-02-05 15:17:48.366	\N
cml4byqzr000r7c7e1teso4bl	Alma Mora Malbec	alma-mora-malbec-ryms4-cmkvb	Vino tinto argentino de color rojo intenso. Destaca por sus aromas a ciruelas y frutos rojos maduros, con un delicado toque de vainilla. Su sabor es carnoso, de cuerpo pleno, con final largo y equilibrado entre fruta y roble. Perfecto para acompaar carnes rojas, cordero o pato.	cmkvbvo5b000ur0gk0eib5xpt	5800	0	97	5	t	f	2026-02-01 22:46:40.936	2026-02-04 16:09:55.374	\N
cml0zow64000cygioah9y72ik	COMBO BALBO	combo-balbo-1ezfw	INCLUYE: 2 vinos Via De Balbo + 1 Pritty 3lts + 1 Hielo 2Kg	\N	21900	0	0	5	t	f	2026-01-30 14:39:47.165	2026-02-04 16:09:55.112	\N
cml0zowpo004iygioicsf2599	CHOCOTORTA - Porcion Individual	chocotorta-porcion-individual-j1gek	Chocotorta cremosa y deliciosa. Capas de galletitas Chocolinas, dulce de leche y queso crema. El postre argentino ms pedido, listo para disfrutar bien fro.	\N	5900	0	0	5	t	f	2026-01-30 14:39:47.869	2026-02-04 16:09:55.154	\N
cml0zox1c0070ygioteseuznh	Dr. Lemon Vodka	dr-lemon-vodka-lxcop	Tamao: 1L / Sabor: Vodka	\N	3200	0	0	5	t	f	2026-01-30 14:39:48.288	2026-02-04 16:09:55.233	\N
cml0zox4b0089ygiouy3moewv	Takis	takis-2ipci	Snack de maz enrollado con intenso sabor a aj picante y limn. Crocantes, cidos y explosivos. / Tamao: 89gr	\N	1900	0	0	5	t	f	2026-01-30 14:39:48.395	2026-02-04 16:09:55.248	\N
cml9mbzy6002lpwgoivafmptj	Heineken 1L	heineken-1l-gnnkt-cmkvb	Cerveza lager premium de origen holands, fresca, balanceada y de calidad internacional. / Tamao: 1L	cmkvbvo3z0008r0gkc7qfxplz	4800	0	100	5	t	f	2026-02-05 15:35:46.11	2026-02-05 15:35:46.11	\N
cmla0qhux000f3ivobd1ursts	Patagonia Amber Lager	patagonia-amber-lager-1fsxc-cmkvb	Cerveza mbar con maltas caramelo. Sabor suave y equilibrado, con notas tostadas y dulces, ideal para acompaar carnes y quesos. / Tamao: 740ml	cmkvbvo3z0008r0gkc7qfxplz	5000	0	100	5	t	f	2026-02-05 22:18:57.128	2026-02-05 22:18:57.128	\N
cmla0qhvm000k3ivo0mka6fph	Patagonia 24.7 Session IPA	patagonia-24-7-session-ipa-3027e-cmkvb	IPA ligera de bajo alcohol (4,2%), con lpulo patagnico. Refrescante, ctrica y fcil de tomar en cualquier momento. / Tamao: 740ml	cmkvbvo3z0008r0gkc7qfxplz	5000	0	100	5	t	f	2026-02-05 22:18:57.155	2026-02-05 22:18:57.155	\N
cml4pahxe0001g0s2gf3mvkrd	Cartas UNO	cartas-uno-ae47f-cmkvb	Clsico juego de cartas para 2 a 10 jugadores. Dinmico y divertido, combina colores y nmeros con cartas especiales que cambian el rumbo del juego. Ideal para todas las edades.	cmkvbvo5b000ur0gk0eib5xpt	6900	0	100	5	t	f	2026-02-02 04:59:44.042	2026-02-06 15:56:52.637	\N
cml4pai550007g0s2rc70nru6	Cartas Espaolas x50	cartas-espa-olas-x50-cu1ei-cmkvb	Baraja tradicional espaola, plastificada y lavable. Resistente y prctica, perfecta para juegos clsicos como Truco, Escoba o Chin Chn.	cmkvbvo5b000ur0gk0eib5xpt	5000	0	100	5	t	f	2026-02-02 04:59:44.344	2026-02-06 16:41:10.069	\N
cmla0qhvu000p3ivoez0th7no	Patagonia Vera IPA	patagonia-vera-ipa-6uha3-cmkvb	New England IPA de amargor moderado y final fresco. Aromas tropicales y ctricos intensos, con cuerpo sedoso y balanceado. / Tamao: 740ml	cmkvbvo3z0008r0gkc7qfxplz	5000	0	100	5	t	f	2026-02-05 22:18:57.162	2026-02-07 00:31:48.174	\N
cmlbnnt2b000210ncti5soy3s	Beldent	beldent-a1y54-cmkvb	Tipo: Chicle Sabor: Menta	cmkvbvo5b000ur0gk0eib5xpt	800	0	100	5	t	f	2026-02-07 01:48:29.026	2026-02-07 01:48:29.026	\N
cmlbnu9v5000910ncd7gj7dmy	Snickers	snickers-ipbq6-cmkvb	Peso: 48gr	cmkvbvo5b000ur0gk0eib5xpt	2700	0	100	5	t	f	2026-02-07 01:53:30.735	2026-02-07 01:53:30.735	\N
cml4pai4d0004g0s232dhvgsh	Jenga de Madera	jenga-de-madera-oxm01-cmkvb	Clsico juego de destreza y equilibrio con bloques de madera. Ideal para jugar en grupo, poner a prueba la paciencia y la precisin, diversin asegurada en cada movimiento!	cmkvbvo5b000ur0gk0eib5xpt	9900	0	100	5	t	f	2026-02-02 04:59:44.317	2026-02-07 01:56:19.017	\N
cml4byrgs00177c7erghv3whj	PRIME x3 - Extra Lubricado	prime-x3-extra-lubricado-rymvx-cmkvb	Ms suavidad y deslizamiento para una experiencia cmoda y segura.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	99	5	t	f	2026-02-01 22:46:41.548	2026-02-14 00:51:33.569	\N
cmkvbvo4j000gr0gkdnii5wl3	Hamburguesa Doble	comercio-1-hamburguesa-doble	\N	cmkvbvo3z0008r0gkc7qfxplz	7500	4500	58	5	t	f	2026-01-26 15:34:21.668	2026-03-13 19:48:50.754	\N
cml4byrgf00117c7e9qixucyd	PRIME x3 - Super Fino	prime-x3-super-fino-elo3i-cmkvb	Sensacin natural, casi como no sentir nada.	cmkvbvo3z0008r0gkc7qfxplz	2700	0	99	5	t	f	2026-02-01 22:46:41.535	2026-03-08 22:15:38.169	\N
cmkvbvo4s000mr0gkm6bpedcj	Hamburguesa Veggie	comercio-1-hamburguesa-veggie	\N	cmkvbvo3z0008r0gkc7qfxplz	5000	3000	68	5	t	f	2026-01-26 15:34:21.676	2026-03-13 19:47:42.817	\N
cml4bpile000h7c7e66as2x35	Apple iPhone 17 Pro Max (256 GB) - Naranja csmico	apple-iphone-17-pro-max-256-gb-naranja-c-smico-1769985570141	iPhone 17 Pro Max. El iPhone ms poderoso hasta ahora. Espectacular pantalla de 6.9 pulgadas , diseo\r\nunibody de aluminio, chip A19 Pro, cmaras traseras de\r\n48 MP y la mayor duracin de batera hasta ahora.\r\n? DISENO UNIBODY. PARA UNA POTENCIA FUERA DE SERIE.\r\nGracias a su diseo unibody de aluminio forjado en caliente, este es el iPhone ms poderoso que existe.\r\n? CERAMIC SHIELD SUPERRESISTENTE. DELANTE Y ATRS. El Ceramic Shield protege la parte posterior del iPhone 17 Pro Max y lo vuelve 4 veces ms resistente a los golpes?\r\n. Y el nuevo frente de Ceramic\r\nShield 2 tiene una resistencia a los rayones 3 veces mayor?\r\n? EL MEJOR SISTEMA DE CMARAS PRO.\r\nEquipado con cmaras traseras de 48 MP y zoom de 8x de calidad ptica, el mayor rango de zoom que se haya visto en un iPhone. Es como tener 8 lentes profesionales en tu bolsillo.\r\n? CMARA FRONTAL CENTER STAGE DE 18 MP.	cmkvbvo5b000ur0gk0eib5xpt	2650000	1855000	100	5	t	f	2026-02-01 22:39:30.145	2026-03-17 13:31:56.484	\N
cmkvbvo47000ar0gk4zi9lpbi	Hamburguesa Clsica	comercio-1-hamburguesa-cl-sica	\N	cmkvbvo3z0008r0gkc7qfxplz	5500	3300	25	5	t	f	2026-01-26 15:34:21.655	2026-03-17 13:31:57.583	\N
cml0zoxlj00esygio5j1ge0c7	COMBO FERNET 750	combo-fernet-750-da8in	INCLUYE: 1 Fernet 750ml + 2 Coca-Cola 2.5lts + 1 Bolsa de Hielo 2Kg	\N	22900	0	9	5	t	f	2026-01-30 14:39:49.015	2026-03-19 22:53:46.925	\N
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
cmkvbvo70001qr0gkoy36b1tu	cmkvbvo6w001or0gkh6my0iu3	https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400	Roll Salm??sss??sn	0
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
-- Data for Name: PushSubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PushSubscription" (id, "userId", endpoint, p256dh, auth, "createdAt") FROM stdin;
cmm9b13ql000372qvbslw4ts6	cmkvbvo7j001zr0gkayjq633k	https://fcm.googleapis.com/fcm/send/fJ8uIdADFjM:APA91bELPuwcLFDkWFx44XZ-EfhghhDCFMc_J_TypXWNHkuvGZ4HG6HwEmHr8xQYf5q3up8gcqIACbSclHyztgWPcm5dvEr6s2qiU06OZFM5b52MpnIySu_quET8Cqqg6ZmOcpzxHgR1	BMjJg+xJJG/1kcAWNp8j43pyqtZvMEBEbeLrOvXopuWeC6lPQOMaWbF4UEn836SZjBw+vTccYNgl6nrQoZV7k14=	i0PJBZMz+aSDiizv+crzYw==	2026-03-02 14:59:04.363
cmmkpusyw0001ia4v0x2cqxi3	cmmccgicu0002lw51r2qy0lcr	https://fcm.googleapis.com/fcm/send/fyXYtUL37xE:APA91bHlL1LV0docGlND4PGTUlvxlMjoEvU_Myc8RCh_YJ6pgtu6WK-svARUvxeoF5swSCznRSBUaJg4D1uNjrwkItdGtNt4dW6oFaSz0Lny3Zp3v5lw_mlh1L-w1BB_RtAPuNy1aQxB	BKxc0T5pJa+KXvm5fQ0ONE43n0VoGFbUhjrsXRpYsdpQE5tcNpQSZlC13gqTHi3uSgs3+vw1Kna/YosT7fSB2Wo=	RbVDMURRh+neDW4Z7ZyhIw==	2026-03-10 14:39:32.647
\.


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Referral" (id, "referrerId", "refereeId", "codeUsed", "referrerPoints", "refereePoints", status, "createdAt") FROM stdin;
cmmf6jzp7000bls5dfmnco8xs	cmmf6hfcb0002ls5d0nhx3jib	cmmf6jzoy0007ls5ddo24lmq3	MOV-RH25	500	250	PENDING	2026-03-06 17:40:24.571
\.


--
-- Data for Name: SavedCart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SavedCart" (id, "userId", items, "merchantId", "createdAt", "updatedAt") FROM stdin;
cmmf6lbs6000jls5dz62cz3v5	cmmf6jzoy0007ls5ddo24lmq3	[{"id": "cmkvbvo4s000mr0gkm6bpedcj-default-1772818885849", "name": "Hamburguesa Veggie", "type": "product", "image": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400", "price": 5000, "quantity": 1, "productId": "cmkvbvo4s000mr0gkm6bpedcj", "merchantId": "cmkvbvo3z0008r0gkc7qfxplz"}]	\N	2026-03-06 17:41:26.886	2026-03-06 17:41:26.886
\.


--
-- Data for Name: SellerAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerAvailability" (id, "sellerId", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
cmmp8dvaj0003xhv4pmohpith	cmmccgicu0002lw51r2qy0lcr	f	f	\N	10	t	\N	2026-03-13 18:29:19.913	2026-03-20 04:26:19.745
\.


--
-- Data for Name: SellerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerProfile" (id, "userId", "displayName", bio, avatar, "bankAlias", "bankCbu", "isActive", "isVerified", "totalSales", rating, "commissionRate", "createdAt", "updatedAt", "mpAccessToken", "mpEmail", "mpLinkedAt", "mpRefreshToken", "mpUserId", "acceptedTermsAt", cuit) FROM stdin;
cmmcipevr0001wwz9f4r8bo4v	cmmccgicu0002lw51r2qy0lcr	Test Moover	\N	\N	\N	\N	t	f	0	\N	12	2026-03-04 20:57:14.39	2026-03-15 20:20:51.335	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "isMaintenanceMode", "maintenanceMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt", "promoPopupButtonText", "promoPopupDismissable", "promoPopupEnabled", "promoPopupImage", "promoPopupLink", "promoPopupMessage", "promoPopupTitle", "showComerciosCard", "showRepartidoresCard", "tiendaMaintenance", "maxCategoriesHome", "heroSliderInterval", "promoBannerButtonLink", "promoBannerButtonText", "promoBannerEnabled", "promoBannerImage", "promoBannerSubtitle", "promoBannerTitle", "riderCommissionPercent", "heroSliderEnabled") FROM stdin;
settings	f	Estamos cerrados. ??Volvemos pronto!	f	Volvemos pronto! Estamos trabajando para mejorar tu experiencia.	1200	0.06	500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-03-19 15:37:29.124	QUIERO SER MOOVER	t	f		/puntos	Registrate gratis y comenz├í a ganar puntos y canjealo por incre├¡bles benneficios en tus comercios favoritos!	┬┐A├║n no eres MOOVER?	t	t	f	10	5000	/productos?categoria=pizzas	Ver locales	t	/uploads/promo/promo-1770563078358-oldbl8.png	2x1 en locales seleccionados de 20hs a 23hs.	Noches de Pizza & Pelis	80	t
\.


--
-- Data for Name: SubOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubOrder" (id, "orderId", "merchantId", "sellerId", status, subtotal, "deliveryFee", discount, total, "driverId", "moovyCommission", "sellerPayout", "paymentStatus", "deliveredAt", "deliveryPhoto", "driverRating", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "pendingDriverId", "createdAt", "updatedAt", "mpTransferId", "paidOutAt", "payoutStatus", "deliveryStatus") FROM stdin;
cmmh3iln6000bfri270s9dts1	cmmh3illw0007fri2mop7wxp3	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	7500	0	0	7500	\N	600	6900	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 01:50:53.202	2026-03-08 01:50:53.202	\N	\N	PENDING	\N
cmmh3mnn8000pfri2cp3ga2rt	cmmh3mnlk000lfri2ih7hck7b	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 01:54:02.42	2026-03-08 01:54:02.42	\N	\N	PENDING	\N
cmmh3s54i0010fri22xdhkpur	cmmh3s53z000wfri23hrqhxyq	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	7500	0	0	7500	\N	600	6900	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 01:58:18.354	2026-03-08 01:58:18.354	\N	\N	PENDING	\N
cmmh3zuy4001bfri2yxo41xpy	cmmh3zuvt0017fri2owxfqh9g	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	7500	0	0	7500	\N	600	6900	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 02:04:18.412	2026-03-08 02:04:18.412	\N	\N	PENDING	\N
cmmh46jbp001mfri2wj4h39sf	cmmh46jaz001ifri2xv3o3kdq	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 02:09:29.942	2026-03-08 02:09:29.942	\N	\N	PENDING	\N
cmmh48g3r001xfri2saosjiem	cmmh48g39001tfri20cvyj4tq	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 02:10:59.08	2026-03-08 02:10:59.08	\N	\N	PENDING	\N
cmmhvg9r60007kwe0ez39anyb	cmmhvg9do0003kwe098uvdqb3	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 14:52:53.73	2026-03-08 14:52:53.73	\N	\N	PENDING	\N
cmmi68eab0007i694a2m4odog	cmmi68e860003i694ypol6vno	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5000	0	0	5000	\N	400	4600	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 19:54:42.131	2026-03-08 19:54:42.131	\N	\N	PENDING	\N
cmmi68t1r000ji694hu7be3oo	cmmi68t1e000fi6946bx2jmem	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	15000	0	0	15000	\N	1200	13800	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 19:55:01.263	2026-03-08 19:55:01.263	\N	\N	PENDING	\N
cmmi6j7l0000vi6943xg86gcf	cmmi6j7kg000ri694vobfo5ac	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	10000	0	0	10000	\N	800	9200	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 20:03:06.661	2026-03-08 20:03:06.661	\N	\N	PENDING	\N
cmmi6os980016i694cnoe05yt	cmmi6os8k0012i694hrat70ko	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 20:07:26.733	2026-03-08 20:07:26.733	\N	\N	PENDING	\N
cmmi6s710001ii694sxypg84b	cmmi6s70b001ei694w8wrbz0a	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	15000	0	0	15000	\N	1200	13800	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 20:10:05.844	2026-03-08 20:10:05.844	\N	\N	PENDING	\N
cmmi8pt0u001ti694mvn1bchu	cmmi8pt08001pi694m5ep0zgb	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:04:13.615	2026-03-08 21:04:13.615	\N	\N	PENDING	\N
cmmi8q6ql0024i694dpu68gut	cmmi8q6pv0020i694r7j084nz	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:04:31.39	2026-03-08 21:04:31.39	\N	\N	PENDING	\N
cmmi8vm7a002gi6942ohab9h3	cmmi8vm6w002ci694vc0su6wl	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	15000	0	0	15000	\N	1200	13800	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:08:44.711	2026-03-08 21:08:44.711	\N	\N	PENDING	\N
cmmi8wqii002ri694ml0s6qdl	cmmi8wqht002ni694r0tgzntl	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:09:36.954	2026-03-08 21:09:36.954	\N	\N	PENDING	\N
cmmi8xg4i0032i694kpis59xx	cmmi8xg48002yi694ak2683jo	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:10:10.146	2026-03-08 21:10:10.146	\N	\N	PENDING	\N
cmmi986n80007tszvjnzmkpbg	cmmi986mh0003tszvezfaz15c	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	16500	0	0	16500	\N	1320	15180	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:18:31.076	2026-03-08 21:18:31.076	\N	\N	PENDING	\N
cmmi986w0000htszvt5294r2j	cmmi986vh000dtszv7cwx3z3t	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:18:31.393	2026-03-08 21:18:31.393	\N	\N	PENDING	\N
cmmi99lu2000utszvskb0d29r	cmmi99ltp000qtszv7jmf7rtn	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:19:37.418	2026-03-08 21:19:37.418	\N	\N	PENDING	\N
cmmi9ev950017tszvx9w6aky6	cmmi9ev8o0013tszv905wbc51	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	15000	0	0	15000	\N	1200	13800	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:23:42.906	2026-03-08 21:23:42.906	\N	\N	PENDING	\N
cmmi9gaxh001itszvxlwq2xdo	cmmi9gax4001etszv2jmvbwqn	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:24:49.877	2026-03-08 21:24:49.877	\N	\N	PENDING	\N
cmmi9pc52001ttszv4frvxqy1	cmmi9pc46001ptszvf3yrf3p2	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:31:51.351	2026-03-08 21:31:51.351	\N	\N	PENDING	\N
cmmia7bls0024tszv0npuowhi	cmmia7bl50020tszvif0zjp90	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:45:50.464	2026-03-08 21:45:50.464	\N	\N	PENDING	\N
cmmiafanh002gtszvq18k3lm7	cmmiafamt002ctszv3rzwtaw7	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	16500	0	0	16500	\N	1320	15180	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 21:52:02.477	2026-03-08 21:52:02.477	\N	\N	PENDING	\N
cmmib8mg70006xdlk5hoyh6mu	cmmib8meh0002xdlk0f0r7by2	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 22:14:50.791	2026-03-08 22:14:50.791	\N	\N	PENDING	\N
cmmib9n0l000ixdlkrigcq461	cmmib9n01000exdlkgm5x9yf1	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	2700	0	0	2700	\N	216	2484	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 22:15:38.181	2026-03-08 22:15:38.181	\N	\N	PENDING	\N
cmmibafbm000xxdlkj8at5gvl	cmmibafax000txdlkgdytpoo5	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-08 22:16:14.866	2026-03-08 22:16:14.866	\N	\N	PENDING	\N
cmmj7h4g70008tzd28tfbgodu	cmmj7h4eq0004tzd2q7g06zav	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	15000	0	0	15000	\N	1200	13800	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 13:17:15.079	2026-03-09 13:17:15.079	\N	\N	PENDING	\N
cmmjgt79p0008vqe4nadrzepk	cmmjgt78o0004vqe43py8xwsu	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	22500	0	0	22500	\N	1800	20700	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 17:38:35.149	2026-03-09 17:38:35.149	\N	\N	PENDING	\N
cmmjhduhe000mvqe4u7kh1k0m	cmmjhdugn000ivqe4ylixlqjc	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5000	0	0	5000	\N	400	4600	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 17:54:38.354	2026-03-09 17:54:38.354	\N	\N	PENDING	\N
cmmjhg4uv000yvqe4hizoib4x	cmmjhg4ub000uvqe4931iubcs	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	15000	0	0	15000	\N	1200	13800	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 17:56:25.111	2026-03-09 17:56:25.111	\N	\N	PENDING	\N
cmmjmek0u000713h6ipxbxl1w	cmmjmejzt000313h69pv3bb2e	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 20:15:09.534	2026-03-09 20:15:09.534	\N	\N	PENDING	\N
cmmjnggar000j13h6nnvodi4y	cmmjngga7000f13h6q00mzd4k	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	11000	0	0	11000	\N	880	10120	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 20:44:37.635	2026-03-09 20:44:37.635	\N	\N	PENDING	\N
cmmjnilni000u13h6ymh535l4	cmmjnillx000q13h6ohyn3f00	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	11000	0	0	11000	\N	880	10120	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 20:46:17.885	2026-03-09 20:46:17.885	\N	\N	PENDING	\N
cmmjnpm5p001513h6kcsz3awx	cmmjnpm4z001113h6rlkebpb5	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	11000	0	0	11000	\N	880	10120	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 20:51:45.134	2026-03-09 20:51:45.134	\N	\N	PENDING	\N
cmmjnv4wx001h13h6k4di210a	cmmjnv4w7001d13h6a0kohkmt	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	30000	0	0	30000	\N	2400	27600	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 20:56:02.721	2026-03-09 20:56:02.721	\N	\N	PENDING	\N
cmmjo2mg900075sznr68skaj6	cmmjo2mfs00035szntcqry54b	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:01:52.041	2026-03-09 21:01:52.041	\N	\N	PENDING	\N
cmmjonk53000be4tpinl6205g	cmmjonk4d0005e4tps7bjklqf	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	24000	0	0	24000	\N	1920	22080	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:18:08.823	2026-03-09 21:18:08.823	\N	\N	PENDING	\N
cmmjotfgd0008cp9jjqzc0w3w	cmmjotffg0004cp9j58hl5r1o	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	22500	0	0	22500	\N	1800	20700	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:22:42.685	2026-03-09 21:22:42.685	\N	\N	PENDING	\N
cmmjpb9p50007lcz444kysvjb	cmmjpb9o60003lcz4uah18rmw	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:36:35.033	2026-03-09 21:36:35.033	\N	\N	PENDING	\N
cmmjpve3f0007qjquls2d2f3p	cmmjpve2i0003qjqu6f5qgwws	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	7500	0	0	7500	\N	600	6900	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:52:13.851	2026-03-09 21:52:13.851	\N	\N	PENDING	\N
cmmjpxp40000iqjqu3sdhy90m	cmmjpxp3e000eqjqu27tj55va	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:54:01.437	2026-03-09 21:54:01.437	\N	\N	PENDING	\N
cmmjq4pem000tqjqult4jdbxw	cmmjq4pdu000pqjquqne4ez8z	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	7500	0	0	7500	\N	600	6900	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 21:59:28.414	2026-03-09 21:59:28.414	\N	\N	PENDING	\N
cmmjt1xly0017qjqu7szrgolc	cmmjt1xl90013qjquuvusvhwj	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	22500	0	0	22500	\N	1800	20700	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 23:21:17.926	2026-03-09 23:21:17.926	\N	\N	PENDING	\N
cmmju1ixn00092wtgtu4vjbd5	cmmju1iwe00052wtg1522vv6t	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	10000	0	0	10000	\N	800	9200	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 23:48:58.523	2026-03-09 23:48:58.523	\N	\N	PENDING	\N
cmmju1wmf000l2wtgzogppd7j	cmmju1wl1000h2wtgyyhnryw8	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	22500	0	0	22500	\N	1800	20700	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 23:49:16.263	2026-03-09 23:49:16.263	\N	\N	PENDING	\N
cmmju3aji000x2wtgv4uxaynp	cmmju3aj0000t2wtgc0urwiyf	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	37500	0	0	37500	\N	3000	34500	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 23:50:20.958	2026-03-09 23:50:20.958	\N	\N	PENDING	\N
cmmju7u33001b2wtgkx3uhav8	cmmju7u2900172wtgq7k80ztj	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	7500	0	0	7500	\N	600	6900	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 23:53:52.911	2026-03-09 23:53:52.911	\N	\N	PENDING	\N
cmmjuboei0008c82wewt8q0gm	cmmjubodi0004c82wpyrce2eh	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	11000	0	0	11000	\N	880	10120	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-09 23:56:52.17	2026-03-09 23:56:52.17	\N	\N	PENDING	\N
cmmjuvxbu00079b3giijaecfa	cmmjuvxb400039b3g0awpn9q2	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-10 00:12:36.858	2026-03-10 00:12:36.858	\N	\N	PENDING	\N
cmmjxsemn00089g05pc2wps8q	cmmjxsel200049g05uqzedyyr	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	27500	0	0	27500	\N	2200	25300	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-10 01:33:51.503	2026-03-10 01:33:51.503	\N	\N	PENDING	\N
cmmkmv9cm0006uexn32t4deq4	cmmkmv9b60002uexnjzhmthp4	\N	cmmcipevr0001wwz9f4r8bo4v	PENDING	150000	0	0	150000	\N	15000	135000	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-10 13:15:55.031	2026-03-10 13:15:55.031	\N	\N	PENDING	\N
cmmknp3sk000dnmo1tg6d08hi	cmmknp3lk0009nmo1pq62hkyy	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5500	0	0	5500	\N	440	5060	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-10 13:39:07.508	2026-03-10 13:39:07.508	\N	\N	PENDING	\N
cmmp90pni0008148ur9py2uie	cmmp90pm40004148upedkvg87	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	27500	0	0	27500	\N	2200	25300	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-13 18:47:05.694	2026-03-13 18:47:05.694	\N	\N	PENDING	\N
cmmp92ttq000k148ujsovrry5	cmmp92tsx000g148u0eoa5u7z	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	38500	0	0	38500	\N	3080	35420	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-13 18:48:44.414	2026-03-13 18:48:44.414	\N	\N	PENDING	\N
cmmpb6o2z0009ek195nhypeii	cmmpb6o150005ek194ozksuha	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	5000	0	0	5000	\N	400	4600	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-13 19:47:42.828	2026-03-13 19:47:42.828	\N	\N	PENDING	\N
cmmpb84hz000lek191pmsuqht	cmmpb84hn000hek19csh5pqz9	cmkvbvo3z0008r0gkc7qfxplz	\N	PENDING	30000	0	0	30000	\N	2400	27600	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-13 19:48:50.759	2026-03-13 19:48:50.759	\N	\N	PENDING	\N
cmmtyvdwt0006l01q0za8tx24	cmmtyvduq0002l01qzhv4xsxd	\N	cmmcipevr0001wwz9f4r8bo4v	PENDING	150000	0	0	150000	\N	15000	135000	PENDING	\N	\N	\N	0	\N	\N	\N	2026-03-17 02:01:51.917	2026-03-17 02:01:51.917	\N	\N	PENDING	\N
\.


--
-- Data for Name: SupportChat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportChat" (id, "userId", "merchantId", subject, status, "lastMessageAt", "createdAt", "updatedAt") FROM stdin;
cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	cmkvbvo3z0008r0gkc7qfxplz	Consulta general	closed	2026-01-30 14:45:33.241	2026-01-28 13:22:27.178	2026-03-15 14:24:10.11
cml4bel44000b7c7ees7j69cp	cmkvbvo57000rr0gkp7ff55ji	cmkvbvo5b000ur0gk0eib5xpt	Morochito	closed	2026-02-01 22:31:52.056	2026-02-01 22:31:00.194	2026-03-15 14:24:14.601
cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	\N	Consulta de repartidor	closed	2026-02-16 01:20:03.707	2026-02-16 00:44:32.366	2026-03-15 14:24:18.777
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportMessage" (id, "chatId", "senderId", content, "isFromAdmin", "isRead", "createdAt") FROM stdin;
cml0zvrzs0001ej7x1xmw25fh	cmky21qlm0001120mrqtgicuc	cmkvbvo1d0000r0gkyait4f0l	Hola!	t	t	2026-01-30 14:45:08.344
cml0zwb760005ej7xijggxlzx	cmky21qlm0001120mrqtgicuc	cmkvbvo1d0000r0gkyait4f0l	En qu?? podemos ayudarte?	t	t	2026-01-30 14:45:33.234
cml4bfp4f000f7c7es5ik8ofq	cml4bel44000b7c7ees7j69cp	cmkvbvo1d0000r0gkyait4f0l	Vos tambien!	t	t	2026-02-01 22:31:52.047
cmlohkn7h000zvmcnncqxixac	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Hola	t	t	2026-02-16 01:19:04.061
cmloh83yc000tvmcn73itk56a	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Hola!	t	t	2026-02-16 01:09:19.236
cmloh0nd8000lvmcnr2bd6x85	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Nsjsjabs	t	t	2026-02-16 01:03:31.147
cmlogcwxg0005vmcngzgdprri	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Perfecto!	t	t	2026-02-16 00:45:03.797
cmlogfmfn0007vmcnhcve8mph	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Hola	t	t	2026-02-16 00:47:10.163
cmloggvy40009vmcnl9s5zuqi	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Hola	t	t	2026-02-16 00:48:09.148
cmlogi9x8000bvmcnsrnxqqop	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Hola!	t	t	2026-02-16 00:49:13.916
cmlogj7tx000dvmcny36ri2ka	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Holaaaaa	t	t	2026-02-16 00:49:57.861
cmlogru7h000fvmcnt41utudp	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Holaaaaa	t	t	2026-02-16 00:56:40.108
cmlogxqjl000hvmcnwdfv58im	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Holaaaajahahahaha	t	t	2026-02-16 01:01:15.296
cmloh4g19000pvmcn9tgs4wi6	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Hola!	t	t	2026-02-16 01:06:28.269
cmlohf4so000xvmcneip9cpdy	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	En que te puedo ayudar?	t	t	2026-02-16 01:14:46.92
cmlohllpt0013vmcnahz9fcfm	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	En qu?? puedo ayudarte?	t	t	2026-02-16 01:19:48.786
cmlohlx7z0017vmcnlgn4kend	cmlogc8of0001vmcnk5fre606	cmkvbvo1d0000r0gkyait4f0l	Djdhdhdjd	t	t	2026-02-16 01:20:03.695
cmky21qlm0003120mro03s073	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Pregunta 1	f	t	2026-01-28 13:22:27.178
cmky22d2h0005120muqi30wzc	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Hola!	f	t	2026-01-28 13:22:56.297
cmky22kac0007120m65nvqe8w	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Hola!	f	t	2026-01-28 13:23:05.652
cml0zw1fh0003ej7xjt0e252l	cmky21qlm0001120mrqtgicuc	cmkvbvo3s0005r0gkpul7pexf	Como estas?	f	t	2026-01-30 14:45:20.573
cml4bel44000d7c7ez1scpq8s	cml4bel44000b7c7ees7j69cp	cmkvbvo57000rr0gkp7ff55ji	Eres muy lindo	f	t	2026-02-01 22:31:00.194
cmlogc8of0003vmcn8s4ytfqk	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	Necesito cancelar un pedido	f	t	2026-02-16 00:44:32.366
cmloh18t1000nvmcnmsm3zvwv	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	gRACIAS!	f	t	2026-02-16 01:03:58.934
cmlogy6hv000jvmcnhfy5jq0b	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	Necesito ayuda!	f	t	2026-02-16 01:01:35.971
cmloh7mlg000rvmcnjthjbcl3	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	HOLA 9999	f	t	2026-02-16 01:08:56.74
cmlohe8tg000vvmcnn6zb834a	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	Hola!	f	t	2026-02-16 01:14:05.473
cmlohl8gf0011vmcn5pz2cxbz	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	Necesito ayuda	f	t	2026-02-16 01:19:31.596
cmlohlt960015vmcnlaeg1df0	cmlogc8of0001vmcnk5fre606	cmkvbvo7j001zr0gkayjq633k	Hola!	f	t	2026-02-16 01:19:58.555
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry", "deletedAt", "privacyConsentAt", "termsConsentAt") FROM stdin;
cmkvbvo6g001dr0gkkc3uxs3s	comercio3@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	COMERCIO 3	\N	\N	\N	MERCHANT	\N	\N	0	0	f	cmkvbvo6g001er0gksdi7wmsv	\N	2026-01-26 15:34:21.736	2026-01-26 15:34:21.736	\N	\N	\N	\N	\N
cmkvbvo800027r0gksb401d3p	rider3@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	RIDER 3	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmkvbvo800028r0gk3g91rt9h	\N	2026-01-26 15:34:21.792	2026-01-26 15:34:21.792	\N	\N	\N	\N	\N
cmkvbvo8f002fr0gks60vb2et	cliente3@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	CLIENTE 3	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmkvbvo8f002gr0gkxvsgolli	\N	2026-01-26 15:34:21.808	2026-01-26 15:34:21.808	\N	\N	\N	\N	\N
cmll8sigf001c13qm9pu40nkd	loadtest-rider13@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 13	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sigf001d13qmm3cm9ta3	\N	2026-02-13 18:49:56.08	2026-02-13 18:49:56.08	\N	\N	\N	\N	\N
cmll8sigl001g13qmvxjkbqor	loadtest-rider14@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 14	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sigl001h13qmutpsxoxx	\N	2026-02-13 18:49:56.085	2026-02-13 18:49:56.085	\N	\N	\N	\N	\N
cmll8sigt001k13qmjaa7y9lm	loadtest-rider15@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 15	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sigt001l13qmnx5gankk	\N	2026-02-13 18:49:56.094	2026-02-13 18:49:56.094	\N	\N	\N	\N	\N
cmll8sigz001o13qmxwlyyajt	loadtest-rider16@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 16	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sigz001p13qmsxihgoq9	\N	2026-02-13 18:49:56.099	2026-02-13 18:49:56.099	\N	\N	\N	\N	\N
cmll8sih4001s13qmtolt4a4c	loadtest-rider17@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 17	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sih4001t13qm5282o12a	\N	2026-02-13 18:49:56.104	2026-02-13 18:49:56.104	\N	\N	\N	\N	\N
cmll8siha001w13qm5qq1i5aq	loadtest-rider18@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 18	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8siha001x13qmg0r9qkg6	\N	2026-02-13 18:49:56.11	2026-02-13 18:49:56.11	\N	\N	\N	\N	\N
cmkvbvo8c002dr0gk22kda2cw	cliente2@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	CLIENTE 2	\N	\N	\N	CLIENT	\N	\N	10500	0	t	cmkvbvo8c002er0gk53tvzvvh	\N	2026-01-26 15:34:21.804	2026-02-13 18:17:54.472	\N	\N	\N	\N	\N
cmll8sibt000013qm7mi6wqby	loadtest-rider1@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 1	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sibu000113qmpjclzgp6	\N	2026-02-13 18:49:55.912	2026-02-13 18:49:55.912	\N	\N	\N	\N	\N
cmll8sid3000413qmi2i1plv9	loadtest-rider2@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 2	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sid3000513qml19seg3k	\N	2026-02-13 18:49:55.959	2026-02-13 18:49:55.959	\N	\N	\N	\N	\N
cmll8sidb000813qmeg8nm49u	loadtest-rider3@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 3	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sidb000913qmkiu5yxbi	\N	2026-02-13 18:49:55.967	2026-02-13 18:49:55.967	\N	\N	\N	\N	\N
cmll8sidk000c13qm6iq8nspy	loadtest-rider4@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 4	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sidk000d13qm1btfzaz9	\N	2026-02-13 18:49:55.976	2026-02-13 18:49:55.976	\N	\N	\N	\N	\N
cmll8sidt000g13qmyv17wjq2	loadtest-rider5@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 5	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sidt000h13qm5l1gcpsw	\N	2026-02-13 18:49:55.985	2026-02-13 18:49:55.985	\N	\N	\N	\N	\N
cmll8sie6000k13qm4a2yizrg	loadtest-rider6@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 6	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sie6000l13qm8krfbp8n	\N	2026-02-13 18:49:55.998	2026-02-13 18:49:55.998	\N	\N	\N	\N	\N
cmll8sied000o13qm4islyzz4	loadtest-rider7@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 7	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sied000p13qm1ptmolcb	\N	2026-02-13 18:49:56.006	2026-02-13 18:49:56.006	\N	\N	\N	\N	\N
cmll8siel000s13qm3t04jyui	loadtest-rider8@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 8	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8siel000t13qm8dkv1cf3	\N	2026-02-13 18:49:56.014	2026-02-13 18:49:56.014	\N	\N	\N	\N	\N
cmll8sies000w13qmn1xgvuis	loadtest-rider9@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 9	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sies000x13qm0p0jdm6z	\N	2026-02-13 18:49:56.02	2026-02-13 18:49:56.02	\N	\N	\N	\N	\N
cmll8sif0001013qmurb3656o	loadtest-rider10@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 10	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sif0001113qm7rkeghwd	\N	2026-02-13 18:49:56.028	2026-02-13 18:49:56.028	\N	\N	\N	\N	\N
cmll8sif6001413qmj7excudw	loadtest-rider11@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 11	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sif6001513qmwtul9c9t	\N	2026-02-13 18:49:56.035	2026-02-13 18:49:56.035	\N	\N	\N	\N	\N
cmll8sig7001813qmeqh3czd7	loadtest-rider12@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 12	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sig7001913qmvotj8g7m	\N	2026-02-13 18:49:56.071	2026-02-13 18:49:56.071	\N	\N	\N	\N	\N
cmll8sihf002013qm3zoqvghv	loadtest-rider19@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 19	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sihf002113qmdn3fw19k	\N	2026-02-13 18:49:56.116	2026-02-13 18:49:56.116	\N	\N	\N	\N	\N
cmll8sihk002413qmd0kdzb4y	loadtest-rider20@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Rider 20	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmll8sihk002513qmgidlws6l	\N	2026-02-13 18:49:56.121	2026-02-13 18:49:56.121	\N	\N	\N	\N	\N
cmll8sihq002813qmgthzq0fb	loadtest-client1@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 1	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sihq002913qmdn5ylygh	\N	2026-02-13 18:49:56.127	2026-02-13 18:49:56.127	\N	\N	\N	\N	\N
cmll8sihx002a13qmt0imk3nq	loadtest-client2@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 2	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sihx002b13qmfm6q2of5	\N	2026-02-13 18:49:56.133	2026-02-13 18:49:56.133	\N	\N	\N	\N	\N
cmll8sii1002c13qm525y5bk1	loadtest-client3@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 3	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sii1002d13qmdl6cfzf2	\N	2026-02-13 18:49:56.137	2026-02-13 18:49:56.137	\N	\N	\N	\N	\N
cmll8sii4002e13qma8mxj0cz	loadtest-client4@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 4	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sii4002f13qmxh7eedui	\N	2026-02-13 18:49:56.14	2026-02-13 18:49:56.14	\N	\N	\N	\N	\N
cmkvbvo7s0023r0gk3wyvfr2v	rider2@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	RIDER 2	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmkvbvo7s0024r0gkvoz8se8y	\N	2026-01-26 15:34:21.784	2026-03-01 02:43:54.798	\N	\N	\N	\N	\N
cmll8sii7002g13qmcbuj0s6f	loadtest-client5@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 5	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sii7002h13qmqcjfqf3a	\N	2026-02-13 18:49:56.143	2026-02-13 18:49:56.143	\N	\N	\N	\N	\N
cmlbofjvu0002mqdpmdns2wmk	ing.iyad@gmail.com	$2b$10$Dh5H4ps/PMUnkYwWTT.Ci.2id/EIt7MG6SZXjdQ9AV3kJjg/VAFw2	Iyad Marmoud	Iyad	Marmoud	+54 2901611605	USER	\N	\N	174150	0	t	MOV-V45Z	\N	2026-02-07 02:10:03.497	2026-03-15 21:47:08.661	\N	\N	\N	\N	\N
cmkvbvo3s0005r0gkpul7pexf	comercio1@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	COMERCIO 1	\N	\N	\N	MERCHANT	\N	\N	0	0	f	cmkvbvo3s0006r0gkc8178zq4	\N	2026-01-26 15:34:21.64	2026-03-20 13:54:50.403	\N	\N	\N	\N	\N
cmkvbvo1d0000r0gkyait4f0l	admin@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	Admin MOOVY	\N	\N	\N	ADMIN	\N	\N	0	0	f	cmkvbvo1e0001r0gk770gtuc2	\N	2026-01-26 15:34:21.552	2026-03-20 15:26:00.77	\N	\N	\N	\N	\N
cmkvbvo57000rr0gkp7ff55ji	comercio2@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	 COMERCIO 2				MERCHANT	\N	\N	0	0	f	cmkvbvo57000sr0gkah2nixeg	\N	2026-01-26 15:34:21.692	2026-03-15 21:30:30.775	\N	\N	\N	\N	\N
cmll8siig002i13qm2eclyn4a	loadtest-client6@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 6	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siig002j13qm4djcwtzn	\N	2026-02-13 18:49:56.152	2026-02-13 18:49:56.152	\N	\N	\N	\N	\N
cmll8siij002k13qmj7fc0551	loadtest-client7@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 7	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siij002l13qmsw8p1x8x	\N	2026-02-13 18:49:56.155	2026-02-13 18:49:56.155	\N	\N	\N	\N	\N
cmll8siim002m13qmu28og8ka	loadtest-client8@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 8	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siim002n13qmeobam2cw	\N	2026-02-13 18:49:56.158	2026-02-13 18:49:56.158	\N	\N	\N	\N	\N
cmll8siir002o13qm52gewz3x	loadtest-client9@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 9	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siir002p13qm4ri3r9r5	\N	2026-02-13 18:49:56.163	2026-02-13 18:49:56.163	\N	\N	\N	\N	\N
cmll8siiu002q13qm6xcxkbpq	loadtest-client10@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 10	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siiu002r13qmtr43u8hf	\N	2026-02-13 18:49:56.166	2026-02-13 18:49:56.166	\N	\N	\N	\N	\N
cmll8siix002s13qmzlg9a9lf	loadtest-client11@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 11	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siix002t13qm553pzbly	\N	2026-02-13 18:49:56.17	2026-02-13 18:49:56.17	\N	\N	\N	\N	\N
cmll8sij0002u13qmyeu2g4rn	loadtest-client12@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 12	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sij0002v13qm0dmdb496	\N	2026-02-13 18:49:56.173	2026-02-13 18:49:56.173	\N	\N	\N	\N	\N
cmll8sij4002w13qmux9869kb	loadtest-client13@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 13	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sij4002x13qmov9wk27u	\N	2026-02-13 18:49:56.176	2026-02-13 18:49:56.176	\N	\N	\N	\N	\N
cmll8sij7002y13qmtncrz1yu	loadtest-client14@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 14	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sij7002z13qmhgh5mz2j	\N	2026-02-13 18:49:56.18	2026-02-13 18:49:56.18	\N	\N	\N	\N	\N
cmll8sija003013qmqu46foez	loadtest-client15@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 15	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sija003113qm91q08jge	\N	2026-02-13 18:49:56.183	2026-02-13 18:49:56.183	\N	\N	\N	\N	\N
cmll8sijd003213qm89symr4v	loadtest-client16@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 16	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijd003313qme2jmsfao	\N	2026-02-13 18:49:56.186	2026-02-13 18:49:56.186	\N	\N	\N	\N	\N
cmll8sijg003413qmme2as4kj	loadtest-client17@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 17	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijg003513qm3lmuosh7	\N	2026-02-13 18:49:56.188	2026-02-13 18:49:56.188	\N	\N	\N	\N	\N
cmll8siji003613qmk6ubq3ku	loadtest-client18@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 18	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siji003713qmar9wuuyq	\N	2026-02-13 18:49:56.191	2026-02-13 18:49:56.191	\N	\N	\N	\N	\N
cmll8sijk003813qmnp4ynr0f	loadtest-client19@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 19	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijk003913qm976jz2nr	\N	2026-02-13 18:49:56.193	2026-02-13 18:49:56.193	\N	\N	\N	\N	\N
cmll8sijm003a13qmqtsc2snf	loadtest-client20@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 20	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijm003b13qmrvag8gog	\N	2026-02-13 18:49:56.194	2026-02-13 18:49:56.194	\N	\N	\N	\N	\N
cmll8sijp003c13qm5b9jd3rw	loadtest-client21@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 21	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijp003d13qmh4jxqus7	\N	2026-02-13 18:49:56.197	2026-02-13 18:49:56.197	\N	\N	\N	\N	\N
cmll8sijs003e13qmoxgy3wmp	loadtest-client22@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 22	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijs003f13qmmcbnrv0o	\N	2026-02-13 18:49:56.2	2026-02-13 18:49:56.2	\N	\N	\N	\N	\N
cmll8sijv003g13qm57j6l26k	loadtest-client23@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 23	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijv003h13qm35b8yrtv	\N	2026-02-13 18:49:56.203	2026-02-13 18:49:56.203	\N	\N	\N	\N	\N
cmll8sijx003i13qmsd4xic08	loadtest-client24@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 24	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sijx003j13qm64ma8qrb	\N	2026-02-13 18:49:56.206	2026-02-13 18:49:56.206	\N	\N	\N	\N	\N
cmll8sik0003k13qmxcy4neus	loadtest-client25@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 25	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sik0003l13qmb7ewfeqz	\N	2026-02-13 18:49:56.209	2026-02-13 18:49:56.209	\N	\N	\N	\N	\N
cmll8sik4003m13qmp0fzg3zz	loadtest-client26@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 26	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sik4003n13qmttpqm91z	\N	2026-02-13 18:49:56.212	2026-02-13 18:49:56.212	\N	\N	\N	\N	\N
cmll8sik7003o13qmksdts4e9	loadtest-client27@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 27	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sik7003p13qmkukpj7mb	\N	2026-02-13 18:49:56.216	2026-02-13 18:49:56.216	\N	\N	\N	\N	\N
cmll8sika003q13qm7c0ttf02	loadtest-client28@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 28	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sika003r13qme7mza0kh	\N	2026-02-13 18:49:56.219	2026-02-13 18:49:56.219	\N	\N	\N	\N	\N
cmll8sikd003s13qmt89jswhl	loadtest-client29@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 29	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikd003t13qmln6gj0hn	\N	2026-02-13 18:49:56.222	2026-02-13 18:49:56.222	\N	\N	\N	\N	\N
cmll8sikg003u13qm8ckc5ozn	loadtest-client30@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 30	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikg003v13qmfwga9c4s	\N	2026-02-13 18:49:56.225	2026-02-13 18:49:56.225	\N	\N	\N	\N	\N
cmll8sikj003w13qm3wqtlp4e	loadtest-client31@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 31	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikj003x13qmy66yfgrp	\N	2026-02-13 18:49:56.228	2026-02-13 18:49:56.228	\N	\N	\N	\N	\N
cmll8sikm003y13qmmhuup37i	loadtest-client32@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 32	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikm003z13qm56buov6u	\N	2026-02-13 18:49:56.231	2026-02-13 18:49:56.231	\N	\N	\N	\N	\N
cmll8sikq004013qmsxiie5e3	loadtest-client33@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 33	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikq004113qmmee3inyb	\N	2026-02-13 18:49:56.234	2026-02-13 18:49:56.234	\N	\N	\N	\N	\N
cmll8sikt004213qmfpteecch	loadtest-client34@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 34	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikt004313qm0yzt1sfh	\N	2026-02-13 18:49:56.238	2026-02-13 18:49:56.238	\N	\N	\N	\N	\N
cmll8sikx004413qmywpqaa4m	loadtest-client35@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 35	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sikx004513qmemr32xx2	\N	2026-02-13 18:49:56.242	2026-02-13 18:49:56.242	\N	\N	\N	\N	\N
cmll8sil1004613qmz8ffwx8d	loadtest-client36@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 36	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sil1004713qmlgy8ykpg	\N	2026-02-13 18:49:56.245	2026-02-13 18:49:56.245	\N	\N	\N	\N	\N
cmll8sil4004813qmgxl0uq82	loadtest-client37@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 37	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sil4004913qmv6o47o3h	\N	2026-02-13 18:49:56.249	2026-02-13 18:49:56.249	\N	\N	\N	\N	\N
cmll8sil7004a13qmwprh70xs	loadtest-client38@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 38	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sil7004b13qmk7mysyap	\N	2026-02-13 18:49:56.252	2026-02-13 18:49:56.252	\N	\N	\N	\N	\N
cmll8silb004c13qm3jb1o1is	loadtest-client39@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 39	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8silb004d13qmx8x6rzzz	\N	2026-02-13 18:49:56.255	2026-02-13 18:49:56.255	\N	\N	\N	\N	\N
cmll8sile004e13qmfpzwjsyc	loadtest-client40@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 40	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sile004f13qmcoj3wkqf	\N	2026-02-13 18:49:56.258	2026-02-13 18:49:56.258	\N	\N	\N	\N	\N
cmll8sili004g13qmww7g4bcq	loadtest-client41@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 41	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sili004h13qm2x8pj53m	\N	2026-02-13 18:49:56.262	2026-02-13 18:49:56.262	\N	\N	\N	\N	\N
cmll8sill004i13qmury95sow	loadtest-client42@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 42	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sill004j13qm7ycybj7n	\N	2026-02-13 18:49:56.265	2026-02-13 18:49:56.265	\N	\N	\N	\N	\N
cmll8silo004k13qm7ohu9cpp	loadtest-client43@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 43	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8silo004l13qmql4a1hy0	\N	2026-02-13 18:49:56.269	2026-02-13 18:49:56.269	\N	\N	\N	\N	\N
cmll8silr004m13qm1ojan9al	loadtest-client44@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 44	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8silr004n13qmoqhb7vzk	\N	2026-02-13 18:49:56.272	2026-02-13 18:49:56.272	\N	\N	\N	\N	\N
cmll8silv004o13qmrd0eb4fe	loadtest-client45@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 45	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8silv004p13qmo2rcdi0o	\N	2026-02-13 18:49:56.275	2026-02-13 18:49:56.275	\N	\N	\N	\N	\N
cmll8sily004q13qmviddl8q8	loadtest-client46@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 46	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sily004r13qmcw4iyjtg	\N	2026-02-13 18:49:56.278	2026-02-13 18:49:56.278	\N	\N	\N	\N	\N
cmll8sim1004s13qmwzaorqdd	loadtest-client47@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 47	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sim1004t13qmbgdcasbx	\N	2026-02-13 18:49:56.281	2026-02-13 18:49:56.281	\N	\N	\N	\N	\N
cmll8sim5004u13qm7dz2nmrd	loadtest-client48@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 48	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sim5004v13qm6fcjm52v	\N	2026-02-13 18:49:56.285	2026-02-13 18:49:56.285	\N	\N	\N	\N	\N
cmll8sim8004w13qmr022l00e	loadtest-client49@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 49	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sim8004x13qmt5i7r4fu	\N	2026-02-13 18:49:56.288	2026-02-13 18:49:56.288	\N	\N	\N	\N	\N
cmll8simb004y13qm7x0wpl4b	loadtest-client50@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 50	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simb004z13qmlro1itys	\N	2026-02-13 18:49:56.292	2026-02-13 18:49:56.292	\N	\N	\N	\N	\N
cmll8simf005013qma8eq3ce9	loadtest-client51@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 51	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simf005113qm4rwlgcdf	\N	2026-02-13 18:49:56.295	2026-02-13 18:49:56.295	\N	\N	\N	\N	\N
cmll8simi005213qmkk7ysb93	loadtest-client52@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 52	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simi005313qm8jnol9iz	\N	2026-02-13 18:49:56.299	2026-02-13 18:49:56.299	\N	\N	\N	\N	\N
cmll8simn005413qmylc6si4d	loadtest-client53@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 53	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simn005513qm2azdotuu	\N	2026-02-13 18:49:56.303	2026-02-13 18:49:56.303	\N	\N	\N	\N	\N
cmll8simq005613qm7dc5ahw8	loadtest-client54@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 54	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simq005713qmpz34jfdp	\N	2026-02-13 18:49:56.306	2026-02-13 18:49:56.306	\N	\N	\N	\N	\N
cmll8simt005813qm9c9c8uyn	loadtest-client55@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 55	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simt005913qm6hvu2d1v	\N	2026-02-13 18:49:56.309	2026-02-13 18:49:56.309	\N	\N	\N	\N	\N
cmll8simx005a13qmiyp1wk1v	loadtest-client56@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 56	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8simx005b13qmlbf5qfb5	\N	2026-02-13 18:49:56.314	2026-02-13 18:49:56.314	\N	\N	\N	\N	\N
cmll8sin2005c13qmln3qvqw8	loadtest-client57@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 57	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sin2005d13qm9zoqybf9	\N	2026-02-13 18:49:56.318	2026-02-13 18:49:56.318	\N	\N	\N	\N	\N
cmll8sin5005e13qm3p8xdq1m	loadtest-client58@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 58	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sin5005f13qmqjj5ca2x	\N	2026-02-13 18:49:56.321	2026-02-13 18:49:56.321	\N	\N	\N	\N	\N
cmll8sin8005g13qmut6tqpaz	loadtest-client59@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 59	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sin8005h13qmwhwekcpr	\N	2026-02-13 18:49:56.324	2026-02-13 18:49:56.324	\N	\N	\N	\N	\N
cmll8sina005i13qmz7aqilo1	loadtest-client60@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 60	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sina005j13qmfjo55k86	\N	2026-02-13 18:49:56.327	2026-02-13 18:49:56.327	\N	\N	\N	\N	\N
cmll8sine005k13qmss9ejyh1	loadtest-client61@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 61	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sine005l13qmdhavzw58	\N	2026-02-13 18:49:56.33	2026-02-13 18:49:56.33	\N	\N	\N	\N	\N
cmll8sinh005m13qmbm4u96lz	loadtest-client62@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 62	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sinh005n13qmfxyheudj	\N	2026-02-13 18:49:56.333	2026-02-13 18:49:56.333	\N	\N	\N	\N	\N
cmll8sink005o13qmbrt0jja8	loadtest-client63@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 63	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sink005p13qma0576dh6	\N	2026-02-13 18:49:56.336	2026-02-13 18:49:56.336	\N	\N	\N	\N	\N
cmll8sinn005q13qmqz2ej4pw	loadtest-client64@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 64	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sinn005r13qmoj9yajbg	\N	2026-02-13 18:49:56.339	2026-02-13 18:49:56.339	\N	\N	\N	\N	\N
cmll8sinq005s13qm0anjg40g	loadtest-client65@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 65	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sinq005t13qmo8fe2ifu	\N	2026-02-13 18:49:56.342	2026-02-13 18:49:56.342	\N	\N	\N	\N	\N
cmll8sint005u13qmmmh0qdam	loadtest-client66@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 66	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sint005v13qm5pq8yro7	\N	2026-02-13 18:49:56.345	2026-02-13 18:49:56.345	\N	\N	\N	\N	\N
cmll8sinw005w13qm3lhhev72	loadtest-client67@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 67	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sinw005x13qm457s63se	\N	2026-02-13 18:49:56.349	2026-02-13 18:49:56.349	\N	\N	\N	\N	\N
cmll8sinz005y13qmxa989eus	loadtest-client68@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 68	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sinz005z13qm02ryz43i	\N	2026-02-13 18:49:56.352	2026-02-13 18:49:56.352	\N	\N	\N	\N	\N
cmll8sio4006013qmb4xdvym5	loadtest-client69@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 69	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sio4006113qmt6zc5ivu	\N	2026-02-13 18:49:56.356	2026-02-13 18:49:56.356	\N	\N	\N	\N	\N
cmll8sio8006213qmdx3qsd75	loadtest-client70@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 70	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sio8006313qmjxnbjskf	\N	2026-02-13 18:49:56.36	2026-02-13 18:49:56.36	\N	\N	\N	\N	\N
cmll8siob006413qmv9vqczgr	loadtest-client71@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 71	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siob006513qmzcxmyip2	\N	2026-02-13 18:49:56.364	2026-02-13 18:49:56.364	\N	\N	\N	\N	\N
cmll8sioe006613qmr22ynbo3	loadtest-client72@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 72	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sioe006713qmuqv41czf	\N	2026-02-13 18:49:56.366	2026-02-13 18:49:56.366	\N	\N	\N	\N	\N
cmll8siog006813qmd603ntgw	loadtest-client73@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 73	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siog006913qm95d77cqb	\N	2026-02-13 18:49:56.368	2026-02-13 18:49:56.368	\N	\N	\N	\N	\N
cmll8sioi006a13qmh3mfs39u	loadtest-client74@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 74	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sioi006b13qm9duvavkl	\N	2026-02-13 18:49:56.371	2026-02-13 18:49:56.371	\N	\N	\N	\N	\N
cmll8siol006c13qmm86wchwt	loadtest-client75@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 75	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siol006d13qmm5qs1czz	\N	2026-02-13 18:49:56.373	2026-02-13 18:49:56.373	\N	\N	\N	\N	\N
cmll8sion006e13qm4jno7kov	loadtest-client76@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 76	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sion006f13qmsbue9zwf	\N	2026-02-13 18:49:56.375	2026-02-13 18:49:56.375	\N	\N	\N	\N	\N
cmll8siop006g13qma3bf3zth	loadtest-client77@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 77	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siop006h13qm45awpfso	\N	2026-02-13 18:49:56.378	2026-02-13 18:49:56.378	\N	\N	\N	\N	\N
cmll8sior006i13qm2kshs461	loadtest-client78@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 78	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sior006j13qmabqpls8d	\N	2026-02-13 18:49:56.38	2026-02-13 18:49:56.38	\N	\N	\N	\N	\N
cmll8siot006k13qmve8yf6us	loadtest-client79@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 79	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siot006l13qmbwlfen4s	\N	2026-02-13 18:49:56.382	2026-02-13 18:49:56.382	\N	\N	\N	\N	\N
cmll8siov006m13qmye3n3omc	loadtest-client80@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 80	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siov006n13qmvlg9r0jo	\N	2026-02-13 18:49:56.384	2026-02-13 18:49:56.384	\N	\N	\N	\N	\N
cmll8sioy006o13qmm0illoc8	loadtest-client81@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 81	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sioy006p13qmg6xjsdfz	\N	2026-02-13 18:49:56.386	2026-02-13 18:49:56.386	\N	\N	\N	\N	\N
cmll8sip0006q13qmesw656wg	loadtest-client82@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 82	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sip0006r13qm5i8y1j3t	\N	2026-02-13 18:49:56.388	2026-02-13 18:49:56.388	\N	\N	\N	\N	\N
cmll8sip2006s13qmqmcxyfgf	loadtest-client83@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 83	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sip2006t13qman92ify9	\N	2026-02-13 18:49:56.39	2026-02-13 18:49:56.39	\N	\N	\N	\N	\N
cmll8sip4006u13qmosae0z8v	loadtest-client84@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 84	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sip4006v13qmn1eip9ck	\N	2026-02-13 18:49:56.393	2026-02-13 18:49:56.393	\N	\N	\N	\N	\N
cmll8sip7006w13qm711l4nis	loadtest-client85@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 85	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sip7006x13qms0ay1npu	\N	2026-02-13 18:49:56.395	2026-02-13 18:49:56.395	\N	\N	\N	\N	\N
cmll8sip9006y13qmmhsph2mk	loadtest-client86@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 86	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sip9006z13qms29fwhqr	\N	2026-02-13 18:49:56.398	2026-02-13 18:49:56.398	\N	\N	\N	\N	\N
cmll8sipb007013qmabl1lmnh	loadtest-client87@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 87	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipb007113qmi9fcbekf	\N	2026-02-13 18:49:56.4	2026-02-13 18:49:56.4	\N	\N	\N	\N	\N
cmll8sipd007213qme0fd3ais	loadtest-client88@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 88	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipd007313qmw19ytxgn	\N	2026-02-13 18:49:56.402	2026-02-13 18:49:56.402	\N	\N	\N	\N	\N
cmll8sipf007413qm6kwois3l	loadtest-client89@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 89	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipf007513qmdi6lvwzq	\N	2026-02-13 18:49:56.404	2026-02-13 18:49:56.404	\N	\N	\N	\N	\N
cmll8siph007613qmvr39yoot	loadtest-client90@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 90	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siph007713qm86hqlp2i	\N	2026-02-13 18:49:56.406	2026-02-13 18:49:56.406	\N	\N	\N	\N	\N
cmll8sipj007813qm59v3kzxr	loadtest-client91@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 91	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipj007913qmsgo8rr1w	\N	2026-02-13 18:49:56.408	2026-02-13 18:49:56.408	\N	\N	\N	\N	\N
cmll8sipl007a13qm6rh0jj2p	loadtest-client92@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 92	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipl007b13qm8j4usu67	\N	2026-02-13 18:49:56.41	2026-02-13 18:49:56.41	\N	\N	\N	\N	\N
cmll8sipo007c13qmh5ynmtgb	loadtest-client93@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 93	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipo007d13qmngsb8spt	\N	2026-02-13 18:49:56.412	2026-02-13 18:49:56.412	\N	\N	\N	\N	\N
cmll8sipq007e13qmva1klx3t	loadtest-client94@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 94	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sipq007f13qma2d18j12	\N	2026-02-13 18:49:56.415	2026-02-13 18:49:56.415	\N	\N	\N	\N	\N
cmll8sips007g13qmtdw8ia50	loadtest-client95@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 95	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sips007h13qmijmnuike	\N	2026-02-13 18:49:56.417	2026-02-13 18:49:56.417	\N	\N	\N	\N	\N
cmll8siqu007i13qmcv9z2xrl	loadtest-client96@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 96	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siqu007j13qmma2zhoun	\N	2026-02-13 18:49:56.454	2026-02-13 18:49:56.454	\N	\N	\N	\N	\N
cmll8siqy007k13qma85aonvu	loadtest-client97@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 97	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8siqy007l13qmie8ytvke	\N	2026-02-13 18:49:56.459	2026-02-13 18:49:56.459	\N	\N	\N	\N	\N
cmll8sir2007m13qm88glp8wc	loadtest-client98@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 98	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sir2007n13qmdyazzcq2	\N	2026-02-13 18:49:56.462	2026-02-13 18:49:56.462	\N	\N	\N	\N	\N
cmll8sir6007o13qm87960999	loadtest-client99@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 99	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sir6007p13qmzqebhhb8	\N	2026-02-13 18:49:56.467	2026-02-13 18:49:56.467	\N	\N	\N	\N	\N
cmll8sirb007q13qmwez71jz0	loadtest-client100@somosmoovy.com	$2b$10$ETQy6m5TReKpi8gElp9CiuyzD/QqQfhQSEx8Ew7fVzvIoOXBqx4EG	Load Test Client 100	\N	\N	\N	CLIENT	\N	\N	0	0	f	cmll8sirb007r13qm1f5xzqy8	\N	2026-02-13 18:49:56.471	2026-02-13 18:49:56.471	\N	\N	\N	\N	\N
cmkvbvo87002br0gkyyz8i0cs	cliente1@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	CLIENTE 1	\N	\N	\N	CLIENT	\N	\N	111100	0	t	cmkvbvo87002cr0gkde84ikuu	\N	2026-01-26 15:34:21.799	2026-03-09 23:27:40.392	\N	\N	\N	\N	\N
cmkvbvo7j001zr0gkayjq633k	rider1@somosmoovy.com	$2b$10$2sRvtyET8wOT/5faJpa1MeOoFi.O9oPS//UPK7L2JU/mWke7OKl9e	RIDER 1	\N	\N	\N	DRIVER	\N	/uploads/products/1771202097827-acuarela.webp	0	0	f	cmkvbvo7j0020r0gkqwydz0pt	\N	2026-01-26 15:34:21.776	2026-03-05 03:05:25.678	\N	\N	\N	\N	\N
cmmccgicu0002lw51r2qy0lcr	test.moover@somosmoovy.com	$2b$10$SbcdLFWXNuFa9XQrd3lFv.o9xJnNJrSBjK5z6AUIQEniDzppBH3Tu	Test Moover	Test	Moover	\N	USER	\N	\N	940100	0	t	MOV-R278	\N	2026-03-04 18:02:21.293	2026-03-20 13:38:10.064	\N	\N	\N	\N	\N
cmmf6jzoy0007ls5ddo24lmq3	iyadmn88@gmail.com	$2b$10$k0YxieCUqCMMiMULehELAOoH0EzjjvQudvkp7nZoUASCwqJnz7xD6	Iyad Marmoud	Iyad	Marmoud	+54 2901611605	USER	\N	\N	0	100	f	MOV-22PT	cmmf6hfcb0002ls5d0nhx3jib	2026-03-06 17:40:24.563	2026-03-06 17:40:25.214	\N	\N	\N	\N	\N
cmmf8ls5o000nls5duy2v9y9v	iyadmarmoud@gmail.com	$2b$10$TP./10L6.U.NCVicILPgqe7bboI4.2.3q8Dk1IuWgHAbPQGZt/YJ6	Katerin Marmoud	Katerin	Marmoud	+549+542901652974	MERCHANT	\N	\N	0	0	f	cmmf8ls5o000ols5dubg4rk5m	\N	2026-03-06 18:37:47.34	2026-03-06 18:37:47.34	\N	\N	\N	\N	\N
cmmf6hfcb0002ls5d0nhx3jib	maugrod@gmail.com	$2b$10$CFAoh8WybcR6wKjW.Xd67OCdGqgLwowOF0Wzse14cL/bcgPqnBGh2	Mauro Rodriguez	Mauro	Rodriguez	\N	USER	\N	\N	0	100	f	MOV-RH25	\N	2026-03-06 17:38:24.873	2026-03-06 18:44:19.215	\N	\N	\N	\N	\N
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" (id, "userId", role, "isActive", "activatedAt") FROM stdin;
cmmc3un6o0001bs8dk24e9mbu	cmkvbvo800027r0gksb401d3p	DRIVER	t	2026-03-04 14:01:24.192
cmmc3un710003bs8d5czxegdl	cmll8sigf001c13qm9pu40nkd	DRIVER	t	2026-03-04 14:01:24.205
cmmc3un760005bs8dle3ye1cp	cmll8sigl001g13qmvxjkbqor	DRIVER	t	2026-03-04 14:01:24.21
cmmc3un7c0007bs8dtgucftb3	cmll8sigt001k13qmjaa7y9lm	DRIVER	t	2026-03-04 14:01:24.217
cmmc3un7j0009bs8dohb3dhzj	cmll8sigz001o13qmxwlyyajt	DRIVER	t	2026-03-04 14:01:24.223
cmmc3un7p000bbs8dimpe0xzs	cmll8sih4001s13qmtolt4a4c	DRIVER	t	2026-03-04 14:01:24.23
cmmc3un7x000dbs8d9z6z6cow	cmll8siha001w13qm5qq1i5aq	DRIVER	t	2026-03-04 14:01:24.237
cmmc3un84000fbs8d45lsdjr3	cmll8sibt000013qm7mi6wqby	DRIVER	t	2026-03-04 14:01:24.245
cmmc3un8c000hbs8d3cpstxkr	cmll8sid3000413qmi2i1plv9	DRIVER	t	2026-03-04 14:01:24.252
cmmc3un8j000jbs8d7yo1yqiw	cmll8sidb000813qmeg8nm49u	DRIVER	t	2026-03-04 14:01:24.259
cmmc3un8p000lbs8dmedpx7hp	cmll8sidk000c13qm6iq8nspy	DRIVER	t	2026-03-04 14:01:24.265
cmmc3un8v000nbs8dipibn6vh	cmll8sidt000g13qmyv17wjq2	DRIVER	t	2026-03-04 14:01:24.272
cmmc3un91000pbs8ddcgjbhr4	cmll8sie6000k13qm4a2yizrg	DRIVER	t	2026-03-04 14:01:24.278
cmmc3un98000rbs8d07eg4a7j	cmll8sied000o13qm4islyzz4	DRIVER	t	2026-03-04 14:01:24.284
cmmc3un9d000tbs8dcrkpal8d	cmll8siel000s13qm3t04jyui	DRIVER	t	2026-03-04 14:01:24.29
cmmc3un9i000vbs8dccolidzu	cmll8sies000w13qmn1xgvuis	DRIVER	t	2026-03-04 14:01:24.294
cmmc3un9n000xbs8d65lq1w1k	cmll8sif0001013qmurb3656o	DRIVER	t	2026-03-04 14:01:24.299
cmmc3un9s000zbs8dy42ybxry	cmll8sif6001413qmj7excudw	DRIVER	t	2026-03-04 14:01:24.304
cmmc3un9x0011bs8dz25szfdf	cmll8sig7001813qmeqh3czd7	DRIVER	t	2026-03-04 14:01:24.31
cmmc3una30013bs8dlbjpcjww	cmll8sihf002013qm3zoqvghv	DRIVER	t	2026-03-04 14:01:24.315
cmmc3una70015bs8dv8ykv11k	cmll8sihk002413qmd0kdzb4y	DRIVER	t	2026-03-04 14:01:24.32
cmmc3unad0017bs8d8yomli4e	cmlbofjvu0002mqdpmdns2wmk	USER	t	2026-03-04 14:01:24.325
cmmc3unai0019bs8do21l0jj1	cmkvbvo7s0023r0gk3wyvfr2v	DRIVER	t	2026-03-04 14:01:24.33
cmmc3unao001bbs8dg3hhy1uz	cmkvbvo1d0000r0gkyait4f0l	ADMIN	t	2026-03-04 14:01:24.336
cmmc3unau001dbs8ddsdig9kx	cmkvbvo7j001zr0gkayjq633k	DRIVER	t	2026-03-04 14:01:24.342
cmmc3vwl60003o2st0asp290y	cmkvbvo8f002fr0gks60vb2et	USER	t	2026-03-04 14:02:23.035
cmmc3vwmc000ho2st7x28z4je	cmkvbvo8c002dr0gk22kda2cw	USER	t	2026-03-04 14:02:23.077
cmmc3vwoh001bo2stbog5gzz8	cmll8sihq002813qmgthzq0fb	USER	t	2026-03-04 14:02:23.153
cmmc3vwoo001do2stc4wm2848	cmll8sihx002a13qmt0imk3nq	USER	t	2026-03-04 14:02:23.16
cmmc3vwou001fo2stmjkrrp4v	cmll8sii1002c13qm525y5bk1	USER	t	2026-03-04 14:02:23.166
cmmc3vwp0001ho2sti99qk4lx	cmll8sii4002e13qma8mxj0cz	USER	t	2026-03-04 14:02:23.173
cmmc3vwpf001no2stdo0sr5df	cmkvbvo87002br0gkyyz8i0cs	USER	t	2026-03-04 14:02:23.187
cmmc3vwpp001ro2stbr521ppn	cmll8sii7002g13qmcbuj0s6f	USER	t	2026-03-04 14:02:23.198
cmmc3vwpv001to2st7i0isqdg	cmll8siig002i13qm2eclyn4a	USER	t	2026-03-04 14:02:23.203
cmmc3vwq0001vo2st9frqlf6e	cmll8siij002k13qmj7fc0551	USER	t	2026-03-04 14:02:23.209
cmmc3vwq6001xo2sth3ga9wft	cmll8siim002m13qmu28og8ka	USER	t	2026-03-04 14:02:23.215
cmmc3vwqc001zo2st0z09huwq	cmll8siir002o13qm52gewz3x	USER	t	2026-03-04 14:02:23.22
cmmc3vwqh0021o2stdk3b6zik	cmll8siiu002q13qm6xcxkbpq	USER	t	2026-03-04 14:02:23.226
cmmc3vwqn0023o2st8edmukyk	cmll8siix002s13qmzlg9a9lf	USER	t	2026-03-04 14:02:23.231
cmmc3vwqt0025o2stk3wdidy5	cmll8sij0002u13qmyeu2g4rn	USER	t	2026-03-04 14:02:23.237
cmmc3vwqy0027o2st71crh51z	cmll8sij4002w13qmux9869kb	USER	t	2026-03-04 14:02:23.243
cmmc3vwr40029o2sterm08001	cmll8sij7002y13qmtncrz1yu	USER	t	2026-03-04 14:02:23.248
cmmc3vwr9002bo2stamuufx54	cmll8sija003013qmqu46foez	USER	t	2026-03-04 14:02:23.253
cmmc3vwre002do2stic3qckd6	cmll8sijd003213qm89symr4v	USER	t	2026-03-04 14:02:23.259
cmmc3vwrk002fo2stbhl41j1f	cmll8sijg003413qmme2as4kj	USER	t	2026-03-04 14:02:23.264
cmmc3vwrp002ho2stfbltg74k	cmll8siji003613qmk6ubq3ku	USER	t	2026-03-04 14:02:23.27
cmmc3vwrv002jo2stq0gubity	cmll8sijk003813qmnp4ynr0f	USER	t	2026-03-04 14:02:23.275
cmmc3vws1002lo2stnj4f5lth	cmll8sijm003a13qmqtsc2snf	USER	t	2026-03-04 14:02:23.281
cmmc3vws7002no2stcmk5gjts	cmll8sijp003c13qm5b9jd3rw	USER	t	2026-03-04 14:02:23.287
cmmc3vwsc002po2stbdnexwvu	cmll8sijs003e13qmoxgy3wmp	USER	t	2026-03-04 14:02:23.292
cmmc3vwsh002ro2stoso3f43e	cmll8sijv003g13qm57j6l26k	USER	t	2026-03-04 14:02:23.298
cmmc3vwsn002to2st551ajeei	cmll8sijx003i13qmsd4xic08	USER	t	2026-03-04 14:02:23.303
cmmc3vwsv002vo2stqhh58s6h	cmll8sik0003k13qmxcy4neus	USER	t	2026-03-04 14:02:23.311
cmmc3vwt0002xo2steckaw43y	cmll8sik4003m13qmp0fzg3zz	USER	t	2026-03-04 14:02:23.316
cmmc3vwt6002zo2st131337o2	cmll8sik7003o13qmksdts4e9	USER	t	2026-03-04 14:02:23.322
cmmc3vwtb0031o2stmzzjjgds	cmll8sika003q13qm7c0ttf02	USER	t	2026-03-04 14:02:23.328
cmmc3vwth0033o2stsgoare3l	cmll8sikd003s13qmt89jswhl	USER	t	2026-03-04 14:02:23.333
cmmc3vwtn0035o2stxocz0a5q	cmll8sikg003u13qm8ckc5ozn	USER	t	2026-03-04 14:02:23.339
cmmc3vwts0037o2st7gn3gfuv	cmll8sikj003w13qm3wqtlp4e	USER	t	2026-03-04 14:02:23.345
cmmc3vwty0039o2stk0x4gs3n	cmll8sikm003y13qmmhuup37i	USER	t	2026-03-04 14:02:23.35
cmmc3vwu4003bo2stsihokkjr	cmll8sikq004013qmsxiie5e3	USER	t	2026-03-04 14:02:23.356
cmmc3vwu9003do2stswh1mjub	cmll8sikt004213qmfpteecch	USER	t	2026-03-04 14:02:23.362
cmmc3vwuf003fo2stpsxwwhg7	cmll8sikx004413qmywpqaa4m	USER	t	2026-03-04 14:02:23.367
cmmc3vwuk003ho2stth5msaz0	cmll8sil1004613qmz8ffwx8d	USER	t	2026-03-04 14:02:23.373
cmmc3vwup003jo2st45ru6xkh	cmll8sil4004813qmgxl0uq82	USER	t	2026-03-04 14:02:23.378
cmmc3vwuu003lo2sthrj4rdn7	cmll8sil7004a13qmwprh70xs	USER	t	2026-03-04 14:02:23.383
cmmc3vwuz003no2st20isdcsc	cmll8silb004c13qm3jb1o1is	USER	t	2026-03-04 14:02:23.387
cmmc3vwv4003po2st3ar7pik6	cmll8sile004e13qmfpzwjsyc	USER	t	2026-03-04 14:02:23.393
cmmc3vwv9003ro2stpvocps61	cmll8sili004g13qmww7g4bcq	USER	t	2026-03-04 14:02:23.398
cmmc3vwvf003to2stuny61vcr	cmll8sill004i13qmury95sow	USER	t	2026-03-04 14:02:23.403
cmmc3vwvk003vo2stniedknor	cmll8silo004k13qm7ohu9cpp	USER	t	2026-03-04 14:02:23.409
cmmc3vwvp003xo2st0t0hwpyt	cmll8silr004m13qm1ojan9al	USER	t	2026-03-04 14:02:23.413
cmmc3vwvu003zo2st4o9d7ho2	cmll8silv004o13qmrd0eb4fe	USER	t	2026-03-04 14:02:23.419
cmmc3vwvz0041o2st77vdswmf	cmll8sily004q13qmviddl8q8	USER	t	2026-03-04 14:02:23.424
cmmc3vww40043o2stl8ntzydl	cmll8sim1004s13qmwzaorqdd	USER	t	2026-03-04 14:02:23.429
cmmc3vww90045o2st4njergie	cmll8sim5004u13qm7dz2nmrd	USER	t	2026-03-04 14:02:23.434
cmmc3vwwe0047o2stotl5nyq1	cmll8sim8004w13qmr022l00e	USER	t	2026-03-04 14:02:23.439
cmmc3vwwj0049o2st28c3x0md	cmll8simb004y13qm7x0wpl4b	USER	t	2026-03-04 14:02:23.444
cmmc3vwwp004bo2sted651j8e	cmll8simf005013qma8eq3ce9	USER	t	2026-03-04 14:02:23.449
cmmc3vwwu004do2stg5s6qhb9	cmll8simi005213qmkk7ysb93	USER	t	2026-03-04 14:02:23.455
cmmc3vwx0004fo2st2uq6cxl2	cmll8simn005413qmylc6si4d	USER	t	2026-03-04 14:02:23.461
cmmc3vwx6004ho2stzke53kjb	cmll8simq005613qm7dc5ahw8	USER	t	2026-03-04 14:02:23.467
cmmc3vwxd004jo2stsfcjfo40	cmll8simt005813qm9c9c8uyn	USER	t	2026-03-04 14:02:23.473
cmmc3vwxi004lo2st3zekuf69	cmll8simx005a13qmiyp1wk1v	USER	t	2026-03-04 14:02:23.478
cmmc3vwxm004no2st9aoqukdn	cmll8sin2005c13qmln3qvqw8	USER	t	2026-03-04 14:02:23.482
cmmc3vwxq004po2stuiqx52z4	cmll8sin5005e13qm3p8xdq1m	USER	t	2026-03-04 14:02:23.486
cmmc3vwxu004ro2sty3xg83f7	cmll8sin8005g13qmut6tqpaz	USER	t	2026-03-04 14:02:23.49
cmmc3vwxy004to2stvlmxv22a	cmll8sina005i13qmz7aqilo1	USER	t	2026-03-04 14:02:23.494
cmmc3vwy2004vo2stynol3orm	cmll8sine005k13qmss9ejyh1	USER	t	2026-03-04 14:02:23.498
cmmc3vwy5004xo2stvz1dy2wy	cmll8sinh005m13qmbm4u96lz	USER	t	2026-03-04 14:02:23.502
cmmc3vwy9004zo2st7jpylaj3	cmll8sink005o13qmbrt0jja8	USER	t	2026-03-04 14:02:23.506
cmmc3vwyd0051o2stkdfcac2w	cmll8sinn005q13qmqz2ej4pw	USER	t	2026-03-04 14:02:23.51
cmmc3vwyh0053o2stkv6rpdan	cmll8sinq005s13qm0anjg40g	USER	t	2026-03-04 14:02:23.514
cmmc3vwym0055o2stse81cwwx	cmll8sint005u13qmmmh0qdam	USER	t	2026-03-04 14:02:23.518
cmmc3vwyq0057o2st2p6ronwq	cmll8sinw005w13qm3lhhev72	USER	t	2026-03-04 14:02:23.522
cmmc3vwyu0059o2stjioqf8uk	cmll8sinz005y13qmxa989eus	USER	t	2026-03-04 14:02:23.526
cmmc3vwyy005bo2stisztbmlq	cmll8sio4006013qmb4xdvym5	USER	t	2026-03-04 14:02:23.53
cmmc3vwz2005do2stptq3pina	cmll8sio8006213qmdx3qsd75	USER	t	2026-03-04 14:02:23.534
cmmc3vwz6005fo2styrypsafm	cmll8siob006413qmv9vqczgr	USER	t	2026-03-04 14:02:23.538
cmmc3vwza005ho2stj6r6ws3v	cmll8sioe006613qmr22ynbo3	USER	t	2026-03-04 14:02:23.542
cmmc3vwze005jo2st0v7toj70	cmll8siog006813qmd603ntgw	USER	t	2026-03-04 14:02:23.547
cmmc3vwzj005lo2str4olywj7	cmll8sioi006a13qmh3mfs39u	USER	t	2026-03-04 14:02:23.551
cmmc3vwzn005no2sti8i5sqwx	cmll8siol006c13qmm86wchwt	USER	t	2026-03-04 14:02:23.555
cmmc3vwzr005po2st14bf8mrb	cmll8sion006e13qm4jno7kov	USER	t	2026-03-04 14:02:23.559
cmmc3vwzu005ro2stlx76kpwv	cmll8siop006g13qma3bf3zth	USER	t	2026-03-04 14:02:23.563
cmmc3vwzz005to2stw2b4omcl	cmll8sior006i13qm2kshs461	USER	t	2026-03-04 14:02:23.567
cmmc3vx03005vo2stz614i8fr	cmll8siot006k13qmve8yf6us	USER	t	2026-03-04 14:02:23.571
cmmc3vx07005xo2stjkmzbspb	cmll8siov006m13qmye3n3omc	USER	t	2026-03-04 14:02:23.575
cmmc3vx0b005zo2stx1lkfvje	cmll8sioy006o13qmm0illoc8	USER	t	2026-03-04 14:02:23.579
cmmc3vx0f0061o2st4afuv3gc	cmll8sip0006q13qmesw656wg	USER	t	2026-03-04 14:02:23.583
cmmc3vx0j0063o2stb717pmn7	cmll8sip2006s13qmqmcxyfgf	USER	t	2026-03-04 14:02:23.588
cmmc3vx0n0065o2st9vywi1l8	cmll8sip4006u13qmosae0z8v	USER	t	2026-03-04 14:02:23.591
cmmc3vx0s0067o2stwlq5ni8z	cmll8sip7006w13qm711l4nis	USER	t	2026-03-04 14:02:23.596
cmmc3vx0w0069o2st5dfi7zrq	cmll8sip9006y13qmmhsph2mk	USER	t	2026-03-04 14:02:23.6
cmmc3vx0z006bo2stkw0d9vn2	cmll8sipb007013qmabl1lmnh	USER	t	2026-03-04 14:02:23.604
cmmc3vx13006do2sta6bcdvlk	cmll8sipd007213qme0fd3ais	USER	t	2026-03-04 14:02:23.608
cmmc3vx18006fo2stx4hbmboq	cmll8sipf007413qm6kwois3l	USER	t	2026-03-04 14:02:23.612
cmmc3vx1c006ho2st6k40nbud	cmll8siph007613qmvr39yoot	USER	t	2026-03-04 14:02:23.616
cmmc3vx1g006jo2st05n35l56	cmll8sipj007813qm59v3kzxr	USER	t	2026-03-04 14:02:23.62
cmmc3vx1k006lo2st7cbfzmxj	cmll8sipl007a13qm6rh0jj2p	USER	t	2026-03-04 14:02:23.624
cmmc3vx1p006no2stlx4bjh2m	cmll8sipo007c13qmh5ynmtgb	USER	t	2026-03-04 14:02:23.629
cmmc3vx1u006po2st6nzt08ou	cmll8sipq007e13qmva1klx3t	USER	t	2026-03-04 14:02:23.635
cmmc3vx20006ro2stebzwy458	cmll8sips007g13qmtdw8ia50	USER	t	2026-03-04 14:02:23.641
cmmc3vx27006to2stxcf10n8j	cmll8siqu007i13qmcv9z2xrl	USER	t	2026-03-04 14:02:23.647
cmmc3vx2e006vo2stqgxw07o3	cmll8siqy007k13qma85aonvu	USER	t	2026-03-04 14:02:23.654
cmmc3vx2k006xo2stsysikxsj	cmll8sir2007m13qm88glp8wc	USER	t	2026-03-04 14:02:23.66
cmmc3vx2q006zo2stq9oyqg2g	cmll8sir6007o13qm87960999	USER	t	2026-03-04 14:02:23.667
cmmc3vx2w0071o2stk0hyfnaz	cmll8sirb007q13qmwez71jz0	USER	t	2026-03-04 14:02:23.672
cmmc3wqa600019ar41iu5c2so	cmkvbvo6g001dr0gkkc3uxs3s	COMERCIO	t	2026-03-04 14:03:01.518
cmmc3wqbn000f9ar4klhkem0j	cmkvbvo3s0005r0gkpul7pexf	COMERCIO	t	2026-03-04 14:03:01.571
cmmc3wqbv000h9ar41p3zzfo9	cmkvbvo57000rr0gkp7ff55ji	COMERCIO	t	2026-03-04 14:03:01.579
cmmcbabv100017jiyv7w17tyq	cmkvbvo87002br0gkyyz8i0cs	SELLER	t	2026-03-04 17:29:33.324
cmmccgid20004lw51blc8hh0h	cmmccgicu0002lw51r2qy0lcr	USER	t	2026-03-04 18:02:21.302
cmmcd9q4o000blw51dyvmyv6q	cmmccgicu0002lw51r2qy0lcr	DRIVER	t	2026-03-04 18:25:04.393
cmmcd3uuf0006lw51yp7lo443	cmmccgicu0002lw51r2qy0lcr	SELLER	t	2026-03-04 18:20:30.568
cmmcbie9m00067jiybfbdnylk	cmkvbvo87002br0gkyyz8i0cs	DRIVER	t	2026-03-04 17:35:49.69
cmmf6hfcm0004ls5djay1r2xi	cmmf6hfcb0002ls5d0nhx3jib	USER	t	2026-03-06 17:38:24.886
cmmf6jzp30009ls5de4glbxjz	cmmf6jzoy0007ls5ddo24lmq3	USER	t	2026-03-06 17:40:24.568
cmmf6kisn000dls5dtsnbzo9z	cmmf6jzoy0007ls5ddo24lmq3	SELLER	t	2026-03-06 17:40:49.319
cmmf8km2q000lls5dvf6m9b7f	cmmf6hfcb0002ls5d0nhx3jib	SELLER	t	2026-03-06 18:36:52.802
cmmgc67ty00057kzcqwhtk18w	cmlbofjvu0002mqdpmdns2wmk	SELLER	t	2026-03-07 13:05:25.798
cmmf6kkzs000ils5dm9g2w5ml	cmmf6jzoy0007ls5ddo24lmq3	DRIVER	t	2026-03-06 17:40:52.169
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
699be6ce-51dd-4c00-a648-45dfe658eb87	36b8448f8c1663e967fb3a82dcd713f01f594f64194113653517af61309b641a	2026-01-26 15:34:16.651737+00	20260121033318_init	\N	\N	2026-01-26 15:34:16.414777+00	1
28bfdd2d-09ee-4803-9a7a-51877f74fcd2	76d3a145c52f9b3c7722940213b6e39a2f1cc0e1bbc0da9090f7dcf24c06fefc	2026-01-26 15:34:18.020115+00	20260126153417_add_driver_tracking	\N	\N	2026-01-26 15:34:17.949878+00	1
19264024-2c11-4535-9469-11d6117cecc1	9ae001d1fb584efeaf654a580150910755fe14907f5292e652a69efea12fc6b0	2026-01-26 15:56:30.634388+00	20260126155630_add_geolocation_logistics	\N	\N	2026-01-26 15:56:30.615414+00	1
d82e8862-edf6-4ca5-be0b-863031b082dc	030aaad821f6fbc8f67fab5255abcc5db0b612e37d5482900d65a9d7bff7d9e4	2026-03-04 14:22:25.620639+00	20260304111500_add_multi_role_system		\N	2026-03-04 14:22:25.620639+00	0
6aa0d589-2cb2-4ac1-b752-e8146d86fe55	6c8a5dd94a2284b98b9025dfb146598f1575c8172301caae15dcd36b3283917e	2026-03-04 15:45:27.939387+00	20260206140659_init		\N	2026-03-04 15:45:27.939387+00	0
e94c3c1c-321f-485e-9e72-d84966d89d58	2af9c627494e3f7dcbc600e84f0e1becaa0f5a1702fed5dbf73c3d5fd5a7681f	2026-03-04 15:45:36.223039+00	20260304153000_add_seller_profile_and_listings		\N	2026-03-04 15:45:36.223039+00	0
9a4e8a91-6cf8-484b-8b93-74a65d705ca4	e41f5031853c4fb0fd7b4a03c90765c2cf5326166373f1ed5877707e4e7f3c0a	2026-03-04 17:00:38.03278+00	20260304165800_add_suborder_multi_vendor		\N	2026-03-04 17:00:38.03278+00	0
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
-- Name: AssignmentLog AssignmentLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssignmentLog"
    ADD CONSTRAINT "AssignmentLog_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


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
-- Name: DeliveryRate DeliveryRate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryRate"
    ADD CONSTRAINT "DeliveryRate_pkey" PRIMARY KEY (id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: HeroSlide HeroSlide_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HeroSlide"
    ADD CONSTRAINT "HeroSlide_pkey" PRIMARY KEY (id);


--
-- Name: ListingImage ListingImage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListingImage"
    ADD CONSTRAINT "ListingImage_pkey" PRIMARY KEY (id);


--
-- Name: Listing Listing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_pkey" PRIMARY KEY (id);


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
-- Name: MoovyConfig MoovyConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MoovyConfig"
    ADD CONSTRAINT "MoovyConfig_pkey" PRIMARY KEY (id);


--
-- Name: MpWebhookLog MpWebhookLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MpWebhookLog"
    ADD CONSTRAINT "MpWebhookLog_pkey" PRIMARY KEY (id);


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
-- Name: PackageCategory PackageCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PackageCategory"
    ADD CONSTRAINT "PackageCategory_pkey" PRIMARY KEY (id);


--
-- Name: PackagePricingTier PackagePricingTier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PackagePricingTier"
    ADD CONSTRAINT "PackagePricingTier_pkey" PRIMARY KEY (id);


--
-- Name: PackagePurchase PackagePurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PackagePurchase"
    ADD CONSTRAINT "PackagePurchase_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PendingAssignment PendingAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PendingAssignment"
    ADD CONSTRAINT "PendingAssignment_pkey" PRIMARY KEY (id);


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
-- Name: PushSubscription PushSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_pkey" PRIMARY KEY (id);


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
-- Name: SellerAvailability SellerAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SellerAvailability"
    ADD CONSTRAINT "SellerAvailability_pkey" PRIMARY KEY (id);


--
-- Name: SellerProfile SellerProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SellerProfile"
    ADD CONSTRAINT "SellerProfile_pkey" PRIMARY KEY (id);


--
-- Name: StoreSettings StoreSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StoreSettings"
    ADD CONSTRAINT "StoreSettings_pkey" PRIMARY KEY (id);


--
-- Name: SubOrder SubOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubOrder"
    ADD CONSTRAINT "SubOrder_pkey" PRIMARY KEY (id);


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
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


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
-- Name: AssignmentLog_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AssignmentLog_driverId_idx" ON public."AssignmentLog" USING btree ("driverId");


--
-- Name: AssignmentLog_notifiedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AssignmentLog_notifiedAt_idx" ON public."AssignmentLog" USING btree ("notifiedAt");


--
-- Name: AssignmentLog_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AssignmentLog_orderId_idx" ON public."AssignmentLog" USING btree ("orderId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


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
-- Name: DeliveryRate_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeliveryRate_categoryId_key" ON public."DeliveryRate" USING btree ("categoryId");


--
-- Name: Driver_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_isActive_idx" ON public."Driver" USING btree ("isActive");


--
-- Name: Driver_isOnline_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_isOnline_idx" ON public."Driver" USING btree ("isOnline");


--
-- Name: Driver_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Driver_userId_key" ON public."Driver" USING btree ("userId");


--
-- Name: Favorite_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Favorite_userId_idx" ON public."Favorite" USING btree ("userId");


--
-- Name: Favorite_userId_listingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON public."Favorite" USING btree ("userId", "listingId");


--
-- Name: Favorite_userId_merchantId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Favorite_userId_merchantId_key" ON public."Favorite" USING btree ("userId", "merchantId");


--
-- Name: Favorite_userId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON public."Favorite" USING btree ("userId", "productId");


--
-- Name: Listing_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_categoryId_idx" ON public."Listing" USING btree ("categoryId");


--
-- Name: Listing_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_isActive_idx" ON public."Listing" USING btree ("isActive");


--
-- Name: Listing_sellerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_sellerId_idx" ON public."Listing" USING btree ("sellerId");


--
-- Name: MerchantAcquiredProduct_merchantId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MerchantAcquiredProduct_merchantId_productId_key" ON public."MerchantAcquiredProduct" USING btree ("merchantId", "productId");


--
-- Name: MerchantCategory_merchantId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MerchantCategory_merchantId_categoryId_key" ON public."MerchantCategory" USING btree ("merchantId", "categoryId");


--
-- Name: Merchant_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_isActive_idx" ON public."Merchant" USING btree ("isActive");


--
-- Name: Merchant_mpUserId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Merchant_mpUserId_key" ON public."Merchant" USING btree ("mpUserId");


--
-- Name: Merchant_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_ownerId_idx" ON public."Merchant" USING btree ("ownerId");


--
-- Name: Merchant_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Merchant_slug_key" ON public."Merchant" USING btree (slug);


--
-- Name: MoovyConfig_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MoovyConfig_key_key" ON public."MoovyConfig" USING btree (key);


--
-- Name: MpWebhookLog_eventId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MpWebhookLog_eventId_key" ON public."MpWebhookLog" USING btree ("eventId");


--
-- Name: MpWebhookLog_resourceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MpWebhookLog_resourceId_idx" ON public."MpWebhookLog" USING btree ("resourceId");


--
-- Name: OrderBackup_backupName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderBackup_backupName_idx" ON public."OrderBackup" USING btree ("backupName");


--
-- Name: OrderBackup_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderBackup_deletedAt_idx" ON public."OrderBackup" USING btree ("deletedAt");


--
-- Name: OrderBackup_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderBackup_orderId_idx" ON public."OrderBackup" USING btree ("orderId");


--
-- Name: OrderItem_listingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_listingId_idx" ON public."OrderItem" USING btree ("listingId");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_deletedAt_idx" ON public."Order" USING btree ("deletedAt");


--
-- Name: Order_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_driverId_idx" ON public."Order" USING btree ("driverId");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: PackageCategory_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PackageCategory_name_key" ON public."PackageCategory" USING btree (name);


--
-- Name: PackagePurchase_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PackagePurchase_merchantId_idx" ON public."PackagePurchase" USING btree ("merchantId");


--
-- Name: PackagePurchase_mpExternalRef_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PackagePurchase_mpExternalRef_idx" ON public."PackagePurchase" USING btree ("mpExternalRef");


--
-- Name: PackagePurchase_mpExternalRef_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PackagePurchase_mpExternalRef_key" ON public."PackagePurchase" USING btree ("mpExternalRef");


--
-- Name: PackagePurchase_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PackagePurchase_paymentStatus_idx" ON public."PackagePurchase" USING btree ("paymentStatus");


--
-- Name: Payment_mpPaymentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_mpPaymentId_idx" ON public."Payment" USING btree ("mpPaymentId");


--
-- Name: Payment_mpPaymentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON public."Payment" USING btree ("mpPaymentId");


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: PendingAssignment_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PendingAssignment_expiresAt_idx" ON public."PendingAssignment" USING btree ("expiresAt");


--
-- Name: PendingAssignment_orderId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PendingAssignment_orderId_key" ON public."PendingAssignment" USING btree ("orderId");


--
-- Name: PendingAssignment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PendingAssignment_status_idx" ON public."PendingAssignment" USING btree (status);


--
-- Name: ProductCategory_productId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductCategory_productId_categoryId_key" ON public."ProductCategory" USING btree ("productId", "categoryId");


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: PushSubscription_endpoint_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON public."PushSubscription" USING btree (endpoint);


--
-- Name: PushSubscription_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PushSubscription_userId_idx" ON public."PushSubscription" USING btree ("userId");


--
-- Name: Referral_refereeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Referral_refereeId_key" ON public."Referral" USING btree ("refereeId");


--
-- Name: SavedCart_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SavedCart_userId_key" ON public."SavedCart" USING btree ("userId");


--
-- Name: SellerAvailability_sellerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SellerAvailability_sellerId_key" ON public."SellerAvailability" USING btree ("sellerId");


--
-- Name: SellerProfile_mpUserId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SellerProfile_mpUserId_key" ON public."SellerProfile" USING btree ("mpUserId");


--
-- Name: SellerProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SellerProfile_userId_key" ON public."SellerProfile" USING btree ("userId");


--
-- Name: SubOrder_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_merchantId_idx" ON public."SubOrder" USING btree ("merchantId");


--
-- Name: SubOrder_sellerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_sellerId_idx" ON public."SubOrder" USING btree ("sellerId");


--
-- Name: SubOrder_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_status_idx" ON public."SubOrder" USING btree (status);


--
-- Name: UserRole_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserRole_userId_idx" ON public."UserRole" USING btree ("userId");


--
-- Name: UserRole_userId_role_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserRole_userId_role_key" ON public."UserRole" USING btree ("userId", role);


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
-- Name: AssignmentLog AssignmentLog_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssignmentLog"
    ADD CONSTRAINT "AssignmentLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssignmentLog AssignmentLog_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssignmentLog"
    ADD CONSTRAINT "AssignmentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: DeliveryRate DeliveryRate_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryRate"
    ADD CONSTRAINT "DeliveryRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."PackageCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Driver Driver_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ListingImage ListingImage_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ListingImage"
    ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listing Listing_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Listing Listing_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."SellerProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: OrderItem OrderItem_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_subOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES public."SubOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: PackagePurchase PackagePurchase_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PackagePurchase"
    ADD CONSTRAINT "PackagePurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PackagePurchase PackagePurchase_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PackagePurchase"
    ADD CONSTRAINT "PackagePurchase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PendingAssignment PendingAssignment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PendingAssignment"
    ADD CONSTRAINT "PendingAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: Product Product_packageCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_packageCategoryId_fkey" FOREIGN KEY ("packageCategoryId") REFERENCES public."PackageCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PushSubscription PushSubscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: SellerAvailability SellerAvailability_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SellerAvailability"
    ADD CONSTRAINT "SellerAvailability_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SellerProfile SellerProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SellerProfile"
    ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubOrder SubOrder_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubOrder"
    ADD CONSTRAINT "SubOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubOrder SubOrder_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubOrder"
    ADD CONSTRAINT "SubOrder_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubOrder SubOrder_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubOrder"
    ADD CONSTRAINT "SubOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubOrder SubOrder_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SubOrder"
    ADD CONSTRAINT "SubOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."SellerProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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


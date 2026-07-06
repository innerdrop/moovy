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
    'SKIPPED',
    'CANCELLED_BY_DRIVER'
);


ALTER TYPE public."AssignmentOutcomeEnum" OWNER TO postgres;

--
-- Name: DeliveryStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliveryStatus" AS ENUM (
    'DRIVER_ASSIGNED',
    'DRIVER_ARRIVED',
    'PICKED_UP',
    'DELIVERED',
    'FAILED_DELIVERY'
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
-- Name: AdPlacement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdPlacement" (
    id text NOT NULL,
    "merchantId" text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    amount double precision NOT NULL,
    "originalAmount" double precision,
    currency text DEFAULT 'ARS'::text NOT NULL,
    "paymentStatus" text DEFAULT 'pending'::text NOT NULL,
    "paymentMethod" text,
    "mpPreferenceId" text,
    "mpPaymentId" text,
    "mpExternalRef" text,
    notes text,
    "adminNotes" text,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "activatedAt" timestamp(3) without time zone
);


ALTER TABLE public."AdPlacement" OWNER TO postgres;

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
-- Name: AdminNote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminNote" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "adminId" text NOT NULL,
    content text NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AdminNote" OWNER TO postgres;

--
-- Name: AssignmentLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AssignmentLog" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "subOrderId" text,
    "driverId" text NOT NULL,
    "attemptNumber" integer DEFAULT 1 NOT NULL,
    "notifiedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "respondedAt" timestamp(3) without time zone,
    outcome public."AssignmentOutcomeEnum" DEFAULT 'ACCEPTED'::public."AssignmentOutcomeEnum" NOT NULL,
    "distanceKm" double precision,
    "cancelReason" text
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
-- Name: Bid; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bid" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "userId" text NOT NULL,
    amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Bid" OWNER TO postgres;

--
-- Name: BroadcastCampaign; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BroadcastCampaign" (
    id text NOT NULL,
    name text NOT NULL,
    channel text NOT NULL,
    "segmentId" text NOT NULL,
    "templateId" text,
    "customTitle" text,
    "customBody" text,
    "customUrl" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "totalRecipients" integer DEFAULT 0 NOT NULL,
    "sentCount" integer DEFAULT 0 NOT NULL,
    "failedCount" integer DEFAULT 0 NOT NULL,
    "lastCursor" text,
    "createdBy" text NOT NULL,
    "lastError" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BroadcastCampaign" OWNER TO postgres;

--
-- Name: CannedResponse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CannedResponse" (
    id text NOT NULL,
    shortcut text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CannedResponse" OWNER TO postgres;

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
    scope text DEFAULT 'BOTH'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "allowIndividualPurchase" boolean DEFAULT true NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    "starterPrice" double precision,
    "isStarter" boolean DEFAULT false NOT NULL,
    "isPackageAvailable" boolean DEFAULT true NOT NULL,
    "parentId" text,
    icon text
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: ConfigAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConfigAuditLog" (
    id text NOT NULL,
    "adminUserId" text NOT NULL,
    "adminEmail" text DEFAULT ''::text NOT NULL,
    "configType" text NOT NULL,
    "fieldChanged" text NOT NULL,
    "oldValue" text DEFAULT ''::text NOT NULL,
    "newValue" text DEFAULT ''::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConfigAuditLog" OWNER TO postgres;

--
-- Name: ConsentLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConsentLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "consentType" text NOT NULL,
    version text NOT NULL,
    action text DEFAULT 'ACCEPT'::text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    details text,
    "acceptedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ConsentLog" OWNER TO postgres;

--
-- Name: Coupon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Coupon" (
    id text NOT NULL,
    code text NOT NULL,
    description text,
    "discountType" text DEFAULT 'PERCENTAGE'::text NOT NULL,
    "discountValue" double precision NOT NULL,
    "maxDiscountAmount" double precision,
    "minOrderAmount" double precision,
    "maxUses" integer,
    "maxUsesPerUser" integer DEFAULT 1 NOT NULL,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "validFrom" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Coupon" OWNER TO postgres;

--
-- Name: CouponUsage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CouponUsage" (
    id text NOT NULL,
    "couponId" text NOT NULL,
    "userId" text NOT NULL,
    "orderId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CouponUsage" OWNER TO postgres;

--
-- Name: CronRunLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CronRunLog" (
    id text NOT NULL,
    "jobName" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    success boolean DEFAULT false NOT NULL,
    "durationMs" integer,
    "itemsProcessed" integer,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CronRunLog" OWNER TO postgres;

--
-- Name: DeliveryAttempt; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryAttempt" (
    id text NOT NULL,
    "orderId" text,
    "subOrderId" text,
    "driverId" text NOT NULL,
    reason text NOT NULL,
    "photoUrl" text,
    notes text,
    "gpsLat" double precision,
    "gpsLng" double precision,
    "gpsAccuracy" double precision,
    "distanceMeters" double precision,
    "waitedSeconds" integer,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DeliveryAttempt" OWNER TO postgres;

--
-- Name: DeliveryRate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryRate" (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    "basePriceArs" double precision NOT NULL,
    "pricePerKmArs" double precision NOT NULL,
    "consumptionPerKm" double precision DEFAULT 0.0339875,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryRate" OWNER TO postgres;

--
-- Name: DeliveryZone; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryZone" (
    id text NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#22c55e'::text NOT NULL,
    multiplier double precision DEFAULT 1.0 NOT NULL,
    "driverBonus" integer DEFAULT 0 NOT NULL,
    polygon public.geometry(Polygon,4326),
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DeliveryZone" OWNER TO postgres;

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
    cuit text,
    "constanciaCuitUrl" text,
    "licenciaUrl" text,
    "seguroUrl" text,
    "vtvUrl" text,
    "cedulaVerdeUrl" text,
    "dniFrenteUrl" text,
    "dniDorsoUrl" text,
    "cuitStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "cuitApprovedAt" timestamp(3) without time zone,
    "cuitRejectionReason" text,
    "cuitApprovalSource" text,
    "cuitApprovalNote" text,
    "constanciaCuitStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "constanciaCuitApprovedAt" timestamp(3) without time zone,
    "constanciaCuitRejectionReason" text,
    "constanciaCuitApprovalSource" text,
    "constanciaCuitApprovalNote" text,
    "dniFrenteStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "dniFrenteApprovedAt" timestamp(3) without time zone,
    "dniFrenteRejectionReason" text,
    "dniFrenteApprovalSource" text,
    "dniFrenteApprovalNote" text,
    "dniDorsoStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "dniDorsoApprovedAt" timestamp(3) without time zone,
    "dniDorsoRejectionReason" text,
    "dniDorsoApprovalSource" text,
    "dniDorsoApprovalNote" text,
    "licenciaStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "licenciaApprovedAt" timestamp(3) without time zone,
    "licenciaRejectionReason" text,
    "licenciaApprovalSource" text,
    "licenciaApprovalNote" text,
    "seguroStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "seguroApprovedAt" timestamp(3) without time zone,
    "seguroRejectionReason" text,
    "seguroApprovalSource" text,
    "seguroApprovalNote" text,
    "vtvStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "vtvApprovedAt" timestamp(3) without time zone,
    "vtvRejectionReason" text,
    "vtvApprovalSource" text,
    "vtvApprovalNote" text,
    "cedulaVerdeStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "cedulaVerdeApprovedAt" timestamp(3) without time zone,
    "cedulaVerdeRejectionReason" text,
    "cedulaVerdeApprovalSource" text,
    "cedulaVerdeApprovalNote" text,
    "licenciaExpiresAt" timestamp(3) without time zone,
    "licenciaNotifiedStage" integer DEFAULT 0 NOT NULL,
    "seguroExpiresAt" timestamp(3) without time zone,
    "seguroNotifiedStage" integer DEFAULT 0 NOT NULL,
    "vtvExpiresAt" timestamp(3) without time zone,
    "vtvNotifiedStage" integer DEFAULT 0 NOT NULL,
    "cedulaVerdeExpiresAt" timestamp(3) without time zone,
    "cedulaVerdeNotifiedStage" integer DEFAULT 0 NOT NULL,
    "acceptedTermsAt" timestamp(3) without time zone,
    "acceptedPrivacyAt" timestamp(3) without time zone,
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
    "approvalStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "applicationStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "pausedByUserAt" timestamp(3) without time zone,
    "pausedByUserReason" text,
    "cancelledByUserAt" timestamp(3) without time zone,
    "cancelledByUserReason" text,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    ubicacion public.geography,
    "fraudScore" integer DEFAULT 0 NOT NULL,
    "lastFraudCheckAt" timestamp(3) without time zone,
    "bankCbu" text,
    "bankAlias" text,
    "bankAccountUpdatedAt" timestamp(3) without time zone,
    "hasThermalBag" boolean DEFAULT false NOT NULL,
    "hasColdStorage" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Driver" OWNER TO postgres;

--
-- Name: DriverAvailabilitySubscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DriverAvailabilitySubscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "merchantId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "notifiedAt" timestamp(3) without time zone
);


ALTER TABLE public."DriverAvailabilitySubscription" OWNER TO postgres;

--
-- Name: DriverDocumentChangeRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DriverDocumentChangeRequest" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "documentField" text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "resolutionNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DriverDocumentChangeRequest" OWNER TO postgres;

--
-- Name: DriverLocationHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DriverLocationHistory" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "orderId" text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    accuracy double precision,
    speed double precision,
    heading double precision,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DriverLocationHistory" OWNER TO postgres;

--
-- Name: EmailTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmailTemplate" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    "bodyHtml" text NOT NULL,
    placeholders text,
    category text DEFAULT 'transactional'::text NOT NULL,
    recipient text DEFAULT 'comprador'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "lastEditedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmailTemplate" OWNER TO postgres;

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
-- Name: FeatureFlag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FeatureFlag" (
    id text NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    description text,
    scope text NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastToggledByUserId" text,
    "lastToggledAt" timestamp(3) without time zone
);


ALTER TABLE public."FeatureFlag" OWNER TO postgres;

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
    "imageDesktop" text,
    "imageMobile" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HeroSlide" OWNER TO postgres;

--
-- Name: HomeCategorySlot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HomeCategorySlot" (
    id text NOT NULL,
    "categoryId" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    image text,
    icon text,
    label text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HomeCategorySlot" OWNER TO postgres;

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
    "weightKg" double precision,
    "lengthCm" double precision,
    "widthCm" double precision,
    "heightCm" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "categoryId" text,
    "listingType" text DEFAULT 'DIRECT'::text NOT NULL,
    "auctionEndsAt" timestamp(3) without time zone,
    "auctionDuration" integer,
    "startingPrice" double precision,
    "bidIncrement" double precision,
    "currentBid" double precision,
    "currentBidderId" text,
    "totalBids" integer DEFAULT 0 NOT NULL,
    "auctionStatus" text,
    "auctionWinnerId" text,
    "winnerPaymentDeadline" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "deletedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "scheduleEnabled" boolean DEFAULT false NOT NULL,
    "scheduleJson" text,
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
    "allowPickup" boolean DEFAULT false NOT NULL,
    cuit text,
    "constanciaAfipUrl" text,
    "habilitacionMunicipalUrl" text,
    "registroSanitarioUrl" text,
    "cuitStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "cuitApprovedAt" timestamp(3) without time zone,
    "cuitRejectionReason" text,
    "cuitApprovalSource" text,
    "cuitApprovalNote" text,
    "bankAccountStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "bankAccountApprovedAt" timestamp(3) without time zone,
    "bankAccountRejectionReason" text,
    "bankAccountApprovalSource" text,
    "bankAccountApprovalNote" text,
    "constanciaAfipStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "constanciaAfipApprovedAt" timestamp(3) without time zone,
    "constanciaAfipRejectionReason" text,
    "constanciaAfipApprovalSource" text,
    "constanciaAfipApprovalNote" text,
    "habilitacionMunicipalStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "habilitacionMunicipalApprovedAt" timestamp(3) without time zone,
    "habilitacionMunicipalRejectionReason" text,
    "habilitacionMunicipalApprovalSource" text,
    "habilitacionMunicipalApprovalNote" text,
    "registroSanitarioStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "registroSanitarioApprovedAt" timestamp(3) without time zone,
    "registroSanitarioRejectionReason" text,
    "registroSanitarioApprovalSource" text,
    "registroSanitarioApprovalNote" text,
    "acceptedTermsAt" timestamp(3) without time zone,
    "acceptedPrivacyAt" timestamp(3) without time zone,
    category text DEFAULT 'Otro'::text,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    rating double precision,
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
    "mpAccessToken" text,
    "mpRefreshToken" text,
    "mpUserId" text,
    "mpEmail" text,
    "mpLinkedAt" timestamp(3) without time zone,
    "approvalStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "applicationStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "pausedByUserAt" timestamp(3) without time zone,
    "pausedByUserReason" text,
    "cancelledByUserAt" timestamp(3) without time zone,
    "cancelledByUserReason" text,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "commissionOverride" double precision,
    "commissionOverrideReason" text,
    ubicacion public.geography,
    "loyaltyTier" text DEFAULT 'BRONCE'::text NOT NULL,
    "loyaltyTierLocked" boolean DEFAULT false NOT NULL,
    "loyaltyOrderCount" integer DEFAULT 0 NOT NULL,
    "loyaltyUpdatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "firstOrderWelcomeSentAt" timestamp(3) without time zone
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
-- Name: MerchantDocumentChangeRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MerchantDocumentChangeRequest" (
    id text NOT NULL,
    "merchantId" text NOT NULL,
    "documentField" text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "resolutionNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MerchantDocumentChangeRequest" OWNER TO postgres;

--
-- Name: MerchantLoyaltyConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MerchantLoyaltyConfig" (
    id text NOT NULL,
    tier text NOT NULL,
    "minOrdersPerMonth" integer NOT NULL,
    "commissionRate" double precision NOT NULL,
    "badgeText" text NOT NULL,
    "badgeColor" text DEFAULT 'gray'::text NOT NULL,
    "benefitsJson" text DEFAULT '{}'::text NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MerchantLoyaltyConfig" OWNER TO postgres;

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
    "isPickup" boolean DEFAULT false NOT NULL,
    "distanceKm" double precision,
    "deliveryNotes" text,
    "estimatedTime" integer,
    "driverId" text,
    "deliveryStatus" public."DeliveryStatus",
    "deliveredAt" timestamp(3) without time zone,
    "deliveryPhoto" text,
    "customerNotes" text,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cancelReason" text,
    "commissionPaid" boolean DEFAULT false NOT NULL,
    "pointsEarned" integer,
    "pointsUsed" integer,
    "pickupPin" text,
    "pickupPinVerifiedAt" timestamp(3) without time zone,
    "pickupPinAttempts" integer DEFAULT 0 NOT NULL,
    "deliveryPin" text,
    "deliveryPinVerifiedAt" timestamp(3) without time zone,
    "deliveryPinAttempts" integer DEFAULT 0 NOT NULL,
    "failedDeliveryAt" timestamp(3) without time zone,
    "failedDeliveryReason" text,
    "nearDestinationNotified" boolean DEFAULT false NOT NULL,
    "driverRating" integer,
    "merchantPayout" double precision DEFAULT 0,
    "moovyCommission" double precision DEFAULT 0,
    "ratedAt" timestamp(3) without time zone,
    "rateReminderSentAt" timestamp(3) without time zone,
    "ratingComment" text,
    "merchantRating" integer,
    "merchantRatingComment" text,
    "sellerRating" integer,
    "sellerRatingComment" text,
    "driverRatingModerationStatus" text DEFAULT 'AUTO_APPROVED'::text NOT NULL,
    "driverRatingReportCount" integer DEFAULT 0 NOT NULL,
    "merchantRatingModerationStatus" text DEFAULT 'AUTO_APPROVED'::text NOT NULL,
    "merchantRatingReportCount" integer DEFAULT 0 NOT NULL,
    "sellerRatingModerationStatus" text DEFAULT 'AUTO_APPROVED'::text NOT NULL,
    "sellerRatingReportCount" integer DEFAULT 0 NOT NULL,
    "driverTipMethod" text,
    "driverTipAmount" double precision,
    "driverTipDeclaredAt" timestamp(3) without time zone,
    "assignmentAttempts" integer DEFAULT 0 NOT NULL,
    "assignmentExpiresAt" timestamp(3) without time zone,
    "attemptedDriverIds" jsonb,
    "lastAssignmentAt" timestamp(3) without time zone,
    "pendingDriverId" text,
    "driverSearchUntil" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "mpPreferenceId" text,
    "mpPaymentId" text,
    "mpMerchantOrderId" text,
    "mpStatus" text,
    "paidAt" timestamp(3) without time zone,
    "isMultiVendor" boolean DEFAULT false NOT NULL,
    "deliveryType" public."DeliveryType" DEFAULT 'IMMEDIATE'::public."DeliveryType" NOT NULL,
    "scheduledSlotStart" timestamp(3) without time zone,
    "scheduledSlotEnd" timestamp(3) without time zone,
    "scheduledConfirmedAt" timestamp(3) without time zone,
    "couponCode" text,
    "merchantStatus" text DEFAULT 'PREPARING'::text,
    "driverStatus" text DEFAULT 'ASSIGNED'::text,
    "waitingStartedAt" timestamp(3) without time zone,
    "noShowReportedAt" timestamp(3) without time zone,
    "payoutHoldUntil" timestamp(3) without time zone,
    "noShowFlag" boolean DEFAULT false NOT NULL
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
-- Name: OrderChat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderChat" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "subOrderId" text,
    "chatType" text NOT NULL,
    "participantAId" text NOT NULL,
    "participantBId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrderChat" OWNER TO postgres;

--
-- Name: OrderChatMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderChatMessage" (
    id text NOT NULL,
    "chatId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderChatMessage" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text,
    "listingId" text,
    name text NOT NULL,
    price double precision NOT NULL,
    quantity integer NOT NULL,
    "variantName" text,
    subtotal double precision NOT NULL,
    "subOrderId" text,
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
-- Name: PayoutBatch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayoutBatch" (
    id text NOT NULL,
    "batchType" text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "itemCount" integer DEFAULT 0 NOT NULL,
    "csvPath" text,
    "generatedBy" text NOT NULL,
    "paidBy" text,
    "paidAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PayoutBatch" OWNER TO postgres;

--
-- Name: PayoutItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayoutItem" (
    id text NOT NULL,
    "batchId" text NOT NULL,
    "recipientType" text NOT NULL,
    "recipientId" text NOT NULL,
    "recipientName" text NOT NULL,
    "bankAccount" text,
    cuit text,
    amount double precision NOT NULL,
    "ordersIncluded" text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PayoutItem" OWNER TO postgres;

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
-- Name: PlaybookChecklist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlaybookChecklist" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text DEFAULT 'onboarding'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlaybookChecklist" OWNER TO postgres;

--
-- Name: PlaybookStep; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlaybookStep" (
    id text NOT NULL,
    "checklistId" text NOT NULL,
    content text NOT NULL,
    "order" integer NOT NULL,
    required boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlaybookStep" OWNER TO postgres;

--
-- Name: PointsConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PointsConfig" (
    id text DEFAULT 'points_config'::text NOT NULL,
    "pointsPerDollar" double precision DEFAULT 0.01 NOT NULL,
    "minPurchaseForPoints" double precision DEFAULT 0 NOT NULL,
    "pointsValue" double precision DEFAULT 1 NOT NULL,
    "minPointsToRedeem" integer DEFAULT 500 NOT NULL,
    "maxDiscountPercent" double precision DEFAULT 20 NOT NULL,
    "signupBonus" integer DEFAULT 1000 NOT NULL,
    "referralBonus" integer DEFAULT 1000 NOT NULL,
    "reviewBonus" integer DEFAULT 25 NOT NULL,
    "pointsExpireDays" integer,
    "refereeBonus" integer DEFAULT 500 NOT NULL,
    "minPurchaseForBonus" double precision DEFAULT 5000 NOT NULL,
    "minReferralPurchase" double precision DEFAULT 8000 NOT NULL,
    "tierWindowDays" integer DEFAULT 90 NOT NULL,
    "tierConfigJson" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "earnBoostMultiplier" double precision DEFAULT 1 NOT NULL,
    "earnBoostUntil" timestamp(3) without time zone
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
-- Name: PreLaunchLead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PreLaunchLead" (
    id text NOT NULL,
    role text NOT NULL,
    name text,
    email text NOT NULL,
    whatsapp text,
    consent boolean DEFAULT false NOT NULL,
    "consentAt" timestamp(3) without time zone,
    "ipAddress" text,
    "userAgent" text,
    source text DEFAULT 'landing'::text,
    contacted boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PreLaunchLead" OWNER TO postgres;

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
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "deletedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "packageCategoryId" text,
    "weightGrams" integer,
    "volumeMl" integer
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
-- Name: ProductWeightCache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductWeightCache" (
    id text NOT NULL,
    "nameHash" text NOT NULL,
    "nameSample" text NOT NULL,
    "weightGrams" integer NOT NULL,
    "volumeMl" integer NOT NULL,
    "packageCategoryId" text,
    "suggestedVehicle" text,
    source text NOT NULL,
    confidence integer DEFAULT 100 NOT NULL,
    "hitCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProductWeightCache" OWNER TO postgres;

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
-- Name: RatingReport; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RatingReport" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "reporterUserId" text NOT NULL,
    target text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    resolution text
);


ALTER TABLE public."RatingReport" OWNER TO postgres;

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
    "reminderCount" integer DEFAULT 0 NOT NULL,
    "lastRemindedAt" timestamp(3) without time zone,
    "recoveredAt" timestamp(3) without time zone,
    "cartValue" double precision DEFAULT 0 NOT NULL,
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
    cuit text,
    "acceptedTermsAt" timestamp(3) without time zone,
    "acceptedPrivacyAt" timestamp(3) without time zone,
    "bankAlias" text,
    "bankCbu" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "applicationStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "pausedByUserAt" timestamp(3) without time zone,
    "pausedByUserReason" text,
    "cancelledByUserAt" timestamp(3) without time zone,
    "cancelledByUserReason" text,
    "totalSales" integer DEFAULT 0 NOT NULL,
    rating double precision,
    "commissionRate" double precision DEFAULT 12 NOT NULL,
    "mpAccessToken" text,
    "mpRefreshToken" text,
    "mpUserId" text,
    "mpEmail" text,
    "mpLinkedAt" timestamp(3) without time zone,
    "isOnline" boolean DEFAULT false NOT NULL,
    "isPaused" boolean DEFAULT false NOT NULL,
    "pauseEndsAt" timestamp(3) without time zone,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "preparationMinutes" integer DEFAULT 15 NOT NULL,
    "scheduleEnabled" boolean DEFAULT false NOT NULL,
    "scheduleJson" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "fuelPricePerLiter" double precision DEFAULT 1591 NOT NULL,
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
    "heroSliderEnabled" boolean DEFAULT true NOT NULL,
    "heroSliderInterval" integer DEFAULT 5000 NOT NULL,
    "heroSliderShowArrows" boolean DEFAULT true NOT NULL,
    "supportChatEnabled" boolean DEFAULT true NOT NULL,
    "promoBannerButtonLink" text DEFAULT '/productos?categoria=pizzas'::text NOT NULL,
    "promoBannerButtonText" text DEFAULT 'Ver locales'::text NOT NULL,
    "promoBannerEnabled" boolean DEFAULT true NOT NULL,
    "promoBannerImage" text,
    "promoBannerSubtitle" text DEFAULT '2x1 en locales seleccionados de 20hs a 23hs.'::text NOT NULL,
    "promoBannerTitle" text DEFAULT 'Noches de
Pizza & Pelis'::text NOT NULL,
    "promoBannerCtaPosition" text DEFAULT 'abajo-izquierda'::text NOT NULL,
    "promoSlidesJson" text DEFAULT '[]'::text NOT NULL,
    "riderCommissionPercent" double precision DEFAULT 80 NOT NULL,
    "zoneMultipliersJson" text DEFAULT '{"ZONA_A":1.0,"ZONA_B":1.15,"ZONA_C":1.35}'::text NOT NULL,
    "climateMultipliersJson" text DEFAULT '{"normal":1.0,"lluvia_leve":1.15,"temporal_fuerte":1.30}'::text NOT NULL,
    "activeClimateCondition" text DEFAULT 'normal'::text NOT NULL,
    "demandMultipliersJson" text DEFAULT '{"normal":1.0,"alta":1.20,"pico":1.40}'::text NOT NULL,
    "activeDemandCondition" text DEFAULT 'normal'::text NOT NULL,
    "operationalCostPercent" double precision DEFAULT 5 NOT NULL,
    "excludedZonesJson" text DEFAULT '[]'::text NOT NULL,
    "defaultMerchantCommission" double precision DEFAULT 10 NOT NULL,
    "defaultSellerCommission" double precision DEFAULT 10 NOT NULL,
    "mpReservePercent" double precision DEFAULT 8 NOT NULL,
    "cashMpOnlyDeliveries" integer DEFAULT 10 NOT NULL,
    "cashLimitL1" double precision DEFAULT 15000 NOT NULL,
    "cashLimitL2" double precision DEFAULT 25000 NOT NULL,
    "cashLimitL3" double precision DEFAULT 40000 NOT NULL,
    "maxOrdersPerSlot" integer DEFAULT 15 NOT NULL,
    "slotDurationMinutes" integer DEFAULT 120 NOT NULL,
    "minAnticipationHours" double precision DEFAULT 1.5 NOT NULL,
    "maxAnticipationHours" double precision DEFAULT 48 NOT NULL,
    "operatingHoursStart" text DEFAULT '09:00'::text NOT NULL,
    "operatingHoursEnd" text DEFAULT '22:00'::text NOT NULL,
    "merchantConfirmTimeoutSec" integer DEFAULT 300 NOT NULL,
    "driverResponseTimeoutSec" integer DEFAULT 60 NOT NULL,
    "adPricePlatino" double precision DEFAULT 150000 NOT NULL,
    "adPriceDestacado" double precision DEFAULT 95000 NOT NULL,
    "adPricePremium" double precision DEFAULT 55000 NOT NULL,
    "adPriceHeroBanner" double precision DEFAULT 250000 NOT NULL,
    "adPriceBannerPromo" double precision DEFAULT 180000 NOT NULL,
    "adPriceProducto" double precision DEFAULT 25000 NOT NULL,
    "adLaunchDiscountPercent" double precision DEFAULT 50 NOT NULL,
    "adMaxHeroBannerSlots" integer DEFAULT 3 NOT NULL,
    "adMaxDestacadosSlots" integer DEFAULT 8 NOT NULL,
    "adMaxProductosSlots" integer DEFAULT 12 NOT NULL,
    "adMinDurationDays" integer DEFAULT 7 NOT NULL,
    "adDiscount3Months" integer DEFAULT 10 NOT NULL,
    "adDiscount6Months" integer DEFAULT 20 NOT NULL,
    "adPaymentMethods" text DEFAULT '["mercadopago","transferencia"]'::text NOT NULL,
    "adCancellation48hFullRefund" boolean DEFAULT true NOT NULL,
    "adCancellationAdminFeePercent" integer DEFAULT 10 NOT NULL,
    "heroBackgroundsJson" text DEFAULT '{}'::text NOT NULL,
    "bankName" text DEFAULT ''::text NOT NULL,
    "bankAccountHolder" text DEFAULT ''::text NOT NULL,
    "bankCbu" text DEFAULT ''::text NOT NULL,
    "bankAlias" text DEFAULT ''::text NOT NULL,
    "bankCuit" text DEFAULT ''::text NOT NULL
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
    "tripCost" double precision,
    "operationalCost" double precision,
    "driverPayoutAmount" double precision,
    "merchantCommissionRate" double precision,
    "merchantCommissionSource" text,
    "zoneCode" text,
    "zoneMultiplier" double precision,
    "zoneDriverBonus" integer,
    "paymentStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "deliveryStatus" public."DeliveryStatus",
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
    "payoutStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "paidOutAt" timestamp(3) without time zone,
    "pickupPin" text,
    "pickupPinVerifiedAt" timestamp(3) without time zone,
    "pickupPinAttempts" integer DEFAULT 0 NOT NULL,
    "deliveryPin" text,
    "deliveryPinVerifiedAt" timestamp(3) without time zone,
    "deliveryPinAttempts" integer DEFAULT 0 NOT NULL,
    "failedDeliveryAt" timestamp(3) without time zone,
    "failedDeliveryReason" text,
    "nearDestinationNotified" boolean DEFAULT false NOT NULL,
    "merchantStatus" text DEFAULT 'PREPARING'::text,
    "driverStatus" text DEFAULT 'ASSIGNED'::text,
    "waitingStartedAt" timestamp(3) without time zone,
    "noShowReportedAt" timestamp(3) without time zone,
    "payoutHoldUntil" timestamp(3) without time zone,
    "noShowFlag" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."SubOrder" OWNER TO postgres;

--
-- Name: SupportChat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportChat" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "merchantId" text,
    "operatorId" text,
    subject text,
    category text,
    status text DEFAULT 'waiting'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    rating integer,
    "ratingComment" text,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
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
    "isSystem" boolean DEFAULT false NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "attachmentUrl" text,
    "attachmentType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SupportMessage" OWNER TO postgres;

--
-- Name: SupportOperator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SupportOperator" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "displayName" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "maxChats" integer DEFAULT 5 NOT NULL,
    "lastSeenAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportOperator" OWNER TO postgres;

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
    "privacyConsentAt" timestamp(3) without time zone,
    "termsConsentAt" timestamp(3) without time zone,
    "privacyConsentVersion" text,
    "termsConsentVersion" text,
    "age18Confirmed" boolean DEFAULT false NOT NULL,
    "marketingConsent" boolean DEFAULT false NOT NULL,
    "marketingConsentAt" timestamp(3) without time zone,
    "marketingConsentRevokedAt" timestamp(3) without time zone,
    "cookiesConsent" text,
    "cookiesConsentAt" timestamp(3) without time zone,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "archivedAt" timestamp(3) without time zone,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "loginLockedUntil" timestamp(3) without time zone,
    "onboardingCompletedAt" timestamp(3) without time zone,
    "pointsExpiryNotifiedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserActivityLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserActivityLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "entityType" text,
    "entityId" text,
    metadata text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserActivityLog" OWNER TO postgres;

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
-- Name: UserSegment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSegment" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    filters text NOT NULL,
    "lastCount" integer,
    "lastCountAt" timestamp(3) without time zone,
    "createdBy" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserSegment" OWNER TO postgres;

--
-- Data for Name: AdPlacement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdPlacement" (id, "merchantId", type, status, "startsAt", "endsAt", amount, "originalAmount", currency, "paymentStatus", "paymentMethod", "mpPreferenceId", "mpPaymentId", "mpExternalRef", notes, "adminNotes", "rejectionReason", "createdAt", "updatedAt", "approvedAt", "activatedAt") FROM stdin;
\.


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Address" (id, "userId", label, street, number, apartment, neighborhood, city, province, "zipCode", latitude, longitude, "isDefault", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmqz5vwoc00gaxhd8v0vglrcm	cmqz5vwo300g5xhd8ok66ryk2	Casa	Onas	250	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8078	-68.3098	t	2026-06-29 11:55:53.772	2026-06-29 11:55:53.772	\N
cmqz5vwwy00ggxhd88dx3zolb	cmqz5vwws00gbxhd8xdblt14z	Casa	Deloqui	500	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8035	-68.3012	t	2026-06-29 11:55:54.082	2026-06-29 11:55:54.082	\N
cmqz5vx5w00gmxhd8vmbf5m8b	cmqz5vx5l00ghxhd8xnar59ix	Casa	Yaganes	300	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8092	-68.307	t	2026-06-29 11:55:54.404	2026-06-29 11:55:54.404	\N
cmr40aqu3000cmh52en2nv1mx	cmqz5vwfh00fzxhd8bchmmyw5	Prueba Comprador	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-07-02 21:18:19.227	2026-07-02 21:30:39.295	2026-07-02 21:30:39.294
cmqz5vwfn00g4xhd871muduw0	cmqz5vwfh00fzxhd8bchmmyw5	Casa	Paseo de la Plaza	2065		\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-06-29 11:55:53.459	2026-07-02 21:30:54.653	\N
\.


--
-- Data for Name: AdminNote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminNote" (id, "userId", "adminId", content, pinned, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssignmentLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AssignmentLog" (id, "orderId", "subOrderId", "driverId", "attemptNumber", "notifiedAt", "respondedAt", outcome, "distanceKm", "cancelReason") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, action, "entityType", "entityId", "userId", details, "createdAt") FROM stdin;
cmr2x7l1s001yz9sq62jky10w	EMAIL_TEMPLATE_SEEDED	EmailTemplate	bulk	cmqz5vqsx0000xhd86fq6wm5d	{"created":69,"skipped":0,"totalInRegistry":69,"errors":[]}	2026-07-02 03:04:06.736
\.


--
-- Data for Name: Bid; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bid" (id, "listingId", "userId", amount, "createdAt") FROM stdin;
\.


--
-- Data for Name: BroadcastCampaign; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BroadcastCampaign" (id, name, channel, "segmentId", "templateId", "customTitle", "customBody", "customUrl", status, "scheduledAt", "startedAt", "completedAt", "totalRecipients", "sentCount", "failedCount", "lastCursor", "createdBy", "lastError", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CannedResponse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CannedResponse" (id, shortcut, title, content, category, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "userId", "productId", quantity, "variantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, slug, description, image, "isActive", "order", scope, "createdAt", "updatedAt", "allowIndividualPurchase", price, "starterPrice", "isStarter", "isPackageAvailable", "parentId", icon) FROM stdin;
cmqz5vqwu000gxhd8quylpbyn	Restaurante	restaurante	\N	\N	t	1	STORE	2026-06-29 11:55:46.302	2026-06-29 11:55:46.302	t	0	\N	f	t	\N	\N
cmqz5vqx1000hxhd86j3rab6t	Pizzería	pizzeria	\N	\N	t	2	STORE	2026-06-29 11:55:46.31	2026-06-29 11:55:46.31	t	0	\N	f	t	\N	\N
cmqz5vqxd000ixhd8e2wu3ki0	Hamburguesería	hamburgueseria	\N	\N	t	3	STORE	2026-06-29 11:55:46.322	2026-06-29 11:55:46.322	t	0	\N	f	t	\N	\N
cmqz5vqxu000jxhd856aalwvq	Parrilla	parrilla	\N	\N	t	4	STORE	2026-06-29 11:55:46.339	2026-06-29 11:55:46.339	t	0	\N	f	t	\N	\N
cmqz5vqxz000kxhd8glc5szfn	Cafetería	cafeteria	\N	\N	t	5	STORE	2026-06-29 11:55:46.344	2026-06-29 11:55:46.344	t	0	\N	f	t	\N	\N
cmqz5vqy3000lxhd8hcaqu9dk	Panadería	panaderia	\N	\N	t	6	STORE	2026-06-29 11:55:46.348	2026-06-29 11:55:46.348	t	0	\N	f	t	\N	\N
cmqz5vqy9000mxhd84i6y95uu	Farmacia	farmacia	\N	\N	t	7	STORE	2026-06-29 11:55:46.353	2026-06-29 11:55:46.353	t	0	\N	f	t	\N	\N
cmqz5vqyf000nxhd8rnn283uf	Supermercado	supermercado	\N	\N	t	8	STORE	2026-06-29 11:55:46.36	2026-06-29 11:55:46.36	t	0	\N	f	t	\N	\N
cmqz5vqyn000oxhd8fpc7qxgz	Kiosco	kiosco	\N	\N	t	9	STORE	2026-06-29 11:55:46.368	2026-06-29 11:55:46.368	t	0	\N	f	t	\N	\N
cmqz5vqyv000pxhd8lec7u05x	Verdulería	verduleria	\N	\N	t	10	STORE	2026-06-29 11:55:46.375	2026-06-29 11:55:46.375	t	0	\N	f	t	\N	\N
cmqz5vqz1000qxhd87idexjyt	Carnicería	carniceria	\N	\N	t	11	STORE	2026-06-29 11:55:46.381	2026-06-29 11:55:46.381	t	0	\N	f	t	\N	\N
cmqz5vqz8000rxhd8i92g71fs	Otro	otro	\N	\N	t	99	BOTH	2026-06-29 11:55:46.388	2026-06-29 11:55:46.388	t	0	\N	f	t	\N	\N
cmqz5vqzf000sxhd8ommos2gv	Electrónica	electronica	\N	\N	t	1	MARKETPLACE	2026-06-29 11:55:46.395	2026-06-29 11:55:46.395	t	0	\N	f	t	\N	\N
cmqz5vqzl000txhd8b3j5zwws	Ropa y Calzado	ropa-calzado	\N	\N	t	2	MARKETPLACE	2026-06-29 11:55:46.401	2026-06-29 11:55:46.401	t	0	\N	f	t	\N	\N
cmqz5vqzt000uxhd8ime07uc9	Hogar y Jardín	hogar-jardin	\N	\N	t	3	MARKETPLACE	2026-06-29 11:55:46.409	2026-06-29 11:55:46.409	t	0	\N	f	t	\N	\N
cmqz5vr07000vxhd8dvyam1ju	Deportes	deportes	\N	\N	t	4	MARKETPLACE	2026-06-29 11:55:46.424	2026-06-29 11:55:46.424	t	0	\N	f	t	\N	\N
cmqz5vr0e000wxhd871dqy12g	Juguetes	juguetes	\N	\N	t	5	MARKETPLACE	2026-06-29 11:55:46.43	2026-06-29 11:55:46.43	t	0	\N	f	t	\N	\N
cmqz5vr0i000xxhd8lsjz1e47	Libros y Música	libros-musica	\N	\N	t	6	MARKETPLACE	2026-06-29 11:55:46.435	2026-06-29 11:55:46.435	t	0	\N	f	t	\N	\N
cmqz5vr0m000yxhd8gfimq465	Mascotas	mascotas	\N	\N	t	7	MARKETPLACE	2026-06-29 11:55:46.439	2026-06-29 11:55:46.439	t	0	\N	f	t	\N	\N
cmqz5vr0q000zxhd8p3tglvrd	Artesanías	artesanias	\N	\N	t	9	MARKETPLACE	2026-06-29 11:55:46.443	2026-06-29 11:55:46.443	t	0	\N	f	t	\N	\N
\.


--
-- Data for Name: ConfigAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConfigAuditLog" (id, "adminUserId", "adminEmail", "configType", "fieldChanged", "oldValue", "newValue", "createdAt") FROM stdin;
\.


--
-- Data for Name: ConsentLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConsentLog" (id, "userId", "consentType", version, action, "ipAddress", "userAgent", details, "acceptedAt") FROM stdin;
\.


--
-- Data for Name: Coupon; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Coupon" (id, code, description, "discountType", "discountValue", "maxDiscountAmount", "minOrderAmount", "maxUses", "maxUsesPerUser", "usedCount", "isActive", "validFrom", "validUntil", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CouponUsage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CouponUsage" (id, "couponId", "userId", "orderId", "createdAt") FROM stdin;
\.


--
-- Data for Name: CronRunLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CronRunLog" (id, "jobName", "startedAt", "completedAt", success, "durationMs", "itemsProcessed", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: DeliveryAttempt; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryAttempt" (id, "orderId", "subOrderId", "driverId", reason, "photoUrl", notes, "gpsLat", "gpsLng", "gpsAccuracy", "distanceMeters", "waitedSeconds", "startedAt", "endedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: DeliveryRate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryRate" (id, "categoryId", "basePriceArs", "pricePerKmArs", "consumptionPerKm", "isActive", "createdAt", "updatedAt") FROM stdin;
cmqz5vr1r0016xhd8f6bn02x1	cmqz5vr1f0014xhd83erjqolw	1600	90	0	t	2026-06-29 11:55:46.479	2026-07-01 17:36:59.628
cmqz5vr230019xhd8yor90shy	cmqz5vr1z0017xhd8k68fpeuc	1600	90	0	t	2026-06-29 11:55:46.491	2026-07-01 17:36:59.638
cmqz5vr29001cxhd8fc542du8	cmqz5vr26001axhd8t5ik06rv	1800	130	0	t	2026-06-29 11:55:46.497	2026-07-01 17:36:59.642
cmqz5vr2l001fxhd8347sr8h9	cmqz5vr2g001dxhd8t1c3c19v	2600	190	0	t	2026-06-29 11:55:46.509	2026-07-01 17:36:59.647
cmqz5vr2t001ixhd8y6u4ev1q	cmqz5vr2o001gxhd8q3y0ks8l	6500	300	0	t	2026-06-29 11:55:46.518	2026-07-01 17:36:59.652
\.


--
-- Data for Name: DeliveryZone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryZone" (id, name, color, multiplier, "driverBonus", polygon, "isActive", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Driver" (id, "userId", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor", "licensePlate", cuit, "constanciaCuitUrl", "licenciaUrl", "seguroUrl", "vtvUrl", "cedulaVerdeUrl", "dniFrenteUrl", "dniDorsoUrl", "cuitStatus", "cuitApprovedAt", "cuitRejectionReason", "cuitApprovalSource", "cuitApprovalNote", "constanciaCuitStatus", "constanciaCuitApprovedAt", "constanciaCuitRejectionReason", "constanciaCuitApprovalSource", "constanciaCuitApprovalNote", "dniFrenteStatus", "dniFrenteApprovedAt", "dniFrenteRejectionReason", "dniFrenteApprovalSource", "dniFrenteApprovalNote", "dniDorsoStatus", "dniDorsoApprovedAt", "dniDorsoRejectionReason", "dniDorsoApprovalSource", "dniDorsoApprovalNote", "licenciaStatus", "licenciaApprovedAt", "licenciaRejectionReason", "licenciaApprovalSource", "licenciaApprovalNote", "seguroStatus", "seguroApprovedAt", "seguroRejectionReason", "seguroApprovalSource", "seguroApprovalNote", "vtvStatus", "vtvApprovedAt", "vtvRejectionReason", "vtvApprovalSource", "vtvApprovalNote", "cedulaVerdeStatus", "cedulaVerdeApprovedAt", "cedulaVerdeRejectionReason", "cedulaVerdeApprovalSource", "cedulaVerdeApprovalNote", "licenciaExpiresAt", "licenciaNotifiedStage", "seguroExpiresAt", "seguroNotifiedStage", "vtvExpiresAt", "vtvNotifiedStage", "cedulaVerdeExpiresAt", "cedulaVerdeNotifiedStage", "acceptedTermsAt", "acceptedPrivacyAt", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt", "availabilityStatus", "lastLocationAt", latitude, longitude, "approvalStatus", "approvedAt", "rejectionReason", "applicationStatus", "pausedByUserAt", "pausedByUserReason", "cancelledByUserAt", "cancelledByUserReason", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", ubicacion, "fraudScore", "lastFraudCheckAt", "bankCbu", "bankAlias", "bankAccountUpdatedAt", "hasThermalBag", "hasColdStorage") FROM stdin;
cmqz5vvmq00fixhd8msq0bruf	cmqz5vvmh00fbxhd84xtx2cxu	AUTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	0	\N	\N	t	t	0	\N	2026-06-29 11:55:52.419	2026-06-29 11:55:52.419	DISPONIBLE	\N	-54.8081	-68.3105	APPROVED	\N	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	0101000020E61000001D5A643BDF1351C0E5F21FD26F674BC0	0	\N	\N	\N	\N	f	f
cmqz5vvwp00fqxhd8jpelcna7	cmqz5vvwa00fjxhd8xtqudcev	BIKE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	0	\N	\N	t	t	0	\N	2026-06-29 11:55:52.777	2026-06-29 11:55:52.777	DISPONIBLE	\N	-54.804	-68.3001	APPROVED	\N	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	0101000020E6100000E561A1D6341351C0F4FDD478E9664BC0	0	\N	\N	\N	\N	f	f
cmqz5vw6r00fyxhd8xrpu2gkp	cmqz5vw6e00frxhd8xzbnhvi3	MOTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	0	\N	\N	t	t	0	\N	2026-06-29 11:55:53.139	2026-06-29 11:55:53.139	DISPONIBLE	\N	-54.81	-68.3082	APPROVED	\N	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	0101000020E610000024287E8CB91351C048E17A14AE674BC0	0	\N	\N	\N	\N	f	f
cmqz5vval00faxhd8b67o5uhl	cmqz5vva600f3xhd89zcsytov	MOTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	\N	0	\N	0	\N	0	\N	0	\N	\N	t	f	0	\N	2026-06-29 11:55:51.981	2026-06-29 12:11:45.399	FUERA_DE_SERVICIO	2026-06-29 12:22:28.771	-54.83194472593177	-68.35038533658037	APPROVED	\N	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	0101000020E610000015679EB66C1651C073FA2E2A7D6A4BC0	0	\N	\N	\N	\N	f	f
\.


--
-- Data for Name: DriverAvailabilitySubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DriverAvailabilitySubscription" (id, "userId", latitude, longitude, "merchantId", "createdAt", "expiresAt", "notifiedAt") FROM stdin;
\.


--
-- Data for Name: DriverDocumentChangeRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DriverDocumentChangeRequest" (id, "driverId", "documentField", reason, status, "resolvedAt", "resolvedBy", "resolutionNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DriverLocationHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DriverLocationHistory" (id, "driverId", "orderId", latitude, longitude, accuracy, speed, heading, "timestamp", "createdAt") FROM stdin;
\.


--
-- Data for Name: EmailTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmailTemplate" (id, key, name, subject, "bodyHtml", placeholders, category, recipient, "isActive", version, "lastEditedBy", "createdAt", "updatedAt") FROM stdin;
cmr2x7kmn0000z9sqkdyij3t0	welcome	Bienvenida comprador	¡Bienvenido a MOOVY! 🎉	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n                <h2 style="color: #111827; margin-top: 0;">¡Hola María López! 👋</h2>\n                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                    ¡Bienvenido a la comunidad MOOVY! Ya podés empezar a disfrutar de todos los beneficios.\n                </p>\n                <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">\n                    <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px;">⭐ Tu código de referido</h3>\n                    <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">MARIA2026</p>\n                    <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Compartílo y gana puntos MOOVER cuando tus amigos compren</p>\n                </div>\n                <h3 style="color: #111827; font-size: 16px; margin-top: 25px;">¿Qué podés hacer con MOOVY?</h3>\n                <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">\n                    <li>🛍️ <strong>Comprar</strong> en comercios locales</li>\n                    <li>🚀 <strong>Recibir</strong> tus pedidos en minutos</li>\n                    <li>⭐ <strong>Sumar puntos MOOVER</strong> con cada compra</li>\n                    <li>🎁 <strong>Canjear</strong> tus puntos por descuentos exclusivos</li>\n                    <li>👥 <strong>Referir amigos</strong> y ganar más puntos</li>\n                </ul>\n                \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Empezar a comprar\n        </a>\n    </div>\n            \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.191	2026-07-02 03:04:06.191
cmr2x7knj0001z9sqtutn0bbw	order_confirmation	Pedido confirmado	Tu pedido #MOV-20260320-001 está confirmado 🛍️	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n                <div style="text-align: center; margin-bottom: 25px;">\n                    <div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Confirmado</div>\n                    <h2 style="color: #111827; margin-top: 0;">¡Gracias por tu compra, María López!</h2>\n                    <p style="color: #6b7280; font-size: 16px;">Recibimos tu pedido <strong>#MOV-20260320-001</strong> y ya estamos trabajando en él.</p>\n                </div>\n                <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                    <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 15px;">Resumen del Pedido</h3>\n                    <table style="width: 100%; border-collapse: collapse;">\n                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">Hamburguesa clásica<div style="font-size: 12px; color: #a0aec0;">x2</div></td><td style="text-align: right; color: #2d3748; font-weight: 500;">$2.400</td></tr>\n                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">Coca-Cola 500ml<div style="font-size: 12px; color: #a0aec0;">x2</div></td><td style="text-align: right; color: #2d3748; font-weight: 500;">$1.400</td></tr>\n                    </table>\n                    <table style="width: 100%; margin-top: 15px;">\n                        <tr><td style="color: #718096; font-size: 14px;">Subtotal</td><td style="text-align: right; color: #2d3748;">$3.800</td></tr>\n                        <tr><td style="color: #718096; font-size: 14px;">Envío</td><td style="text-align: right; color: #2d3748;">$500</td></tr>\n                        <tr><td style="color: #e53e3e; font-size: 14px;">Descuento</td><td style="text-align: right; color: #e53e3e;">-$200</td></tr>\n                        <tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding-top: 15px;">$4.500</td></tr>\n                    </table>\n                </div>\n                \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver estado de mi pedido\n        </a>\n    </div>\n            \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.223	2026-07-02 03:04:06.223
cmr2x7knt0002z9sqztfhqva2	password_reset	Recuperar contraseña	Restablecer contraseña - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Restablecer contraseña</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Recibimos una solicitud para restablecer tu contraseña.\n                Hacé click en el botón de abajo para crear una nueva contraseña.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="#"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Restablecer Contraseña\n        </a>\n    </div>\n            <p style="color: #9ca3af; font-size: 14px;">\n                Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, podés ignorar este correo.\n            </p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.233	2026-07-02 03:04:06.233
cmr2x7ko20003z9sqtyjf6pfd	password_changed	Contraseña cambiada	Tu contraseña fue modificada - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Contraseña actualizada</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu contraseña fue cambiada exitosamente el <strong>20/03/2026 a las 14:30</strong>.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">\n                <p style="margin: 0; font-size: 14px;">\n                    <strong>¿No fuiste vos?</strong> Si no realizaste este cambio, contactá a soporte inmediatamente.\n                </p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.243	2026-07-02 03:04:06.243
cmr2x7kog0004z9sqj0xxc8uf	driver_request_admin	Solicitud repartidor (→ admin)	🚗 Nueva solicitud de repartidor	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de repartidor</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Un usuario quiere ser repartidor en MOOVY:</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 5px 0; color: #4a5568;"><strong>Nombre:</strong> Carlos Gómez</p>\n                <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> carlos@ejemplo.com</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/repartidores"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.256	2026-07-02 03:04:06.256
cmr2x7kos0005z9sqfqy8liva	driver_approved	Repartidor aprobado	🎉 ¡Tu solicitud de repartidor fue aprobada!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">¡Bienvenido al equipo, Carlos Gómez! 🚗</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu solicitud para ser repartidor MOOVY fue <strong style="color: #059669;">aprobada</strong>.\n                Ya podés conectarte desde tu panel y empezar a recibir pedidos.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel de repartidor\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.268	2026-07-02 03:04:06.268
cmr2x7koz0006z9sqnpvdjxwu	merchant_request_received	Solicitud de comercio recibida	📋 Recibimos tu solicitud de comercio - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud Recibida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Hola Juan Pérez!</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Recibimos tu solicitud para registrar <strong>Panadería Don Juan</strong> en MOOVY.\n                Nuestro equipo va a revisar tu información y documentación en las próximas 24-48 horas hábiles.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">¿Qué sigue?</h4>\n                <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">\n                    <li>Verificamos tu documentación fiscal y legal</li>\n                    <li>Revisamos que la información de tu comercio esté completa</li>\n                    <li>Te notificamos por email si tu tienda fue aprobada</li>\n                </ol>\n            </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.275	2026-07-02 03:04:06.275
cmr2x7kp90007z9squnnjygpw	merchant_approved	Tienda aprobada	🎉 ¡Tu comercio fue aprobado en MOOVY!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">¡Aprobada!</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Felicitaciones, Juan Pérez! 🎉</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu comercio <strong>Panadería Don Juan</strong> fue <strong style="color: #059669;">aprobado</strong> y ya está activo en MOOVY.\n            </p>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><strong>Tu primer mes es sin comisión (0%).</strong> Empezá a vender y quedáte con todo lo que facturás durante los primeros 30 días.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir a mi panel de comercio\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.286	2026-07-02 03:04:06.286
cmr2x7kpg0008z9squbq4cknd	merchant_rejected	Tienda rechazada	📋 Actualización sobre tu solicitud de comercio - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud No Aprobada</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Hola Juan Pérez</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos informarte que la solicitud de tu comercio <strong>Panadería Don Juan</strong> no pudo ser aprobada en este momento.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Documentación fiscal incompleta. Falta constancia de inscripción AFIP.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.292	2026-07-02 03:04:06.292
cmr2x7kpo0009z9sq0nyrta0b	driver_request_received	Solicitud de repartidor recibida	📋 Recibimos tu solicitud de repartidor - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud Recibida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Hola Carlos Gómez!</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Recibimos tu solicitud para ser repartidor MOOVY con <strong>Moto</strong>. Nuestro equipo va a revisar tu documentación en las próximas 24-48 horas hábiles.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;"><li>DNI (frente y dorso)</li><li>Licencia de conducir</li><li>Seguro del vehículo</li><li>Datos fiscales (CUIT)</li></ul></div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.301	2026-07-02 03:04:06.301
cmr2x7kpv000az9sq62fz2g25	driver_rejected	Repartidor rechazado	📋 Actualización sobre tu solicitud de repartidor - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud No Aprobada</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Hola Carlos Gómez</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos informarte que tu solicitud para ser repartidor en MOOVY no pudo ser aprobada.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Licencia de conducir vencida. Por favor renovála y volvé a postularte.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.308	2026-07-02 03:04:06.308
cmr2x7kq5000bz9sq18hptexb	seller_activated	Vendedor activado (Bienvenida marketplace)	Tu perfil de vendedor está activo — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #ede9fe; color: #5b21b6; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Marketplace activo</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Bienvenido al marketplace, Ana Martínez</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu perfil de vendedor <strong>Las Vasijas de Ana</strong> ya está activo en MOOVY. A partir de ahora podés publicar productos o servicios en el marketplace y empezar a vender entre vecinos de Ushuaia.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <h4 style="color: #4a5568; margin: 0 0 12px 0; font-size: 14px;">Primeros pasos:</h4>\n                <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">\n                    <li>Publicá tu primera publicación con foto, precio y descripción</li>\n                    <li>Configurá tu disponibilidad y horarios</li>\n                    <li>Cargá tu CBU o alias bancario para recibir los pagos</li>\n                    <li>Revisá los Términos para Vendedores (comisión 12%)</li>\n                </ol>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/vendedor"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel de vendedor\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	vendedor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.317	2026-07-02 03:04:06.317
cmr2x7kqd000cz9sqkq9l2b36	payment_pending	Pago pendiente	⏳ Pago pendiente - Pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pago Pendiente</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pago está en proceso, María López</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Recibimos tu pedido <strong>#MOV-20260320-001</strong> pero el pago aún está pendiente de confirmación.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px;">$4.500</td></tr></table></div>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>No te preocupes.</strong> Te avisaremos apenas se acredite.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.325	2026-07-02 03:04:06.325
cmr2x7kql000dz9sqjfg3hjm7	payment_rejected	Pago rechazado	Tu pago no se pudo procesar — Pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pago Rechazado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pago no pudo ser procesado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola María López, el pago de tu pedido <strong>#MOV-20260320-001</strong> por <strong style="color: #e60012;">$4.500</strong> fue rechazado.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Fondos insuficientes</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Reintentar compra\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.334	2026-07-02 03:04:06.334
cmr2x7kqt000ez9sqhammvrko	order_rejected_merchant	Pedido rechazado por comercio	No pudimos completar tu pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Rechazado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado por el comercio</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola María López, <strong>Panadería Don Juan</strong> no pudo aceptar tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Producto sin stock temporalmente</p></div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> Se te devolverán <strong>$4.500</strong> automáticamente.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Hacer otro pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.341	2026-07-02 03:04:06.341
cmr2x7kr0000fz9sqb4x5f4cp	order_delivered	Pedido entregado	✅ ¡Tu pedido #MOV-20260320-001 fue entregado!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">¡Entregado!</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Tu pedido llegó! 🎉</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu pedido <strong>#MOV-20260320-001</strong> por <strong>$4.500</strong> fue entregado exitosamente. Tiempo de entrega: <strong>32 minutos</strong>.</p>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;">⭐ <strong>¿Cómo fue tu experiencia?</strong> Tu calificación nos ayuda a mejorar.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Calificar pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.348	2026-07-02 03:04:06.348
cmr2x7kr7000gz9sqg6s1xgv2	order_cancelled_buyer	Pedido cancelado por comprador	Pedido #MOV-20260320-001 cancelado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #f3f4f6; color: #4b5563; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Cancelado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Cancelaste tu pedido</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos la cancelación de tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $4.500 serán devueltos a tu medio de pago. Puede demorar entre 2 y 10 días hábiles.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Volver a la tienda\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.355	2026-07-02 03:04:06.355
cmr2x7krd000hz9sqv7amhqh7	order_cancelled_merchant	Pedido cancelado por comercio	📋 Tu pedido #MOV-20260320-001 fue cancelado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Cancelado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Panadería Don Juan canceló tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Local cerrado por emergencia</p></div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $4.500 serán devueltos.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Hacer otro pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.362	2026-07-02 03:04:06.362
cmr2x7krk000iz9sq13q6ncgg	order_cancelled_system	Pedido cancelado por sistema	Cancelamos tu pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Cancelado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Cancelamos tu pedido</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos avisarte que tuvimos que cancelar tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> El comercio no respondió dentro del tiempo límite.</p></div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $4.500 serán devueltos.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Reintentar pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.369	2026-07-02 03:04:06.369
cmr2x7krq000jz9sqmg5z0eg6	refund_processed	Reembolso procesado	💸 Reembolso procesado - Pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Reembolso Procesado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu reembolso fue procesado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos el reembolso de tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px;">Monto</td><td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px;">$4.500</td></tr><tr><td style="color: #718096; font-size: 14px;">Medio</td><td style="text-align: right; color: #2d3748;">MercadoPago</td></tr></table></div>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;">El reembolso puede demorar entre <strong>2 y 10 días hábiles</strong>.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mis pedidos\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.375	2026-07-02 03:04:06.375
cmr2x7krx000kz9sqyryvzkp9	merchant_new_order	Nuevo pedido recibido (comercio)	🔔 Nuevo pedido #MOV-20260320-001 - $4.500	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🔔 Nuevo Pedido</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Tenés un nuevo pedido!</h2>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td><td style="text-align: right; color: #2d3748; font-weight: bold;">#MOV-20260320-001</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Cliente</td><td style="text-align: right; color: #2d3748;">María López</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Productos</td><td style="text-align: right; color: #2d3748;">3 items</td></tr><tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding-top: 15px;">$4.500</td></tr></table></div>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>⏰ Importante:</strong> Aceptá o rechazá el pedido lo antes posible.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver pedido en mi panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.382	2026-07-02 03:04:06.382
cmr2x7ks4000lz9sqbtse8h99	merchant_order_reminder	Recordatorio pedido sin aceptar	⚠️ ¡Pedido #MOV-20260320-001 esperando tu respuesta!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">⚠️ Pedido Sin Respuesta</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tenés un pedido pendiente de aceptar</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">El pedido <strong>#MOV-20260320-001</strong> lleva <strong>8 minutos</strong> sin respuesta. Si no lo aceptás en los próximos <strong>7 minutos</strong>, se cancelará automáticamente.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px; font-weight: bold;">⏰ Tiempo restante: 7 minutos</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Aceptar pedido ahora\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.388	2026-07-02 03:04:06.388
cmr2x7ksa000mz9sqxy0r7vwp	merchant_payment_received	Pago recibido (comercio)	💰 Pago recibido por pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">💰 Pago Recibido</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Recibiste un pago!</h2>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td><td style="text-align: right; color: #2d3748; font-weight: 500;">#MOV-20260320-001</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Monto bruto</td><td style="text-align: right; color: #2d3748;">$4.500</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Comisión MOOVY</td><td style="text-align: right; color: #ef4444;">-$360</td></tr><tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Neto a cobrar</td><td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px; padding-top: 15px;">$3.640</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios/pagos"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mis ganancias\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.394	2026-07-02 03:04:06.394
cmr2x7ksf000nz9sqj2bckt2n	merchant_suspended	Tienda suspendida	⚠️ Tu comercio fue suspendido - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Tienda Suspendida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu tienda fue suspendida</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu comercio <strong>Panadería Don Juan</strong> fue suspendido temporalmente.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Múltiples reclamos sin resolver de clientes.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.4	2026-07-02 03:04:06.4
cmr2x7ksm000oz9sq4mmmf46t	driver_suspended	Cuenta repartidor suspendida	⚠️ Tu cuenta de repartidor fue suspendida - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Cuenta Suspendida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu cuenta de repartidor fue suspendida</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu cuenta de repartidor en MOOVY fue suspendida temporalmente.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Documentación vencida (licencia de conducir).</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.407	2026-07-02 03:04:06.407
cmr2x7ksv000pz9sqr0bvs346	account_deletion_request	Solicitud eliminación de cuenta	⚠️ Solicitud de eliminación de cuenta - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Solicitud de eliminación de cuenta</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola María López, recibimos tu solicitud para eliminar tu cuenta de MOOVY.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Tu cuenta será eliminada permanentemente el 03/04/2026.</strong> Este proceso es irreversible.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.415	2026-07-02 03:04:06.415
cmr2x7kt3000qz9sq65pareyp	account_deleted	Cuenta eliminada	Confirmación: tu cuenta fue eliminada - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu cuenta fue eliminada</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos que tu cuenta y todos tus datos personales fueron eliminados permanentemente, en cumplimiento con la Ley 25.326.</p>\n            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">Este es el último correo que recibirás de MOOVY.</p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.423	2026-07-02 03:04:06.423
cmr2x7ktb000rz9sqs0zfde7v	owner_critical_alert	Alerta crítica (Owner)	[🔴 CRÍTICO] Pasarela de pagos caída - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🔴 CRÍTICO</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Pasarela de pagos no responde</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">La API de MercadoPago no está respondiendo. Los pagos con tarjeta están fallando.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Detalles técnicos</h4><pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #334155; margin: 0;">Error: ECONNREFUSED\nEndpoint: https://api.mercadopago.com/v1/payments\nÚltimo intento: 2026-03-20 14:30:00 ART\nFallas consecutivas: 5</pre></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.432	2026-07-02 03:04:06.432
cmr2x7kva0010z9sqvs4vpw67	merchant_change_request_approved	Solicitud de cambio aprobada (comercio)	✅ Tu solicitud de cambio fue aprobada — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Solicitud aprobada ✅</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Aprobamos tu solicitud de cambio de <strong>CBU</strong>. Ya podés ingresar el nuevo\n                valor desde tu panel de configuración.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios/configuracion"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir a mi panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.502	2026-07-02 03:04:06.502
cmr2x7ktj000sz9sqpl8ag9ia	owner_unassigned_orders	Pedidos sin repartidor (Owner)	🟠 3 pedidos sin repartidor - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🟠 Pedidos Sin Repartidor</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">3 pedidos sin repartidor asignado</h2>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>3 pedidos</strong> están esperando repartidor. El más antiguo lleva <strong>12 minutos</strong>.</p></div>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><p style="color: #718096; font-size: 14px; margin: 0;"><strong>Pedidos:</strong> #MOV-001, #MOV-002, #MOV-003</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver pedidos en OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.439	2026-07-02 03:04:06.439
cmr2x7ktr000tz9sq9yejcfde	owner_daily_report	Reporte diario (Owner)	📊 Reporte diario MOOVY — 20/03/2026	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; text-align: center;">📊 Reporte Diario — 20/03/2026</h2>\n            <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 20px 0;">\n                <tr>\n                    <td style="background: #eff6ff; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #1e40af; font-size: 28px; font-weight: bold;">47</div><div style="color: #3b82f6; font-size: 12px; text-transform: uppercase;">Pedidos</div></td>\n                    <td style="background: #f0fdf4; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #166534; font-size: 28px; font-weight: bold;">$285.400</div><div style="color: #22c55e; font-size: 12px; text-transform: uppercase;">Facturación</div></td>\n                    <td style="background: #fef3c7; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #92400e; font-size: 28px; font-weight: bold;">$22.832</div><div style="color: #f59e0b; font-size: 12px; text-transform: uppercase;">Comisión</div></td>\n                </tr>\n            </table>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Completados</td><td style="text-align: right; color: #059669; font-weight: 500;">42 (89%)</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Cancelados</td><td style="text-align: right; color: #ef4444; font-weight: 500;">5</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Tiempo promedio</td><td style="text-align: right; color: #2d3748; font-weight: 500;">28 min</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Nuevos usuarios</td><td style="text-align: right; color: #2d3748; font-weight: 500;">12</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Top comercio</td><td style="text-align: right; color: #2d3748; font-weight: 500;">Don Juan (8 pedidos)</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/revenue"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver dashboard completo\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.448	2026-07-02 03:04:06.448
cmr2x7kty000uz9sqzzy7pxh1	owner_data_deletion_request	Solicitud eliminación datos (Owner)	📋 [COMPLIANCE] Solicitud eliminación de datos	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #eff6ff; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">📋 Solicitud ARCO</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Solicitud de eliminación de datos personales</h2>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Plazo legal:</strong> 10 días hábiles para completar (Ley 25.326, Art. 16).</p></div>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Usuario</td><td style="text-align: right; color: #2d3748;">${SAMPLE.buyerName}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Email</td><td style="text-align: right; color: #2d3748;">maria@ejemplo.com</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Roles</td><td style="text-align: right; color: #2d3748;">USER, SELLER</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/clientes"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver en panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.455	2026-07-02 03:04:06.455
cmr2x7ku7000vz9sq6qadv5qx	cart_abandonment_1st	Carrito abandonado (1er recordatorio)	${nombre}, dejaste algo en tu carrito 🛒	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Tu carrito</div>\n            <h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¿Te olvidaste de algo?</h2>\n            <p style="color: #718096; margin: 0 0 20px;">Guardamos tu carrito para que puedas completar tu pedido cuando quieras.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Medialunas artesanales x6</strong></td><td style="text-align: right; font-weight: 600;">$3.500</td></tr><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Café con leche grande</strong> <span style="color: #718096; font-size: 13px;"> × 2</span></td><td style="text-align: right; font-weight: 600;">$5.000</td></tr><tr><td style="padding: 14px 0 0; font-weight: 700; font-size: 16px;">Total</td><td style="text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">$8.500</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/checkout"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Completar mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.463	2026-07-02 03:04:06.463
cmr2x7kue000wz9sq64qw1oxs	cart_abandonment_2nd	Carrito abandonado (2do recordatorio)	¡Tu carrito te espera, ${nombre}! 🛒	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Tu carrito</div>\n            <h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¡Tus productos siguen esperándote!</h2>\n            <p style="color: #718096; margin: 0 0 20px;">Guardamos tu carrito tal cual lo dejaste. Cuando quieras, completás tu pedido en un toque.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Medialunas artesanales x6</strong></td><td style="text-align: right; font-weight: 600;">$3.500</td></tr><tr><td style="padding: 14px 0 0; font-weight: 700; font-size: 16px;">Total</td><td style="text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">$3.500</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/checkout"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Completar mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.471	2026-07-02 03:04:06.471
cmr2x7kun000xz9sqnssd6v2y	merchant_doc_approved	Documento de comercio aprobado	✅ Documento aprobado — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Documento aprobado ✅</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Hola Juan Pérez, tu documento <strong>Constancia AFIP</strong> fue\n                aprobado por el equipo de MOOVY.\n            </p>\n            <p style="color: #6b7280; font-size: 14px;">Cuando todos los documentos requeridos estén aprobados, tu comercio se activa automáticamente.</p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios/configuracion"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir a mi panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.479	2026-07-02 03:04:06.479
cmr2x7kuu000yz9sqzonil5g8	merchant_doc_rejected	Documento de comercio rechazado	⚠️ Documento rechazado — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Documento rechazado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Hola Juan Pérez, tu documento <strong>Habilitación Municipal</strong>\n                fue rechazado por el siguiente motivo:\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">La foto no permite leer claramente la fecha de vencimiento. Subí una foto más nítida.</div>\n            <p style="color: #6b7280; font-size: 14px;">Podés volver a subirlo desde tu panel de configuración.</p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios/configuracion"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Subir documento nuevo\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.486	2026-07-02 03:04:06.486
cmr2x7kv2000zz9sqdt55vqsx	admin_merchant_change_request	Solicitud de cambio de documento (comercio → admin)	📄 Nueva solicitud de cambio de documento (comercio)	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de cambio</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                <strong>Panadería Don Juan</strong> solicita cambiar su <strong>CBU</strong>.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 5px 0; color: #4a5568;"><strong>Motivo:</strong></p>\n                <p style="margin: 5px 0; color: #4a5568;">Cambiamos de banco por mejores condiciones.</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/usuarios"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Revisar en OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.494	2026-07-02 03:04:06.494
cmr2x7kvh0011z9sq3svf8i04	merchant_change_request_rejected	Solicitud de cambio rechazada (comercio)	⚠️ Tu solicitud de cambio fue rechazada — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Solicitud rechazada</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                No aprobamos tu solicitud de cambio de <strong>CBU</strong>.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">Necesitamos que adjuntes el comprobante del nuevo banco antes de aprobar el cambio. Contactanos por soporte si tenés dudas.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/soporte"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.51	2026-07-02 03:04:06.51
cmr2x7kvp0012z9sqiavhmi6n	driver_doc_approved	Documento de repartidor aprobado	✅ Documento aprobado — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Documento aprobado ✅</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Hola Carlos Gómez, tu <strong>Licencia de conducir</strong> fue aprobada.\n            </p>\n            <p style="color: #6b7280; font-size: 14px;">Cuando todos los documentos estén aprobados, tu cuenta se activa automáticamente.</p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.518	2026-07-02 03:04:06.518
cmr2x7kw10013z9sq7jx5fi9a	driver_doc_rejected	Documento de repartidor rechazado	⚠️ Documento rechazado — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Documento rechazado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Hola Carlos Gómez, tu <strong>Seguro del vehículo</strong> fue rechazado.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">La póliza está vencida. Subí una póliza al día para poder operar.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Subir documento nuevo\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.529	2026-07-02 03:04:06.529
cmr2x7kw80014z9sqntf6jwit	admin_driver_change_request	Solicitud de cambio de documento (repartidor → admin)	📄 Nueva solicitud de cambio de documento (repartidor)	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de cambio</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                <strong>Carlos Gómez</strong> solicita cambiar su <strong>Licencia de conducir</strong>.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 5px 0; color: #4a5568;"><strong>Motivo:</strong></p>\n                <p style="margin: 5px 0; color: #4a5568;">Renové la licencia, la nueva vence en 2031.</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/usuarios"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Revisar en OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.536	2026-07-02 03:04:06.536
cmr2x7kwj0015z9sqqtvle050	driver_change_request_approved	Solicitud de cambio aprobada (repartidor)	✅ Tu solicitud de cambio fue aprobada — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Solicitud aprobada ✅</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Aprobamos tu solicitud de cambio de <strong>Licencia</strong>. Ya podés subir la nueva\n                desde tu perfil.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.547	2026-07-02 03:04:06.547
cmr2x7kws0016z9sq54yci88m	driver_change_request_rejected	Solicitud de cambio rechazada (repartidor)	⚠️ Tu solicitud de cambio fue rechazada — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Solicitud rechazada</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                No aprobamos tu solicitud de cambio de <strong>Seguro</strong>.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">El documento subido no corresponde al vehículo registrado. Contactanos por soporte si tenés dudas.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/soporte"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.556	2026-07-02 03:04:06.556
cmr2x7kx20017z9sqdjj6iv6n	driver_doc_expiring	Documento próximo a vencer (repartidor)	Tu Licencia de conducir vence en 3 días — MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Tu documento vence pronto</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Hola Carlos Gómez, tu <strong>Licencia de conducir</strong> vence en\n                <strong>3 días</strong> (30/04/2026).\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">Si no renovás a tiempo, no vas a poder recibir nuevos pedidos hasta que subas el documento renovado.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Actualizar documento\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.567	2026-07-02 03:04:06.567
cmr2x7kx90018z9sqb1wetmp0	driver_doc_expired	Documento vencido + auto-suspensión (repartidor)	⛔ Documento vencido — tu cuenta fue suspendida	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Documento vencido</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Hola Carlos Gómez, tu <strong>Licencia de conducir</strong> venció el 24/04/2026.\n            </p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;">Suspendimos tu cuenta de repartidor hasta que subas el documento renovado. Esto es obligatorio por ley (Decreto 779/95).</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Subir licencia renovada\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.573	2026-07-02 03:04:06.573
cmr2x7kxf0019z9sqrvnsao3d	email_change_confirmation	Confirmación de cambio de email (al nuevo)	Tu email en MOOVY fue actualizado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu email fue actualizado</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, a partir de ahora tu cuenta MOOVY está asociada a <strong>maria@ejemplo.com</strong>.\n            </p>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                Todos los correos transaccionales (confirmaciones de pedidos, notificaciones, recuperación de contraseña) te van a llegar a este nuevo email.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><strong>¿No fuiste vos?</strong> Si no hiciste este cambio, contactanos urgente a <a href="mailto:soporte@somosmoovy.com" style="color: #1a1a1a; text-decoration: underline;">soporte@somosmoovy.com</a> para recuperar tu cuenta.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mi-perfil"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir a mi perfil\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.579	2026-07-02 03:04:06.579
cmr2x7kxl001az9sqhqs4qngu	data_export_ready	Exportación de datos ARCO lista	Tu exportación de datos MOOVY está lista	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu exportación de datos está lista</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, preparamos el archivo con todos los datos personales que guardamos en tu cuenta MOOVY: perfil, direcciones, pedidos, transacciones de puntos, consentimientos y más.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Formato</p>\n                <p style="margin: 0 0 16px 0; color: #555; font-size: 14px;">JSON descargable</p>\n                <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Disponible hasta</p>\n                <p style="margin: 0; color: #555; font-size: 14px;">viernes, 25 de abril de 2026, 14:30</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/api/profile/export-data"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Descargar mis datos\n        </a>\n    </div>\n            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Este link es personal y caduca en 48 horas. Derecho de acceso y portabilidad garantizado por la Ley 25.326.</p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.585	2026-07-02 03:04:06.585
cmr2x7kxr001bz9sqz9yu06ne	terms_updated	Actualización de Términos o Privacidad	Actualizamos los Términos y Condiciones de MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Actualizamos nuestros Términos y Condiciones</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, publicamos una nueva versión de los <strong>Términos y Condiciones</strong> de MOOVY (versión <strong>1.2</strong>).\n            </p>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                Te pedimos que los leas antes de seguir usando la plataforma. Si seguís usando MOOVY después de recibir este correo, entendemos que aceptaste los cambios.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/terminos"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Leer términos y condiciones\n        </a>\n    </div>\n            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Si no estás de acuerdo, podés eliminar tu cuenta desde tu <a href="https://somosmoovy.com/mi-perfil/privacidad" style="color: #1a1a1a;">panel de privacidad</a>.</p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.591	2026-07-02 03:04:06.591
cmr2x7kxx001cz9sqto78xoma	marketing_opt_out_confirmed	Confirmación de baja de comunicaciones comerciales	Confirmamos tu baja de comunicaciones comerciales	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Confirmamos tu baja de comunicaciones</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, registramos tu decisión. A partir de este momento ya <strong>no vas a recibir</strong> ofertas, promociones ni novedades comerciales de MOOVY por email ni por push.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Qué vas a seguir recibiendo</p>\n                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.7;">\n                    Solo correos transaccionales imprescindibles de tus pedidos: confirmaciones, estado de entrega, recibos, y avisos legales obligatorios.\n                </p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mi-perfil/privacidad"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir a mi panel de privacidad\n        </a>\n    </div>\n            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Baja confirmada conforme a la Ley 26.951 "No Llame" y al marco de protección de datos de la AAIP.</p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.597	2026-07-02 03:04:06.597
cmr2x7ky3001dz9sqh1a6h6ra	driver_assigned_buyer	Repartidor asignado al pedido (al buyer)	Tu pedido MOV-20260320-001 ya tiene repartidor	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido ya tiene repartidor</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                María López, <strong>Carlos Gómez</strong> va a buscar tu pedido <strong>MOV-20260320-001</strong>. Llega al comercio en aproximadamente <strong>7 minutos</strong>.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Repartidor</p>\n                <p style="margin: 5px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">Carlos Gómez</p>\n                <p style="margin: 12px 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Vehículo</p>\n                <p style="margin: 5px 0; color: #555; font-size: 14px;">Moto</p>\n                <p style="margin: 12px 0 5px 0; color: #999; font-size: 12px; text-transform: uppercase;">Contacto</p>\n                <p style="margin: 5px 0; color: #555; font-size: 14px;">•••• 4521 (teléfono enmascarado por privacidad)</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.603	2026-07-02 03:04:06.603
cmr2x7ky9001ez9sq050gg5m8	order_on_the_way	Pedido en camino + PIN de entrega	🛵 Tu pedido MOV-20260320-001 va en camino	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido va en camino</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                María López, tu pedido <strong>MOV-20260320-001</strong> ya salió del comercio.\n            </p>\n            <div style="background-color: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center;">\n                <p style="margin: 0 0 12px 0; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Código de entrega</p>\n                <p style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">048 291</p>\n                <p style="margin: 0; color: #555; font-size: 13px;">Cuando llegue el repartidor, dale este código.</p>\n            </div>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><strong>No compartas el código</strong> ni lo anticipes por chat. Solo mostraselo al repartidor cuando te entregue el paquete en la puerta.</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Seguir mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.609	2026-07-02 03:04:06.609
cmr2x7kyf001fz9sqwe04g7xi	order_ready_pickup	Pedido listo para retirar	Tu pedido MOV-20260320-001 está listo para retirar	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Tu pedido está listo para retirar</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                María López, tu pedido <strong>MOV-20260320-001</strong> está listo. Podés pasar a buscarlo cuando te quede cómodo.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 0 0 6px 0; color: #999; font-size: 12px; text-transform: uppercase;">Retirar en</p>\n                <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 17px; font-weight: 600;">Panadería Don Juan</p>\n                <p style="margin: 0; color: #555; font-size: 14px;">San Martín 456, Ushuaia</p>\n            </div>\n            <p style="color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 8px 0;">Llevá tu número de pedido (<strong>MOV-20260320-001</strong>) o mostrá este email al mostrador.</p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.616	2026-07-02 03:04:06.616
cmr2x7kyl001gz9sqxv6fhfz5	rate_order_reminder	Recordatorio de calificar pedido (24h)	¿Cómo estuvo tu pedido de Panadería Don Juan?	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">¿Cómo estuvo tu pedido?</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, ayer recibiste tu pedido <strong>MOV-20260320-001</strong> de <strong>Panadería Don Juan</strong>.\n            </p>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                Tarda menos de 10 segundos y ayuda al comercio y al repartidor a mejorar. Otros vecinos de Ushuaia ven tu opinión antes de pedir.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Calificar mi pedido\n        </a>\n    </div>\n            <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0;">Este es el único recordatorio que vas a recibir sobre este pedido.</p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.621	2026-07-02 03:04:06.621
cmr2x7kyr001hz9sqd58o3vsd	points_earned	Puntos MOOVER acreditados	🎉 Sumaste 45 puntos MOOVER	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">🎉 Sumaste puntos MOOVER</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                María López, se acreditaron <strong>45 puntos</strong> a tu cuenta por tu pedido <strong>MOV-20260320-001</strong>.\n            </p>\n            <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">\n                <p style="margin: 0 0 6px 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Tu saldo actual</p>\n                <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 36px; font-weight: 700;">1.285 <span style="font-size: 16px; font-weight: 500; color: #b45309;">pts</span></p>\n                <p style="margin: 0; color: #92400e; font-size: 13px;">Nivel <strong>SILVER</strong></p>\n            </div>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><p style="margin: 0; color: #555; font-size: 14px;"><strong>1 punto = $1 ARS.</strong> Podés canjearlos como descuento en tu próxima compra (hasta 20% del subtotal, desde 500 puntos).</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/puntos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mis puntos\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.627	2026-07-02 03:04:06.627
cmr2x7kyw001iz9sqbvapgahy	admin_new_merchant_pending	Nuevo comercio pendiente (→ admin)	📋 Nuevo comercio registrado — revisar en OPS	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #eff6ff; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🏪 Nuevo comercio</div></div>\n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Nuevo comercio pendiente de revisión</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                Un comercio acaba de registrarse y necesita aprobación. Revisá CUIT, constancia AFIP y habilitación municipal desde el panel.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercio:</strong> Panadería Don Juan</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Dueño:</strong> Juan Pérez</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> contacto@donjuan.com</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/pipeline-comercios"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Revisar en pipeline\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.633	2026-07-02 03:04:06.633
cmr2x7kz2001jz9sqweonzfav	admin_new_driver_pending	Nuevo repartidor pendiente (→ admin)	🏍️ Nuevo repartidor registrado — revisar en OPS	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #eff6ff; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🏍️ Nuevo repartidor</div></div>\n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Nuevo repartidor pendiente de revisión</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                Un repartidor se registró. Revisá DNI, licencia, seguro y RTO (si es motorizado) antes de activarlo.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Nombre:</strong> Carlos Gómez</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Vehículo:</strong> MOTO</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Email:</strong> carlos@ejemplo.com</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/usuarios"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Revisar solicitud\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.638	2026-07-02 03:04:06.638
cmr2x7kz8001kz9sqzm5qmqtf	points_expiring	Puntos MOOVER por vencer (→ buyer)	⏳ Tenés 1.250 puntos MOOVER por vencer	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">⏳ Puntos por vencer</div></div>\n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Tus puntos MOOVER están por vencer</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                María López, tu último pedido fue hace 5 meses. Si no hacés un nuevo pedido en los próximos <strong>30 días</strong>, tus puntos vencen.\n            </p>\n            <div style="text-align: center; margin: 24px 0;">\n                <p style="color: #999; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0;">Tu saldo actual</p>\n                <p style="color: #e60012; font-size: 36px; font-weight: 700; margin: 0;">1.250 pts</p>\n                <p style="color: #555; font-size: 14px; margin: 4px 0 0 0;">Equivalen a $1.250 de descuento</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver comercios y canjear\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.644	2026-07-02 03:04:06.644
cmr2x7kzf001lz9sq35x0zd5c	driver_auto_activated	Repartidor auto-activado (→ driver)	🎉 Tu cuenta de repartidor MOOVY está activa	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #f0fdf4; color: #166534; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">✅ Cuenta activada</div></div>\n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">🎉 ¡Ya sos repartidor MOOVY!</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">\n                Carlos Gómez, aprobamos el último documento que faltaba. Tu cuenta está <strong>activa</strong>.\n            </p>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><strong>Antes de conectarte por primera vez:</strong><br>• GPS activo<br>• Datos del vehículo al día<br>• Celular cargado</div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Entrar al panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.652	2026-07-02 03:04:06.652
cmr2x7kzl001mz9sqh9f0n21e	referral_activated	Referido completó primer pedido (→ referrer)	🎁 Tu amigo hizo su primer pedido — sumaste 1.000 pts	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🎁 Puntos de referido</div></div>\n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">¡Tu amigo hizo su primer pedido!</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                Gracias por invitar a María López a MOOVY. Ya recibiste los puntos por el referido.\n            </p>\n            <div style="text-align: center; margin: 24px 0;">\n                <p style="color: #999; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0;">Ganaste</p>\n                <p style="color: #059669; font-size: 36px; font-weight: 700; margin: 0;">+1.000 pts</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mi-perfil/invitar"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Invitar a más amigos\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.657	2026-07-02 03:04:06.657
cmr2x7kzs001nz9sq4k7epa3k	account_auto_locked	Cuenta bloqueada por intentos fallidos	🔒 Tu cuenta MOOVY fue bloqueada por seguridad	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">🔒 Bloqueamos tu cuenta por seguridad</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, detectamos múltiples intentos fallidos de inicio de sesión. Por seguridad bloqueamos la cuenta temporalmente (15 min auto-expira).\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/recuperar"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Resetear mi contraseña\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.664	2026-07-02 03:04:06.664
cmr2x7kzy001oz9sqno0jvb8o	admin_account_auto_locked	Cuenta bloqueada (→ admin)	🔒 Cuenta bloqueada por intentos fallidos — revisar en OPS	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Una cuenta fue bloqueada por intentos fallidos</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                El sistema bloqueó automáticamente la cuenta de <strong>maria@ejemplo.com</strong> después de 5 intentos fallidos. Auto-desbloqueo en 15min, o podés desbloquearla antes desde el panel.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/usuarios/abc123"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver perfil del usuario\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.67	2026-07-02 03:04:06.67
cmr2x7l03001pz9sqhzrwsu4r	order_refunded	Pedido cancelado — devolución procesada	Te devolvimos $X,XXX — pedido MOV-XXXX	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">Te devolvimos el dinero de tu pedido</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, tu pedido <strong>MOV-20260320-001</strong> fue cancelado y procesamos la devolución de tu pago.\n            </p>\n            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">\n                <p style="margin: 0 0 6px 0; color: #166534; font-size: 12px; text-transform: uppercase; font-weight: 600;">Reintegro</p>\n                <p style="margin: 0; color: #1a1a1a; font-size: 36px; font-weight: 700;">$ 2.500</p>\n            </div>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><p style="margin: 0; color: #555; font-size: 14px;">MercadoPago procesa el reintegro en <strong>1 a 3 días hábiles</strong>.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos/abc123"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver detalle del pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.676	2026-07-02 03:04:06.676
cmr2x7l09001qz9sq6luwn71a	account_created_by_admin	Cuenta creada por admin (magic link)	Bienvenido a MOOVY — configurá tu contraseña	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Bienvenido a MOOVY</div></div>\n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; text-align: center;">Te creamos tu cuenta MOOVY</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">\n                María López, el equipo de Moovy creó una cuenta para vos. Pedí lo que necesites a comercios de Ushuaia con delivery rápido.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 0; color: #555; font-size: 14px;">Hacé click en el botón y configurá tu contraseña. Vas a poder iniciar sesión inmediatamente con tu email.</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/restablecer-contrasena?token=xxx"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Configurar mi contraseña\n        </a>\n    </div>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Tenés 24 horas</strong> para configurar tu contraseña con este link.</p></div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.682	2026-07-02 03:04:06.682
cmr2x7l0f001rz9sqv8tbp381	payment_timeout_cancelled	Pedido cancelado por timeout de pago	Pedido [N] cancelado por pago no confirmado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">Tu pedido fue cancelado</h2>\n            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">\n                María López, cancelamos automáticamente tu pedido <strong>MOV-20260320-001</strong>\n                porque el pago no se confirmó dentro de los <strong>30 minutos</strong> permitidos.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <strong>El stock fue restaurado.</strong> Podés volver a hacer el pedido cuando\n                quieras. No se cobró nada — si MercadoPago retiene la operación, se acreditará\n                automáticamente en las próximas 48hs.\n            </div>\n            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 18px;">\n                Si creés que fue un error o tu pago se confirmó después, contactanos en\n                <a href="mailto:soporte@somosmoovy.com" style="color: #e60012; font-weight: 600;">soporte@somosmoovy.com</a>\n                con el número de pedido.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Volver a la tienda\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.688	2026-07-02 03:04:06.688
cmr2x7l0n001sz9sqqt2vr6z7	payment_late_refund	Pago tardío post-cancelación → refund automático	Reembolso automático $X — pedido [N]	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">Recibimos tu pago tarde — te lo devolvemos</h2>\n            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">\n                María López, MercadoPago confirmó tu pago del pedido\n                <strong>MOV-20260320-001</strong> después de que el pedido se cancelara.\n                Como ya no podemos prepararlo, te devolvemos el dinero\n                <strong>automáticamente</strong>.\n            </p>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;">\n                <strong>Monto a devolver:</strong> $4.500<br/>\n                <strong>Plazo estimado:</strong> 5 a 15 días hábiles según tu banco.<br/>\n                <strong>Método:</strong> el mismo de tu pago original.\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Hacer un nuevo pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.695	2026-07-02 03:04:06.695
cmr2x7l0v001tz9sqhpbzenoq	customer_no_show_returned	Cliente no apareció → pedido vuelve al comercio	No te encontramos — pedido [N]	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">No te encontramos en el domicilio</h2>\n            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">\n                María López, tu repartidor llegó al domicilio del pedido\n                <strong>MOV-20260320-001</strong> y esperó 10 minutos, pero nadie respondió.\n                El pedido vuelve a <strong>Panadería Don Juan</strong>.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">\n                <strong>Importante:</strong> el cobro se mantiene porque el pedido se preparó\n                y entregamos a tiempo. Si creés que fue un error, podés reportarlo desde la app.\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver el pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.703	2026-07-02 03:04:06.703
cmr2x7l15001uz9sqks4qrqn7	admin_daily_revenue_summary	Resumen diario de revenue al CEO/admin	📊 Moovy daily — N pedidos · $X revenue	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 16px;">\n                <div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">📊 Daily Flash</div>\n            </div>\n            <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 22px; font-weight: 600; text-align: center;">\n                Resumen del lunes 5 de mayo de 2026\n            </h2>\n            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 8px 0;">\n                Resumen automático de operaciones del día anterior.\n            </p>\n\n            <div style="display: table; width: 100%; border-collapse: collapse; margin: 24px 0;">\n                <div style="display: table-row;">\n                    <div style="display: table-cell; padding: 16px; background: #f9fafb; border-radius: 12px; text-align: center; width: 50%;">\n                        <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Pedidos entregados</p>\n                        <p style="margin: 8px 0 4px 0; color: #111827; font-size: 32px; font-weight: 700;">42</p>\n                        <p style="margin: 0; font-size: 12px;"><span style="color: #10b981; font-weight: 600;">+12%</span> vs ayer</p>\n                    </div>\n                    <div style="display: table-cell; width: 12px;"></div>\n                    <div style="display: table-cell; padding: 16px; background: #fef2f2; border-radius: 12px; text-align: center; width: 50%;">\n                        <p style="margin: 0; color: #991b1b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Revenue Moovy</p>\n                        <p style="margin: 8px 0 4px 0; color: #e60012; font-size: 32px; font-weight: 700;">$28.450</p>\n                        <p style="margin: 0; color: #6b7280; font-size: 12px;">comisiones + margen de envío</p>\n                    </div>\n                </div>\n            </div>\n\n            <h3 style="color: #111827; font-size: 15px; font-weight: 600; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Financiero</h3>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>GMV:</strong> $189.500</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Pagos a comercios:</strong> $158.640</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Pagos a repartidores:</strong> $24.800</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Comercios activos:</strong> 8</p>\n                <p style="margin: 4px 0; color: #333; font-size: 14px;"><strong>Repartidores activos:</strong> 5</p>\n            </div>\n\n            <h3 style="color: #111827; font-size: 15px; font-weight: 600; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Top comercios</h3>\n            <div style="display: flex; justify-content: space-between; padding: 10px 14px; background: #fef3c7; border-radius: 8px; margin-bottom: 6px;">\n                <span style="color: #111827; font-size: 14px; font-weight: 500;">1. Panadería Don Juan</span>\n                <span style="color: #6b7280; font-size: 14px;">12 pedidos · $54.200</span>\n            </div>\n\n            <h3 style="color: #111827; font-size: 15px; font-weight: 600; margin: 28px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Alertas</h3>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;">Día limpio — sin alertas operativas.</div>\n\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/dashboard"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Abrir panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.714	2026-07-02 03:04:06.714
cmr2x7l1f001vz9sq2yj0f002	merchant_order_returned	Comercio recibe pedido devuelto por no-show	El pedido [N] vuelve a tu comercio	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">Un pedido vuelve a tu comercio</h2>\n            <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">\n                <strong>Panadería Don Juan</strong>, el repartidor del pedido\n                <strong>MOV-20260320-001</strong> de María López no encontró al cliente.\n                El pedido vuelve a vos.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <strong>Cuando llegue el repartidor:</strong> dale el <strong>mismo PIN de retiro</strong>\n                que ya le habías dado. Lo va a ingresar en la app para cerrar la devolución.\n            </div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;">\n                <strong>Sobre el cobro:</strong> tu pago no se ve afectado. Cobrás como si el\n                pedido se hubiera entregado. Moovy se hace cargo del costo del viaje fallido.\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios/pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver el pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.724	2026-07-02 03:04:06.724
cmr2x7l1n001wz9sqczp95uac	driver_available	Hay repartidor en tu zona	¡Ya hay repartidor en tu zona! 🏍️	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">¡Ya hay repartidor en tu zona! 🏍️</h2>\n            <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">\n                María López, se conectó un repartidor cerca tuyo, así que ya podés completar tu pedido y recibirlo donde estés.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/checkout"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Completar mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmqz5vqsx0000xhd86fq6wm5d	2026-07-02 03:04:06.732	2026-07-02 03:04:06.732
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Favorite" (id, "userId", "merchantId", "productId", "listingId", "createdAt") FROM stdin;
\.


--
-- Data for Name: FeatureFlag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FeatureFlag" (id, key, label, description, scope, "isActive", "createdAt", "updatedAt", "lastToggledByUserId", "lastToggledAt") FROM stdin;
\.


--
-- Data for Name: HeroSlide; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HeroSlide" (id, title, subtitle, "buttonText", "buttonLink", gradient, image, "imageDesktop", "imageMobile", "isActive", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: HomeCategorySlot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HomeCategorySlot" (id, "categoryId", "order", image, icon, label, "isActive", "createdAt", "updatedAt") FROM stdin;
cmr40tjso000gmh523yajlmub	cmqz5vqx1000hxhd86j3rab6t	1	\N	\N	\N	t	2026-07-02 21:32:56.567	2026-07-02 21:32:56.567
cmr40tsjg000imh52rtffmtzg	cmqz5vqy3000lxhd8hcaqu9dk	2	\N	\N	\N	t	2026-07-02 21:33:07.901	2026-07-02 21:33:07.901
\.


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Listing" (id, "sellerId", title, description, price, stock, condition, "weightKg", "lengthCm", "widthCm", "heightCm", "isActive", "categoryId", "listingType", "auctionEndsAt", "auctionDuration", "startingPrice", "bidIncrement", "currentBid", "currentBidderId", "totalBids", "auctionStatus", "auctionWinnerId", "winnerPaymentDeadline", "deletedAt", "deletedBy", "deletedReason", "createdAt", "updatedAt") FROM stdin;
cmqz5vu5k00c2xhd8egl3g32w	cmqz5vu5100byxhd8qu8um889	Auriculares Bluetooth	Inalámbricos con estuche de carga.	28000	12	NUEVO	\N	\N	\N	\N	t	cmqz5vqzf000sxhd8ommos2gv	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.505	2026-06-29 11:55:50.505
cmqz5vu6200c6xhd8ync2jxq1	cmqz5vu5100byxhd8qu8um889	Parlante Portátil 20W	Bluetooth, resistente al agua.	35000	8	NUEVO	\N	\N	\N	\N	t	cmqz5vqzf000sxhd8ommos2gv	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.522	2026-06-29 11:55:50.522
cmqz5vu6900caxhd82528y4t5	cmqz5vu5100byxhd8qu8um889	Cargador USB-C 65W	Carga rápida para notebook y celular.	18000	20	NUEVO	\N	\N	\N	\N	t	cmqz5vqzf000sxhd8ommos2gv	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.53	2026-06-29 11:55:50.53
cmqz5vu6i00cexhd811lcfn5h	cmqz5vu5100byxhd8qu8um889	Mouse Gamer RGB	6 botones, sensor óptico.	22000	0	NUEVO	\N	\N	\N	\N	t	cmqz5vqzf000sxhd8ommos2gv	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.538	2026-06-29 11:55:50.538
cmqz5vu6p00cixhd85c8rgrs5	cmqz5vu5100byxhd8qu8um889	Smartwatch Fit	Reloj inteligente con monitor cardíaco.	42000	5	NUEVO	\N	\N	\N	\N	t	cmqz5vqzf000sxhd8ommos2gv	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.545	2026-06-29 11:55:50.545
cmqz5vugv00cwxhd8buchmu4h	cmqz5vugm00csxhd8o0zs72aa	Campera Polar Térmica	Abrigada, ideal para Ushuaia.	48000	10	NUEVO	\N	\N	\N	\N	t	cmqz5vqzl000txhd8b3j5zwws	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.911	2026-06-29 11:55:50.911
cmqz5vuh100d0xhd8trwrmkqw	cmqz5vugm00csxhd8o0zs72aa	Buzo Canguro	Algodón frisado, varios talles.	26000	15	NUEVO	\N	\N	\N	\N	t	cmqz5vqzl000txhd8b3j5zwws	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.917	2026-06-29 11:55:50.917
cmqz5vuh700d4xhd81uccaykr	cmqz5vugm00csxhd8o0zs72aa	Gorro de Lana	Tejido artesanal patagónico.	9500	3	NUEVO	\N	\N	\N	\N	t	cmqz5vqzl000txhd8b3j5zwws	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.924	2026-06-29 11:55:50.924
cmqz5vuhd00d8xhd8kw8xg3qw	cmqz5vugm00csxhd8o0zs72aa	Botas Impermeables	Suela antideslizante para nieve.	62000	6	NUEVO	\N	\N	\N	\N	t	cmqz5vqzl000txhd8b3j5zwws	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.929	2026-06-29 11:55:50.929
cmqz5vuhi00dcxhd814cujpee	cmqz5vugm00csxhd8o0zs72aa	Bufanda de Lana	Bufanda tejida a mano.	8900	0	NUEVO	\N	\N	\N	\N	t	cmqz5vqzl000txhd8b3j5zwws	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:50.935	2026-06-29 11:55:50.935
cmqz5vuqh00dqxhd8ykj2vlup	cmqz5vuq700dmxhd8ldqyrukh	Lámpara de Mesa LED	Luz cálida regulable.	19000	9	NUEVO	\N	\N	\N	\N	t	cmqz5vqzt000uxhd8ime07uc9	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.257	2026-06-29 11:55:51.257
cmqz5vuqn00duxhd8nkkgkdgq	cmqz5vuq700dmxhd8ldqyrukh	Set de Sábanas Queen	Algodón 200 hilos.	32000	7	NUEVO	\N	\N	\N	\N	t	cmqz5vqzt000uxhd8ime07uc9	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.264	2026-06-29 11:55:51.264
cmqz5vuqt00dyxhd8p3encbq3	cmqz5vuq700dmxhd8ldqyrukh	Termo Acero 1L	Mantiene el calor 12hs.	24000	18	NUEVO	\N	\N	\N	\N	t	cmqz5vqzt000uxhd8ime07uc9	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.269	2026-06-29 11:55:51.269
cmqz5vur000e2xhd86t83s5fq	cmqz5vuq700dmxhd8ldqyrukh	Juego de Mate Completo	Mate, bombilla y yerbera.	21000	2	NUEVO	\N	\N	\N	\N	t	cmqz5vqzt000uxhd8ime07uc9	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.277	2026-06-29 11:55:51.277
cmqz5vur800e6xhd8xgav32xb	cmqz5vuq700dmxhd8ldqyrukh	Manta Polar Doble	Suave y abrigada.	27000	11	NUEVO	\N	\N	\N	\N	t	cmqz5vqzt000uxhd8ime07uc9	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.284	2026-06-29 11:55:51.284
cmqz5vv1a00ekxhd8v0xga0aq	cmqz5vv1200egxhd8raq97j04	Mochila Trekking 40L	Resistente al agua, varios bolsillos.	55000	8	NUEVO	\N	\N	\N	\N	t	cmqz5vr07000vxhd8dvyam1ju	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.646	2026-06-29 11:55:51.646
cmqz5vv1g00eoxhd8pz9qlw7u	cmqz5vv1200egxhd8raq97j04	Bastones de Trekking	Aluminio, regulables. Par.	29000	12	NUEVO	\N	\N	\N	\N	t	cmqz5vr07000vxhd8dvyam1ju	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.652	2026-06-29 11:55:51.652
cmqz5vv1m00esxhd81rd7r5dj	cmqz5vv1200egxhd8raq97j04	Linterna Frontal LED	Recargable, 350 lúmenes.	17000	0	NUEVO	\N	\N	\N	\N	t	cmqz5vr07000vxhd8dvyam1ju	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.658	2026-06-29 11:55:51.658
cmqz5vv1r00ewxhd844ft8rmy	cmqz5vv1200egxhd8raq97j04	Bidón Térmico 750ml	Acero inoxidable para outdoor.	15000	20	NUEVO	\N	\N	\N	\N	t	cmqz5vr07000vxhd8dvyam1ju	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.664	2026-06-29 11:55:51.664
cmqz5vv1x00f0xhd8tlcgjvva	cmqz5vv1200egxhd8raq97j04	Carpa 2 Personas	Liviana, montaje rápido.	89000	4	USADO	\N	\N	\N	\N	t	cmqz5vr07000vxhd8dvyam1ju	DIRECT	\N	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	2026-06-29 11:55:51.669	2026-06-29 11:55:51.669
\.


--
-- Data for Name: ListingImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ListingImage" (id, "listingId", url, "order") FROM stdin;
cmqz5vu5w00c4xhd8n6r9dv5q	cmqz5vu5k00c2xhd8egl3g32w	https://picsum.photos/seed/moovy-auriculares-bt/600/600	0
cmqz5vu6600c8xhd8ghsr684h	cmqz5vu6200c6xhd8ync2jxq1	https://picsum.photos/seed/moovy-parlante-20w/600/600	0
cmqz5vu6e00ccxhd8y4kivqgl	cmqz5vu6900caxhd82528y4t5	https://picsum.photos/seed/moovy-cargador-65w/600/600	0
cmqz5vu6m00cgxhd8cnlsdmoy	cmqz5vu6i00cexhd811lcfn5h	https://picsum.photos/seed/moovy-mouse-gamer/600/600	0
cmqz5vu6t00ckxhd8gti4w63e	cmqz5vu6p00cixhd85c8rgrs5	https://picsum.photos/seed/moovy-smartwatch/600/600	0
cmqz5vugy00cyxhd82rn8edx4	cmqz5vugv00cwxhd8buchmu4h	https://picsum.photos/seed/moovy-campera-polar/600/600	0
cmqz5vuh400d2xhd8ditn82mq	cmqz5vuh100d0xhd8trwrmkqw	https://picsum.photos/seed/moovy-buzo-canguro/600/600	0
cmqz5vuha00d6xhd80jl2jgcj	cmqz5vuh700d4xhd81uccaykr	https://picsum.photos/seed/moovy-gorro-lana/600/600	0
cmqz5vuhg00daxhd8d27akbxk	cmqz5vuhd00d8xhd8kw8xg3qw	https://picsum.photos/seed/moovy-botas/600/600	0
cmqz5vuhl00dexhd8813nnem5	cmqz5vuhi00dcxhd814cujpee	https://picsum.photos/seed/moovy-bufanda/600/600	0
cmqz5vuqk00dsxhd87ie933m4	cmqz5vuqh00dqxhd8ykj2vlup	https://picsum.photos/seed/moovy-lampara-led/600/600	0
cmqz5vuqq00dwxhd8uf7gnm8o	cmqz5vuqn00duxhd8nkkgkdgq	https://picsum.photos/seed/moovy-sabanas/600/600	0
cmqz5vuqx00e0xhd86clec6lz	cmqz5vuqt00dyxhd8p3encbq3	https://picsum.photos/seed/moovy-termo-acero/600/600	0
cmqz5vur400e4xhd8shuyrm02	cmqz5vur000e2xhd86t83s5fq	https://picsum.photos/seed/moovy-mate-set/600/600	0
cmqz5vurb00e8xhd8qamvj8m6	cmqz5vur800e6xhd8xgav32xb	https://picsum.photos/seed/moovy-manta-polar/600/600	0
cmqz5vv1d00emxhd8171iwmux	cmqz5vv1a00ekxhd8v0xga0aq	https://picsum.photos/seed/moovy-mochila-40l/600/600	0
cmqz5vv1j00eqxhd8cz1jhghe	cmqz5vv1g00eoxhd8pz9qlw7u	https://picsum.photos/seed/moovy-bastones/600/600	0
cmqz5vv1p00euxhd8xzkovt4w	cmqz5vv1m00esxhd81rd7r5dj	https://picsum.photos/seed/moovy-frontal-led/600/600	0
cmqz5vv1u00eyxhd8z3jfpo98	cmqz5vv1r00ewxhd844ft8rmy	https://picsum.photos/seed/moovy-bidon/600/600	0
cmqz5vv2000f2xhd8e86mcah5	cmqz5vv1x00f0xhd8tlcgjvva	https://picsum.photos/seed/moovy-carpa-2p/600/600	0
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "scheduleEnabled", "scheduleJson", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", "allowPickup", cuit, "constanciaAfipUrl", "habilitacionMunicipalUrl", "registroSanitarioUrl", "cuitStatus", "cuitApprovedAt", "cuitRejectionReason", "cuitApprovalSource", "cuitApprovalNote", "bankAccountStatus", "bankAccountApprovedAt", "bankAccountRejectionReason", "bankAccountApprovalSource", "bankAccountApprovalNote", "constanciaAfipStatus", "constanciaAfipApprovedAt", "constanciaAfipRejectionReason", "constanciaAfipApprovalSource", "constanciaAfipApprovalNote", "habilitacionMunicipalStatus", "habilitacionMunicipalApprovedAt", "habilitacionMunicipalRejectionReason", "habilitacionMunicipalApprovalSource", "habilitacionMunicipalApprovalNote", "registroSanitarioStatus", "registroSanitarioApprovedAt", "registroSanitarioRejectionReason", "registroSanitarioApprovalSource", "registroSanitarioApprovalNote", "acceptedTermsAt", "acceptedPrivacyAt", category, "ownerId", "createdAt", "updatedAt", rating, "adminNotes", "bankAccount", "businessName", "commissionRate", cuil, "displayOrder", "facebookUrl", "instagramUrl", "isPremium", "ownerBirthDate", "ownerDni", "premiumTier", "premiumUntil", "startedAt", "whatsappNumber", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "approvalStatus", "approvedAt", "rejectionReason", "applicationStatus", "pausedByUserAt", "pausedByUserReason", "cancelledByUserAt", "cancelledByUserReason", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "commissionOverride", "commissionOverrideReason", ubicacion, "loyaltyTier", "loyaltyTierLocked", "loyaltyOrderCount", "loyaltyUpdatedAt", "firstOrderWelcomeSentAt") FROM stdin;
cmqz5vrhh001qxhd80605qjj8	Patagonia Drinks	patagonia-drinks	Las mejores bebidas del fin del mundo. Cervezas, gaseosas y más.	https://picsum.photos/seed/moovy-logo-patagonia-drinks/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio1@somosmoovy.com	+5492901555001	San Martín 456, Ushuaia	-54.8069	-68.3042	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:47.04	2026-06-29 11:55:47.04	Kiosco	cmqz5vrgz001jxhd84w7eneza	2026-06-29 11:55:47.045	2026-06-29 11:55:47.045	4.7	\N	\N	\N	10	\N	0	\N	\N	t	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:47.04	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:47.045	\N
cmqz5vrwc0030xhd8eqeurj4k	El Falafel Ushuaia	el-falafel-ushuaia	Comida mediterránea en el fin del mundo. Falafel, hummus y sabores únicos.	https://picsum.photos/seed/moovy-logo-el-falafel-ushuaia/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio2@somosmoovy.com	+5492901555002	Gobernador Paz 789, Ushuaia	-54.8085	-68.312	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:47.577	2026-06-29 11:55:47.577	Restaurante	cmqz5vrw1002txhd87zyecnx4	2026-06-29 11:55:47.581	2026-06-29 11:55:47.581	4.9	\N	\N	\N	10	\N	0	\N	\N	t	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:47.577	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:47.581	\N
cmqz5vs7q004axhd8fyr7ixm3	La Estancia del Sur	la-estancia-del-sur	La mejor parrilla de Ushuaia. Carnes premium y cordero fueguino.	https://picsum.photos/seed/moovy-logo-la-estancia-del-sur/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio3@somosmoovy.com	+5492901555003	Maipú 1234, Ushuaia	-54.801	-68.2985	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:47.987	2026-06-29 11:55:47.987	Parrilla	cmqz5vs7g0043xhd8q2mrshtc	2026-06-29 11:55:47.99	2026-06-29 11:55:47.99	4.8	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:47.987	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:47.99	\N
cmqz5vsla005kxhd8ax92pmri	Pizzería Cerro Martial	pizzeria-cerro-martial	Pizza a la piedra con masa madre. La favorita del barrio.	https://picsum.photos/seed/moovy-logo-pizzeria-cerro-martial/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio4@somosmoovy.com	+5492901555004	Av. Leandro Alem 350, Ushuaia	-54.8033	-68.321	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:48.475	2026-06-29 11:55:48.475	Pizzería	cmqz5vsl0005dxhd8sst0a1h3	2026-06-29 11:55:48.478	2026-06-29 11:55:48.478	4.6	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:48.475	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:48.478	\N
cmqz5vswb006uxhd8c5bcq86n	Burger del Fin del Mundo	burger-fin-del-mundo	Hamburguesas smash con ingredientes locales.	https://picsum.photos/seed/moovy-logo-burger-fin-del-mundo/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio5@somosmoovy.com	+5492901555005	9 de Julio 120, Ushuaia	-54.8058	-68.3075	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:48.872	2026-06-29 11:55:48.872	Hamburguesería	cmqz5vsvy006nxhd8cea1yx8k	2026-06-29 11:55:48.876	2026-06-29 11:55:48.876	4.5	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:48.872	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:48.876	\N
cmqz5vt6v0084xhd80bepwszu	Café Beagle	cafe-beagle	Café de especialidad y pastelería artesanal frente al canal.	https://picsum.photos/seed/moovy-logo-cafe-beagle/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio6@somosmoovy.com	+5492901555006	San Martín 980, Ushuaia	-54.8075	-68.3001	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:49.252	2026-06-29 11:55:49.252	Cafetería	cmqz5vt6i007xxhd8hsy8f7ox	2026-06-29 11:55:49.255	2026-06-29 11:55:49.255	4.9	\N	\N	\N	10	\N	0	\N	\N	t	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:49.252	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:49.255	\N
cmqz5vtiv009exhd8vvyf8nns	Farmacia del Canal	farmacia-del-canal	Farmacia con delivery rápido. Medicamentos y cuidado personal.	https://picsum.photos/seed/moovy-logo-farmacia-del-canal/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio7@somosmoovy.com	+5492901555007	Av. San Martín 640, Ushuaia	-54.8061	-68.3055	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:49.684	2026-06-29 11:55:49.684	Farmacia	cmqz5vtik0097xhd8n00sds6h	2026-06-29 11:55:49.687	2026-06-29 11:55:49.687	4.4	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:49.684	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:49.687	\N
cmqz5vttb00aoxhd8gww43etq	Verdulería La Huerta Fueguina	verduleria-la-huerta	Frutas y verduras frescas, selección diaria.	https://picsum.photos/seed/moovy-logo-verduleria-la-huerta/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio8@somosmoovy.com	+5492901555008	Karukinka 210, Ushuaia	-54.7995	-68.3155	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:50.06	2026-06-29 11:55:50.06	Verdulería	cmqz5vtsy00ahxhd807lierxs	2026-06-29 11:55:50.063	2026-06-29 11:55:50.063	4.6	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:50.06	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:50.063	\N
\.


--
-- Data for Name: MerchantAcquiredProduct; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantAcquiredProduct" (id, "merchantId", "productId", "createdAt") FROM stdin;
\.


--
-- Data for Name: MerchantCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantCategory" (id, "merchantId", "categoryId", "createdAt") FROM stdin;
cmqz5vri2001sxhd8bmae5h7v	cmqz5vrhh001qxhd80605qjj8	cmqz5vqyn000oxhd8fpc7qxgz	2026-06-29 11:55:47.066
cmqz5vrwj0032xhd8jxorksyp	cmqz5vrwc0030xhd8eqeurj4k	cmqz5vqwu000gxhd8quylpbyn	2026-06-29 11:55:47.587
cmqz5vs7x004cxhd81favyzca	cmqz5vs7q004axhd8fyr7ixm3	cmqz5vqxu000jxhd856aalwvq	2026-06-29 11:55:47.997
cmqz5vslg005mxhd8zxc7wzs8	cmqz5vsla005kxhd8ax92pmri	cmqz5vqx1000hxhd86j3rab6t	2026-06-29 11:55:48.485
cmqz5vswh006wxhd8uc7hzpn1	cmqz5vswb006uxhd8c5bcq86n	cmqz5vqxd000ixhd8e2wu3ki0	2026-06-29 11:55:48.882
cmqz5vt710086xhd8zlnxwg6j	cmqz5vt6v0084xhd80bepwszu	cmqz5vqxz000kxhd8glc5szfn	2026-06-29 11:55:49.261
cmqz5vtj2009gxhd89f44s0as	cmqz5vtiv009exhd8vvyf8nns	cmqz5vqy9000mxhd84i6y95uu	2026-06-29 11:55:49.695
cmqz5vttg00aqxhd8p5u6lem4	cmqz5vttb00aoxhd8gww43etq	cmqz5vqyv000pxhd8lec7u05x	2026-06-29 11:55:50.069
\.


--
-- Data for Name: MerchantDocumentChangeRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantDocumentChangeRequest" (id, "merchantId", "documentField", reason, status, "resolvedAt", "resolvedBy", "resolutionNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MerchantLoyaltyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantLoyaltyConfig" (id, tier, "minOrdersPerMonth", "commissionRate", "badgeText", "badgeColor", "benefitsJson", "displayOrder", "createdAt", "updatedAt") FROM stdin;
cmqz5vr0v0010xhd8ix98ppsa	BRONCE	0	10	Nuevo	gray	[]	1	2026-06-29 11:55:46.448	2026-06-29 11:55:46.448
cmqz5vr130011xhd811robxcc	PLATA	30	9	Destacado	blue	["Comisión reducida 9%"]	2	2026-06-29 11:55:46.455	2026-06-29 11:55:46.455
cmqz5vr160012xhd8f9e1ifz4	ORO	80	8	Popular	yellow	["Comisión reducida 8%"]	3	2026-06-29 11:55:46.459	2026-06-29 11:55:46.459
cmqz5vr190013xhd8806wb7x1	DIAMANTE	200	7	Elite	purple	["Comisión reducida 7%"]	4	2026-06-29 11:55:46.462	2026-06-29 11:55:46.462
\.


--
-- Data for Name: MoovyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MoovyConfig" (id, key, value, description, "updatedAt") FROM stdin;
cmqz5vque0006xhd8utadcukv	default_merchant_commission_pct	10	Comisión MOOVY a comercios (%)	2026-06-29 11:55:46.214
cmqz5vquo0007xhd8g2kp4h5f	default_seller_commission_pct	12	Comisión MOOVY a vendedores (%)	2026-06-29 11:55:46.224
cmqz5vqw3000bxhd8f02e3a3a	driver_search_window_minutes	20	Ventana de búsqueda de repartidor	2026-06-29 11:55:46.275
cmqz5vqw7000cxhd8tx4xxlzl	driver_search_radius_meters	15000	Radio de búsqueda de drivers	2026-06-29 11:55:46.279
cmqz5vqwc000dxhd86qb6v3y9	points_per_dollar	1	Puntos por peso	2026-06-29 11:55:46.285
cmqz5vqwj000exhd8dxavtvdw	signup_bonus	100	Bonus registro	2026-06-29 11:55:46.292
cmqz5vqwn000fxhd8ap5lm932	min_points_to_redeem	100	Mínimo para canjear	2026-06-29 11:55:46.296
cmqz9c3jg0001lqdygbjevmud	max_delivery_distance_km	50	Distancia máxima de entrega en kilómetros	2026-07-01 17:36:59.669
cmqz9c3jm0002lqdylx1bxkuo	min_order_amount_ars	500	Monto mínimo de pedido en pesos argentinos	2026-07-01 17:36:59.673
cmr2britk000j2uz20oio8ot8	seller_commission_pct	10	Porcentaje de comisión predeterminado para vendedores	2026-07-01 17:36:59.677
cmr2brits000k2uz2c3vyj8zb	driver_commission_pct	15	Porcentaje de comisión predeterminado para repartidores	2026-07-01 17:36:59.681
cmqz5vqvy000axhd8s8sn6enu	max_assignment_attempts	5	Intentos máximos para asignar un repartidor antes de escalar a ops	2026-07-01 17:36:59.686
cmqz9c3j20000lqdyox7kns5z	assignment_rating_radius_meters	300	Radio en metros para priorizar repartidores por rating	2026-07-01 17:36:59.69
cmqz9c3jr0003lqdy8ra7d5qa	scheduled_notify_before_minutes	30	Minutos antes de un pedido programado para notificar al comercio	2026-07-01 17:36:59.693
cmqz9c3jw0004lqdyzpla3v7g	scheduled_cancel_if_no_confirm_minutes	10	Minutos para cancelar automáticamente si no hay confirmación de pedido programado	2026-07-01 17:36:59.698
cmqz5vqvn0009xhd8y3mez5lm	driver_response_timeout_seconds	60	Segundos que un repartidor tiene para aceptar/rechazar una oferta	2026-07-02 12:12:40.378
cmqz5vqur0008xhd8laxp5obt	merchant_confirm_timeout_seconds	300	Segundos que un comercio tiene para confirmar un pedido nuevo	2026-07-02 12:12:40.412
\.


--
-- Data for Name: MpWebhookLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MpWebhookLog" (id, "eventId", "eventType", "resourceId", processed, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "isPickup", "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveryStatus", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt", "cancelReason", "commissionPaid", "pointsEarned", "pointsUsed", "pickupPin", "pickupPinVerifiedAt", "pickupPinAttempts", "deliveryPin", "deliveryPinVerifiedAt", "deliveryPinAttempts", "failedDeliveryAt", "failedDeliveryReason", "nearDestinationNotified", "driverRating", "merchantPayout", "moovyCommission", "ratedAt", "rateReminderSentAt", "ratingComment", "merchantRating", "merchantRatingComment", "sellerRating", "sellerRatingComment", "driverRatingModerationStatus", "driverRatingReportCount", "merchantRatingModerationStatus", "merchantRatingReportCount", "sellerRatingModerationStatus", "sellerRatingReportCount", "driverTipMethod", "driverTipAmount", "driverTipDeclaredAt", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "lastAssignmentAt", "pendingDriverId", "driverSearchUntil", "deletedAt", "mpPreferenceId", "mpPaymentId", "mpMerchantOrderId", "mpStatus", "paidAt", "isMultiVendor", "deliveryType", "scheduledSlotStart", "scheduledSlotEnd", "scheduledConfirmedAt", "couponCode", "merchantStatus", "driverStatus", "waitingStartedAt", "noShowReportedAt", "payoutHoldUntil", "noShowFlag") FROM stdin;
\.


--
-- Data for Name: OrderBackup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderBackup" (id, "backupName", "orderData", "orderId", "orderNumber", total, "deletedBy", "deletedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: OrderChat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderChat" (id, "orderId", "subOrderId", "chatType", "participantAId", "participantBId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderChatMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderChatMessage" (id, "chatId", "senderId", content, "isRead", "isSystem", "createdAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", "listingId", name, price, quantity, "variantName", subtotal, "subOrderId", "packageCategoryName") FROM stdin;
\.


--
-- Data for Name: PackageCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackageCategory" (id, name, "maxWeightGrams", "maxLengthCm", "maxWidthCm", "maxHeightCm", "volumeScore", "allowedVehicles", "isActive", "displayOrder", "createdAt", "updatedAt") FROM stdin;
cmqz5vr1f0014xhd83erjqolw	MICRO	500	20	15	10	1	{BIKE,MOTO,CAR,TRUCK}	t	1	2026-06-29 11:55:46.468	2026-07-01 17:36:59.579
cmqz5vr1z0017xhd8k68fpeuc	SMALL	2000	35	25	20	3	{BIKE,MOTO,CAR,TRUCK}	t	2	2026-06-29 11:55:46.487	2026-07-01 17:36:59.608
cmqz5vr26001axhd8t5ik06rv	MEDIUM	5000	50	40	30	6	{MOTO,CAR,TRUCK}	t	3	2026-06-29 11:55:46.494	2026-07-01 17:36:59.611
cmqz5vr2g001dxhd8t1c3c19v	LARGE	15000	80	60	50	10	{CAR,TRUCK}	t	4	2026-06-29 11:55:46.504	2026-07-01 17:36:59.614
cmqz5vr2o001gxhd8q3y0ks8l	XL	50000	150	100	100	20	{TRUCK}	t	5	2026-06-29 11:55:46.513	2026-07-01 17:36:59.618
\.


--
-- Data for Name: PackagePricingTier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackagePricingTier" (id, name, "minItems", "maxItems", "pricePerItem", "totalPrice", "isActive", "order", "createdAt") FROM stdin;
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
\.


--
-- Data for Name: PayoutBatch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayoutBatch" (id, "batchType", status, "periodStart", "periodEnd", "totalAmount", "itemCount", "csvPath", "generatedBy", "paidBy", "paidAt", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayoutItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayoutItem" (id, "batchId", "recipientType", "recipientId", "recipientName", "bankAccount", cuit, amount, "ordersIncluded", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: PendingAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PendingAssignment" (id, "orderId", "currentDriverId", "attemptNumber", "expiresAt", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PlaybookChecklist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlaybookChecklist" (id, name, description, category, "isActive", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PlaybookStep; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlaybookStep" (id, "checklistId", content, "order", required, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PointsConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsConfig" (id, "pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus", "reviewBonus", "pointsExpireDays", "refereeBonus", "minPurchaseForBonus", "minReferralPurchase", "tierWindowDays", "tierConfigJson", "updatedAt", "earnBoostMultiplier", "earnBoostUntil") FROM stdin;
points_config	1	0	0.01	100	50	100	200	10	\N	100	5000	8000	90	\N	2026-07-06 16:54:18.925	1	\N
\.


--
-- Data for Name: PointsTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsTransaction" (id, "userId", "orderId", type, amount, "balanceAfter", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: PreLaunchLead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PreLaunchLead" (id, role, name, email, whatsapp, consent, "consentAt", "ipAddress", "userAgent", source, contacted, "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "deletedAt", "deletedBy", "deletedReason", "createdAt", "updatedAt", "packageCategoryId", "weightGrams", "volumeMl") FROM stdin;
cmqz5vric001uxhd8dq3pebwc	Heineken Lata 1L	heineken-1l	Cerveza Heineken lata 1 litro.	cmqz5vrhh001qxhd80605qjj8	3500	2800	50	5	t	t	\N	\N	\N	2026-06-29 11:55:47.075	2026-06-29 11:55:47.075	\N	\N	\N
cmqz5vriy0020xhd87abgsp11	Patagonia 24.7 IPA	patagonia-247	Session IPA suave y refrescante.	cmqz5vrhh001qxhd80605qjj8	4200	3400	30	5	t	t	\N	\N	\N	2026-06-29 11:55:47.098	2026-06-29 11:55:47.098	\N	\N	\N
cmqz5vrja0026xhd8qe6xdjlj	Schneider 710ml	schneider-710	Cerveza rubia clásica.	cmqz5vrhh001qxhd80605qjj8	2800	2100	40	5	t	f	\N	\N	\N	2026-06-29 11:55:47.11	2026-06-29 11:55:47.11	\N	\N	\N
cmqz5vrjl002cxhd833p7o57x	Coca-Cola 2.25L	coca-225	Gaseosa Coca-Cola 2.25 litros.	cmqz5vrhh001qxhd80605qjj8	2900	2000	60	5	t	f	\N	\N	\N	2026-06-29 11:55:47.122	2026-06-29 11:55:47.122	\N	\N	\N
cmqz5vrjx002ixhd8nhkuh93p	Agua Mineral Eco 2L	agua-eco-2l	Agua mineral sin gas.	cmqz5vrhh001qxhd80605qjj8	1200	700	0	5	t	f	\N	\N	\N	2026-06-29 11:55:47.133	2026-06-29 11:55:47.133	\N	\N	\N
cmqz5vrk8002oxhd8yvzwazhc	Papas Lays Clásicas	lays-clasicas	Papas fritas 150g.	cmqz5vrhh001qxhd80605qjj8	2500	1600	3	5	t	f	\N	\N	\N	2026-06-29 11:55:47.144	2026-06-29 11:55:47.144	\N	\N	\N
cmqz5vrwm0034xhd8d4r9d6to	Falafel Clásico (6u)	falafel-clasico	6 falafel caseros con tahini.	cmqz5vrwc0030xhd8eqeurj4k	5500	3200	25	5	t	t	\N	\N	\N	2026-06-29 11:55:47.59	2026-06-29 11:55:47.59	\N	\N	\N
cmqz5vrwu003axhd81da2tlo4	Hummus con Pan Pita	hummus-pita	Hummus casero con pan pita tibio.	cmqz5vrwc0030xhd8eqeurj4k	4200	2400	20	5	t	t	\N	\N	\N	2026-06-29 11:55:47.599	2026-06-29 11:55:47.599	\N	\N	\N
cmqz5vrx3003gxhd8ub7noyt3	Shawarma de Pollo	shawarma-pollo	Shawarma de pollo con vegetales y salsa.	cmqz5vrwc0030xhd8eqeurj4k	6800	4000	15	5	t	f	\N	\N	\N	2026-06-29 11:55:47.607	2026-06-29 11:55:47.607	\N	\N	\N
cmqz5vrxc003mxhd83jyk6h5w	Ensalada Tabbouleh	tabbouleh	Ensalada fresca de perejil, trigo y limón.	cmqz5vrwc0030xhd8eqeurj4k	3900	2100	12	5	t	f	\N	\N	\N	2026-06-29 11:55:47.617	2026-06-29 11:55:47.617	\N	\N	\N
cmqz5vrxo003sxhd871zld6hg	Baklava (2u)	baklava	Postre de masa filo, nueces y miel.	cmqz5vrwc0030xhd8eqeurj4k	3200	1800	2	5	t	f	\N	\N	\N	2026-06-29 11:55:47.628	2026-06-29 11:55:47.628	\N	\N	\N
cmqz5vrxy003yxhd877e5bc3x	Limonada de Menta	limonada-menta	Limonada casera con menta.	cmqz5vrwc0030xhd8eqeurj4k	2400	1200	30	5	t	f	\N	\N	\N	2026-06-29 11:55:47.638	2026-06-29 11:55:47.638	\N	\N	\N
cmqz5vs80004exhd844e7zog3	Cordero Fueguino (1/2)	cordero-fueguino	Medio cordero al asador.	cmqz5vs7q004axhd8fyr7ixm3	28000	19000	8	5	t	t	\N	\N	\N	2026-06-29 11:55:48	2026-06-29 11:55:48	\N	\N	\N
cmqz5vs8b004kxhd8bi21pzoz	Tabla La Estancia (2p)	tabla-estancia	Fiambres y quesos patagónicos.	cmqz5vs7q004axhd8fyr7ixm3	12500	8000	10	5	t	t	\N	\N	\N	2026-06-29 11:55:48.011	2026-06-29 11:55:48.011	\N	\N	\N
cmqz5vs8k004qxhd8eap2pdy6	Bife de Chorizo 400g	bife-chorizo	Bife de chorizo a la parrilla.	cmqz5vs7q004axhd8fyr7ixm3	11000	7500	14	5	t	f	\N	\N	\N	2026-06-29 11:55:48.021	2026-06-29 11:55:48.021	\N	\N	\N
cmqz5vs8v004wxhd89uzvo3ri	Provoleta	provoleta	Provoleta a la parrilla con orégano.	cmqz5vs7q004axhd8fyr7ixm3	5500	3200	18	5	t	f	\N	\N	\N	2026-06-29 11:55:48.032	2026-06-29 11:55:48.032	\N	\N	\N
cmqz5vs950052xhd8bzz3hc88	Beagle Red Ale	beagle-red-ale	Cerveza artesanal de Ushuaia.	cmqz5vs7q004axhd8fyr7ixm3	4500	3200	0	5	t	f	\N	\N	\N	2026-06-29 11:55:48.041	2026-06-29 11:55:48.041	\N	\N	\N
cmqz5vs9k0058xhd8go65yynp	Flan Casero	flan-casero	Flan con dulce de leche y crema.	cmqz5vs7q004axhd8fyr7ixm3	3500	1900	16	5	t	f	\N	\N	\N	2026-06-29 11:55:48.057	2026-06-29 11:55:48.057	\N	\N	\N
cmqz5vslj005oxhd8tkfo0b25	Muzzarella Grande	muzza-grande	Pizza de muzzarella a la piedra.	cmqz5vsla005kxhd8ax92pmri	7800	4200	30	5	t	t	\N	\N	\N	2026-06-29 11:55:48.488	2026-06-29 11:55:48.488	\N	\N	\N
cmqz5vsls005uxhd8m8x7l5jp	Napolitana	napolitana	Muzza, tomate, ajo y albahaca.	cmqz5vsla005kxhd8ax92pmri	8900	4800	25	5	t	t	\N	\N	\N	2026-06-29 11:55:48.496	2026-06-29 11:55:48.496	\N	\N	\N
cmqz5vsm10060xhd8o0zr7ojg	Fugazzeta Rellena	fugazzeta	Doble muzza y cebolla.	cmqz5vsla005kxhd8ax92pmri	9800	5400	20	5	t	f	\N	\N	\N	2026-06-29 11:55:48.506	2026-06-29 11:55:48.506	\N	\N	\N
cmqz5vsm90066xhd8lcqqk1xb	Calabresa	calabresa	Muzza con longaniza calabresa.	cmqz5vsla005kxhd8ax92pmri	9200	5100	4	5	t	f	\N	\N	\N	2026-06-29 11:55:48.514	2026-06-29 11:55:48.514	\N	\N	\N
cmqz5vsmh006cxhd8mnj4fj2f	Empanada (docena)	empanadas-docena	Docena de empanadas surtidas.	cmqz5vsla005kxhd8ax92pmri	9600	5200	22	5	t	f	\N	\N	\N	2026-06-29 11:55:48.522	2026-06-29 11:55:48.522	\N	\N	\N
cmqz5vsmp006ixhd8s1clp988	Faina	faina	Faina de garbanzos recién horneada.	cmqz5vsla005kxhd8ax92pmri	1800	900	0	5	t	f	\N	\N	\N	2026-06-29 11:55:48.53	2026-06-29 11:55:48.53	\N	\N	\N
cmqz5vswk006yxhd85fzl6bjp	Smash Doble	smash-doble	Doble medallón smash, cheddar y salsa.	cmqz5vswb006uxhd8c5bcq86n	8500	4600	40	5	t	t	\N	\N	\N	2026-06-29 11:55:48.885	2026-06-29 11:55:48.885	\N	\N	\N
cmqz5vsws0074xhd8fu7xje1i	Cheeseburger Clásica	cheeseburger	Medallón, cheddar, pickles.	cmqz5vswb006uxhd8c5bcq86n	6900	3800	35	5	t	t	\N	\N	\N	2026-06-29 11:55:48.892	2026-06-29 11:55:48.892	\N	\N	\N
cmqz5vsx0007axhd81gi0m5ww	Veggie Burger	veggie-burger	Medallón de garbanzo y remolacha.	cmqz5vswb006uxhd8c5bcq86n	7200	4000	12	5	t	f	\N	\N	\N	2026-06-29 11:55:48.9	2026-06-29 11:55:48.9	\N	\N	\N
cmqz5vsx8007gxhd8gq8utpws	Papas Cheddar y Bacon	papas-cheddar-bacon	Papas con cheddar y panceta.	cmqz5vswb006uxhd8c5bcq86n	5400	2800	28	5	t	f	\N	\N	\N	2026-06-29 11:55:48.908	2026-06-29 11:55:48.908	\N	\N	\N
cmqz5vsxg007mxhd8xms5cyyk	Nuggets x10	nuggets-10	10 nuggets crocantes con salsa.	cmqz5vswb006uxhd8c5bcq86n	5800	3100	2	5	t	f	\N	\N	\N	2026-06-29 11:55:48.917	2026-06-29 11:55:48.917	\N	\N	\N
cmqz5vsxo007sxhd8av6s1rmm	Cerveza Artesanal Pinta	pinta-artesanal	Pinta de cerveza artesanal local.	cmqz5vswb006uxhd8c5bcq86n	3800	2400	24	5	t	f	\N	\N	\N	2026-06-29 11:55:48.924	2026-06-29 11:55:48.924	\N	\N	\N
cmqz5vt740088xhd8njzv9jaq	Flat White	flat-white	Espresso doble con leche texturada.	cmqz5vt6v0084xhd80bepwszu	2900	1300	100	5	t	t	\N	\N	\N	2026-06-29 11:55:49.265	2026-06-29 11:55:49.265	\N	\N	\N
cmqz5vt7d008exhd8e225dbgn	Medialunas (3u)	medialunas-3	Tres medialunas de manteca.	cmqz5vt6v0084xhd80bepwszu	2400	1100	50	5	t	t	\N	\N	\N	2026-06-29 11:55:49.273	2026-06-29 11:55:49.273	\N	\N	\N
cmqz5vt7l008kxhd85l4k8cie	Cheesecake de Frutos Rojos	cheesecake	Porción de cheesecake casero.	cmqz5vt6v0084xhd80bepwszu	4200	2200	14	5	t	f	\N	\N	\N	2026-06-29 11:55:49.281	2026-06-29 11:55:49.281	\N	\N	\N
cmqz5vt7v008qxhd8wep5yjsd	Tostado Jamón y Queso	tostado-jyq	Tostado en pan de masa madre.	cmqz5vt6v0084xhd80bepwszu	3800	1900	20	5	t	f	\N	\N	\N	2026-06-29 11:55:49.291	2026-06-29 11:55:49.291	\N	\N	\N
cmqz5vt87008wxhd8i4ruq4dp	Café Filtrado V60	v60	Método filtrado, granos de especialidad.	cmqz5vt6v0084xhd80bepwszu	3200	1400	0	5	t	f	\N	\N	\N	2026-06-29 11:55:49.304	2026-06-29 11:55:49.304	\N	\N	\N
cmqz5vt8l0092xhd8javeo8kq	Submarino	submarino	Leche caliente con barra de chocolate.	cmqz5vt6v0084xhd80bepwszu	3000	1500	30	5	t	f	\N	\N	\N	2026-06-29 11:55:49.317	2026-06-29 11:55:49.317	\N	\N	\N
cmqz5vtj5009ixhd8t46zn9wf	Ibuprofeno 400mg x10	ibuprofeno-400	Analgésico y antiinflamatorio.	cmqz5vtiv009exhd8vvyf8nns	2800	1700	80	5	t	t	\N	\N	\N	2026-06-29 11:55:49.698	2026-06-29 11:55:49.698	\N	\N	\N
cmqz5vtjf009oxhd8c9i4wrzy	Alcohol en Gel 250ml	alcohol-gel	Alcohol en gel sanitizante.	cmqz5vtiv009exhd8vvyf8nns	1900	1000	60	5	t	f	\N	\N	\N	2026-06-29 11:55:49.707	2026-06-29 11:55:49.707	\N	\N	\N
cmqz5vtjo009uxhd8xkhsizbc	Protector Solar FPS50	protector-fps50	Protección alta para el sur.	cmqz5vtiv009exhd8vvyf8nns	8900	5500	18	5	t	t	\N	\N	\N	2026-06-29 11:55:49.717	2026-06-29 11:55:49.717	\N	\N	\N
cmqz5vtjy00a0xhd80d91kijs	Termómetro Digital	termometro	Termómetro digital de punta flexible.	cmqz5vtiv009exhd8vvyf8nns	6500	4000	5	5	t	f	\N	\N	\N	2026-06-29 11:55:49.726	2026-06-29 11:55:49.726	\N	\N	\N
cmqz5vtk800a6xhd80xq981ri	Barbijo x10	barbijo-10	Pack de 10 barbijos tricapa.	cmqz5vtiv009exhd8vvyf8nns	2200	1200	0	5	t	f	\N	\N	\N	2026-06-29 11:55:49.736	2026-06-29 11:55:49.736	\N	\N	\N
cmqz5vtkk00acxhd86vi289ms	Vitamina C x60	vitamina-c	Suplemento de vitamina C.	cmqz5vtiv009exhd8vvyf8nns	5400	3200	26	5	t	f	\N	\N	\N	2026-06-29 11:55:49.749	2026-06-29 11:55:49.749	\N	\N	\N
cmqz5vttk00asxhd88mkfnrrz	Banana (kg)	banana-kg	Banana ecuatoriana por kilo.	cmqz5vttb00aoxhd8gww43etq	2200	1300	40	5	t	t	\N	\N	\N	2026-06-29 11:55:50.072	2026-06-29 11:55:50.072	\N	\N	\N
cmqz5vttr00ayxhd8nnpj4071	Tomate Perita (kg)	tomate-kg	Tomate perita fresco por kilo.	cmqz5vttb00aoxhd8gww43etq	2600	1500	35	5	t	f	\N	\N	\N	2026-06-29 11:55:50.08	2026-06-29 11:55:50.08	\N	\N	\N
cmqz5vttz00b4xhd8p5x14oeu	Papa Negra (kg)	papa-kg	Papa negra por kilo.	cmqz5vttb00aoxhd8gww43etq	1500	800	80	5	t	t	\N	\N	\N	2026-06-29 11:55:50.087	2026-06-29 11:55:50.087	\N	\N	\N
cmqz5vtu700baxhd85r80nq4c	Palta Hass (u)	palta	Palta Hass madura, unidad.	cmqz5vttb00aoxhd8gww43etq	1800	1100	3	5	t	f	\N	\N	\N	2026-06-29 11:55:50.095	2026-06-29 11:55:50.095	\N	\N	\N
cmqz5vtuf00bgxhd8gls84ah6	Lechuga Mantecosa	lechuga	Lechuga mantecosa fresca.	cmqz5vttb00aoxhd8gww43etq	1400	700	22	5	t	f	\N	\N	\N	2026-06-29 11:55:50.103	2026-06-29 11:55:50.103	\N	\N	\N
cmqz5vtun00bmxhd8ij93bqj4	Frutillas (250g)	frutillas	Caja de frutillas seleccionadas.	cmqz5vttb00aoxhd8gww43etq	3900	2400	0	5	t	f	\N	\N	\N	2026-06-29 11:55:50.111	2026-06-29 11:55:50.111	\N	\N	\N
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, "productId", "categoryId") FROM stdin;
cmqz5vrij001wxhd87afjwca2	cmqz5vric001uxhd8dq3pebwc	cmqz5vqyn000oxhd8fpc7qxgz
cmqz5vrj20022xhd8rkwntdut	cmqz5vriy0020xhd87abgsp11	cmqz5vqyn000oxhd8fpc7qxgz
cmqz5vrjd0028xhd8kgcvvk94	cmqz5vrja0026xhd8qe6xdjlj	cmqz5vqyn000oxhd8fpc7qxgz
cmqz5vrjq002exhd8akb63gv1	cmqz5vrjl002cxhd833p7o57x	cmqz5vqyn000oxhd8fpc7qxgz
cmqz5vrk1002kxhd8z1ipazdd	cmqz5vrjx002ixhd8nhkuh93p	cmqz5vqyn000oxhd8fpc7qxgz
cmqz5vrkb002qxhd8aia97zck	cmqz5vrk8002oxhd8yvzwazhc	cmqz5vqyn000oxhd8fpc7qxgz
cmqz5vrwp0036xhd82amhwqp3	cmqz5vrwm0034xhd8d4r9d6to	cmqz5vqwu000gxhd8quylpbyn
cmqz5vrwx003cxhd82300iuac	cmqz5vrwu003axhd81da2tlo4	cmqz5vqwu000gxhd8quylpbyn
cmqz5vrx6003ixhd81thgfmzd	cmqz5vrx3003gxhd8ub7noyt3	cmqz5vqwu000gxhd8quylpbyn
cmqz5vrxg003oxhd8prjolhk7	cmqz5vrxc003mxhd83jyk6h5w	cmqz5vqwu000gxhd8quylpbyn
cmqz5vrxr003uxhd8qagcr4nf	cmqz5vrxo003sxhd871zld6hg	cmqz5vqwu000gxhd8quylpbyn
cmqz5vry20040xhd8hp96edem	cmqz5vrxy003yxhd877e5bc3x	cmqz5vqwu000gxhd8quylpbyn
cmqz5vs83004gxhd8gxwgwcce	cmqz5vs80004exhd844e7zog3	cmqz5vqxu000jxhd856aalwvq
cmqz5vs8e004mxhd8s2829jb1	cmqz5vs8b004kxhd8bi21pzoz	cmqz5vqxu000jxhd856aalwvq
cmqz5vs8o004sxhd81mj6eroi	cmqz5vs8k004qxhd8eap2pdy6	cmqz5vqxu000jxhd856aalwvq
cmqz5vs8z004yxhd8qrg79w8m	cmqz5vs8v004wxhd89uzvo3ri	cmqz5vqxu000jxhd856aalwvq
cmqz5vs980054xhd8mz77sbjg	cmqz5vs950052xhd8bzz3hc88	cmqz5vqxu000jxhd856aalwvq
cmqz5vs9p005axhd88lgi4nir	cmqz5vs9k0058xhd8go65yynp	cmqz5vqxu000jxhd856aalwvq
cmqz5vslm005qxhd8aki8als2	cmqz5vslj005oxhd8tkfo0b25	cmqz5vqx1000hxhd86j3rab6t
cmqz5vslw005wxhd8na940kap	cmqz5vsls005uxhd8m8x7l5jp	cmqz5vqx1000hxhd86j3rab6t
cmqz5vsm40062xhd8ptaxuxzh	cmqz5vsm10060xhd8o0zr7ojg	cmqz5vqx1000hxhd86j3rab6t
cmqz5vsmc0068xhd8ehi1io6c	cmqz5vsm90066xhd8lcqqk1xb	cmqz5vqx1000hxhd86j3rab6t
cmqz5vsmk006exhd8c23g9r14	cmqz5vsmh006cxhd8mnj4fj2f	cmqz5vqx1000hxhd86j3rab6t
cmqz5vsms006kxhd84g8g6ht5	cmqz5vsmp006ixhd8s1clp988	cmqz5vqx1000hxhd86j3rab6t
cmqz5vswn0070xhd8g9jmz5q5	cmqz5vswk006yxhd85fzl6bjp	cmqz5vqxd000ixhd8e2wu3ki0
cmqz5vswv0076xhd8tykppvs8	cmqz5vsws0074xhd8fu7xje1i	cmqz5vqxd000ixhd8e2wu3ki0
cmqz5vsx3007cxhd8myyocynk	cmqz5vsx0007axhd81gi0m5ww	cmqz5vqxd000ixhd8e2wu3ki0
cmqz5vsxb007ixhd8u9trjqp0	cmqz5vsx8007gxhd8gq8utpws	cmqz5vqxd000ixhd8e2wu3ki0
cmqz5vsxj007oxhd8ywk3r7mh	cmqz5vsxg007mxhd8xms5cyyk	cmqz5vqxd000ixhd8e2wu3ki0
cmqz5vsxr007uxhd8y54rthk8	cmqz5vsxo007sxhd8av6s1rmm	cmqz5vqxd000ixhd8e2wu3ki0
cmqz5vt77008axhd8jo0ln2r2	cmqz5vt740088xhd8njzv9jaq	cmqz5vqxz000kxhd8glc5szfn
cmqz5vt7g008gxhd87g7xkfa3	cmqz5vt7d008exhd8e225dbgn	cmqz5vqxz000kxhd8glc5szfn
cmqz5vt7o008mxhd825423yqy	cmqz5vt7l008kxhd85l4k8cie	cmqz5vqxz000kxhd8glc5szfn
cmqz5vt7z008sxhd8tjp3a8lb	cmqz5vt7v008qxhd8wep5yjsd	cmqz5vqxz000kxhd8glc5szfn
cmqz5vt8b008yxhd8xpfmoezi	cmqz5vt87008wxhd8i4ruq4dp	cmqz5vqxz000kxhd8glc5szfn
cmqz5vt8o0094xhd8wszxaz7x	cmqz5vt8l0092xhd8javeo8kq	cmqz5vqxz000kxhd8glc5szfn
cmqz5vtj9009kxhd8zyp06afz	cmqz5vtj5009ixhd8t46zn9wf	cmqz5vqy9000mxhd84i6y95uu
cmqz5vtji009qxhd85v2j1o9n	cmqz5vtjf009oxhd8c9i4wrzy	cmqz5vqy9000mxhd84i6y95uu
cmqz5vtjr009wxhd8rhgyh8oy	cmqz5vtjo009uxhd8xkhsizbc	cmqz5vqy9000mxhd84i6y95uu
cmqz5vtk100a2xhd8ij7yqqfm	cmqz5vtjy00a0xhd80d91kijs	cmqz5vqy9000mxhd84i6y95uu
cmqz5vtkd00a8xhd8vf8qndc1	cmqz5vtk800a6xhd80xq981ri	cmqz5vqy9000mxhd84i6y95uu
cmqz5vtko00aexhd801ou0lmh	cmqz5vtkk00acxhd86vi289ms	cmqz5vqy9000mxhd84i6y95uu
cmqz5vttm00auxhd88anne1f8	cmqz5vttk00asxhd88mkfnrrz	cmqz5vqyv000pxhd8lec7u05x
cmqz5vttu00b0xhd8mz1f0ruh	cmqz5vttr00ayxhd8nnpj4071	cmqz5vqyv000pxhd8lec7u05x
cmqz5vtu200b6xhd8fs4k4mv1	cmqz5vttz00b4xhd8p5x14oeu	cmqz5vqyv000pxhd8lec7u05x
cmqz5vtu900bcxhd88a09lxob	cmqz5vtu700baxhd85r80nq4c	cmqz5vqyv000pxhd8lec7u05x
cmqz5vtuh00bixhd8s133dior	cmqz5vtuf00bgxhd8gls84ah6	cmqz5vqyv000pxhd8lec7u05x
cmqz5vtup00boxhd8zzcppm7c	cmqz5vtun00bmxhd8ij93bqj4	cmqz5vqyv000pxhd8lec7u05x
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductImage" (id, "productId", url, alt, "order") FROM stdin;
cmqz5vris001yxhd8tigpo7kt	cmqz5vric001uxhd8dq3pebwc	https://picsum.photos/seed/moovy-heineken-1l/600/600	Heineken Lata 1L	0
cmqz5vrj60024xhd8e8akth0c	cmqz5vriy0020xhd87abgsp11	https://picsum.photos/seed/moovy-patagonia-247/600/600	Patagonia 24.7 IPA	0
cmqz5vrjh002axhd8t3shklay	cmqz5vrja0026xhd8qe6xdjlj	https://picsum.photos/seed/moovy-schneider-710/600/600	Schneider 710ml	0
cmqz5vrju002gxhd8bznoc7kq	cmqz5vrjl002cxhd833p7o57x	https://picsum.photos/seed/moovy-coca-225/600/600	Coca-Cola 2.25L	0
cmqz5vrk4002mxhd8a61bjrpa	cmqz5vrjx002ixhd8nhkuh93p	https://picsum.photos/seed/moovy-agua-eco-2l/600/600	Agua Mineral Eco 2L	0
cmqz5vrkg002sxhd8au0pgcwi	cmqz5vrk8002oxhd8yvzwazhc	https://picsum.photos/seed/moovy-lays-clasicas/600/600	Papas Lays Clásicas	0
cmqz5vrws0038xhd8w7hm4rh5	cmqz5vrwm0034xhd8d4r9d6to	https://picsum.photos/seed/moovy-falafel-clasico/600/600	Falafel Clásico (6u)	0
cmqz5vrx0003exhd8avrn0r60	cmqz5vrwu003axhd81da2tlo4	https://picsum.photos/seed/moovy-hummus-pita/600/600	Hummus con Pan Pita	0
cmqz5vrx9003kxhd8yifpykzn	cmqz5vrx3003gxhd8ub7noyt3	https://picsum.photos/seed/moovy-shawarma-pollo/600/600	Shawarma de Pollo	0
cmqz5vrxk003qxhd8zgeqt5pp	cmqz5vrxc003mxhd83jyk6h5w	https://picsum.photos/seed/moovy-tabbouleh/600/600	Ensalada Tabbouleh	0
cmqz5vrxv003wxhd8jtn54661	cmqz5vrxo003sxhd871zld6hg	https://picsum.photos/seed/moovy-baklava/600/600	Baklava (2u)	0
cmqz5vry60042xhd8i954pq11	cmqz5vrxy003yxhd877e5bc3x	https://picsum.photos/seed/moovy-limonada-menta/600/600	Limonada de Menta	0
cmqz5vs86004ixhd8h1w0x7ff	cmqz5vs80004exhd844e7zog3	https://picsum.photos/seed/moovy-cordero-fueguino/600/600	Cordero Fueguino (1/2)	0
cmqz5vs8h004oxhd8d1t924ge	cmqz5vs8b004kxhd8bi21pzoz	https://picsum.photos/seed/moovy-tabla-estancia/600/600	Tabla La Estancia (2p)	0
cmqz5vs8s004uxhd86lmm7qft	cmqz5vs8k004qxhd8eap2pdy6	https://picsum.photos/seed/moovy-bife-chorizo/600/600	Bife de Chorizo 400g	0
cmqz5vs920050xhd8f775tf1o	cmqz5vs8v004wxhd89uzvo3ri	https://picsum.photos/seed/moovy-provoleta/600/600	Provoleta	0
cmqz5vs9g0056xhd8z169kuqf	cmqz5vs950052xhd8bzz3hc88	https://picsum.photos/seed/moovy-beagle-red-ale/600/600	Beagle Red Ale	0
cmqz5vs9u005cxhd8g8d5t9oz	cmqz5vs9k0058xhd8go65yynp	https://picsum.photos/seed/moovy-flan-casero/600/600	Flan Casero	0
cmqz5vslp005sxhd88w2fudjp	cmqz5vslj005oxhd8tkfo0b25	https://picsum.photos/seed/moovy-muzza-grande/600/600	Muzzarella Grande	0
cmqz5vsly005yxhd8cnunvply	cmqz5vsls005uxhd8m8x7l5jp	https://picsum.photos/seed/moovy-napolitana/600/600	Napolitana	0
cmqz5vsm70064xhd8hyp97lny	cmqz5vsm10060xhd8o0zr7ojg	https://picsum.photos/seed/moovy-fugazzeta/600/600	Fugazzeta Rellena	0
cmqz5vsmf006axhd8i9v1zv32	cmqz5vsm90066xhd8lcqqk1xb	https://picsum.photos/seed/moovy-calabresa/600/600	Calabresa	0
cmqz5vsmn006gxhd8f3x3gns8	cmqz5vsmh006cxhd8mnj4fj2f	https://picsum.photos/seed/moovy-empanadas-docena/600/600	Empanada (docena)	0
cmqz5vsmv006mxhd8p0csp44g	cmqz5vsmp006ixhd8s1clp988	https://picsum.photos/seed/moovy-faina/600/600	Faina	0
cmqz5vswq0072xhd8axhu5bli	cmqz5vswk006yxhd85fzl6bjp	https://picsum.photos/seed/moovy-smash-doble/600/600	Smash Doble	0
cmqz5vswx0078xhd8ma5m3cio	cmqz5vsws0074xhd8fu7xje1i	https://picsum.photos/seed/moovy-cheeseburger/600/600	Cheeseburger Clásica	0
cmqz5vsx5007exhd8kuzipoig	cmqz5vsx0007axhd81gi0m5ww	https://picsum.photos/seed/moovy-veggie-burger/600/600	Veggie Burger	0
cmqz5vsxe007kxhd8tvhgkkps	cmqz5vsx8007gxhd8gq8utpws	https://picsum.photos/seed/moovy-papas-cheddar-bacon/600/600	Papas Cheddar y Bacon	0
cmqz5vsxl007qxhd8rbejql3z	cmqz5vsxg007mxhd8xms5cyyk	https://picsum.photos/seed/moovy-nuggets-10/600/600	Nuggets x10	0
cmqz5vsxt007wxhd8i4s3k276	cmqz5vsxo007sxhd8av6s1rmm	https://picsum.photos/seed/moovy-pinta-artesanal/600/600	Cerveza Artesanal Pinta	0
cmqz5vt7a008cxhd8rl8y0kpt	cmqz5vt740088xhd8njzv9jaq	https://picsum.photos/seed/moovy-flat-white/600/600	Flat White	0
cmqz5vt7i008ixhd8dcx2nrbt	cmqz5vt7d008exhd8e225dbgn	https://picsum.photos/seed/moovy-medialunas-3/600/600	Medialunas (3u)	0
cmqz5vt7r008oxhd8w97q7ow0	cmqz5vt7l008kxhd85l4k8cie	https://picsum.photos/seed/moovy-cheesecake/600/600	Cheesecake de Frutos Rojos	0
cmqz5vt84008uxhd8vqpl7x55	cmqz5vt7v008qxhd8wep5yjsd	https://picsum.photos/seed/moovy-tostado-jyq/600/600	Tostado Jamón y Queso	0
cmqz5vt8h0090xhd8sz6e5g2d	cmqz5vt87008wxhd8i4ruq4dp	https://picsum.photos/seed/moovy-v60/600/600	Café Filtrado V60	0
cmqz5vt8s0096xhd8cbm57or9	cmqz5vt8l0092xhd8javeo8kq	https://picsum.photos/seed/moovy-submarino/600/600	Submarino	0
cmqz5vtjc009mxhd8nc9yyw3d	cmqz5vtj5009ixhd8t46zn9wf	https://picsum.photos/seed/moovy-ibuprofeno-400/600/600	Ibuprofeno 400mg x10	0
cmqz5vtjl009sxhd8z8gpvj2s	cmqz5vtjf009oxhd8c9i4wrzy	https://picsum.photos/seed/moovy-alcohol-gel/600/600	Alcohol en Gel 250ml	0
cmqz5vtju009yxhd8eypz71bs	cmqz5vtjo009uxhd8xkhsizbc	https://picsum.photos/seed/moovy-protector-fps50/600/600	Protector Solar FPS50	0
cmqz5vtk400a4xhd8xwpdgvu1	cmqz5vtjy00a0xhd80d91kijs	https://picsum.photos/seed/moovy-termometro/600/600	Termómetro Digital	0
cmqz5vtkg00aaxhd8r58tdcyo	cmqz5vtk800a6xhd80xq981ri	https://picsum.photos/seed/moovy-barbijo-10/600/600	Barbijo x10	0
cmqz5vtkr00agxhd86u7hm5ld	cmqz5vtkk00acxhd86vi289ms	https://picsum.photos/seed/moovy-vitamina-c/600/600	Vitamina C x60	0
cmqz5vttp00awxhd8udzvj4vr	cmqz5vttk00asxhd88mkfnrrz	https://picsum.photos/seed/moovy-banana-kg/600/600	Banana (kg)	0
cmqz5vttw00b2xhd8llxku5av	cmqz5vttr00ayxhd8nnpj4071	https://picsum.photos/seed/moovy-tomate-kg/600/600	Tomate Perita (kg)	0
cmqz5vtu400b8xhd8lc22lyqg	cmqz5vttz00b4xhd8p5x14oeu	https://picsum.photos/seed/moovy-papa-kg/600/600	Papa Negra (kg)	0
cmqz5vtuc00bexhd8f2zju172	cmqz5vtu700baxhd85r80nq4c	https://picsum.photos/seed/moovy-palta/600/600	Palta Hass (u)	0
cmqz5vtuk00bkxhd8856goox3	cmqz5vtuf00bgxhd8gls84ah6	https://picsum.photos/seed/moovy-lechuga/600/600	Lechuga Mantecosa	0
cmqz5vtur00bqxhd8i9bsb5je	cmqz5vtun00bmxhd8ij93bqj4	https://picsum.photos/seed/moovy-frutillas/600/600	Frutillas (250g)	0
\.


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductVariant" (id, "productId", name, price, stock, "isActive") FROM stdin;
\.


--
-- Data for Name: ProductWeightCache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductWeightCache" (id, "nameHash", "nameSample", "weightGrams", "volumeMl", "packageCategoryId", "suggestedVehicle", source, confidence, "hitCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PushSubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PushSubscription" (id, "userId", endpoint, p256dh, auth, "createdAt") FROM stdin;
\.


--
-- Data for Name: RatingReport; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RatingReport" (id, "orderId", "reporterUserId", target, reason, "createdAt", "resolvedAt", "resolvedBy", resolution) FROM stdin;
\.


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Referral" (id, "referrerId", "refereeId", "codeUsed", "referrerPoints", "refereePoints", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: SavedCart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SavedCart" (id, "userId", items, "merchantId", "reminderCount", "lastRemindedAt", "recoveredAt", "cartValue", "createdAt", "updatedAt") FROM stdin;
cmr3yq4hg0000mh52b79k92y7	cmqxvnefm0009127w2od9xv70	[{"id": "cmqz5vt740088xhd8njzv9jaq-default-1783024456446", "name": "Flat White", "type": "product", "image": "https://picsum.photos/seed/moovy-flat-white/600/600", "price": 2900, "quantity": 1, "productId": "cmqz5vt740088xhd8njzv9jaq", "merchantId": "cmqz5vt6v0084xhd80bepwszu"}]	\N	0	\N	\N	2900	2026-07-02 20:34:17.519	2026-07-02 20:34:17.519
cmr409v240009mh52ne6xbyhf	cmqz5vwfh00fzxhd8bchmmyw5	[{"id": "cmqz5vt740088xhd8njzv9jaq-default-1783027056955", "name": "Flat White", "type": "product", "image": "https://picsum.photos/seed/moovy-flat-white/600/600", "price": 2900, "quantity": 1, "productId": "cmqz5vt740088xhd8njzv9jaq", "merchantId": "cmqz5vt6v0084xhd80bepwszu"}]	\N	0	\N	\N	2900	2026-07-02 21:17:38.044	2026-07-02 21:17:38.044
\.


--
-- Data for Name: SellerAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerAvailability" (id, "sellerId", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
cmqz5vu5a00c0xhd8uo6y4aqt	cmqz5vu4q00brxhd81ch7zi9a	t	f	\N	20	f	\N	2026-06-29 11:55:50.494	2026-06-29 11:55:50.494
cmqz5vugq00cuxhd8qhyf0ech	cmqz5vugc00clxhd8gg7ilj46	t	f	\N	20	f	\N	2026-06-29 11:55:50.906	2026-06-29 11:55:50.906
cmqz5vuqb00doxhd892snclpd	cmqz5vupu00dfxhd81e9l3ck7	t	f	\N	20	f	\N	2026-06-29 11:55:51.252	2026-06-29 11:55:51.252
cmqz5vv1500eixhd8796i7qg6	cmqz5vv0p00e9xhd8vtohx0lr	t	f	\N	20	f	\N	2026-06-29 11:55:51.642	2026-06-29 11:55:51.642
\.


--
-- Data for Name: SellerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerProfile" (id, "userId", "displayName", bio, avatar, cuit, "acceptedTermsAt", "acceptedPrivacyAt", "bankAlias", "bankCbu", "isActive", "isVerified", "applicationStatus", "approvedAt", "rejectionReason", "pausedByUserAt", "pausedByUserReason", "cancelledByUserAt", "cancelledByUserReason", "totalSales", rating, "commissionRate", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "isOnline", "isPaused", "pauseEndsAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
cmqz5vu5100byxhd8qu8um889	cmqz5vu4q00brxhd81ch7zi9a	TecnoSur	Electrónica y gadgets en Ushuaia. Envíos rápidos.	https://picsum.photos/seed/moovy-seller-vendedor1@somosmoovy.com/600/600	\N	2026-06-29 11:55:50.482	2026-06-29 11:55:50.482	\N	\N	t	t	APPROVED	2026-06-29 11:55:50.482	\N	\N	\N	\N	\N	0	4.7	12	\N	\N	\N	\N	\N	t	f	\N	f	\N	\N	\N	15	f	\N	2026-06-29 11:55:50.485	2026-06-29 11:55:50.485
cmqz5vugm00csxhd8o0zs72aa	cmqz5vugc00clxhd8gg7ilj46	Moda Austral	Indumentaria para el frío fueguino.	https://picsum.photos/seed/moovy-seller-vendedor2@somosmoovy.com/600/600	\N	2026-06-29 11:55:50.9	2026-06-29 11:55:50.9	\N	\N	t	t	APPROVED	2026-06-29 11:55:50.9	\N	\N	\N	\N	\N	0	4.8	12	\N	\N	\N	\N	\N	t	f	\N	f	\N	\N	\N	15	f	\N	2026-06-29 11:55:50.903	2026-06-29 11:55:50.903
cmqz5vuq700dmxhd8ldqyrukh	cmqz5vupu00dfxhd81e9l3ck7	Hogar Beagle	Todo para tu casa, con estilo del sur.	https://picsum.photos/seed/moovy-seller-vendedor3@somosmoovy.com/600/600	\N	2026-06-29 11:55:51.244	2026-06-29 11:55:51.244	\N	\N	t	t	APPROVED	2026-06-29 11:55:51.244	\N	\N	\N	\N	\N	0	4.5	12	\N	\N	\N	\N	\N	t	f	\N	f	\N	\N	\N	15	f	\N	2026-06-29 11:55:51.247	2026-06-29 11:55:51.247
cmqz5vv1200egxhd8raq97j04	cmqz5vv0p00e9xhd8vtohx0lr	Patagonia Outdoor	Equipamiento para aventura y montaña.	https://picsum.photos/seed/moovy-seller-vendedor4@somosmoovy.com/600/600	\N	2026-06-29 11:55:51.635	2026-06-29 11:55:51.635	\N	\N	t	t	APPROVED	2026-06-29 11:55:51.635	\N	\N	\N	\N	\N	0	4.9	12	\N	\N	\N	\N	\N	t	f	\N	f	\N	\N	\N	15	f	\N	2026-06-29 11:55:51.638	2026-06-29 11:55:51.638
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "isMaintenanceMode", "maintenanceMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt", "promoPopupButtonText", "promoPopupDismissable", "promoPopupEnabled", "promoPopupImage", "promoPopupLink", "promoPopupMessage", "promoPopupTitle", "showComerciosCard", "showRepartidoresCard", "tiendaMaintenance", "maxCategoriesHome", "heroSliderEnabled", "heroSliderInterval", "heroSliderShowArrows", "supportChatEnabled", "promoBannerButtonLink", "promoBannerButtonText", "promoBannerEnabled", "promoBannerImage", "promoBannerSubtitle", "promoBannerTitle", "promoBannerCtaPosition", "promoSlidesJson", "riderCommissionPercent", "zoneMultipliersJson", "climateMultipliersJson", "activeClimateCondition", "demandMultipliersJson", "activeDemandCondition", "operationalCostPercent", "excludedZonesJson", "defaultMerchantCommission", "defaultSellerCommission", "mpReservePercent", "cashMpOnlyDeliveries", "cashLimitL1", "cashLimitL2", "cashLimitL3", "maxOrdersPerSlot", "slotDurationMinutes", "minAnticipationHours", "maxAnticipationHours", "operatingHoursStart", "operatingHoursEnd", "merchantConfirmTimeoutSec", "driverResponseTimeoutSec", "adPricePlatino", "adPriceDestacado", "adPricePremium", "adPriceHeroBanner", "adPriceBannerPromo", "adPriceProducto", "adLaunchDiscountPercent", "adMaxHeroBannerSlots", "adMaxDestacadosSlots", "adMaxProductosSlots", "adMinDurationDays", "adDiscount3Months", "adDiscount6Months", "adPaymentMethods", "adCancellation48hFullRefund", "adCancellationAdminFeePercent", "heroBackgroundsJson", "bankName", "bankAccountHolder", "bankCbu", "bankAlias", "bankCuit") FROM stdin;
settings	t	Volvemos pronto	f	Próximamente en Ushuaia.	1591	0.06	500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-06-29 11:55:46.2	Ver m??s	t	f	\N	\N	\N	\N	t	t	f	6	t	5000	t	t	/productos?categoria=pizzas	Ver locales	f	\N	2x1 en locales seleccionados de 20hs a 23hs.	Noches de\nPizza & Pelis	abajo-izquierda	[]	80	{"ZONA_A":1.0,"ZONA_B":1.15,"ZONA_C":1.35}	{"normal":1.0,"lluvia_leve":1.15,"temporal_fuerte":1.30}	normal	{"normal":1.0,"alta":1.20,"pico":1.40}	normal	5	[]	10	12	8	10	15000	25000	40000	15	120	1.5	48	09:00	22:00	300	60	150000	95000	55000	250000	180000	25000	50	3	8	12	7	10	20	["mercadopago","transferencia"]	t	10	{}					
\.


--
-- Data for Name: SubOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubOrder" (id, "orderId", "merchantId", "sellerId", status, subtotal, "deliveryFee", discount, total, "driverId", "moovyCommission", "sellerPayout", "tripCost", "operationalCost", "driverPayoutAmount", "merchantCommissionRate", "merchantCommissionSource", "zoneCode", "zoneMultiplier", "zoneDriverBonus", "paymentStatus", "deliveryStatus", "deliveredAt", "deliveryPhoto", "driverRating", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "pendingDriverId", "createdAt", "updatedAt", "mpTransferId", "payoutStatus", "paidOutAt", "pickupPin", "pickupPinVerifiedAt", "pickupPinAttempts", "deliveryPin", "deliveryPinVerifiedAt", "deliveryPinAttempts", "failedDeliveryAt", "failedDeliveryReason", "nearDestinationNotified", "merchantStatus", "driverStatus", "waitingStartedAt", "noShowReportedAt", "payoutHoldUntil", "noShowFlag") FROM stdin;
\.


--
-- Data for Name: SupportChat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportChat" (id, "userId", "merchantId", "operatorId", subject, category, status, priority, rating, "ratingComment", "lastMessageAt", "resolvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportMessage" (id, "chatId", "senderId", content, "isFromAdmin", "isSystem", "isRead", "attachmentUrl", "attachmentType", "createdAt") FROM stdin;
\.


--
-- Data for Name: SupportOperator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportOperator" (id, "userId", "displayName", "isActive", "isOnline", "maxChats", "lastSeenAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "privacyConsentAt", "termsConsentAt", "privacyConsentVersion", "termsConsentVersion", "age18Confirmed", "marketingConsent", "marketingConsentAt", "marketingConsentRevokedAt", "cookiesConsent", "cookiesConsentAt", "resetToken", "resetTokenExpiry", "deletedAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "archivedAt", "failedLoginAttempts", "loginLockedUntil", "onboardingCompletedAt", "pointsExpiryNotifiedAt") FROM stdin;
cmqz5vrgz001jxhd84w7eneza	comercio1@somosmoovy.com	$2b$12$yF6/4feNZrmKkGW/zI752eg44jwODi1JejVllozBQ6DuoL3r0r.vm	Carlos Patagonia	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vrgz001kxhd8fe0upbjz	\N	2026-06-29 11:55:47.028	2026-06-29 11:55:47.028	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vrw1002txhd87zyecnx4	comercio2@somosmoovy.com	$2b$12$oVMqCC2ghpHlJwVoXN6qhuXqtDCso2C7/AN3noGM2QEuHvAA9Unfi	Ana Falafel	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vrw1002uxhd8iip6q3hu	\N	2026-06-29 11:55:47.57	2026-06-29 11:55:47.57	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vs7g0043xhd8q2mrshtc	comercio3@somosmoovy.com	$2b$12$H5R6Tq23xOLGjA8RWik86u8y3wHOjhOjvWynZf/HYuNYYgglxZ4WK	Pedro Estancia	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vs7g0044xhd8kmxpsmub	\N	2026-06-29 11:55:47.98	2026-06-29 11:55:47.98	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vsl0005dxhd8sst0a1h3	comercio4@somosmoovy.com	$2b$12$gnL2yWnNJfz5eGCeXpo3g.RqX/2xlYjkg3knsYE5Y9.lkkq.IpMlq	Lucía Martial	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vsl0005exhd8t29yq40f	\N	2026-06-29 11:55:48.468	2026-06-29 11:55:48.468	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vsvy006nxhd8cea1yx8k	comercio5@somosmoovy.com	$2b$12$MvXMTxOTp5U2ujTaqygif.37Whxp97s8kSiR7D.jXmok.DPmVC8uu	Diego Beagle	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vsvy006oxhd85im89bep	\N	2026-06-29 11:55:48.862	2026-06-29 11:55:48.862	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vt6i007xxhd8hsy8f7ox	comercio6@somosmoovy.com	$2b$12$M4.hnnEzjeOiZTOVTMi4E.fiwP.XSwXnfLH/4eEdszeqyN8CD8ZwO	Sofía Canal	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vt6i007yxhd8wx7qpv3a	\N	2026-06-29 11:55:49.243	2026-06-29 11:55:49.243	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vtik0097xhd8n00sds6h	comercio7@somosmoovy.com	$2b$12$JPYQMexHSzqOJOUcSVM2uu60CULV393WGSrsTD6iGE7.K4dbg/VgS	Farm. Roberto Sur	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vtik0098xhd8m0fzihsw	\N	2026-06-29 11:55:49.677	2026-06-29 11:55:49.677	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vtsy00ahxhd807lierxs	comercio8@somosmoovy.com	$2b$12$qLlUdPL1uxoYk5lk6UHtBemD4aGWdaBEDTWLME.TWukwovQIqMvPi	Marta Huerta	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vtsy00aixhd8f83wb28t	\N	2026-06-29 11:55:50.05	2026-06-29 11:55:50.05	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vu4q00brxhd81ch7zi9a	vendedor1@somosmoovy.com	$2b$12$T3YorJnX93jXZPBU0P1AreBj8aAP7FHF43TLYmumvciEtzD7OV7TK	Martín Tecno	\N	\N	\N	SELLER	\N	\N	0	0	f	cmqz5vu4r00bsxhd8t29i5q44	\N	2026-06-29 11:55:50.475	2026-06-29 11:55:50.475	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vugc00clxhd8gg7ilj46	vendedor2@somosmoovy.com	$2b$12$bGkY7KH4he7DysDh5UsS6O9BYl9FP1eAX/hB6oYujKcX6diJ53HHq	Caro Austral	\N	\N	\N	SELLER	\N	\N	0	0	f	cmqz5vugc00cmxhd85gi8ehfm	\N	2026-06-29 11:55:50.893	2026-06-29 11:55:50.893	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vupu00dfxhd81e9l3ck7	vendedor3@somosmoovy.com	$2b$12$ncmIYyp9Y9sm3s4glc6OIu20cAWrTiN3DmC5K8vWKm63akVegBQzi	Hernán Hogar	\N	\N	\N	SELLER	\N	\N	0	0	f	cmqz5vupu00dgxhd8baswgebt	\N	2026-06-29 11:55:51.234	2026-06-29 11:55:51.234	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vv0p00e9xhd8vtohx0lr	vendedor4@somosmoovy.com	$2b$12$rDe18.JZZyCFHKCeNU4aCeNVdMmTqG5H/DWa2wjwIleQ1rqQuWnKK	Vale Outdoor	\N	\N	\N	SELLER	\N	\N	0	0	f	cmqz5vv0p00eaxhd8awgcnsw6	\N	2026-06-29 11:55:51.626	2026-06-29 11:55:51.626	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vvmh00fbxhd84xtx2cxu	repartidor2@somosmoovy.com	$2b$12$r4yJqua1ydau1GZ534KwD..lHnb95szoStw65//XLI.4/A9wPOmD2	Lucas Delivery	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmqz5vvmh00fcxhd8epk923ku	\N	2026-06-29 11:55:52.409	2026-06-29 11:55:52.409	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vvwa00fjxhd8xtqudcev	repartidor3@somosmoovy.com	$2b$12$yl/hOmdNw3z0SofyaiHfDOPhvNTplD/eNxXBp.aW8DyFghiFLJWyy	Brian Express	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmqz5vvwa00fkxhd8tiegd01w	\N	2026-06-29 11:55:52.762	2026-06-29 11:55:52.762	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vw6e00frxhd8xzbnhvi3	repartidor4@somosmoovy.com	$2b$12$SCzlk3i5xewt6sCl6HzMlOzi6FTj2nomvuW61Jn149v/QANGQt5Ua	Nico Veloz	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmqz5vw6e00fsxhd8fi2f7iwm	\N	2026-06-29 11:55:53.127	2026-06-29 11:55:53.127	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vwo300g5xhd8ok66ryk2	cliente2@somosmoovy.com	$2b$12$9TQLXmAHdwsUyp76bGzOIuvt4C7CsmL.3ESB7Zwi233KqW5.aluKe	Pedro Comprador	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vwo300g6xhd8fo4i2nby	\N	2026-06-29 11:55:53.763	2026-06-29 11:55:53.763	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vwws00gbxhd8xdblt14z	cliente3@somosmoovy.com	$2b$12$9q91L9dMys9zsNJgBBKjgO3rmqK5OFExmfJJEbUojP7g8AJLw4Ufa	Lucía Test	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vwws00gcxhd8ifwc7bkh	\N	2026-06-29 11:55:54.076	2026-06-29 11:55:54.076	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vx5l00ghxhd8xnar59ix	cliente4@somosmoovy.com	$2b$12$EfMi32tg/BNF9KGFede11OJs3dScKvyk3ted7lL7Ds5MFgBQ80Hve	Marco Demo	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vx5l00gixhd8lk39samr	\N	2026-06-29 11:55:54.393	2026-06-29 11:55:54.393	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vva600f3xhd89zcsytov	repartidor1@somosmoovy.com	$2b$12$wM6iMD5E3RXXdUr5GYnjc.ywxwzoF08aXzL.JKLJSHm0NzMKtQ3RW	Mateo Rider	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmqz5vva600f4xhd8q48id7j2	\N	2026-06-29 11:55:51.966	2026-06-29 12:11:39.124	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vwfh00fzxhd8bchmmyw5	cliente1@somosmoovy.com	$2b$12$7ZFsSIglT1XVS/UewQDNYO4T.UjlCul7h9mv6sCYTJ4N.xVVgJYNO	Juana Cliente	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vwfh00g0xhd8w7w3k570	\N	2026-06-29 11:55:53.453	2026-07-02 21:17:16.559	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	2026-07-02 21:17:16.557	\N
cmqz5vqsx0000xhd86fq6wm5d	admin@somosmoovy.com	$2b$12$HFVjzgO.i0.sicgFCjfO..bH.EvNWZ82KtvUPoDfVJXaAyWqN.GF2	Admin MOOVY	Admin	MOOVY	\N	ADMIN	\N	\N	0	0	f	cmqz5vqsy0001xhd8ezz8nqma	\N	2026-06-29 11:55:46.16	2026-07-06 17:01:28.941	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
\.


--
-- Data for Name: UserActivityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserActivityLog" (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmqz6fb5e0001hf7e3liafkb8	cmqz5vqsx0000xhd86fq6wm5d	LOGIN	User	cmqz5vqsx0000xhd86fq6wm5d	{"method":"credentials"}	\N	\N	2026-06-29 12:10:58.993
cmqz6g65q0003hf7e2t569gbl	cmqz5vva600f3xhd89zcsytov	LOGIN	User	cmqz5vva600f3xhd89zcsytov	{"method":"credentials"}	\N	\N	2026-06-29 12:11:39.182
cmr409ans0008mh52hvpalfde	cmqz5vwfh00fzxhd8bchmmyw5	LOGIN	User	cmqz5vwfh00fzxhd8bchmmyw5	{"method":"credentials"}	\N	\N	2026-07-02 21:17:11.601
cmr9gvuyi0001pygohno5fzyn	cmqz5vqsx0000xhd86fq6wm5d	LOGIN	User	cmqz5vqsx0000xhd86fq6wm5d	{"method":"credentials"}	\N	\N	2026-07-06 17:01:29.081
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" (id, "userId", role, "isActive", "activatedAt") FROM stdin;
cmqz5vqtl0003xhd8g1cn12bv	cmqz5vqsx0000xhd86fq6wm5d	ADMIN	t	2026-06-29 11:55:46.185
cmqz5vqtu0005xhd8b2sa3dyi	cmqz5vqsx0000xhd86fq6wm5d	USER	t	2026-06-29 11:55:46.194
cmqz5vrh5001mxhd8hvf3py0o	cmqz5vrgz001jxhd84w7eneza	COMERCIO	t	2026-06-29 11:55:47.033
cmqz5vrha001oxhd84wxlgdme	cmqz5vrgz001jxhd84w7eneza	USER	t	2026-06-29 11:55:47.038
cmqz5vrw5002wxhd8bhyh3qnw	cmqz5vrw1002txhd87zyecnx4	COMERCIO	t	2026-06-29 11:55:47.573
cmqz5vrw8002yxhd8lhflp840	cmqz5vrw1002txhd87zyecnx4	USER	t	2026-06-29 11:55:47.577
cmqz5vs7k0046xhd8h2ad7aa2	cmqz5vs7g0043xhd8q2mrshtc	COMERCIO	t	2026-06-29 11:55:47.984
cmqz5vs7m0048xhd88tkodkkh	cmqz5vs7g0043xhd8q2mrshtc	USER	t	2026-06-29 11:55:47.987
cmqz5vsl3005gxhd8eo1ktixt	cmqz5vsl0005dxhd8sst0a1h3	COMERCIO	t	2026-06-29 11:55:48.472
cmqz5vsl6005ixhd8rlxr8qep	cmqz5vsl0005dxhd8sst0a1h3	USER	t	2026-06-29 11:55:48.475
cmqz5vsw4006qxhd862y1ylal	cmqz5vsvy006nxhd8cea1yx8k	COMERCIO	t	2026-06-29 11:55:48.869
cmqz5vsw8006sxhd8hzm8eim5	cmqz5vsvy006nxhd8cea1yx8k	USER	t	2026-06-29 11:55:48.872
cmqz5vt6p0080xhd8kz4krmno	cmqz5vt6i007xxhd8hsy8f7ox	COMERCIO	t	2026-06-29 11:55:49.249
cmqz5vt6s0082xhd86zwryjal	cmqz5vt6i007xxhd8hsy8f7ox	USER	t	2026-06-29 11:55:49.252
cmqz5vtio009axhd8sv699c0w	cmqz5vtik0097xhd8n00sds6h	COMERCIO	t	2026-06-29 11:55:49.68
cmqz5vtir009cxhd8u4gt8w6k	cmqz5vtik0097xhd8n00sds6h	USER	t	2026-06-29 11:55:49.684
cmqz5vtt400akxhd855c765fs	cmqz5vtsy00ahxhd807lierxs	COMERCIO	t	2026-06-29 11:55:50.057
cmqz5vtt700amxhd8z6fcmxas	cmqz5vtsy00ahxhd807lierxs	USER	t	2026-06-29 11:55:50.06
cmqz5vu4u00buxhd8xrpvkex7	cmqz5vu4q00brxhd81ch7zi9a	SELLER	t	2026-06-29 11:55:50.479
cmqz5vu4x00bwxhd8uf49q7ob	cmqz5vu4q00brxhd81ch7zi9a	USER	t	2026-06-29 11:55:50.482
cmqz5vugg00coxhd8zudwbhft	cmqz5vugc00clxhd8gg7ilj46	SELLER	t	2026-06-29 11:55:50.896
cmqz5vugj00cqxhd8c9asrarb	cmqz5vugc00clxhd8gg7ilj46	USER	t	2026-06-29 11:55:50.899
cmqz5vupy00dixhd8idh8o857	cmqz5vupu00dfxhd81e9l3ck7	SELLER	t	2026-06-29 11:55:51.238
cmqz5vuq100dkxhd8ouihob5x	cmqz5vupu00dfxhd81e9l3ck7	USER	t	2026-06-29 11:55:51.242
cmqz5vv0w00ecxhd8gmrhjja2	cmqz5vv0p00e9xhd8vtohx0lr	SELLER	t	2026-06-29 11:55:51.632
cmqz5vv0y00eexhd8c4m7i63o	cmqz5vv0p00e9xhd8vtohx0lr	USER	t	2026-06-29 11:55:51.635
cmqz5vvaf00f6xhd8emx3biwj	cmqz5vva600f3xhd89zcsytov	DRIVER	t	2026-06-29 11:55:51.975
cmqz5vvah00f8xhd8q4j60ejy	cmqz5vva600f3xhd89zcsytov	USER	t	2026-06-29 11:55:51.978
cmqz5vvml00fexhd8p9gmuj3y	cmqz5vvmh00fbxhd84xtx2cxu	DRIVER	t	2026-06-29 11:55:52.413
cmqz5vvmn00fgxhd8jslf5w8l	cmqz5vvmh00fbxhd84xtx2cxu	USER	t	2026-06-29 11:55:52.416
cmqz5vvwi00fmxhd8x0vghv34	cmqz5vvwa00fjxhd8xtqudcev	DRIVER	t	2026-06-29 11:55:52.77
cmqz5vvwl00foxhd8999s79ua	cmqz5vvwa00fjxhd8xtqudcev	USER	t	2026-06-29 11:55:52.773
cmqz5vw6l00fuxhd8kzhzjvre	cmqz5vw6e00frxhd8xzbnhvi3	DRIVER	t	2026-06-29 11:55:53.134
cmqz5vw6o00fwxhd8nw15cku1	cmqz5vw6e00frxhd8xzbnhvi3	USER	t	2026-06-29 11:55:53.136
cmqz5vwfk00g2xhd875ymccnx	cmqz5vwfh00fzxhd8bchmmyw5	USER	t	2026-06-29 11:55:53.457
cmqz5vwo900g8xhd8pptdg54p	cmqz5vwo300g5xhd8ok66ryk2	USER	t	2026-06-29 11:55:53.77
cmqz5vwwv00gexhd8exzdddxf	cmqz5vwws00gbxhd8xdblt14z	USER	t	2026-06-29 11:55:54.079
cmqz5vx5s00gkxhd89scbuylg	cmqz5vx5l00ghxhd8xnar59ix	USER	t	2026-06-29 11:55:54.4
\.


--
-- Data for Name: UserSegment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSegment" (id, name, description, filters, "lastCount", "lastCountAt", "createdBy", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Name: AdPlacement AdPlacement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdPlacement"
    ADD CONSTRAINT "AdPlacement_pkey" PRIMARY KEY (id);


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: AdminNote AdminNote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminNote"
    ADD CONSTRAINT "AdminNote_pkey" PRIMARY KEY (id);


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
-- Name: Bid Bid_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_pkey" PRIMARY KEY (id);


--
-- Name: BroadcastCampaign BroadcastCampaign_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BroadcastCampaign"
    ADD CONSTRAINT "BroadcastCampaign_pkey" PRIMARY KEY (id);


--
-- Name: CannedResponse CannedResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CannedResponse"
    ADD CONSTRAINT "CannedResponse_pkey" PRIMARY KEY (id);


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
-- Name: ConfigAuditLog ConfigAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConfigAuditLog"
    ADD CONSTRAINT "ConfigAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ConsentLog ConsentLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsentLog"
    ADD CONSTRAINT "ConsentLog_pkey" PRIMARY KEY (id);


--
-- Name: CouponUsage CouponUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_pkey" PRIMARY KEY (id);


--
-- Name: Coupon Coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Coupon"
    ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY (id);


--
-- Name: CronRunLog CronRunLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CronRunLog"
    ADD CONSTRAINT "CronRunLog_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryAttempt DeliveryAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryRate DeliveryRate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryRate"
    ADD CONSTRAINT "DeliveryRate_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryZone DeliveryZone_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryZone"
    ADD CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY (id);


--
-- Name: DriverAvailabilitySubscription DriverAvailabilitySubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverAvailabilitySubscription"
    ADD CONSTRAINT "DriverAvailabilitySubscription_pkey" PRIMARY KEY (id);


--
-- Name: DriverDocumentChangeRequest DriverDocumentChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverDocumentChangeRequest"
    ADD CONSTRAINT "DriverDocumentChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: DriverLocationHistory DriverLocationHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverLocationHistory"
    ADD CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY (id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (id);


--
-- Name: EmailTemplate EmailTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmailTemplate"
    ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: FeatureFlag FeatureFlag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FeatureFlag"
    ADD CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY (id);


--
-- Name: HeroSlide HeroSlide_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HeroSlide"
    ADD CONSTRAINT "HeroSlide_pkey" PRIMARY KEY (id);


--
-- Name: HomeCategorySlot HomeCategorySlot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HomeCategorySlot"
    ADD CONSTRAINT "HomeCategorySlot_pkey" PRIMARY KEY (id);


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
-- Name: MerchantDocumentChangeRequest MerchantDocumentChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantDocumentChangeRequest"
    ADD CONSTRAINT "MerchantDocumentChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: MerchantLoyaltyConfig MerchantLoyaltyConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantLoyaltyConfig"
    ADD CONSTRAINT "MerchantLoyaltyConfig_pkey" PRIMARY KEY (id);


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
-- Name: OrderChatMessage OrderChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChatMessage"
    ADD CONSTRAINT "OrderChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: OrderChat OrderChat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChat"
    ADD CONSTRAINT "OrderChat_pkey" PRIMARY KEY (id);


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
-- Name: PayoutBatch PayoutBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutBatch"
    ADD CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY (id);


--
-- Name: PayoutItem PayoutItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutItem"
    ADD CONSTRAINT "PayoutItem_pkey" PRIMARY KEY (id);


--
-- Name: PendingAssignment PendingAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PendingAssignment"
    ADD CONSTRAINT "PendingAssignment_pkey" PRIMARY KEY (id);


--
-- Name: PlaybookChecklist PlaybookChecklist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlaybookChecklist"
    ADD CONSTRAINT "PlaybookChecklist_pkey" PRIMARY KEY (id);


--
-- Name: PlaybookStep PlaybookStep_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlaybookStep"
    ADD CONSTRAINT "PlaybookStep_pkey" PRIMARY KEY (id);


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
-- Name: PreLaunchLead PreLaunchLead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreLaunchLead"
    ADD CONSTRAINT "PreLaunchLead_pkey" PRIMARY KEY (id);


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
-- Name: ProductWeightCache ProductWeightCache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductWeightCache"
    ADD CONSTRAINT "ProductWeightCache_pkey" PRIMARY KEY (id);


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
-- Name: RatingReport RatingReport_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RatingReport"
    ADD CONSTRAINT "RatingReport_pkey" PRIMARY KEY (id);


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
-- Name: SupportOperator SupportOperator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportOperator"
    ADD CONSTRAINT "SupportOperator_pkey" PRIMARY KEY (id);


--
-- Name: UserActivityLog UserActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserActivityLog"
    ADD CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


--
-- Name: UserSegment UserSegment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSegment"
    ADD CONSTRAINT "UserSegment_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: AdPlacement_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdPlacement_merchantId_idx" ON public."AdPlacement" USING btree ("merchantId");


--
-- Name: AdPlacement_mpExternalRef_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AdPlacement_mpExternalRef_key" ON public."AdPlacement" USING btree ("mpExternalRef");


--
-- Name: AdPlacement_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdPlacement_paymentStatus_idx" ON public."AdPlacement" USING btree ("paymentStatus");


--
-- Name: AdPlacement_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdPlacement_status_idx" ON public."AdPlacement" USING btree (status);


--
-- Name: AdPlacement_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdPlacement_type_idx" ON public."AdPlacement" USING btree (type);


--
-- Name: AdminNote_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminNote_adminId_idx" ON public."AdminNote" USING btree ("adminId");


--
-- Name: AdminNote_userId_pinned_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminNote_userId_pinned_createdAt_idx" ON public."AdminNote" USING btree ("userId", pinned, "createdAt");


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
-- Name: AssignmentLog_subOrderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AssignmentLog_subOrderId_idx" ON public."AssignmentLog" USING btree ("subOrderId");


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
-- Name: Bid_listingId_amount_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Bid_listingId_amount_idx" ON public."Bid" USING btree ("listingId", amount);


--
-- Name: Bid_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Bid_userId_idx" ON public."Bid" USING btree ("userId");


--
-- Name: BroadcastCampaign_createdBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BroadcastCampaign_createdBy_idx" ON public."BroadcastCampaign" USING btree ("createdBy");


--
-- Name: BroadcastCampaign_segmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BroadcastCampaign_segmentId_idx" ON public."BroadcastCampaign" USING btree ("segmentId");


--
-- Name: BroadcastCampaign_status_scheduledAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BroadcastCampaign_status_scheduledAt_idx" ON public."BroadcastCampaign" USING btree (status, "scheduledAt");


--
-- Name: CannedResponse_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CannedResponse_category_idx" ON public."CannedResponse" USING btree (category);


--
-- Name: CannedResponse_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CannedResponse_isActive_idx" ON public."CannedResponse" USING btree ("isActive");


--
-- Name: CannedResponse_shortcut_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CannedResponse_shortcut_key" ON public."CannedResponse" USING btree (shortcut);


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
-- Name: ConfigAuditLog_adminUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConfigAuditLog_adminUserId_idx" ON public."ConfigAuditLog" USING btree ("adminUserId");


--
-- Name: ConfigAuditLog_configType_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConfigAuditLog_configType_createdAt_idx" ON public."ConfigAuditLog" USING btree ("configType", "createdAt");


--
-- Name: ConsentLog_acceptedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConsentLog_acceptedAt_idx" ON public."ConsentLog" USING btree ("acceptedAt");


--
-- Name: ConsentLog_userId_consentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ConsentLog_userId_consentType_idx" ON public."ConsentLog" USING btree ("userId", "consentType");


--
-- Name: CouponUsage_couponId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CouponUsage_couponId_idx" ON public."CouponUsage" USING btree ("couponId");


--
-- Name: CouponUsage_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CouponUsage_userId_idx" ON public."CouponUsage" USING btree ("userId");


--
-- Name: Coupon_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Coupon_code_idx" ON public."Coupon" USING btree (code);


--
-- Name: Coupon_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Coupon_code_key" ON public."Coupon" USING btree (code);


--
-- Name: Coupon_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Coupon_isActive_idx" ON public."Coupon" USING btree ("isActive");


--
-- Name: CronRunLog_jobName_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CronRunLog_jobName_startedAt_idx" ON public."CronRunLog" USING btree ("jobName", "startedAt");


--
-- Name: CronRunLog_jobName_success_completedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CronRunLog_jobName_success_completedAt_idx" ON public."CronRunLog" USING btree ("jobName", success, "completedAt");


--
-- Name: DeliveryAttempt_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAttempt_driverId_idx" ON public."DeliveryAttempt" USING btree ("driverId");


--
-- Name: DeliveryAttempt_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAttempt_orderId_idx" ON public."DeliveryAttempt" USING btree ("orderId");


--
-- Name: DeliveryAttempt_reason_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAttempt_reason_idx" ON public."DeliveryAttempt" USING btree (reason);


--
-- Name: DeliveryAttempt_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAttempt_startedAt_idx" ON public."DeliveryAttempt" USING btree ("startedAt");


--
-- Name: DeliveryAttempt_subOrderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryAttempt_subOrderId_idx" ON public."DeliveryAttempt" USING btree ("subOrderId");


--
-- Name: DeliveryRate_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeliveryRate_categoryId_key" ON public."DeliveryRate" USING btree ("categoryId");


--
-- Name: DeliveryZone_displayOrder_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryZone_displayOrder_idx" ON public."DeliveryZone" USING btree ("displayOrder");


--
-- Name: DeliveryZone_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DeliveryZone_isActive_idx" ON public."DeliveryZone" USING btree ("isActive");


--
-- Name: DeliveryZone_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeliveryZone_name_key" ON public."DeliveryZone" USING btree (name);


--
-- Name: DriverAvailabilitySubscription_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverAvailabilitySubscription_merchantId_idx" ON public."DriverAvailabilitySubscription" USING btree ("merchantId");


--
-- Name: DriverAvailabilitySubscription_notifiedAt_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverAvailabilitySubscription_notifiedAt_expiresAt_idx" ON public."DriverAvailabilitySubscription" USING btree ("notifiedAt", "expiresAt");


--
-- Name: DriverAvailabilitySubscription_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverAvailabilitySubscription_userId_idx" ON public."DriverAvailabilitySubscription" USING btree ("userId");


--
-- Name: DriverDocumentChangeRequest_driverId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverDocumentChangeRequest_driverId_status_idx" ON public."DriverDocumentChangeRequest" USING btree ("driverId", status);


--
-- Name: DriverDocumentChangeRequest_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverDocumentChangeRequest_status_createdAt_idx" ON public."DriverDocumentChangeRequest" USING btree (status, "createdAt");


--
-- Name: DriverLocationHistory_driverId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverLocationHistory_driverId_createdAt_idx" ON public."DriverLocationHistory" USING btree ("driverId", "createdAt");


--
-- Name: DriverLocationHistory_orderId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverLocationHistory_orderId_createdAt_idx" ON public."DriverLocationHistory" USING btree ("orderId", "createdAt");


--
-- Name: DriverLocationHistory_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DriverLocationHistory_timestamp_idx" ON public."DriverLocationHistory" USING btree ("timestamp");


--
-- Name: Driver_applicationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_applicationStatus_idx" ON public."Driver" USING btree ("applicationStatus");


--
-- Name: Driver_approvalStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_approvalStatus_idx" ON public."Driver" USING btree ("approvalStatus");


--
-- Name: Driver_cedulaVerdeExpiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_cedulaVerdeExpiresAt_idx" ON public."Driver" USING btree ("cedulaVerdeExpiresAt");


--
-- Name: Driver_fraudScore_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_fraudScore_idx" ON public."Driver" USING btree ("fraudScore");


--
-- Name: Driver_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_isActive_idx" ON public."Driver" USING btree ("isActive");


--
-- Name: Driver_isOnline_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_isOnline_idx" ON public."Driver" USING btree ("isOnline");


--
-- Name: Driver_isSuspended_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_isSuspended_idx" ON public."Driver" USING btree ("isSuspended");


--
-- Name: Driver_licenciaExpiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_licenciaExpiresAt_idx" ON public."Driver" USING btree ("licenciaExpiresAt");


--
-- Name: Driver_seguroExpiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_seguroExpiresAt_idx" ON public."Driver" USING btree ("seguroExpiresAt");


--
-- Name: Driver_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Driver_userId_key" ON public."Driver" USING btree ("userId");


--
-- Name: Driver_vtvExpiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_vtvExpiresAt_idx" ON public."Driver" USING btree ("vtvExpiresAt");


--
-- Name: EmailTemplate_category_recipient_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailTemplate_category_recipient_idx" ON public."EmailTemplate" USING btree (category, recipient);


--
-- Name: EmailTemplate_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailTemplate_isActive_idx" ON public."EmailTemplate" USING btree ("isActive");


--
-- Name: EmailTemplate_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "EmailTemplate_key_idx" ON public."EmailTemplate" USING btree (key);


--
-- Name: EmailTemplate_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "EmailTemplate_key_key" ON public."EmailTemplate" USING btree (key);


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
-- Name: FeatureFlag_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FeatureFlag_isActive_idx" ON public."FeatureFlag" USING btree ("isActive");


--
-- Name: FeatureFlag_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FeatureFlag_key_key" ON public."FeatureFlag" USING btree (key);


--
-- Name: FeatureFlag_scope_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FeatureFlag_scope_idx" ON public."FeatureFlag" USING btree (scope);


--
-- Name: HomeCategorySlot_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "HomeCategorySlot_categoryId_key" ON public."HomeCategorySlot" USING btree ("categoryId");


--
-- Name: HomeCategorySlot_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "HomeCategorySlot_order_idx" ON public."HomeCategorySlot" USING btree ("order");


--
-- Name: Listing_auctionEndsAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_auctionEndsAt_idx" ON public."Listing" USING btree ("auctionEndsAt");


--
-- Name: Listing_auctionStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_auctionStatus_idx" ON public."Listing" USING btree ("auctionStatus");


--
-- Name: Listing_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_categoryId_idx" ON public."Listing" USING btree ("categoryId");


--
-- Name: Listing_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_deletedAt_idx" ON public."Listing" USING btree ("deletedAt");


--
-- Name: Listing_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_isActive_idx" ON public."Listing" USING btree ("isActive");


--
-- Name: Listing_listingType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Listing_listingType_idx" ON public."Listing" USING btree ("listingType");


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
-- Name: MerchantDocumentChangeRequest_merchantId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MerchantDocumentChangeRequest_merchantId_status_idx" ON public."MerchantDocumentChangeRequest" USING btree ("merchantId", status);


--
-- Name: MerchantDocumentChangeRequest_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MerchantDocumentChangeRequest_status_createdAt_idx" ON public."MerchantDocumentChangeRequest" USING btree (status, "createdAt");


--
-- Name: MerchantLoyaltyConfig_tier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MerchantLoyaltyConfig_tier_idx" ON public."MerchantLoyaltyConfig" USING btree (tier);


--
-- Name: MerchantLoyaltyConfig_tier_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MerchantLoyaltyConfig_tier_key" ON public."MerchantLoyaltyConfig" USING btree (tier);


--
-- Name: Merchant_applicationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_applicationStatus_idx" ON public."Merchant" USING btree ("applicationStatus");


--
-- Name: Merchant_approvalStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_approvalStatus_idx" ON public."Merchant" USING btree ("approvalStatus");


--
-- Name: Merchant_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_isActive_idx" ON public."Merchant" USING btree ("isActive");


--
-- Name: Merchant_isSuspended_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_isSuspended_idx" ON public."Merchant" USING btree ("isSuspended");


--
-- Name: Merchant_loyaltyTier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_loyaltyTier_idx" ON public."Merchant" USING btree ("loyaltyTier");


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
-- Name: OrderChatMessage_chatId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderChatMessage_chatId_createdAt_idx" ON public."OrderChatMessage" USING btree ("chatId", "createdAt");


--
-- Name: OrderChatMessage_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderChatMessage_senderId_idx" ON public."OrderChatMessage" USING btree ("senderId");


--
-- Name: OrderChat_orderId_chatType_participantAId_participantBId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrderChat_orderId_chatType_participantAId_participantBId_key" ON public."OrderChat" USING btree ("orderId", "chatType", "participantAId", "participantBId");


--
-- Name: OrderChat_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderChat_orderId_idx" ON public."OrderChat" USING btree ("orderId");


--
-- Name: OrderChat_participantAId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderChat_participantAId_idx" ON public."OrderChat" USING btree ("participantAId");


--
-- Name: OrderChat_participantBId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderChat_participantBId_idx" ON public."OrderChat" USING btree ("participantBId");


--
-- Name: OrderChat_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderChat_status_idx" ON public."OrderChat" USING btree (status);


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
-- Name: Order_deliveryStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_deliveryStatus_idx" ON public."Order" USING btree ("deliveryStatus");


--
-- Name: Order_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_driverId_idx" ON public."Order" USING btree ("driverId");


--
-- Name: Order_driverRatingModerationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_driverRatingModerationStatus_idx" ON public."Order" USING btree ("driverRatingModerationStatus");


--
-- Name: Order_driverStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_driverStatus_idx" ON public."Order" USING btree ("driverStatus");


--
-- Name: Order_merchantRatingModerationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_merchantRatingModerationStatus_idx" ON public."Order" USING btree ("merchantRatingModerationStatus");


--
-- Name: Order_merchantStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_merchantStatus_idx" ON public."Order" USING btree ("merchantStatus");


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_paymentStatus_idx" ON public."Order" USING btree ("paymentStatus");


--
-- Name: Order_sellerRatingModerationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_sellerRatingModerationStatus_idx" ON public."Order" USING btree ("sellerRatingModerationStatus");


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
-- Name: PayoutBatch_batchType_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PayoutBatch_batchType_status_idx" ON public."PayoutBatch" USING btree ("batchType", status);


--
-- Name: PayoutBatch_generatedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PayoutBatch_generatedBy_idx" ON public."PayoutBatch" USING btree ("generatedBy");


--
-- Name: PayoutBatch_paidAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PayoutBatch_paidAt_idx" ON public."PayoutBatch" USING btree ("paidAt");


--
-- Name: PayoutItem_batchId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PayoutItem_batchId_idx" ON public."PayoutItem" USING btree ("batchId");


--
-- Name: PayoutItem_recipientType_recipientId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PayoutItem_recipientType_recipientId_idx" ON public."PayoutItem" USING btree ("recipientType", "recipientId");


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
-- Name: PlaybookChecklist_category_isActive_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlaybookChecklist_category_isActive_order_idx" ON public."PlaybookChecklist" USING btree (category, "isActive", "order");


--
-- Name: PlaybookStep_checklistId_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PlaybookStep_checklistId_order_idx" ON public."PlaybookStep" USING btree ("checklistId", "order");


--
-- Name: PreLaunchLead_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PreLaunchLead_createdAt_idx" ON public."PreLaunchLead" USING btree ("createdAt");


--
-- Name: PreLaunchLead_email_role_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PreLaunchLead_email_role_key" ON public."PreLaunchLead" USING btree (email, role);


--
-- Name: PreLaunchLead_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PreLaunchLead_role_idx" ON public."PreLaunchLead" USING btree (role);


--
-- Name: ProductCategory_productId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductCategory_productId_categoryId_key" ON public."ProductCategory" USING btree ("productId", "categoryId");


--
-- Name: ProductWeightCache_nameHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProductWeightCache_nameHash_key" ON public."ProductWeightCache" USING btree ("nameHash");


--
-- Name: ProductWeightCache_packageCategoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductWeightCache_packageCategoryId_idx" ON public."ProductWeightCache" USING btree ("packageCategoryId");


--
-- Name: ProductWeightCache_source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductWeightCache_source_idx" ON public."ProductWeightCache" USING btree (source);


--
-- Name: Product_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_deletedAt_idx" ON public."Product" USING btree ("deletedAt");


--
-- Name: Product_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_merchantId_idx" ON public."Product" USING btree ("merchantId");


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
-- Name: RatingReport_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RatingReport_orderId_idx" ON public."RatingReport" USING btree ("orderId");


--
-- Name: RatingReport_reporterUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RatingReport_reporterUserId_idx" ON public."RatingReport" USING btree ("reporterUserId");


--
-- Name: RatingReport_resolvedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RatingReport_resolvedAt_idx" ON public."RatingReport" USING btree ("resolvedAt");


--
-- Name: RatingReport_target_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RatingReport_target_idx" ON public."RatingReport" USING btree (target);


--
-- Name: Referral_refereeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Referral_refereeId_key" ON public."Referral" USING btree ("refereeId");


--
-- Name: SavedCart_updatedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SavedCart_updatedAt_idx" ON public."SavedCart" USING btree ("updatedAt");


--
-- Name: SavedCart_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SavedCart_userId_key" ON public."SavedCart" USING btree ("userId");


--
-- Name: SellerAvailability_sellerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SellerAvailability_sellerId_key" ON public."SellerAvailability" USING btree ("sellerId");


--
-- Name: SellerProfile_applicationStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SellerProfile_applicationStatus_idx" ON public."SellerProfile" USING btree ("applicationStatus");


--
-- Name: SellerProfile_isSuspended_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SellerProfile_isSuspended_idx" ON public."SellerProfile" USING btree ("isSuspended");


--
-- Name: SellerProfile_mpUserId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SellerProfile_mpUserId_key" ON public."SellerProfile" USING btree ("mpUserId");


--
-- Name: SellerProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SellerProfile_userId_key" ON public."SellerProfile" USING btree ("userId");


--
-- Name: SubOrder_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_driverId_idx" ON public."SubOrder" USING btree ("driverId");


--
-- Name: SubOrder_driverStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_driverStatus_idx" ON public."SubOrder" USING btree ("driverStatus");


--
-- Name: SubOrder_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_merchantId_idx" ON public."SubOrder" USING btree ("merchantId");


--
-- Name: SubOrder_merchantStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_merchantStatus_idx" ON public."SubOrder" USING btree ("merchantStatus");


--
-- Name: SubOrder_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_orderId_idx" ON public."SubOrder" USING btree ("orderId");


--
-- Name: SubOrder_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_paymentStatus_idx" ON public."SubOrder" USING btree ("paymentStatus");


--
-- Name: SubOrder_sellerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_sellerId_idx" ON public."SubOrder" USING btree ("sellerId");


--
-- Name: SubOrder_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_status_idx" ON public."SubOrder" USING btree (status);


--
-- Name: SupportChat_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_createdAt_idx" ON public."SupportChat" USING btree ("createdAt");


--
-- Name: SupportChat_operatorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_operatorId_idx" ON public."SupportChat" USING btree ("operatorId");


--
-- Name: SupportChat_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_status_idx" ON public."SupportChat" USING btree (status);


--
-- Name: SupportChat_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_userId_idx" ON public."SupportChat" USING btree ("userId");


--
-- Name: SupportMessage_chatId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportMessage_chatId_idx" ON public."SupportMessage" USING btree ("chatId");


--
-- Name: SupportMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportMessage_createdAt_idx" ON public."SupportMessage" USING btree ("createdAt");


--
-- Name: SupportOperator_isActive_isOnline_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportOperator_isActive_isOnline_idx" ON public."SupportOperator" USING btree ("isActive", "isOnline");


--
-- Name: SupportOperator_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SupportOperator_userId_key" ON public."SupportOperator" USING btree ("userId");


--
-- Name: UserActivityLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserActivityLog_action_idx" ON public."UserActivityLog" USING btree (action);


--
-- Name: UserActivityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserActivityLog_createdAt_idx" ON public."UserActivityLog" USING btree ("createdAt");


--
-- Name: UserActivityLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserActivityLog_entityType_entityId_idx" ON public."UserActivityLog" USING btree ("entityType", "entityId");


--
-- Name: UserActivityLog_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserActivityLog_userId_createdAt_idx" ON public."UserActivityLog" USING btree ("userId", "createdAt");


--
-- Name: UserRole_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserRole_userId_idx" ON public."UserRole" USING btree ("userId");


--
-- Name: UserRole_userId_role_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserRole_userId_role_key" ON public."UserRole" USING btree ("userId", role);


--
-- Name: UserSegment_isActive_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSegment_isActive_createdAt_idx" ON public."UserSegment" USING btree ("isActive", "createdAt");


--
-- Name: User_archivedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_archivedAt_idx" ON public."User" USING btree ("archivedAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_isSuspended_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_isSuspended_idx" ON public."User" USING btree ("isSuspended");


--
-- Name: User_referralCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_referralCode_key" ON public."User" USING btree ("referralCode");


--
-- Name: AdPlacement AdPlacement_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdPlacement"
    ADD CONSTRAINT "AdPlacement_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Address Address_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AdminNote AdminNote_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminNote"
    ADD CONSTRAINT "AdminNote_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AdminNote AdminNote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminNote"
    ADD CONSTRAINT "AdminNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: AssignmentLog AssignmentLog_subOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssignmentLog"
    ADD CONSTRAINT "AssignmentLog_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES public."SubOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bid Bid_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bid Bid_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BroadcastCampaign BroadcastCampaign_segmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BroadcastCampaign"
    ADD CONSTRAINT "BroadcastCampaign_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES public."UserSegment"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: ConsentLog ConsentLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConsentLog"
    ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CouponUsage CouponUsage_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public."Coupon"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CouponUsage CouponUsage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CouponUsage"
    ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryAttempt DeliveryAttempt_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryAttempt DeliveryAttempt_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryAttempt DeliveryAttempt_subOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES public."SubOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryRate DeliveryRate_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryRate"
    ADD CONSTRAINT "DeliveryRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."PackageCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverAvailabilitySubscription DriverAvailabilitySubscription_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverAvailabilitySubscription"
    ADD CONSTRAINT "DriverAvailabilitySubscription_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DriverAvailabilitySubscription DriverAvailabilitySubscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverAvailabilitySubscription"
    ADD CONSTRAINT "DriverAvailabilitySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverDocumentChangeRequest DriverDocumentChangeRequest_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverDocumentChangeRequest"
    ADD CONSTRAINT "DriverDocumentChangeRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverLocationHistory DriverLocationHistory_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverLocationHistory"
    ADD CONSTRAINT "DriverLocationHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DriverLocationHistory DriverLocationHistory_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverLocationHistory"
    ADD CONSTRAINT "DriverLocationHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: HomeCategorySlot HomeCategorySlot_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HomeCategorySlot"
    ADD CONSTRAINT "HomeCategorySlot_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: MerchantDocumentChangeRequest MerchantDocumentChangeRequest_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MerchantDocumentChangeRequest"
    ADD CONSTRAINT "MerchantDocumentChangeRequest_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Merchant Merchant_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderChatMessage OrderChatMessage_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChatMessage"
    ADD CONSTRAINT "OrderChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."OrderChat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderChatMessage OrderChatMessage_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChatMessage"
    ADD CONSTRAINT "OrderChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderChat OrderChat_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChat"
    ADD CONSTRAINT "OrderChat_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderChat OrderChat_participantAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChat"
    ADD CONSTRAINT "OrderChat_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderChat OrderChat_participantBId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderChat"
    ADD CONSTRAINT "OrderChat_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: PayoutItem PayoutItem_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutItem"
    ADD CONSTRAINT "PayoutItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."PayoutBatch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PendingAssignment PendingAssignment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PendingAssignment"
    ADD CONSTRAINT "PendingAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlaybookStep PlaybookStep_checklistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PlaybookStep"
    ADD CONSTRAINT "PlaybookStep_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES public."PlaybookChecklist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PointsTransaction PointsTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PointsTransaction"
    ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: RatingReport RatingReport_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RatingReport"
    ADD CONSTRAINT "RatingReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RatingReport RatingReport_reporterUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RatingReport"
    ADD CONSTRAINT "RatingReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: SupportChat SupportChat_operatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportChat"
    ADD CONSTRAINT "SupportChat_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES public."SupportOperator"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: SupportOperator SupportOperator_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportOperator"
    ADD CONSTRAINT "SupportOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserActivityLog UserActivityLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserActivityLog"
    ADD CONSTRAINT "UserActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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


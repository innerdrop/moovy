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
    "volumeMl" integer,
    barcode text,
    "basePrice" double precision,
    "markupPercent" double precision
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    origin text DEFAULT 'BUYER'::text NOT NULL
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
cmqz5vwwy00ggxhd88dx3zolb	cmqz5vwws00gbxhd8xdblt14z	Casa	Deloqui	500	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8035	-68.3012	t	2026-06-29 11:55:54.082	2026-06-29 11:55:54.082	\N
cmqz5vx5w00gmxhd8vmbf5m8b	cmqz5vx5l00ghxhd8xnar59ix	Casa	Yaganes	300	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8092	-68.307	t	2026-06-29 11:55:54.404	2026-06-29 11:55:54.404	\N
cmr40aqu3000cmh52en2nv1mx	cmqz5vwfh00fzxhd8bchmmyw5	Prueba Comprador	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-07-02 21:18:19.227	2026-07-02 21:30:39.295	2026-07-02 21:30:39.294
cmqz5vwfn00g4xhd871muduw0	cmqz5vwfh00fzxhd8bchmmyw5	Casa	Paseo de la Plaza	2065		\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-06-29 11:55:53.459	2026-07-02 21:30:54.653	\N
cmrgs2t200004e1n63bw9108t	cmqz5vwo300g5xhd8ok66ryk2	Depto	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-07-11 19:49:12.216	2026-07-11 19:49:32.205	2026-07-11 19:49:32.202
cmqz5vwoc00gaxhd8v0vglrcm	cmqz5vwo300g5xhd8ok66ryk2	Casa	Onas	250	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8078	-68.3098	f	2026-06-29 11:55:53.772	2026-07-11 19:50:39.375	\N
cmrgs3vqh0007e1n6qzp7fc06	cmqz5vwo300g5xhd8ok66ryk2	Mi Casa	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	t	2026-07-11 19:50:02.346	2026-07-11 19:50:39.381	\N
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
cmqz5vrwc0030xhd8eqeurj4k	El Falafel Ushuaia	el-falafel-ushuaia	Comida mediterránea en el fin del mundo. Falafel, hummus y sabores únicos.	https://picsum.photos/seed/moovy-logo-el-falafel-ushuaia/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio2@somosmoovy.com	+5492901555002	Gobernador Paz 789, Ushuaia	-54.8085	-68.312	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:47.577	2026-06-29 11:55:47.577	Restaurante	cmqz5vrw1002txhd87zyecnx4	2026-06-29 11:55:47.581	2026-06-29 11:55:47.581	4.9	\N	\N	\N	10	\N	0	\N	\N	t	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:47.577	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:47.581	\N
cmqz5vs7q004axhd8fyr7ixm3	La Estancia del Sur	la-estancia-del-sur	La mejor parrilla de Ushuaia. Carnes premium y cordero fueguino.	https://picsum.photos/seed/moovy-logo-la-estancia-del-sur/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio3@somosmoovy.com	+5492901555003	Maipú 1234, Ushuaia	-54.801	-68.2985	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:47.987	2026-06-29 11:55:47.987	Parrilla	cmqz5vs7g0043xhd8q2mrshtc	2026-06-29 11:55:47.99	2026-06-29 11:55:47.99	4.8	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:47.987	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:47.99	\N
cmqz5vsla005kxhd8ax92pmri	Pizzería Cerro Martial	pizzeria-cerro-martial	Pizza a la piedra con masa madre. La favorita del barrio.	https://picsum.photos/seed/moovy-logo-pizzeria-cerro-martial/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio4@somosmoovy.com	+5492901555004	Av. Leandro Alem 350, Ushuaia	-54.8033	-68.321	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:48.475	2026-06-29 11:55:48.475	Pizzería	cmqz5vsl0005dxhd8sst0a1h3	2026-06-29 11:55:48.478	2026-06-29 11:55:48.478	4.6	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:48.475	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:48.478	\N
cmqz5vt6v0084xhd80bepwszu	Café Beagle	cafe-beagle	Café de especialidad y pastelería artesanal frente al canal.	https://picsum.photos/seed/moovy-logo-cafe-beagle/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio6@somosmoovy.com	+5492901555006	San Martín 980, Ushuaia	-54.8075	-68.3001	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:49.252	2026-06-29 11:55:49.252	Cafetería	cmqz5vt6i007xxhd8hsy8f7ox	2026-06-29 11:55:49.255	2026-06-29 11:55:49.255	4.9	\N	\N	\N	10	\N	0	\N	\N	t	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:49.252	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:49.255	\N
cmqz5vtiv009exhd8vvyf8nns	Farmacia del Canal	farmacia-del-canal	Farmacia con delivery rápido. Medicamentos y cuidado personal.	https://picsum.photos/seed/moovy-logo-farmacia-del-canal/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio7@somosmoovy.com	+5492901555007	Av. San Martín 640, Ushuaia	-54.8061	-68.3055	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:49.684	2026-06-29 11:55:49.684	Farmacia	cmqz5vtik0097xhd8n00sds6h	2026-06-29 11:55:49.687	2026-06-29 11:55:49.687	4.4	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:49.684	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:49.687	\N
cmqz5vttb00aoxhd8gww43etq	Verdulería La Huerta Fueguina	verduleria-la-huerta	Frutas y verduras frescas, selección diaria.	https://picsum.photos/seed/moovy-logo-verduleria-la-huerta/600/600	\N	t	t	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio8@somosmoovy.com	+5492901555008	Karukinka 210, Ushuaia	-54.7995	-68.3155	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:50.06	2026-06-29 11:55:50.06	Verdulería	cmqz5vtsy00ahxhd807lierxs	2026-06-29 11:55:50.063	2026-06-29 11:55:50.063	4.6	\N	\N	\N	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:50.06	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:50.063	\N
cmqz5vrhh001qxhd80605qjj8	Patagonia Drinks	patagonia-drinks	Las mejores bebidas del fin del mundo. Cervezas, gaseosas y más.	https://picsum.photos/seed/moovy-logo-patagonia-drinks/600/600	\N	t	f	t	{"0":{"open":"10:00","close":"21:00"},"1":{"open":"09:00","close":"22:00"},"2":{"open":"09:00","close":"22:00"},"3":{"open":"09:00","close":"22:00"},"4":{"open":"09:00","close":"22:00"},"5":{"open":"09:00","close":"23:00"},"6":{"open":"10:00","close":"23:00"}}	f	comercio1@somosmoovy.com	+5492901555001	San Martín 456, Ushuaia	-54.8069	-68.3042	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:47.04	2026-06-29 11:55:47.04	Kiosco	cmqz5vrgz001jxhd84w7eneza	2026-06-29 11:55:47.045	2026-07-06 23:22:37.811	4.7	\N	\N	\N	10	\N	0	\N	\N	t	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:47.04	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:47.045	\N
cmqz5vswb006uxhd8c5bcq86n	Burger del Fin del Mundo	burger-fin-del-mundo	Hamburguesas smash con ingredientes locales.	https://picsum.photos/seed/moovy-logo-burger-fin-del-mundo/600/600	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1783738853368-logo.webp	t	t	t	{"1":[{"open":"09:00","close":"22:00"}],"2":[{"open":"09:00","close":"22:00"}],"3":[{"open":"09:00","close":"22:00"}],"4":[{"open":"09:00","close":"22:00"}],"5":[{"open":"09:00","close":"23:00"}],"6":[{"open":"00:00","close":"23:59"}],"7":null}	f	comercio5@somosmoovy.com	+5492901555005	9 de Julio 120, Ushuaia	-54.8058	-68.3075	5	30	45	0	0	f	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	PENDING	\N	\N	\N	\N	2026-06-29 11:55:48.872	2026-06-29 11:55:48.872	Hamburguesería	cmqz5vsvy006nxhd8cea1yx8k	2026-06-29 11:55:48.876	2026-07-11 03:22:40.756	4.5	\N	\N	Burger del Fin del Mundo	10	\N	0	\N	\N	f	\N	\N	basic	\N	\N	+5492901222222	\N	\N	\N	\N	\N	APPROVED	2026-06-29 11:55:48.872	\N	DRAFT	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	BRONCE	f	0	2026-06-29 11:55:48.876	\N
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
points_config	1	0	0.01	100	50	100	200	10	\N	100	5000	8000	90	\N	2026-07-06 23:15:15.786	1	\N
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

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "deletedAt", "deletedBy", "deletedReason", "createdAt", "updatedAt", "packageCategoryId", "weightGrams", "volumeMl", barcode, "basePrice", "markupPercent") FROM stdin;
cmqz5vric001uxhd8dq3pebwc	Heineken Lata 1L	heineken-1l	Cerveza Heineken lata 1 litro.	cmqz5vrhh001qxhd80605qjj8	3500	2800	50	5	t	t	\N	\N	\N	2026-06-29 11:55:47.075	2026-06-29 11:55:47.075	\N	\N	\N	\N	\N	\N
cmqz5vriy0020xhd87abgsp11	Patagonia 24.7 IPA	patagonia-247	Session IPA suave y refrescante.	cmqz5vrhh001qxhd80605qjj8	4200	3400	30	5	t	t	\N	\N	\N	2026-06-29 11:55:47.098	2026-06-29 11:55:47.098	\N	\N	\N	\N	\N	\N
cmqz5vrja0026xhd8qe6xdjlj	Schneider 710ml	schneider-710	Cerveza rubia clásica.	cmqz5vrhh001qxhd80605qjj8	2800	2100	40	5	t	f	\N	\N	\N	2026-06-29 11:55:47.11	2026-06-29 11:55:47.11	\N	\N	\N	\N	\N	\N
cmqz5vrjl002cxhd833p7o57x	Coca-Cola 2.25L	coca-225	Gaseosa Coca-Cola 2.25 litros.	cmqz5vrhh001qxhd80605qjj8	2900	2000	60	5	t	f	\N	\N	\N	2026-06-29 11:55:47.122	2026-06-29 11:55:47.122	\N	\N	\N	\N	\N	\N
cmqz5vrjx002ixhd8nhkuh93p	Agua Mineral Eco 2L	agua-eco-2l	Agua mineral sin gas.	cmqz5vrhh001qxhd80605qjj8	1200	700	0	5	t	f	\N	\N	\N	2026-06-29 11:55:47.133	2026-06-29 11:55:47.133	\N	\N	\N	\N	\N	\N
cmqz5vrk8002oxhd8yvzwazhc	Papas Lays Clásicas	lays-clasicas	Papas fritas 150g.	cmqz5vrhh001qxhd80605qjj8	2500	1600	3	5	t	f	\N	\N	\N	2026-06-29 11:55:47.144	2026-06-29 11:55:47.144	\N	\N	\N	\N	\N	\N
cmqz5vrwm0034xhd8d4r9d6to	Falafel Clásico (6u)	falafel-clasico	6 falafel caseros con tahini.	cmqz5vrwc0030xhd8eqeurj4k	5500	3200	25	5	t	t	\N	\N	\N	2026-06-29 11:55:47.59	2026-06-29 11:55:47.59	\N	\N	\N	\N	\N	\N
cmqz5vrwu003axhd81da2tlo4	Hummus con Pan Pita	hummus-pita	Hummus casero con pan pita tibio.	cmqz5vrwc0030xhd8eqeurj4k	4200	2400	20	5	t	t	\N	\N	\N	2026-06-29 11:55:47.599	2026-06-29 11:55:47.599	\N	\N	\N	\N	\N	\N
cmqz5vrx3003gxhd8ub7noyt3	Shawarma de Pollo	shawarma-pollo	Shawarma de pollo con vegetales y salsa.	cmqz5vrwc0030xhd8eqeurj4k	6800	4000	15	5	t	f	\N	\N	\N	2026-06-29 11:55:47.607	2026-06-29 11:55:47.607	\N	\N	\N	\N	\N	\N
cmqz5vrxc003mxhd83jyk6h5w	Ensalada Tabbouleh	tabbouleh	Ensalada fresca de perejil, trigo y limón.	cmqz5vrwc0030xhd8eqeurj4k	3900	2100	12	5	t	f	\N	\N	\N	2026-06-29 11:55:47.617	2026-06-29 11:55:47.617	\N	\N	\N	\N	\N	\N
cmqz5vrxo003sxhd871zld6hg	Baklava (2u)	baklava	Postre de masa filo, nueces y miel.	cmqz5vrwc0030xhd8eqeurj4k	3200	1800	2	5	t	f	\N	\N	\N	2026-06-29 11:55:47.628	2026-06-29 11:55:47.628	\N	\N	\N	\N	\N	\N
cmqz5vrxy003yxhd877e5bc3x	Limonada de Menta	limonada-menta	Limonada casera con menta.	cmqz5vrwc0030xhd8eqeurj4k	2400	1200	30	5	t	f	\N	\N	\N	2026-06-29 11:55:47.638	2026-06-29 11:55:47.638	\N	\N	\N	\N	\N	\N
cmqz5vs80004exhd844e7zog3	Cordero Fueguino (1/2)	cordero-fueguino	Medio cordero al asador.	cmqz5vs7q004axhd8fyr7ixm3	28000	19000	8	5	t	t	\N	\N	\N	2026-06-29 11:55:48	2026-06-29 11:55:48	\N	\N	\N	\N	\N	\N
cmqz5vs8b004kxhd8bi21pzoz	Tabla La Estancia (2p)	tabla-estancia	Fiambres y quesos patagónicos.	cmqz5vs7q004axhd8fyr7ixm3	12500	8000	10	5	t	t	\N	\N	\N	2026-06-29 11:55:48.011	2026-06-29 11:55:48.011	\N	\N	\N	\N	\N	\N
cmqz5vs8k004qxhd8eap2pdy6	Bife de Chorizo 400g	bife-chorizo	Bife de chorizo a la parrilla.	cmqz5vs7q004axhd8fyr7ixm3	11000	7500	14	5	t	f	\N	\N	\N	2026-06-29 11:55:48.021	2026-06-29 11:55:48.021	\N	\N	\N	\N	\N	\N
cmqz5vs8v004wxhd89uzvo3ri	Provoleta	provoleta	Provoleta a la parrilla con orégano.	cmqz5vs7q004axhd8fyr7ixm3	5500	3200	18	5	t	f	\N	\N	\N	2026-06-29 11:55:48.032	2026-06-29 11:55:48.032	\N	\N	\N	\N	\N	\N
cmqz5vs950052xhd8bzz3hc88	Beagle Red Ale	beagle-red-ale	Cerveza artesanal de Ushuaia.	cmqz5vs7q004axhd8fyr7ixm3	4500	3200	0	5	t	f	\N	\N	\N	2026-06-29 11:55:48.041	2026-06-29 11:55:48.041	\N	\N	\N	\N	\N	\N
cmqz5vs9k0058xhd8go65yynp	Flan Casero	flan-casero	Flan con dulce de leche y crema.	cmqz5vs7q004axhd8fyr7ixm3	3500	1900	16	5	t	f	\N	\N	\N	2026-06-29 11:55:48.057	2026-06-29 11:55:48.057	\N	\N	\N	\N	\N	\N
cmqz5vslj005oxhd8tkfo0b25	Muzzarella Grande	muzza-grande	Pizza de muzzarella a la piedra.	cmqz5vsla005kxhd8ax92pmri	7800	4200	30	5	t	t	\N	\N	\N	2026-06-29 11:55:48.488	2026-06-29 11:55:48.488	\N	\N	\N	\N	\N	\N
cmqz5vsls005uxhd8m8x7l5jp	Napolitana	napolitana	Muzza, tomate, ajo y albahaca.	cmqz5vsla005kxhd8ax92pmri	8900	4800	25	5	t	t	\N	\N	\N	2026-06-29 11:55:48.496	2026-06-29 11:55:48.496	\N	\N	\N	\N	\N	\N
cmqz5vsm10060xhd8o0zr7ojg	Fugazzeta Rellena	fugazzeta	Doble muzza y cebolla.	cmqz5vsla005kxhd8ax92pmri	9800	5400	20	5	t	f	\N	\N	\N	2026-06-29 11:55:48.506	2026-06-29 11:55:48.506	\N	\N	\N	\N	\N	\N
cmqz5vsm90066xhd8lcqqk1xb	Calabresa	calabresa	Muzza con longaniza calabresa.	cmqz5vsla005kxhd8ax92pmri	9200	5100	4	5	t	f	\N	\N	\N	2026-06-29 11:55:48.514	2026-06-29 11:55:48.514	\N	\N	\N	\N	\N	\N
cmqz5vsmh006cxhd8mnj4fj2f	Empanada (docena)	empanadas-docena	Docena de empanadas surtidas.	cmqz5vsla005kxhd8ax92pmri	9600	5200	22	5	t	f	\N	\N	\N	2026-06-29 11:55:48.522	2026-06-29 11:55:48.522	\N	\N	\N	\N	\N	\N
cmqz5vsmp006ixhd8s1clp988	Faina	faina	Faina de garbanzos recién horneada.	cmqz5vsla005kxhd8ax92pmri	1800	900	0	5	t	f	\N	\N	\N	2026-06-29 11:55:48.53	2026-06-29 11:55:48.53	\N	\N	\N	\N	\N	\N
cmqz5vswk006yxhd85fzl6bjp	Smash Doble	smash-doble	Doble medallón smash, cheddar y salsa.	cmqz5vswb006uxhd8c5bcq86n	8500	4600	40	5	t	t	\N	\N	\N	2026-06-29 11:55:48.885	2026-06-29 11:55:48.885	\N	\N	\N	\N	\N	\N
cmqz5vsws0074xhd8fu7xje1i	Cheeseburger Clásica	cheeseburger	Medallón, cheddar, pickles.	cmqz5vswb006uxhd8c5bcq86n	6900	3800	35	5	t	t	\N	\N	\N	2026-06-29 11:55:48.892	2026-06-29 11:55:48.892	\N	\N	\N	\N	\N	\N
cmqz5vsx0007axhd81gi0m5ww	Veggie Burger	veggie-burger	Medallón de garbanzo y remolacha.	cmqz5vswb006uxhd8c5bcq86n	7200	4000	12	5	t	f	\N	\N	\N	2026-06-29 11:55:48.9	2026-06-29 11:55:48.9	\N	\N	\N	\N	\N	\N
cmqz5vsx8007gxhd8gq8utpws	Papas Cheddar y Bacon	papas-cheddar-bacon	Papas con cheddar y panceta.	cmqz5vswb006uxhd8c5bcq86n	5400	2800	28	5	t	f	\N	\N	\N	2026-06-29 11:55:48.908	2026-06-29 11:55:48.908	\N	\N	\N	\N	\N	\N
cmqz5vsxg007mxhd8xms5cyyk	Nuggets x10	nuggets-10	10 nuggets crocantes con salsa.	cmqz5vswb006uxhd8c5bcq86n	5800	3100	2	5	t	f	\N	\N	\N	2026-06-29 11:55:48.917	2026-06-29 11:55:48.917	\N	\N	\N	\N	\N	\N
cmqz5vt740088xhd8njzv9jaq	Flat White	flat-white	Espresso doble con leche texturada.	cmqz5vt6v0084xhd80bepwszu	2900	1300	100	5	t	t	\N	\N	\N	2026-06-29 11:55:49.265	2026-06-29 11:55:49.265	\N	\N	\N	\N	\N	\N
cmqz5vt7d008exhd8e225dbgn	Medialunas (3u)	medialunas-3	Tres medialunas de manteca.	cmqz5vt6v0084xhd80bepwszu	2400	1100	50	5	t	t	\N	\N	\N	2026-06-29 11:55:49.273	2026-06-29 11:55:49.273	\N	\N	\N	\N	\N	\N
cmqz5vt7l008kxhd85l4k8cie	Cheesecake de Frutos Rojos	cheesecake	Porción de cheesecake casero.	cmqz5vt6v0084xhd80bepwszu	4200	2200	14	5	t	f	\N	\N	\N	2026-06-29 11:55:49.281	2026-06-29 11:55:49.281	\N	\N	\N	\N	\N	\N
cmqz5vt7v008qxhd8wep5yjsd	Tostado Jamón y Queso	tostado-jyq	Tostado en pan de masa madre.	cmqz5vt6v0084xhd80bepwszu	3800	1900	20	5	t	f	\N	\N	\N	2026-06-29 11:55:49.291	2026-06-29 11:55:49.291	\N	\N	\N	\N	\N	\N
cmqz5vt87008wxhd8i4ruq4dp	Café Filtrado V60	v60	Método filtrado, granos de especialidad.	cmqz5vt6v0084xhd80bepwszu	3200	1400	0	5	t	f	\N	\N	\N	2026-06-29 11:55:49.304	2026-06-29 11:55:49.304	\N	\N	\N	\N	\N	\N
cmqz5vt8l0092xhd8javeo8kq	Submarino	submarino	Leche caliente con barra de chocolate.	cmqz5vt6v0084xhd80bepwszu	3000	1500	30	5	t	f	\N	\N	\N	2026-06-29 11:55:49.317	2026-06-29 11:55:49.317	\N	\N	\N	\N	\N	\N
cmqz5vtj5009ixhd8t46zn9wf	Ibuprofeno 400mg x10	ibuprofeno-400	Analgésico y antiinflamatorio.	cmqz5vtiv009exhd8vvyf8nns	2800	1700	80	5	t	t	\N	\N	\N	2026-06-29 11:55:49.698	2026-06-29 11:55:49.698	\N	\N	\N	\N	\N	\N
cmqz5vtjf009oxhd8c9i4wrzy	Alcohol en Gel 250ml	alcohol-gel	Alcohol en gel sanitizante.	cmqz5vtiv009exhd8vvyf8nns	1900	1000	60	5	t	f	\N	\N	\N	2026-06-29 11:55:49.707	2026-06-29 11:55:49.707	\N	\N	\N	\N	\N	\N
cmqz5vtjo009uxhd8xkhsizbc	Protector Solar FPS50	protector-fps50	Protección alta para el sur.	cmqz5vtiv009exhd8vvyf8nns	8900	5500	18	5	t	t	\N	\N	\N	2026-06-29 11:55:49.717	2026-06-29 11:55:49.717	\N	\N	\N	\N	\N	\N
cmqz5vtjy00a0xhd80d91kijs	Termómetro Digital	termometro	Termómetro digital de punta flexible.	cmqz5vtiv009exhd8vvyf8nns	6500	4000	5	5	t	f	\N	\N	\N	2026-06-29 11:55:49.726	2026-06-29 11:55:49.726	\N	\N	\N	\N	\N	\N
cmqz5vtk800a6xhd80xq981ri	Barbijo x10	barbijo-10	Pack de 10 barbijos tricapa.	cmqz5vtiv009exhd8vvyf8nns	2200	1200	0	5	t	f	\N	\N	\N	2026-06-29 11:55:49.736	2026-06-29 11:55:49.736	\N	\N	\N	\N	\N	\N
cmqz5vtkk00acxhd86vi289ms	Vitamina C x60	vitamina-c	Suplemento de vitamina C.	cmqz5vtiv009exhd8vvyf8nns	5400	3200	26	5	t	f	\N	\N	\N	2026-06-29 11:55:49.749	2026-06-29 11:55:49.749	\N	\N	\N	\N	\N	\N
cmqz5vttk00asxhd88mkfnrrz	Banana (kg)	banana-kg	Banana ecuatoriana por kilo.	cmqz5vttb00aoxhd8gww43etq	2200	1300	40	5	t	t	\N	\N	\N	2026-06-29 11:55:50.072	2026-06-29 11:55:50.072	\N	\N	\N	\N	\N	\N
cmqz5vttr00ayxhd8nnpj4071	Tomate Perita (kg)	tomate-kg	Tomate perita fresco por kilo.	cmqz5vttb00aoxhd8gww43etq	2600	1500	35	5	t	f	\N	\N	\N	2026-06-29 11:55:50.08	2026-06-29 11:55:50.08	\N	\N	\N	\N	\N	\N
cmqz5vttz00b4xhd8p5x14oeu	Papa Negra (kg)	papa-kg	Papa negra por kilo.	cmqz5vttb00aoxhd8gww43etq	1500	800	80	5	t	t	\N	\N	\N	2026-06-29 11:55:50.087	2026-06-29 11:55:50.087	\N	\N	\N	\N	\N	\N
cmqz5vtu700baxhd85r80nq4c	Palta Hass (u)	palta	Palta Hass madura, unidad.	cmqz5vttb00aoxhd8gww43etq	1800	1100	3	5	t	f	\N	\N	\N	2026-06-29 11:55:50.095	2026-06-29 11:55:50.095	\N	\N	\N	\N	\N	\N
cmqz5vtuf00bgxhd8gls84ah6	Lechuga Mantecosa	lechuga	Lechuga mantecosa fresca.	cmqz5vttb00aoxhd8gww43etq	1400	700	22	5	t	f	\N	\N	\N	2026-06-29 11:55:50.103	2026-06-29 11:55:50.103	\N	\N	\N	\N	\N	\N
cmqz5vtun00bmxhd8ij93bqj4	Frutillas (250g)	frutillas	Caja de frutillas seleccionadas.	cmqz5vttb00aoxhd8gww43etq	3900	2400	0	5	t	f	\N	\N	\N	2026-06-29 11:55:50.111	2026-06-29 11:55:50.111	\N	\N	\N	\N	\N	\N
cmrc815lj000075y65cfjox3t	COCA COLA 2.5L	coca-cola-2-5l-5wfn3i	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895005794	\N	\N
cmrc815lk000175y6koibmk83	COCA COLA DE VIDRIO	coca-cola-de-vidrio-pof8d6	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895006753	\N	\N
cmrc815lk000275y6wksmw3pn	COCA COLA 1L	coca-cola-1l-p5xv9w	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895001413	\N	\N
cmrc815lk000375y69cbketvi	COCA COLA 2.25 ZERO	coca-cola-2-25-zero-cfaevy	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895067570	\N	\N
cmrc815lk000475y6e9kcfzoe	SPRITE LATA	sprite-lata-uzjso9	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000270	\N	\N
cmrc815lk000575y6nhdt1xjw	COCA LATA	coca-lata-w6mh9p	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000232	\N	\N
cmrc815lk000675y6hshvqk5h	AQUARIUS 500ML (LIMONADA)	aquarius-500ml-limonada-5letu0	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895008481	\N	\N
cmrc815lk000775y6vterm8fb	AQUARIUS 500ML (POMELO)	aquarius-500ml-pomelo-8cb9ki	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895640469	\N	\N
cmrc815lk000875y6beul9wcv	AQUARIUS 500ML (MANZANA)	aquarius-500ml-manzana-9jv1wp	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895640452	\N	\N
cmrc815lk000975y67ksaj07r	AQUARIUS 500ML (NARANJA)	aquarius-500ml-naranja-lj2hbe	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641213	\N	\N
cmrc815lk000a75y6hlbag28b	POWERADE 500ML (MANZANA)	powerade-500ml-manzana-o6lmvc	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895640018	\N	\N
cmrc815lk000b75y6e55n43zg	POWERADE 500ML (NARANJA)	powerade-500ml-naranja-1maonp	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895640032	\N	\N
cmrc815lk000c75y6c5uz5kg1	SPRITE 2.25L	sprite-2-25l-b58ow5	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895001000	\N	\N
cmrc815lk000d75y6rgjrahhi	LATA FANTA 220ML	lata-fanta-220ml-5cbx7m	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895642432	\N	\N
cmrc815lk000e75y65q0k8owa	LATA COCA 220ML ZERO	lata-coca-220ml-zero-lp4xlj	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	19	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895642104	\N	\N
cmrc815lk000f75y6picrdn57	LATA COCA 220ML	lata-coca-220ml-f59zta	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895642081	\N	\N
cmrc815lk000g75y6k5gn35uu	LATA SPRITE 220ML	lata-sprite-220ml-joca3i	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895642456	\N	\N
cmrc815lk000h75y6i4nmerat	SPRITE VIDRIO	sprite-vidrio-r3m1i7	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895650598	\N	\N
cmrc815lk000i75y6punn6ila	FANTA VIDRIO	fanta-vidrio-q4pmus	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895651267	\N	\N
cmrc815lk000j75y6ou2etfui	COCA VIDRIO ZERO	coca-vidrio-zero-grkhv5	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895067594	\N	\N
cmrc815lk000k75y6heopp5kx	POWERADE 500ML (UVA)	powerade-500ml-uva-ps0bzq	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895648687	\N	\N
cmrc815lk000l75y6dh04olcj	GATORADE (UVA) 500ML	gatorade-uva-500ml-l7ewdd	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792170042241	\N	\N
cmrc815lk000m75y61klgpywu	POWERADE 500ML (FRUTAS TROPICALES)	powerade-500ml-frutas-tropicales-wuv0dm	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641183	\N	\N
cmrc815lk000n75y6v7o9s5dg	POWERADE 500ML (MOUNTAIN BLAST)	powerade-500ml-mountain-blast-s2ji2y	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895640025	\N	\N
cmrc815lk000o75y67zn50c1p	POWERADE 995ML (FRUTAS TROPICALES)	powerade-995ml-frutas-tropicales-xnzsfr	\N	cmqz5vswb006uxhd8c5bcq86n	5824	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895006104	\N	\N
cmrc815lk000p75y668zpajvb	POWERADE (MANZANA) 995ML	powerade-manzana-995ml-y4ts5c	\N	cmqz5vswb006uxhd8c5bcq86n	5824	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895006036	\N	\N
cmrc815lk000q75y66voz374i	SPRITE 1L	sprite-1l-m3ro3j	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895005015	\N	\N
cmrc815lk000r75y6vyj145w6	AGUA DEL FARO 1.5L	agua-del-faro-1-5l-jcle0e	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	13	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798310990038	\N	\N
cmrc815lk000s75y6m4m2hpp8	AGUA BONAQUA CON GAS 1.5L	agua-bonaqua-con-gas-1-5l-mnndll	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895003950	\N	\N
cmrc815lk000t75y62sl7na7r	AGUA DEL FARO 500ML	agua-del-faro-500ml-wm0318	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	14	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798310990045	\N	\N
cmrc815ll000u75y62hpe6mlo	MONSTER VARIADO 473ML	monster-variado-473ml-q1e5ew	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620120	\N	\N
cmrc815ll000v75y6416qxu0b	MONSTER SUNRISE 473ML	monster-sunrise-473ml-ok8bhr	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620052	\N	\N
cmrc815ll000w75y6ol7qs3vh	MONSTER THE DOCTOR 473ML	monster-the-doctor-473ml-factyu	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620083	\N	\N
cmrc815ll000x75y6s49dp24g	MONSTER WATERMELON 473ML	monster-watermelon-473ml-i0cl5u	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620069	\N	\N
cmrc815ll000y75y64zkup0ng	MONSTER PIÑA 473ML	monster-pina-473ml-xujzm9	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620076	\N	\N
cmrc815ll000z75y6qwpmciux	MONSTER 473ML	monster-473ml-vvramh	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620014	\N	\N
cmrc815ll001075y69wqyi8dm	MONSTER VARIADO 473ML	monster-variado-473ml-nhzmy5	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798422620298	\N	\N
cmrc815ll001175y6ka2u4z5r	CEPITA 200ML NARANJA	cepita-200ml-naranja-jfhcm4	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641596	\N	\N
cmrc815ll001275y63ezha4gu	CEPITA 200ML MULTIFRUTA	cepita-200ml-multifruta-mg43zd	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000737	\N	\N
cmrc815ll001375y6iuw0l220	SPEED LATA 250ML	speed-lata-250ml-6119an	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798119220015	\N	\N
cmrc815ll001475y6yjiar8k5	CEPITA 200ML NARANJA TENTACION	cepita-200ml-naranja-tentacion-3vaq5h	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641794	\N	\N
cmrc815ll001575y6v9c2sq6t	CEPITA 200ML ANANA	cepita-200ml-anana-o7tsp4	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641732	\N	\N
cmrc815ll001675y6lb6yj7iq	CEPITA 200ML DURAZNO	cepita-200ml-durazno-158qu2	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641541	\N	\N
cmrc815ll001775y685k105e0	CEPITA 1L MANZANA ROJA	cepita-1l-manzana-roja-hjzxdm	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895009853	\N	\N
cmrc815ll001875y6m029aylk	SECCO 500ML COLA	secco-500ml-cola-c0h2l3	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792758001042	\N	\N
cmrc815ll001975y6bt1iipni	PRITTY 500ML	pritty-500ml-hz1l2i	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791913000623	\N	\N
cmrc815ll001a75y6bu9866o1	SECCO COLA 2.25L	secco-cola-2-25l-w2fp17	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792758001066	\N	\N
cmrc815ll001b75y6a3tgfrcb	H2OH 1.5L NARANJA SIN GAS	h2oh-1-5l-naranja-sin-gas-8ku4rk	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813000723	\N	\N
cmrc815ll001c75y6q8lovtj5	SECCO NARANJA 2.25L	secco-naranja-2-25l-m4alti	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792758012239	\N	\N
cmrc815ll001d75y6iq6n8ar6	CEPITA 1.5L NARANJA TENTACION	cepita-1-5l-naranja-tentacion-4yluz7	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895641800	\N	\N
cmrc815ll001e75y62xyom5fo	SODA SALDAN 2L	soda-saldan-2l-cgryda	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791913000753	\N	\N
cmrc815ll001f75y6ux64gjsf	PRITTY 1.5L	pritty-1-5l-dawrgr	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791913000265	\N	\N
cmrc815ll001g75y60mta3d9w	PRITTY 2.25L	pritty-2-25l-8n4ofm	\N	cmqz5vswb006uxhd8c5bcq86n	5376	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791913000746	\N	\N
cmrc815ll001h75y6vadu0kf6	PATAGONIA CERVEZA BOTELLA 730ML IPA	patagonia-cerveza-botella-730ml-ipa-wu59on	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798010882	\N	\N
cmrc815ll001i75y65ie1valm	PATAGONIA CERVEZA BOTELLA 730ML AMBER LAGER	patagonia-cerveza-botella-730ml-amber-lager-q6h6qd	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798002351	\N	\N
cmrc815ll001j75y6ftw49lmh	BEAGLE BOTELLA 1L GLACIER LAGER	beagle-botella-1l-glacier-lager-2use3s	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798137955944	\N	\N
cmrc815ll001k75y6ap61sq86	BEAGLE BOTELLA 1L CREAM STOUT	beagle-botella-1l-cream-stout-thts03	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798137950079	\N	\N
cmrc815lm001l75y6cvi9zbey	BEAGLE BOTELLA 1L RED ALE	beagle-botella-1l-red-ale-cra42g	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798137950062	\N	\N
cmrc815lm001m75y6fxc0w6gw	BEAGLE BOTELLA 1L VARIADA	beagle-botella-1l-variada-ri1ffb	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798137955920	\N	\N
cmrc815lm001n75y6b6qp5hz8	ROCKLETS	rocklets-gt2yup	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580421076	\N	\N
cmrc815lm001o75y689mjr26d	MOGUL EXTREME 35G	mogul-extreme-35g-id2my9	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580116965	\N	\N
cmrc815lm001p75y6sfa3tp3m	LENGUETAZO	lenguetazo-zn1zhg	\N	cmqz5vswb006uxhd8c5bcq86n	560	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77994943	\N	\N
cmrc815lm001q75y635p0f3nq	MOGUL OSITOS 30G	mogul-ositos-30g-6j1rub	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	485	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580199913	\N	\N
cmrc815lm001r75y66i4ptg0i	MOGUL MORAS 80G	mogul-moras-80g-nujlgc	\N	cmqz5vswb006uxhd8c5bcq86n	2184	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580118617	\N	\N
cmrc815lm001s75y6dfzxo57u	LA YAPA	la-yapa-lwqcxm	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77904744	\N	\N
cmrc815lm001t75y6ol0p4rv0	CHOCOLATE BLOCK 110	chocolate-block-110-qc9hlz	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77922120	\N	\N
cmrc815lm001u75y66yvxxhnc	OCB	ocb-nc2j24	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	30052765	\N	\N
cmrc815lm001v75y6h74ycy4t	ALFAJOR MILKA MOUSSE TRIPLE 55GR.	alfajor-milka-mousse-triple-55gr-b9cfd6	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77903785	\N	\N
cmrc815lm001w75y6gtr24d9f	ALFAJOR TERRABUSI CLASICO 70GR.	alfajor-terrabusi-clasico-70gr-pjmp3l	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77903860	\N	\N
cmrc815lm001x75y6a8ou1oqx	ALFAJOR TITA	alfajor-tita-e105om	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77908308	\N	\N
cmrc815lm001y75y66matvdpe	ALFAJOR PEPITOS TRIPLE	alfajor-pepitos-triple-a0xtpi	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77915481	\N	\N
cmrc815lm001z75y6fkj2xgip	CHICLE TOP LINE	chicle-top-line-7x2uqb	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77916426	\N	\N
cmrc815lm002075y6v7e1e607	ALFAJOR TERRABUSI SIMPLE 50G.	alfajor-terrabusi-simple-50g-xe68yr	\N	cmqz5vswb006uxhd8c5bcq86n	1512	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77939234	\N	\N
cmrc815lm002175y6ksld9pdx	BON O BON	bon-o-bon-wrvppn	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77958921	\N	\N
cmrc815lm002275y6ziogn9q8	CHICLE BELDENT - X7	chicle-beldent-x7-lfn41w	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	19	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77969071	\N	\N
cmrc815lm002375y6g09lfjnb	ALFAJOR OREO TRIPLE	alfajor-oreo-triple-c24esq	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77976307	\N	\N
cmrc815lm002475y6wvjf2rsr	ALFAJOR GUAYMALLEN TRIPLE	alfajor-guaymallen-triple-0kmkpi	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77980267	\N	\N
cmrc815lm002575y664hx44hd	ALFAJOR FANTOCHE TRIPLE - BLANCO	alfajor-fantoche-triple-blanco-bdjunj	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77991584	\N	\N
cmrc815lm002675y6bc7zf9qy	CHUPETIN PICO DULCE	chupetin-pico-dulce-c9tb7q	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77991959	\N	\N
cmrc815lm002775y65lqxkqij	KINDER HUEVO SORPRESA CELESTE	kinder-huevo-sorpresa-celeste-9gzcvk	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	40084107	\N	\N
cmrc815lm002875y6v63tjg0n	KINDER BARRITA	kinder-barrita-6yv7j1	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	80050315	\N	\N
cmrc815lm002975y60fxytm9c	CHICLE BELDENT INFINIT	chicle-beldent-infinit-se0n24	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201448325	\N	\N
cmrc815lm002a75y6884oknwh	CHOCOLATE MILKA 45GR PAUSE OREO	chocolate-milka-45gr-pause-oreo-zvqbys	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201492465	\N	\N
cmrc815ln002b75y6p61re6w1	GALLETITAS SURTIDAS TERRABUSI	galletitas-surtidas-terrabusi-s053f1	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201503987	\N	\N
cmrc815ln002c75y69ffba85u	GALLETITAS OREO RELLENAS	galletitas-oreo-rellenas-3njbhw	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201735296	\N	\N
cmrc815ln002d75y63rsl66pf	CADBURY INTENSE 162G	cadbury-intense-162g-cyp5hl	\N	cmqz5vswb006uxhd8c5bcq86n	15680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201800505	\N	\N
cmrc815ln002e75y6ajvgjroa	CADBURY ALMENDRAS 82G	cadbury-almendras-82g-a0bdop	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201807405	\N	\N
cmrc815ln002f75y6fb99brvo	CADBURY 25GR	cadbury-25gr-j8rmcp	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201818609	\N	\N
cmrc815ln002g75y6scindxf2	CADBURY TRES SUEÑOS 82G	cadbury-tres-suenos-82g-oyqz7l	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201818739	\N	\N
cmrc815ln002h75y627cb6g2z	GALLETITAS MILKSHAKE OREO X11	galletitas-milkshake-oreo-x11-bzx8pv	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202049057	\N	\N
cmrc815ln002i75y6h5w9ctg6	SHOT 170G	shot-170g-r1li5v	\N	cmqz5vswb006uxhd8c5bcq86n	10752	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622300424084	\N	\N
cmrc815ln002j75y6wt606pb7	ALFAJOR MILKA MOUSSE TRIPLE BLANCO 55GR.	alfajor-milka-mousse-triple-blanco-55gr-naazt9	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622300457303	\N	\N
cmrc815ln002k75y6bpvtrrem	GALLETITAS LINCOLN COC	galletitas-lincoln-coc-zojg61	\N	cmqz5vswb006uxhd8c5bcq86n	2587.2	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622300742713	\N	\N
cmrc815ln002l75y6t3klr673	ALFAJOR MILKA OREO	alfajor-milka-oreo-wnhe6a	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622300835620	\N	\N
cmrc815ln002m75y62c3izize	GALLETITAS COFLER BLOCK	galletitas-cofler-block-ctr20l	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040127944	\N	\N
cmrc815ln002n75y63oky240o	GALLETITAS SURTIDAS DIVERSION	galletitas-surtidas-diversion-a5krkj	\N	cmqz5vswb006uxhd8c5bcq86n	3528	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143364	\N	\N
cmrc815ln002o75y6jpftettt	GALLETITAS COFLER RELLENAS	galletitas-cofler-rellenas-me5zpe	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143807	\N	\N
cmrc815ln002p75y6bzp2oqd6	ALFAJOR CHOCOTORTA TRIPLE	alfajor-chocotorta-triple-nczol7	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040150072	\N	\N
cmrc815ln002q75y6s6qd3rbc	ALFAJOR BON O BON SIMPLE	alfajor-bon-o-bon-simple-cp64c3	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040613706	\N	\N
cmrc815ln002r75y6f2kcotx7	LUCCHETTI DEALITOS	lucchetti-dealitos-p8md0o	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070318398	\N	\N
cmrc815ln002s75y6bcckwplv	MATARAZZO TIRABUZON	matarazzo-tirabuzon-se8n9h	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070336293	\N	\N
cmrc815ln002t75y6069nq62h	YERBA CHAMIGO	yerba-chamigo-thrvyk	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070509123	\N	\N
cmrc815ln002u75y6g5inhx0j	VINO TINTO ALARIS	vino-tinto-alaris-rq9bk1	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790240017045	\N	\N
cmrc815ln002v75y68t9gd5ma	VINO ALMA MORA	vino-alma-mora-8xlv4w	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790240042108	\N	\N
cmrc815ln002w75y6nvnx189f	VINO FINCA LAS MORAS	vino-finca-las-moras-bg2m9t	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790240128598	\N	\N
cmrc815ln002x75y61w2r7lbn	TEQUILA CONQUISTADOR DE MEXICO	tequila-conquistador-de-mexico-6b35lb	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790260012396	\N	\N
cmrc815ln002y75y6p51aldp5	VINO BLANCO DILEMA	vino-blanco-dilema-095020	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790314005145	\N	\N
cmrc815lo002z75y67h0syeyc	VINO TORO CAJA	vino-toro-caja-8id51a	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790314063824	\N	\N
cmrc815lo003075y65d5k4cml	VINO TORO 1L BOTELLA	vino-toro-1l-botella-fl4bgx	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790314079849	\N	\N
cmrc815lo003175y6es33wqun	YERBA TARAGUI	yerba-taragui-v0vtw5	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790387013627	\N	\N
cmrc815lo003275y62zywyvw3	VINO TRUMPETER MALBEC	vino-trumpeter-malbec-6ytqqq	\N	cmqz5vswb006uxhd8c5bcq86n	13440	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790577002165	\N	\N
cmrc815lo003375y6c73qkcit	CHOCOLATE COFLER AIR 27G	chocolate-cofler-air-27g-mvbwci	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580103361	\N	\N
cmrc815lo003475y6bg8bxu7w	VINO BLANCO SUTTER	vino-blanco-sutter-b6a4lj	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790704110121	\N	\N
cmrc815lo003575y68dlkya50	VINO MANDAMAS CAJA	vino-mandamas-caja-cm9rk8	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790984005995	\N	\N
cmrc815lo003675y6ra3ya2d0	SHOT 90G	shot-90g-yfhacy	\N	cmqz5vswb006uxhd8c5bcq86n	7392	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791249451656	\N	\N
cmrc815lo003775y67tutl98a	PRIME STRONGER	prime-stronger-kpqbay	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519001970	\N	\N
cmrc815lo003875y6gcgws7gy	PRIME ANATOMICO	prime-anatomico-qts62x	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519200021	\N	\N
cmrc815lo003975y6bo8pbhaa	PRIME SUPER FINO	prime-super-fino-jathyr	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519200045	\N	\N
cmrc815lo003a75y6m6ti5zn4	PRIME TEXTURADO	prime-texturado-0rm608	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519200069	\N	\N
cmrc815lo003b75y6z2dpdfoc	PRIME ESPERMICIDA	prime-espermicida-0wuoj1	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519200076	\N	\N
cmrc815lo003c75y6yzwrrisl	PRIME TACHAS	prime-tachas-19hiaq	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519200090	\N	\N
cmrc815lo003d75y6om1faqc3	PRIME WARMING	prime-warming-2hdegn	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791519701856	\N	\N
cmrc815lo003e75y6yihc7wm8	FIDEOS SPAGHETTI BULNEZ	fideos-spaghetti-bulnez-z78scd	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791720036921	\N	\N
cmrc815lo003f75y6a6jd10d5	AZUCAR COMUN 1KG	azucar-comun-1kg-4y9f4k	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791100000481	\N	\N
cmrc815lo003g75y6qsket96q	YERBA AMANDA	yerba-amanda-c3znet	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792710000182	\N	\N
cmrc815lo003h75y6ok746264	YERBA PLAYADITO	yerba-playadito-9r2tma	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793704000911	\N	\N
cmrc815lo003i75y6hnlpyi0m	SOPA KNORR VEGETALES	sopa-knorr-vegetales-xt8afr	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000005877	\N	\N
cmrc815lo003j75y63z1gfipi	SOPA KNORR VEGETALES BALANCE	sopa-knorr-vegetales-balance-76oofk	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000006966	\N	\N
cmrc815lo003k75y652laurd8	KNORR SALSA FILETTO	knorr-salsa-filetto-b5vdxq	\N	cmqz5vswb006uxhd8c5bcq86n	3808	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000008052	\N	\N
cmrc815lo003l75y6g37bygmk	DON SATUR MAGDALENA VAINILLA	don-satur-magdalena-vainilla-8lyy56	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7795735601167	\N	\N
cmrc815lo003m75y6md6iyaxi	DON SATUR MAGDALENA DDL	don-satur-magdalena-ddl-dxlk0j	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7795735601174	\N	\N
cmrc815lp003n75y683mjwbbp	DON SATUR MAGDALENA MARMOLADA	don-satur-magdalena-marmolada-nh19lt	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7795735601181	\N	\N
cmrc815lp003o75y6kmcb5saf	DON SATUR MAGDALENA CHOCO	don-satur-magdalena-choco-zx3fee	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7795735601204	\N	\N
cmrc815lp003p75y6a0zwr583	FIDEOS SPAGHETTI CICA	fideos-spaghetti-cica-p1jqsw	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798031155730	\N	\N
cmrc815lp003q75y6f2g7fxsn	FIDEOS TALLARIN CICA	fideos-tallarin-cica-y77u96	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798031155747	\N	\N
cmrc815lp003r75y6u2t1ts3k	PETACA RON BLANCO	petaca-ron-blanco-dcawap	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798098830410	\N	\N
cmrc815lp003s75y6nxt15rw2	PETACA CAFE AL COGNAC	petaca-cafe-al-cognac-0qojxm	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798098830748	\N	\N
cmrc815lp003t75y6h30iiuub	PETACA WHISKY	petaca-whisky-6e9xw6	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798098830977	\N	\N
cmrc815lp003u75y6fhvizrfy	CELULOSA TONKING GRANDE	celulosa-tonking-grande-ja7925	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798121255562	\N	\N
cmrc815lp003v75y6cc0s4aar	MAXX TEXTURADO	maxx-texturado-oaq2m6	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798171946281	\N	\N
cmrc815lp003w75y65mwum7oi	MAXX ESPERMICIDA	maxx-espermicida-91cp21	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798171946342	\N	\N
cmrc815lp003x75y6dcjr3cc1	CHALITAS	chalitas-8rbfvg	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798195940128	\N	\N
cmrc815lp003y75y6br4jw9hn	AGUA DEL FARO BIDON 6.25L	agua-del-faro-bidon-6-25l-rb8c5x	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798310990083	\N	\N
cmrc815lp003z75y6zuzdwiij	PACHAMAMA	pachamama-i1xwj9	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798311170538	\N	\N
cmrc815lp004075y62hzyu19b	ENCENDEDOR CLIPPER	encendedor-clipper-rxa7r7	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8412765508905	\N	\N
cmrc815lp004175y62fykwr8x	FILTROS MENTOLADOS	filtros-mentolados-obki0z	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8595134504095	\N	\N
cmrc815lp004275y60kj62zje	CHIP MOVISTAR	chip-movistar-hhzup7	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8954075145048697547	\N	\N
cmrc815lp004375y6gaxd7y1x	CHIP CLARO	chip-claro-mru39k	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8954316251161167612	\N	\N
cmrc815lp004475y6h39z8orn	CHOCOLATE MILKA PAUSE	chocolate-milka-pause-a9o7vk	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201492717	\N	\N
cmrc815lp004575y61vqhfnbu	MIRINDA 500ML	mirinda-500ml-bs9xis	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813420156	\N	\N
cmrc815lp004675y6igpi90xw	PASO DE LOS TOROS 500ML	paso-de-los-toros-500ml-gbsfh4	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813420385	\N	\N
cmrc815lp004775y6mgikx6c3	PASO DE LOS TOROS TONICA 1.5L	paso-de-los-toros-tonica-1-5l-p6c44t	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813421368	\N	\N
cmrc815lp004875y6sswknsfs	7UP 500ML	7up-500ml-qvh6wu	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813444381	\N	\N
cmrc815lp004975y6fsb9myu6	LATA 7UP	lata-7up-ix4epj	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813777021	\N	\N
cmrc815lq004a75y6wdrlifvu	LATA ANDES NEGRA	lata-andes-negra-bp1243	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798002320	\N	\N
cmrc815lq004b75y651sybiox	LATA ANDES IPA	lata-andes-ipa-o5sqph	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798002726	\N	\N
cmrc815lq004c75y6itfvy7tt	LATA QUILMES	lata-quilmes-079903	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798012923	\N	\N
cmrc815lq004d75y6p7ndjgr6	LATON BUDWEISER	laton-budweiser-v1imss	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798013357	\N	\N
cmrc815lq004e75y6444rx4yt	LATON STELLA ARTOIS	laton-stella-artois-x0swcl	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798013975	\N	\N
cmrc815lq004f75y6fk0lqvu5	LATON ANDES	laton-andes-l036q1	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798014156	\N	\N
cmrc815lq004g75y61fnbciqu	LATON QUILMES	laton-quilmes-bdqaju	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798014835	\N	\N
cmrc815lq004h75y6zquy13yr	BRAHMA LATON	brahma-laton-qrsn3q	\N	cmqz5vswb006uxhd8c5bcq86n	5376	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798015061	\N	\N
cmrc815lq004i75y6l2hqpdhw	LATA CHOCLO	lata-choclo-00nw5m	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793360132414	\N	\N
cmrc815lq004j75y6v9wr7bdu	LATA TOMATE BULNEZ	lata-tomate-bulnez-jlfoso	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791720030189	\N	\N
cmrc815lq004k75y63ja0ay6p	MANTECOL 64G	mantecol-64g-1fyf8v	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201816445	\N	\N
cmrc815lq004l75y6zfk1bkbt	MAYONESA HELLMANN 118G	mayonesa-hellmann-118g-5xwlel	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000006096	\N	\N
cmrc815lq004m75y607qnteeg	MAYONESA HELLMANN 320G	mayonesa-hellmann-320g-rce83f	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000006089	\N	\N
cmrc815lq004n75y64tmkt4uk	HALLS NEGRO	halls-negro-wc36si	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202271267	\N	\N
cmrc815lq004o75y6e5kwnvaw	HALLS MENTA	halls-menta-4ag3sy	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202247316	\N	\N
cmrc815lq004p75y6ceyxofkk	HALLS MENTOL	halls-mentol-u9ke31	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202247392	\N	\N
cmrc815lq004q75y6dfj6y9dd	HALLS MIEL CON MENTA	halls-miel-con-menta-hn5mrm	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202271298	\N	\N
cmrc815lq004r75y6oj74ctnu	HALLS MIEL CON LIMON	halls-miel-con-limon-zgiz7b	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202271328	\N	\N
cmrc815lq004s75y6d4xuxqtz	HALLS CHERRY	halls-cherry-7gcxt5	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202247286	\N	\N
cmrc815lq004t75y61w84vyw8	COCA COLA 1.5L	coca-cola-1-5l-o95gzn	\N	cmqz5vswb006uxhd8c5bcq86n	6496	0	14	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000430	\N	\N
cmrc815lq004u75y6dyea2t9t	OCB TIPS	ocb-tips-68xpxr	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	30104082	\N	\N
cmrc815lq004v75y660rblrzt	OREO GALLETITAS GOLDEN	oreo-galletitas-golden-jf7m2c	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201806552	\N	\N
cmrc815lq004w75y6z317p0g5	GALLETITAS COFLER BLOCK	galletitas-cofler-block-96jgqo	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040116955	\N	\N
cmrc815lr004x75y6orfjbjqq	ENCENDEDOR OKEY / CANDELA -- COMUN --	encendedor-okey-candela-comun-82p2ia	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798182437143	\N	\N
cmrc815lr004y75y6ptr5ia4a	PILAS AAA	pilas-aaa-l91698	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8999002672068	\N	\N
cmrc815lr004z75y6g4y9xc5m	PILAS AA	pilas-aa-txfyfb	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	14	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8999002671962	\N	\N
cmrc815lr005075y68ptx6sdx	ECOLE	ecole-xk9bhc	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790400030457	\N	\N
cmrc815lr005175y6qzbg2lr8	CURITAS	curitas-yqw60z	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7702003010743	\N	\N
cmrc815lr005275y6zjc9lvgv	LAMPARITA 60W	lamparita-60w-rdtoku	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798182436542	\N	\N
cmrc815lr005375y6dpisdwfn	JUGO CLIGHT	jugo-clight-guow9q	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	14	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201703110	\N	\N
cmrc815lr005475y64mwx6e2e	JUGO RINDE 2 LITROS	jugo-rinde-2-litros-chvpl7	\N	cmqz5vswb006uxhd8c5bcq86n	448	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7730908400529	\N	\N
cmrc815lr005575y6h25pyd1e	FILTRO PREMIER	filtro-premier-ohfsxb	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77961679	\N	\N
cmrc815lr005675y69spin6bu	TABACO LUCKIES	tabaco-luckies-whu879	\N	cmqz5vswb006uxhd8c5bcq86n	5152	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798363320172	\N	\N
cmrc815lr005775y6lskcm3xd	FILTRO ZEUS	filtro-zeus-d6g24l	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	8960590652312	\N	\N
cmrc815lr005875y6k2gbrn8r	CHESTERFIELD	chesterfield-fs4qeu	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	19	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77953513	\N	\N
cmrc815lr005975y61ljizv1u	PHILLIPS CONVERTIBLE	phillips-convertible-orl4dp	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	19	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77940735	\N	\N
cmrc815lr005a75y6yv9bjtg1	PHILLIP COMUN	phillip-comun-gcz0gi	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77912879	\N	\N
cmrc815lr005b75y63qehqdx7	PHILLIP BOX	phillip-box-vwkax2	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77912954	\N	\N
cmrc815lr005c75y6x6ti7zf0	MARLBORO CORAL FUSION	marlboro-coral-fusion-1xtxlg	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77968401	\N	\N
cmrc815lr005d75y626why0jq	MARLBORO BLUE ICE	marlboro-blue-ice-5s1k9a	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77941015	\N	\N
cmrc815lr005e75y6p70u7xgt	MARLBORO PURPLE FUSIÓN	marlboro-purple-fusion-ge8n17	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77947550	\N	\N
cmrc815lr005f75y6rv9hj81t	MARLBORO COMÚN	marlboro-comun-sw9iao	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77916433	\N	\N
cmrc815lr005g75y6zshkwg9b	MARLBORO GOLD	marlboro-gold-bb28lh	\N	cmqz5vswb006uxhd8c5bcq86n	4816	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77905819	\N	\N
cmrc815lr005h75y646rz5srn	MARLBORO BOX	marlboro-box-3b17i3	\N	cmqz5vswb006uxhd8c5bcq86n	4816	0	16	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77918482	\N	\N
cmrc815lr005i75y6yrcrzerr	CAMEL	camel-k977nt	\N	cmqz5vswb006uxhd8c5bcq86n	4816	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77977205	\N	\N
cmrc815lr005j75y6gekn31k2	LUCKY STRIKE PARÍS	lucky-strike-paris-k8v77m	\N	cmqz5vswb006uxhd8c5bcq86n	5152	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77977090	\N	\N
cmrc815lr005k75y6q0mcq9fj	LUCKY STRIKE CONVERTIBLE	lucky-strike-convertible-a7j2wa	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77977038	\N	\N
cmrc815lr005l75y6f1ix01mi	LUCKY STRIKE ORIGINAL BOX	lucky-strike-original-box-i3spt2	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77976529	\N	\N
cmrc815lr005m75y6l10fydpz	PETACA VODKA	petaca-vodka-he1huc	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798098830342	\N	\N
cmrc815lr005n75y61fim14ik	FERNET 1 LITRO	fernet-1-litro-c9cjnz	\N	cmqz5vswb006uxhd8c5bcq86n	17920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790290000523	\N	\N
cmrc815lr005o75y6ypv8qm3j	GIN SPIRITO BLU	gin-spirito-blu-17ydh7	\N	cmqz5vswb006uxhd8c5bcq86n	11872	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790290101756	\N	\N
cmrc815ls005p75y6jv3h9b9r	FERNET 750	fernet-750-q44ke1	\N	cmqz5vswb006uxhd8c5bcq86n	15680	0	40	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790290101602	\N	\N
cmrc815ls005q75y631jdwjzx	VINO CAJA VIÑAS TINTO	vino-caja-vinas-tinto-iweh08	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790984004745	\N	\N
cmrc815ls005r75y6nkmvn0ln	VINO TORO BOTELLA	vino-toro-botella-fabjhf	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790984004752	\N	\N
cmrc815ls005s75y6pva8gsgr	VODKA SMIRNOFF	vodka-smirnoff-cvby7c	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791250003011	\N	\N
cmrc815ls005t75y69mqoxw8k	FILTROS CAFÉ LA VIRGINIA	filtros-cafe-la-virginia-sris1q	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790150811061	\N	\N
cmrc815ls005u75y6nifvf41q	CAFÉ LA PLANTA 500G	cafe-la-planta-500g-j4kjbs	\N	cmqz5vswb006uxhd8c5bcq86n	20160	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790550000164	\N	\N
cmrc815ls005v75y6leftw9on	QUESO RALLADO 40G	queso-rallado-40g-bytxz0	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790398100118	\N	\N
cmrc815ls005w75y6loj547d1	QUESO RALLADO 150G	queso-rallado-150g-djdod5	\N	cmqz5vswb006uxhd8c5bcq86n	5488	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790398100132	\N	\N
cmrc815ls005x75y6xwb5ch71	ACEITE NATURA	aceite-natura-9nfr5c	\N	cmqz5vswb006uxhd8c5bcq86n	7168	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070012050	\N	\N
cmrc815ls005y75y6t5rbbbt4	PAPEL HIGIÉNICO X4	papel-higienico-x4-xg90fz	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793344904143	\N	\N
cmrc815ls005z75y6jp3zhg0a	ROLLO COCINA	rollo-cocina-7puth3	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793344904013	\N	\N
cmrc815ls006075y6y54drta3	MAGDALENAS BIMBO	magdalenas-bimbo-dhn3ox	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793890020045	\N	\N
cmrc815ls006175y65ea0l4ll	OBLEAS ZUPAY CHOCOLATE	obleas-zupay-chocolate-18k1tz	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790349000047	\N	\N
cmrc815ls006275y64noak40r	RUMBA	rumba-g3eeyd	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143517	\N	\N
cmrc815ls006375y6apj3rxul	GALLETITAS AMOR	galletitas-amor-k65hmo	\N	cmqz5vswb006uxhd8c5bcq86n	1960	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143531	\N	\N
cmrc815ls006475y6zfboxnh9	DON SATUR BIZCOCHO DULCE	don-satur-bizcocho-dulce-i7vy85	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	20	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7795735000335	\N	\N
cmrc815ls006575y6uvjigint	MAYONESA 20 G	mayonesa-20-g-82sa3c	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000006065	\N	\N
cmrc815ls006675y6ykqyw81d	MAYONESA VEGANA	mayonesa-vegana-e4oabe	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000005426	\N	\N
cmrc815ls006775y6ae1t425i	MAYONESA HELLMANNS 475G	mayonesa-hellmanns-475g-oxzr08	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000007093	\N	\N
cmrc815ls006875y6x2b9pkch	BARBACOA	barbacoa-nr3rtu	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793360123474	\N	\N
cmrc815ls006975y6rqc310gm	LATA CHOCLO	lata-choclo-oznis3	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580980801	\N	\N
cmrc815ls006a75y6nxprf42s	LATA GARBANZOS	lata-garbanzos-mqoxum	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792350067071	\N	\N
cmrc815ls006b75y60kvkxmpl	CAJA PURÉ TOMATE	caja-pure-tomate-cisksm	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580138851	\N	\N
cmrc815ls006c75y60hjzekig	GALLETITAS DE AGUA SERRANITAS	galletitas-de-agua-serranitas-2a7jy7	\N	cmqz5vswb006uxhd8c5bcq86n	784	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143616	\N	\N
cmrc815ls006d75y69ei322cf	GALLETITAS SURTIDAS BAGLEY	galletitas-surtidas-bagley-ibzpac	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040147720	\N	\N
cmrc815ls006e75y6q439vpn5	FAVORITA TALLARIN	favorita-tallarin-mmzwqs	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070320292	\N	\N
cmrc815ls006f75y657n7sj4b	ARROZ	arroz-x1who6	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791120100208	\N	\N
cmrc815lt006g75y64f85zhwa	LUCCHETTI TIRABUZÓN	lucchetti-tirabuzon-aw4565	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070336026	\N	\N
cmrc815lt006h75y6o3e3hhmb	PAN RALLADO	pan-rallado-4lugq6	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790199602910	\N	\N
cmrc815lt006i75y68oitlya9	COPOS DE MAÍZ SIN AZÚCAR	copos-de-maiz-sin-azucar-uyk6iu	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	779805050809	\N	\N
cmrc815lt006j75y6ocoumk94	TOSTADAS 7 SEMILLAS	tostadas-7-semillas-8mt3va	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790071070417	\N	\N
cmrc815lt006k75y6gnanc37i	HILERET	hileret-lu9bzq	\N	cmqz5vswb006uxhd8c5bcq86n	2688	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790490998002	\N	\N
cmrc815lt006l75y6q6c0es5y	POLENTA PRESTOPRONTA	polenta-prestopronta-5hspfd	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580138738	\N	\N
cmrc815lt006m75y6ufh1997f	CUBOS KNORR	cubos-knorr-qr224o	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000008588	\N	\N
cmrc815lt006n75y65o7iljez	BATATAS QUENTO	batatas-quento-76zsif	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798187211892	\N	\N
cmrc815lt006o75y6xwr224wr	REX	rex-yxyb2s	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040144125	\N	\N
cmrc815lt006p75y64xe72ht7	KESITAS	kesitas-sdtqu1	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040144033	\N	\N
cmrc815lt006q75y669wmo2wr	PALETA BROLA	paleta-brola-fvwr87	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	0731299172139	\N	\N
cmrc815lt006r75y69f0omxdc	PAPAS FRITAS FINCA BALCARCE	papas-fritas-finca-balcarce-xlseg9	\N	cmqz5vswb006uxhd8c5bcq86n	5264	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798302800154	\N	\N
cmrc815lt006s75y6veci1yrx	PATITAS DE POLLO	patitas-de-pollo-3ph2lu	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070035936	\N	\N
cmrc815lt006t75y6uf186sr4	BOLITAS DE POLLO	bolitas-de-pollo-1lisoj	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798016103718	\N	\N
cmrc815lt006u75y6u3pb1mt3	RICOSAURIOS	ricosaurios-unv6pl	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798016104784	\N	\N
cmrc815lt006v75y69bt8gers	SUPREMA POLLO Y ESPINACA	suprema-pollo-y-espinaca-i4n6uo	\N	cmqz5vswb006uxhd8c5bcq86n	8848	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070036070	\N	\N
cmrc815lt006w75y614948rb1	NUGGETS POLLO	nuggets-pollo-zsoetq	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798016103169	\N	\N
cmrc815lt006x75y6b4l51f8w	POCHOCLO DE POLLO	pochoclo-de-pollo-p00qy4	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798016103381	\N	\N
cmrc815lt006y75y6f0nu4cee	HAMBURGUESA FINEXCOR X2	hamburguesa-finexcor-x2-gitfb1	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7796862191750	\N	\N
cmrc815lt006z75y6kwsr3l3z	PIZZA SIBARITA MOZZARELLA	pizza-sibarita-mozzarella-8wm8ga	\N	cmqz5vswb006uxhd8c5bcq86n	9520	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070040015	\N	\N
cmrc815lt007075y6ha3lkhly	PIZZA SIBARITA MOZZARELLA Y JAMÓN	pizza-sibarita-mozzarella-y-jamon-sc1gbo	\N	cmqz5vswb006uxhd8c5bcq86n	12320	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070040046	\N	\N
cmrc815lt007175y6i0ebqcr5	CINDOR - NESQUIK 200ML	cindor-nesquik-200ml-u1qr8q	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77913337007260	\N	\N
cmrc815lt007275y6qsbg4i82	RAVIOLES JAMON Y MOZZARELLA 450G	ravioles-jamon-y-mozzarella-450g-skfj98	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070621870	\N	\N
cmrc815lt007375y6zvtw55kt	CHOCOLATADA SERENISIMA CINDOR 1L	chocolatada-serenisima-cindor-1l-xw8eu5	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791337008403	\N	\N
cmrc815lt007475y6ldbqicdp	GALLETITAS MANA	galletitas-mana-bw9fae	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040137813	\N	\N
cmrc815lt007575y685kb4ite	MANI CON CHOCOLATE CLOFLER	mani-con-chocolate-clofler-0ysjdv	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580110284	\N	\N
cmrc815lt007675y6ump6bfug	RHODESIA	rhodesia-xgtio3	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77995681	\N	\N
cmrc815lt007775y6qtdbc5vx	ROCKLETS	rocklets-jgj29c	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580421007	\N	\N
cmrc815lt007875y63l8gcxdq	ALFAJOR AGUILA BROWNIE /CLASICA	alfajor-aguila-brownie-clasica-tf77lt	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040133594	\N	\N
cmrc815lt007975y6eqmb2qzu	ALFAJOR TOFI TRIPLE	alfajor-tofi-triple-1ztu9e	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040484801	\N	\N
cmrc815lu007a75y6y893biwx	ALFAJOR TRI SHOT	alfajor-tri-shot-z6fr7t	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77956699	\N	\N
cmrc815lu007b75y6qtypolby	ALFAJOR COFLER BLOCK SIMPLE	alfajor-cofler-block-simple-0myyyr	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143654	\N	\N
cmrc815lu007c75y67qa78vym	ALFAJOR AGUILA TRIPLE	alfajor-aguila-triple-iynlr1	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040141209	\N	\N
cmrc815lu007d75y61b56cse2	ALFAJOR COFLER MOUSSE SIMPLE	alfajor-cofler-mousse-simple-f60lws	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143647	\N	\N
cmrc815lu007e75y6hpbg9i2w	ALFAJOR MILKA MOUSSE SIMPLE	alfajor-milka-mousse-simple-01hzks	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622300759506	\N	\N
cmrc815lu007f75y6rbp8925w	GALLETITAS CHOCOLINAS	galletitas-chocolinas-4i3w7t	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143227	\N	\N
cmrc815lu007g75y6d2s4xb7t	GALLETITAS PEPITOS	galletitas-pepitos-vajgam	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201935906	\N	\N
cmrc815lu007h75y6vf7sxjjx	CHOCOLATE ARCOR DUO	chocolate-arcor-duo-yetq18	\N	cmqz5vswb006uxhd8c5bcq86n	6272	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580133795	\N	\N
cmrc815lu007i75y69kmcxjts	PAPAS NIKITOS	papas-nikitos-qgxw9b	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798052363664	\N	\N
cmrc815lu007j75y6w0tehnz4	CHOCOLATE AGUILA AMARGO	chocolate-aguila-amargo-e05iro	\N	cmqz5vswb006uxhd8c5bcq86n	10752	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77900142995	\N	\N
cmrc815lu007k75y6f9vcsmi0	GALLETITAS COFLER BAÑADAS	galletitas-cofler-banadas-l68efo	\N	cmqz5vswb006uxhd8c5bcq86n	3248	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143692	\N	\N
cmrc815lu007l75y6mjr5f54f	CHOCOLATE BON O BON RELLENO	chocolate-bon-o-bon-relleno-k9dxn7	\N	cmqz5vswb006uxhd8c5bcq86n	8176	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580146047	\N	\N
cmrc815lu007m75y67b3x7w83	TITA	tita-a7ksk5	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77976291	\N	\N
cmrc815lu007n75y6sag5x8co	TE	te-cbplhv	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7797470001936	\N	\N
cmrc815lu007o75y6ufb345xz	PURE INSTANTANEO	pure-instantaneo-s11eb5	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7794000006379	\N	\N
cmrc815lu007p75y6w4j9q2z0	PASTA DE DIENTES	pasta-de-dientes-ksezdt	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7509546692135	\N	\N
cmrc815lu007q75y66zcmgq3z	CEPILLO DE DIENTES	cepillo-de-dientes-f6ygjp	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7796851809383	\N	\N
cmrc815lu007r75y6y1hsf4g6	MANTECOL 64G	mantecol-64g-b26c5w	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201816384	\N	\N
cmrc815lu007s75y6uj3hbndr	HAMBURGUESA FINEXCOR GIGANTES	hamburguesa-finexcor-gigantes-33wubi	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7796862191767	\N	\N
cmrc815lu007t75y6pp1qbcms	H2OH SIN GAS. 1.5 LNARANJA- POMELO - MANZANILLA	h2oh-sin-gas-1-5-lnaranja-pomelo-manzanilla-j83say	\N	cmqz5vswb006uxhd8c5bcq86n	4250.4	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813403036	\N	\N
cmrc815lu007u75y6n3qpvz0b	AGUA ECO 1.5	agua-eco-1-5-zfzv8j	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792799000059	\N	\N
cmrc815lu007v75y693qz3kv6	AGUA ECO 2L	agua-eco-2l-m34yno	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792799000097	\N	\N
cmrc815lu007w75y68lagpp9w	LATA BUDWEISER	lata-budweiser-n0dj7n	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147118822	\N	\N
cmrc815lu007x75y6q0frxv6h	LATA STELLA ARTOIS	lata-stella-artois-bq2xnk	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798010615	\N	\N
cmrc815lu007y75y64dhr4mta	PORRON CORONA	porron-corona-9bqnat	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798003709	\N	\N
cmrc815lu007z75y6v9f4rgo2	IDENTIFICAR PRODUCTO	identificar-producto-mrydhm	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798011421	\N	\N
cmrc815lu008075y6767xdf68	QUILMES 1L	quilmes-1l-pt7fih	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798172269	\N	\N
cmrc815lu008175y6fx7b58j5	CORONA 710	corona-710-i8ar8y	\N	cmqz5vswb006uxhd8c5bcq86n	7392	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798003716	\N	\N
cmrc815lu008275y69dodm1bq	BRAHMA 1L	brahma-1l-9vjddy	\N	cmqz5vswb006uxhd8c5bcq86n	6384	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798007981	\N	\N
cmrc815lu008375y6n5brc534	PEPSI 1.5 L	pepsi-1-5-l-913n45	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813888413	\N	\N
cmrc815lu008475y65b1w7l5w	PEPSI 2L	pepsi-2l-2uj0ok	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813888468	\N	\N
cmrc815lu008575y6l151tnlo	LATA GROLSCH	lata-grolsch-ttvh7o	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147570866	\N	\N
cmrc815lu008675y6g2b201y7	LATON SCHNEIDER	laton-schneider-ubame8	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147570606	\N	\N
cmrc815lu008775y6zhi1qcis	PORRON MILLER	porron-miller-ae04ck	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147573492	\N	\N
cmrc815lu008875y6d3ug82z5	LATA SCHNEIDER	lata-schneider-temcof	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	21	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147118860	\N	\N
cmrc815lu008975y69yxbm1ry	HEINEKEN 1L	heineken-1l-ttibfs	\N	cmqz5vswb006uxhd8c5bcq86n	9744	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147000905	\N	\N
cmrc815lu008a75y6q64h9p0z	AGUA NESTLE 1.5L	agua-nestle-1-5l-k5jjus	\N	cmqz5vswb006uxhd8c5bcq86n	2688	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792799000905	\N	\N
cmrc815lu008b75y6aofgjaxs	AGUA VILLAVICENCIO CON GAS	agua-villavicencio-con-gas-wlvl1c	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7799155000210	\N	\N
cmrc815lu008c75y65pxdrypy	LATA HEINEKEK	lata-heinekek-o1g807	\N	cmqz5vswb006uxhd8c5bcq86n	5376	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147009199	\N	\N
cmrc815lu008d75y6pt52c8o3	AGUA ANOKA 500ML	agua-anoka-500ml-vmuy1e	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798195860037	\N	\N
cmrc815lu008e75y6hhvrts7m	LATON HEINEKEK	laton-heinekek-v099s6	\N	cmqz5vswb006uxhd8c5bcq86n	7952	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793147571283	\N	\N
cmrc815lu008f75y6j234p476	AWAFRUT	awafrut-pzg0gw	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798011995	\N	\N
cmrc815lu008g75y6kjkf2pb0	7UP 3	7up-3-t3newv	\N	cmqz5vswb006uxhd8c5bcq86n	6832	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798134444793	\N	\N
cmrc815lu008h75y6kgk5x6rg	CEPITA TETRA 1L	cepita-tetra-1l-x51c7w	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895646560	\N	\N
cmrc815lu008i75y6oknpgzmb	CEPITA PLASTICO 1L	cepita-plastico-1l-w53c3u	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895009515	\N	\N
cmrc815lu008j75y6es0q8mfw	COFLER BLOCK 38GR.	cofler-block-38gr-qw1zkk	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77953124	\N	\N
cmrc815lu008k75y66hu7uu6h	GALLETITAS OPERA	galletitas-opera-yyh2vi	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77903501	\N	\N
cmrc815lu008l75y6lsss72ze	ALFAJOR BON O BON TRIPLE	alfajor-bon-o-bon-triple-rc6xxd	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040614000	\N	\N
cmrc815lu008m75y65z060ngw	ALFAJOR BLANCO Y NEGRO	alfajor-blanco-y-negro-n7v2j2	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040141186	\N	\N
cmrc815lu008n75y6ql2hewwr	CHOCOLATE AGUILA TAZA 140G	chocolate-aguila-taza-140g-6cidh7	\N	cmqz5vswb006uxhd8c5bcq86n	7504	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790407031273	\N	\N
cmrc815lu008o75y603hr5azq	GALLETITAS CEREAL MIX	galletitas-cereal-mix-xt4xtg	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040140936	\N	\N
cmrc815lu008p75y67c4s0gr0	SAL FINA	sal-fina-9e6z2l	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790072001014	\N	\N
cmrc815lv008q75y6zxmif1w0	CRUSH	crush-qgg6u1	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895006951	\N	\N
cmrc815lv008r75y66pdc0zpp	AQUARIUS PERA 2.5L	aquarius-pera-2-5l-00mai5	\N	cmqz5vswb006uxhd8c5bcq86n	6608	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895003295	\N	\N
cmrc815lv008s75y6v8xk19sj	TURRON	turron-xcx7aa	\N	cmqz5vswb006uxhd8c5bcq86n	560	0	32	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77940131	\N	\N
cmrc815lv008t75y6nbfqs52e	TURRON	turron-gvb4n3	\N	cmqz5vswb006uxhd8c5bcq86n	560	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77975737	\N	\N
cmrc815lv008u75y69ervjww1	BARRITA DE CEREAL ALMENDRA	barrita-de-cereal-almendra-3p1ikl	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77916525	\N	\N
cmrc815lv008v75y65rh7uxvq	BARRITA DE CEREAL	barrita-de-cereal-a3j67v	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77965387	\N	\N
cmrc815lv008w75y6ddxch53h	KINDER HUEVO SORPRESA ROSA	kinder-huevo-sorpresa-rosa-hc8jp1	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	78931053	\N	\N
cmrc815lv008x75y6lcdtivw2	ALFAJOR FANTOCHE TRIPLE - CHOCO	alfajor-fantoche-triple-choco-950w1i	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77991577	\N	\N
cmrc815lv008y75y6saqamnv3	PALITOS - MANI	palitos-mani-zjj4vs	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790310984352	\N	\N
cmrc815lv008z75y6vdaiqb8v	PALITOS - MANI	palitos-mani-lh535g	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790310984390	\N	\N
cmrc815lv009075y60kgsme6p	PALITOS - MANI	palitos-mani-2m8btz	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790310983874	\N	\N
cmrc815lv009175y6o2svmo22	PRINGLES	pringles-bfzpsi	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7896004009155	\N	\N
cmrc815lv009275y6eev8lvsu	PRINGLES QUESO 109G	pringles-queso-109g-kob4jh	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7896004009179	\N	\N
cmrc815lv009375y6fakdvty8	PRINGLES	pringles-lg3e9h	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7896004011790	\N	\N
cmrc815lv009475y6f4q9ek62	JUGO BC 200ML	jugo-bc-200ml-80al8x	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793360106064	\N	\N
cmrc815lv009575y6d8t9i74z	JUGO BC 200ML	jugo-bc-200ml-370l9k	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793360106101	\N	\N
cmrc815lv009675y66oilf6mw	JUGO BC 200ML	jugo-bc-200ml-zo0f8p	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7793360106095	\N	\N
cmrc815lv009775y6o4lgegcm	GALLETITAS FORMIS	galletitas-formis-2p5aso	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040139909	\N	\N
cmrc815lv009875y6mvrahzg2	GALLETITAS FORMIS	galletitas-formis-w6si1o	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040139893	\N	\N
cmrc815lv009975y640wmj95j	CHOCOLATE COFLER AIR 77G	chocolate-cofler-air-77g-f3p426	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580115562	\N	\N
cmrc815lv009a75y6etdf0rj7	CHOCOLATE COFLER AIR 77G	chocolate-cofler-air-77g-aczd5j	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580103422	\N	\N
cmrc815lv009b75y64zlnrtbg	CHOCOLATE COFLER AIR 77G	chocolate-cofler-air-77g-hspr82	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580116842	\N	\N
cmrc815lv009c75y6s8bxx2gc	CHOCOLATE COFLER AIR 77G	chocolate-cofler-air-77g-3pqq4p	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580033408	\N	\N
cmrc815lv009d75y6p2i5qn59	CHOCOLATE COFLER AIR 77G	chocolate-cofler-air-77g-4f5gqe	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580103439	\N	\N
cmrc815lv009e75y6j9rjlbjj	COCA COLA  1.5L ZERO	coca-cola-1-5l-zero-uvt5jd	\N	cmqz5vswb006uxhd8c5bcq86n	6048	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895067556	\N	\N
cmrc815lv009f75y65r9rkhy5	SPRITE 1.5L	sprite-1-5l-7x8sqw	\N	cmqz5vswb006uxhd8c5bcq86n	6496	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000447	\N	\N
cmrc815lv009g75y6w8tejume	FANTA 2.25 L	fanta-2-25-l-s81tmg	\N	cmqz5vswb006uxhd8c5bcq86n	7616	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895001017	\N	\N
cmrc815lv009h75y6wbb73qv9	COCA 500ml	coca-500ml-b0kun1	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000782	\N	\N
cmrc815lv009i75y6mvfhsryu	H2OH CITRUS 2.25L	h2oh-citrus-2-25l-mfs86i	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813423591	\N	\N
cmrc815lw009j75y6ygi3zv1i	H2OH CITRUS 2.25L	h2oh-citrus-2-25l-txfsxd	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813423911	\N	\N
cmrc815lw009k75y6a7cm9ohx	LATA FANTA	lata-fanta-s2lbio	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895000256	\N	\N
cmrc815lw009l75y6mt8fl5du	PATAGONIA	patagonia-lv3tag	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798015023	\N	\N
cmrc815lw009m75y6fhrsaw4x	GATORADE 750ML	gatorade-750ml-dbdjx4	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	779270052271	\N	\N
cmrc815lw009n75y6fdo6m7gw	GATORADE 750ML	gatorade-750ml-55yhzv	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792170052264	\N	\N
cmrc815lw009o75y6m09m086b	GATORADE COOL BLUE 500ML	gatorade-cool-blue-500ml-8rcztp	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792170042258	\N	\N
cmrc815lw009p75y6gcrxnf7n	GATORADE MANZANA 500ML	gatorade-manzana-500ml-isyknn	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792170042005	\N	\N
cmrc815lw009q75y65hk03hke	GATORADE FRUTAS TROPICALES 500ML	gatorade-frutas-tropicales-500ml-i474zd	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792170042029	\N	\N
cmrc815lw009r75y60rsd1xf5	PEPSI 500ML	pepsi-500ml-hrzxss	\N	cmqz5vswb006uxhd8c5bcq86n	2688	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813888406	\N	\N
cmrc815lw009s75y67u2g6nj8	LATA PEPSI	lata-pepsi-e3iyzk	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813888376	\N	\N
cmrc815lw009t75y6z0niqztf	LATA MIRINDA	lata-mirinda-927cw4	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813333029	\N	\N
cmrc815lw009u75y6o2pm2hrx	LEVITE 1.5L	levite-1-5l-z0vyg4	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798062548709	\N	\N
cmrc815lw009v75y62kbrbhne	LEVITE 1.5L	levite-1-5l-nc2nzd	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798062548679	\N	\N
cmrc815lw009w75y6s13vhcj9	LEVITE 1.5L	levite-1-5l-qoxt7h	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798062548648	\N	\N
cmrc815lw009x75y6gxpu1jc4	LEVITE 2.25L	levite-2-25l-gq5d9j	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790315000880	\N	\N
cmrc815lw009y75y6ac5t354q	LEVITE 2.25L	levite-2-25l-z8kmjq	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798062540284	\N	\N
cmrc815lw009z75y6fbmq1v0c	LEVITE 2.25L	levite-2-25l-abmnkp	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7799155000340	\N	\N
cmrc815lw00a075y6v9p9u8sf	LEVITE 500ML	levite-500ml-twmz17	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798062548686	\N	\N
cmrc815lw00a175y6fsq6j4tc	LEVITE 500ML	levite-500ml-x0pb1x	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798062548655	\N	\N
cmrc815lw00a275y6umms8a95	LATA ANDES	lata-andes-1a9j2i	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798999866	\N	\N
cmrc815lw00a375y6xx1lq98z	LATA ANDES	lata-andes-w5ytft	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7792798992317	\N	\N
cmrc815lw00a475y6x054ty47	VINO COLON	vino-colon-lg3hvy	\N	cmqz5vswb006uxhd8c5bcq86n	7616	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790168904373	\N	\N
cmrc815lw00a575y67lh2jtts	VINO COLON	vino-colon-06vor6	\N	cmqz5vswb006uxhd8c5bcq86n	7616	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790168904403	\N	\N
cmrc815lw00a675y6dy1w82yf	VINO COLON	vino-colon-zrwp1w	\N	cmqz5vswb006uxhd8c5bcq86n	7616	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790168903925	\N	\N
cmrc815lw00a775y66h6bymea	MANTECA SANCOR 100G	manteca-sancor-100g-mui0qt	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790398100071	\N	\N
cmrc815lw00a875y6r4drtknc	MANTECA SANCOR 100G	manteca-sancor-100g-otxe2a	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798060850019	\N	\N
cmrc815lw00a975y664cytk0x	GALLETITAS COFLER RELLENAS	galletitas-cofler-rellenas-yddm39	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143777	\N	\N
cmrc815lx00aa75y6thtiqk5p	GALLETITAS COFLER RELLENAS	galletitas-cofler-rellenas-cde2gd	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040143784	\N	\N
cmrc815lx00ab75y67qzwyoda	GALLETITAS OREO RELLENAS	galletitas-oreo-rellenas-42n7pc	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202049033	\N	\N
cmrc815lx00ac75y6niwousto	BON O BON /BARRA CHOCOLATE	bon-o-bon-barra-chocolate-t1x8cy	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580150327	\N	\N
cmrc815lx00ad75y6oh11hzj2	BON O BON /BARRA CHOCOLATE	bon-o-bon-barra-chocolate-0io4nk	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580131562	\N	\N
cmrc815lx00ae75y6n5amj9j8	BON O BON /BARRA CHOCOLATE	bon-o-bon-barra-chocolate-50eshx	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580109646	\N	\N
cmrc815lx00af75y6fffsm3s8	BON O BON /BARRA CHOCOLATE	bon-o-bon-barra-chocolate-m0ushi	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580346614	\N	\N
cmrc815lx00ag75y682ro1om9	BON O BON /BARRA CHOCOLATE	bon-o-bon-barra-chocolate-o02ygx	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580346515	\N	\N
cmrc815lx00ah75y6pk4b6g5k	CHOCOLATE COFLER 55G	chocolate-cofler-55g-2o0qdu	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580106560	\N	\N
cmrc815lx00ai75y6mnrt572e	CHOCOLATE COFLER 55G	chocolate-cofler-55g-iocffl	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580103538	\N	\N
cmrc815lx00aj75y63swuzdv1	CHOCOLATE COFLER 55G	chocolate-cofler-55g-rpiar1	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580103521	\N	\N
cmrc815lx00ak75y6n4erwveb	CHOCOLATE COFLER 55G	chocolate-cofler-55g-awguw3	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580103484	\N	\N
cmrc815lx00al75y6k10lmcmn	CHOCOLATE COFLER 140G	chocolate-cofler-140g-offuxk	\N	cmqz5vswb006uxhd8c5bcq86n	8176	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580127947	\N	\N
cmrc815lx00am75y6gyfxi558	CHOCOLATE COFLER 140G	chocolate-cofler-140g-se4bp0	\N	cmqz5vswb006uxhd8c5bcq86n	8176	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580146092	\N	\N
cmrc815lx00an75y6vf5rygyz	GALLETITAS COFLER BLOCK	galletitas-cofler-block-t26zs9	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790040110748	\N	\N
cmrc815lx00ao75y6e1jhvs2i	CEPITA PLASTICO 1L NARANJA	cepita-plastico-1l-naranja-sxmy5d	\N	cmqz5vswb006uxhd8c5bcq86n	5264	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790895009815	\N	\N
cmrc815lx00ap75y6p4m4fzwr	RED POINT	red-point-5ukdmg	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77994936	\N	\N
cmrc815lx00aq75y66dpply85	BOLSA DIENTITOS	bolsa-dientitos-0kteei	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790580151713	\N	\N
cmrc815lx00ar75y64z124yhs	MIRINDA 2,25L	mirinda-2-25l-cf9mh4	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7791813423157	\N	\N
cmrc815lx00as75y67hsh4t9e	HAMBURGUESA SWIFT X4 80 G.	hamburguesa-swift-x4-80-g-1atr44	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790360026576	\N	\N
cmrc815lx00at75y6mwtbg0o4	CAFÉ 50G	cafe-50g-k1ee9j	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7790070933652	\N	\N
cmrc815lx00au75y65ocqabxh	PACHAMAMA	pachamama-i99ljt	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7798311170019	\N	\N
cmrc815lx00av75y63ad2a1av	CHICLE BELDENT	chicle-beldent-lhyftz	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77969095	\N	\N
cmrc815lx00aw75y6aq6s5tq6	BELDENT FRUTILLA POP	beldent-frutilla-pop-2fjyzk	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	17	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77969118	\N	\N
cmrc815lx00ax75y6t0cyd012	CHICLE BELDENT MENTA POWER	chicle-beldent-menta-power-jvcd1h	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	18	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77969088	\N	\N
cmrc815lx00ay75y69pt9ffyl	CHICLE BELDENT	chicle-beldent-8ofk7t	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77969101	\N	\N
cmrc815lx00az75y6j2uwqohn	CHICLE	chicle-svx3ks	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	77987686	\N	\N
cmrc815lx00b075y61wwzewsy	ALFAJOR SHOT TRIPLE	alfajor-shot-triple-axqdh7	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622202816437	\N	\N
cmrc815lx00b175y6w3o9jkpz	MINI OREOS	mini-oreos-z02fdb	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201761288	\N	\N
cmrc815lx00b275y6alndahbs	CHICLE BELDENT INFINIT	chicle-beldent-infinit-13qff4	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201448226	\N	\N
cmrc815lx00b375y6mm09o5vn	CHICLE BELDENT INFINIT MENTA	chicle-beldent-infinit-menta-h0901r	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.129	2026-07-08 15:16:58.129	\N	\N	\N	7622201421496	\N	\N
cmrc815sd00b475y6fedsnc09	BUBBALO GOMITAS	bubbalo-gomitas-0jiqfi	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622202217296	\N	\N
cmrc815se00b575y6gyzay32p	DORITOS DINAMITA 82G	doritos-dinamita-82g-jkxsez	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310987926	\N	\N
cmrc815se00b675y65l2e89ge	DOS CORAZONES	dos-corazones-htzoep	\N	cmqz5vswb006uxhd8c5bcq86n	2520	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77907509	\N	\N
cmrc815se00b775y6k4swsgxb	CLUB SOCIAL	club-social-n7f10l	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622202293740	\N	\N
cmrc815se00b875y6g9b71fm8	CLUB SOCIAL	club-social-saelg3	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622210692245	\N	\N
cmrc815se00b975y62ovx8tbz	NUGATON	nugaton-gvkcwt	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792360072447	\N	\N
cmrc815se00ba75y62cwi4pk4	SOFT COOKIES	soft-cookies-25yxiq	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798195940319	\N	\N
cmrc815se00bb75y6launhnfb	SOFT COOKIES	soft-cookies-p431vp	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798195940289	\N	\N
cmrc815se00bc75y6vyeviwm2	HELADO PALITO DE AGUA SURFY	helado-palito-de-agua-surfy-wvvgk1	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043065102	\N	\N
cmrc815se00bd75y6oulevx97	HELADO PALITO DE AGUA SURFY	helado-palito-de-agua-surfy-4qqb51	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043065126	\N	\N
cmrc815se00be75y6l06nz9uu	HELADO PALITO DE AGUA SURFY	helado-palito-de-agua-surfy-pe2lf7	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043062873	\N	\N
cmrc815se00bf75y6wxi28y8r	HELADO PALITO DE AGUA SURFY	helado-palito-de-agua-surfy-ubs1xq	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043065119	\N	\N
cmrc815se00bg75y6qm55wqok	ALFAJOR SHOT SIMPLE PASTA DE MANI 44G	alfajor-shot-simple-pasta-de-mani-44g-938rro	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622202304705	\N	\N
cmrc815se00bh75y6e94q1c0i	FANTOCHE MINI NEGRO	fantoche-mini-negro-mgj2gh	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672002012	\N	\N
cmrc815se00bi75y6s9f1jz40	FANTOCHE MINI BLANCO	fantoche-mini-blanco-065pkq	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672002005	\N	\N
cmrc815se00bj75y6z0g6qe6n	PIPAS COMUNES	pipas-comunes-7hmp9e	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77965233	\N	\N
cmrc815se00bk75y62254nmkp	TERRABUSI ANILLITOS X 300 GRS	terrabusi-anillitos-x-300-grs-dbz6oh	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201504007	\N	\N
cmrc815se00bl75y6g1xxwre4	CHOCOLATE MILKA 110G	chocolate-milka-110g-r2o6n0	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201812744	\N	\N
cmrc815se00bm75y621khrip9	HELADO POTE BLOCK	helado-pote-block-1rq4gp	\N	cmqz5vswb006uxhd8c5bcq86n	9968	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580135348	\N	\N
cmrc815se00bn75y6m5tyvgl5	HELADO ROCKLETS	helado-rocklets-7wkkyg	\N	cmqz5vswb006uxhd8c5bcq86n	3248	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580524104	\N	\N
cmrc815se00bo75y60gljfzau	HELADO PALETA CON ALMENDRAS	helado-paleta-con-almendras-16ai2e	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580395803	\N	\N
cmrc815se00bp75y6xvjew52g	GOMITAS MOGUL SPLASH	gomitas-mogul-splash-9xqht0	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580116873	\N	\N
cmrc815se00bq75y6ihkyl43c	GOMITAS MOGUL SPLASH	gomitas-mogul-splash-mncf00	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580116880	\N	\N
cmrc815se00br75y6ok3uc1k8	BONITAS MOGUL MASTI	bonitas-mogul-masti-fwuove	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580117993	\N	\N
cmrc815se00bs75y6hbqxgn6d	JUGO BIG C PERA	jugo-big-c-pera-7ubdnf	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798287610090	\N	\N
cmrc815se00bt75y6qswtbxhi	PAN LACTAL BLANCO 315 G	pan-lactal-blanco-315-g-5kez12	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890258769	\N	\N
cmrc815se00bu75y6ney1lqsr	RED BULL 250ML	red-bull-250ml-t789zj	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	9002490100070	\N	\N
cmrc815se00bv75y6zt03vk2s	RED BULL RED 250ML	red-bull-red-250ml-o5gb5n	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	9002490258313	\N	\N
cmrc815se00bw75y6kk4vi1ye	RED BULL GREEN 250ML	red-bull-green-250ml-50neim	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	9002490280055	\N	\N
cmrc815se00bx75y6haontstn	LAYS 40 G	lays-40-g-56r74c	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985236	\N	\N
cmrc815sg00by75y67o79eeqx	LAYS CLASICAS 85G	lays-clasicas-85g-7g4t6f	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985458	\N	\N
cmrc815sh00bz75y6j1yzkgi9	HARINA	harina-ag6tyh	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070562265	\N	\N
cmrc815sh00c075y652h5th3m	HARINA	harina-rwtobo	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790199000013	\N	\N
cmrc815sh00c175y61ry7i3u9	HARINA PUREZA PIZZA GOURMET	harina-pureza-pizza-gourmet-muxfc1	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792180005113	\N	\N
cmrc815sh00c275y6xfnib6iz	HARINA	harina-ujqfv0	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7702084137520	\N	\N
cmrc815sh00c375y6obaaya08	ALFAJOR TOFI NEGRI SIMPLE	alfajor-tofi-negri-simple-juoq9r	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040116610	\N	\N
cmrc815sh00c475y6mej8r8bh	ALFAJOR COFLER BLOCK triple	alfajor-cofler-block-triple-6eu1wu	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040659605	\N	\N
cmrc815sh00c575y645ex1vq6	ALFAJOR BON O BON TRIPLE	alfajor-bon-o-bon-triple-4f6d81	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040152748	\N	\N
cmrc815sh00c675y6qta738os	ALFAJOR AGUILA MINITORTA	alfajor-aguila-minitorta-bjzexi	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040133587	\N	\N
cmrc815sh00c775y63plm6643	ALFAJOR BON O BON TRIPLE negro	alfajor-bon-o-bon-triple-negro-y1wtp6	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040991910	\N	\N
cmrc815sh00c875y6fiot114j	TOP LINE SEVEN	top-line-seven-eigmup	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77951113	\N	\N
cmrc815sh00c975y6mtuxkulc	TOP LINE SEVEN CHERRY	top-line-seven-cherry-1927l9	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77948496	\N	\N
cmrc815sh00ca75y6uzl5lyxg	TOP LINE SEVEN MENTA	top-line-seven-menta-cnqg7a	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	16	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77931764	\N	\N
cmrc815si00cb75y605rn66uf	TOP LINE ULTRA	top-line-ultra-bbpjyn	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580121013	\N	\N
cmrc815si00cc75y6lt6je5lq	MENTHOPLUS MENTA	menthoplus-menta-7ce347	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	15	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77958662	\N	\N
cmrc815sj00cd75y63y6nu48t	MENTHOPLUS STRONG	menthoplus-strong-71zh4i	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77958648	\N	\N
cmrc815sj00ce75y6o6yj84yy	MENTHOPLUS MIEL	menthoplus-miel-men6m3	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77958655	\N	\N
cmrc815sj00cf75y68uxvep6e	VINOS TINTOS BAUTISMO	vinos-tintos-bautismo-h9yii4	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791540049910	\N	\N
cmrc815sj00cg75y64tj0euss	VINOS TINTOS CAZADOR	vinos-tintos-cazador-0rsq7i	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790762754138	\N	\N
cmrc815sj00ch75y6c0odtlm6	VINO BLANCO ALARIS - ELEMENTOS	vino-blanco-alaris-elementos-d8jzmc	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790240107517	\N	\N
cmrc815sj00ci75y6lzjichw8	VINO BLANCO ALARIS - ELEMENTOS	vino-blanco-alaris-elementos-axb3j0	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790189021059	\N	\N
cmrc815sj00cj75y61k2vjv2p	AQUARIUS 1.5 MANZANA	aquarius-1-5-manzana-rdlquk	\N	cmqz5vswb006uxhd8c5bcq86n	5488	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895640483	\N	\N
cmrc815sj00ck75y6cbg5rqvm	FORT CEREAL BARRA	fort-cereal-barra-cr206j	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77909145	\N	\N
cmrc815sj00cl75y6dgarwil1	FORT CEREAL BARRA	fort-cereal-barra-6sy1di	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790206509171	\N	\N
cmrc815sj00cm75y6yekn9jiq	MENTHOPLUS MENTOL	menthoplus-mentol-uftlc0	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77958624	\N	\N
cmrc815sj00cn75y6pdtonxc2	MENTHOPLUS ZERO	menthoplus-zero-ipvhpg	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77946805	\N	\N
cmrc815sj00co75y6qv7d064p	TIC TAC MENTA	tic-tac-menta-dj65rc	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	78600010	\N	\N
cmrc815sj00cp75y6vgoh2xm0	TIC TAC DUPLA FRUTILLA	tic-tac-dupla-frutilla-ts7h4a	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	78605831	\N	\N
cmrc815sj00cq75y6b883ej92	PUSH POP FRUTOS DEL BOSQUE	push-pop-frutos-del-bosque-04mfp4	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798040463598	\N	\N
cmrc815sj00cr75y66up3veor	COÑAC TRES PLUMAS CHOCOLATE	conac-tres-plumas-chocolate-4o6a0i	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260013065	\N	\N
cmrc815sj00cs75y6rgswwloc	COÑAC TRES PLUMAS AMARETTO	conac-tres-plumas-amaretto-7x9xm6	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260013126	\N	\N
cmrc815sj00ct75y6mhuwo2h2	COÑAC TRES PLUMAS AMARETTO	conac-tres-plumas-amaretto-vmoh1a	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260013195	\N	\N
cmrc815sj00cu75y6rj1tkcl2	QUITAESMALTE DORRE  X65ML	quitaesmalte-dorre-x65ml-e7ylhu	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794050005087	\N	\N
cmrc815sj00cv75y6ofe5lc0v	TOALLA DONCELLA ROSA	toalla-doncella-rosa-rs1nn9	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790940216151	\N	\N
cmrc815sj00cw75y6nkd3460w	TOALLA  DONCELLA P/INCONTINGENCIA	toalla-doncella-p-incontingencia-4ws1wk	\N	cmqz5vswb006uxhd8c5bcq86n	5152	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790940518033	\N	\N
cmrc815sj00cx75y6ghngfly9	TOALLA DONCELLA VERDE	toalla-doncella-verde-yzlsmi	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790940216144	\N	\N
cmrc815sj00cy75y6j1ryb87f	PEGAMENTO LA GOTITA 2ML	pegamento-la-gotita-2ml-sb9rig	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77917188	\N	\N
cmrc815sj00cz75y69pq90dsk	BUDIN SMAMS C CHIP	budin-smams-c-chip-87q6vr	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798181510274	\N	\N
cmrc815sj00d075y64xr0lucd	BUDIN SMAMS C FRUTAS	budin-smams-c-frutas-c0ptuf	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798181510656	\N	\N
cmrc815sj00d175y64nnvcyew	TOALLA DONCELLA TANGA	toalla-doncella-tanga-6m0bjy	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790940216205	\N	\N
cmrc815sj00d275y68wbqjmmx	DON SATUR BIZCOCHO NEGRO	don-satur-bizcocho-negro-tw49bu	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7795735000342	\N	\N
cmrc815sj00d375y6sxkv2bsb	AGUA BENEDICTO 500ML	agua-benedicto-500ml-loyyfz	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895647642	\N	\N
cmrc815sj00d475y6tsckhplh	PASO DE LOS TOROS LATA 269ML	paso-de-los-toros-lata-269ml-rjrgbm	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791813800750	\N	\N
cmrc815sj00d575y6wbt7cy1g	PEPSI LATA BLACK	pepsi-lata-black-hef9eu	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791813828372	\N	\N
cmrc815sj00d675y6fpqd5s6f	GATORADE NARANJA 500ML	gatorade-naranja-500ml-2i0siq	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792170042012	\N	\N
cmrc815sk00d775y65qzyc2wt	PASO DE LOS TOROS 1.5L	paso-de-los-toros-1-5l-7cthyu	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791813421382	\N	\N
cmrc815sk00d875y6rwlw5fwf	CHEETOS 85G	cheetos-85g-pc07th	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985809	\N	\N
cmrc815sk00d975y6l1cy21at	LAYS 77G KEYCHUP	lays-77g-keychup-jy78mi	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985502	\N	\N
cmrc815sk00da75y60aik1mkh	DORITOS 40G	doritos-40g-2rc58j	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985267	\N	\N
cmrc815sk00db75y602mt4i8e	DOS ANCLAS CHEDDAR 350G	dos-anclas-cheddar-350g-zxu3b9	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792900990750	\N	\N
cmrc815sk00dc75y6tp48qn7w	MENOYO VINAGRE DE ALCOHOL	menoyo-vinagre-de-alcohol-fzgh33	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790130000034	\N	\N
cmrc815sk00dd75y6jkikjg2s	HEINZ KETCHUP	heinz-ketchup-3gn1i9	\N	cmqz5vswb006uxhd8c5bcq86n	11760	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	735051016372	\N	\N
cmrc815sk00de75y6xxe9mg8o	KNORR SALSA POMODORO	knorr-salsa-pomodoro-t4ng68	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794000008045	\N	\N
cmrc815sk00df75y63vb6nlk5	DOS ANCLAS ALI OLI	dos-anclas-ali-oli-g2p6tx	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792900990774	\N	\N
cmrc815sk00dg75y61d9bl8qe	TAU GUACAMOLE	tau-guacamole-o0zrlq	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798146139434	\N	\N
cmrc815sk00dh75y6on5zkrf5	TAU CHIMICHURRI	tau-chimichurri-263txt	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798146138994	\N	\N
cmrc815sk00di75y60jtdk48b	HELLMANNS KETCHUP 60G	hellmanns-ketchup-60g-qqev0a	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794000006195	\N	\N
cmrc815sk00dj75y67yo8rmsq	SAVORA MOSTAZA 60G	savora-mostaza-60g-hyrwkk	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794000006515	\N	\N
cmrc815sk00dk75y6vth2519q	HELLMANNS MAYONESA 118G	hellmanns-mayonesa-118g-9uvrg4	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794000007079	\N	\N
cmrc815sk00dl75y6qtiqfye8	MANTECOL 111G	mantecol-111g-sk9ifk	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201812652	\N	\N
cmrc815sk00dm75y6e24l6mnx	BENEDICTINO AGUA 1.5L	benedictino-agua-1-5l-ipp15z	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895647659	\N	\N
cmrc815sk00dn75y60s3hxuxm	AQUARIUS 2.25L MANZANA	aquarius-2-25l-manzana-hyrvg3	\N	cmqz5vswb006uxhd8c5bcq86n	6608	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895003301	\N	\N
cmrc815sk00do75y6sqvh4554	PEGAMENTO UNIPOX 25ml	pegamento-unipox-25ml-ukbw7m	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790400018585	\N	\N
cmrc815sk00dp75y6eyrc6n5o	CREMA DENTAL COLGATE SENSITIVE 60g	crema-dental-colgate-sensitive-60g-hhkemk	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7509546653396	\N	\N
cmrc815sk00dq75y60ldduhrk	VELAS LUJAN X 4Unidades	velas-lujan-x-4unidades-mwl54m	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794955000026	\N	\N
cmrc815sk00dr75y6c34wyftx	VELAS LUJAN X 4 Unidades	velas-lujan-x-4-unidades-w18h5x	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794955000033	\N	\N
cmrc815sk00ds75y6dngy1zcq	PAÑUELOS ELEGANTE	panuelos-elegante-j6isb9	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793344028924	\N	\N
cmrc815sk00dt75y6wedle75x	KIT PORTABLE COLGATE	kit-portable-colgate-n4t9b3	\N	cmqz5vswb006uxhd8c5bcq86n	10304	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7509546703640	\N	\N
cmrc815sk00du75y6nyny70sk	CEPILLO DENTAL CARBÓN	cepillo-dental-carbon-v5f1lh	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7509546694979	\N	\N
cmrc815sk00dv75y62bug3ugl	GALLETA MERENGADAS	galleta-merengadas-ncex8c	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040139657	\N	\N
cmrc815sk00dw75y6srrlvhg0	PAPEL HIGIÉNICO NOBLE  X 4 ROLLOS	papel-higienico-noble-x-4-rollos-pdldse	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790250092438	\N	\N
cmrc815sk00dx75y66iy9ngpf	PAPEL HIGIÉNICO CAMPANITA  X 4 ROLLOS	papel-higienico-campanita-x-4-rollos-pqc06c	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791070000696	\N	\N
cmrc815sl00dy75y66llpqksj	BUDIN SMAMS MARMOLADO	budin-smams-marmolado-j6rnto	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798181510113	\N	\N
cmrc815sl00dz75y6ldkfly05	DULCE DE LECHE TONADITA 400g	dulce-de-leche-tonadita-400g-s40rw8	\N	cmqz5vswb006uxhd8c5bcq86n	4816	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798060853324	\N	\N
cmrc815sl00e075y6kxavql85	CACAO EXQUISITA 150g	cacao-exquisita-150g-mjroru	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070433015	\N	\N
cmrc815sl00e175y6vbopz0ot	LECHE ENTERA DESCREMADA TREGAR 1.L	leche-entera-descremada-tregar-1-l-k9rbwi	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793913012996	\N	\N
cmrc815sm00e275y6km1x7mdx	LECHE ENTERA SERENISIMA 1.L	leche-entera-serenisima-1-l-0nanw6	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790742363008	\N	\N
cmrc815sm00e375y60y8h648u	LECHE ENTERA TREGAR 1.L	leche-entera-tregar-1-l-v1bh9t	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793913001822	\N	\N
cmrc815sm00e475y6yw3kf62m	MATE EN SAQUITOS X 25 PLAYADITO	mate-en-saquitos-x-25-playadito-j12gnp	\N	cmqz5vswb006uxhd8c5bcq86n	2688	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793704000744	\N	\N
cmrc815sm00e575y6vbks8aho	TÉ EN SAQUITOS GREEN HIILS x25	te-en-saquitos-green-hiils-x25-8gqibm	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790480008254	\N	\N
cmrc815sm00e675y6ogawf48h	EDULCORANTE LEDESMA 200ml	edulcorante-ledesma-200ml-1v1hc6	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7799086000259	\N	\N
cmrc815sm00e775y698xg6u5r	BUDIN SMAMS VAINILLA	budin-smams-vainilla-ji7izh	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798181510106	\N	\N
cmrc815sm00e875y6yufhr9rd	DR LEMON POMELO  1L	dr-lemon-pomelo-1l-b3jj6h	\N	cmqz5vswb006uxhd8c5bcq86n	5264	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790950134896	\N	\N
cmrc815sm00e975y6t84cmwkh	DR LEMON LATA VODKA	dr-lemon-lata-vodka-lrg4nu	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790950202823	\N	\N
cmrc815sm00ea75y6ra5i6mr6	DR LEMON LATA LIMON	dr-lemon-lata-limon-k3qt6t	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790950202816	\N	\N
cmrc815sm00eb75y6fm2cc85i	BRAHMA LATA	brahma-lata-yr73hk	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798005888	\N	\N
cmrc815sm00ec75y6kf4hlbpp	SMIRNOFF ORIGINAL LATA	smirnoff-original-lata-tjbsmp	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791250003110	\N	\N
cmrc815sm00ed75y6aroyx9hj	SMIRNOFF RED BERRIES LATA	smirnoff-red-berries-lata-6aanzo	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791250003189	\N	\N
cmrc815sm00ee75y6ngi0a76w	1890 LATA	1890-lata-qd511e	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798013951	\N	\N
cmrc815sm00ef75y6y4f6en6p	STELLA ARTOIS LITRO	stella-artois-litro-c9tze1	\N	cmqz5vswb006uxhd8c5bcq86n	9184	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798010561	\N	\N
cmrc815sm00eg75y6pwgbncme	LULE MUU BARRITA DE ARROZ - YOGURT FRUTILLA	lule-muu-barrita-de-arroz-yogurt-frutilla-ytixja	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77919328	\N	\N
cmrc815sm00eh75y6df3snknu	LULE MUU BARRITA DE ARROZ - LIMON	lule-muu-barrita-de-arroz-limon-q5rotx	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77965677	\N	\N
cmrc815sm00ei75y6l9xbgdxg	ACEITE NATURA 900ml	aceite-natura-900ml-ucccfg	\N	cmqz5vswb006uxhd8c5bcq86n	7168	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790272001005	\N	\N
cmrc815sm00ej75y6pmzuayy5	MERMELADA LA CAMPAGNOLA 454g	mermelada-la-campagnola-454g-wuzhwo	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793360131431	\N	\N
cmrc815sm00ek75y6cxge9jqg	PICADILLO SWIFT	picadillo-swift-kz72fb	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790360720115	\N	\N
cmrc815sm00el75y6csdebn1w	PICADILLO BULNEZ PATÉ DE FOIE	picadillo-bulnez-pate-de-foie-bkx020	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791720045985	\N	\N
cmrc815sm00em75y6brh4o8ei	BON O BON BLANCO	bon-o-bon-blanco-miukx7	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77961815	\N	\N
cmrc815sm00en75y6kgmgw2e8	BON O BON AGUILA	bon-o-bon-aguila-3id1hn	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	17	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77953537	\N	\N
cmrc815sm00eo75y6qed23exb	BON O BON CHOCOLINAS	bon-o-bon-chocolinas-n2g1ia	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77956712	\N	\N
cmrc815sm00ep75y6jao9bojw	QUILMES LATON PACK	quilmes-laton-pack-vb2ljt	\N	cmqz5vswb006uxhd8c5bcq86n	23520	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798014842	\N	\N
cmrc815sm00eq75y69mtln24r	BUDWEISER PACK LATA	budweiser-pack-lata-p8lf2r	\N	cmqz5vswb006uxhd8c5bcq86n	20160	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793147118846	\N	\N
cmrc815sm00er75y621qsc2z4	BRAHMA PACK LATON	brahma-pack-laton-8jeum7	\N	cmqz5vswb006uxhd8c5bcq86n	24080	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798015078	\N	\N
cmrc815sm00es75y68qowxsk7	PROMO 1890 PACK	promo-1890-pack-yaz1oy	\N	cmqz5vswb006uxhd8c5bcq86n	11760	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	101	\N	\N
cmrc815sm00et75y6mcfu6huh	HIELO	hielo-l5yefx	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	102	\N	\N
cmrc815sm00eu75y6eejqggis	ANTOJITOS SPICE GUACAMOLE 70G	antojitos-spice-guacamole-70g-i00xtf	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798184720700	\N	\N
cmrc815sm00ev75y6m924v3n0	ANTOJITOS FAKIN HOT 70G	antojitos-fakin-hot-70g-68pgi8	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798184720601	\N	\N
cmrc815sm00ew75y6fze6rex3	ANTOJITOS NACHO ORIGINAL	antojitos-nacho-original-8kkdzb	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798184720489	\N	\N
cmrc815sm00ex75y6mrtki6z2	PRITTY 1L	pritty-1l-24c140	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	21	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791913004089	\N	\N
cmrc815sm00ey75y6fk1s2a3z	PRITTY 3L	pritty-3l-u2wvi6	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791913001040	\N	\N
cmrc815sm00ez75y6dpr0cpgy	ALOHA HELADO LA 10	aloha-helado-la-10-dmwyqb	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043065386	\N	\N
cmrc815sn00f075y6jjmkxd7r	ALOHA HELADO DULCE DE LECHE	aloha-helado-dulce-de-leche-rwjd1v	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043062071	\N	\N
cmrc815sn00f175y6j39asu8x	COLGATE HILO DENTAL	colgate-hilo-dental-8uik3o	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	103	\N	\N
cmrc815sn00f275y6lpbgk5e7	SWIFT BURGER 276 G	swift-burger-276-g-ds94b3	\N	cmqz5vswb006uxhd8c5bcq86n	7616	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790360966841	\N	\N
cmrc815sn00f375y6c9414kyu	LA BLANCA SALCHICA 190G	la-blanca-salchica-190g-dn8ypy	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790360026002	\N	\N
cmrc815sn00f475y60lr2r73t	TERRABUSI ANILLOS 170G	terrabusi-anillos-170g-y95h4d	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201808884	\N	\N
cmrc815sn00f575y6ncdfjcve	GAONA BIZCOCHITOS 180G	gaona-bizcochitos-180g-wj4wkp	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798126073062	\N	\N
cmrc815sn00f675y6swqhb1wx	SANCOR MANTECA 100G	sancor-manteca-100g-52yg2k	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790080010862	\N	\N
cmrc815sn00f775y6cvfk36pz	CADBURY FRUTILLA 29G	cadbury-frutilla-29g-5vlw3h	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	19	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201818654	\N	\N
cmrc815sn00f875y6rmy16vuh	VIENISSIMA SALCHICA 230G	vienissima-salchica-230g-bfhhr3	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790670052401	\N	\N
cmrc815sn00f975y63n53ik0r	GALLETITAS DULCES SURTIDAS BULNEZ 300g	galletitas-dulces-surtidas-bulnez-300g-gykype	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791720039731	\N	\N
cmrc815sn00fa75y6jy8sadbb	TWISTOS MINI TOSTADITAS 95g	twistos-mini-tostaditas-95g-mtjrl9	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310983256	\N	\N
cmrc815sn00fb75y6dg33uy82	PEPSI BLACK 500ml	pepsi-black-500ml-81cgbm	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791813828365	\N	\N
cmrc815sn00fc75y6pthpkric	KOLYNOS SUPER BLANCO	kolynos-super-blanco-pwys65	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7509546686486	\N	\N
cmrc815sn00fd75y6butwm2kh	KOLYNOS MASTER PLUS CEPILLO	kolynos-master-plus-cepillo-8wpqjo	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7753442000390	\N	\N
cmrc815sn00fe75y6k7sha6dc	ODOL DOBLE ACCION	odol-doble-accion-xc994r	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7509546687285	\N	\N
cmrc815sn00ff75y61hkvnfrt	CORTA UÑAS	corta-unas-pvregq	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	71603005198	\N	\N
cmrc815sn00fg75y6yud25b59	RAMEN POLLO PICANTE	ramen-pollo-picante-5wzjff	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580150341	\N	\N
cmrc815sn00fh75y6630hn0hd	RAMEN CARNE	ramen-carne-w3fmf8	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580149970	\N	\N
cmrc815sn00fi75y6mxpt81ie	RAMEN POLLO PICANTE	ramen-pollo-picante-imi1y6	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580149963	\N	\N
cmrc815sn00fj75y6t16p0zyo	KIT KAT WHITE	kit-kat-white-d2cx6m	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7891000379028	\N	\N
cmrc815so00fk75y68ltcx6sf	ALFAJOR BEAGLEY NEGRO	alfajor-beagley-negro-i4rx8z	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040375000	\N	\N
cmrc815so00fl75y6ohei7fmu	ARCOR PEPAS 183G	arcor-pepas-183g-xw3m39	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040135895	\N	\N
cmrc815so00fm75y67nggfzxk	COFLE CHOCO COOKIES	cofle-choco-cookies-954bis	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040143739	\N	\N
cmrc815so00fn75y68n30uyxz	SALADIX 72 GRAMOS	saladix-72-gramos-3y9sap	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040153158	\N	\N
cmrc815so00fo75y6rvva4p36	SALADIX CROSS 135 G	saladix-cross-135-g-huy9g3	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040129641	\N	\N
cmrc815so00fp75y6q5xuqb7j	SALADIX CROSS 67G	saladix-cross-67g-7eygvy	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040124905	\N	\N
cmrc815so00fq75y67ry29rsn	SALADIX PICANTE CROS 67G	saladix-picante-cros-67g-vwvqvv	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040141285	\N	\N
cmrc815so00fr75y6hnd9uusa	ALFAJOR TOFI BLANCO TRIPLE	alfajor-tofi-blanco-triple-511z1m	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040953703	\N	\N
cmrc815so00fs75y6jdq7a1np	ALFAJOR BON O BON BLANCO	alfajor-bon-o-bon-blanco-iaw6z6	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040613607	\N	\N
cmrc815so00ft75y6o8n8d6be	LATA COCA ZERO	lata-coca-zero-4pd39i	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895067587	\N	\N
cmrc815so00fu75y60dcpcukj	ALFAJOR BON O BON TRIPLE	alfajor-bon-o-bon-triple-o78nq8	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040148840	\N	\N
cmrc815so00fv75y6cqvk3e8s	GRAFFITI CHOCO	graffiti-choco-pl9j2z	\N	cmqz5vswb006uxhd8c5bcq86n	3248	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580111755	\N	\N
cmrc815so00fw75y6fv09oel9	GRAFITTI BLANCO	grafitti-blanco-2bnmhn	\N	cmqz5vswb006uxhd8c5bcq86n	3248	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580123741	\N	\N
cmrc815sp00fx75y6k7ykj8xl	ALFAJOR FANTOCHE TRIPLE DAY	alfajor-fantoche-triple-day-hxsbqh	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672000339	\N	\N
cmrc815sp00fy75y63mqibk9h	COFLER AVELLANEAS 140G	cofler-avellaneas-140g-p4qrnu	\N	cmqz5vswb006uxhd8c5bcq86n	10080	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580144005	\N	\N
cmrc815sq00fz75y6yy11t7hd	COFLER CUPS PEANUT BUTTER	cofler-cups-peanut-butter-g3io1q	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77989772	\N	\N
cmrc815sq00g075y66ar88e63	COFLER CUPS ORIGINAL	cofler-cups-original-zumllg	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77990754	\N	\N
cmrc815sq00g175y66h2dupy8	ALFAJOR TATIN TRIPLE NEGRO	alfajor-tatin-triple-negro-xn63a0	\N	cmqz5vswb006uxhd8c5bcq86n	1176	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040405608	\N	\N
cmrc815sq00g275y65ykt2i9t	ALFAJOR TATIN SIMPLE	alfajor-tatin-simple-x0kek3	\N	cmqz5vswb006uxhd8c5bcq86n	728	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040331303	\N	\N
cmrc815sq00g375y6d5dybfr5	COFLER CHOCOLINA BARRA 40G	cofler-chocolina-barra-40g-8tg2o0	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580131531	\N	\N
cmrc815sq00g475y6thbswdsk	ARCOR MILK 25%LECHE	arcor-milk-25-leche-hto9hi	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580144227	\N	\N
cmrc815sq00g575y6r70jukjx	ARCOR TWIT 25 G	arcor-twit-25-g-0n8e0i	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580132712	\N	\N
cmrc815sq00g675y6lfsb7y4n	ALFAJOR TRIPLE NIGHT	alfajor-triple-night-vlp0pz	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672000247	\N	\N
cmrc815sq00g775y63ygj6ikr	DON SATUR BIZCOCHO SALADO 200g	don-satur-bizcocho-salado-200g-ukskib	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	15	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7795735000328	\N	\N
cmrc815sq00g875y6zbnvv25q	COFLER BLOCK MANI	cofler-block-mani-9hd09u	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580143800	\N	\N
cmrc815sq00g975y67ufbrjt0	CORTAUÑAS NAIL CARE	cortaunas-nail-care-xqhzcz	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7160300519	\N	\N
cmrc815sq00ga75y6ki02bzrm	ALFAJOR SIMPLE FANTOCHE DAY	alfajor-simple-fantoche-day-iglaae	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672002074	\N	\N
cmrc815sq00gb75y62t8rtf65	ALFAJOR SIMPLE FANTOCHE NIGHT	alfajor-simple-fantoche-night-z3fkif	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672002067	\N	\N
cmrc815sq00gc75y6uqcbqmlg	KIT KAT  DARK	kit-kat-dark-m3ya1p	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7891000379073	\N	\N
cmrc815sq00gd75y6igb7fqgz	SERNOVA VODKA 700ml CARIBBEAN BLEND	sernova-vodka-700ml-caribbean-blend-wf4fpv	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790290101718	\N	\N
cmrc815sq00ge75y6q6lr7mpi	SMIRNOFF VODKA 700ml	smirnoff-vodka-700ml-6z4kxr	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791250003103	\N	\N
cmrc815sq00gf75y64d7vdgjh	JABÓN LIQUIDO SKIP 800ml	jabon-liquido-skip-800ml-wy6uja	\N	cmqz5vswb006uxhd8c5bcq86n	5936	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791290792814	\N	\N
cmrc815sq00gg75y60wi9t48p	LIMPIADOR LIQUIDO PROCENEX BAÑO 420ml	limpiador-liquido-procenex-bano-420ml-4ewsmz	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791130002776	\N	\N
cmrc815sq00gh75y6zjpc3q20	LIMPIADOR LIQUIDO PROCENEX VIDRIOS 420ml	limpiador-liquido-procenex-vidrios-420ml-ue9y64	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791130002844	\N	\N
cmrc815sq00gi75y6zz5sj3yw	LIMPIADOR LIQUIDO PISO 900ml	limpiador-liquido-piso-900ml-we88c2	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791130683524	\N	\N
cmrc815sr00gj75y6vvku1tpj	LAVANDINA QUERUBÍN 1 LITRO	lavandina-querubin-1-litro-g5cjmt	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791905003663	\N	\N
cmrc815sr00gk75y6nnnha3jk	LAVANDINA ODEX 1 LITRO	lavandina-odex-1-litro-9979tf	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791905023203	\N	\N
cmrc815sr00gl75y6pqbepgxf	PAÑO MULTIUSO TWIST	pano-multiuso-twist-6zcv7u	\N	cmqz5vswb006uxhd8c5bcq86n	5320	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794440005109	\N	\N
cmrc815sx00gm75y6tcr52bw6	TRAPO DE PISO COSTERO COLOR	trapo-de-piso-costero-color-l51z19	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791053001207	\N	\N
cmrc815sx00gn75y6u3vnydmb	AQUARIUS 1.5L PERA	aquarius-1-5l-pera-gyahgd	\N	cmqz5vswb006uxhd8c5bcq86n	5488	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895640476	\N	\N
cmrc815sx00go75y6osvgegmg	SORRENTINOS JAMON Y MUZZA 300G	sorrentinos-jamon-y-muzza-300g-w1dcm9	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790236001768	\N	\N
cmrc815sx00gp75y6ixnnaeuu	ÑOQUIS 450G	noquis-450g-fwe5xn	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070612106	\N	\N
cmrc815sx00gq75y63j48nd2k	TAPAS EMPANADAS PARA FREIR 12U SALTEÑA	tapas-empanadas-para-freir-12u-saltena-iim910	\N	cmqz5vswb006uxhd8c5bcq86n	2710.4	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070621955	\N	\N
cmrc815sy00gr75y6lbfvcjcp	TAPAS EMPANADAS CRIOLLAS 12U SALTEÑA	tapas-empanadas-criollas-12u-saltena-6ahoub	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070622020	\N	\N
cmrc815sy00gs75y6tmqdqhvh	RAVIOLES ESPINACA Y QUESO 450G	ravioles-espinaca-y-queso-450g-da1fjw	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070621894	\N	\N
cmrc815sy00gt75y6u7aj8t1v	ALFAJOR MILKA DULCE DE LECHE TRIPLE	alfajor-milka-dulce-de-leche-triple-h2oewg	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77903778	\N	\N
cmrc815sy00gu75y6b3mmxonf	AQUARIUS 1,5L POMELO	aquarius-1-5l-pomelo-pk4z3u	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895640490	\N	\N
cmrc815sy00gv75y6zkjl5dqy	CHOCOLATE MILKA AIREADO ALMENDRAS 50G	chocolate-milka-aireado-almendras-50g-aegfuw	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201818975	\N	\N
cmrc815sy00gw75y6v7v9gocm	CHOCOLATE MILKA LECHE 55G	chocolate-milka-leche-55g-grxt3q	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622202328947	\N	\N
cmrc815sy00gx75y6qwcg8a24	CHOCOLATE MILKA BLANCO 55G	chocolate-milka-blanco-55g-4we7v3	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622210745583	\N	\N
cmrc815sy00gy75y6osld0ipf	CHOCOLATE MILKA CON DDL 67G	chocolate-milka-con-ddl-67g-cdqlrc	\N	cmqz5vswb006uxhd8c5bcq86n	6272	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622300844967	\N	\N
cmrc815sy00gz75y6avnr9owl	CHOCOLATE MILKA BLANCO CON DDL 67G	chocolate-milka-blanco-con-ddl-67g-zzt3f9	\N	cmqz5vswb006uxhd8c5bcq86n	6272	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622300844943	\N	\N
cmrc815sy00h075y67fxth66p	CHOCOLATE MILKA CON ALMENDRAS 55G	chocolate-milka-con-almendras-55g-qr27r5	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622210745620	\N	\N
cmrc815sy00h175y6lmfouvnk	CADBURY FRUTILLA 82G	cadbury-frutilla-82g-k7nads	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201818715	\N	\N
cmrc815sy00h275y65iucr9hf	HALLS CHERRY SIN AZUCAR	halls-cherry-sin-azucar-03sl6n	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622202288227	\N	\N
cmrc815sy00h375y6xc20mgha	AQUARIUS 1.5L NARANJA	aquarius-1-5l-naranja-960ska	\N	cmqz5vswb006uxhd8c5bcq86n	5488	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895641237	\N	\N
cmrc815sy00h475y63v1nt2o0	LUCKY STRIKE ORG. CONV	lucky-strike-org-conv-uanaci	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77990938	\N	\N
cmrc815sy00h575y6q0v7dk0c	LUCKY STRIKE RED	lucky-strike-red-cnxn7m	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77990921	\N	\N
cmrc815sy00h675y6esvynvai	RED POINT ON	red-point-on-memlhg	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77959751	\N	\N
cmrc815sy00h775y6wasoddba	COCTEL AMERICAN CLUB FRUTILLA 750ml	coctel-american-club-frutilla-750ml-35933x	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260006043	\N	\N
cmrc815sy00h875y6ssd7kjde	BURNETT¬¥S LONDON DRY GIN 1000ml	burnett-s-london-dry-gin-1000ml-vsajj1	\N	cmqz5vswb006uxhd8c5bcq86n	10752	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260011122	\N	\N
cmrc815sy00h975y6pdoohh50	MARTINI ROSSO 995ml	martini-rosso-995ml-c2acqi	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790950112894	\N	\N
cmrc815sy00ha75y6v3sdftkg	LICOR TRES PLUMAS CAFÉ A LA GRAPPA 750ml	licor-tres-plumas-cafe-a-la-grappa-750ml-bnuwap	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260002281	\N	\N
cmrc815sy00hb75y649nn2arg	PROMO FERNET	promo-fernet-115sip	\N	cmqz5vswb006uxhd8c5bcq86n	22400	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90201	\N	\N
cmrc815sy00hc75y6ccfwcs6p	PROMO VINO TORO (VIDRIO)+PRITTY 2.5	promo-vino-toro-vidrio-pritty-2-5-0mm1pt	\N	cmqz5vswb006uxhd8c5bcq86n	11760	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90202	\N	\N
cmrc815sy00hd75y673tm3fxe	PROMO VINO TORO (TETRA) + PRITTY 2.5	promo-vino-toro-tetra-pritty-2-5-w49qxn	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90203	\N	\N
cmrc815sy00he75y68to54334	PROMO PACK BUDWEISER	promo-pack-budweiser-iqr5dw	\N	cmqz5vswb006uxhd8c5bcq86n	20160	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90205	\N	\N
cmrc815sy00hf75y6g1ku8u0r	PROMO 2 BEAGLE 1 LITRO	promo-2-beagle-1-litro-516jag	\N	cmqz5vswb006uxhd8c5bcq86n	14560	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90206	\N	\N
cmrc815sy00hg75y6l7lvzon3	PROMO MONSTER 2 X $$	promo-monster-2-x-3glrhi	\N	cmqz5vswb006uxhd8c5bcq86n	8512	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90207	\N	\N
cmrc815sy00hh75y6g7a9gl20	PROMO BRAHMA 1.L 2X$$	promo-brahma-1-l-2x-smkflj	\N	cmqz5vswb006uxhd8c5bcq86n	11760	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90208	\N	\N
cmrc815sz00hi75y68jukgwpf	PROMO LATA HEINEKEN (2 LATAS)	promo-lata-heineken-2-latas-nkuk9z	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90209	\N	\N
cmrc815sz00hj75y63356ly8a	PROMO CERVEZA PATAGONIA 730.	promo-cerveza-patagonia-730-2j7wfp	\N	cmqz5vswb006uxhd8c5bcq86n	15120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90210	\N	\N
cmrc815sz00hk75y6sbyvgqgr	PIPAS GIRASOL GIGANTES 50g	pipas-girasol-gigantes-50g-22ugy9	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798044150555	\N	\N
cmrc815sz00hl75y6nn4ft96y	COCA COLA 2,25L	coca-cola-2-25l-0tbiod	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895000997	\N	\N
cmrc815sz00hm75y6g0ijdq72	COCA LATA 220ML CAFE	coca-lata-220ml-cafe-oevp7q	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895646355	\N	\N
cmrc815sz00hn75y6bwzwud1k	COCA COLA 1L ZERO	coca-cola-1l-zero-zu3bty	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	18	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895067631	\N	\N
cmrc815sz00ho75y6mz7ezllt	COCA COLA 1.5L  SABOR LIVIANO	coca-cola-1-5l-sabor-liviano-40lo8b	\N	cmqz5vswb006uxhd8c5bcq86n	5824	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895001451	\N	\N
cmrc815sz00hp75y6kb4q9zxt	COCA COLA 2.25L SABOR LIVIANO	coca-cola-2-25l-sabor-liviano-llbv53	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895005312	\N	\N
cmrc815sz00hq75y6la3maoqn	JABON DE TOCADOR ST. TROPEZ	jabon-de-tocador-st-tropez-ul2vcn	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794218106991	\N	\N
cmrc815sz00hr75y6tm1u1ufg	QUESO RALLADO	queso-rallado-azr8as	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790742222909	\N	\N
cmrc815sz00hs75y69mav6p17	MIRINDA POMELO 2,25L	mirinda-pomelo-2-25l-xa79qq	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791813423966	\N	\N
cmrc815sz00ht75y6j7s0ntir	CORONA CERO 330ML	corona-cero-330ml-gma134	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798014873	\N	\N
cmrc815sz00hu75y66c04oqvg	STELLA  SIN ALCOHOL 330M	stella-sin-alcohol-330m-8c1fwi	\N	cmqz5vswb006uxhd8c5bcq86n	4088	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798013470	\N	\N
cmrc815sz00hv75y6mtzu2rji	LAYS CLASICAS 134G	lays-clasicas-134g-kjgyoi	\N	cmqz5vswb006uxhd8c5bcq86n	6272	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985465	\N	\N
cmrc815sz00hw75y6hp3a4fax	CHEETOS ONDULADOS 80G	cheetos-ondulados-80g-q0a301	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310988114	\N	\N
cmrc815sz00hx75y60rtxrxto	DORITOS QUESO 77G	doritos-queso-77g-e4iwzj	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985649	\N	\N
cmrc815sz00hy75y6f85hdqnj	LAYS JAMON SERRANO 77G	lays-jamon-serrano-77g-dxfrik	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985434	\N	\N
cmrc815sz00hz75y6vaqe0p30	LAYS 122G JAMON SERRANO	lays-122g-jamon-serrano-yhzw1u	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985618	\N	\N
cmrc815sz00i075y6kuy1hs18	LAYS QUESO Y CEBOLLA 77G	lays-queso-y-cebolla-77g-szu5vj	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985557	\N	\N
cmrc815sz00i175y63x1mkof0	3D ORIGINAL QUESO 85G	3d-original-queso-85g-oiiz4q	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310985830	\N	\N
cmrc815sz00i275y6qn2tkwix	LAYS 20G	lays-20g-eaq06s	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790310983614	\N	\N
cmrc815sz00i375y6adzkkyer	CARBON	carbon-llijzb	\N	cmqz5vswb006uxhd8c5bcq86n	9520	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	104	\N	\N
cmrc815sz00i475y6mkzagwk6	CEPITA 1.5L DURAZNO	cepita-1-5l-durazno-uimjq0	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895641534	\N	\N
cmrc815sz00i575y6ya2qbckv	MOGUL EXTREME TUBITOS 15g	mogul-extreme-tubitos-15g-jlbec9	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580146375	\N	\N
cmrc815sz00i675y6z4gcagv9	ALFAJOR TERRABUSI CLASICO 70GR. DULCE DE LECHE	alfajor-terrabusi-clasico-70gr-dulce-de-leche-8v9e5o	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77903792	\N	\N
cmrc815sz00i775y61ks0vful	FLYNN PAFF (LAS DOS VERSIONES)	flynn-paff-las-dos-versiones-bqdql5	\N	cmqz5vswb006uxhd8c5bcq86n	224	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77989499	\N	\N
cmrc815sz00i875y651v3cvob	VINO ELEMENTOS MALBEC	vino-elementos-malbec-go5b9u	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790189021028	\N	\N
cmrc815sz00i975y6i5etvtn8	MOGUL EXTREMO 80	mogul-extremo-80-ta89sf	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580151690	\N	\N
cmrc815sz00ia75y6vtjt8t2a	LATA SCHWEPPES 310	lata-schweppes-310-kvgc27	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895003202	\N	\N
cmrc815sz00ib75y6jqp4gz81	CADBURY YOGHURT FRUTILLA	cadbury-yoghurt-frutilla-vsbr83	\N	cmqz5vswb006uxhd8c5bcq86n	15680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201818692	\N	\N
cmrc815sz00ic75y6cvnk0hpu	FEL FORT MENTITAS	fel-fort-mentitas-3m6vzp	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	105	\N	\N
cmrc815t300id75y691wtrvh5	BELDENT INFINIT X14	beldent-infinit-x14-q2evra	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201457457	\N	\N
cmrc815t300ie75y6vcnntk0i	MONSTER ENERGY ZERO	monster-energy-zero-2rarad	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798422620090	\N	\N
cmrc815t300if75y6300b3te0	BANANITA DOLCA 14	bananita-dolca-14-lsxd6s	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77988256	\N	\N
cmrc815t300ig75y6irqz7arw	FILTROS ORPIN SLIM 150U	filtros-orpin-slim-150u-1qqehw	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798311170293	\N	\N
cmrc815t300ih75y64qi0hvcq	CELULOSA ORPIN 50U	celulosa-orpin-50u-p0421k	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798311170583	\N	\N
cmrc815t300ii75y6yoey13y4	POZO MAGADALENAS CON DULCE DE LECHE	pozo-magadalenas-con-dulce-de-leche-2928mk	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077000746	\N	\N
cmrc815t300ij75y646qh1dc1	POZO MAGADALENAS CON CHIPS	pozo-magadalenas-con-chips-2istnv	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077000722	\N	\N
cmrc815t300ik75y6q32jn3kt	POZO MAGADALENAS CHOCO RELLENAS DULCE DE LECHE	pozo-magadalenas-choco-rellenas-dulce-de-leche-kztmiv	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077000098	\N	\N
cmrc815t300il75y6hlzppc9s	POZO MAGDALENAS RELLENAS CHOCOLATE	pozo-magdalenas-rellenas-chocolate-7yf10e	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077000753	\N	\N
cmrc815t300im75y6yfo27clj	POZO MAGDALANEAS COCO RELLENAS DULCE DE LECHE	pozo-magdalaneas-coco-rellenas-dulce-de-leche-sle0d8	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077001033	\N	\N
cmrc815t300in75y6c77gjh50	POZO MAGDALENAS CLASICAS	pozo-magdalenas-clasicas-87h6ny	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077000364	\N	\N
cmrc815t300io75y6ho1bpx98	POZO MAGDALENAS MARMOLADAS	pozo-magdalenas-marmoladas-spmuc9	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790077000739	\N	\N
cmrc815t300ip75y699ujcwz0	TULIPAN ULTRA RESISTENTE	tulipan-ultra-resistente-bthpa3	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014001161	\N	\N
cmrc815t300iq75y6j5l6m21b	TULIPAN TATTOO	tulipan-tattoo-xm8qqm	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014122088	\N	\N
cmrc815t300ir75y65zsgw49k	TULIPAN DOBLE PLACER	tulipan-doble-placer-lmlcpv	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014121753	\N	\N
cmrc815t300is75y62dqbahd1	TULIPAN FRUTILLA	tulipan-frutilla-lsqsva	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014001178	\N	\N
cmrc815t300it75y6vai1lnob	TULIPAN NEON	tulipan-neon-say6zj	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014001765	\N	\N
cmrc815t300iu75y62x382yvv	TULIPAN CLASICO	tulipan-clasico-o8pvvk	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014090325	\N	\N
cmrc815t300iv75y6mnac0dj2	TULIPAN TEXTURADO	tulipan-texturado-prow73	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014090332	\N	\N
cmrc815t300iw75y6kb66axsr	TULIPAN SUPERFINO	tulipan-superfino-zqcxoq	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791014001154	\N	\N
cmrc815t400ix75y6eplygdoa	SAPITO MANI	sapito-mani-2qhg88	\N	cmqz5vswb006uxhd8c5bcq86n	616	0	16	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77912718	\N	\N
cmrc815t400iy75y635dscm56	SAPITO DULCE DE LECHE	sapito-dulce-de-leche-27evuw	\N	cmqz5vswb006uxhd8c5bcq86n	616	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77928870	\N	\N
cmrc815t400iz75y68w2lh51h	HAMBURGUESA SWIFT XL 2U	hamburguesa-swift-xl-2u-3dgud0	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790360967411	\N	\N
cmrc815t400j075y61lmlgnlm	PAN LACTEADO FANGO	pan-lacteado-fango-q9adoj	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890261479	\N	\N
cmrc815t400j175y6smxjo2c6	PAN LACTEADO RODAJAS FINAS	pan-lacteado-rodajas-finas-q2s0ur	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890261509	\N	\N
cmrc815t400j275y6ijsxrv21	PAN BIMBO LACTAL	pan-bimbo-lactal-zcqteg	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890261233	\N	\N
cmrc815t400j375y6wxdv6oda	PAN PARA PANCHO LACTAL	pan-para-pancho-lactal-il4f8b	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890258790	\N	\N
cmrc815t400j475y6kw3dcc3y	PAN PARA PANCHO FANGO	pan-para-pancho-fango-e8iddd	\N	cmqz5vswb006uxhd8c5bcq86n	3976	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890258875	\N	\N
cmrc815t400j575y6dpf9ynnu	PAN PARA PANCHO BIMBO	pan-para-pancho-bimbo-7qbdla	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890259087	\N	\N
cmrc815t400j675y63atq96xz	PAN PARA HAMBURGUESAS FANGO	pan-para-hamburguesas-fango-xvetz5	\N	cmqz5vswb006uxhd8c5bcq86n	4088	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890258851	\N	\N
cmrc815t400j775y639dm2bil	PAN PARA HAMBURGUESAS LACTAL	pan-para-hamburguesas-lactal-lth3f8	\N	cmqz5vswb006uxhd8c5bcq86n	3864	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890258806	\N	\N
cmrc815t400j875y6uw23e2td	PAN PARA HAMBURGUESAS BIMBO	pan-para-hamburguesas-bimbo-ilqrkj	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890259070	\N	\N
cmrc815t400j975y63zb8x731	PAN PARA HAMBURGUESAS BRIOSH	pan-para-hamburguesas-briosh-73fp7o	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890259353	\N	\N
cmrc815t400ja75y6gzrk3f30	HARINA PUREZA 1Kg	harina-pureza-1kg-h1hw4l	\N	cmqz5vswb006uxhd8c5bcq86n	1848	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792180004512	\N	\N
cmrc815t400jb75y6k0j0wjjn	HARINA PUREZA LEUDANTE 1Kg	harina-pureza-leudante-1kg-acj8qv	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792180140708	\N	\N
cmrc815t400jc75y6fnyxmqw2	TAKIS INTENSE NACHO SIN PICANTE 140g	takis-intense-nacho-sin-picante-140g-fepzix	\N	cmqz5vswb006uxhd8c5bcq86n	5488	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7500810041741	\N	\N
cmrc815t400jd75y6z0ljm66a	TAKIS INTENSE NACHO SIN PICANTE 85g	takis-intense-nacho-sin-picante-85g-toxxwa	\N	cmqz5vswb006uxhd8c5bcq86n	3416	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7500810041734	\N	\N
cmrc815t400je75y6zs0rfnxi	TAKIS ORIGINAL 140g	takis-original-140g-vvi2eo	\N	cmqz5vswb006uxhd8c5bcq86n	5488	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7500810034354	\N	\N
cmrc815t400jf75y6eotc75dd	TAKIS FUEGO 85g	takis-fuego-85g-8xn6ke	\N	cmqz5vswb006uxhd8c5bcq86n	3416	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7500810034361	\N	\N
cmrc815t400jg75y6dicb4otn	TAKIS XPLOSION 85g	takis-xplosion-85g-s0vt4u	\N	cmqz5vswb006uxhd8c5bcq86n	3416	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7500810034460	\N	\N
cmrc815t400jh75y6th2cnu3u	TAKIS ORIGINAL85g	takis-original85g-50tagz	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7500810034477	\N	\N
cmrc815t400ji75y6bnt8183r	SNACKS GALLETAS CRUJITAS JAMÓN SERRANO 120g	snacks-galletas-crujitas-jamon-serrano-120g-mh4k0p	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792180146137	\N	\N
cmrc815t400jj75y62i4tjs2z	SNACKS GALLETAS CRUJITAS CLÁSICAS 120g	snacks-galletas-crujitas-clasicas-120g-ls9ft3	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792180146090	\N	\N
cmrc815t400jk75y6bdhiuu46	SNACKS GALLETAS CRUJITAS CEBOLLA Y CREMA 120g	snacks-galletas-crujitas-cebolla-y-crema-120g-scyxqo	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792180146120	\N	\N
cmrc815t400jl75y696k2re7o	VINO ESTANCIA MENDOZA MALBEC 750ml.	vino-estancia-mendoza-malbec-750ml-rjzlqc	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790314080159	\N	\N
cmrc815t400jm75y6t5mua834	TÉ TARAGUI x25 saquitos	te-taragui-x25-saquitos-jn33vb	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790387800135	\N	\N
cmrc815t400jn75y6fzd2b6jm	NESCAFE DOLCA 50g.	nescafe-dolca-50g-tapfm2	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	8445291081895	\N	\N
cmrc815t400jo75y6851v23c0	PAN PARA PANCHO BRIOSH	pan-para-pancho-briosh-xpndd6	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793890259322	\N	\N
cmrc815t400jp75y6nrt658hu	GALLETA TRAVIATA REX 96g	galleta-traviata-rex-96g-kxgtp5	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040143937	\N	\N
cmrc815t400jq75y6fftgb19u	VINO ESTANCIA MENDOZA CABERNET MALBEC 750ml.	vino-estancia-mendoza-cabernet-malbec-750ml-54tn8i	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790314080180	\N	\N
cmrc815t400jr75y6iafmpk80	CREMA MILKAUT 200C	crema-milkaut-200c-yg7vpt	\N	cmqz5vswb006uxhd8c5bcq86n	3416	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7794820902974	\N	\N
cmrc815t400js75y6m93kjnqh	FAJITAS LUCCHETTI X 10 UNIDADES	fajitas-lucchetti-x-10-unidades-atidoi	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790070320940	\N	\N
cmrc815t500jt75y6q7ei3dw7	MILKA OREO 100G	milka-oreo-100g-5xq8xe	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622300631574	\N	\N
cmrc815t500ju75y6nag30xdr	MILKA OREO	milka-oreo-r902w0	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622210828606	\N	\N
cmrc815t500jv75y60gp9t287	MILKA OREO  BOMBON	milka-oreo-bombon-qa0k2x	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77971630	\N	\N
cmrc815t500jw75y6zern8qoz	GANCIA LATA AMERICANO LIMA LIMON 473ML	gancia-lata-americano-lima-limon-473ml-9whyyb	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790950142921	\N	\N
cmrc815t500jx75y63f7ctc4a	YERBA ROSAMONTE	yerba-rosamonte-zpfyrq	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790411001958	\N	\N
cmrc815t500jy75y6s8i3otzd	PAÑO BULNEZ	pano-bulnez-8vu2td	\N	cmqz5vswb006uxhd8c5bcq86n	1176	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791053110695	\N	\N
cmrc815t500jz75y6npmjf8sd	VIVERE SUAVIZANTE 900ML	vivere-suavizante-900ml-llswlw	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791290796683	\N	\N
cmrc815t500k075y6683avim0	SPEED ZERO AZUCAR	speed-zero-azucar-zgu8v4	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798119220367	\N	\N
cmrc815t500k175y6mduiugex	YERBA MAÑANITA	yerba-mananita-knzkp9	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790387015324	\N	\N
cmrc815t500k275y6btxatm86	JUGO TANG MANZANA 15g	jugo-tang-manzana-15g-nq28yn	\N	cmqz5vswb006uxhd8c5bcq86n	784	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201705992	\N	\N
cmrc815t500k375y602h1olkb	JUGO TANG MULTIFRUTA 15g	jugo-tang-multifruta-15g-k333hv	\N	cmqz5vswb006uxhd8c5bcq86n	784	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201735715	\N	\N
cmrc815t500k475y6q8wapzhp	JUGO TANG NARANJA DULCE 15g	jugo-tang-naranja-dulce-15g-r2ahq9	\N	cmqz5vswb006uxhd8c5bcq86n	784	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201735340	\N	\N
cmrc815t500k575y63t4wv1jk	JUGO CLIGHT LIMONADA ARÁNDANOS 8g	jugo-clight-limonada-arandanos-8g-m9mhiq	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622202236846	\N	\N
cmrc815t500k675y6tlnr0odf	JUGO CLIGHT MANDARINA 8g	jugo-clight-mandarina-8g-pbn1jw	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201704148	\N	\N
cmrc815t500k775y6ejow7jfl	JUGO CLIGHT NARANJA MANGO 7g	jugo-clight-naranja-mango-7g-tsww3q	\N	cmqz5vswb006uxhd8c5bcq86n	560	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201702687	\N	\N
cmrc815t500k875y6j77bgpvm	JUGO RINDE DOS 13g	jugo-rinde-dos-13g-fne23v	\N	cmqz5vswb006uxhd8c5bcq86n	448	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7730908400536	\N	\N
cmrc815t500k975y6n35e6vgi	JABÓN VEGETAL CITRICO 100g	jabon-vegetal-citrico-100g-kh2q0i	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	736684289256	\N	\N
cmrc815t500ka75y6zhdp7wwl	JUGO CLIGHT MANZANA DELICIOSA 7g	jugo-clight-manzana-deliciosa-7g-brwydu	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7622201703080	\N	\N
cmrc815t500kb75y6deyswmjp	MARLBORO BLUE TITANIUM	marlboro-blue-titanium-ecfw0w	\N	cmqz5vswb006uxhd8c5bcq86n	5152	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77993403	\N	\N
cmrc815t500kc75y6x9g8ryqr	MÁQUINA PARA AFEITAR BIC COMFORT3	maquina-para-afeitar-bic-comfort3-4g2572	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	070330717534	\N	\N
cmrc815t500kd75y6dmc4pd39	PRIME EXTRA LUBRICADO	prime-extra-lubricado-rr8ik5	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791519000676	\N	\N
cmrc815ta00ke75y6p6qvaa8l	TRES PLUMAS CAFÉ AL RON	tres-plumas-cafe-al-ron-3ri3th	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260002267	\N	\N
cmrc815ta00kf75y6lyjh29om	TRES PLUMAS CAFÉ AL WHISKY	tres-plumas-cafe-al-whisky-rd2i4k	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260002090	\N	\N
cmrc815ta00kg75y6mvta2g9l	TRES PLUMAS BANANA AL DULCE DE LECHE	tres-plumas-banana-al-dulce-de-leche-b7z985	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790260013348	\N	\N
cmrc815ta00kh75y6fc60n7lr	SMIRNOFF CITRIC  RUBY ORANGE- LIME	smirnoff-citric-ruby-orange-lime-zua4bw	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791250003097	\N	\N
cmrc815ta00ki75y6j4z037zo	SHAMPOO SOBRE	shampoo-sobre-vcyoiu	\N	cmqz5vswb006uxhd8c5bcq86n	728	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	781159403774	\N	\N
cmrc815ta00kj75y6eltfb9iq	KIT DE VIAJE CARGADOR DE PARED + CABLE MICRO USB	kit-de-viaje-cargador-de-pared-cable-micro-usb-oixoxa	\N	cmqz5vswb006uxhd8c5bcq86n	20160	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7502236153282	\N	\N
cmrc815ta00kk75y6w8x686j4	AURICULARES POSS CON CONECTOR USB	auriculares-poss-con-conector-usb-27nsxx	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	3617702005348	\N	\N
cmrc815ta00kl75y6z3mmhb08	PILAS AAA MAXELL	pilas-aaa-maxell-mvcqx7	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	25215720734	\N	\N
cmrc815ta00km75y68uyfm2n3	PILAS AA MAXELL	pilas-aa-maxell-zp006m	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	25215720727	\N	\N
cmrc815ta00kn75y6jcu21gm5	SALCHI PATY VIENA X6	salchi-paty-viena-x6-3a656t	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	SALCHI PATY VIENA X6	\N	\N
cmrc815ta00ko75y6k0u3e6b3	RED BULL SUGAR FREE	red-bull-sugar-free-hv5cfb	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90415418	\N	\N
cmrc815tb00kp75y60aypbvfk	RED BULL GRANDE 355ML	red-bull-grande-355ml-nr78f6	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	90435225	\N	\N
cmrc815tb00kq75y6vouijvs0	SUPER PANCHO + LATA	super-pancho-lata-9de2w2	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	107	\N	\N
cmrc815tb00kr75y60y6n3yjw	TRI PANCHO + LATA	tri-pancho-lata-h275b1	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	108	\N	\N
cmrc815tb00ks75y6arjw6zk8	AGUA ECO 500ML	agua-eco-500ml-5tahjh	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792799000011	\N	\N
cmrc815tb00kt75y6nkvix7fl	YUMMY MORITAS	yummy-moritas-u83kes	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798186033457	\N	\N
cmrc815tb00ku75y6q0ea8u91	LATA BEAGLE CUALQUIERA	lata-beagle-cualquiera-fs9ay9	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	106	\N	\N
cmrc815tb00kv75y6s2ls0hea	FOTOCOPIA	fotocopia-0k8yiz	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	109	\N	\N
cmrc815tb00kw75y60s0p3b1w	BOCADITO MARROC	bocadito-marroc-ytuehe	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	110	\N	\N
cmrc815tb00kx75y68xwie1is	CIGARILLO SUELTO	cigarillo-suelto-u7hb10	\N	cmqz5vswb006uxhd8c5bcq86n	336	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	111	\N	\N
cmrc815tb00ky75y64vdiptfr	BOCADITO HOLANDA	bocadito-holanda-92t2kw	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	112	\N	\N
cmrc815tb00kz75y6o17aq57y	HELADO DE AGUA ENJOY	helado-de-agua-enjoy-ps5l4x	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798043062965	\N	\N
cmrc815tb00l075y661vyal70	DR LEMON LIMON 1L	dr-lemon-limon-1l-v2x26r	\N	cmqz5vswb006uxhd8c5bcq86n	5264	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790950134100	\N	\N
cmrc815tb00l175y69fna5hl7	ALFAJOR PESCADO RAÚL SIMPLE BLANCO	alfajor-pescado-raul-simple-blanco-3rnuzn	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672014947	\N	\N
cmrc815tb00l275y6lycg439c	ALFAJOR PESCADO RAÚL SIMPLE NEGRO	alfajor-pescado-raul-simple-negro-66jshp	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791672014954	\N	\N
cmrc815tb00l375y67595vni6	SALCHICHAS PATY VIENA X6	salchichas-paty-viena-x6-97lut2	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790670052364	\N	\N
cmrc815tb00l475y6m3g13cuc	Bizcochos Jorgito con grasa	bizcochos-jorgito-con-grasa-7ga98e	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790957000651	\N	\N
cmrc815tb00l575y607m2c8in	Naipes Casino TRUCO	naipes-casino-truco-kl9qil	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7797216001046	\N	\N
cmrc815tb00l675y6pvex4d9w	Naipes Poker	naipes-poker-f74r47	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7797216001145	\N	\N
cmrc815tb00l775y6bzi9vn4u	Chupeton	chupeton-zhsadl	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792860011212	\N	\N
cmrc815tb00l875y6kqjv2ad3	TOP LINE SEVEN SANDIA	top-line-seven-sandia-ln1wrr	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	16	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77948588	\N	\N
cmrc815tb00l975y6pwd50ncs	TOP LINE SEVEN ATOMIC	top-line-seven-atomic-bnc703	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77939753	\N	\N
cmrc815tb00la75y68dxuxdt5	TOP LINE SEVEN BUBBLE	top-line-seven-bubble-pzlqhm	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77983794	\N	\N
cmrc815tb00lb75y6uxa3kqm9	MOGUL ROLLO FRUTALES	mogul-rollo-frutales-ysi1u8	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580602000	\N	\N
cmrc815tb00lc75y6ilj72bgm	SALSA LISTA ARCOR	salsa-lista-arcor-2fntt8	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580133153	\N	\N
cmrc815tb00ld75y6xts0fayx	PAPAS FRITAS SALIX 80G	papas-fritas-salix-80g-sgdjsl	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790040153165	\N	\N
cmrc815tb00le75y6q8xpxrkj	SALSA LISTA LA CAMPAGNOLA	salsa-lista-la-campagnola-57jvcj	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580133160	\N	\N
cmrc815tb00lf75y65fdnspmh	PURE DE TOMATES LA CAMPAGNOLA VIDRIO	pure-de-tomates-la-campagnola-vidrio-3nj825	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580151881	\N	\N
cmrc815tb00lg75y6bdxea8lc	PATAGONIA 24.7	patagonia-24-7-ebpbhk	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798002399	\N	\N
cmrc815tb00lh75y6uav4hrcq	VINO TINTO DONDE MANDA CAPITAN	vino-tinto-donde-manda-capitan-d3g6k1	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7795232000722	\N	\N
cmrc815tb00li75y6d17krdft	STELLA ARTOIS NOIRE	stella-artois-noire-yg8mga	\N	cmqz5vswb006uxhd8c5bcq86n	5376	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798010639	\N	\N
cmrc815tb00lj75y6gulxfgdu	MICHELOB ULTRA	michelob-ultra-zcajm0	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7792798014019	\N	\N
cmrc815tb00lk75y6awxhd9bh	DULCE DE BATATA 500G	dulce-de-batata-500g-gnceko	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7793046002215	\N	\N
cmrc815tb00ll75y6k00g8lsi	EWE MANTECA DE CACAO	ewe-manteca-de-cacao-vvthab	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7797811099677	\N	\N
cmrc815tb00lm75y635tkrvy6	COCA COLA 500ML ZERO	coca-cola-500ml-zero-0r130v	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895067532	\N	\N
cmrc815tc00ln75y66w4inq0f	CEPITA PLASTICO 1L DURAZNO	cepita-plastico-1l-durazno-l5cirt	\N	cmqz5vswb006uxhd8c5bcq86n	5264	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895009846	\N	\N
cmrc815tc00lo75y6p6laq1xk	ALFAJOR ZARPADO MAIZENA	alfajor-zarpado-maizena-qnc94q	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798448080038	\N	\N
cmrc815tc00lp75y6vrwfno14	ALFAJOR ZARPADO CALAFATE	alfajor-zarpado-calafate-dc0py8	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798448080045	\N	\N
cmrc815tc00lq75y6jebw521s	ALFAJOR ZARPADO DULCE DE LECHE	alfajor-zarpado-dulce-de-leche-wrt6kk	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798448080014	\N	\N
cmrc815tc00lr75y6dnnbdmsm	ALFAJOR ZARPADO DULCE DE LECHE Y CALAFATE	alfajor-zarpado-dulce-de-leche-y-calafate-xn6y3r	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798448080021	\N	\N
cmrc815tc00ls75y6zwjctum9	JABÓN VEGETAL JAZMÍN	jabon-vegetal-jazmin-n2qm8p	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	736684289232	\N	\N
cmrc815tc00lt75y6wsh8nwfo	APEROL 750ML	aperol-750ml-ugnzqr	\N	cmqz5vswb006uxhd8c5bcq86n	14560	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7891136057029	\N	\N
cmrc815tc00lu75y6347baaxn	SANTA JULIA CHENIN DULCE	santa-julia-chenin-dulce-gzwin1	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791728249385	\N	\N
cmrc815tc00lv75y6lk86z7qx	BONAQUA 500ML CON GAS	bonaqua-500ml-con-gas-w0kazl	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790895003943	\N	\N
cmrc815tc00lw75y6cqunbmtr	HELADO ARCOR	helado-arcor-iu1o56	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7790580112394	\N	\N
cmrc815tc00lx75y6awyr3bkc	ENCENDOR CANDELA	encendor-candela-wkhf5k	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	6902004095218	\N	\N
cmrc815tc00ly75y6nxaffgtw	ALFAJOR GUAYMALLEN TRIPLE NEGRO	alfajor-guaymallen-triple-negro-thowug	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	77980274	\N	\N
cmrc815tc00lz75y6gukvyws3	PAN DE BOLSA	pan-de-bolsa-4k2ln9	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	201	\N	\N
cmrc815tc00m075y6s2z7uma9	PRE PIZZA	pre-pizza-8rrepv	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	202	\N	\N
cmrc815tc00m175y69tbp3sd9	SANDWICHES MIGA X 3	sandwiches-miga-x-3-o1i6ze	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	203	\N	\N
cmrc815tc00m275y6kubpifd9	VINO MALBEC LA MUJER DE MI AMIGO	vino-malbec-la-mujer-de-mi-amigo-nq22na	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	677144814734	\N	\N
cmrc815tc00m375y6tw4s09p2	JABON FLORAL PATRICIA ALLEN	jabon-floral-patricia-allen-1utwi0	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7797470195864	\N	\N
cmrc815td00m475y67d6g6ybh	JABON NEUTRO PATRICIA ALLEN	jabon-neutro-patricia-allen-y25ldh	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7797470195871	\N	\N
cmrc815td00m575y6okejoq6o	PAN RALLADO MAROLIO 500G	pan-rallado-marolio-500g-k88hkk	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7797470132623	\N	\N
cmrc815td00m675y6t3dq8vwk	BEAGLE BOTELLA 1L GOLDEN ALE	beagle-botella-1l-golden-ale-4f51p2	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7798137950055	\N	\N
cmrc815td00m775y6lknnxjcj	PASO DE LOS TOROS 269ml	paso-de-los-toros-269ml-bqf3m5	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.373	2026-07-08 15:16:58.373	\N	\N	\N	7791813800774	\N	\N
cmrc815yy00ma75y62wgrl8gb	soyprueba3	soyprueba3-o6z843	\N	cmqz5vswb006uxhd8c5bcq86n	1851.36	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7734	\N	\N
cmrc815yy00mb75y6ye0ohg3p	HELADO KOPA	helado-kopa-8ncii7	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580135263	\N	\N
cmrc815yy00mc75y6wgeogt7c	HELADO KOPA ARCOR CREMA AMERICANA/DULCE DE LECHE	helado-kopa-arcor-crema-americana-dulce-de-leche-ksmaoh	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580135287	\N	\N
cmrc815yy00md75y6kj23rlsh	SPRITE ZERO 2,25L	sprite-zero-2-25l-xmtm57	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	15	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895064166	\N	\N
cmrc815yy00me75y6b5o5bxi8	VINO FINCA LAS MORAS(RED BLEND)	vino-finca-las-moras-red-blend-28iadc	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791540999031	\N	\N
cmrc815yy00mf75y6sm8axcqt	ROCKELETS MINI	rockelets-mini-ip2wxu	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77942432	\N	\N
cmrc815yy00mg75y6sadeerzn	ALBUM FIFA 2026	album-fifa-2026-atntqh	\N	cmqz5vswb006uxhd8c5bcq86n	19040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	8051708029437	\N	\N
cmrc815yy00mh75y69ssqkvca	FIGURITAS	figuritas-b0ggf1	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7897653549146	\N	\N
cmrc815yy00mi75y60tta9cfw	MINI PEPITOS 50g	mini-pepitos-50g-9eyvbw	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622201740399	\N	\N
cmrc815yy00mj75y6fxhkc5qp	MILKA RASPBERRY CREME 100g	milka-raspberry-creme-100g-cdg26x	\N	cmqz5vswb006uxhd8c5bcq86n	8736	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622300590062	\N	\N
cmrc815yy00mk75y67bpmvvos	MILKA COOKIES 100g	milka-cookies-100g-uawe5f	\N	cmqz5vswb006uxhd8c5bcq86n	8736	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622201424848	\N	\N
cmrc815yy00ml75y6u5tqpj7q	MILKA GANZE HASELNUSSE 95g	milka-ganze-haselnusse-95g-v8l5pr	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202257599	\N	\N
cmrc815yy00mm75y6eaqwdjbi	MILKA COMBINADO AIREADO 50g	milka-combinado-aireado-50g-bluy9o	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622201818951	\N	\N
cmrc815yy00mn75y6du594r0q	MILKA CASTAÑAS CON CARAMELO 55g	milka-castanas-con-caramelo-55g-d54s5l	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622210745293	\N	\N
cmrc815yy00mo75y61ssq2e11	MILKA OREO 55g	milka-oreo-55g-sr7iy3	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622210745132	\N	\N
cmrc815yy00mp75y6fhvd5hdq	CHOCOLATE SHOT 35g	chocolate-shot-35g-evn8rg	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77914217	\N	\N
cmrc815yz00mq75y64r6dk1a6	CHOCOLATE SHOT BLANCO 35g	chocolate-shot-blanco-35g-twq8ru	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77983992	\N	\N
cmrc815yz00mr75y62mgehrco	SNACKY 60g	snacky-60g-xf7u1g	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622300335052	\N	\N
cmrc815yz00ms75y6xinu3d30	HABANITOS 60g	habanitos-60g-usgafn	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622300335076	\N	\N
cmrc815yz00mt75y6jqrusat8	ALFAJOR MILKA RELLENO DULCE DE LECHE 70g	alfajor-milka-relleno-dulce-de-leche-70g-1mr7xl	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202370021	\N	\N
cmrc815yy00m975y6k0lurue0	soyunaprueba2	soyunaprueba2-kemc19	\N	cmqz5vswb006uxhd8c5bcq86n	376.32	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 23:34:18.389	\N	\N	\N	9998	\N	\N
cmrc815yz00mu75y69lxpelxr	ALFAJOR MILKA BLANCO 70g	alfajor-milka-blanco-70g-60vjlz	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202370045	\N	\N
cmrc815yz00mv75y6q9e4jgms	ALFAJOR TERRABUSI BLANCO TRIPLE	alfajor-terrabusi-blanco-triple-a2nq6t	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202805554	\N	\N
cmrc815yz00mw75y6vug83hb9	TABACO LAS HOJAS	tabaco-las-hojas-jge9rp	\N	cmqz5vswb006uxhd8c5bcq86n	8512	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798096700012	\N	\N
cmrc815yz00mx75y6vu33wrbh	DON JOSE TABACO	don-jose-tabaco-bxoal5	\N	cmqz5vswb006uxhd8c5bcq86n	5824	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798096700029	\N	\N
cmrc815yz00my75y6smh2e1is	ALFAJOR AGUILA MINITORTA COCO	alfajor-aguila-minitorta-coco-10bzh8	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040133600	\N	\N
cmrc815yz00mz75y6p2m3e6fw	CHOCOLATE COFLER AIR BLANCO 77G	chocolate-cofler-air-blanco-77g-vge5k6	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580103415	\N	\N
cmrc815yz00n075y66wjevor9	CHOCOLATE COFLER AIR ALMENDRAS 100G	chocolate-cofler-air-almendras-100g-ravtbv	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580103477	\N	\N
cmrc815yz00n175y6coszrxqt	CHOCOLATE ARCOR CRISPY 80G	chocolate-arcor-crispy-80g-grn0u9	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580118655	\N	\N
cmrc815yz00n275y6ve8imanq	CHOCOLATE DUBAI COFLER 43G	chocolate-dubai-cofler-43g-vxw4hw	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77973986	\N	\N
cmrc815yz00n375y6nsjt8h9k	CHOCOLATE COFLER ALMENDRAS 55G	chocolate-cofler-almendras-55g-ulniz8	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580033507	\N	\N
cmrc815yz00n475y6uw9nywi3	MERMELADA ARCOR DURAZNO	mermelada-arcor-durazno-nav5im	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580132224	\N	\N
cmrc815yz00n575y6ny35rjhl	MERMELADA CAMPAGNOLA CIRUELA	mermelada-campagnola-ciruela-1k2z9r	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793360131424	\N	\N
cmrc815yz00n675y68jqwr478	PILA DE RELOJ 3VOLT	pila-de-reloj-3volt-zw10gh	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	8888021300161	\N	\N
cmrc815yz00n775y64zd2nw4g	DORITOS 129G	doritos-129g-43ysva	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985656	\N	\N
cmrc815yz00n875y65p37vygh	LAYS PANCETA 77G	lays-panceta-77g-u3dc1b	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310987780	\N	\N
cmrc815yz00n975y6wfla12hn	CHEETOS 140G	cheetos-140g-wgrxo3	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985793	\N	\N
cmrc815yz00na75y6vq7ekmdh	LAYS PROVOLETA 77G	lays-provoleta-77g-pou5kd	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310986813	\N	\N
cmrc815yz00nb75y6u5c8un9i	DORITOS SWEET CHILI 74G	doritos-sweet-chili-74g-q4qfvp	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310987070	\N	\N
cmrc815yz00nc75y6e3u9tr1e	DORITOS 20G	doritos-20g-stvuno	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310987605	\N	\N
cmrc815yz00nd75y6o5f7r5a9	LAYS JAMON SERRANO 34G	lays-jamon-serrano-34g-og4io9	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985250	\N	\N
cmrc815yz00ne75y6c8ymlx1e	LAYS ASADO 34G	lays-asado-34g-befd66	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310988213	\N	\N
cmrc815yz00nf75y692snrn7x	LAYS ASADO 77G	lays-asado-77g-0lyxpi	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310988220	\N	\N
cmrc815yz00ng75y6y1ltia78	CHEETOS ONDULADOS KETCHUP 40G	cheetos-ondulados-ketchup-40g-6qcur7	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310988121	\N	\N
cmrc815yz00nh75y6998fg993	7UP ZERO 2,25	7up-zero-2-25-6emi46	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813434450	\N	\N
cmrc815yz00ni75y623ddirhg	PAPEL HIGIENICO FRESH	papel-higienico-fresh-kebrp9	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790250016182	\N	\N
cmrc815yz00nj75y6wd5nh09w	SPRITE ZERO 500ML	sprite-zero-500ml-3mr5gf	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895064142	\N	\N
cmrc815yz00nk75y6j8szuokb	ROLLO DE COCINA GIGANTE ELEGANTE	rollo-de-cocina-gigante-elegante-4osqo4	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793344009206	\N	\N
cmrc815z000nl75y6xo9srgip	DON SATUR MAGDALENA VAINILLA CON CHIPS	don-satur-magdalena-vainilla-con-chips-p9nmdn	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7795735601198	\N	\N
cmrc815z000nm75y6ob951zcj	AGUA BONAQUA NORMAL 1.5L	agua-bonaqua-normal-1-5l-uwx0ft	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895003875	\N	\N
cmrc815z000nn75y6bz1gi6vy	CEREAL CON MARROC FELFORT	cereal-con-marroc-felfort-799rdn	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	18	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790206506958	\N	\N
cmrc815z000no75y6kfoik4ip	ENCENDEDOR CANDELA BLACK	encendedor-candela-black-kqw5g9	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	14	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798347089507	\N	\N
cmrc815z000np75y670qymkyr	MENTOS MENTA	mentos-menta-ups61r	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	78916418	\N	\N
cmrc815z000nq75y6sx4u3vhg	PEPAS TIA MARUCA	pepas-tia-maruca-gom66p	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798082745140	\N	\N
cmrc815z000nr75y6jquz9fhf	TIA MARUCA ANILLOS DE COCO	tia-maruca-anillos-de-coco-y41x5j	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798082740107	\N	\N
cmrc815z000ns75y6hg0kbsop	CUBANITOS RELLENOS FELFORT	cubanitos-rellenos-felfort-bsihs1	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790206509805	\N	\N
cmrc815z000nt75y6wncz1cok	ALFAJOR TERRABUSI GLASEADO	alfajor-terrabusi-glaseado-67542j	\N	cmqz5vswb006uxhd8c5bcq86n	1512	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622300202859	\N	\N
cmrc815z000nu75y653ig2des	AQUARIUS 500ML UVA	aquarius-500ml-uva-rg7dfn	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895641206	\N	\N
cmrc815z000nv75y6z8c8verz	AQUARIUS 500ML PERA	aquarius-500ml-pera-ucih02	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895640445	\N	\N
cmrc815z000nw75y65qh57skf	MIELCITA INDIVIDUAL	mielcita-individual-110zc7	\N	cmqz5vswb006uxhd8c5bcq86n	112	0	15	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	205	\N	\N
cmrc815z000ny75y63b67agn7	PETACA GIN	petaca-gin-qk4kqm	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	207	\N	\N
cmrc815z000nz75y64ifxd9ei	SPRITE ZERO 1.5L	sprite-zero-1-5l-5lvt7q	\N	cmqz5vswb006uxhd8c5bcq86n	6496	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895064173	\N	\N
cmrc815z000o075y6nmcokx3q	MUMM EXTRA BRUT	mumm-extra-brut-mhi8hd	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791560527948	\N	\N
cmrc815z000o175y62uqehxwi	ZARPADO CAJA X 6 MINI	zarpado-caja-x-6-mini-pfl75h	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798448080274	\N	\N
cmrc815z000o275y69f0ii8k1	ZARPADO CAJA X 4 GRANDES	zarpado-caja-x-4-grandes-h9dnr2	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798448080397	\N	\N
cmrc815z000o375y6ddgl5jpn	ALFAJOR ZARPADO CALAFATE MINI	alfajor-zarpado-calafate-mini-b022mn	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798448080069	\N	\N
cmrc815z000o475y6g2awujow	ALFAJOR ZARPADO DDL MINI	alfajor-zarpado-ddl-mini-ovbptq	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798448080052	\N	\N
cmrc815z000o575y6li7l6gvq	ALFAJOR ZARPADO MAICENA MINI	alfajor-zarpado-maicena-mini-9lib6o	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798448080076	\N	\N
cmrc815z000o675y6zkwupv4y	NAIPES TRUCO CASINO X40 CARTAS	naipes-truco-casino-x40-cartas-36f68a	\N	cmqz5vswb006uxhd8c5bcq86n	5824	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7797216001039	\N	\N
cmrc815z000o775y6ojcs1bhu	YERBA PIPORE VERDE	yerba-pipore-verde-9oq8kb	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793750009784	\N	\N
cmrc815z000o875y6h0o4tv1i	YERBA PIPORE ROJA	yerba-pipore-roja-c7ggyy	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793750009838	\N	\N
cmrc815z000o975y63k7tufxn	LUCVY STRIKE ORIGINAL	lucvy-strike-original-wq462x	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77989871	\N	\N
cmrc815z000oa75y65ixd3bn7	PEPSI MAX 1.5	pepsi-max-1-5-y4wr6x	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813828419	\N	\N
cmrc815z000ob75y6pvmlsqi2	RED BULL POMELO 250ML SUGAR FREE	red-bull-pomelo-250ml-sugar-free-pzhh5i	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	9002490288341	\N	\N
cmrc815z000oc75y6uun8ohl6	RED BULL FRUTOS ROJOS 250ML	red-bull-frutos-rojos-250ml-5qla99	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	9002490287535	\N	\N
cmrc815z000od75y6j4e490ma	AQUARIUS NARANJA 2.25	aquarius-naranja-2-25-uxr6gs	\N	cmqz5vswb006uxhd8c5bcq86n	6608	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895003325A	\N	\N
cmrc815z000oe75y6xbb0np3x	BELDENT  SPEARMILT X 14	beldent-spearmilt-x-14-u9buxj	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622201457396	\N	\N
cmrc815z100of75y6s6lvqthp	POLENATA MOLINOS	polenata-molinos-5tv0l5	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791120103858	\N	\N
cmrc815z100og75y6yro23ax3	SCHWEPPES 500ML ZERO	schweppes-500ml-zero-9yfs30	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895010064	\N	\N
cmrc815z100oh75y6g3iiwx1r	LATA SCHWEPPES POMELO ZERO 310ML	lata-schweppes-pomelo-zero-310ml-5izwc4	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895643903	\N	\N
cmrc815z100oi75y6k4hxnldm	AQUARIUS NARANJA 2.25L	aquarius-naranja-2-25l-3njuzj	\N	cmqz5vswb006uxhd8c5bcq86n	6608	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895003325	\N	\N
cmrc815z100oj75y6nsrph2jg	PRIME ULTRA FINO	prime-ultra-fino-2pnfrw	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791519701061	\N	\N
cmrc815z100ok75y66a6385ye	GILLETE PRESTOBARBA ULTRA GRIP	gillete-prestobarba-ultra-grip-2xfujr	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7500435154420	\N	\N
cmrc815z100ol75y6ihl81t5h	CANDELA PAÑUELITOS DESCARTABLES	candela-panuelitos-descartables-3p9zu7	\N	cmqz5vswb006uxhd8c5bcq86n	672	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798130950014	\N	\N
cmrc815z100om75y6j5s10fk2	TRES PLUMAS PETACA CHOCOLATE	tres-plumas-petaca-chocolate-m36zo8	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77992246	\N	\N
cmrc815z100on75y6wfq03ofe	TRES PLUMAS PETACA CAFE CON COÑAC	tres-plumas-petaca-cafe-con-conac-l4cmn1	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77990112	\N	\N
cmrc815z100oo75y6ttcwnc63	TRES PLUMAS PETACA CAFE CON RON	tres-plumas-petaca-cafe-con-ron-l51fk1	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77991911	\N	\N
cmrc815z100op75y6hewlleu5	TAILOV PETACA VODKA	tailov-petaca-vodka-19v4uk	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77991843	\N	\N
cmrc815z100oq75y6tbt0zotz	LAYS 30G FLAMIN HOT	lays-30g-flamin-hot-sm7sd1	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985335	\N	\N
cmrc815z100or75y6ye8wmklk	LAYS 70G FLAMIN HOT	lays-70g-flamin-hot-juwpgp	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985328	\N	\N
cmrc815z100os75y6wemvplq8	DORITOS 200G	doritos-200g-o8jper	\N	cmqz5vswb006uxhd8c5bcq86n	10080	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985571	\N	\N
cmrc815z100ot75y6udat17rp	DORITOS 74G PIZZA	doritos-74g-pizza-zhxkk9	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310988282	\N	\N
cmrc815z100ou75y6t5y8ltje	3D CONITOS 43G	3d-conitos-43g-ikujfu	\N	cmqz5vswb006uxhd8c5bcq86n	2912	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985113	\N	\N
cmrc815z100ov75y6xlcl9n8w	3D CONITOS 23G	3d-conitos-23g-s8hsz6	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310983461	\N	\N
cmrc815z100ow75y69jnc7bpt	COPA DEL MUNDIAL	copa-del-mundial-ocg8pk	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	208	\N	\N
cmrc815z100ox75y61n898dj3	ENCEDEDOR DEL MUNDIAL	encededor-del-mundial-cjpz53	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	37	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	209	\N	\N
cmrc815z100oy75y6w07ocyta	CHUPETIN DEL MUNDIAL	chupetin-del-mundial-dwe6k2	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	6922577102366	\N	\N
cmrc815z100oz75y67lmdjj5w	SERNOVA VODKA 700ML	sernova-vodka-700ml-kxh3b8	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790290101510	\N	\N
cmrc815z100p075y6cwm6056y	ORLOF VODKA 700ML	orlof-vodka-700ml-5mgows	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792410779319	\N	\N
cmrc815z100p175y6mc0ibwwt	BOLSA RESIDUOS 45X60 10U LA GAUCHITA	bolsa-residuos-45x60-10u-la-gauchita-4sgolw	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792459264166	\N	\N
cmrc815z100p275y681o18mvm	BOLSA RESIDUOS 50X70 10 U LA GAUCHITA	bolsa-residuos-50x70-10-u-la-gauchita-do1sbk	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792459264111	\N	\N
cmrc815z100p375y6cuqhcths	ALFAJOR AGUILA MINITORTA BLANCO	alfajor-aguila-minitorta-blanco-umfp6l	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040133570	\N	\N
cmrc815z100p475y654f7qx9z	CHOCOLATE COFLER AIR MIXTO 27G	chocolate-cofler-air-mixto-27g-wfm0sz	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580103385	\N	\N
cmrc815z100p575y66sejkw96	CHOCOLATE COFLER AIR BON O BON	chocolate-cofler-air-bon-o-bon-rmudsd	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580127145	\N	\N
cmrc815z100p675y6y7wicb50	CHOCOLATE COFLER AIR BLANCO 100G	chocolate-cofler-air-blanco-100g-l2iaod	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580103453	\N	\N
cmrc815z100p775y691hpdwbx	CHOCOLATE COFLER AIR MIXTO 100G	chocolate-cofler-air-mixto-100g-ar8ag4	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580103460	\N	\N
cmrc815z100p875y6unzhvqk7	ROCKLETS MUNDIAL	rocklets-mundial-06fg60	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	23	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580126148	\N	\N
cmrc815z100p975y6pjm3zkg5	TOP LINE SEVEN  FREEZING MENTOL	top-line-seven-freezing-mentol-io2l57	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	17	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77964137	\N	\N
cmrc815z200pa75y662edyw7l	CHOCOLATE AGUILA AMARGO 60% CACAO CON NARANJA 100G	chocolate-aguila-amargo-60-cacao-con-naranja-100g-ocn8nd	\N	cmqz5vswb006uxhd8c5bcq86n	8624	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580143015	\N	\N
cmrc815z200pb75y6320pjdyx	CHOCOLATE COFLER 60% CACAO 100G CON NARANJA	chocolate-cofler-60-cacao-100g-con-naranja-4xs09s	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	7	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580141776	\N	\N
cmrc815z200pc75y6v42e2v78	CHOCOLATE COFLER 60% CACAO 100G CREMOSO	chocolate-cofler-60-cacao-100g-cremoso-v42nb3	\N	cmqz5vswb006uxhd8c5bcq86n	7840	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580141752	\N	\N
cmrc815z200pd75y61bohj5rf	POTE HELADO COFLER CHOCOTORTA	pote-helado-cofler-chocotorta-p4pnwk	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580142162	\N	\N
cmrc815z200pe75y62yvm6edt	POTE HELADO COFLER FRUTILLA A LA CREMA	pote-helado-cofler-frutilla-a-la-crema-s682un	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580152529	\N	\N
cmrc815z200pf75y60pifoqt0	POTE HELADO COFLER DULCE DE LECHE	pote-helado-cofler-dulce-de-leche-gwowjl	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580112400	\N	\N
cmrc815z200pg75y61bf603jl	POTE HELADO COFLER ROCKLETS	pote-helado-cofler-rocklets-gu69tg	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580139599	\N	\N
cmrc815z200ph75y6ty8asxbr	POTE HELADO COFLER BON O BON	pote-helado-cofler-bon-o-bon-prwsp4	\N	cmqz5vswb006uxhd8c5bcq86n	8288	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580118143	\N	\N
cmrc815z200pi75y6czp843gs	PURE DE TOMATE ARCOR	pure-de-tomate-arcor-cx0hn7	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580146115	\N	\N
cmrc815z200pj75y63ihsg0py	GALLETAS OPERA 92G	galletas-opera-92g-o2lisb	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77903518	\N	\N
cmrc815z200pk75y6rgd41y6o	TOP LINE STRONG pequeños	top-line-strong-pequenos-1lu258	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77993779	\N	\N
cmrc815z200pl75y6b4yl1r6c	VINO ALARIS DULCE COSECHA BLANCO DULCE	vino-alaris-dulce-cosecha-blanco-dulce-fyst3k	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790240041880	\N	\N
cmrc815z200pm75y6eh2gqlvb	ALARIS TORRONTES	alaris-torrontes-87qr5a	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790240091212	\N	\N
cmrc815z200pn75y6kjs5ujfy	TERRABUSI MINI RHODESIA 60G	terrabusi-mini-rhodesia-60g-qqf1l3	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622300335090	\N	\N
cmrc815z200po75y6hebj0qcv	CANCILLER BLEND DULCE	canciller-blend-dulce-4c708g	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790314080111	\N	\N
cmrc815z200pp75y6gcv8iwe4	SUTER TARDIO	suter-tardio-64wi0b	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790704000064	\N	\N
cmrc815z200pq75y6lvn2c2g3	ALMA MORA SELECCION	alma-mora-seleccion-czq869	\N	cmqz5vswb006uxhd8c5bcq86n	7616	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791540044106	\N	\N
cmrc815z200pr75y6852w9jsh	JABON PALMOLIVE OLIVA Y ALOE VERA	jabon-palmolive-oliva-y-aloe-vera-929rd2	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7891024034767	\N	\N
cmrc815z200ps75y6yvpuw8j6	MALBEC LOS ARBOLES	malbec-los-arboles-087sms	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791250000935	\N	\N
cmrc815z200pt75y6ceqbzq3s	LECHE DESCREMADA LA SERENISIMA	leche-descremada-la-serenisima-scswn5	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790742363107	\N	\N
cmrc815z200pu75y6cuulcnu6	MONSTER BLANCA 473ML	monster-blanca-473ml-zp7aux	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798422620021	\N	\N
cmrc815z200pv75y672h0mmyw	MONSTER MANGO LOCO	monster-mango-loco-ljbunm	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798422620045	\N	\N
cmrc815z200pw75y6edztjucu	NARANJU	naranju-ajoj86	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	113	\N	\N
cmrc815z200px75y6v09kbxd9	POWERADE COOL CITRUS 500ML	powerade-cool-citrus-500ml-2cvl0p	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895651489	\N	\N
cmrc815z200py75y62ufgllkf	GALLETITAS SURTIDAS TERRABUSI XL	galletitas-surtidas-terrabusi-xl-hvg86g	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202839979	\N	\N
cmrc815z200pz75y6o8grexbn	FIDEOS SANTA ISABEL MOSTACHOL	fideos-santa-isabel-mostachol-e4o3cf	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798138555464	\N	\N
cmrc815z200q075y64lajkbcg	SANTA ISABEL FIDEO CODITO	santa-isabel-fideo-codito-etmeas	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798138553231	\N	\N
cmrc815z200q175y6k2vrpc3c	MOLTO MAYONESA	molto-mayonesa-scdmo4	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798138553316	\N	\N
cmrc815z300q275y6ba3knocs	CAÑUELAS ARROZ LARGO FINO 500G	canuelas-arroz-largo-fino-500g-q9ayec	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792180139542	\N	\N
cmrc815z300q375y674tboejs	CAÑUELAS ACEITE GIRASOL 900ML	canuelas-aceite-girasol-900ml-ssw1sv	\N	cmqz5vswb006uxhd8c5bcq86n	6160	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792180001641	\N	\N
cmrc815z300q475y64yxhah3s	prueba1234	prueba1234-202811	\N	cmqz5vswb006uxhd8c5bcq86n	1117.76	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	999666	\N	\N
cmrc815z300q575y6p3owfsx5	prueba4321	prueba4321-8danlv	\N	cmqz5vswb006uxhd8c5bcq86n	2238.88	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	1234523	\N	\N
cmrc815z300q675y6t5rxzm7h	soypueba1	soypueba1-2utyqm	\N	cmqz5vswb006uxhd8c5bcq86n	112	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	888882	\N	\N
cmrc815z300q775y6zwxzzmun	pruebacambiarprecio	pruebacambiarprecio-pe97pq	\N	cmqz5vswb006uxhd8c5bcq86n	225.12	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	1111	\N	\N
cmrc815z300q875y6piu7dpmd	aumentopreci	aumentopreci-uidwfp	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	2345	\N	\N
cmrc815z300q975y6khyk0z89	SWIFT BURGER DOBLE 112G	swift-burger-doble-112g-hejrgn	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790360966797	\N	\N
cmrc815z300qa75y6meeqhc65	HAMBURGUESA PATY 4U 288G	hamburguesa-paty-4u-288g-57asac	\N	cmqz5vswb006uxhd8c5bcq86n	13440	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790670051831	\N	\N
cmrc815z300qb75y65twkytzg	HAMBURGUESA EXPRESS 2U 110G	hamburguesa-express-2u-110g-pqh117	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790670052869	\N	\N
cmrc815z300qc75y6tl0wmdmq	DULCE DE LECHE LA SERENISIMA 400G	dulce-de-leche-la-serenisima-400g-llufem	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790742625205	\N	\N
cmrc815z300qd75y6jkfo6acg	PRINGLES CREMA Y CEBOLLA 109G	pringles-crema-y-cebolla-109g-dr11gj	\N	cmqz5vswb006uxhd8c5bcq86n	7280	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7896004009162	\N	\N
cmrc815z300qe75y622bq36my	PRINGLES CREMA Y CEBOLLA 39G	pringles-crema-y-cebolla-39g-phtpo6	\N	cmqz5vswb006uxhd8c5bcq86n	5152	0	8	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7896004009193	\N	\N
cmrc815z300qf75y6zrs66fa5	REXONS 48 HS. V8	rexons-48-hs-v8-m8su0f	\N	cmqz5vswb006uxhd8c5bcq86n	5824	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	78944800	\N	\N
cmrc815z300qg75y6l2p8ykmt	CREMA DENTAL COLGATE TRIPLE ACCION	crema-dental-colgate-triple-accion-lixlhb	\N	cmqz5vswb006uxhd8c5bcq86n	6832	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7509546686523	\N	\N
cmrc815z300qh75y6cgb7vt9m	CEPILLO DENTAL COLGATE	cepillo-dental-colgate-x9fzbl	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793100151224	\N	\N
cmrc815z300qi75y6mbzyzl8t	DETERGENTE CIF X5 PODER	detergente-cif-x5-poder-rqmyob	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791290794054	\N	\N
cmrc815z300qj75y6xxzxhw14	ENJUAGUE BUCAL COLGATE	enjuague-bucal-colgate-bak8kt	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7891024028827	\N	\N
cmrc815z300qk75y6f7r1rr1z	GALLETITAS OREO MENTA	galletitas-oreo-menta-6l0nei	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202373046	\N	\N
cmrc815z300ql75y6xnnbcia2	CEREAL MIX CHO PASION	cereal-mix-cho-pasion-fhj3kk	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77984395	\N	\N
cmrc815z300qm75y63l9ytgoh	CEREAL MIX BALANCE	cereal-mix-balance-blsxxh	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77965370	\N	\N
cmrc815z300qn75y6oynzdvex	CEREAL MIX CHOCO FRUTILLA	cereal-mix-choco-frutilla-5al6eo	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77981455	\N	\N
cmrc815z300qo75y6pjvs6ndh	CEREAL MIX ORIGINAL	cereal-mix-original-qplnk4	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77916501	\N	\N
cmrc815z300qp75y6naqciw23	CEREAL ALMENDRA	cereal-almendra-mudo53	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040146723	\N	\N
cmrc815z300qq75y6mfwj3myy	CEREAL MIX PISTACHO	cereal-mix-pistacho-l6xxpz	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040153424	\N	\N
cmrc815z300qr75y6utyovhjl	TURRON ROCKLETS	turron-rocklets-9qexp7	\N	cmqz5vswb006uxhd8c5bcq86n	22.4	0	37	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77993540	\N	\N
cmrc815z300qs75y63wtp30ys	MOGUL EXTREME PICANTE	mogul-extreme-picante-dst2c3	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	23	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580117351	\N	\N
cmrc815z300qt75y6jz3nrh0q	MOGUL EXTREME PALOTES	mogul-extreme-palotes-6m9pow	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580117986	\N	\N
cmrc815z300qu75y6xk0ukp6v	MOGUL MASRTI EXTREME CONFITADOS	mogul-masrti-extreme-confitados-snawsf	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580150662	\N	\N
cmrc815z300qv75y6cq9izdvu	MOGUL MOSTI PALOTE	mogul-mosti-palote-wel0mp	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580151232	\N	\N
cmrc815z400qw75y6emmkqapo	MOGUL SANDIA	mogul-sandia-mawhkc	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580151263	\N	\N
cmrc815z400qx75y6kcv6j3wu	BIZCOCHITOS DE GRASA JORGITO	bizcochitos-de-grasa-jorgito-k64me9	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790957000668	\N	\N
cmrc815z400qy75y6avrtos7m	9 DE ORO BIZCOCHOS	9-de-oro-bizcochos-mst0c3	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792200000159	\N	\N
cmrc815z400qz75y63wejq8hv	9 DE ORO BIZCOCHO LIGHT	9-de-oro-bizcocho-light-razj1o	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792200000777	\N	\N
cmrc815z400r075y6si55m2w6	PAÑUELITOS ELITE	panuelitos-elite-od5uqf	\N	cmqz5vswb006uxhd8c5bcq86n	784	0	15	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790250000358	\N	\N
cmrc815z400r175y6eshq4k05	DORITOS DINAMITA FLAMIN HOT 82G	doritos-dinamita-flamin-hot-82g-n11je8	\N	cmqz5vswb006uxhd8c5bcq86n	3584	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310987582	\N	\N
cmrc815z400r275y602dc8ui8	DORITOS DINAMITA FLAMIN HOT 45G	doritos-dinamita-flamin-hot-45g-57wwpo	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310987575	\N	\N
cmrc815z400r375y60rwa0nlc	LAYS BARBACOA 77G	lays-barbacoa-77g-i19iuq	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310987766	\N	\N
cmrc815z400r475y6wf22epkr	CHEETOS 43G	cheetos-43g-hu0gf4	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985274	\N	\N
cmrc815z400r575y6g6m8t7nf	CHEETOS ONDULADO SABOR CREMA 85G	cheetos-ondulado-sabor-crema-85g-jbdk58	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310985670	\N	\N
cmrc815z400r675y6t4i15hcl	ACEITE LEGITIMA 900 CM	aceite-legitima-900-cm-4wr5qe	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798316700808	\N	\N
cmrc815z400r775y6bqudxn2y	CALDITOS KNORR X 6	calditos-knorr-x-6-bmiecd	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794000008595	\N	\N
cmrc815z400r875y6eqtbl4bq	LENTEJAS DOÑA PUPA	lentejas-dona-pupa-h5mit4	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798096031086	\N	\N
cmrc815z400r975y611qn3w1f	LENGUETAZO TUTTI-FRUTTI	lenguetazo-tutti-frutti-9m20xb	\N	cmqz5vswb006uxhd8c5bcq86n	448	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77907943	\N	\N
cmrc815z400ra75y672bonib7	MAYONESA HELLMANNS	mayonesa-hellmanns-3c3f6g	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794000006072	\N	\N
cmrc815z400rb75y6vrdz8wr4	RECARGA CLARO	recarga-claro-0hgnl6	\N	cmqz5vswb006uxhd8c5bcq86n	560	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	300	\N	\N
cmrc815z400rc75y6hvfomw5j	9 DE ORO AGRI DULCE	9-de-oro-agri-dulce-pqoesu	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792200000128	\N	\N
cmrc815z400rd75y6sopvtmgx	BANANITA DOLCA CLASICA	bananita-dolca-clasica-z5o7qj	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77988263	\N	\N
cmrc815z400re75y6e7q3rmih	MENTOS FRUTILLA	mentos-frutilla-10flba	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	78925281	\N	\N
cmrc815z400rf75y6g047e30o	MENTOS FRUTOS	mentos-frutos-77q6et	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	78916401	\N	\N
cmrc815z400rg75y6lzp6wb9f	TROCITOS CON SALSA DE CARNE GATO	trocitos-con-salsa-de-carne-gato-ibbrhy	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849665	\N	\N
cmrc815z400rh75y6if80rhfa	RAVIOLES CARNE Y ESPINACA 450G	ravioles-carne-y-espinaca-450g-f95cvn	\N	cmqz5vswb006uxhd8c5bcq86n	4368	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790070621887	\N	\N
cmrc815z400ri75y6nvtill3v	VITAL CAN GATO CACHORRO CARNE	vital-can-gato-cachorro-carne-xh9pz7	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849702	\N	\N
cmrc815z400rj75y65pxfr910	VITAL CAN PERRO ADULTO CARNE	vital-can-perro-adulto-carne-xlunyj	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849740	\N	\N
cmrc815z400rk75y67zfmzj9w	VITAL CAN PERRO CACHORRO CARNE	vital-can-perro-cachorro-carne-w329d7	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849788	\N	\N
cmrc815z400rl75y6aumg80b9	VITAL CAN GATO ADULTO SARDINA	vital-can-gato-adulto-sardina-6y337c	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849696	\N	\N
cmrc815z400rm75y6m1uj3bsh	VITAL CAN GATO ADULTO POLLO	vital-can-gato-adulto-pollo-a8bepa	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849689	\N	\N
cmrc815z400rn75y67srn6dt6	VITAL CAN PERRO ADULTO POLLO	vital-can-perro-adulto-pollo-8sclvg	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798098849771	\N	\N
cmrc815z400ro75y6g9sukub9	VALENTE VAINILLAS 6U	valente-vainillas-6u-m3z0oh	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793890258738	\N	\N
cmrc815z400rp75y6jljckqla	VALENTE VAINILLAS 12U	valente-vainillas-12u-x686ai	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793890258691	\N	\N
cmrc815z500rq75y6ifu5rq1j	PATE CON PESCADO GATO ADULTO	pate-con-pescado-gato-adulto-az9rtn	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798429434720	\N	\N
cmrc815z500rr75y6sfj614se	PATE CON POLLO GATO ADULTO	pate-con-pollo-gato-adulto-10nmb3	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798429434751	\N	\N
cmrc815z500rs75y6we30of9i	PATE CON CARNE PERRO ADULTO	pate-con-carne-perro-adulto-uihczv	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798429434768	\N	\N
cmrc815z500rt75y69ej31z8w	PATE CON CORDERO PERRO ADULTO	pate-con-cordero-perro-adulto-klhgws	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798429434683	\N	\N
cmrc815z500ru75y6ev97zwpb	PATE CON CORDERO PERRO CACHORRO	pate-con-cordero-perro-cachorro-3hj3cs	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798429434713	\N	\N
cmrc815z500rv75y6o0ahawj8	IMPERIAL GOLDEN SIN ALCOHOL LATA	imperial-golden-sin-alcohol-lata-k1w6m6	\N	cmqz5vswb006uxhd8c5bcq86n	2296	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147574130	\N	\N
cmrc815z500rw75y6w4ab9s3p	IMPERIAL ROJA LATA	imperial-roja-lata-paup1r	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147572723	\N	\N
cmrc815z500rx75y6ztuvkgn4	IMPERIAL EXTRA LAGER LATA	imperial-extra-lager-lata-da60ml	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147000752	\N	\N
cmrc815z500ry75y6wipftg9l	IMPERIAL IPA LATA	imperial-ipa-lata-fjexex	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147570743	\N	\N
cmrc815z500rz75y680990jbr	IMPERIAL GOLDEN LATA	imperial-golden-lata-uns9f1	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147571689	\N	\N
cmrc815z500s075y6bouolspt	IMPERIAL CREAM STOUT LATA	imperial-cream-stout-lata-4kb6w6	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147001742	\N	\N
cmrc815z500s175y6excdr6fr	IMPERIAL APA LATA	imperial-apa-lata-3tdfdl	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147571160	\N	\N
cmrc815z500s275y6ba12j7kt	AMSTEL LAGER LATA	amstel-lager-lata-2pv3vr	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147573546	\N	\N
cmrc815z500s375y6l18ov0fa	SALTA CAUTIVA RUBIA LATA	salta-cautiva-rubia-lata-hvusfn	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147572327	\N	\N
cmrc815z500s475y6m9ari48b	BLUE MOON BELGIAN WHITE LATA	blue-moon-belgian-white-lata-02x8yi	\N	cmqz5vswb006uxhd8c5bcq86n	5712	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147573195	\N	\N
cmrc815z500s575y6g8nsrpq8	KUNSTMANN LATA	kunstmann-lata-bzchcf	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7802107000562	\N	\N
cmrc815z500s675y6mepxdtzq	MILLER LATA	miller-lata-0jmbqv	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147573386	\N	\N
cmrc815z500s775y6gsx33lsh	WARSTEINER LATA	warsteiner-lata-6rgprb	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147570927	\N	\N
cmrc815z500s875y6jfjsdf8s	GROBSCH IPA LATA	grobsch-ipa-lata-d6k2rd	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147572846	\N	\N
cmrc815z500s975y6m9o5i2zu	IMPERIAL GOLDEN 330	imperial-golden-330-b3j3fk	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147574109	\N	\N
cmrc815z500sa75y6ck3l2npg	BRIO JUGO NARANJA	brio-jugo-naranja-ly2rl8	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798062543926	\N	\N
cmrc815z500sb75y66gii0l6w	BRIO JUGO MANZANA	brio-jugo-manzana-op9254	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798062543919	\N	\N
cmrc815z500sc75y6kzemxodq	BRIO JUGO POMELO	brio-jugo-pomelo-quxvbb	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798062543933	\N	\N
cmrc815z500sd75y6ru72c6oa	BRIO JUGO MULTIFRUTA	brio-jugo-multifruta-fg906n	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798062545487	\N	\N
cmrc815z500se75y6budauiys	SIDRA 1888	sidra-1888-uz0wh3	\N	cmqz5vswb006uxhd8c5bcq86n	10640	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790119002370	\N	\N
cmrc815z500sf75y65eecunq9	COLON SELECTO BLANCO	colon-selecto-blanco-yv5dqq	\N	cmqz5vswb006uxhd8c5bcq86n	6720	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790168904502	\N	\N
cmrc815z500sg75y6k1hin9ui	0-61 MALBEC	0-61-malbec-kv0tca	\N	cmqz5vswb006uxhd8c5bcq86n	14000	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798081669133	\N	\N
cmrc815z500sh75y6x4oars72	LA CELIA MALBEC	la-celia-malbec-nip2sl	\N	cmqz5vswb006uxhd8c5bcq86n	14112	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798141877362	\N	\N
cmrc815z500si75y6r5p0e0qh	LA CELIA MALBEC 2024	la-celia-malbec-2024-h9z5f1	\N	cmqz5vswb006uxhd8c5bcq86n	14112	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798141877058	\N	\N
cmrc815z500sj75y626g3oczf	GRAFFIGNA MALBEC	graffigna-malbec-2yyt42	\N	cmqz5vswb006uxhd8c5bcq86n	14112	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790168075684	\N	\N
cmrc815z600sk75y6i5n4avlu	AGUA BONAQUA 500ML	agua-bonaqua-500ml-ianc5f	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895003868	\N	\N
cmrc815z600sl75y63lyus1nn	ESTRELLA DE GALICIA LATA	estrella-de-galicia-lata-h1i5d1	\N	cmqz5vswb006uxhd8c5bcq86n	2688	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7898953990157	\N	\N
cmrc815z600sm75y6bfl92qle	ESTRELLA DE GALICIA BOTELLA 355	estrella-de-galicia-botella-355-25l57a	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7898953990140	\N	\N
cmrc815z600sn75y6yd87waj4	ALFAJOR AGUILA MINITORTA DARK	alfajor-aguila-minitorta-dark-5f7rtd	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040137578	\N	\N
cmrc815z600so75y61ie6vg0s	CHOCOLATE COFLER AIR BLANCO 27G	chocolate-cofler-air-blanco-27g-aatox5	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580103378	\N	\N
cmrc815z600sp75y6vohpilvm	GALLETITAS MELLIZAS	galletitas-mellizas-uycpf6	\N	cmqz5vswb006uxhd8c5bcq86n	1960	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040143548	\N	\N
cmrc815z600sq75y6b9drzl98	COFLER BLOCK BLANCO 38G	cofler-block-blanco-38g-8x9b4j	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77981912	\N	\N
cmrc815z600sr75y601ho4rom	COCA 500ML SABOR LIVIANO	coca-500ml-sabor-liviano-okijdq	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895001482	\N	\N
cmrc815z600ss75y6jeumini2	MENTHOPLUS SANDIA	menthoplus-sandia-zu5fqj	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77980915	\N	\N
cmrc815z600st75y6co0blr42	MENTHOPLUS TROPICAL	menthoplus-tropical-z0aebx	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77980922	\N	\N
cmrc815z600su75y6r002bxhh	CHOCOLINAS RELLENAS	chocolinas-rellenas-5c2eks	\N	cmqz5vswb006uxhd8c5bcq86n	1792	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040154445	\N	\N
cmrc815z600sv75y6z0dihgpk	MANA SABOR VAINILLA 136G	mana-sabor-vainilla-136g-kycwx9	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040137837	\N	\N
cmrc815z600sw75y6rzdzrf1t	MANA SABOR LIMON 136G	mana-sabor-limon-136g-2lcze7	\N	cmqz5vswb006uxhd8c5bcq86n	1456	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040137820	\N	\N
cmrc815z600sx75y6wpr62zls	MENTHOPLUS DULCE DE LECHE	menthoplus-dulce-de-leche-0ud3oo	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77983930	\N	\N
cmrc815z600sy75y6gb3afra4	CHOCOLINAS 258G NEGRO	chocolinas-258g-negro-d9l25n	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790040142992	\N	\N
cmrc815z600sz75y6nzz1zzrs	SALSA LISTA ARCOR BOLOGNESA	salsa-lista-arcor-bolognesa-g0cmi1	\N	cmqz5vswb006uxhd8c5bcq86n	2128	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793360130014	\N	\N
cmrc815z600t075y6llv6gzns	SALSA LISTA ARCOR TUCO	salsa-lista-arcor-tuco-4p3n6w	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580134518	\N	\N
cmrc815z600t175y6evb02fy3	LATA GARBANZOS ARCOR	lata-garbanzos-arcor-jyl35e	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580132477	\N	\N
cmrc815z600t275y6haabxt4f	LATA LENTEJAS ARCOR	lata-lentejas-arcor-0q0xdi	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580132453	\N	\N
cmrc815z600t375y6ouuw590a	IMPERIAL GOLDEL 710	imperial-goldel-710-0wnzns	\N	cmqz5vswb006uxhd8c5bcq86n	4928	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147572624	\N	\N
cmrc815z600t475y6k2t34aik	ALCOHOL BIAL 2500ML	alcohol-bial-2500ml-varnzv	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790139000462	\N	\N
cmrc815z600t575y6ymevwxu5	DON SATUR QUESO 140G	don-satur-queso-140g-ov8bv8	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7795735000519	\N	\N
cmrc815z600t675y6pdomjc86	PRIME RETARDANTE	prime-retardante-yu5oyi	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791519702112	\N	\N
cmrc815z600t775y6ii625nio	PRIME ORGAZMAX	prime-orgazmax-sz8d12	\N	cmqz5vswb006uxhd8c5bcq86n	4480	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791519706233	\N	\N
cmrc815z600t875y6x2jpgc33	VINO TRUMPETER MERLOT	vino-trumpeter-merlot-whjvxw	\N	cmqz5vswb006uxhd8c5bcq86n	13440	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790577002172	\N	\N
cmrc815z600t975y6qzi4uy74	VIÑAS DE ALVEAR	vinas-de-alvear-fd3oxt	\N	cmqz5vswb006uxhd8c5bcq86n	3696	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791670027482	\N	\N
cmrc815z600ta75y63d9v2lmy	CELUSAL SAL GRUESA	celusal-sal-gruesa-68w92e	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791004000099	\N	\N
cmrc815z600tb75y6a61t8duf	CELUSAL SAL ENTREFINA	celusal-sal-entrefina-36ehw6	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791004000839	\N	\N
cmrc815z600tc75y6gli5y83y	MILKAUT YOGUR VAINILLA	milkaut-yogur-vainilla-23mhs7	\N	cmqz5vswb006uxhd8c5bcq86n	3808	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820903216	\N	\N
cmrc815z600td75y6ttusw30v	MILKAUT YOGUR FRUTILLA	milkaut-yogur-frutilla-xiwryt	\N	cmqz5vswb006uxhd8c5bcq86n	3808	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820903209	\N	\N
cmrc815z700te75y68heuuzim	MILKAUT YOGUR FRUTILLA CEREALES	milkaut-yogur-frutilla-cereales-o394qy	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820902837	\N	\N
cmrc815z700tf75y6gwu3m13n	MILKAUT YOGUR VAINILLA CEREALES	milkaut-yogur-vainilla-cereales-06bt3p	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820902844	\N	\N
cmrc815z700tg75y6xq0yjfz4	MILKAUT YOGUR CREMOSO VAINILLA	milkaut-yogur-cremoso-vainilla-7kihv6	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820903483	\N	\N
cmrc815z700th75y62rxdwsmz	MILKAUT YOGUR CREMOSO FRUTILLA	milkaut-yogur-cremoso-frutilla-owx85u	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820902813	\N	\N
cmrc815z700ti75y60s7t9g7z	MILKAUT YOGUR FIRME VAINILLA	milkaut-yogur-firme-vainilla-0eprm5	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820903247	\N	\N
cmrc815z700tj75y6o7faz0jq	MILKAUT YOGUR FIRME FRUTILLA	milkaut-yogur-firme-frutilla-3rcvl6	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794820903254	\N	\N
cmrc815z700tk75y6y6mommi4	LA CASONA SALAMIN	la-casona-salamin-lq9jym	\N	cmqz5vswb006uxhd8c5bcq86n	8400	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794110718452	\N	\N
cmrc815z700tl75y6062evfm4	ADLER QUESO GRUYERE	adler-queso-gruyere-nri3qt	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791564013355	\N	\N
cmrc815z700tm75y6wqwl8c3z	ADLER QUESO FONTINA	adler-queso-fontina-5j7zfa	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791564012501	\N	\N
cmrc815z700tn75y6cdr3v36y	ADLER QUESO CON JAMON	adler-queso-con-jamon-zjo680	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791564012488	\N	\N
cmrc815z700to75y6mqtevhz2	ADLER QUESO CON SALAME	adler-queso-con-salame-o6j0rh	\N	cmqz5vswb006uxhd8c5bcq86n	3360	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791564012525	\N	\N
cmrc815z700tp75y66r8g8lvn	BOCADITOS FANTOCHE	bocaditos-fantoche-umzwsl	\N	cmqz5vswb006uxhd8c5bcq86n	1008	0	16	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77988102	\N	\N
cmrc815z700tq75y62t7pn77b	STELLA  ARTOIS 710 VDRIO	stella-artois-710-vdrio-tpfxk6	\N	cmqz5vswb006uxhd8c5bcq86n	6832	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792798010721	\N	\N
cmrc815z700tr75y6vy5nq9vg	H2O POMELO 1.5	h2o-pomelo-1-5-zpe739	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813403012	\N	\N
cmrc815z700ts75y6f43fifqr	H2OH LIMONETO 1.5	h2oh-limoneto-1-5-m6jcs9	\N	cmqz5vswb006uxhd8c5bcq86n	4144	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813403029	\N	\N
cmrc815z700tt75y6a47vq8rc	GATORADE MANZANA 750	gatorade-manzana-750-nv6vnt	\N	cmqz5vswb006uxhd8c5bcq86n	4592	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792170052271	\N	\N
cmrc815z800tu75y6v9py61tm	GATORADE 400ML FRESA KIWI	gatorade-400ml-fresa-kiwi-3fsz04	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813434016	\N	\N
cmrc815z800tv75y6o6lyz15c	GATORADE 400ML MORAS	gatorade-400ml-moras-pmgr77	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813434023	\N	\N
cmrc815z800tw75y637av3pwk	H2OH POMELADA SIN GAS	h2oh-pomelada-sin-gas-zuyypn	\N	cmqz5vswb006uxhd8c5bcq86n	3248	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813402015	\N	\N
cmrc815z800tx75y6pa8vg1cw	DRF MENTA	drf-menta-bvcu3o	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792222002865	\N	\N
cmrc815z800ty75y6se046yne	DRF NARANJA	drf-naranja-mz64ay	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792222002827	\N	\N
cmrc815z800tz75y68yjpxqvx	DRF MENTOL	drf-mentol-444li7	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792222002780	\N	\N
cmrc815z800u075y6iycl0bzo	DRF ANIS	drf-anis-e4vs0o	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792222002841	\N	\N
cmrc815z800u175y6q1csips7	DRF LIMON	drf-limon-tpap5l	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792222002803	\N	\N
cmrc815z800u275y60q5a9714	GONGYS MARSHMALLOW FRUTILLA	gongys-marshmallow-frutilla-x090z0	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798186033570	\N	\N
cmrc815z800u375y631v4cjwz	GONGYS MARSHMALLOW NUBECITAS	gongys-marshmallow-nubecitas-civnxs	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798186033594	\N	\N
cmrc815z800u475y6mnmvdl97	BILLIKEN ROLLO GOMITAS	billiken-rollo-gomitas-1otc8t	\N	cmqz5vswb006uxhd8c5bcq86n	896	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77969729	\N	\N
cmrc815z800u575y6ytybvz9u	COLGATE CEPILLO MEDIO	colgate-cepillo-medio-adoeu6	\N	cmqz5vswb006uxhd8c5bcq86n	4256	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	6910021007206	\N	\N
cmrc815z800u675y6nrvbvigj	LECHE LASERENISIMA	leche-laserenisima-8tbuqu	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790742348302	\N	\N
cmrc815z800u775y61zuvri0z	MANTECA LA SERENISIMA	manteca-la-serenisima-u7gtia	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793940054006	\N	\N
cmrc815z800u875y6mnrr5tds	MANTECA LA SERENISIMA X 100G	manteca-la-serenisima-x-100g-h3wjlj	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793940052002	\N	\N
cmrc815z800u975y686agvlmz	mogulextreme	mogulextreme-8chwk7	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580129347	\N	\N
cmrc815z800ua75y6v3206105	7UP 1.5L	7up-1-5l-10tk9z	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791813444411	\N	\N
cmrc815z800ub75y6r0arfoem	CORMILLOT EDULCORANTE 250ML	cormillot-edulcorante-250ml-c0vbtk	\N	cmqz5vswb006uxhd8c5bcq86n	4032	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793046998495	\N	\N
cmrc815z800uc75y6g4lgcudh	NATURA MAYONESA 118G	natura-mayonesa-118g-0e3kgz	\N	cmqz5vswb006uxhd8c5bcq86n	1568	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791866001197	\N	\N
cmrc815z800ud75y6qbh6707a	NATURA KETCHUP 250G	natura-ketchup-250g-9ksi08	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791866000381	\N	\N
cmrc815z800ue75y634sfyzr5	NATURA MOSTAZA 250G	natura-mostaza-250g-17rt8t	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791866004211	\N	\N
cmrc815z800uf75y68xxkggqe	TOSTEX CINTITAS ANCHAS TOMATE Y OREGANO	tostex-cintitas-anchas-tomate-y-oregano-bcsjd6	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811542	\N	\N
cmrc815z800ug75y6k8fmbx6t	TOSTEX CINTITAS ANCHAS MOSTAZA Y MIEL	tostex-cintitas-anchas-mostaza-y-miel-sfv54k	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811559	\N	\N
cmrc815z800uh75y625mojhyp	TOSTEX CINTITAS ASADO	tostex-cintitas-asado-l8snxn	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811412	\N	\N
cmrc815z800ui75y62l15kffz	TOSTEX CINTITAS MILANESA	tostex-cintitas-milanesa-p1oj00	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811429	\N	\N
cmrc815z800uj75y6x6txugrr	TOSTEX CINTITAS CLASICAS	tostex-cintitas-clasicas-9pmabm	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125810354	\N	\N
cmrc815z900uk75y6fd6jwubs	TOSTEX CINTITAS BARBACOA	tostex-cintitas-barbacoa-mh08fg	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125810750	\N	\N
cmrc815z900ul75y6tfi0aipb	TOSTEX CINTITAS SALSA CHEDDAR PICANTE	tostex-cintitas-salsa-cheddar-picante-ant7xw	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811528	\N	\N
cmrc815z900um75y6g0it4pet	TOSTEX CINTITAS SALSA PANCETA AHUMADA	tostex-cintitas-salsa-panceta-ahumada-4dyk94	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811535	\N	\N
cmrc815z900un75y6vc1e35rq	TOSTEX CINTITAS KETCHUP	tostex-cintitas-ketchup-6dar2f	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125811221	\N	\N
cmrc815z900uo75y68ullkefx	TOSTEX CINTITAS SALAME	tostex-cintitas-salame-2qg64q	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125810965	\N	\N
cmrc815z900up75y6ltx0omr9	TOSTEX CINTITAS CEBOLLA	tostex-cintitas-cebolla-8ctx4y	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125810361	\N	\N
cmrc815z900uq75y69r2fmpda	TOSTEX CINTITAS CON SEMILLAS	tostex-cintitas-con-semillas-lvplrd	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7798125810446	\N	\N
cmrc815z900ur75y6qztody1b	SALCHICHAS SWIFT X 12	salchichas-swift-x-12-6fswqr	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790360983954	\N	\N
cmrc815z900us75y63ee7ft2h	FINLANDIA LIGHT	finlandia-light-zpk4sp	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790742321800	\N	\N
cmrc815z900ut75y61cqkiatv	ACEITUNA EN RODAJA	aceituna-en-rodaja-oe1srn	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792070001287	\N	\N
cmrc815z900uu75y6r0yucuuy	POETT LIMPIADOR LIQUIDO	poett-limpiador-liquido-kq78hv	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793253003548	\N	\N
cmrc815z900uv75y686if8ik9	CIF CREMA 250ML	cif-crema-250ml-3xdk30	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791290794238	\N	\N
cmrc815z900uw75y6vdflwka1	ESTANCIA MENDOZA BLANCO	estancia-mendoza-blanco-xt0q7g	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790314080203	\N	\N
cmrc815z900ux75y65pjfvzbf	DILEMA ROSA	dilema-rosa-nokwz3	\N	cmqz5vswb006uxhd8c5bcq86n	6944	0	5	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790314079733	\N	\N
cmrc815z900uy75y62e8mjeub	TE MANZANILLA LA VIRGINIA	te-manzanilla-la-virginia-u0pk7q	\N	cmqz5vswb006uxhd8c5bcq86n	2352	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790150330166	\N	\N
cmrc815z900uz75y6ix6z74lc	TE NEGRO LA VIRGINIA	te-negro-la-virginia-o9e6tu	\N	cmqz5vswb006uxhd8c5bcq86n	1232	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790150211908	\N	\N
cmrc815z900v075y6gl6cy5jj	GALLETAS VARIAS TERRABUSI	galletas-varias-terrabusi-dd2smv	\N	cmqz5vswb006uxhd8c5bcq86n	3920	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622202839962	\N	\N
cmrc815z900v175y6n3boy5gb	MINI PITUSAS	mini-pitusas-8p08w4	\N	cmqz5vswb006uxhd8c5bcq86n	1904	0	9	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7791324157046	\N	\N
cmrc815za00v275y6pus7mu17	SERVILLETAS ELEGANTE	servilletas-elegante-ktr44m	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793344902057	\N	\N
cmrc815za00v375y6omvfs66a	SWIFT PATE DE FOIE	swift-pate-de-foie-rpv5aj	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790360720382	\N	\N
cmrc815za00v475y6hpvqvqoy	PEP PALITOS PANCETA 84G	pep-palitos-panceta-84g-mz26br	\N	cmqz5vswb006uxhd8c5bcq86n	2576	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790310984291	\N	\N
cmrc815za00v575y6imm2i8bu	MUÑECO MYM	muneco-mym-sc30me	\N	cmqz5vswb006uxhd8c5bcq86n	1344	0	21	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	210	\N	\N
cmrc815za00v675y6k92snoto	PALITOS BON O BON 61G	palitos-bon-o-bon-61g-ur9y2p	\N	cmqz5vswb006uxhd8c5bcq86n	4704	0	15	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580140816	\N	\N
cmrc815za00v775y68ycbkdqe	JUGO ARCOR MANZANA 200C	jugo-arcor-manzana-200c-ch1dmp	\N	cmqz5vswb006uxhd8c5bcq86n	840	0	23	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580430504	\N	\N
cmrc815za00v875y63lolu57p	JUGO BC MULTIFRUTA 2200C	jugo-bc-multifruta-2200c-ealgzb	\N	cmqz5vswb006uxhd8c5bcq86n	840	0	24	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580154264	\N	\N
cmrc815za00v975y6k981jqha	JUGO BC NARANJA 200C	jugo-bc-naranja-200c-cw6jzk	\N	cmqz5vswb006uxhd8c5bcq86n	840	0	23	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580154240	\N	\N
cmrc815za00va75y67yj26lff	COFLER BLOCKAZO X1KG	cofler-blockazo-x1kg-qtoj9j	\N	cmqz5vswb006uxhd8c5bcq86n	34720	0	1	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580115579	\N	\N
cmrc815za00vb75y6ph9z03u9	AZUCAR LEDESMA	azucar-ledesma-yh5zv0	\N	cmqz5vswb006uxhd8c5bcq86n	3472	0	10	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792540250450	\N	\N
cmrc815za00vc75y64hy1b015	COFLER CHOCOLATE EXTRA COOKIE & CREAM 46G	cofler-chocolate-extra-cookie-cream-46g-77rmsx	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580124274	\N	\N
cmrc815za00vd75y62lzh9nin	COFLER CHOCOLATE EXTRA CHOCOTORTA 46G	cofler-chocolate-extra-chocotorta-46g-089wnh	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580126735	\N	\N
cmrc815za00ve75y6aczebwb7	COFLER CHOCOLATE EXTRA DOBLE MOUSSE 46G	cofler-chocolate-extra-doble-mousse-46g-dds145	\N	cmqz5vswb006uxhd8c5bcq86n	3136	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790580126254	\N	\N
cmrc815za00vf75y6klwhoqig	ALF. GUAYMALLEN RUBI 50G	alf-guaymallen-rubi-50g-hmww3k	\N	cmqz5vswb006uxhd8c5bcq86n	1120	0	22	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7796073001923	\N	\N
cmrc815za00vg75y6nmt0c8zg	ENCENDEDOR BIC MINI	encendedor-bic-mini-tisii4	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	70330913431	\N	\N
cmrc815za00vh75y6psg8mgtb	ENCENDEDOR BIC MAXI	encendedor-bic-maxi-2u7qr6	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	70330909229	\N	\N
cmrc815za00vi75y6mj5sx8t6	ENCENDEDOR BIC MAXI	encendedor-bic-maxi-rbo7o1	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	070330909229	\N	\N
cmrc815za00vj75y6cx7lib76	ENCENDEDOR BIC MINI	encendedor-bic-mini-ke6pu5	\N	cmqz5vswb006uxhd8c5bcq86n	2016	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	070330913431	\N	\N
cmrc815za00vk75y6j1ps37n4	LATA COCA COLA 473ML	lata-coca-cola-473ml-swxx3k	\N	cmqz5vswb006uxhd8c5bcq86n	2800	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790895643286	\N	\N
cmrc815za00vl75y6xr47tn0m	LAS ACHIRAS LENTEJAS 400G	las-achiras-lentejas-400g-fc4pwk	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790681002044	\N	\N
cmrc815za00vm75y6ujd8582d	ISENBECK LIV LATA 473CC	isenbeck-liv-lata-473cc-fzhndg	\N	cmqz5vswb006uxhd8c5bcq86n	2464	0	24	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7793147573515	\N	\N
cmrc815za00vn75y6f7wpm2ye	ALF. JORGITO BLANCO 55G	alf-jorgito-blanco-55g-g80vde	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	24	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790957000156	\N	\N
cmrc815za00vo75y6gs8bhja6	ALF. JORGITO NEGRO 55G	alf-jorgito-negro-55g-sryk94	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	22	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77905741	\N	\N
cmrc815za00vp75y6g2jbb0co	ESPONJA MULTIUSOS BRILHEX	esponja-multiusos-brilhex-agf4ey	\N	cmqz5vswb006uxhd8c5bcq86n	448	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7897750778692	\N	\N
cmrc815za00vq75y6nlkb9qo9	SHAMPOO SEDAL SACHET BALANCE	shampoo-sedal-sachet-balance-0uzkzw	\N	cmqz5vswb006uxhd8c5bcq86n	504	0	24	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77982704	\N	\N
cmrc815za00vr75y6vehv1cxr	CAFE TORRADO MOLIDO EN SAQUITOS 5 HISPANOS x SAQUITO	cafe-torrado-molido-en-saquitos-5-hispanos-x-saquito-yylzhk	\N	cmqz5vswb006uxhd8c5bcq86n	560	0	20	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794520865500	\N	\N
cmrc815za00vs75y6nktce9wh	PAPAS FRITAS SIN SAL KRACHITOS X55GR	papas-fritas-sin-sal-krachitos-x55gr-lbz3ga	\N	cmqz5vswb006uxhd8c5bcq86n	2520	0	3	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7794520868945	\N	\N
cmrc815za00vt75y6be98bn48	CONITO DDL JORGITO	conito-ddl-jorgito-eypl1w	\N	cmqz5vswb006uxhd8c5bcq86n	1680	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	77939722	\N	\N
cmrc815za00vu75y6segce3ht	GALLETAS OREO 118G	galletas-oreo-118g-h1pve6	\N	cmqz5vswb006uxhd8c5bcq86n	2240	0	6	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622201735272	\N	\N
cmrc815za00vv75y648ehzflq	MILKA AIREADO 50G	milka-aireado-50g-8d22am	\N	cmqz5vswb006uxhd8c5bcq86n	3024	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7622201818937	\N	\N
cmrc815za00vw75y6nzj8it0s	VINO TRUMPETER CABERNET 2024	vino-trumpeter-cabernet-2024-spn57s	\N	cmqz5vswb006uxhd8c5bcq86n	14000	0	4	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7790577002141	\N	\N
cmrc815za00vx75y639grrjkc	PATAGONIA 24.7 LATA 473ML	patagonia-24-7-lata-473ml-gany1r	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	12	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792798001972	\N	\N
cmrc815za00vy75y6ozjopy84	PATAGONIA AMBER LAGER LATA 473ML	patagonia-amber-lager-lata-473ml-3t39in	\N	cmqz5vswb006uxhd8c5bcq86n	5040	0	11	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7792798001965	\N	\N
cmrc815za00vz75y6rc7y8yp4	GUMMY FOOTBALLS	gummy-footballs-dezq1o	\N	cmqz5vswb006uxhd8c5bcq86n	784	0	27	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	795629759438	\N	\N
cmrc815za00w075y6m9hlmp3y	QUESO CREMOSO X KG	queso-cremoso-x-kg-6o4wwb	\N	cmqz5vswb006uxhd8c5bcq86n	11200	0	0	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	222	\N	\N
cmrc815za00w175y66intntie	CREMA DELTAL COLGATE 180G	crema-deltal-colgate-180g-35ukwa	\N	cmqz5vswb006uxhd8c5bcq86n	8960	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	7509546686509	\N	\N
cmrc815za00w275y610dvv25m	REXONA INVISIBLE	rexona-invisible-ebh65r	\N	cmqz5vswb006uxhd8c5bcq86n	5600	0	2	5	f	f	\N	\N	\N	2026-07-08 15:16:58.617	2026-07-08 15:16:58.617	\N	\N	\N	78944794	\N	\N
cmqz5vsxo007sxhd8av6s1rmm	Cerveza Artesanal Pinta	pinta-artesanal	Pinta de cerveza artesanal local.	cmqz5vswb006uxhd8c5bcq86n	3990	2793	24	5	f	f	\N	\N	\N	2026-06-29 11:55:48.924	2026-07-09 20:18:15.794	\N	\N	\N	\N	3800	5
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
cmrdy8h4o00027adl031pe8a3	cmqz5vsxo007sxhd8av6s1rmm	cmqz5vqxd000ixhd8e2wu3ki0
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
cmrcpsqjg00037nue72igl8ba	cmrc815yy00m975y6k0lurue0	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1783553654082-ushuaia-bg.webp	soyunaprueba2	0
cmrdy8h4000007adlg3vj1o47	cmqz5vsxo007sxhd8av6s1rmm	https://picsum.photos/seed/moovy-pinta-artesanal/600/600	Cerveza Artesanal Pinta	0
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
cmrgslj6o0009e1n6d892njy9	cmqz5vwfh00fzxhd8bchmmyw5	[{"id": "cmqz5vs80004exhd844e7zog3-default-1783800224678", "name": "Cordero Fueguino (1/2)", "type": "product", "image": "https://picsum.photos/seed/moovy-cordero-fueguino/600/600", "price": 28000, "quantity": 1, "productId": "cmqz5vs80004exhd844e7zog3", "merchantId": "cmqz5vs7q004axhd8fyr7ixm3", "merchantName": "La Estancia del Sur"}]	\N	0	\N	\N	28000	2026-07-11 20:03:45.886	2026-07-11 20:03:45.886
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

COPY public."SupportChat" (id, "userId", "merchantId", "operatorId", subject, category, status, priority, rating, "ratingComment", "lastMessageAt", "resolvedAt", "createdAt", "updatedAt", origin) FROM stdin;
cmrc2vw0f000113mgtop0d6rn	cmqz5vsvy006nxhd8cea1yx8k	cmqz5vswb006uxhd8c5bcq86n	\N	Problema con un pedido	general	resolved	normal	\N	\N	2026-07-08 23:51:22.93	2026-07-09 00:47:50.454	2026-07-08 12:52:54.35	2026-07-09 00:47:50.456	MERCHANT
cmrcsjs7o000d7nuefmjm1j2l	cmqz5vsvy006nxhd8cea1yx8k	cmqz5vswb006uxhd8c5bcq86n	cmrcsilkn00097nuetc7vfy53	Consulta general	general	closed	normal	\N	\N	2026-07-09 00:51:19.571	2026-07-09 00:58:59.213	2026-07-09 00:51:19.571	2026-07-09 00:58:59.215	MERCHANT
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportMessage" (id, "chatId", "senderId", content, "isFromAdmin", "isSystem", "isRead", "attachmentUrl", "attachmentType", "createdAt") FROM stdin;
cmrc2vw0f000313mglqhiykjm	cmrc2vw0f000113mgtop0d6rn	cmqz5vsvy006nxhd8cea1yx8k	Esto es un mensaje de prueba	f	f	t	\N	\N	2026-07-08 12:52:54.35
cmrc2y6hx000513mgml5n4sfh	cmrc2vw0f000113mgtop0d6rn	cmqz5vqsx0000xhd86fq6wm5d	Hola! Buen día!	t	f	t	\N	\N	2026-07-08 12:54:41.253
cmrcn38b500027nueukda4uf2	cmrc2vw0f000113mgtop0d6rn	cmqz5vsvy006nxhd8cea1yx8k	Como estas?	f	f	t	\N	\N	2026-07-08 22:18:29.201
cmrcqep0f00057nue9nm77cgx	cmrc2vw0f000113mgtop0d6rn	cmqz5vqsx0000xhd86fq6wm5d	fgd	t	f	t	\N	\N	2026-07-08 23:51:22.91
cmrcsfav100077nue73gpd1bb	cmrc2vw0f000113mgtop0d6rn	cmqz5vqsx0000xhd86fq6wm5d	El equipo de Moovy dio por finalizada esta consulta. Si necesitás más ayuda, podés iniciar una nueva cuando quieras. ¡Gracias!	t	f	t	\N	\N	2026-07-09 00:47:50.46
cmrcsjs7o000g7nue9imo8rn2	cmrcsjs7o000d7nuefmjm1j2l	cmqz5vqsx0000xhd86fq6wm5d	Admin MOOVY es tu operador asignado. En un momento te atiende, Diego Beagle.	t	t	t	\N	\N	2026-07-09 00:51:19.571
cmrcsjs7o000f7nuej6oaquld	cmrcsjs7o000d7nuefmjm1j2l	cmqz5vsvy006nxhd8cea1yx8k	No me acreditaron los ultimos puntos	f	f	t	\N	\N	2026-07-09 00:51:19.571
cmrcsthnf000m7nuerl0z0r0i	cmrcsjs7o000d7nuefmjm1j2l	cmqz5vqsx0000xhd86fq6wm5d	El equipo de Moovy dio por finalizada esta consulta. Si necesitás más ayuda, podés iniciar una nueva cuando quieras. ¡Gracias!	t	f	t	\N	\N	2026-07-09 00:58:52.443
cmrcstmvu000o7nue0s2qbsm0	cmrcsjs7o000d7nuefmjm1j2l	cmqz5vqsx0000xhd86fq6wm5d	El equipo de Moovy dio por finalizada esta consulta. Si necesitás más ayuda, podés iniciar una nueva cuando quieras. ¡Gracias!	t	f	t	\N	\N	2026-07-09 00:58:59.225
\.


--
-- Data for Name: SupportOperator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportOperator" (id, "userId", "displayName", "isActive", "isOnline", "maxChats", "lastSeenAt", "createdAt", "updatedAt") FROM stdin;
cmrcsilkn00097nuetc7vfy53	cmqz5vqsx0000xhd86fq6wm5d	Admin MOOVY	t	f	5	2026-07-09 00:51:43.484	2026-07-09 00:50:24.311	2026-07-09 00:51:43.486
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "privacyConsentAt", "termsConsentAt", "privacyConsentVersion", "termsConsentVersion", "age18Confirmed", "marketingConsent", "marketingConsentAt", "marketingConsentRevokedAt", "cookiesConsent", "cookiesConsentAt", "resetToken", "resetTokenExpiry", "deletedAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "archivedAt", "failedLoginAttempts", "loginLockedUntil", "onboardingCompletedAt", "pointsExpiryNotifiedAt") FROM stdin;
cmqz5vrw1002txhd87zyecnx4	comercio2@somosmoovy.com	$2b$12$oVMqCC2ghpHlJwVoXN6qhuXqtDCso2C7/AN3noGM2QEuHvAA9Unfi	Ana Falafel	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vrw1002uxhd8iip6q3hu	\N	2026-06-29 11:55:47.57	2026-06-29 11:55:47.57	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vs7g0043xhd8q2mrshtc	comercio3@somosmoovy.com	$2b$12$H5R6Tq23xOLGjA8RWik86u8y3wHOjhOjvWynZf/HYuNYYgglxZ4WK	Pedro Estancia	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vs7g0044xhd8kmxpsmub	\N	2026-06-29 11:55:47.98	2026-06-29 11:55:47.98	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vsl0005dxhd8sst0a1h3	comercio4@somosmoovy.com	$2b$12$gnL2yWnNJfz5eGCeXpo3g.RqX/2xlYjkg3knsYE5Y9.lkkq.IpMlq	Lucía Martial	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vsl0005exhd8t29yq40f	\N	2026-06-29 11:55:48.468	2026-06-29 11:55:48.468	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
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
cmqz5vwws00gbxhd8xdblt14z	cliente3@somosmoovy.com	$2b$12$9q91L9dMys9zsNJgBBKjgO3rmqK5OFExmfJJEbUojP7g8AJLw4Ufa	Lucía Test	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vwws00gcxhd8ifwc7bkh	\N	2026-06-29 11:55:54.076	2026-06-29 11:55:54.076	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vx5l00ghxhd8xnar59ix	cliente4@somosmoovy.com	$2b$12$EfMi32tg/BNF9KGFede11OJs3dScKvyk3ted7lL7Ds5MFgBQ80Hve	Marco Demo	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vx5l00gixhd8lk39samr	\N	2026-06-29 11:55:54.393	2026-06-29 11:55:54.393	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vqsx0000xhd86fq6wm5d	admin@somosmoovy.com	$2b$12$HFVjzgO.i0.sicgFCjfO..bH.EvNWZ82KtvUPoDfVJXaAyWqN.GF2	Admin MOOVY	Admin	MOOVY	\N	ADMIN	\N	\N	0	0	f	cmqz5vqsy0001xhd8ezz8nqma	\N	2026-06-29 11:55:46.16	2026-07-11 21:53:29.247	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	2026-07-11 21:53:29.246	\N
cmqz5vva600f3xhd89zcsytov	repartidor1@somosmoovy.com	$2b$12$wM6iMD5E3RXXdUr5GYnjc.ywxwzoF08aXzL.JKLJSHm0NzMKtQ3RW	Mateo Rider	\N	\N	\N	DRIVER	\N	\N	0	0	f	cmqz5vva600f4xhd8q48id7j2	\N	2026-06-29 11:55:51.966	2026-06-29 12:11:39.124	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	\N	\N
cmqz5vrgz001jxhd84w7eneza	comercio1@somosmoovy.com	$2b$12$yF6/4feNZrmKkGW/zI752eg44jwODi1JejVllozBQ6DuoL3r0r.vm	Carlos Patagonia	\N	\N	\N	COMERCIO	\N	\N	0	0	f	cmqz5vrgz001kxhd8fe0upbjz	\N	2026-06-29 11:55:47.028	2026-07-06 23:20:58.373	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	2026-07-06 23:20:58.372	\N
cmqz5vwo300g5xhd8ok66ryk2	cliente2@somosmoovy.com	$2b$12$9TQLXmAHdwsUyp76bGzOIuvt4C7CsmL.3ESB7Zwi233KqW5.aluKe	Pedro Comprador	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vwo300g6xhd8fo4i2nby	\N	2026-06-29 11:55:53.763	2026-07-06 23:32:32.958	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	2026-07-06 23:32:32.921	\N
cmqz5vsvy006nxhd8cea1yx8k	comercio5@somosmoovy.com	$2b$12$MvXMTxOTp5U2ujTaqygif.37Whxp97s8kSiR7D.jXmok.DPmVC8uu	 				COMERCIO	\N	\N	0	0	f	cmqz5vsvy006oxhd85im89bep	\N	2026-06-29 11:55:48.862	2026-07-11 03:01:00.38	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	2026-07-07 14:53:34.731	\N
cmqz5vwfh00fzxhd8bchmmyw5	cliente1@somosmoovy.com	$2b$12$7ZFsSIglT1XVS/UewQDNYO4T.UjlCul7h9mv6sCYTJ4N.xVVgJYNO	Juana Cliente	\N	\N	\N	USER	\N	\N	0	0	f	cmqz5vwfh00g0xhd8w7w3k570	\N	2026-06-29 11:55:53.453	2026-07-11 19:45:40.136	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	0	\N	2026-07-02 21:17:16.557	\N
\.


--
-- Data for Name: UserActivityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserActivityLog" (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmqz6fb5e0001hf7e3liafkb8	cmqz5vqsx0000xhd86fq6wm5d	LOGIN	User	cmqz5vqsx0000xhd86fq6wm5d	{"method":"credentials"}	\N	\N	2026-06-29 12:10:58.993
cmqz6g65q0003hf7e2t569gbl	cmqz5vva600f3xhd89zcsytov	LOGIN	User	cmqz5vva600f3xhd89zcsytov	{"method":"credentials"}	\N	\N	2026-06-29 12:11:39.182
cmr409ans0008mh52hvpalfde	cmqz5vwfh00fzxhd8bchmmyw5	LOGIN	User	cmqz5vwfh00fzxhd8bchmmyw5	{"method":"credentials"}	\N	\N	2026-07-02 21:17:11.601
cmr9gvuyi0001pygohno5fzyn	cmqz5vqsx0000xhd86fq6wm5d	LOGIN	User	cmqz5vqsx0000xhd86fq6wm5d	{"method":"credentials"}	\N	\N	2026-07-06 17:01:29.081
cmr9ufs770001wqmnxf42ts4e	cmqz5vrgz001jxhd84w7eneza	LOGIN	User	cmqz5vrgz001jxhd84w7eneza	{"method":"credentials"}	\N	\N	2026-07-06 23:20:53.634
cmr9um4gn0003wqmnj37zh32v	cmqz5vsvy006nxhd8cea1yx8k	LOGIN	User	cmqz5vsvy006nxhd8cea1yx8k	{"method":"credentials"}	\N	\N	2026-07-06 23:25:49.463
cmr9uupfm0006wqmnjkz2y392	cmqz5vwo300g5xhd8ok66ryk2	LOGIN	User	cmqz5vwo300g5xhd8ok66ryk2	{"method":"credentials"}	\N	\N	2026-07-06 23:32:29.89
cmrgry9gv0001e1n6gca9v1hy	cmqz5vwfh00fzxhd8bchmmyw5	LOGIN	User	cmqz5vwfh00fzxhd8bchmmyw5	{"method":"credentials"}	\N	\N	2026-07-11 19:45:40.205
cmrgwhnd7000be1n6n9givedj	cmqz5vqsx0000xhd86fq6wm5d	LOGIN	User	cmqz5vqsx0000xhd86fq6wm5d	{"method":"credentials"}	\N	\N	2026-07-11 21:52:43.146
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
-- Name: Product_deletedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_deletedAt_idx" ON public."Product" USING btree ("deletedAt");


--
-- Name: Product_merchantId_barcode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_merchantId_barcode_key" ON public."Product" USING btree ("merchantId", barcode);


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
-- Name: SupportChat_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_merchantId_idx" ON public."SupportChat" USING btree ("merchantId");


--
-- Name: SupportChat_operatorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_operatorId_idx" ON public."SupportChat" USING btree ("operatorId");


--
-- Name: SupportChat_origin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SupportChat_origin_idx" ON public."SupportChat" USING btree (origin);


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


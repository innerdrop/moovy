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
    "licenciaUrl" text,
    "seguroUrl" text,
    "vtvUrl" text,
    "dniFrenteUrl" text,
    "dniDorsoUrl" text,
    "acceptedTermsAt" timestamp(3) without time zone,
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
    ubicacion public.geography,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "fraudScore" integer DEFAULT 0 NOT NULL,
    "lastFraudCheckAt" timestamp(3) without time zone,
    "acceptedPrivacyAt" timestamp(3) without time zone,
    "cedulaVerdeApprovedAt" timestamp(3) without time zone,
    "cedulaVerdeExpiresAt" timestamp(3) without time zone,
    "cedulaVerdeNotifiedStage" integer DEFAULT 0 NOT NULL,
    "cedulaVerdeRejectionReason" text,
    "cedulaVerdeStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "cedulaVerdeUrl" text,
    "constanciaCuitApprovedAt" timestamp(3) without time zone,
    "constanciaCuitRejectionReason" text,
    "constanciaCuitStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "constanciaCuitUrl" text,
    "cuitApprovedAt" timestamp(3) without time zone,
    "cuitRejectionReason" text,
    "cuitStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "dniDorsoApprovedAt" timestamp(3) without time zone,
    "dniDorsoRejectionReason" text,
    "dniDorsoStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "dniFrenteApprovedAt" timestamp(3) without time zone,
    "dniFrenteRejectionReason" text,
    "dniFrenteStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "licenciaApprovedAt" timestamp(3) without time zone,
    "licenciaExpiresAt" timestamp(3) without time zone,
    "licenciaNotifiedStage" integer DEFAULT 0 NOT NULL,
    "licenciaRejectionReason" text,
    "licenciaStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "seguroApprovedAt" timestamp(3) without time zone,
    "seguroExpiresAt" timestamp(3) without time zone,
    "seguroNotifiedStage" integer DEFAULT 0 NOT NULL,
    "seguroRejectionReason" text,
    "seguroStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "vtvApprovedAt" timestamp(3) without time zone,
    "vtvExpiresAt" timestamp(3) without time zone,
    "vtvNotifiedStage" integer DEFAULT 0 NOT NULL,
    "vtvRejectionReason" text,
    "vtvStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "cedulaVerdeApprovalNote" text,
    "cedulaVerdeApprovalSource" text,
    "constanciaCuitApprovalNote" text,
    "constanciaCuitApprovalSource" text,
    "cuitApprovalNote" text,
    "cuitApprovalSource" text,
    "dniDorsoApprovalNote" text,
    "dniDorsoApprovalSource" text,
    "dniFrenteApprovalNote" text,
    "dniFrenteApprovalSource" text,
    "licenciaApprovalNote" text,
    "licenciaApprovalSource" text,
    "seguroApprovalNote" text,
    "seguroApprovalSource" text,
    "vtvApprovalNote" text,
    "vtvApprovalSource" text,
    "bankAccountUpdatedAt" timestamp(3) without time zone,
    "bankAlias" text,
    "bankCbu" text,
    "applicationStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "cancelledByUserAt" timestamp(3) without time zone,
    "cancelledByUserReason" text,
    "pausedByUserAt" timestamp(3) without time zone,
    "pausedByUserReason" text
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "deletedReason" text
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
    ubicacion public.geography,
    "loyaltyTier" text DEFAULT 'BRONCE'::text NOT NULL,
    "loyaltyOrderCount" integer DEFAULT 0 NOT NULL,
    "loyaltyUpdatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "commissionOverride" double precision,
    "commissionOverrideReason" text,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "loyaltyTierLocked" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "firstOrderWelcomeSentAt" timestamp(3) without time zone,
    "bankAccountApprovedAt" timestamp(3) without time zone,
    "bankAccountRejectionReason" text,
    "bankAccountStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "constanciaAfipApprovedAt" timestamp(3) without time zone,
    "constanciaAfipRejectionReason" text,
    "constanciaAfipStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "cuitApprovedAt" timestamp(3) without time zone,
    "cuitRejectionReason" text,
    "cuitStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "habilitacionMunicipalApprovedAt" timestamp(3) without time zone,
    "habilitacionMunicipalRejectionReason" text,
    "habilitacionMunicipalStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "registroSanitarioApprovedAt" timestamp(3) without time zone,
    "registroSanitarioRejectionReason" text,
    "registroSanitarioStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "bankAccountApprovalNote" text,
    "bankAccountApprovalSource" text,
    "constanciaAfipApprovalNote" text,
    "constanciaAfipApprovalSource" text,
    "cuitApprovalNote" text,
    "cuitApprovalSource" text,
    "habilitacionMunicipalApprovalNote" text,
    "habilitacionMunicipalApprovalSource" text,
    "registroSanitarioApprovalNote" text,
    "registroSanitarioApprovalSource" text,
    "applicationStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "cancelledByUserAt" timestamp(3) without time zone,
    "cancelledByUserReason" text,
    "pausedByUserAt" timestamp(3) without time zone,
    "pausedByUserReason" text
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
    "driverRating" integer,
    "merchantPayout" double precision DEFAULT 0,
    "moovyCommission" double precision DEFAULT 0,
    "ratedAt" timestamp(3) without time zone,
    "ratingComment" text,
    "merchantRating" integer,
    "merchantRatingComment" text,
    "sellerRating" integer,
    "sellerRatingComment" text,
    "assignmentAttempts" integer DEFAULT 0 NOT NULL,
    "assignmentExpiresAt" timestamp(3) without time zone,
    "attemptedDriverIds" jsonb,
    "lastAssignmentAt" timestamp(3) without time zone,
    "pendingDriverId" text,
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
    "pointsEarned" integer,
    "pointsUsed" integer,
    "deliveryPin" text,
    "deliveryPinAttempts" integer DEFAULT 0 NOT NULL,
    "deliveryPinVerifiedAt" timestamp(3) without time zone,
    "failedDeliveryAt" timestamp(3) without time zone,
    "failedDeliveryReason" text,
    "pickupPin" text,
    "pickupPinAttempts" integer DEFAULT 0 NOT NULL,
    "pickupPinVerifiedAt" timestamp(3) without time zone,
    "nearDestinationNotified" boolean DEFAULT false NOT NULL,
    "rateReminderSentAt" timestamp(3) without time zone,
    "driverStatus" text DEFAULT 'ASSIGNED'::text,
    "merchantStatus" text DEFAULT 'PREPARING'::text,
    "noShowFlag" boolean DEFAULT false NOT NULL,
    "noShowReportedAt" timestamp(3) without time zone,
    "payoutHoldUntil" timestamp(3) without time zone,
    "waitingStartedAt" timestamp(3) without time zone,
    "driverRatingModerationStatus" text DEFAULT 'AUTO_APPROVED'::text NOT NULL,
    "driverRatingReportCount" integer DEFAULT 0 NOT NULL,
    "driverTipAmount" double precision,
    "driverTipDeclaredAt" timestamp(3) without time zone,
    "driverTipMethod" text,
    "merchantRatingModerationStatus" text DEFAULT 'AUTO_APPROVED'::text NOT NULL,
    "merchantRatingReportCount" integer DEFAULT 0 NOT NULL,
    "sellerRatingModerationStatus" text DEFAULT 'AUTO_APPROVED'::text NOT NULL,
    "sellerRatingReportCount" integer DEFAULT 0 NOT NULL
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
    "packageCategoryId" text,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "deletedReason" text,
    "volumeMl" integer,
    "weightGrams" integer
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cartValue" double precision DEFAULT 0 NOT NULL,
    "lastRemindedAt" timestamp(3) without time zone,
    "recoveredAt" timestamp(3) without time zone,
    "reminderCount" integer DEFAULT 0 NOT NULL
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
    "bankAlias" text,
    "bankCbu" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
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
    "preparationMinutes" integer DEFAULT 15 NOT NULL,
    "scheduleEnabled" boolean DEFAULT false NOT NULL,
    "scheduleJson" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "acceptedPrivacyAt" timestamp(3) without time zone,
    "applicationStatus" text DEFAULT 'DRAFT'::text NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "cancelledByUserAt" timestamp(3) without time zone,
    "cancelledByUserReason" text,
    "pausedByUserAt" timestamp(3) without time zone,
    "pausedByUserReason" text,
    "rejectionReason" text
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
    "operationalCostPercent" double precision DEFAULT 5 NOT NULL,
    "defaultMerchantCommission" double precision DEFAULT 8 NOT NULL,
    "defaultSellerCommission" double precision DEFAULT 12 NOT NULL,
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
    "bankCuit" text DEFAULT ''::text NOT NULL,
    "supportChatEnabled" boolean DEFAULT true NOT NULL,
    "excludedZonesJson" text DEFAULT '[]'::text NOT NULL
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
    "deliveryPin" text,
    "deliveryPinAttempts" integer DEFAULT 0 NOT NULL,
    "deliveryPinVerifiedAt" timestamp(3) without time zone,
    "failedDeliveryAt" timestamp(3) without time zone,
    "failedDeliveryReason" text,
    "pickupPin" text,
    "pickupPinAttempts" integer DEFAULT 0 NOT NULL,
    "pickupPinVerifiedAt" timestamp(3) without time zone,
    "nearDestinationNotified" boolean DEFAULT false NOT NULL,
    "driverPayoutAmount" double precision,
    "merchantCommissionRate" double precision,
    "merchantCommissionSource" text,
    "operationalCost" double precision,
    "tripCost" double precision,
    "zoneCode" text,
    "zoneDriverBonus" integer,
    "zoneMultiplier" double precision,
    "driverStatus" text DEFAULT 'ASSIGNED'::text,
    "merchantStatus" text DEFAULT 'PREPARING'::text,
    "noShowFlag" boolean DEFAULT false NOT NULL,
    "noShowReportedAt" timestamp(3) without time zone,
    "payoutHoldUntil" timestamp(3) without time zone,
    "waitingStartedAt" timestamp(3) without time zone
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
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "suspendedAt" timestamp(3) without time zone,
    "suspendedUntil" timestamp(3) without time zone,
    "suspensionReason" text,
    "onboardingCompletedAt" timestamp(3) without time zone,
    "age18Confirmed" boolean DEFAULT false NOT NULL,
    "cookiesConsent" text,
    "cookiesConsentAt" timestamp(3) without time zone,
    "marketingConsent" boolean DEFAULT false NOT NULL,
    "marketingConsentAt" timestamp(3) without time zone,
    "marketingConsentRevokedAt" timestamp(3) without time zone,
    "privacyConsentVersion" text,
    "termsConsentVersion" text,
    "pointsExpiryNotifiedAt" timestamp(3) without time zone,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "loginLockedUntil" timestamp(3) without time zone
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
cmoh6gxjr000if2mibnk25dk4	cmodwjkyu000hornifywezk15	HERO_BANNER	CANCELLED	\N	\N	125000	250000	ARS	pending	mercadopago	\N	\N	\N	\N	\N	\N	2026-04-27 12:32:58.839	2026-04-27 12:35:10.801	2026-04-27 12:34:27.338	\N
cmoh6k6w6000lf2mi5s5hoydr	cmodwjkyu000hornifywezk15	HERO_BANNER	REJECTED	\N	\N	125000	250000	ARS	pending	mercadopago	\N	\N	\N	\N	\N	Solicitud rechazada	2026-04-27 12:35:30.918	2026-04-27 12:35:51.054	\N	\N
\.


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Address" (id, "userId", label, street, number, apartment, neighborhood, city, province, "zipCode", latitude, longitude, "isDefault", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmoeenq9m00012klvxu1tnird	cmodw2bcv0004ornia10d6of8	Entrega	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-04-25 13:58:54.392	2026-04-25 13:58:54.392	\N
cmogjcorb000aqk064ybw380k	cmodw2bcv0004ornia10d6of8	Entrega	Retiro en local	S/N	\N	\N	Ushuaia	Tierra del Fuego	\N	\N	\N	f	2026-04-27 01:45:49.654	2026-04-27 01:45:49.654	\N
cmomchf3c0007svo36ldvyxwi	cmoem7nkg0001k8grd394va3v	Entrega	Aonikenk	1516	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8176153	-68.3464798	f	2026-05-01 03:20:10.153	2026-05-01 03:20:10.153	\N
cmomdjkz90009svo3ynf85bpk	cmoem7nkg0001k8grd394va3v	Entrega	Aonikenk	1516	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8176153	-68.3464798	f	2026-05-01 03:49:50.709	2026-05-01 03:49:50.709	\N
cmpa7uq8k00118eo0a8thbg5c	cmobkazic0002w4k6sk1luhha	Mi Casa	Del Río	1000	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8317324	-68.3504155	f	2026-05-17 20:17:01.269	2026-05-17 20:17:01.269	\N
cmpa7bwwx000y8eo0crma5ovi	cmobkazic0002w4k6sk1luhha	Mi Casa	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	f	2026-05-17 20:02:23.457	2026-05-17 20:17:03.845	2026-05-17 20:17:03.843
cmpa8teep00178eo0930fbdvt	cmobkazic0002w4k6sk1luhha	Casa 2	Del Recodo	2310	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.83143375916957	-68.35045167280755	f	2026-05-17 20:43:58.897	2026-05-17 20:43:58.897	\N
cmot172f40003131uc2j5g0zj	cmoqaeh2r0000erma67dv4jv8	Casa Centro (Zona A)	Avenida San Martín	850	\N	Centro	Ushuaia	Tierra del Fuego	\N	-54.806	-68.302	t	2026-05-05 19:38:34.625	2026-05-05 19:38:34.625	\N
cmot172g50007131uxqmzgn4o	cmoqaeh2r0000erma67dv4jv8	Casa Alta (Zona C)	Haruwen	2329	\N	Zona Alta	Ushuaia	Tierra del Fuego	\N	-54.785	-68.32	f	2026-05-05 19:38:34.661	2026-05-05 19:38:34.661	\N
cmoqaeh380003erma4lb06j8k	cmoqaeh2r0000erma67dv4jv8	Casa	Avenida San Martín	1234	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.806	-68.31	f	2026-05-03 21:32:58.244	2026-05-05 19:38:34.682	2026-05-05 19:38:34.678
cmot172u3000b131uhjcwd9sf	cmoqaehbn0004erma23omyvjs	Comercio	Magallanes	250	\N	Centro	Ushuaia	Tierra del Fuego	\N	-54.808	-68.309	t	2026-05-05 19:38:35.163	2026-05-05 19:38:35.163	\N
cmoqaehbw0007ermazuc2erst	cmoqaehbn0004erma23omyvjs	Comercio	Avenida Maipú	363	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.804	-68.306	f	2026-05-03 21:32:58.556	2026-05-05 19:38:35.169	2026-05-05 19:38:35.166
cmot17358000r131u0ml95u2z	cmoqaehm7000kerma58f7mpn4	Casa	Magallanes	600	\N	Centro	Ushuaia	Tierra del Fuego	\N	-54.807	-68.311	t	2026-05-05 19:38:35.565	2026-05-05 19:38:35.565	\N
cmoqaehml000nermakrmtcqaf	cmoqaehm7000kerma58f7mpn4	Casa	Avenida Don Bosco	1100	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.799	-68.314	f	2026-05-03 21:32:58.941	2026-05-05 19:38:35.569	2026-05-05 19:38:35.567
cmot173f3000x131u16hhr52j	cmoqaehxc000qermah0y0rpfy	Casa	Magallanes	900	\N	Centro	Ushuaia	Tierra del Fuego	\N	-54.806	-68.313	t	2026-05-05 19:38:35.92	2026-05-05 19:38:35.92	\N
cmoqaehxl000terma1lbaa0rx	cmoqaehxc000qermah0y0rpfy	Casa	Magallanes	444	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.812	-68.318	f	2026-05-03 21:32:59.337	2026-05-05 19:38:35.924	2026-05-05 19:38:35.922
cmot172fw0005131uzeadwr9h	cmoqaeh2r0000erma67dv4jv8	Casa Intermedia (Zona B)	Las Primulas	191	\N	Intermedia	Ushuaia	Tierra del Fuego	\N	-54.793	-68.31	f	2026-05-05 19:38:34.652	2026-05-05 21:56:44.484	2026-05-05 21:56:44.481
cmot64es0000857wk4t272buo	cmoqaeh2r0000erma67dv4jv8	Zona Intermedia	Las Prímulas	50	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.7962626	-68.3065671	f	2026-05-05 21:56:28.751	2026-05-05 21:56:47.445	2026-05-05 21:56:47.444
cmot655mp000b57wkzckagybe	cmoqaeh2r0000erma67dv4jv8	Casa Intermedia (Zona B)	Las Prímulas	50	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.7962626	-68.3065671	f	2026-05-05 21:57:03.553	2026-05-05 22:22:35.486	2026-05-05 22:22:35.481
cmot72quk0002ruh6enu88bd2	cmoqaeh2r0000erma67dv4jv8	Casa Zona B Intermedia	Las Aljabas	100	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.7970152	-68.3055868	f	2026-05-05 22:23:10.699	2026-05-05 22:23:10.699	\N
cmoubv255000sdndem76eks2g	cmoqaeh2r0000erma67dv4jv8	Casa	Paseo de la Plaza	2165	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.8283965	-68.3506829	f	2026-05-06 17:24:56.344	2026-05-06 17:24:56.344	\N
cmodgzqlk000l12ll65at8uo7	cmobkazic0002w4k6sk1luhha	Casa 1	De la Estancia	2057	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.829691	-68.350002	f	2026-04-24 22:16:27.752	2026-05-17 20:02:30.662	2026-05-17 20:02:30.661
\.


--
-- Data for Name: AdminNote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminNote" (id, "userId", "adminId", content, pinned, "createdAt", "updatedAt") FROM stdin;
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
cmobln7qe000fw4k6u58merut	MERCHANT_APPROVED	Merchant	cmobll552000cw4k6blur8j08	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"9410","merchantOwnerId":"cmobkazic0002w4k6sk1luhha","adminEmail":"maurod@me.com"}	2026-04-23 14:51:09.155
cmobtxhhc0013tqiautynr1xn	DRIVER_APPROVED	Driver	cmobtv7ww000stqiamj6sh7w5	cmnuzx1fg0002zgw8zimoxguz	{"driverUserId":"cmobtv7wq000ptqia8qc32mkw","adminEmail":"maurod@me.com"}	2026-04-23 18:43:05.28
cmod1tnej0002nd2lqf5ryhes	DRIVER_APPROVED	Driver	cmocz8aty0001ju1tiijq1c94	cmnuzx1fg0002zgw8zimoxguz	{"driverUserId":"cmobkazic0002w4k6sk1luhha","adminEmail":"maurod@me.com"}	2026-04-24 15:11:49.435
cmod65qoj000xsabwlhcmrf8h	EMAIL_TEMPLATE_SEEDED	EmailTemplate	bulk	cmnuzx1fg0002zgw8zimoxguz	{"created":32,"skipped":0,"totalInRegistry":32,"errors":[]}	2026-04-24 17:13:12.019
cmod6qe060011sabwowwnbq33	ADMIN_NOTE_CREATED	AdminNote	cmod6qdzc000zsabw6h1gyo25	cmnuzx1fg0002zgw8zimoxguz	{"targetUserId":"cmobkazic0002w4k6sk1luhha","pinned":false,"length":18}	2026-04-24 17:29:15.366
cmod6rbkd0013sabwwxma8t9r	ADMIN_NOTE_UPDATED	AdminNote	cmod6qdzc000zsabw6h1gyo25	cmnuzx1fg0002zgw8zimoxguz	{"targetUserId":"cmobkazic0002w4k6sk1luhha","changed":["pinned"],"pinned":true}	2026-04-24 17:29:58.861
cmod6rs610015sabwmmoyq6w9	ADMIN_NOTE_DELETED	AdminNote	cmod6qdzc000zsabw6h1gyo25	cmnuzx1fg0002zgw8zimoxguz	{"targetUserId":"cmobkazic0002w4k6sk1luhha","authorId":"cmnuzx1fg0002zgw8zimoxguz","pinned":true,"content":"Solo es una prueba"}	2026-04-24 17:30:20.377
cmod6z31s0018sabwohmp754m	PLAYBOOK_CREATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","category":"onboarding"}	2026-04-24 17:36:01.072
cmod6z5wq001csabwmn3689jj	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z5we001asabwb7qvcnej	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","checklistName":"Alta de comercio nuevo","content":"Contactar al comercio en 24h por WhatsApp o llamada","required":true,"order":0}	2026-04-24 17:36:04.779
cmod6z5yr001gsabw364xbyot	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z5yi001esabw3pi0pmtt	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","checklistName":"Alta de comercio nuevo","content":"Verificar docs AFIP y habilitación municipal","required":true,"order":1}	2026-04-24 17:36:04.852
cmod6z60p001ksabwanrqguux	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z60l001isabwlgldi13f	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","checklistName":"Alta de comercio nuevo","content":"Revisar foto de fachada y del local","required":true,"order":2}	2026-04-24 17:36:04.922
cmod6z631001osabwmt809vpa	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z62w001msabw5w00445x	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","checklistName":"Alta de comercio nuevo","content":"Aprobar en OPS si todo está OK","required":true,"order":3}	2026-04-24 17:36:05.006
cmod6z64p001ssabwhmj7d6xp	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z64h001qsabwsgb9sp8n	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","checklistName":"Alta de comercio nuevo","content":"Enviar email de bienvenida manual si algo no está claro","required":false,"order":4}	2026-04-24 17:36:05.065
cmod6z66g001vsabwx547yybz	PLAYBOOK_CREATED	PlaybookChecklist	cmod6z664001tsabwiv6oxc30	cmnuzx1fg0002zgw8zimoxguz	{"name":"Revisión de docs de driver","category":"approval"}	2026-04-24 17:36:05.128
cmod6z68f001zsabw8uvbho5v	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z683001xsabwgnwjkypl	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z664001tsabwiv6oxc30","checklistName":"Revisión de docs de driver","content":"Verificar que el DNI coincide con la foto de perfil","required":true,"order":0}	2026-04-24 17:36:05.2
cmod6z6al0023sabwgx2kktik	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6ab0021sabwurwbzb63	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z664001tsabwiv6oxc30","checklistName":"Revisión de docs de driver","content":"Chequear que la licencia de conducir esté vigente","required":true,"order":1}	2026-04-24 17:36:05.278
cmod6z6cl0027sabwq42s8e8e	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6ca0025sabwp7pecrqw	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z664001tsabwiv6oxc30","checklistName":"Revisión de docs de driver","content":"Validar que el seguro del vehículo esté al día","required":true,"order":2}	2026-04-24 17:36:05.349
cmod6z6f9002bsabwbhoot0zz	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6ex0029sabwvlqgiqpq	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z664001tsabwiv6oxc30","checklistName":"Revisión de docs de driver","content":"Confirmar CUIT/Monotributo activo en AFIP","required":true,"order":3}	2026-04-24 17:36:05.445
cmod6z6in002fsabw93wo6ia8	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6i8002dsabwnz5yn1d5	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z664001tsabwiv6oxc30","checklistName":"Revisión de docs de driver","content":"Aprobar cada doc individualmente desde el panel","required":true,"order":4}	2026-04-24 17:36:05.567
cmod6z6kh002isabwpoylv2nd	PLAYBOOK_CREATED	PlaybookChecklist	cmod6z6k1002gsabwf3su5l33	cmnuzx1fg0002zgw8zimoxguz	{"name":"Pedido demorado >30 min","category":"incident"}	2026-04-24 17:36:05.634
cmpcq9wwh00773op83fzhgipb	BULK_IMPORT_PRODUCTS	Product	import-2026-05-19T14:28:15.184Z	cmnuzx1fg0002zgw8zimoxguz	{"totalRows":63,"created":63,"skipped":0,"errors":0,"dryRun":false}	2026-05-19 14:28:15.185
cmod6z6m1002msabwu5i222s8	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6lx002ksabw24vpzetq	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6k1002gsabwf3su5l33","checklistName":"Pedido demorado >30 min","content":"Abrir el pedido en /ops/pedidos","required":true,"order":0}	2026-04-24 17:36:05.69
cmod6z6o3002qsabw07azc243	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6nu002osabw1zktvshu	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6k1002gsabwf3su5l33","checklistName":"Pedido demorado >30 min","content":"Verificar estado del driver en tiempo real","required":true,"order":1}	2026-04-24 17:36:05.764
cmod6z6rx002usabwu3g7g1ry	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6rs002ssabwpgu8av3f	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6k1002gsabwf3su5l33","checklistName":"Pedido demorado >30 min","content":"Intentar reasignar driver si corresponde","required":true,"order":2}	2026-04-24 17:36:05.901
cmod6z6u4002ysabw56pvq20d	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6tt002wsabw98x6tg78	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6k1002gsabwf3su5l33","checklistName":"Pedido demorado >30 min","content":"Contactar al buyer por el chat del pedido","required":true,"order":3}	2026-04-24 17:36:05.98
cmod6z6wn0032sabw3t3dgi08	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6we0030sabwod16cnvf	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6k1002gsabwf3su5l33","checklistName":"Pedido demorado >30 min","content":"Si no se puede resolver, cancelar + refund manual","required":false,"order":4}	2026-04-24 17:36:06.071
cmod6z6ye0035sabwzbdeya23	PLAYBOOK_CREATED	PlaybookChecklist	cmod6z6y10033sabw3kz5ox27	cmnuzx1fg0002zgw8zimoxguz	{"name":"Reclamo de comercio por pago","category":"escalation"}	2026-04-24 17:36:06.134
cmod6z6zv0039sabwe2l54uah	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z6zq0037sabw8tkqsdsv	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6y10033sabw3kz5ox27","checklistName":"Reclamo de comercio por pago","content":"Abrir ficha del comercio en /ops/usuarios/[id]","required":true,"order":0}	2026-04-24 17:36:06.187
cmod6z71k003dsabwq51cfpl7	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z71e003bsabwz9odcdnw	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6y10033sabw3kz5ox27","checklistName":"Reclamo de comercio por pago","content":"Revisar los últimos pedidos DELIVERED","required":true,"order":1}	2026-04-24 17:36:06.248
cmod6z73c003hsabwvknlpaoo	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z734003fsabwdu1dpa1r	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6y10033sabw3kz5ox27","checklistName":"Reclamo de comercio por pago","content":"Consultar el estado de MP en la sección Pagos","required":true,"order":2}	2026-04-24 17:36:06.312
cmod6z74w003lsabwc4jep72c	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z74s003jsabw1t3ppiil	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6y10033sabw3kz5ox27","checklistName":"Reclamo de comercio por pago","content":"Si hay retención legítima, explicarle al comercio por WhatsApp","required":true,"order":3}	2026-04-24 17:36:06.369
cmod6z76p003psabw2fxi48xk	PLAYBOOK_STEP_CREATED	PlaybookStep	cmod6z76k003nsabwn3jd8sxx	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z6y10033sabw3kz5ox27","checklistName":"Reclamo de comercio por pago","content":"Documentar la conversación con una nota interna","required":true,"order":4}	2026-04-24 17:36:06.433
cmodbxi0z0002dw8wupxc3kxk	DRIVER_DOCUMENT_APPROVED	Driver	cmobtv7ww000stqiamj6sh7w5	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"cuit","documentLabel":"CUIT/CUIL","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-24 19:54:45.251
cmodbyb5s0005dw8wv29y7vhm	DRIVER_REJECTED	Driver	cmobtv7ww000stqiamj6sh7w5	cmnuzx1fg0002zgw8zimoxguz	{"driverUserId":"cmobtv7wq000ptqia8qc32mkw","adminEmail":"maurod@me.com","reason":"Aun falta documentación"}	2026-04-24 19:55:23.009
cmodga9ko000112llaqtg9jr3	PLAYBOOK_UPDATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","changes":{"category":"approval"}}	2026-04-24 21:56:39.287
cmodgaaxa000312llrxg42h25	PLAYBOOK_UPDATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","changes":{"category":"onboarding"}}	2026-04-24 21:56:41.038
cmodgayd5000512ll66waeah1	PLAYBOOK_STEP_UPDATED	PlaybookStep	cmod6z62w001msabw5w00445x	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","changes":{"required":false}}	2026-04-24 21:57:11.417
cmodgaydd000712llepe25l6m	PLAYBOOK_STEP_UPDATED	PlaybookStep	cmod6z62w001msabw5w00445x	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","changes":{"required":true}}	2026-04-24 21:57:11.426
cmodgb2g2000912llyzurb86k	PLAYBOOK_STEP_UPDATED	PlaybookStep	cmod6z62w001msabw5w00445x	cmnuzx1fg0002zgw8zimoxguz	{"checklistId":"cmod6z3110016sabw6q3gycot","changes":{"required":false}}	2026-04-24 21:57:16.706
cmodgbua8000b12llr0njy1ei	PLAYBOOK_UPDATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","changes":{"category":"approval"}}	2026-04-24 21:57:52.785
cmodgbvyn000d12lllo1o5be8	PLAYBOOK_UPDATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","changes":{"category":"onboarding"}}	2026-04-24 21:57:54.96
cmodgbzar000f12ll8q8lnr2r	PLAYBOOK_UPDATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","changes":{"isActive":false}}	2026-04-24 21:57:59.284
cmodgc5v1000h12llwko8y5wf	PLAYBOOK_UPDATED	PlaybookChecklist	cmod6z3110016sabw6q3gycot	cmnuzx1fg0002zgw8zimoxguz	{"name":"Alta de comercio nuevo","changes":{"isActive":true}}	2026-04-24 21:58:07.789
cmodwkj1a000norniitqzc0pn	USER_DELETED	User	cmobtv7wq000ptqia8qc32mkw	cmnuzx1fg0002zgw8zimoxguz	{"email":"facundotdf@gmail.com","name":"Facundo Bellotto","roles":["USER","DRIVER"],"bulkOperation":true,"deletedAt":"2026-04-25T05:32:31.964Z"}	2026-04-25 05:32:31.966
cmodwksjz000qorniqhnje5gd	MERCHANT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"ALNAAR","merchantOwnerId":"cmobth34p0002tqiaji23ve3q","adminEmail":"maurod@me.com"}	2026-04-25 05:32:44.303
cmoeeqhzc000g2klvpdma016s	MERCHANT_DOCUMENT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"cuit","documentLabel":"CUIT","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 14:01:03.624
cmoeeqhz3000e2klvui8h916s	MERCHANT_DOCUMENT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"bankAccount","documentLabel":"CBU/Alias bancario","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 14:01:03.615
cmoeerf4b000i2klve24523lh	MERCHANT_DOCUMENT_RESUBMITTED	Merchant	cmodwjkyu000hornifywezk15	cmobth34p0002tqiaji23ve3q	{"documentField":"constanciaAfipUrl","documentLabel":"Constancia de Inscripción AFIP"}	2026-04-25 14:01:46.571
cmoeerlgd000k2klvedc8599t	MERCHANT_DOCUMENT_RESUBMITTED	Merchant	cmodwjkyu000hornifywezk15	cmobth34p0002tqiaji23ve3q	{"documentField":"habilitacionMunicipalUrl","documentLabel":"Habilitación Municipal"}	2026-04-25 14:01:54.781
cmoeerpw5000m2klvg9r8sh9x	MERCHANT_DOCUMENT_RESUBMITTED	Merchant	cmodwjkyu000hornifywezk15	cmobth34p0002tqiaji23ve3q	{"documentField":"registroSanitarioUrl","documentLabel":"Registro Sanitario / Habilitación Bromatológica"}	2026-04-25 14:02:00.533
cmoem9l0y000bk8gra9j4qicm	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"cuit","documentLabel":"CUIT","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 17:31:51.346
cmoem9mn7000ek8gr5tv7ma9e	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"bankAccount","documentLabel":"CBU/Alias bancario","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 17:31:53.444
cmoepi2wk0001rqsemqfced58	MERCHANT_LOGO_UPDATED_BY_ADMIN	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"LAMPARAS DE SAL","merchantOwnerId":"cmoem7nkg0001k8grd394va3v","adminEmail":"maurod@me.com","previousImage":null,"newImage":"https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777143741416-logo.webp","operation":"ADDED"}	2026-04-25 19:02:26.611
cmoepimwu0004rqse6md4e6t1	MERCHANT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"LAMPARAS DE SAL","merchantOwnerId":"cmoem7nkg0001k8grd394va3v","adminEmail":"maurod@me.com"}	2026-04-25 19:02:52.542
cmoeqe1vu0002v11wxwvfa6nq	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"constanciaAfipUrl","documentLabel":"Constancia de Inscripción AFIP","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 19:27:18.282
cmoeqla8h0006v11wwimepory	MERCHANT_CHANGE_REQUEST_CREATED	Merchant	cmoem7nl10004k8grsztmzdot	cmoem7nkg0001k8grd394va3v	{"requestId":"cmoeqla820004v11wd8gnl7do","documentField":"cuit","documentLabel":"CUIT","merchantName":"LAMPARAS DE SAL","reason":"Necesito cambiar mi CUIT, lo ingrese incorrectamente."}	2026-04-25 19:32:55.698
cmoeqrv330009v11w8grclrlc	MERCHANT_CHANGE_REQUEST_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"requestId":"cmoeqla820004v11wd8gnl7do","documentField":"cuit","documentLabel":"CUIT","merchantName":"LAMPARAS DE SAL","reason":"Necesito cambiar mi CUIT, lo ingrese incorrectamente.","resolutionNote":"No encontramos ningun inconveniente, puedes realizar tu cambio ahora mismo! =)"}	2026-04-25 19:38:02.655
cmoeqsqsv000bv11wugohjcdw	MERCHANT_DOCUMENT_RESUBMITTED	Merchant	cmoem7nl10004k8grsztmzdot	cmoem7nkg0001k8grd394va3v	{"documentField":"cuit","documentLabel":"CUIT"}	2026-04-25 19:38:43.759
cmoeqw5mi000ev11ww1l2xytc	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"cuit","documentLabel":"CUIT","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 19:41:22.939
cmoeu2my300015ae1oekx23lb	DRIVER_DOCUMENT_RESUBMITTED	Driver	cmocz8aty0001ju1tiijq1c94	cmobkazic0002w4k6sk1luhha	{"documentField":"cuit","documentLabel":"CUIT/CUIL"}	2026-04-25 21:10:24.169
cmoeufym80001uet880dn890m	DRIVER_DOCUMENT_RESUBMITTED	Driver	cmocz8aty0001ju1tiijq1c94	cmobkazic0002w4k6sk1luhha	{"documentField":"cuit","documentLabel":"CUIT/CUIL"}	2026-04-25 21:20:45.822
cmoeugzzt0004uet86mggg5na	DRIVER_DOCUMENT_APPROVED	Driver	cmocz8aty0001ju1tiijq1c94	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"cuit","documentLabel":"CUIT/CUIL","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-25 21:21:34.265
cmof7ezni0004wtg5iqg33hyw	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"habilitacionMunicipalUrl","documentLabel":"Habilitación Municipal","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-26 03:23:55.518
cmogbiwk5000at73xz2opctii	REFUND_PROCESSED_MANUAL	order	cmogax21b0003t73xq0bfpb2y	cmnuzx1fg0002zgw8zimoxguz	{"refundAmount":2000,"reason":"No habia insumos","originalTotal":2000,"orderNumber":"MOV-YLAS","paymentMethod":"mercadopago","originalPaymentStatus":"PENDING"}	2026-04-26 22:06:42.772
cmogimdk2000qkoavit750l99	PIN_GEOFENCE_FAIL	Order	cmogijdxh000bkoav0u9x1qqb	cmobkazic0002w4k6sk1luhha	{"pinType":"pickup","driverId":"cmocz8aty0001ju1tiijq1c94","distanceMeters":307,"threshold":100,"accuracy":85}	2026-04-27 01:25:22.082
cmoh5443s0002t4nhp4vhhyv7	MERCHANT_REJECTED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"ALNAAR","merchantOwnerId":"cmobth34p0002tqiaji23ve3q","adminEmail":"maurod@me.com","reason":"Test"}	2026-04-27 11:55:01.192
cmoh69yqp0002f2miyhftfnay	MERCHANT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"ALNAAR","merchantOwnerId":"cmobth34p0002tqiaji23ve3q","adminEmail":"maurod@me.com"}	2026-04-27 12:27:33.793
cmoh6cqhb0008f2mii5axgmei	MERCHANT_DOCUMENT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"constanciaAfipUrl","documentLabel":"Constancia de Inscripción AFIP","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-27 12:29:43.056
cmoh6ct5z000bf2mihqe6mfk1	MERCHANT_DOCUMENT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"habilitacionMunicipalUrl","documentLabel":"Habilitación Municipal","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-27 12:29:46.536
cmoh6cve4000ef2miz94hc6w2	MERCHANT_DOCUMENT_APPROVED	Merchant	cmodwjkyu000hornifywezk15	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"registroSanitarioUrl","documentLabel":"Registro Sanitario / Habilitación Bromatológica","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-04-27 12:29:49.421
cmohb8bm2000411lkkf357rca	MERCHANT_APPROVED	Merchant	cmohb69hn000111lk85n20sqd	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"AMPM","merchantOwnerId":"cmodw2bcv0004ornia10d6of8","adminEmail":"maurod@me.com"}	2026-04-27 14:46:15.242
cmoiodb600002a5z0ao3e5pkf	DRIVER_APPROVED	Driver	cmohdinef0002tf8b8fsd3yov	cmnuzx1fg0002zgw8zimoxguz	{"driverUserId":"cmodw2bcv0004ornia10d6of8","adminEmail":"maurod@me.com"}	2026-04-28 13:41:49.127
cmoir6icy0002rxa6lceeytc7	MERCHANT_REJECTED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"LAMPARAS DE SAL","merchantOwnerId":"cmoem7nkg0001k8grd394va3v","adminEmail":"maurod@me.com","reason":"Testeandoooo"}	2026-04-28 15:00:30.706
cmoir8y7i000crxa6smevv0b7	USER_DELETED	User	cmoir8pja0006rxa6e52geiv5	cmnuzx1fg0002zgw8zimoxguz	{"email":"test1@somosmoovy.com","name":"Marcos Perez","roles":["USER"],"bulkOperation":true,"deletedAt":"2026-04-28T15:02:24.557Z"}	2026-04-28 15:02:24.559
cmoiumer1000hrxa6d1hq69gw	MERCHANT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"merchantName":"LAMPARAS DE SAL","merchantOwnerId":"cmoem7nkg0001k8grd394va3v","adminEmail":"maurod@me.com"}	2026-04-28 16:36:51.373
cmon1xu360004e0hdp502yfkc	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoem7nl10004k8grsztmzdot	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"registroSanitarioUrl","documentLabel":"Registro Sanitario / Habilitación Bromatológica","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-01 15:12:46.483
cmop8j6nt000be0hd82bgoxqt	USER_DELETED	User	cmoem7nkg0001k8grd394va3v	cmnuzx1fg0002zgw8zimoxguz	{"email":"test@somosmoovy.com","name":"Paola Ruiz","roles":["USER","COMERCIO"],"bulkOperation":true,"deletedAt":"2026-05-03T03:52:52.599Z"}	2026-05-03 03:52:52.601
cmop8mpae000ge0hdrxcwu8uv	MERCHANT_DOCUMENT_APPROVED	Merchant	cmohb69hn000111lk85n20sqd	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"cuit","documentLabel":"CUIT","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-03 03:55:36.711
cmop8ms4u000je0hdszaatb7k	MERCHANT_DOCUMENT_APPROVED	Merchant	cmohb69hn000111lk85n20sqd	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"bankAccount","documentLabel":"CBU/Alias bancario","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-03 03:55:40.399
cmop8musj000me0hdlaqwfd3f	MERCHANT_DOCUMENT_APPROVED	Merchant	cmohb69hn000111lk85n20sqd	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"constanciaAfipUrl","documentLabel":"Constancia de Inscripción AFIP","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-03 03:55:43.843
cmop8n0l1000se0hd8yzqivrt	MERCHANT_DOCUMENT_APPROVED	Merchant	cmohb69hn000111lk85n20sqd	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"registroSanitarioUrl","documentLabel":"Registro Sanitario / Habilitación Bromatológica","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-03 03:55:51.349
cmop8mxx6000pe0hdxe3rceib	MERCHANT_DOCUMENT_APPROVED	Merchant	cmohb69hn000111lk85n20sqd	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"habilitacionMunicipalUrl","documentLabel":"Habilitación Municipal","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-03 03:55:47.898
cmot1p98s00059i9jlyuz1tlq	MERCHANT_DOCUMENT_RESUBMITTED	Merchant	cmoqaehc10009ermak74cbcs4	cmoqaehbn0004erma23omyvjs	{"documentField":"registroSanitarioUrl","documentLabel":"Registro Sanitario / Habilitación Bromatológica"}	2026-05-05 19:52:43.277
cmot1qs7x00089i9jj4zuxk94	MERCHANT_DOCUMENT_APPROVED	Merchant	cmoqaehc10009ermak74cbcs4	cmnuzx1fg0002zgw8zimoxguz	{"documentField":"registroSanitarioUrl","documentLabel":"Registro Sanitario / Habilitación Bromatológica","adminEmail":"maurod@me.com","triggeredAutoActivation":false}	2026-05-05 19:53:54.525
cmou21e9c000j2sh5m82risgj	ORDERS_HARD_DELETED	Order	cmotlng930003uqzgz6jx6jgc	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmotlng930003uqzgz6jx6jgc"],"snapshot":[{"id":"cmotlng930003uqzgz6jx6jgc","orderNumber":"MOV-7ASW","total":13325,"status":"AWAITING_PAYMENT","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 12:49:55.824
cmou232wg000m2sh581ok35bx	ORDERS_HARD_DELETED	Order	cmou1wj2m00092sh569qzbrd6	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou1wj2m00092sh569qzbrd6"],"snapshot":[{"id":"cmou1wj2m00092sh569qzbrd6","orderNumber":"MOV-5B3S","total":13653,"status":"AWAITING_PAYMENT","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 12:51:14.416
cmou2g3k700182sh5qhxqziv9	ORDERS_HARD_DELETED	Order	cmou2416f000r2sh5rkg78s8l	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou2416f000r2sh5rkg78s8l"],"snapshot":[{"id":"cmou2416f000r2sh5rkg78s8l","orderNumber":"MOV-CNT8","total":9650,"status":"AWAITING_PAYMENT","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 13:01:21.799
cmou3cor3001s2sh5ivmepupj	ORDERS_HARD_DELETED	Order	cmou27mue000z2sh5mwe5z8nr	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou27mue000z2sh5mwe5z8nr"],"snapshot":[{"id":"cmou27mue000z2sh5mwe5z8nr","orderNumber":"MOV-LJ3L","total":9650,"status":"PREPARING","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 13:26:42.254
cmou4powj002k2sh5v6t2u4r0	ORDERS_HARD_DELETED	Order	cmou3g4a000252sh554pwytr4,cmou3dzle001x2sh5zs9zgctt	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":2,"requestedIds":["cmou3g4a000252sh554pwytr4","cmou3dzle001x2sh5zs9zgctt"],"snapshot":[{"id":"cmou3dzle001x2sh5zs9zgctt","orderNumber":"MOV-E7R2","total":3350,"status":"AWAITING_PAYMENT","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false},{"id":"cmou3g4a000252sh554pwytr4","orderNumber":"MOV-HV98","total":3350,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 14:04:48.594
cmou53rsc00342sh5r9q51vxl	ORDERS_HARD_DELETED	Order	cmou4sekb002p2sh59nq0qhgk	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou4sekb002p2sh59nq0qhgk"],"snapshot":[{"id":"cmou4sekb002p2sh59nq0qhgk","orderNumber":"MOV-T5VA","total":9622,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 14:15:45.515
cmou6hjw3000mfehv1s1r4qka	PIN_GEOFENCE_FAIL	Order	cmou68jmb0005fehvtn7o7o2u	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":4366,"threshold":100,"accuracy":76}	2026-05-06 14:54:28.082
cmou7yg3o000ofehvqx6frsjj	ORDERS_HARD_DELETED	Order	cmou68jmb0005fehvtn7o7o2u	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou68jmb0005fehvtn7o7o2u"],"snapshot":[{"id":"cmou68jmb0005fehvtn7o7o2u","orderNumber":"MOV-G3YL","total":3322,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 15:35:35.941
cmou83c46000zfehv5zbi5gwe	ORDERS_HARD_DELETED	Order	cmou80gqk000tfehvn9b79xu5	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou80gqk000tfehvn9b79xu5"],"snapshot":[{"id":"cmou80gqk000tfehvn9b79xu5","orderNumber":"MOV-NZEB","total":9622,"status":"AWAITING_PAYMENT","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 15:39:24.054
cmoua1xqv0001dnde91d4axg3	ORDERS_HARD_DELETED	Order	cmou83xhn0014fehvq9x78556	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmou83xhn0014fehvq9x78556"],"snapshot":[{"id":"cmou83xhn0014fehvq9x78556","orderNumber":"MOV-QDDN","total":3322,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 16:34:18.006
cmoubgjw4000ldndexdmb0gay	PIN_GEOFENCE_FAIL	Order	cmoua77ai0006dndeuqm929hr	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":4373,"threshold":100,"accuracy":86}	2026-05-06 17:13:39.507
cmoubig4u000ndnde83uvkf2c	ORDERS_HARD_DELETED	Order	cmoua77ai0006dndeuqm929hr	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmoua77ai0006dndeuqm929hr"],"snapshot":[{"id":"cmoua77ai0006dndeuqm929hr","orderNumber":"MOV-CYK4","total":9622,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 17:15:07.951
cmouc2hmb001adndephayvs77	PIN_GEOFENCE_FAIL	Order	cmoubv2c6000vdnde7r01x8we	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":315,"threshold":100,"accuracy":68}	2026-05-06 17:30:42.994
cmouc3i0v001cdnde7384qh6g	PIN_GEOFENCE_FAIL	Order	cmoubv2c6000vdnde7r01x8we	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":280,"threshold":100,"accuracy":83}	2026-05-06 17:31:30.175
cmouc6rok001ednde5yxdv7kn	PIN_GEOFENCE_FAIL	Order	cmoubv2c6000vdnde7r01x8we	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":464,"threshold":100,"accuracy":78}	2026-05-06 17:34:02.66
cmouc75dl001gdndeg8sidu99	PIN_GEOFENCE_FAIL	Order	cmoubv2c6000vdnde7r01x8we	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":464,"threshold":100,"accuracy":78}	2026-05-06 17:34:20.409
cmouc8w63001mdnde9hrt5p2t	ORDERS_HARD_DELETED	Order	cmoubv2c6000vdnde7r01x8we	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmoubv2c6000vdnde7r01x8we"],"snapshot":[{"id":"cmoubv2c6000vdnde7r01x8we","orderNumber":"MOV-HZZ3","total":3259,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 17:35:41.787
cmoucdlyo0021dndef7194tou	ORDERS_HARD_DELETED	Order	cmouccaka001rdndee72n3ans	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmouccaka001rdndee72n3ans"],"snapshot":[{"id":"cmouccaka001rdndee72n3ans","orderNumber":"MOV-ELQF","total":37481,"status":"CANCELLED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 17:39:21.84
cmoucgawl002edndev3no4kh7	ORDERS_HARD_DELETED	Order	cmouced440026dndezvzm4fss	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmouced440026dndezvzm4fss"],"snapshot":[{"id":"cmouced440026dndezvzm4fss","orderNumber":"MOV-CBYP","total":9656,"status":"PENDING","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 17:41:27.478
cmounyu16000kx4ktol98u8ho	PIN_GEOFENCE_FAIL	Order	cmounrgk00005x4kt2ete17tm	cmoqaehm7000kerma58f7mpn4	{"pinType":"pickup","driverId":"cmoqaehms000permanxjcoebd","distanceMeters":452,"threshold":100,"accuracy":80}	2026-05-06 23:03:47.85
cmouo24v2000mx4ktl9z7jyep	ORDERS_HARD_DELETED	Order	cmounrgk00005x4kt2ete17tm	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmounrgk00005x4kt2ete17tm"],"snapshot":[{"id":"cmounrgk00005x4kt2ete17tm","orderNumber":"MOV-CQSD","total":3356,"status":"DRIVER_ARRIVED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-06 23:06:21.855
cmouqsiow0001192pq6c0vxmy	ORDERS_HARD_DELETED	Order	cmouo606g000rx4ktv41n224g	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmouo606g000rx4ktv41n224g"],"snapshot":[{"id":"cmouo606g000rx4ktv41n224g","orderNumber":"MOV-JB9A","total":1571,"status":"DRIVER_ASSIGNED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-07 00:22:52.063
cmour9lk2000d192pky40p781	ORDERS_HARD_DELETED	Order	cmouqv1xa0006192p6wanuvup	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmouqv1xa0006192p6wanuvup"],"snapshot":[{"id":"cmouqv1xa0006192p6wanuvup","orderNumber":"MOV-K96T","total":14328,"status":"CANCELLED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-07 00:36:08.93
cmourfhzh000p192pnxud6vf5	ORDERS_HARD_DELETED	Order	cmourb2ii000i192pb2d3ih19	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmourb2ii000i192pb2d3ih19"],"snapshot":[{"id":"cmourb2ii000i192pb2d3ih19","orderNumber":"MOV-733H","total":38478,"status":"CANCELLED","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-07 00:40:44.237
cmous2wue0019192pxw3cj53i	ORDERS_HARD_DELETED	Order	cmourhssa000u192pjt1jaqma	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmourhssa000u192pjt1jaqma"],"snapshot":[{"id":"cmourhssa000u192pjt1jaqma","orderNumber":"MOV-NDX2","total":38478,"status":"PENDING","userId":"cmoqaeh2r0000erma67dv4jv8","wasSoftDeleted":false}]}	2026-05-07 00:58:56.581
cmp61umot000ld60srzaakooe	DRIVER_APPROVED	Driver	cmp60qa3x000ad60sjehyggb3	cmnuzx1fg0002zgw8zimoxguz	{"driverUserId":"cmp60qa3g0007d60svwywx818","adminEmail":"maurod@me.com"}	2026-05-14 22:17:54.267
cmp626o2v001ld60sq6zfkjnl	PIN_GEOFENCE_FAIL	Order	cmp61xkw5000qd60sq6gonbm4	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":466,"threshold":150,"accuracy":121}	2026-05-14 22:27:15.943
cmp68k878001nd60smcd1j1jr	ORDERS_HARD_DELETED	Order	cmp61xkw5000qd60sq6gonbm4	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmp61xkw5000qd60sq6gonbm4"],"snapshot":[{"id":"cmp61xkw5000qd60sq6gonbm4","orderNumber":"MOV-GKH3","total":13325,"status":"DELIVERED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-15 01:25:46.243
cmpa1qwti00018eo0oob0qztf	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vvi0007hfbsvn0iu88p	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.puntos-moover","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-17 17:26:05.477
cmpa1rpmi00038eo0qcvwkqv1	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuu0004hfbswpp81d5x	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.marketplace","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-17 17:26:42.811
cmpa2ngul00058eo0nw430hz0	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuc0001hfbsbacg4brf	cmnuzx1fg0002zgw8zimoxguz	{"key":"merchant.paquetes","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-17 17:51:24.429
cmpa2o65y00078eo0s7xr4yl8	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuc0001hfbsbacg4brf	cmnuzx1fg0002zgw8zimoxguz	{"key":"merchant.paquetes","previousState":true,"newState":false,"toggledBy":"maurod@me.com"}	2026-05-17 17:51:57.238
cmpa5epc9000q8eo0ohqmyxil	PIN_GEOFENCE_FAIL	Order	cmpa57zgp000b8eo0y5s1j7vh	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":460,"threshold":100,"accuracy":63}	2026-05-17 19:08:34.377
cmpa5fegs000s8eo0nagnrdzh	PIN_GEOFENCE_FAIL	Order	cmpa57zgp000b8eo0y5s1j7vh	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":460,"threshold":100,"accuracy":63}	2026-05-17 19:09:06.941
cmpa5go0z000u8eo0mgbeammf	ORDERS_HARD_DELETED	Order	cmpa57zgp000b8eo0y5s1j7vh	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpa57zgp000b8eo0y5s1j7vh"],"snapshot":[{"id":"cmpa57zgp000b8eo0y5s1j7vh","orderNumber":"MOV-YDH6","total":37475,"status":"DRIVER_ARRIVED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-17 19:10:05.988
cmpa92sc1001j8eo0gt3kxvda	ORDERS_HARD_DELETED	Order	cmpa8teim001a8eo0dv5in5qq	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpa8teim001a8eo0dv5in5qq"],"snapshot":[{"id":"cmpa8teim001a8eo0dv5in5qq","orderNumber":"MOV-48P6","total":1448,"status":"CANCELLED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-17 20:51:16.849
cmpa9c4n000238eo01h3yqu5m	PIN_VERIFIED	Order	cmpa9alo0001o8eo0979z2inr	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":40,"attempts":1}	2026-05-17 20:58:32.7
cmpa9d50y00258eo08vidhlbr	DRIVER_STARTED_WAITING_FOR_CUSTOMER	Order	cmpa9alo0001o8eo0979z2inr	cmobkazic0002w4k6sk1luhha	{"orderNumber":"MOV-NALB","driverId":"cmp60qa3x000ad60sjehyggb3","waitingStartedAt":"2026-05-17T20:59:19.856Z"}	2026-05-17 20:59:19.858
cmpa9e05j00278eo0goppdxrw	PIN_VERIFIED	Order	cmpa9alo0001o8eo0979z2inr	cmp60qa3g0007d60svwywx818	{"pinType":"delivery","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":26,"attempts":1}	2026-05-17 21:00:00.199
cmpaae6y1002j8eo0cbogl4vd	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vun0003hfbsdpo0djx1	cmnuzx1fg0002zgw8zimoxguz	{"key":"seller.paquetes","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-17 21:28:08.617
cmpaaizba002l8eo0no0fq8sx	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vun0003hfbsdpo0djx1	cmnuzx1fg0002zgw8zimoxguz	{"key":"seller.paquetes","previousState":true,"newState":false,"toggledBy":"maurod@me.com"}	2026-05-17 21:31:52.006
cmpaaz6g400348eo0zqq2qigl	PIN_VERIFIED	Order	cmpaarmxl002p8eo06gknvo5w	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":25,"attempts":1}	2026-05-17 21:44:27.748
cmpab1sil00368eo08lg9lbtn	DRIVER_STARTED_WAITING_FOR_CUSTOMER	Order	cmpaarmxl002p8eo06gknvo5w	cmobkazic0002w4k6sk1luhha	{"orderNumber":"MOV-N2NW","driverId":"cmp60qa3x000ad60sjehyggb3","waitingStartedAt":"2026-05-17T21:46:29.660Z"}	2026-05-17 21:46:29.662
cmpab208x00388eo0zckr5w6n	PIN_VERIFIED	Order	cmpaarmxl002p8eo06gknvo5w	cmp60qa3g0007d60svwywx818	{"pinType":"delivery","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":6,"attempts":1}	2026-05-17 21:46:39.681
cmpabd8v9003d8eo02z1cj2og	DRIVER_BANK_ACCOUNT_UPDATED	Driver	cmp60qa3x000ad60sjehyggb3	cmp60qa3g0007d60svwywx818	{"previousHadCbu":false,"previousHadAlias":false,"newHasCbu":false,"newHasAlias":true,"timestamp":"2026-05-17T21:55:24.061Z"}	2026-05-17 21:55:24.07
cmpabgu57003j8eo0j6gwlmfn	PAYOUT_BATCH_CREATED	PayoutBatch	cmpabgu4b003f8eo045n4st94	cmnuzx1fg0002zgw8zimoxguz	{"batchType":"DRIVER","itemCount":1,"totalAmount":907.2}	2026-05-17 21:58:11.611
cmpabivbb003l8eo0csynjbl5	PAYOUT_BATCH_CANCELLED	PayoutBatch	cmpabgu4b003f8eo045n4st94	cmnuzx1fg0002zgw8zimoxguz	{"batchType":"DRIVER","priorStatus":"DRAFT","totalAmount":907.2}	2026-05-17 21:59:46.44
cmpacfdw4003n8eo0tedfmn53	ORDERS_HARD_DELETED	Order	cmpaarmxl002p8eo06gknvo5w,cmpa9alo0001o8eo0979z2inr	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":2,"requestedIds":["cmpaarmxl002p8eo06gknvo5w","cmpa9alo0001o8eo0979z2inr"],"snapshot":[{"id":"cmpa9alo0001o8eo0979z2inr","orderNumber":"MOV-NALB","total":1448,"status":"DELIVERED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false},{"id":"cmpaarmxl002p8eo06gknvo5w","orderNumber":"MOV-N2NW","total":1448,"status":"DELIVERED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-17 22:25:03.507
cmpaenqwt00498eo0s75x5iz9	PIN_VERIFIED	Order	cmpaej6bq003u8eo0ybis0jdc	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":109,"attempts":1}	2026-05-17 23:27:32.862
cmpaeoc4l004b8eo06tmtlcd5	DRIVER_STARTED_WAITING_FOR_CUSTOMER	Order	cmpaej6bq003u8eo0ybis0jdc	cmobkazic0002w4k6sk1luhha	{"orderNumber":"MOV-UBAR","driverId":"cmp60qa3x000ad60sjehyggb3","waitingStartedAt":"2026-05-17T23:28:00.355Z"}	2026-05-17 23:28:00.357
cmpaeoxlz004d8eo0ovsgcjj7	PIN_VERIFIED	Order	cmpaej6bq003u8eo0ybis0jdc	cmp60qa3g0007d60svwywx818	{"pinType":"delivery","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":81,"attempts":1}	2026-05-17 23:28:28.2
cmpaeu447004k8eo0dswiuq9z	DRIVER_TIP_DECLARED	Order	cmpaej6bq003u8eo0ybis0jdc	cmobkazic0002w4k6sk1luhha	{"method":"TRANSFER","amount":null}	2026-05-17 23:32:29.911
cmpaf1h56004s8eo0glatobk9	ORDERS_HARD_DELETED	Order	cmpaej6bq003u8eo0ybis0jdc	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpaej6bq003u8eo0ybis0jdc"],"snapshot":[{"id":"cmpaej6bq003u8eo0ybis0jdc","orderNumber":"MOV-UBAR","total":1658,"status":"COMPLETED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-17 23:38:13.386
cmpagkmza0001vg2fj2hjefrd	ORDERS_HARD_DELETED	Order	cmpaf44bz004z8eo01ig2ptrc	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpaf44bz004z8eo01ig2ptrc"],"snapshot":[{"id":"cmpaf44bz004z8eo01ig2ptrc","orderNumber":"MOV-RGR3","total":1658,"status":"PREPARING","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-18 00:21:07.029
cmpagsqu1000lvg2f4ou8pzrm	PIN_VERIFIED	Order	cmpagot250006vg2fguv1865i	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":113,"attempts":1}	2026-05-18 00:27:25.271
cmpagvdld000nvg2f3bzgnpct	DRIVER_STARTED_WAITING_FOR_CUSTOMER	Order	cmpagot250006vg2fguv1865i	cmobkazic0002w4k6sk1luhha	{"orderNumber":"MOV-3HGZ","driverId":"cmp60qa3x000ad60sjehyggb3","waitingStartedAt":"2026-05-18T00:29:28.077Z"}	2026-05-18 00:29:28.079
cmpagwa81000pvg2f73khtq0v	PIN_VERIFIED	Order	cmpagot250006vg2fguv1865i	cmp60qa3g0007d60svwywx818	{"pinType":"delivery","driverId":"cmp60qa3x000ad60sjehyggb3","distanceMeters":84,"attempts":1}	2026-05-18 00:30:10.369
cmpagzfkl000uvg2ff6oj6b8r	DRIVER_TIP_DECLARED	Order	cmpagot250006vg2fguv1865i	cmobkazic0002w4k6sk1luhha	{"method":"NONE","amount":null}	2026-05-18 00:32:37.27
cmpajc7lc0001g22zs24mwx9y	ORDERS_HARD_DELETED	Order	cmpagot250006vg2fguv1865i	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpagot250006vg2fguv1865i"],"snapshot":[{"id":"cmpagot250006vg2fguv1865i","orderNumber":"MOV-3HGZ","total":1658,"status":"COMPLETED","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-18 01:38:32.681
cmpamqfoy00016lhs9e8c55vn	ORDERS_HARD_DELETED	Order	cmpajnx2u0006g22zzns2e7f9	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpajnx2u0006g22zzns2e7f9"],"snapshot":[{"id":"cmpajnx2u0006g22zzns2e7f9","orderNumber":"MOV-ZGY3","total":1658,"status":"AWAITING_PAYMENT","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-18 03:13:35.217
cmpan0ak100013b8zch6vc5y5	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuu0004hfbswpp81d5x	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.marketplace","previousState":true,"newState":false,"toggledBy":"maurod@me.com"}	2026-05-18 03:21:15.12
cmpan1qqe00033b8zj6vp1oez	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vvi0007hfbsvn0iu88p	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.puntos-moover","previousState":true,"newState":false,"toggledBy":"maurod@me.com"}	2026-05-18 03:22:22.743
cmpan4ipf00053b8zygo0gggk	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuu0004hfbswpp81d5x	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.marketplace","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-18 03:24:32.307
cmpan4j7q00073b8zkrk6hbvg	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vvi0007hfbsvn0iu88p	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.puntos-moover","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-18 03:24:32.966
cmpanbf0v00022utj68q9f223	CLEANUP_DEPRECATED_FEATURE_FLAGS	FeatureFlag	BULK	cmnuzx1fg0002zgw8zimoxguz	{"deletedCount":2,"keys":["buyer.marketplace","buyer.puntos-moover"],"reason":"fix/restaurar-moover-y-marketplace-sin-flags — over-reach del sistema de flags","script":"scripts/cleanup-deprecated-feature-flags.ts","executedAt":"2026-05-18T03:29:54.122Z"}	2026-05-18 03:29:54.127
cmpanfydn0001fdaq081w89l9	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuz0005hfbs40dh1828	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.scheduled-delivery","previousState":false,"newState":true,"toggledBy":"maurod@me.com"}	2026-05-18 03:33:25.834
cmpanhnx90003fdaq92hxivc3	FEATURE_FLAG_TOGGLED	FeatureFlag	cmp9w9vuz0005hfbs40dh1828	cmnuzx1fg0002zgw8zimoxguz	{"key":"buyer.scheduled-delivery","previousState":true,"newState":false,"toggledBy":"maurod@me.com"}	2026-05-18 03:34:45.598
cmpannfdb000lfdaqujisgbdw	PIN_VERIFICATION_FAIL	Order	cmpaniwc70006fdaqoyde34jk	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","attempts":1,"remaining":4,"distanceMeters":124}	2026-05-18 03:39:14.446
cmpannj58000nfdaqd9unwg34	PIN_VERIFICATION_FAIL	Order	cmpaniwc70006fdaqoyde34jk	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","attempts":2,"remaining":3,"distanceMeters":124}	2026-05-18 03:39:19.341
cmpannlcr000pfdaq764q60e1	PIN_VERIFICATION_FAIL	Order	cmpaniwc70006fdaqoyde34jk	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","attempts":3,"remaining":2,"distanceMeters":124}	2026-05-18 03:39:22.203
cmpannn1w000rfdaqd0bzwys4	PIN_VERIFICATION_FAIL	Order	cmpaniwc70006fdaqoyde34jk	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","attempts":4,"remaining":1,"distanceMeters":124}	2026-05-18 03:39:24.404
cmpannptr000tfdaqet3a0yqe	PIN_VERIFICATION_FAIL	Order	cmpaniwc70006fdaqoyde34jk	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","attempts":5,"remaining":0,"distanceMeters":124}	2026-05-18 03:39:27.999
cmpannpxv000vfdaqad0nimh6	PIN_LOCKED	Order	cmpaniwc70006fdaqoyde34jk	cmp60qa3g0007d60svwywx818	{"pinType":"pickup","driverId":"cmp60qa3x000ad60sjehyggb3","attempts":5,"fraudScore":1}	2026-05-18 03:39:28.148
cmpbgfq470001azejd45bzuhz	ORDERS_HARD_DELETED	Order	cmpaniwc70006fdaqoyde34jk	cmnuzx1fg0002zgw8zimoxguz	{"adminEmail":"maurod@me.com","count":1,"requestedIds":["cmpaniwc70006fdaqoyde34jk"],"snapshot":[{"id":"cmpaniwc70006fdaqoyde34jk","orderNumber":"MOV-LSNJ","total":1658,"status":"IN_DELIVERY","userId":"cmobkazic0002w4k6sk1luhha","wasSoftDeleted":false}]}	2026-05-18 17:05:03.988
cmpcq16nj00053op8wyzr6vd6	BULK_IMPORT_PRODUCTS	Product	import-2026-05-19T14:21:27.913Z	cmnuzx1fg0002zgw8zimoxguz	{"totalRows":63,"created":63,"skipped":0,"errors":0,"dryRun":true}	2026-05-19 14:21:27.917
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
cmnw2pza5001o3ooe7qdfmjcw	/saludo	Saludo inicial	¡Hola! Soy del equipo de MOOVY. ¿En qué puedo ayudarte?	general	1	t	2026-04-12 18:04:52.83	2026-04-12 18:04:52.83
cmnw2pzac001p3ooeu68v6zal	/espera	Pedir paciencia	Dame unos minutos para revisar tu caso. Ya te respondo.	general	2	t	2026-04-12 18:04:52.837	2026-04-12 18:04:52.837
cmnw2pzah001q3ooe4u8crz30	/pedido-estado	Estado del pedido	Estoy revisando el estado de tu pedido. Un momento por favor.	pedido	3	t	2026-04-12 18:04:52.841	2026-04-12 18:04:52.841
cmnw2pzam001r3ooe5j4jd49i	/pedido-demora	Demora en pedido	Lamento la demora. Estoy contactando al comercio para acelerar tu pedido.	pedido	4	t	2026-04-12 18:04:52.846	2026-04-12 18:04:52.846
cmnw2pzau001s3ooehvvzhy1d	/pago-pendiente	Pago pendiente	Veo que el pago todavía está pendiente. ¿Pudiste completarlo desde MercadoPago?	pago	5	t	2026-04-12 18:04:52.855	2026-04-12 18:04:52.855
cmnw2pzaz001t3ooewwj7axqe	/pago-reembolso	Reembolso	Voy a gestionar el reembolso ahora. Puede demorar hasta 48hs en reflejarse en tu cuenta de MercadoPago.	pago	6	t	2026-04-12 18:04:52.86	2026-04-12 18:04:52.86
cmnw2pzb6001u3ooeswx9y1md	/cuenta-datos	Datos de cuenta	Para proteger tu seguridad, no puedo modificar datos sensibles por chat. Podés actualizarlos desde tu perfil en la app.	cuenta	7	t	2026-04-12 18:04:52.866	2026-04-12 18:04:52.866
cmnw2pzba001v3ooeuqmxm3qf	/cierre	Cierre de chat	¡Listo! ¿Hay algo más en lo que pueda ayudarte? Si no, cierro el chat. ¡Que tengas un excelente día!	cierre	8	t	2026-04-12 18:04:52.871	2026-04-12 18:04:52.871
cmnw2pzbe001w3ooesgjbjt3u	/horario	Horario de atención	Nuestro horario de atención es de lunes a sábado de 9:00 a 21:00. Fuera de ese horario, dejanos tu mensaje y te respondemos apenas abramos.	general	9	t	2026-04-12 18:04:52.875	2026-04-12 18:04:52.875
cmnw2pzbl001x3ooeuacc81f4	/repartidor	Problema con repartidor	Lamento el inconveniente. Voy a reportar la situación al equipo de operaciones para que tomen acción.	pedido	10	t	2026-04-12 18:04:52.881	2026-04-12 18:04:52.881
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
cmnw2pz3p000h3ooelz8hg192	Restaurante	restaurante	\N	\N	t	1	STORE	2026-04-12 18:04:52.597	2026-04-12 18:04:52.597	t	0	\N	f	t	\N	\N
cmnw2pz3v000i3ooejddg6d35	Pizzería	pizzeria	\N	\N	t	2	STORE	2026-04-12 18:04:52.603	2026-04-12 18:04:52.603	t	0	\N	f	t	\N	\N
cmnw2pz3z000j3ooeqo3xfgth	Hamburguesería	hamburgueseria	\N	\N	t	3	STORE	2026-04-12 18:04:52.608	2026-04-12 18:04:52.608	t	0	\N	f	t	\N	\N
cmnw2pz44000k3ooed9vepfz1	Parrilla	parrilla	\N	\N	t	4	STORE	2026-04-12 18:04:52.612	2026-04-12 18:04:52.612	t	0	\N	f	t	\N	\N
cmnw2pz49000l3ooegno5am0a	Cafetería	cafeteria	\N	\N	t	5	STORE	2026-04-12 18:04:52.617	2026-04-12 18:04:52.617	t	0	\N	f	t	\N	\N
cmnw2pz4e000m3ooeu0ik70ks	Panadería	panaderia	\N	\N	t	6	STORE	2026-04-12 18:04:52.622	2026-04-12 18:04:52.622	t	0	\N	f	t	\N	\N
cmnw2pz4j000n3ooe3ln25yrx	Farmacia	farmacia	\N	\N	t	7	STORE	2026-04-12 18:04:52.627	2026-04-12 18:04:52.627	t	0	\N	f	t	\N	\N
cmnw2pz4q000o3ooeetdfhz46	Supermercado	supermercado	\N	\N	t	8	STORE	2026-04-12 18:04:52.635	2026-04-12 18:04:52.635	t	0	\N	f	t	\N	\N
cmnw2pz4u000p3ooerlyvtabj	Kiosco	kiosco	\N	\N	t	9	STORE	2026-04-12 18:04:52.639	2026-04-12 18:04:52.639	t	0	\N	f	t	\N	\N
cmnw2pz4z000q3ooeez0jc54c	Verdulería	verduleria	\N	\N	t	10	STORE	2026-04-12 18:04:52.643	2026-04-12 18:04:52.643	t	0	\N	f	t	\N	\N
cmnw2pz54000r3ooecus3vhhr	Carnicería	carniceria	\N	\N	t	11	STORE	2026-04-12 18:04:52.649	2026-04-12 18:04:52.649	t	0	\N	f	t	\N	\N
cmnw2pz59000s3ooegksqh88s	Otro	otro	\N	\N	t	99	BOTH	2026-04-12 18:04:52.653	2026-04-12 18:04:52.653	t	0	\N	f	t	\N	\N
cmnw2pz5d000t3ooeypsf73lm	Electrónica	electronica	\N	\N	t	1	MARKETPLACE	2026-04-12 18:04:52.657	2026-04-12 18:04:52.657	t	0	\N	f	t	\N	\N
cmnw2pz5h000u3ooe9fu5jn1o	Ropa y Calzado	ropa-calzado	\N	\N	t	2	MARKETPLACE	2026-04-12 18:04:52.661	2026-04-12 18:04:52.661	t	0	\N	f	t	\N	\N
cmnw2pz5l000v3ooe9ymzwrfn	Hogar y Jardín	hogar-jardin	\N	\N	t	3	MARKETPLACE	2026-04-12 18:04:52.665	2026-04-12 18:04:52.665	t	0	\N	f	t	\N	\N
cmnw2pz5p000w3ooej2c5lade	Deportes	deportes	\N	\N	t	4	MARKETPLACE	2026-04-12 18:04:52.669	2026-04-12 18:04:52.669	t	0	\N	f	t	\N	\N
cmnw2pz5t000x3ooep0jbcfaq	Juguetes	juguetes	\N	\N	t	5	MARKETPLACE	2026-04-12 18:04:52.673	2026-04-12 18:04:52.673	t	0	\N	f	t	\N	\N
cmnw2pz5x000y3ooeozweeavw	Libros y Música	libros-musica	\N	\N	t	6	MARKETPLACE	2026-04-12 18:04:52.678	2026-04-12 18:04:52.678	t	0	\N	f	t	\N	\N
cmnw2pz61000z3ooes09qfjps	Mascotas	mascotas	\N	\N	t	7	MARKETPLACE	2026-04-12 18:04:52.681	2026-04-12 18:04:52.681	t	0	\N	f	t	\N	\N
cmnw2pz6500103ooe19uns92d	Automotor	automotor	\N	\N	t	8	MARKETPLACE	2026-04-12 18:04:52.685	2026-04-12 18:04:52.685	t	0	\N	f	t	\N	\N
cmnw2pz6900113ooenw7hjmjx	Artesanías	artesanias	\N	\N	t	9	MARKETPLACE	2026-04-12 18:04:52.689	2026-04-12 18:04:52.689	t	0	\N	f	t	\N	\N
cmoqaear00000vlhqnfnspio8	Comidas	comidas	Restaurantes, rotiserías, cocinas	\N	t	1	STORE	2026-05-03 21:32:50.028	2026-05-03 21:32:50.028	t	0	\N	f	t	\N	restaurant
cmoqaearl0001vlhqepu89res	Cafeterías	cafeterias	Cafés, panaderías, medialunas	\N	t	2	STORE	2026-05-03 21:32:50.05	2026-05-03 21:32:50.05	t	0	\N	f	t	\N	coffee
cmoqaearw0002vlhqhbr35lt8	Bebidas	bebidas	Vinotecas, distribuidoras, cervecerías	\N	t	4	STORE	2026-05-03 21:32:50.061	2026-05-03 21:32:50.061	t	0	\N	f	t	\N	wine
cmoqaeasg0003vlhqwc434cop	Helados	helados	Heladerías, postres	\N	t	8	STORE	2026-05-03 21:32:50.081	2026-05-03 21:32:50.081	t	0	\N	f	t	\N	ice-cream
cmor6f2sn0000hw6jmjo5byij	Hogar	hogar	Muebles, decoración, electrodomésticos	\N	t	102	MARKETPLACE	2026-05-04 12:29:14.088	2026-05-04 12:29:14.088	t	0	\N	f	t	\N	home
cmor6f2t80001hw6j3tg8w4cq	Vehículos	vehiculos	Motos, autos, repuestos	\N	t	104	MARKETPLACE	2026-05-04 12:29:14.109	2026-05-04 12:29:14.109	t	0	\N	f	t	\N	car
cmor6f2tg0002hw6jyq76os52	Gaming	gaming	Consolas, juegos, periféricos	\N	t	105	MARKETPLACE	2026-05-04 12:29:14.116	2026-05-04 12:29:14.116	t	0	\N	f	t	\N	gamepad
cmor6f2to0003hw6joa10m8x5	Bebés y Niños	bebes-y-ninos	Ropa infantil, juguetes, cochecitos	\N	t	106	MARKETPLACE	2026-05-04 12:29:14.124	2026-05-04 12:29:14.124	t	0	\N	f	t	\N	baby
cmor6f2tu0004hw6jov1i70ah	Herramientas	herramientas	Herramientas, materiales, jardín	\N	t	107	MARKETPLACE	2026-05-04 12:29:14.13	2026-05-04 12:29:14.13	t	0	\N	f	t	\N	wrench
cmor6f2u40005hw6jkpdsqu4w	Belleza	belleza	Perfumes, maquillaje, cuidado personal	\N	t	109	MARKETPLACE	2026-05-04 12:29:14.14	2026-05-04 12:29:14.14	t	0	\N	f	t	\N	sparkles
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
cmobkazj80004w4k6subec099	cmobkazic0002w4k6sk1luhha	TERMS	1.1	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	2026-04-23 14:13:39.043
cmobkazjs0006w4k6ycv1cfg0	cmobkazic0002w4k6sk1luhha	PRIVACY	2.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	2026-04-23 14:13:39.065
cmobkazjy0008w4k677dx25o5	cmobkazic0002w4k6sk1luhha	MARKETING	1.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	2026-04-23 14:13:39.071
cmobth3540004tqia99wj9nyx	cmobth34p0002tqiaji23ve3q	TERMS	1.1	ACCEPT	192.168.20.250	Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1	\N	2026-04-23 18:30:20.201
cmobth35c0006tqiae1orogry	cmobth34p0002tqiaji23ve3q	PRIVACY	2.0	ACCEPT	192.168.20.250	Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1	\N	2026-04-23 18:30:20.208
cmobth35f0008tqia5xkw3tqc	cmobth34p0002tqiaji23ve3q	MARKETING	1.0	ACCEPT	192.168.20.250	Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1	\N	2026-04-23 18:30:20.211
cmobtv7xf000utqiax0j7wv3g	cmobtv7wq000ptqia8qc32mkw	TERMS	1.1	ACCEPT	192.168.20.254	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	{"context":"driver_registration"}	2026-04-23 18:41:19.588
cmobtv7xm000wtqia9wtu9657	cmobtv7wq000ptqia8qc32mkw	PRIVACY	2.0	ACCEPT	192.168.20.254	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	{"context":"driver_registration"}	2026-04-23 18:41:19.594
cmobtymkz0016tqiapthb5f6c	cmobth34p0002tqiaji23ve3q	COOKIES	1.1	ACCEPT	192.168.20.250	Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3.1 Mobile/15E148 Safari/604.1	{"essential":true,"analytics":true,"functional":true,"marketing":true}	2026-04-23 18:43:58.548
cmodw2bdd0006orni0vm4qatq	cmodw2bcv0004ornia10d6of8	TERMS	1.1	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	2026-04-25 05:18:22.226
cmodw2bdw0008orniydlvh4y3	cmodw2bcv0004ornia10d6of8	PRIVACY	2.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	2026-04-25 05:18:22.244
cmodw2be1000aorni31wttyy4	cmodw2bcv0004ornia10d6of8	MARKETING	1.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	\N	2026-04-25 05:18:22.249
cmoem7nlj0006k8gra1eyk9ox	cmoem7nkg0001k8grd394va3v	TERMS	1.1	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"context":"merchant_registration"}	2026-04-25 17:30:21.368
cmoem7nls0008k8gr6bxbftz7	cmoem7nkg0001k8grd394va3v	PRIVACY	2.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"context":"merchant_registration"}	2026-04-25 17:30:21.376
cmoh6e2jb000gf2milidqpacg	cmnuzx1fg0002zgw8zimoxguz	COOKIES	1.1	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"essential":true,"analytics":true,"functional":true,"marketing":true}	2026-04-27 12:30:45.335
cmp60qa4f000cd60sttzcpqxo	cmp60qa3g0007d60svwywx818	TERMS	1.2	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"context":"driver_registration"}	2026-05-14 21:46:31.743
cmp60qa4r000ed60s4chht8d4	cmp60qa3g0007d60svwywx818	PRIVACY	2.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"context":"driver_registration"}	2026-05-14 21:46:31.755
cmpaa60bl002f8eo0tbp1zbef	cmobkazic0002w4k6sk1luhha	TERMS	1.2	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"context":"seller_activation"}	2026-05-17 21:21:46.785
cmpaa60bx002h8eo0cuq9lxh6	cmobkazic0002w4k6sk1luhha	PRIVACY	2.0	ACCEPT	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	{"context":"seller_activation"}	2026-05-17 21:21:46.797
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

COPY public."DeliveryRate" (id, "categoryId", "basePriceArs", "pricePerKmArs", "isActive", "createdAt", "updatedAt") FROM stdin;
cmnw2pz89001c3ooex4r4zxb5	cmnw2pz7c00163ooeim6ijao4	300	80	t	2026-04-12 18:04:52.762	2026-04-12 18:04:52.762
cmnw2pz8o001e3ooe9elkxxcs	cmnw2pz7m00173ooelfp0vilx	400	100	t	2026-04-12 18:04:52.776	2026-04-12 18:04:52.776
cmnw2pz8w001g3ooep1fxaxag	cmnw2pz7r00183ooe6a3uhqx2	600	130	t	2026-04-12 18:04:52.785	2026-04-12 18:04:52.785
cmnw2pz93001i3ooev0k4453m	cmnw2pz7y00193ooe51d5kek8	900	180	t	2026-04-12 18:04:52.791	2026-04-12 18:04:52.791
cmnw2pz99001k3ooear8pbd54	cmnw2pz83001a3ooeozrxhvfw	1500	250	t	2026-04-12 18:04:52.798	2026-04-12 18:04:52.798
cmoqaeda90002a2f0wz26u3g1	cmoqaed9h0000a2f0xygyvz4p	8000	329	t	2026-05-03 21:32:53.313	2026-05-03 21:32:53.313
\.


--
-- Data for Name: DeliveryZone; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryZone" (id, name, color, multiplier, "driverBonus", polygon, "isActive", "displayOrder", "createdAt", "updatedAt") FROM stdin;
zone_1777788896671_2nymxy	Zona B — Intermedia	#eab308	1.15	150	0103000020E61000000100000050000000EBD19D253D1351C08C0E806C1D664BC0618F9D78AD1351C0E958D32C38664BC0FB0D9EFFDA1351C013ACC07C31664BC099829DB1FB1351C0AD54D1D14A664BC0CE719E4C241451C01602F36F5B664BC0F1449E91391451C0A97AD68E92664BC077BA9DC4BA1451C0BF81409CC4664BC0D07C9EA4F81451C06D1B674F19674BC09D7EDEC1401551C0E7E62FB524674BC0750C7ED1541551C09100386D3B674BC0048D1D7D811551C07341AB0348674BC092CA9D64CE1551C03AE92C9CAC674BC068A79D9C2C1651C0E289C05BD7674BC00B41BD02391651C0AEFB94518F674BC03EBABD16071651C0231C135F36674BC030FCBCB6B21551C0CA68AA4801674BC0DA23BD70531551C072FE2614E2664BC0CDDFBCEC221551C0D7407102BE664BC04B6169D6B51451C05D7262636C664BC068C369DA481451C09307F90B43664BC086AC693C231451C0EC33E34426664BC0782C37CAFA1351C037E138D214664BC0551D815EC91351C08E36385812664BC08EF880067C1351C0B431A9B3F0654BC003B080904C1351C0830D0B92D7654BC015CF804A1A1351C03D671FECD3654BC0B3E22834C11251C090F6F8EA8E654BC0BF4F6985081251C093B135B6F2644BC08B96ED57A21151C08C103509D2644BC0B3C5EC67FC1051C088B27377B6644BC0D97DEDB7BB1051C04FEAF199B1644BC0898C531C231051C0F6C4C6FEEA644BC034A153D45C0F51C0CCCA6B2F26654BC01E75DE40ED0E51C05E98F15B19654BC08093DD34CC0E51C02246F3F3EB644BC094CD57F4870E51C0B27506CCD7644BC019B11756660E51C0C368F844CE644BC0C751D7DF940E51C0468713DAEA644BC057FF57859C0E51C0D7BA9A5DF3644BC072F6575AA90E51C0132FF17509654BC05F5D57C4B70E51C0A9FFC0DD18654BC0FA505898D40E51C0EE686A7928654BC02CDC57BDFA0E51C007B794773E654BC0B1CB97E7260F51C043B14A263D654BC010EF5706570F51C0349A22E137654BC0ED4C4DF46C0F51C01B091B3B34654BC0DA6242C2930F51C0184C1AA82E654BC0FF09A0ABDC0F51C0FCA83A6F19654BC066EFFC0A281051C04D94C45F01654BC0FDC93675C01051C094248166CD644BC08F6C378CE51051C066382409D0644BC09BB83603051151C050106FAFE2644BC08F71371B1A1151C07BDCB2A1ED644BC022E335D5311151C00440B20CF3644BC0F3A433CD471151C00168ABCAF2644BC062CE31F55A1151C01B511E39F9644BC0D5753198821151C03270733CFC644BC0383C31A9A91151C0D249471D03654BC073CC30F0C71151C068A93B9D0B654BC07F94B0EDEF1151C0575665A232654BC0302630AFF91151C0398AFF7D3E654BC0F6C330A9FF1151C029B7483547654BC0B0A4307D1C1251C0FB43427A5B654BC01C0831E63A1251C0680B59F486654BC06EEFB00F461251C02950DA0798654BC0C2CD3055531251C0E31AA482B8654BC0E2F91419601251C0828003FAC7654BC0406EF9277C1251C050BBAE4BCC654BC08E6EF9529C1251C00163F210CA654BC0FBD0F8CAAB1251C09C8BF4DFD9654BC0EF89F9E2C01251C09AE2C550FB654BC059FEF822CC1251C0E424555A0D664BC01BBBF866F11251C03391168A1B664BC07D6F9EAD2D1351C046A214D02B664BC024B79DEB581351C0E7DE219748664BC0AF859D85641351C03CBAE1DC3E664BC0C78E9D226D1351C00695C0FF39664BC0A2C49DC1551351C08D31EFF226664BC0FBFE9D523D1351C0F1FCB6E823664BC0EBD19D253D1351C08C0E806C1D664BC0	t	2	2026-05-03 06:14:56.677	2026-05-05 21:57:51.168
zone_1777832004567_wcxi1z	Zona A — Centro	#22c55e	1	0	0103000020E6100000010000004F000000F56FE0D3510E51C05426BBEDD0644BC0D50DE186620E51C02D000C52D0644BC04E3AE0A67E0E51C0A6CCDF1ADE644BC00624E05E990E51C008C21DC1F0644BC05599E0D6A80E51C06F54A44B0A654BC04ACD6084B70E51C0C04F66CD19654BC03B9EE0ACD20E51C09BBD52E728654BC02FD9E093FA0E51C0246651333F654BC06849E00C270F51C093E0DD2F3E654BC0A514E117580F51C0E0EE0A4F38654BC09760E0D56C0F51C0F4E2C91035654BC0FA72E081930F51C023A69FCB2F654BC01FC0E0A2CC0F51C09903E16320654BC05C98E02F211051C0C505386E05654BC073A6E05B5E1051C02EE8CC5CF1644BC0592EE1F1A91051C05D4EAECED6644BC0BFACE106C21051C02589BB00CF644BC0F040E10FE61051C0B2C750BDD1644BC0B857E1F4001151C0A18272C4E2644BC076AA607A191151C0A3C17025F0644BC0356AE159321151C0D05BE102F5644BC0A8B1E025481151C0D05BE102F5644BC0DABAE07B5B1151C076C7767FFB644BC09E6EE0DB821151C07BBFF755FE644BC024D2E0FDAB1151C02A06E50906654BC07F08E139CA1151C0E1272AF50E654BC09893E0A5E51151C05B44CDBD2B654BC00E3FE1E7FD1151C09B9E2E8D4A654BC06A75E1231C1251C01765EA395F654BC0688BE0893D1251C0521901408E654BC0B8F7E01D4F1251C0DE07DE98B7654BC0D2F7E0D6591251C0485B6CC5C4654BC00CD660635C1251C0C74D1C5FCC654BC04C99E043651251C0CF8C7B7CCD654BC0E98BE026731251C05DBF35B7CF654BC02DB9E0C5881251C0A88F5383CF654BC09A1BE03D981251C0CF8C7B7CCD654BC0E5A2E07DA31251C0B19F9060D4654BC06A8CE0C3A81251C0CF48540DDA654BC0A75FE0C1C81251C04258115E10664BC0CA2AE113EF1251C04D53CC8D1E664BC074DEE0BA0B1351C053D85E6E24664BC0E626E177301351C00E7B5D6330664BC08B77E099591351C05A0097234B664BC09D42907E791351C0D589F92936664BC01827E95AAE1351C09D4A99E33B664BC06A684013DA1351C054E957D533664BC0F280A046FB1351C0148026924D664BC04AC860F5221451C0BB0746305E664BC0A682E0AA381451C0B79B9E7F94664BC022A160D8B71451C0782326BAC4664BC04306E009F71451C01B543EAB1C674BC0366C3D3E3F1551C0B66AE1F627674BC0611B6D2C531551C0C3BA59D23D674BC055AA833D7F1551C0E8BA7E2E4B674BC029CF9B0ECD1551C0ED152F79B0674BC0E15DF9EF2B1651C0190CF78FDA674BC07CFD55EF6C1651C01022C82A2D684BC09CA36D80821651C026F243F658684BC0E9EA8453831651C0860D566979684BC0C0C5B3995D1651C0CD2FB0B2A9684BC074541232601651C00D6C230BC9684BC0B6AC6F1E961651C0AF4AF4C235694BC0F804CD0ACC1651C0783F341473694BC06EAEB83D431751C00956564CC5694BC02CD99003FF1751C03F5688F89B694BC04F2D4197071751C092DB5C20B46B4BC06729F16A0D1551C0B4DD0797836A4BC0B766C8047E1451C02084780BC16B4BC034B59F9E941351C0257105FDCD6B4BC02ADC5003361251C0611DD63A42674BC0832F0018451151C0928C9F3D8C664BC0CF606011741051C0BCBCF4874A664BC0D04B2080AF0F51C063A8AE6F2C664BC066D9DF4E6C0F51C09604997E38664BC03A6E004F3D0F51C0758AEB9E10664BC0E7B920839E0E51C04F127D04DF654BC0BC0B6123730E51C05991C99000654BC0F56FE0D3510E51C05426BBEDD0644BC0	t	1	2026-05-03 18:13:24.564	2026-05-05 19:28:45.235
zone_1777788896680_2y869o	Zona C — Alta / Difícil	#ef4444	1.35	350	0103000020E6100000010000001A000000AE47E17A141651C01283C0CAA1654BC0CD9D6B28AD1551C03B7881EDFB664BC023F2239F531551C0118EAFF6DD664BC0C82BDD4BC41451C0D1A1A1B96D664BC0E03C4E31641451C0DE5227D042664BC03B10B1C62B1451C02D2AE2C829664BC0251493EA021451C0776D891914664BC0B27675DAC21351C05B7203660C664BC0DD8080A5451351C024BA4089D2654BC0CE5E31052B1351C0DD059EA6D3654BC0BF3C62C91C1351C082F1E39AC8654BC0D65C45B1021351C0DB0D4243B6654BC04CBF0A116C1251C019B4A46438654BC00B6233CF101251C0031450CCED644BC088D9477ECF1151C0CC279822DA644BC00E2D5C9D961151C0FA184656CB644BC096D78493B81051C06C3E4171A6644BC08D941E67091051C02771749AE7644BC0E3FBB7D2580F51C04DC9E6681D654BC0A1DCEBE1A10D51C05936CE015D644BC0E17A14AE471151C0E17A14AE47614BC0AE47E17A141651C0C3F5285C8F624BC0B81E85EB511851C014AE47E17A644BC00E6CE1EE361651C0E386123F5C664BC05481E1FCB01551C0FC111764F1664BC0AE47E17A141651C01283C0CAA1654BC0	t	3	2026-05-03 06:14:56.685	2026-05-05 21:54:30.285
zone_1778019117199_6b2b2x	USHUAIA	#ef4444	1	0	0103000020E6100000010000000800000011C14F54CA1951C081C69BE872684BC042B54FB4751D51C03194C1417C6D4BC072A94F14761751C0550DAEF8476F4BC0F44A4F14850851C0547F15C4A6684BC096454F34A90F51C0E6E2A725A15F4BC086274FB4861B51C0EBF6AD6434634BC05AE24FF4831A51C066D1694D1B674BC011C14F54CA1951C081C69BE872684BC0	t	0	2026-05-05 22:11:57.197	2026-05-06 12:41:05.748
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Driver" (id, "userId", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor", "licensePlate", cuit, "licenciaUrl", "seguroUrl", "vtvUrl", "dniFrenteUrl", "dniDorsoUrl", "acceptedTermsAt", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt", "availabilityStatus", "lastLocationAt", latitude, longitude, "approvalStatus", "approvedAt", "rejectionReason", ubicacion, "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "fraudScore", "lastFraudCheckAt", "acceptedPrivacyAt", "cedulaVerdeApprovedAt", "cedulaVerdeExpiresAt", "cedulaVerdeNotifiedStage", "cedulaVerdeRejectionReason", "cedulaVerdeStatus", "cedulaVerdeUrl", "constanciaCuitApprovedAt", "constanciaCuitRejectionReason", "constanciaCuitStatus", "constanciaCuitUrl", "cuitApprovedAt", "cuitRejectionReason", "cuitStatus", "dniDorsoApprovedAt", "dniDorsoRejectionReason", "dniDorsoStatus", "dniFrenteApprovedAt", "dniFrenteRejectionReason", "dniFrenteStatus", "licenciaApprovedAt", "licenciaExpiresAt", "licenciaNotifiedStage", "licenciaRejectionReason", "licenciaStatus", "seguroApprovedAt", "seguroExpiresAt", "seguroNotifiedStage", "seguroRejectionReason", "seguroStatus", "vtvApprovedAt", "vtvExpiresAt", "vtvNotifiedStage", "vtvRejectionReason", "vtvStatus", "cedulaVerdeApprovalNote", "cedulaVerdeApprovalSource", "constanciaCuitApprovalNote", "constanciaCuitApprovalSource", "cuitApprovalNote", "cuitApprovalSource", "dniDorsoApprovalNote", "dniDorsoApprovalSource", "dniFrenteApprovalNote", "dniFrenteApprovalSource", "licenciaApprovalNote", "licenciaApprovalSource", "seguroApprovalNote", "seguroApprovalSource", "vtvApprovalNote", "vtvApprovalSource", "bankAccountUpdatedAt", "bankAlias", "bankCbu", "applicationStatus", "cancelledByUserAt", "cancelledByUserReason", "pausedByUserAt", "pausedByUserReason") FROM stdin;
cmobtv7ww000stqiamj6sh7w5	cmobtv7wq000ptqia8qc32mkw	AUTO	Fiat	Cronos	2025	Negro	AA123AB	11465303571ad0ab892b7021ef498bb4:19b7fd1ef2212e4e9b3281494fdebd4b:338944da06a188b008d40f4645	\N	\N	\N	\N	\N	2026-04-23 18:41:19.558	f	f	0	\N	2026-04-23 18:41:19.568	2026-04-25 05:32:31.916	FUERA_DE_SERVICIO	\N	\N	\N	REJECTED	2026-04-23 18:43:05.258	Aun falta documentación	\N	f	\N	\N	\N	0	\N	2026-04-23 18:41:19.558	\N	\N	0	\N	PENDING	\N	\N	\N	PENDING	\N	2026-04-24 19:54:45.067	\N	APPROVED	\N	\N	PENDING	\N	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	DRAFT	\N	\N	\N	\N
cmohdinef0002tf8b8fsd3yov	cmodw2bcv0004ornia10d6of8	CAMIONETA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 15:50:16.301	t	f	0	\N	2026-04-27 15:50:16.309	2026-04-28 14:19:19.384	FUERA_DE_SERVICIO	2026-04-28 14:19:29.957	-54.83189142542994	-68.35034410002064	APPROVED	2026-04-28 13:41:49.084	\N	0101000020E6100000DAFBA8096C1651C0AF05116B7B6A4BC0	f	\N	\N	\N	0	\N	\N	\N	\N	0	\N	PENDING	\N	\N	\N	PENDING	\N	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	\N	\N	\N	\N
cmp60qa3x000ad60sjehyggb3	cmp60qa3g0007d60svwywx818	AUTO			\N		\N	\N	\N	\N	\N	\N	\N	2026-05-14 21:46:31.694	t	f	4	5	2026-05-14 21:46:31.725	2026-05-18 17:16:45.688	FUERA_DE_SERVICIO	2026-05-19 15:23:13.311	-54.83176396570548	-68.3504287972738	APPROVED	2026-05-14 22:17:54.239	\N	0101000020E610000087F7E76C6D1651C02059DB3D776A4BC0	f	\N	\N	\N	1	\N	2026-05-14 21:46:31.694	\N	\N	0	\N	PENDING	\N	\N	\N	PENDING	\N	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	0	\N	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-17 21:55:24.061	vsolutions.ush	\N	APPROVED	\N	\N	\N	\N
cmocz8aty0001ju1tiijq1c94	cmobkazic0002w4k6sk1luhha	CAMIONETA	Jeep	Renegade	2024	Gris	AA123BB	61728dc61b349d576ac83410337d2f79:4001b3ab937893ce7ab46910f67f7fc9:069687e10f894f0b92e288	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038752559-IMG_4108.webp	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038763186-IMG_4108.webp	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038766670-IMG_4108.webp	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038361921-IMG_4107.webp	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038366210-IMG_4108.webp	2026-04-24 13:59:14.119	t	f	0	\N	2026-04-24 13:59:14.133	2026-05-14 19:56:42.291	FUERA_DE_SERVICIO	2026-05-14 21:36:46.529	-54.83137412780862	-68.35034519982729	APPROVED	2026-04-24 15:11:49.405	\N	0101000020E610000067E4450E6C1651C0DBD6A8776A6A4BC0	f	\N	\N	\N	0	\N	\N	\N	2026-04-30 00:00:00	0	\N	PENDING	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038770570-IMG_4108.webp	\N	\N	PENDING	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777038375264-ARCA_-_Agencia_de_Recaudación_y_Control_Aduanero.pdf	2026-04-25 21:21:34.232	\N	APPROVED	\N	\N	PENDING	\N	\N	PENDING	\N	2026-04-30 00:00:00	0	\N	PENDING	\N	2026-04-30 00:00:00	0	\N	PENDING	\N	2026-04-30 00:00:00	0	\N	PENDING	\N	\N	\N	\N	\N	DIGITAL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	DRAFT	\N	\N	\N	\N
cmoqaehms000permanxjcoebd	cmoqaehm7000kerma58f7mpn4	MOTO	Honda	Wave	2022	Rojo	AC123BD	20234567894	\N	\N	\N	\N	\N	2026-05-05 19:38:35.171	t	f	0	\N	2026-05-03 21:32:58.948	2026-05-07 01:12:25.33	FUERA_DE_SERVICIO	2026-05-08 14:19:39.806	-54.83102784377062	-68.35076657990399	APPROVED	2026-05-05 19:38:35.171	\N	0101000020E6100000EA4DABF5721651C0B587D11E5F6A4BC0	f	\N	\N	\N	0	\N	2026-05-05 19:38:35.171	2026-05-05 19:38:35.171	\N	0	\N	APPROVED	\N	2026-05-05 19:38:35.171	\N	APPROVED	\N	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:38:35.171	2027-05-05 19:38:35.171	0	\N	APPROVED	2026-05-05 19:38:35.171	2026-11-01 19:38:35.171	0	\N	APPROVED	2026-05-05 19:38:35.171	2027-05-05 19:38:35.171	0	\N	APPROVED	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-05 19:38:35.171	\N	0070123456789012345679	APPROVED	\N	\N	\N	\N
\.


--
-- Data for Name: DriverAvailabilitySubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DriverAvailabilitySubscription" (id, "userId", latitude, longitude, "merchantId", "createdAt", "expiresAt", "notifiedAt") FROM stdin;
cmou67pdz0002fehvqajt0n3l	cmoqaeh2r0000erma67dv4jv8	-54.806	-68.302	cmoqaehc10009ermak74cbcs4	2026-05-06 14:46:48.647	2026-05-06 18:46:48.598	\N
cmounjmvo0002x4kt59c9jtf4	cmoqaeh2r0000erma67dv4jv8	-54.806	-68.302	cmoqaehc10009ermak74cbcs4	2026-05-06 22:51:58.74	2026-05-07 02:51:58.708	\N
cmpa82rmn00148eo0ojj8mhgl	cmobkazic0002w4k6sk1luhha	-54.8317324	-68.3504155	cmoqaehc10009ermak74cbcs4	2026-05-17 20:23:16.319	2026-05-18 00:23:16.252	\N
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
cmod65qgz0000sabwxgatu2ug	welcome	Bienvenida comprador	¡Bienvenido a MOOVY! 🎉	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n                <h2 style="color: #111827; margin-top: 0;">¡Hola María López! 👋</h2>\n                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                    ¡Bienvenido a la comunidad MOOVY! Ya podés empezar a disfrutar de todos los beneficios.\n                </p>\n                <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">\n                    <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px;">⭐ Tu código de referido</h3>\n                    <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">MARIA2026</p>\n                    <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Compartílo y gana puntos MOOVER cuando tus amigos compren</p>\n                </div>\n                <h3 style="color: #111827; font-size: 16px; margin-top: 25px;">¿Qué podés hacer con MOOVY?</h3>\n                <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">\n                    <li>🛍️ <strong>Comprar</strong> en comercios locales</li>\n                    <li>🚀 <strong>Recibir</strong> tus pedidos en minutos</li>\n                    <li>⭐ <strong>Sumar puntos MOOVER</strong> con cada compra</li>\n                    <li>🎁 <strong>Canjear</strong> tus puntos por descuentos exclusivos</li>\n                    <li>👥 <strong>Referir amigos</strong> y ganar más puntos</li>\n                </ul>\n                \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Empezar a comprar\n        </a>\n    </div>\n            \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.746	2026-04-24 17:13:11.746
cmod65qhk0001sabwuracn7af	order_confirmation	Pedido confirmado	¡Confirmación de tu pedido MOV-20260320-001! 🛍️	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n                <div style="text-align: center; margin-bottom: 25px;">\n                    <div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Confirmado</div>\n                    <h2 style="color: #111827; margin-top: 0;">¡Gracias por tu compra, María López!</h2>\n                    <p style="color: #6b7280; font-size: 16px;">Recibimos tu pedido <strong>#MOV-20260320-001</strong> y ya estamos trabajando en él.</p>\n                </div>\n                <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                    <h3 style="color: #1a202c; font-size: 16px; margin-top: 0; margin-bottom: 15px;">Resumen del Pedido</h3>\n                    <table style="width: 100%; border-collapse: collapse;">\n                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">Hamburguesa clásica<div style="font-size: 12px; color: #a0aec0;">x2</div></td><td style="text-align: right; color: #2d3748; font-weight: 500;">$2.400</td></tr>\n                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #4a5568;">Coca-Cola 500ml<div style="font-size: 12px; color: #a0aec0;">x2</div></td><td style="text-align: right; color: #2d3748; font-weight: 500;">$1.400</td></tr>\n                    </table>\n                    <table style="width: 100%; margin-top: 15px;">\n                        <tr><td style="color: #718096; font-size: 14px;">Subtotal</td><td style="text-align: right; color: #2d3748;">$3.800</td></tr>\n                        <tr><td style="color: #718096; font-size: 14px;">Envío</td><td style="text-align: right; color: #2d3748;">$500</td></tr>\n                        <tr><td style="color: #e53e3e; font-size: 14px;">Descuento</td><td style="text-align: right; color: #e53e3e;">-$200</td></tr>\n                        <tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding-top: 15px;">$4.500</td></tr>\n                    </table>\n                </div>\n                \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver estado de mi pedido\n        </a>\n    </div>\n            \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.769	2026-04-24 17:13:11.769
cmod65qhs0002sabwqwaod8pf	password_reset	Recuperar contraseña	Restablecer contraseña - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Restablecer contraseña</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Recibimos una solicitud para restablecer tu contraseña.\n                Hacé click en el botón de abajo para crear una nueva contraseña.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="#"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Restablecer Contraseña\n        </a>\n    </div>\n            <p style="color: #9ca3af; font-size: 14px;">\n                Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, podés ignorar este correo.\n            </p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.776	2026-04-24 17:13:11.776
cmod65qi00003sabwknzjkpcg	password_changed	Contraseña cambiada	Tu contraseña fue cambiada - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Contraseña actualizada</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu contraseña fue cambiada exitosamente el <strong>20/03/2026 a las 14:30</strong>.\n            </p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;">\n                <p style="margin: 0; font-size: 14px;">\n                    <strong>¿No fuiste vos?</strong> Si no realizaste este cambio, contactá a soporte inmediatamente.\n                </p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.784	2026-04-24 17:13:11.784
cmod65qi80004sabwih00kztc	driver_request_admin	Solicitud repartidor (→ admin)	🚗 Nueva solicitud de repartidor	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">Nueva solicitud de repartidor</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Un usuario quiere ser repartidor en MOOVY:</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <p style="margin: 5px 0; color: #4a5568;"><strong>Nombre:</strong> Carlos Gómez</p>\n                <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> carlos@ejemplo.com</p>\n            </div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/repartidores"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	admin	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.792	2026-04-24 17:13:11.792
cmod65qiq0005sabwhga96bw0	driver_approved	Repartidor aprobado	🎉 ¡Tu solicitud de repartidor fue aprobada!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0;">¡Bienvenido al equipo, Carlos Gómez! 🚗</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu solicitud para ser repartidor MOOVY fue <strong style="color: #059669;">aprobada</strong>.\n                Ya podés conectarte desde tu panel y empezar a recibir pedidos.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/repartidor"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel de repartidor\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.811	2026-04-24 17:13:11.811
cmod65qiy0006sabwvofgz1ax	merchant_request_received	Solicitud de comercio recibida	📋 Recibimos tu solicitud de comercio - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud Recibida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Hola Juan Pérez!</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Recibimos tu solicitud para registrar <strong>Panadería Don Juan</strong> en MOOVY.\n                Nuestro equipo va a revisar tu información y documentación en las próximas 24-48 horas hábiles.\n            </p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;">\n                <h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">¿Qué sigue?</h4>\n                <ol style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">\n                    <li>Verificamos tu documentación fiscal y legal</li>\n                    <li>Revisamos que la información de tu comercio esté completa</li>\n                    <li>Te notificamos por email si tu tienda fue aprobada</li>\n                </ol>\n            </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.818	2026-04-24 17:13:11.818
cmod65qj70007sabwzuxqp906	merchant_approved	Tienda aprobada	🎉 ¡Tu comercio fue aprobado en MOOVY!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">¡Aprobada!</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Felicitaciones, Juan Pérez! 🎉</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">\n                Tu comercio <strong>Panadería Don Juan</strong> fue <strong style="color: #059669;">aprobado</strong> y ya está activo en MOOVY.\n            </p>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir a mi panel de comercio\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.828	2026-04-24 17:13:11.828
cmod65qje0008sabwjg3hsehf	merchant_rejected	Tienda rechazada	📋 Actualización sobre tu solicitud de comercio - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud No Aprobada</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Hola Juan Pérez</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos informarte que la solicitud de tu comercio <strong>Panadería Don Juan</strong> no pudo ser aprobada en este momento.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Documentación fiscal incompleta. Falta constancia de inscripción AFIP.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.835	2026-04-24 17:13:11.835
cmod65qjl0009sabwrtb0bwbv	driver_request_received	Solicitud de repartidor recibida	📋 Recibimos tu solicitud de repartidor - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud Recibida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Hola Carlos Gómez!</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Recibimos tu solicitud para ser repartidor MOOVY con <strong>Moto</strong>. Nuestro equipo va a revisar tu documentación en las próximas 24-48 horas hábiles.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;"><li>DNI (frente y dorso)</li><li>Licencia de conducir</li><li>Seguro del vehículo</li><li>Datos fiscales (CUIT)</li></ul></div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.842	2026-04-24 17:13:11.842
cmod65qjs000asabw5mitv12p	driver_rejected	Repartidor rechazado	📋 Actualización sobre tu solicitud de repartidor - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Solicitud No Aprobada</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Hola Carlos Gómez</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Lamentamos informarte que tu solicitud para ser repartidor en MOOVY no pudo ser aprobada.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Licencia de conducir vencida. Por favor renovála y volvé a postularte.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.849	2026-04-24 17:13:11.849
cmod65qk0000bsabwmkz92peq	payment_pending	Pago pendiente	⏳ Pago pendiente - Pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pago Pendiente</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pago está en proceso, María López</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Recibimos tu pedido <strong>#MOV-20260320-001</strong> pero el pago aún está pendiente de confirmación.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px;">$4.500</td></tr></table></div>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>No te preocupes.</strong> Te avisaremos apenas se acredite.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.856	2026-04-24 17:13:11.856
cmod65qk8000csabwmgknacaa	payment_rejected	Pago rechazado	❌ Pago rechazado - Pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pago Rechazado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pago no pudo ser procesado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola María López, el pago de tu pedido <strong>#MOV-20260320-001</strong> por <strong style="color: #e60012;">$4.500</strong> fue rechazado.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Fondos insuficientes</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Reintentar compra\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.864	2026-04-24 17:13:11.864
cmod65qkg000dsabwvd8wbol8	order_rejected_merchant	Pedido rechazado por comercio	📋 Tu pedido #MOV-20260320-001 fue rechazado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Rechazado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado por el comercio</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola María López, <strong>Panadería Don Juan</strong> no pudo aceptar tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Producto sin stock temporalmente</p></div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> Se te devolverán <strong>$4.500</strong> automáticamente.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Hacer otro pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.872	2026-04-24 17:13:11.872
cmod65qkn000esabwowai9ej5	order_delivered	Pedido entregado	✅ ¡Tu pedido #MOV-20260320-001 fue entregado!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">¡Entregado!</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Tu pedido llegó! 🎉</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu pedido <strong>#MOV-20260320-001</strong> por <strong>$4.500</strong> fue entregado exitosamente. Tiempo de entrega: <strong>32 minutos</strong>.</p>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;">⭐ <strong>¿Cómo fue tu experiencia?</strong> Tu calificación nos ayuda a mejorar.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Calificar pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.879	2026-04-24 17:13:11.879
cmod65qku000fsabwk9q13irq	order_cancelled_buyer	Pedido cancelado por comprador	Pedido #MOV-20260320-001 cancelado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #f3f4f6; color: #4b5563; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Cancelado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Cancelaste tu pedido</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos la cancelación de tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $4.500 serán devueltos a tu medio de pago. Puede demorar entre 2 y 10 días hábiles.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Volver a la tienda\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.886	2026-04-24 17:13:11.886
cmod65ql1000gsabw1zmmr1sa	order_cancelled_merchant	Pedido cancelado por comercio	📋 Tu pedido #MOV-20260320-001 fue cancelado	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Cancelado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Panadería Don Juan canceló tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Local cerrado por emergencia</p></div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $4.500 serán devueltos.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Hacer otro pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.894	2026-04-24 17:13:11.894
cmod65ql8000hsabw52wh05sb	order_cancelled_system	Pedido cancelado por sistema	⚠️ Pedido #MOV-20260320-001 cancelado automáticamente	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Pedido Cancelado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu pedido fue cancelado automáticamente</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu pedido <strong>#MOV-20260320-001</strong> fue cancelado automáticamente.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> El comercio no respondió dentro del tiempo límite.</p></div>\n            <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #166534; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Reembolso:</strong> $4.500 serán devueltos.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/tienda"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Reintentar pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.9	2026-04-24 17:13:11.9
cmod65qlf000isabw7c1fy87k	refund_processed	Reembolso procesado	💸 Reembolso procesado - Pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Reembolso Procesado</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu reembolso fue procesado</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos el reembolso de tu pedido <strong>#MOV-20260320-001</strong>.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px;">Monto</td><td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px;">$4.500</td></tr><tr><td style="color: #718096; font-size: 14px;">Medio</td><td style="text-align: right; color: #2d3748;">MercadoPago</td></tr></table></div>\n            <div style="background: #f5f5f5; border-left: 3px solid #1a1a1a; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #1a1a1a; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;">El reembolso puede demorar entre <strong>2 y 10 días hábiles</strong>.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/mis-pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mis pedidos\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.908	2026-04-24 17:13:11.908
cmod65qlm000jsabw1i3pxdl8	merchant_new_order	Nuevo pedido recibido (comercio)	🔔 Nuevo pedido #MOV-20260320-001 - $4.500	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🔔 Nuevo Pedido</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Tenés un nuevo pedido!</h2>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td><td style="text-align: right; color: #2d3748; font-weight: bold;">#MOV-20260320-001</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Cliente</td><td style="text-align: right; color: #2d3748;">María López</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Productos</td><td style="text-align: right; color: #2d3748;">3 items</td></tr><tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Total</td><td style="text-align: right; color: #e60012; font-weight: bold; font-size: 18px; padding-top: 15px;">$4.500</td></tr></table></div>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>⏰ Importante:</strong> Aceptá o rechazá el pedido lo antes posible.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver pedido en mi panel\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.914	2026-04-24 17:13:11.914
cmod65qlt000ksabwvcx42dcb	merchant_order_reminder	Recordatorio pedido sin aceptar	⚠️ ¡Pedido #MOV-20260320-001 esperando tu respuesta!	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">⚠️ Pedido Sin Respuesta</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tenés un pedido pendiente de aceptar</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">El pedido <strong>#MOV-20260320-001</strong> lleva <strong>8 minutos</strong> sin respuesta. Si no lo aceptás en los próximos <strong>7 minutos</strong>, se cancelará automáticamente.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px; font-weight: bold;">⏰ Tiempo restante: 7 minutos</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Aceptar pedido ahora\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.922	2026-04-24 17:13:11.922
cmod65qm3000lsabw9tdkvfv3	merchant_payment_received	Pago recibido (comercio)	💰 Pago recibido por pedido #MOV-20260320-001	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #def7ec; color: #03543f; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">💰 Pago Recibido</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">¡Recibiste un pago!</h2>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Pedido</td><td style="text-align: right; color: #2d3748; font-weight: 500;">#MOV-20260320-001</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Monto bruto</td><td style="text-align: right; color: #2d3748;">$4.500</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Comisión MOOVY</td><td style="text-align: right; color: #ef4444;">-$360</td></tr><tr><td style="color: #1a202c; font-weight: bold; font-size: 18px; padding-top: 15px;">Neto a cobrar</td><td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px; padding-top: 15px;">$3.640</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/comercios/pagos"\n           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver mis ganancias\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.932	2026-04-24 17:13:11.932
cmod65qma000msabwpjlnasdn	merchant_suspended	Tienda suspendida	⚠️ Tu comercio fue suspendido - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Tienda Suspendida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu tienda fue suspendida</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu comercio <strong>Panadería Don Juan</strong> fue suspendido temporalmente.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Múltiples reclamos sin resolver de clientes.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comercio	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.939	2026-04-24 17:13:11.939
cmod65qmk000nsabw5sj5hv9o	driver_suspended	Cuenta repartidor suspendida	⚠️ Tu cuenta de repartidor fue suspendida - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Cuenta Suspendida</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu cuenta de repartidor fue suspendida</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Tu cuenta de repartidor en MOOVY fue suspendida temporalmente.</p>\n            <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #991b1b; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> Documentación vencida (licencia de conducir).</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	repartidor	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.949	2026-04-24 17:13:11.949
cmod65qms000osabwzn50r7yp	account_deletion_request	Solicitud eliminación de cuenta	⚠️ Solicitud de eliminación de cuenta - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Solicitud de eliminación de cuenta</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Hola María López, recibimos tu solicitud para eliminar tu cuenta de MOOVY.</p>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Tu cuenta será eliminada permanentemente el 03/04/2026.</strong> Este proceso es irreversible.</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ayuda"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Contactar Soporte\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.956	2026-04-24 17:13:11.956
cmod65qn6000psabw0ishlywp	account_deleted	Cuenta eliminada	Confirmación: tu cuenta fue eliminada - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Tu cuenta fue eliminada</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">Confirmamos que tu cuenta y todos tus datos personales fueron eliminados permanentemente, en cumplimiento con la Ley 25.326.</p>\n            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">Este es el último correo que recibirás de MOOVY.</p>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.971	2026-04-24 17:13:11.971
cmod65qne000qsabwzi1daa7y	owner_critical_alert	Alerta crítica (Owner)	[🔴 CRÍTICO] Pasarela de pagos caída - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🔴 CRÍTICO</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Pasarela de pagos no responde</h2>\n            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">La API de MercadoPago no está respondiendo. Los pagos con tarjeta están fallando.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><h4 style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Detalles técnicos</h4><pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #334155; margin: 0;">Error: ECONNREFUSED\nEndpoint: https://api.mercadopago.com/v1/payments\nÚltimo intento: 2026-03-20 14:30:00 ART\nFallas consecutivas: 5</pre></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ir al panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.978	2026-04-24 17:13:11.978
cmod65qnl000rsabw78jao9ag	owner_unassigned_orders	Pedidos sin repartidor (Owner)	🟠 3 pedidos sin repartidor - MOOVY	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #fffbeb; color: #92400e; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">🟠 Pedidos Sin Repartidor</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">3 pedidos sin repartidor asignado</h2>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>3 pedidos</strong> están esperando repartidor. El más antiguo lleva <strong>12 minutos</strong>.</p></div>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><p style="color: #718096; font-size: 14px; margin: 0;"><strong>Pedidos:</strong> #MOV-001, #MOV-002, #MOV-003</p></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/pedidos"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver pedidos en OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.986	2026-04-24 17:13:11.986
cmod65qnt000ssabw53at2mdp	owner_daily_report	Reporte diario (Owner)	📊 Reporte diario MOOVY — 20/03/2026	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <h2 style="color: #111827; margin-top: 0; text-align: center;">📊 Reporte Diario — 20/03/2026</h2>\n            <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 20px 0;">\n                <tr>\n                    <td style="background: #eff6ff; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #1e40af; font-size: 28px; font-weight: bold;">47</div><div style="color: #3b82f6; font-size: 12px; text-transform: uppercase;">Pedidos</div></td>\n                    <td style="background: #f0fdf4; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #166534; font-size: 28px; font-weight: bold;">$285.400</div><div style="color: #22c55e; font-size: 12px; text-transform: uppercase;">Facturación</div></td>\n                    <td style="background: #fef3c7; border-radius: 10px; padding: 16px; text-align: center; width: 33%;"><div style="color: #92400e; font-size: 28px; font-weight: bold;">$22.832</div><div style="color: #f59e0b; font-size: 12px; text-transform: uppercase;">Comisión</div></td>\n                </tr>\n            </table>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Completados</td><td style="text-align: right; color: #059669; font-weight: 500;">42 (89%)</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Cancelados</td><td style="text-align: right; color: #ef4444; font-weight: 500;">5</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Tiempo promedio</td><td style="text-align: right; color: #2d3748; font-weight: 500;">28 min</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Nuevos usuarios</td><td style="text-align: right; color: #2d3748; font-weight: 500;">12</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 6px 0;">Top comercio</td><td style="text-align: right; color: #2d3748; font-weight: 500;">Don Juan (8 pedidos)</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/revenue"\n           style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver dashboard completo\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:11.993	2026-04-24 17:13:11.993
cmod65qo0000tsabwg81c1kgr	owner_data_deletion_request	Solicitud eliminación datos (Owner)	📋 [COMPLIANCE] Solicitud eliminación de datos	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: #eff6ff; color: #1e40af; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">📋 Solicitud ARCO</div></div>\n            <h2 style="color: #111827; margin-top: 0; text-align: center;">Solicitud de eliminación de datos personales</h2>\n            <div style="background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.6;"><p style="margin: 0; font-size: 14px;"><strong>Plazo legal:</strong> 10 días hábiles para completar (Ley 25.326, Art. 16).</p></div>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Usuario</td><td style="text-align: right; color: #2d3748;">${SAMPLE.buyerName}</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Email</td><td style="text-align: right; color: #2d3748;">maria@ejemplo.com</td></tr><tr><td style="color: #718096; font-size: 14px; padding: 4px 0;">Roles</td><td style="text-align: right; color: #2d3748;">USER, SELLER</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/ops/clientes"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Ver en panel OPS\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	system	owner	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:12.001	2026-04-24 17:13:12.001
cmod65qo7000usabwd6i6r00v	cart_abandonment_1st	Carrito abandonado (1er recordatorio)	${nombre}, dejaste algo en tu carrito 🛒	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Tu carrito</div>\n            <h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¿Te olvidaste de algo?</h2>\n            <p style="color: #718096; margin: 0 0 20px;">Guardamos tu carrito para que puedas completar tu pedido cuando quieras.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Medialunas artesanales x6</strong></td><td style="text-align: right; font-weight: 600;">$3.500</td></tr><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Café con leche grande</strong> <span style="color: #718096; font-size: 13px;"> × 2</span></td><td style="text-align: right; font-weight: 600;">$5.000</td></tr><tr><td style="padding: 14px 0 0; font-weight: 700; font-size: 16px;">Total</td><td style="text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">$8.500</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/checkout"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Completar mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:12.008	2026-04-24 17:13:12.008
cmod65qoe000vsabwq906eajk	cart_abandonment_2nd	Carrito abandonado (2do recordatorio)	¡Tu carrito te espera, ${nombre}! 🛒	\n<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>MOOVY</title>\n</head>\n<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">\n<tr><td align="center" style="padding: 0;">\n<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%;">\n\n    <!-- Header -->\n    <tr><td style="padding: 40px 40px 32px 40px; text-align: center;">\n        <img src="https://somosmoovy.com/logo-moovy.svg" alt="MOOVY" style="height: 32px; width: auto;" />\n    </td></tr>\n\n    <!-- Accent line -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 3px; background: #e60012; border-radius: 2px;"></div>\n    </td></tr>\n\n    <!-- Content -->\n    <tr><td style="padding: 32px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">\n        \n            <div style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;">Tu carrito</div>\n            <h2 style="color: #2d3748; font-size: 22px; margin: 0 0 10px;">¡Tus productos siguen esperándote!</h2>\n            <p style="color: #718096; margin: 0 0 20px;">No te quedes sin ellos — otros compradores también los están viendo.</p>\n            <div style="background-color: #fafafa; border-radius: 8px; padding: 24px; margin: 24px 0;"><table style="width: 100%;"><tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Medialunas artesanales x6</strong></td><td style="text-align: right; font-weight: 600;">$3.500</td></tr><tr><td style="padding: 14px 0 0; font-weight: 700; font-size: 16px;">Total</td><td style="text-align: right; font-weight: 700; color: #e60012; font-size: 16px;">$3.500</td></tr></table></div>\n            \n    <div style="text-align: center; margin: 32px 0;">\n        <a href="https://somosmoovy.com/checkout"\n           style="display: inline-block; background-color: #e60012; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.02em;">\n            Completar mi pedido\n        </a>\n    </div>\n        \n    </td></tr>\n\n    <!-- Footer -->\n    <tr><td style="padding: 0 40px;">\n        <div style="height: 1px; background: #f0f0f0;"></div>\n    </td></tr>\n    <tr><td style="padding: 24px 40px 40px 40px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">\n        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">&copy; 2026 MOOVY. Ushuaia, Tierra del Fuego.</p>\n        <p style="margin: 0; color: #bbb; font-size: 12px;">Este es un correo autom&aacute;tico.</p>\n        \n    </td></tr>\n\n</table>\n</td></tr>\n</table>\n</body>\n</html>	[]	transactional	comprador	t	1	cmnuzx1fg0002zgw8zimoxguz	2026-04-24 17:13:12.014	2026-04-24 17:13:12.014
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
cmp9w9vu10000hfbsiyk6vgtt	merchant.publicidad	Publicidad	Permite a los comercios pagar por destacar productos o aparecer en banners. Mientras este OFF, el item 'Publicidad' no aparece en el menu del comercio y la pagina /comercios/publicidad redirige al dashboard.	MERCHANT	f	2026-05-17 14:52:52.969	2026-05-17 14:52:52.969	\N	\N
cmp9w9vui0002hfbs2bnc7hjm	merchant.tracking-en-vivo	Tracking en vivo del driver	Muestra al comercio el mapa con la ubicacion en tiempo real del repartidor que retiro su pedido. Si esta OFF, el comercio solo ve el estado de texto (DRIVER_ASSIGNED, PICKED_UP, etc.) sin mapa.	MERCHANT	f	2026-05-17 14:52:52.986	2026-05-17 14:52:52.986	\N	\N
cmp9w9vv80006hfbsset0o5kv	buyer.cash-payment	Pago en efectivo	Habilita el pago al driver con efectivo al recibir el pedido. Mientras este OFF, todos los pedidos se pagan online via MercadoPago.	BUYER	f	2026-05-17 14:52:53.013	2026-05-17 14:52:53.013	\N	\N
cmp9w9vuc0001hfbsbacg4brf	merchant.paquetes	Paquetes B2B	Permite a los comercios adquirir paquetes pre-armados de productos (combos de proveedores). Mientras este OFF, los items 'Adquirir paquetes' e 'Historial de paquetes' no aparecen en el menu y las paginas correspondientes redirigen al dashboard.	MERCHANT	f	2026-05-17 14:52:52.981	2026-05-17 17:51:57.23	cmnuzx1fg0002zgw8zimoxguz	2026-05-17 17:51:57.228
cmp9w9vun0003hfbsdpo0djx1	seller.paquetes	Paquetes para vendedores	Permite a los vendedores del marketplace adquirir paquetes B2B. Mientras este OFF, los items relacionados no aparecen en el menu del vendedor.	SELLER	f	2026-05-17 14:52:52.992	2026-05-17 21:31:52	cmnuzx1fg0002zgw8zimoxguz	2026-05-17 21:31:51.997
cmp9w9vuz0005hfbs40dh1828	buyer.scheduled-delivery	Pedidos programados	Habilita la opcion de programar entregas a una franja horaria futura (ej: 'entregar entre 20:00 y 21:00'). Mientras este OFF, todos los pedidos son entrega inmediata.	BUYER	f	2026-05-17 14:52:53.003	2026-05-18 03:34:45.591	cmnuzx1fg0002zgw8zimoxguz	2026-05-18 03:34:45.59
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

COPY public."Listing" (id, "sellerId", title, description, price, stock, condition, "weightKg", "lengthCm", "widthCm", "heightCm", "isActive", "categoryId", "listingType", "auctionEndsAt", "auctionDuration", "startingPrice", "bidIncrement", "currentBid", "currentBidderId", "totalBids", "auctionStatus", "auctionWinnerId", "winnerPaymentDeadline", "createdAt", "updatedAt", "deletedAt", "deletedBy", "deletedReason") FROM stdin;
\.


--
-- Data for Name: ListingImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ListingImage" (id, "listingId", url, "order") FROM stdin;
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "scheduleEnabled", "scheduleJson", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", "allowPickup", cuit, "constanciaAfipUrl", "habilitacionMunicipalUrl", "registroSanitarioUrl", "acceptedTermsAt", "acceptedPrivacyAt", category, "ownerId", "createdAt", "updatedAt", rating, "adminNotes", "bankAccount", "businessName", "commissionRate", cuil, "displayOrder", "facebookUrl", "instagramUrl", "isPremium", "ownerBirthDate", "ownerDni", "premiumTier", "premiumUntil", "startedAt", "whatsappNumber", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "approvalStatus", "approvedAt", "rejectionReason", ubicacion, "loyaltyTier", "loyaltyOrderCount", "loyaltyUpdatedAt", "commissionOverride", "commissionOverrideReason", "isSuspended", "loyaltyTierLocked", "suspendedAt", "suspendedUntil", "suspensionReason", "firstOrderWelcomeSentAt", "bankAccountApprovedAt", "bankAccountRejectionReason", "bankAccountStatus", "constanciaAfipApprovedAt", "constanciaAfipRejectionReason", "constanciaAfipStatus", "cuitApprovedAt", "cuitRejectionReason", "cuitStatus", "habilitacionMunicipalApprovedAt", "habilitacionMunicipalRejectionReason", "habilitacionMunicipalStatus", "registroSanitarioApprovedAt", "registroSanitarioRejectionReason", "registroSanitarioStatus", "bankAccountApprovalNote", "bankAccountApprovalSource", "constanciaAfipApprovalNote", "constanciaAfipApprovalSource", "cuitApprovalNote", "cuitApprovalSource", "habilitacionMunicipalApprovalNote", "habilitacionMunicipalApprovalSource", "registroSanitarioApprovalNote", "registroSanitarioApprovalSource", "applicationStatus", "cancelledByUserAt", "cancelledByUserReason", "pausedByUserAt", "pausedByUserReason") FROM stdin;
cmobll552000cw4k6blur8j08	9410	9410	Nuevo comercio Moovy	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1776969410283-logo.webp	\N	t	t	t	{"1":[{"open":"09:00","close":"21:00"}],"2":[{"open":"09:00","close":"21:00"}],"3":[{"open":"09:00","close":"21:00"}],"4":[{"open":"09:00","close":"21:00"}],"5":[{"open":"09:00","close":"21:00"}],"6":[{"open":"10:00","close":"14:00"}],"7":null}	t	maugrod@gmail.com	+5492901652974	12 de Octubre 86	-54.8140765	-68.3201575	5	30	45	0	0	f	206772d008396df2cf2f0aed76278b92:362552f4805c58a151973d643000cd57:c3e8575a29c0b3fa19c3daf627	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1776955754435-Guia_de_Descargas.pdf	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1776955765679-Guia_de_Descargas.pdf	\N	2026-04-23 14:49:32.477	2026-04-23 14:49:32.477	Kiosco	cmobkazic0002w4k6sk1luhha	2026-04-23 14:49:32.485	2026-04-25 13:58:54.635	\N	\N	58950ffa58bebb376038d1ff7bce4866:db204b962af55ff44ae99d9f2c1edee2:62a1aff9fdcafa0dd4e088144d2c57816c83a0d1f2	9410	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-04-23 14:51:09.142	\N	\N	BRONCE	0	2026-04-23 14:49:32.485	\N	\N	f	f	\N	\N	\N	2026-04-25 13:58:54.621	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	DRAFT	\N	\N	\N	\N
cmohb69hn000111lk85n20sqd	AMPM	ampm	Nuevo comercio Moovy	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777780582300-logo.webp	\N	t	f	t	{"1":[{"open":"09:00","close":"21:00"}],"2":[{"open":"09:00","close":"21:00"}],"3":[{"open":"09:00","close":"21:00"}],"4":[{"open":"09:00","close":"21:00"}],"5":[{"open":"09:00","close":"21:00"}],"6":[{"open":"10:00","close":"14:00"}],"7":[{"open":"00:00","close":"09:00"}]}	t	getinnerdrop@gmail.com	+5492901123456	Avenida San Martín 1100	-54.80848820000001	-68.31312	5	30	45	0	0	f	\N	\N	\N	\N	2026-04-27 14:44:39.173	2026-04-27 14:44:39.173	Restaurante	cmodw2bcv0004ornia10d6of8	2026-04-27 14:44:39.178	2026-05-03 04:03:06.941	\N	\N	\N	AMPM	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-04-27 14:46:15.21	\N	\N	BRONCE	0	2026-04-27 14:44:39.178	\N	\N	f	f	\N	\N	\N	\N	2026-05-03 03:55:40.231	\N	APPROVED	2026-05-03 03:55:43.817	\N	APPROVED	2026-05-03 03:55:36.683	\N	APPROVED	2026-05-03 03:55:47.82	\N	APPROVED	2026-05-03 03:55:51.185	\N	APPROVED	Entregado	PHYSICAL	Entregado	PHYSICAL	Entregado	PHYSICAL	Entregado	PHYSICAL	Entregado	PHYSICAL	DRAFT	\N	\N	\N	\N
cmodwjkyu000hornifywezk15	ALNAAR	alnaar	Nuevo comercio Moovy	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777293078849-logo.webp	\N	t	t	t	{"1":[{"open":"09:00","close":"21:00"}],"2":[{"open":"09:00","close":"21:00"}],"3":[{"open":"09:00","close":"21:00"}],"4":[{"open":"09:00","close":"21:00"}],"5":[{"open":"09:00","close":"21:00"}],"6":[{"open":"10:00","close":"14:00"}],"7":null}	t	ing.iyad@gmail.com	+5492901123456	Paseo de la Plaza 2165	-54.8283965	-68.3506829	5	30	45	0	0	f	fff158aa31323d417f90fba6595889a2:180a2326bbfaf6e48805c62483afcce0:dcd79cf5ad7f7ac13162f9dffa	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777125705370-Guia_de_Descargas.pdf	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777125714066-Guia_de_Descargas.pdf	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1777125719373-Guia_de_Descargas.pdf	2026-04-25 05:31:47.81	2026-04-25 05:31:47.81	Restaurante	cmobth34p0002tqiaji23ve3q	2026-04-25 05:31:47.814	2026-04-27 12:31:25.85	\N	\N	cc7440a9d6f7f07b6b1e60690a18722b:5f337fdb656f40b019ca35a57be6315c:79a96c4c06eec7dfe653	ALNAAR	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-04-27 12:27:33.747	\N	\N	BRONCE	0	2026-04-25 05:31:47.814	\N	\N	f	f	\N	\N	\N	2026-04-25 14:48:49.718	2026-04-25 14:01:03.597	\N	APPROVED	2026-04-27 12:29:43.025	\N	APPROVED	2026-04-25 14:01:03.596	\N	APPROVED	2026-04-27 12:29:46.511	\N	APPROVED	2026-04-27 12:29:49.296	\N	APPROVED	\N	\N	\N	DIGITAL	\N	\N	\N	DIGITAL	\N	DIGITAL	DRAFT	\N	\N	\N	\N
cmoem7nl10004k8grsztmzdot	LAMPARAS DE SAL	lamparas-de-sal	Nuevo comercio Moovy	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777143741416-logo.webp	\N	f	f	t	{"1":[{"open":"09:00","close":"21:00"}],"2":[{"open":"09:00","close":"21:00"}],"3":[{"open":"09:00","close":"21:00"}],"4":[{"open":"09:00","close":"21:00"}],"5":[{"open":"09:00","close":"21:00"}],"6":[{"open":"10:00","close":"14:00"}],"7":[{"open":"09:00","close":"23:59"}]}	t	test@somosmoovy.com	+54929012545287	Paseo de la Plaza 2000	-54.8289292	-68.3490242	5	30	45	0	0	f	4730c9f4aca9e2c0a26de0f0174d48c3:8a885e73957ecae74ae5b4caacd2bcb7:471003b66ee68c381ddaa9	\N	\N	\N	2026-04-25 17:30:21.322	2026-04-25 17:30:21.322	Otro	cmoem7nkg0001k8grd394va3v	2026-04-25 17:30:21.349	2026-05-03 03:52:52.54	5	\N	1efca9bb296c23d73dc3fcb5c60e2167:5d8454df0353df66b25f0770b4f806b5:6b86cc3c1409	LAMPARAS DE SAL	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-04-28 16:36:51.333	\N	\N	BRONCE	0	2026-04-25 17:30:21.349	\N	\N	f	f	\N	\N	\N	2026-04-26 16:23:08.145	2026-04-25 17:31:53.413	\N	APPROVED	2026-04-25 19:27:18.246	\N	APPROVED	2026-04-25 19:41:22.92	\N	APPROVED	2026-04-26 03:23:55.479	\N	APPROVED	2026-05-01 15:12:46.403	\N	APPROVED	\N	DIGITAL	Recibido en el dia de hoy	PHYSICAL	Ya actualizó su informacion manualmente	PHYSICAL	Me lo envio por mail	PHYSICAL	Recibido	PHYSICAL	APPROVED	\N	\N	\N	\N
cmoqaehc10009ermak74cbcs4	Comercio Test	comercio-test	Comercio sembrado para pruebas pre-launch	\N	\N	t	t	t	{"1":[{"open":"00:00","close":"22:00"}],"2":[{"open":"09:00","close":"22:00"}],"3":[{"open":"02:00","close":"22:00"}],"4":[{"open":"09:00","close":"23:59"}],"5":[{"open":"09:00","close":"22:00"}],"6":[{"open":"00:00","close":"22:00"}],"7":[{"open":"09:00","close":"23:59"}]}	f	merchant.test@moovy.local	+542901123456	Del Recodo 2310	-54.8316947	-68.3506112	15	20	40	0	0	f	30715432109	https://example.com/seed-afip.pdf	https://example.com/seed-habilitacion.pdf	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1778010762252-Gemini_Generated_Image_gpvm4dgpvm4dgpvm.webp	2026-05-05 19:38:35.171	2026-05-05 19:38:35.171	Restaurante	cmoqaehbn0004erma23omyvjs	2026-05-03 21:32:58.561	2026-05-19 00:17:34.023	5	\N	0070123456789012345678	Comercio Test	8	\N	0	\N	\N	f	\N	\N	basic	\N	2026-05-05 19:38:35.171	\N	\N	\N	\N	\N	\N	APPROVED	\N	\N	\N	BRONCE	0	2026-05-03 21:32:58.561	\N	\N	f	f	\N	\N	\N	2026-05-05 20:32:42.479	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:38:35.171	\N	APPROVED	2026-05-05 19:53:54.492	\N	APPROVED	Aprobado por seed	PHYSICAL	Aprobado por seed	PHYSICAL	Aprobado por seed-real-world-test.ts (cuenta de prueba)	PHYSICAL	Aprobado por seed	PHYSICAL	\N	DIGITAL	DRAFT	\N	\N	\N	\N
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
\.


--
-- Data for Name: MerchantDocumentChangeRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantDocumentChangeRequest" (id, "merchantId", "documentField", reason, status, "resolvedAt", "resolvedBy", "resolutionNote", "createdAt", "updatedAt") FROM stdin;
cmoeqla820004v11wd8gnl7do	cmoem7nl10004k8grsztmzdot	cuit	Necesito cambiar mi CUIT, lo ingrese incorrectamente.	APPROVED	2026-04-25 19:38:02.621	cmnuzx1fg0002zgw8zimoxguz	No encontramos ningun inconveniente, puedes realizar tu cambio ahora mismo! =)	2026-04-25 19:32:55.682	2026-04-25 19:38:02.635
\.


--
-- Data for Name: MerchantLoyaltyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantLoyaltyConfig" (id, tier, "minOrdersPerMonth", "commissionRate", "badgeText", "badgeColor", "benefitsJson", "displayOrder", "createdAt", "updatedAt") FROM stdin;
cmnw2pz6c00123ooej2dvusub	BRONCE	0	8	Comercio Verificado	gray	["Comision estandar 8%","Soporte prioritario","Panel de estadisticas basico"]	1	2026-04-12 18:04:52.692	2026-05-04 12:29:15.409
cmnw2pz6m00133ooembsbszap	PLATA	10	7	Comercio Destacado	blue	["Comision reducida 7%","Badge visible en la tienda","Prioridad en busqueda","Reporte semanal de ventas"]	2	2026-04-12 18:04:52.703	2026-05-04 12:29:15.414
cmnw2pz6t00143ooeyfb895i9	ORO	25	6	Comercio Popular	yellow	["Comision reducida 6%","Badge dorado visible","Posicion destacada en home","Soporte VIP","1 push notification gratis/mes"]	3	2026-04-12 18:04:52.71	2026-05-04 12:29:15.418
cmnw2pz6z00153ooeehit12au	DIAMANTE	50	5	Comercio Elite	purple	["Comision minima 5%","Badge diamante exclusivo","Posicion #1 en su categoria","Soporte dedicado","2 push notifications gratis/mes","Acceso anticipado a nuevas funciones"]	4	2026-04-12 18:04:52.716	2026-05-04 12:29:15.422
\.


--
-- Data for Name: MoovyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MoovyConfig" (id, key, value, description, "updatedAt") FROM stdin;
cmnw2pz0n00023ooeot4m38v2	default_merchant_commission_pct	8	Comisión MOOVY a comercios (%)	2026-04-12 18:04:52.487
cmnw2pz0y00033ooeineogqsl	default_seller_commission_pct	12	Comisión MOOVY a vendedores marketplace (%)	2026-04-12 18:04:52.498
cmnw2pz1o00063ooena45c54c	max_assignment_attempts	5	Máximo intentos de asignación de driver	2026-04-12 18:04:52.525
cmnw2pz1v00073ooeg4ma9ph3	points_per_dollar	1	Puntos por peso gastado	2026-04-12 18:04:52.531
cmnw2pz2500083ooexl552lcf	signup_bonus	100	Puntos bonus por registro	2026-04-12 18:04:52.541
cmnw2pz2d00093ooeop7ps99n	referral_bonus	200	Puntos bonus por referir	2026-04-12 18:04:52.549
cmnw2pz2i000a3ooecv55jhbj	min_points_to_redeem	100	Mínimo de puntos para canjear	2026-04-12 18:04:52.554
cmnw2pz2o000b3ooershwfe58	max_discount_percent	50	Máximo % de descuento con puntos	2026-04-12 18:04:52.56
cmnw2pz2t000c3ooeu8a58kzz	cart_recovery_enabled	true	Habilitar recuperación de carritos abandonados	2026-04-12 18:04:52.566
cmnw2pz31000d3ooet00y8eva	cart_recovery_first_reminder_hours	2	Horas hasta 1er recordatorio de carrito	2026-04-12 18:04:52.573
cmnw2pz36000e3ooelgqtd83s	cart_recovery_second_reminder_hours	24	Horas hasta 2do recordatorio de carrito	2026-04-12 18:04:52.579
cmnw2pz3b000f3ooevwgrltfn	cart_recovery_max_reminders	2	Máximo de recordatorios por carrito	2026-04-12 18:04:52.584
cmnw2pz3g000g3ooe3t9sic9i	cart_recovery_min_cart_value	5000	Valor mínimo del carrito para enviar recordatorio (ARS)	2026-04-12 18:04:52.588
cmo4zf9yr0000a4dun3xxpm64	assignment_rating_radius_meters	3000	Radio (metros) dentro del cual se priorizan repartidores por rating en el assignment engine	2026-04-18 23:42:30.195
cmo4zf9zs0001a4durybs3xkn	max_delivery_distance_km	15	Distancia máxima en km entre comercio y cliente para aceptar delivery	2026-04-18 23:42:30.233
cmo4zfa0b0002a4duf1n1d2t0	min_order_amount_ars	1000	Monto mínimo del carrito para poder hacer delivery	2026-04-18 23:42:30.252
cmo4zfa0o0003a4duqov1p6u9	scheduled_notify_before_minutes	30	Minutos antes de la hora programada para notificar al repartidor	2026-04-18 23:42:30.264
cmo4zfa150004a4duszp4pudf	scheduled_cancel_if_no_confirm_minutes	30	Minutos sin confirmación del comercio antes de cancelar pedido programado	2026-04-18 23:42:30.282
cmnw2pz1900043ooen0k9livo	merchant_confirm_timeout_seconds	300	Timeout para que el comercio confirme un pedido (5 min)	2026-05-04 12:29:15.428
cmnw2pz1i00053ooeltp8eb0a	driver_response_timeout_seconds	60	Timeout para que el repartidor acepte un pedido (1 min)	2026-05-04 12:29:15.439
cmoqaec2e0006guxlioyoia9e	seller_commission_pct	12	Comision marketplace sellers (12%)	2026-05-04 12:29:15.443
cmoqaec2l0007guxlb715oswl	driver_commission_pct	20	Porcentaje Moovy del viaje (100% - 80% rider = 20%)	2026-05-04 12:29:15.447
cmoqaec2t0008guxlvj7isz20	merchant_commission_pct	0	Comision merchants (0% mes 1 lanzamiento)	2026-05-04 12:29:15.452
cmoqaec2w0009guxlwp2n6ygp	fuel_price_reference	1658	Precio nafta super YPF Ushuaia - referencia para delivery fee	2026-05-04 12:29:15.455
cmoqaec30000aguxl3ukd8h95	usd_ars_reference	1400	Cotizacion dolar oficial referencia (cierre abril 2026)	2026-05-04 12:29:15.459
cmoqaec34000bguxl11vm906z	max_delivery_radius_km	15	Radio maximo de entrega en km	2026-05-04 12:29:15.462
cmoqaec38000cguxlf6qj2uxu	mp_fee_percent	3.81	Comision real MercadoPago (3.15% + IVA 21%)	2026-05-04 12:29:15.464
cmoqaec3b000dguxlnnatlugu	launch_boost_active	true	Boost lanzamiento: puntos x2 durante 30 dias	2026-05-04 12:29:15.467
cmoqaec3e000eguxludoqsrn0	launch_boost_start_date	2026-05-04	Fecha inicio del boost de lanzamiento	2026-05-04 12:29:15.469
cmoqaec3i000fguxlcdct43xa	merchant_free_month_active	true	Mes gratis para merchants (0% comision)	2026-05-04 12:29:15.472
cmoqaec3l000gguxl46t1qemg	merchant_free_month_start_date	2026-05-04	Fecha inicio del mes gratis merchants	2026-05-04 12:29:15.474
\.


--
-- Data for Name: MpWebhookLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MpWebhookLog" (id, "eventId", "eventType", "resourceId", processed, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "isPickup", "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveryStatus", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt", "cancelReason", "commissionPaid", "driverRating", "merchantPayout", "moovyCommission", "ratedAt", "ratingComment", "merchantRating", "merchantRatingComment", "sellerRating", "sellerRatingComment", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "lastAssignmentAt", "pendingDriverId", "deletedAt", "mpPreferenceId", "mpPaymentId", "mpMerchantOrderId", "mpStatus", "paidAt", "isMultiVendor", "deliveryType", "scheduledSlotStart", "scheduledSlotEnd", "scheduledConfirmedAt", "couponCode", "pointsEarned", "pointsUsed", "deliveryPin", "deliveryPinAttempts", "deliveryPinVerifiedAt", "failedDeliveryAt", "failedDeliveryReason", "pickupPin", "pickupPinAttempts", "pickupPinVerifiedAt", "nearDestinationNotified", "rateReminderSentAt", "driverStatus", "merchantStatus", "noShowFlag", "noShowReportedAt", "payoutHoldUntil", "waitingStartedAt", "driverRatingModerationStatus", "driverRatingReportCount", "driverTipAmount", "driverTipDeclaredAt", "driverTipMethod", "merchantRatingModerationStatus", "merchantRatingReportCount", "sellerRatingModerationStatus", "sellerRatingReportCount") FROM stdin;
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
cmnw2pz7c00163ooeim6ijao4	MICRO	500	20	15	10	1	{BIKE,MOTO,CAR,TRUCK}	t	1	2026-04-12 18:04:52.728	2026-04-12 18:04:52.728
cmnw2pz7m00173ooelfp0vilx	SMALL	2000	35	25	20	3	{BIKE,MOTO,CAR,TRUCK}	t	2	2026-04-12 18:04:52.739	2026-04-12 18:04:52.739
cmnw2pz7r00183ooe6a3uhqx2	MEDIUM	5000	50	40	30	6	{MOTO,CAR,TRUCK}	t	3	2026-04-12 18:04:52.744	2026-04-12 18:04:52.744
cmnw2pz7y00193ooe51d5kek8	LARGE	15000	80	60	50	10	{CAR,TRUCK}	t	4	2026-04-12 18:04:52.751	2026-04-12 18:04:52.751
cmnw2pz83001a3ooeozrxhvfw	XL	50000	120	80	80	20	{TRUCK}	t	5	2026-04-12 18:04:52.755	2026-04-12 18:04:52.755
cmoqaed9h0000a2f0xygyvz4p	FLETE	200000	250	150	150	50	{TRUCK}	t	6	2026-05-03 21:32:53.285	2026-05-03 21:32:53.285
\.


--
-- Data for Name: PackagePricingTier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackagePricingTier" (id, name, "minItems", "maxItems", "pricePerItem", "totalPrice", "isActive", "order", "createdAt") FROM stdin;
cmnw2pz9n001l3ooejevvu253	Pack x10	1	10	150	1500	t	1	2026-04-12 18:04:52.811
cmnw2pz9u001m3ooenn1o69y5	Pack x25	11	25	120	3000	t	2	2026-04-12 18:04:52.818
cmnw2pz9y001n3ooes66rq93v	Pack x50	26	50	90	4500	t	3	2026-04-12 18:04:52.822
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
cmpabgu4b003f8eo045n4st94	DRIVER	CANCELLED	2026-05-17 21:00:00.931	2026-05-17 21:58:11.568	907.2	1	\N	cmnuzx1fg0002zgw8zimoxguz	\N	\N	\N	2026-05-17 21:58:11.578	2026-05-17 21:59:46.427
\.


--
-- Data for Name: PayoutItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayoutItem" (id, "batchId", "recipientType", "recipientId", "recipientName", "bankAccount", cuit, amount, "ordersIncluded", notes, "createdAt") FROM stdin;
cmpabgu4r003h8eo0ng8wn3pz	cmpabgu4b003f8eo045n4st94	DRIVER	cmp60qa3x000ad60sjehyggb3	Marcos Perez	vsolutions.ush	\N	907.2	["cmpa9alo0001o8eo0979z2inr","cmpaarmxl002p8eo06gknvo5w"]	\N	2026-05-17 21:58:11.596
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
cmod6z664001tsabwiv6oxc30	Revisión de docs de driver	Validar documentación del repartidor antes de aprobarlo.	approval	t	2	2026-04-24 17:36:05.117	2026-04-24 17:36:05.117
cmod6z6k1002gsabwf3su5l33	Pedido demorado >30 min	Protocolo de incidente cuando un pedido se queda stuck.	incident	t	3	2026-04-24 17:36:05.618	2026-04-24 17:36:05.618
cmod6z6y10033sabw3kz5ox27	Reclamo de comercio por pago	Cómo manejar una consulta del comercio sobre un cobro.	escalation	t	4	2026-04-24 17:36:06.121	2026-04-24 17:36:06.121
cmod6z3110016sabw6q3gycot	Alta de comercio nuevo	Pasos para incorporar un comercio que recién se registró.	onboarding	t	1	2026-04-24 17:36:01.045	2026-04-24 21:58:07.369
\.


--
-- Data for Name: PlaybookStep; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlaybookStep" (id, "checklistId", content, "order", required, "createdAt", "updatedAt") FROM stdin;
cmod6z5we001asabwb7qvcnej	cmod6z3110016sabw6q3gycot	Contactar al comercio en 24h por WhatsApp o llamada	0	t	2026-04-24 17:36:04.766	2026-04-24 17:36:04.766
cmod6z5yi001esabw3pi0pmtt	cmod6z3110016sabw6q3gycot	Verificar docs AFIP y habilitación municipal	1	t	2026-04-24 17:36:04.843	2026-04-24 17:36:04.843
cmod6z60l001isabwlgldi13f	cmod6z3110016sabw6q3gycot	Revisar foto de fachada y del local	2	t	2026-04-24 17:36:04.918	2026-04-24 17:36:04.918
cmod6z64h001qsabwsgb9sp8n	cmod6z3110016sabw6q3gycot	Enviar email de bienvenida manual si algo no está claro	4	f	2026-04-24 17:36:05.057	2026-04-24 17:36:05.057
cmod6z683001xsabwgnwjkypl	cmod6z664001tsabwiv6oxc30	Verificar que el DNI coincide con la foto de perfil	0	t	2026-04-24 17:36:05.187	2026-04-24 17:36:05.187
cmod6z6ab0021sabwurwbzb63	cmod6z664001tsabwiv6oxc30	Chequear que la licencia de conducir esté vigente	1	t	2026-04-24 17:36:05.268	2026-04-24 17:36:05.268
cmod6z6ca0025sabwp7pecrqw	cmod6z664001tsabwiv6oxc30	Validar que el seguro del vehículo esté al día	2	t	2026-04-24 17:36:05.338	2026-04-24 17:36:05.338
cmod6z6ex0029sabwvlqgiqpq	cmod6z664001tsabwiv6oxc30	Confirmar CUIT/Monotributo activo en AFIP	3	t	2026-04-24 17:36:05.434	2026-04-24 17:36:05.434
cmod6z6i8002dsabwnz5yn1d5	cmod6z664001tsabwiv6oxc30	Aprobar cada doc individualmente desde el panel	4	t	2026-04-24 17:36:05.552	2026-04-24 17:36:05.552
cmod6z6lx002ksabw24vpzetq	cmod6z6k1002gsabwf3su5l33	Abrir el pedido en /ops/pedidos	0	t	2026-04-24 17:36:05.685	2026-04-24 17:36:05.685
cmod6z6nu002osabw1zktvshu	cmod6z6k1002gsabwf3su5l33	Verificar estado del driver en tiempo real	1	t	2026-04-24 17:36:05.755	2026-04-24 17:36:05.755
cmod6z6rs002ssabwpgu8av3f	cmod6z6k1002gsabwf3su5l33	Intentar reasignar driver si corresponde	2	t	2026-04-24 17:36:05.896	2026-04-24 17:36:05.896
cmod6z6tt002wsabw98x6tg78	cmod6z6k1002gsabwf3su5l33	Contactar al buyer por el chat del pedido	3	t	2026-04-24 17:36:05.97	2026-04-24 17:36:05.97
cmod6z6we0030sabwod16cnvf	cmod6z6k1002gsabwf3su5l33	Si no se puede resolver, cancelar + refund manual	4	f	2026-04-24 17:36:06.062	2026-04-24 17:36:06.062
cmod6z6zq0037sabw8tkqsdsv	cmod6z6y10033sabw3kz5ox27	Abrir ficha del comercio en /ops/usuarios/[id]	0	t	2026-04-24 17:36:06.182	2026-04-24 17:36:06.182
cmod6z71e003bsabwz9odcdnw	cmod6z6y10033sabw3kz5ox27	Revisar los últimos pedidos DELIVERED	1	t	2026-04-24 17:36:06.242	2026-04-24 17:36:06.242
cmod6z734003fsabwdu1dpa1r	cmod6z6y10033sabw3kz5ox27	Consultar el estado de MP en la sección Pagos	2	t	2026-04-24 17:36:06.304	2026-04-24 17:36:06.304
cmod6z74s003jsabw1t3ppiil	cmod6z6y10033sabw3kz5ox27	Si hay retención legítima, explicarle al comercio por WhatsApp	3	t	2026-04-24 17:36:06.365	2026-04-24 17:36:06.365
cmod6z76k003nsabwn3jd8sxx	cmod6z6y10033sabw3kz5ox27	Documentar la conversación con una nota interna	4	t	2026-04-24 17:36:06.429	2026-04-24 17:36:06.429
cmod6z62w001msabw5w00445x	cmod6z3110016sabw6q3gycot	Aprobar en OPS si todo está OK	3	f	2026-04-24 17:36:05.001	2026-04-24 21:57:16.693
\.


--
-- Data for Name: PointsConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsConfig" (id, "pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus", "reviewBonus", "pointsExpireDays", "refereeBonus", "minPurchaseForBonus", "minReferralPurchase", "tierWindowDays", "tierConfigJson", "updatedAt") FROM stdin;
points_config	0.01	0	1	500	20	1000	1000	25	180	500	5000	8000	90	{"levels":[{"name":"MOOVER","minOrders":0,"earnMultiplier":1,"ptsPerThousand":10},{"name":"SILVER","minOrders":5,"earnMultiplier":1.25,"ptsPerThousand":12.5},{"name":"GOLD","minOrders":15,"earnMultiplier":1.5,"ptsPerThousand":15},{"name":"BLACK","minOrders":40,"earnMultiplier":2,"ptsPerThousand":20}],"expirationMonthsInactive":6,"launchBoostEnabled":true,"launchBoostMultiplier":2,"launchBoostDays":30}	2026-05-04 12:29:15.401
\.


--
-- Data for Name: PointsTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsTransaction" (id, "userId", "orderId", type, amount, "balanceAfter", description, "createdAt") FROM stdin;
cmpa9e0ta002a8eo0n4k25q3j	cmobkazic0002w4k6sk1luhha	cmpa9alo0001o8eo0979z2inr	EARN	8	8	Ganaste 8 puntos por tu compra (nivel MOOVER)	2026-05-17 21:00:01.054
cmpab20tf003b8eo0yfcpikbg	cmobkazic0002w4k6sk1luhha	cmpaarmxl002p8eo06gknvo5w	EARN	8	16	Ganaste 8 puntos por tu compra (nivel MOOVER)	2026-05-17 21:46:40.419
cmpaeoy79004g8eo0h24tqtwr	cmobkazic0002w4k6sk1luhha	cmpaej6bq003u8eo0ybis0jdc	EARN	10	26	Ganaste 10 puntos por tu compra (nivel MOOVER)	2026-05-17 23:28:28.965
cmpagwbhl000svg2fe7donjlv	cmobkazic0002w4k6sk1luhha	cmpagot250006vg2fguv1865i	EARN	10	36	Ganaste 10 puntos por tu compra (nivel MOOVER)	2026-05-18 00:30:12.009
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "createdAt", "updatedAt", "packageCategoryId", "deletedAt", "deletedBy", "deletedReason", "volumeMl", "weightGrams") FROM stdin;
cmpcq9wlt001z3op8sjr56x6d	Fanta Limón 354ml Lata	fanta-limon-354ml-lata	Gaseosa sabor limón Fanta en lata 354ml	\N	1500	1000	100	10	t	f	2026-05-19 14:28:14.801	2026-05-19 14:28:14.801	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wm800233op81805yo0r	Fanta Naranja 1.5L PET	fanta-naranja-15l-pet	Gaseosa de naranja Fanta botella familiar 1.5 litros	\N	3200	2150	60	6	t	f	2026-05-19 14:28:14.816	2026-05-19 14:28:14.816	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmoqaehct000derma4qas6i7j	Alfajor Havanna individual	alfajor-havanna-individual-test	Alfajor de chocolate con dulce de leche	cmoqaehc10009ermak74cbcs4	1000	560	96	5	t	f	2026-05-03 21:32:58.589	2026-05-18 03:35:43.215	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	100	60
cmpcq9wgq00073op86j1gq9tw	Coca-Cola Original 354ml Lata	coca-cola-original-354ml-lata	Gaseosa cola sabor original en lata 354ml	\N	1650	1100	100	10	t	f	2026-05-19 14:28:14.617	2026-05-19 14:28:14.617	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9whq000b3op83urhnzuo	Coca-Cola Zero Azúcar 354ml Lata	coca-cola-zero-354ml-lata	Gaseosa cola sin azúcar en lata 354ml	\N	1650	1100	100	10	t	f	2026-05-19 14:28:14.654	2026-05-19 14:28:14.654	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmoqaehd9000hermalnwipcy1	Kit almacén básico	kit-almac-n-b-sico-test	Yerba 1kg + azúcar 1kg + aceite 1.5L + fideos 500g	cmoqaehc10009ermak74cbcs4	12000	8400	13	5	t	f	2026-05-03 21:32:58.605	2026-05-14 22:20:11.944	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	5500	4500
cmoqaehdg000jermac3hjby8u	Caja electrodoméstico chico	caja-electrodom-stico-chico-test	Pava eléctrica con caja	cmoqaehc10009ermak74cbcs4	35000	24500	4	5	t	f	2026-05-03 21:32:58.612	2026-05-17 19:03:20.936	cmnw2pz7y00193ooe51d5kek8	\N	\N	\N	15000	2500
cmpcq9wi2000f3op81ng40hpi	Coca-Cola Light 354ml Lata	coca-cola-light-354ml-lata	Gaseosa cola light en lata 354ml	\N	1650	1100	100	10	t	f	2026-05-19 14:28:14.665	2026-05-19 14:28:14.665	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wid000j3op8l5lq2zwz	Coca-Cola Original 500ml PET	coca-cola-original-500ml-pet	Gaseosa cola sabor original botella personal 500ml	\N	2000	1350	100	10	t	f	2026-05-19 14:28:14.677	2026-05-19 14:28:14.677	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wil000n3op8g3r5w67g	Coca-Cola Zero Azúcar 500ml PET	coca-cola-zero-500ml-pet	Gaseosa cola sin azúcar botella personal 500ml	\N	2000	1350	100	10	t	f	2026-05-19 14:28:14.685	2026-05-19 14:28:14.685	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wix000r3op82ha3ezhp	Coca-Cola Light 500ml PET	coca-cola-light-500ml-pet	Gaseosa cola light botella personal 500ml	\N	2000	1350	100	10	t	f	2026-05-19 14:28:14.697	2026-05-19 14:28:14.697	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wj7000v3op8ocw3uvsb	Coca-Cola Original 1.5L PET	coca-cola-original-15l-pet	Gaseosa cola sabor original botella familiar 1.5 litros	\N	3500	2350	60	6	t	f	2026-05-19 14:28:14.707	2026-05-19 14:28:14.707	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wjg000z3op8nch2cxid	Coca-Cola Zero Azúcar 1.5L PET	coca-cola-zero-15l-pet	Gaseosa cola sin azúcar botella familiar 1.5 litros	\N	3500	2350	60	6	t	f	2026-05-19 14:28:14.717	2026-05-19 14:28:14.717	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wjr00133op8s9tvn3ob	Coca-Cola Light 1.5L PET	coca-cola-light-15l-pet	Gaseosa cola light botella familiar 1.5 litros	\N	3500	2350	60	6	t	f	2026-05-19 14:28:14.727	2026-05-19 14:28:14.727	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wjy00173op8mo68gwit	Coca-Cola Original 2.25L PET	coca-cola-original-225l-pet	Gaseosa cola sabor original botella 2.25 litros	\N	5200	3500	50	5	t	f	2026-05-19 14:28:14.735	2026-05-19 14:28:14.735	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmobttv3e000etqia530fetso	Fernet 1882	fernet-1882-1776969616296		cmobll552000cw4k6blur8j08	12000	8400	99	5	t	f	2026-04-23 18:40:16.298	2026-04-25 13:58:54.532	\N	\N	\N	\N	\N	\N
cmpcq9wmh00273op84fgvcda9	Fanta Limón 1.5L PET	fanta-limon-15l-pet	Gaseosa sabor limón Fanta botella familiar 1.5 litros	\N	3200	2150	60	6	t	f	2026-05-19 14:28:14.825	2026-05-19 14:28:14.825	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wk8001b3op8drrbpqnv	Coca-Cola Zero Azúcar 2.25L PET	coca-cola-zero-225l-pet	Gaseosa cola sin azúcar botella 2.25 litros	\N	5200	3500	50	5	t	f	2026-05-19 14:28:14.744	2026-05-19 14:28:14.744	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9wmo002b3op8sr9dni4d	Fanta Naranja Zero 1.5L PET	fanta-naranja-zero-15l-pet	Gaseosa de naranja sin azúcar Fanta botella 1.5 litros	\N	3200	2150	60	6	t	f	2026-05-19 14:28:14.833	2026-05-19 14:28:14.833	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmoeetc0y000o2klv7irp0img	MONSTER	monster-1777125795872	Bebida energizante	cmodwjkyu000hornifywezk15	8000	5600	99	5	t	f	2026-04-25 14:03:15.875	2026-04-25 14:48:49.674	\N	\N	\N	\N	\N	\N
cmpcq9wkf001f3op89uxk4m80	Coca-Cola Light 2.25L PET	coca-cola-light-225l-pet	Gaseosa cola light botella 2.25 litros	\N	5200	3500	50	5	t	f	2026-05-19 14:28:14.752	2026-05-19 14:28:14.752	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9wkr001j3op8iyyzdlp0	Coca-Cola Original 2.5L PET	coca-cola-original-25l-pet	Gaseosa cola sabor original botella 2.5 litros	\N	5800	3900	40	4	t	f	2026-05-19 14:28:14.763	2026-05-19 14:28:14.763	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmoqaehcz000fermagmweua41	Pizza muzzarella grande	pizza-muzzarella-grande-test	Pizza de muzzarella tamaño grande, 8 porciones	cmoqaehc10009ermak74cbcs4	8500	5950	11	5	t	f	2026-05-03 21:32:58.595	2026-05-06 17:39:57.049	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	5000	900
cmoqaehci000bermav3efvpi9	Gaseosa Coca Cola 1.5L	gaseosa-coca-cola-1-5l-test	Botella retornable 1.5L	cmoqaehc10009ermak74cbcs4	2500	1750	41	5	t	f	2026-05-03 21:32:58.578	2026-05-06 22:58:03.828	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	1500	1500
cmpcq9wl0001n3op8x9oa2nmz	Coca-Cola Zero Azúcar 2.5L PET	coca-cola-zero-25l-pet	Gaseosa cola sin azúcar botella 2.5 litros	\N	5800	3900	40	4	t	f	2026-05-19 14:28:14.773	2026-05-19 14:28:14.773	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmomaxm4l000114j41e37poed	PRINGLES Sabor Original	pringles-sabor-original-1777603006526	El clásico irresistible en su icónico tubo. Papas crujientes, perfectamente saladas y con la forma exacta para el snackeo perfecto. ¡Una vez que hacés pop, no hay stop!	cmoem7nl10004k8grsztmzdot	6000	4200	10	5	t	f	2026-05-01 02:36:46.532	2026-05-01 03:14:52.941	\N	\N	\N	\N	2500	1500
cmop8s88h000ue0hdn8awyjwx	Hepatalgina	hepatalgina-1777780794540	Digestivo, protector hepático que estimula la función del hígado y la vesícula biliar.	cmohb69hn000111lk85n20sqd	8000	5600	100	5	t	f	2026-05-03 03:59:54.544	2026-05-03 03:59:54.544	\N	\N	\N	\N	300	200
cmpcq9wla001r3op84uqbwa0p	Coca-Cola Original 3L PET	coca-cola-original-3l-pet	Gaseosa cola sabor original botella familiar grande 3 litros	\N	7200	4800	30	3	t	f	2026-05-19 14:28:14.782	2026-05-19 14:28:14.782	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9wlj001v3op80cax1loi	Fanta Naranja 354ml Lata	fanta-naranja-354ml-lata	Gaseosa de naranja Fanta en lata 354ml	\N	1500	1000	100	10	t	f	2026-05-19 14:28:14.791	2026-05-19 14:28:14.791	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wmx002f3op8ej1d0axp	Fanta Sandía 1.5L PET	fanta-sandia-15l-pet	Gaseosa sabor sandía Fanta botella 1.5 litros	\N	3200	2150	60	6	t	f	2026-05-19 14:28:14.841	2026-05-19 14:28:14.841	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wn4002j3op85g0kdgmn	Fanta Naranja 2.25L PET	fanta-naranja-225l-pet	Gaseosa de naranja Fanta botella 2.25 litros	\N	4900	3300	40	4	t	f	2026-05-19 14:28:14.848	2026-05-19 14:28:14.848	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9wne002n3op8y4poqz52	Fanta Limón 2.25L PET	fanta-limon-225l-pet	Gaseosa sabor limón Fanta botella 2.25 litros	\N	4900	3300	40	4	t	f	2026-05-19 14:28:14.858	2026-05-19 14:28:14.858	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9wnl002r3op8jd7oyej0	Sprite 354ml Lata	sprite-354ml-lata	Gaseosa sabor lima-limón Sprite en lata 354ml	\N	1500	1000	100	10	t	f	2026-05-19 14:28:14.865	2026-05-19 14:28:14.865	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wnw002v3op8vbe1rk1d	Sprite Zero 354ml Lata	sprite-zero-354ml-lata	Gaseosa lima-limón sin azúcar Sprite en lata 354ml	\N	1500	1000	100	10	t	f	2026-05-19 14:28:14.876	2026-05-19 14:28:14.876	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wo3002z3op87lcp9ptu	Sprite 1.5L PET	sprite-15l-pet	Gaseosa sabor lima-limón Sprite botella familiar 1.5 litros	\N	3200	2150	60	6	t	f	2026-05-19 14:28:14.883	2026-05-19 14:28:14.883	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9woc00333op8o9mty98n	Sprite Zero 1.5L PET	sprite-zero-15l-pet	Gaseosa lima-limón sin azúcar Sprite botella 1.5 litros	\N	3200	2150	60	6	t	f	2026-05-19 14:28:14.892	2026-05-19 14:28:14.892	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9woi00373op86rtdne1f	Sprite 2.25L PET	sprite-225l-pet	Gaseosa sabor lima-limón Sprite botella 2.25 litros	\N	4900	3300	40	4	t	f	2026-05-19 14:28:14.899	2026-05-19 14:28:14.899	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9wor003b3op8rebt4mi8	Sprite Zero 2.25L PET	sprite-zero-225l-pet	Gaseosa lima-limón sin azúcar Sprite botella 2.25 litros	\N	4900	3300	40	4	t	f	2026-05-19 14:28:14.908	2026-05-19 14:28:14.908	cmnw2pz7r00183ooe6a3uhqx2	\N	\N	\N	\N	\N
cmpcq9woy003f3op8rng8x2kg	Schweppes Agua Tónica 354ml Lata	schweppes-tonica-354ml-lata	Agua tónica Schweppes en lata 354ml	\N	1650	1100	80	8	t	f	2026-05-19 14:28:14.915	2026-05-19 14:28:14.915	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wp7003j3op8pygzmlv8	Schweppes Pomelo 354ml Lata	schweppes-pomelo-354ml-lata	Gaseosa sabor pomelo Schweppes en lata 354ml	\N	1650	1100	80	8	t	f	2026-05-19 14:28:14.923	2026-05-19 14:28:14.923	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wpe003n3op8v7mdshw6	Schweppes Jengibre 354ml Lata	schweppes-jengibre-354ml-lata	Gaseosa sabor jengibre Schweppes en lata 354ml	\N	1650	1100	80	8	t	f	2026-05-19 14:28:14.931	2026-05-19 14:28:14.931	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wpn003r3op84je7u0zo	Schweppes Agua Tónica 1.5L PET	schweppes-tonica-15l-pet	Agua tónica Schweppes botella familiar 1.5 litros	\N	3500	2350	40	4	t	f	2026-05-19 14:28:14.939	2026-05-19 14:28:14.939	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wpv003v3op872uc3bs8	Schweppes Pomelo 1.5L PET	schweppes-pomelo-15l-pet	Gaseosa sabor pomelo Schweppes botella familiar 1.5 litros	\N	3500	2350	40	4	t	f	2026-05-19 14:28:14.948	2026-05-19 14:28:14.948	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wq2003z3op84qxylcvt	Schweppes Naranja 1.5L PET	schweppes-naranja-15l-pet	Gaseosa sabor naranja Schweppes botella 1.5 litros	\N	3500	2350	40	4	t	f	2026-05-19 14:28:14.954	2026-05-19 14:28:14.954	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wqa00433op8xzflorci	Powerade Uva 500ml PET	powerade-uva-500ml-pet	Bebida isotónica sabor uva Powerade 500ml	\N	2400	1600	60	6	t	f	2026-05-19 14:28:14.963	2026-05-19 14:28:14.963	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wqh00473op8lxizatua	Powerade Limón 500ml PET	powerade-limon-500ml-pet	Bebida isotónica sabor limón Powerade 500ml	\N	2400	1600	60	6	t	f	2026-05-19 14:28:14.97	2026-05-19 14:28:14.97	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wqq004b3op82aeb6ns0	Powerade Mountain Blast 500ml PET	powerade-mountain-blast-500ml-pet	Bebida isotónica Mountain Blast Powerade 500ml	\N	2400	1600	60	6	t	f	2026-05-19 14:28:14.978	2026-05-19 14:28:14.978	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wqw004f3op88p2o5cwq	Powerade Ice Storm 500ml PET	powerade-ice-storm-500ml-pet	Bebida isotónica Ice Storm Powerade 500ml	\N	2400	1600	60	6	t	f	2026-05-19 14:28:14.985	2026-05-19 14:28:14.985	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wr5004j3op8yc52i3fj	Powerade Golden Mango 500ml PET	powerade-golden-mango-500ml-pet	Bebida isotónica Golden Mango Powerade 500ml	\N	2400	1600	60	6	t	f	2026-05-19 14:28:14.994	2026-05-19 14:28:14.994	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wrc004n3op8dbmnfiru	Powerade Ice Storm 1L PET	powerade-ice-storm-1l-pet	Bebida isotónica Ice Storm Powerade 1 litro	\N	4000	2700	40	4	t	f	2026-05-19 14:28:15.001	2026-05-19 14:28:15.001	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wrk004r3op8da4iekc3	Monster Energy Original 473ml Lata	monster-energy-original-473ml	Bebida energizante Monster Energy original sabor verde 473ml	\N	4200	2800	50	5	t	f	2026-05-19 14:28:15.009	2026-05-19 14:28:15.009	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wrr004v3op84bzv4kk2	Monster Energy Ultra White 473ml Lata	monster-energy-ultra-white-473ml	Bebida energizante Monster Energy Ultra Zero azúcar 473ml	\N	4200	2800	50	5	t	f	2026-05-19 14:28:15.015	2026-05-19 14:28:15.015	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wrz004z3op8sshwqwci	Monster Energy Mango Loco 473ml Lata	monster-energy-mango-loco-473ml	Bebida energizante Monster Mango Loco con jugo 473ml	\N	4200	2800	50	5	t	f	2026-05-19 14:28:15.023	2026-05-19 14:28:15.023	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9ws600533op8v4ux6are	Monster Energy Rio Punch 473ml Lata	monster-energy-rio-punch-473ml	Bebida energizante Monster Rio Punch sabor tropical 473ml	\N	4200	2800	50	5	t	f	2026-05-19 14:28:15.031	2026-05-19 14:28:15.031	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wsd00573op891eqn22x	Monster Energy Pipeline Punch 473ml Lata	monster-energy-pipeline-punch-473ml	Bebida energizante Monster Pipeline Punch 473ml	\N	4200	2800	50	5	t	f	2026-05-19 14:28:15.037	2026-05-19 14:28:15.037	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wsl005b3op8uabnfpy0	Benedictino Sin Gas 500ml PET	benedictino-sin-gas-500ml	Agua mineral sin gas Benedictino 500ml	\N	1300	870	100	10	t	f	2026-05-19 14:28:15.046	2026-05-19 14:28:15.046	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wss005f3op8xd87or4k	Benedictino Con Gas 500ml PET	benedictino-con-gas-500ml	Agua mineral con gas Benedictino 500ml	\N	1400	940	100	10	t	f	2026-05-19 14:28:15.052	2026-05-19 14:28:15.052	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wt1005j3op85r0aa0x9	Benedictino Sin Gas 1.5L PET	benedictino-sin-gas-15l	Agua mineral sin gas Benedictino 1.5 litros	\N	2600	1740	60	6	t	f	2026-05-19 14:28:15.061	2026-05-19 14:28:15.061	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wt8005n3op84wlbfvcp	Benedictino Con Gas 1.5L PET	benedictino-con-gas-15l	Agua mineral con gas Benedictino 1.5 litros	\N	2800	1880	60	6	t	f	2026-05-19 14:28:15.068	2026-05-19 14:28:15.068	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wth005r3op8ho2q2xg2	Smartwater 750ml PET	smartwater-750ml	Agua purificada premium Smartwater 750ml	\N	3500	2350	40	4	t	f	2026-05-19 14:28:15.077	2026-05-19 14:28:15.077	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wto005v3op8lp8q5xol	Cepita del Valle Naranja 1L	cepita-del-valle-naranja-1l	Jugo de naranja Cepita del Valle 1 litro sin TACC	\N	3000	2000	50	5	t	f	2026-05-19 14:28:15.084	2026-05-19 14:28:15.084	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wtx005z3op8gai2fc31	Cepita del Valle Durazno 1L	cepita-del-valle-durazno-1l	Jugo de durazno Cepita del Valle 1 litro sin TACC	\N	3000	2000	50	5	t	f	2026-05-19 14:28:15.093	2026-05-19 14:28:15.093	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wu700633op8mfdcchl4	Cepita del Valle Multifrutal 1L	cepita-del-valle-multifrutal-1l	Jugo multifrutal Cepita del Valle 1 litro sin TACC	\N	3000	2000	50	5	t	f	2026-05-19 14:28:15.103	2026-05-19 14:28:15.103	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wug00673op8kadluw1m	Cepita del Valle Manzana 1L	cepita-del-valle-manzana-1l	Jugo de manzana Cepita del Valle 1 litro sin TACC	\N	3000	2000	50	5	t	f	2026-05-19 14:28:15.112	2026-05-19 14:28:15.112	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wun006b3op8olrg3szd	Cepita del Valle Naranja 200ml Tetra	cepita-del-valle-naranja-200ml	Jugo de naranja Cepita del Valle 200ml tetra pack individual	\N	900	600	100	10	t	f	2026-05-19 14:28:15.119	2026-05-19 14:28:15.119	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wuw006f3op8wvq7165b	Cepita del Valle Durazno 200ml Tetra	cepita-del-valle-durazno-200ml	Jugo de durazno Cepita del Valle 200ml tetra pack individual	\N	900	600	100	10	t	f	2026-05-19 14:28:15.129	2026-05-19 14:28:15.129	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wv3006j3op88gxdmcfj	AdeS Vainilla 1L Tetra	ades-vainilla-1l	Bebida vegetal de soja sabor vainilla AdeS 1 litro	\N	3500	2350	40	4	t	f	2026-05-19 14:28:15.135	2026-05-19 14:28:15.135	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wvc006n3op8e7mwkgi8	AdeS Original 1L Tetra	ades-original-1l	Bebida vegetal de soja original AdeS 1 litro	\N	3500	2350	40	4	t	f	2026-05-19 14:28:15.145	2026-05-19 14:28:15.145	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wvk006r3op8y9wo5wmi	AdeS Frutas Tropicales 1L Tetra	ades-frutas-tropicales-1l	Bebida vegetal de soja frutas tropicales AdeS 1 litro	\N	3500	2350	40	4	t	f	2026-05-19 14:28:15.152	2026-05-19 14:28:15.152	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
cmpcq9wvs006v3op88jlkqnwq	Aquarius Naranja 500ml PET	aquarius-naranja-500ml	Bebida con fruta sabor naranja Aquarius 500ml	\N	2000	1340	60	6	t	f	2026-05-19 14:28:15.161	2026-05-19 14:28:15.161	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9wvz006z3op8yysipvle	Aquarius Manzana 500ml PET	aquarius-manzana-500ml	Bebida con fruta sabor manzana Aquarius 500ml	\N	2000	1340	60	6	t	f	2026-05-19 14:28:15.167	2026-05-19 14:28:15.167	cmnw2pz7c00163ooeim6ijao4	\N	\N	\N	\N	\N
cmpcq9ww900733op8s5uyimgc	Aquarius Naranja 1.5L PET	aquarius-naranja-15l	Bebida con fruta sabor naranja Aquarius 1.5 litros	\N	3500	2350	40	4	t	f	2026-05-19 14:28:15.178	2026-05-19 14:28:15.178	cmnw2pz7m00173ooelfp0vilx	\N	\N	\N	\N	\N
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, "productId", "categoryId") FROM stdin;
cmobttv3e000htqiayk19vxsr	cmobttv3e000etqia530fetso	cmnw2pz4u000p3ooerlyvtabj
cmoefpcdr00162klv1q6kmjff	cmoeetc0y000o2klv7irp0img	cmnw2pz4u000p3ooerlyvtabj
cmomcamcv0002svo3gbjpts5e	cmomaxm4l000114j41e37poed	cmnw2pz4u000p3ooerlyvtabj
cmop8s88h000xe0hd9aioye37	cmop8s88h000ue0hdn8awyjwx	cmnw2pz4j000n3ooe3ln25yrx
cmpcq9wgq00093op8yp4te4oh	cmpcq9wgq00073op86j1gq9tw	cmoqaearw0002vlhqhbr35lt8
cmpcq9whq000d3op8ji0iizqb	cmpcq9whq000b3op83urhnzuo	cmoqaearw0002vlhqhbr35lt8
cmpcq9wi2000h3op8altip0jg	cmpcq9wi2000f3op81ng40hpi	cmoqaearw0002vlhqhbr35lt8
cmpcq9wid000l3op88e801xxm	cmpcq9wid000j3op8l5lq2zwz	cmoqaearw0002vlhqhbr35lt8
cmpcq9wil000p3op8a6fxd2g9	cmpcq9wil000n3op8g3r5w67g	cmoqaearw0002vlhqhbr35lt8
cmpcq9wix000t3op8bfxtagh2	cmpcq9wix000r3op82ha3ezhp	cmoqaearw0002vlhqhbr35lt8
cmpcq9wj7000x3op8x68ph5vy	cmpcq9wj7000v3op8ocw3uvsb	cmoqaearw0002vlhqhbr35lt8
cmpcq9wjg00113op8svkku7gk	cmpcq9wjg000z3op8nch2cxid	cmoqaearw0002vlhqhbr35lt8
cmpcq9wjr00153op8cicgwvxb	cmpcq9wjr00133op8s9tvn3ob	cmoqaearw0002vlhqhbr35lt8
cmpcq9wjy00193op8lqsiq6nq	cmpcq9wjy00173op8mo68gwit	cmoqaearw0002vlhqhbr35lt8
cmpcq9wk8001d3op8d8l8hqdk	cmpcq9wk8001b3op8drrbpqnv	cmoqaearw0002vlhqhbr35lt8
cmpcq9wkf001h3op8c2q375y7	cmpcq9wkf001f3op89uxk4m80	cmoqaearw0002vlhqhbr35lt8
cmpcq9wkr001l3op89rwt7olz	cmpcq9wkr001j3op8iyyzdlp0	cmoqaearw0002vlhqhbr35lt8
cmpcq9wl2001p3op8tc5o3wi7	cmpcq9wl0001n3op8x9oa2nmz	cmoqaearw0002vlhqhbr35lt8
cmpcq9wla001t3op8im6py2ap	cmpcq9wla001r3op84uqbwa0p	cmoqaearw0002vlhqhbr35lt8
cmpcq9wlj001x3op8p5omldx0	cmpcq9wlj001v3op80cax1loi	cmoqaearw0002vlhqhbr35lt8
cmpcq9wlt00213op8oayu1qju	cmpcq9wlt001z3op8sjr56x6d	cmoqaearw0002vlhqhbr35lt8
cmpcq9wm800253op8i0ysq5t6	cmpcq9wm800233op81805yo0r	cmoqaearw0002vlhqhbr35lt8
cmpcq9wmh00293op88kt3yq3h	cmpcq9wmh00273op84fgvcda9	cmoqaearw0002vlhqhbr35lt8
cmpcq9wmo002d3op8obh1q3cu	cmpcq9wmo002b3op8sr9dni4d	cmoqaearw0002vlhqhbr35lt8
cmpcq9wmx002h3op84qubxnqf	cmpcq9wmx002f3op8ej1d0axp	cmoqaearw0002vlhqhbr35lt8
cmpcq9wn4002l3op869i14pf5	cmpcq9wn4002j3op85g0kdgmn	cmoqaearw0002vlhqhbr35lt8
cmpcq9wne002p3op8ovmvn61o	cmpcq9wne002n3op8y4poqz52	cmoqaearw0002vlhqhbr35lt8
cmpcq9wnl002t3op88eey20v6	cmpcq9wnl002r3op8jd7oyej0	cmoqaearw0002vlhqhbr35lt8
cmpcq9wnw002x3op8f82po6iv	cmpcq9wnw002v3op8vbe1rk1d	cmoqaearw0002vlhqhbr35lt8
cmpcq9wo300313op8s3nasp0s	cmpcq9wo3002z3op87lcp9ptu	cmoqaearw0002vlhqhbr35lt8
cmpcq9woc00353op8udhlgf1v	cmpcq9woc00333op8o9mty98n	cmoqaearw0002vlhqhbr35lt8
cmpcq9woj00393op8t8l18zcx	cmpcq9woi00373op86rtdne1f	cmoqaearw0002vlhqhbr35lt8
cmpcq9wor003d3op8zzd03gqy	cmpcq9wor003b3op8rebt4mi8	cmoqaearw0002vlhqhbr35lt8
cmpcq9woy003h3op85xna2ing	cmpcq9woy003f3op8rng8x2kg	cmoqaearw0002vlhqhbr35lt8
cmpcq9wp7003l3op8k2v2edx1	cmpcq9wp7003j3op8pygzmlv8	cmoqaearw0002vlhqhbr35lt8
cmpcq9wpe003p3op8yu3kvcn9	cmpcq9wpe003n3op8v7mdshw6	cmoqaearw0002vlhqhbr35lt8
cmpcq9wpn003t3op83ocijo61	cmpcq9wpn003r3op84je7u0zo	cmoqaearw0002vlhqhbr35lt8
cmpcq9wpv003x3op8seyd4a7p	cmpcq9wpv003v3op872uc3bs8	cmoqaearw0002vlhqhbr35lt8
cmpcq9wq200413op84f7ldv47	cmpcq9wq2003z3op84qxylcvt	cmoqaearw0002vlhqhbr35lt8
cmpcq9wqb00453op81t8n4ii3	cmpcq9wqa00433op8xzflorci	cmoqaearw0002vlhqhbr35lt8
cmpcq9wqh00493op80tuns6nh	cmpcq9wqh00473op8lxizatua	cmoqaearw0002vlhqhbr35lt8
cmpcq9wqq004d3op8xedh0f0n	cmpcq9wqq004b3op82aeb6ns0	cmoqaearw0002vlhqhbr35lt8
cmpcq9wqw004h3op8am22dzfo	cmpcq9wqw004f3op88p2o5cwq	cmoqaearw0002vlhqhbr35lt8
cmpcq9wr5004l3op8t9yqzaz8	cmpcq9wr5004j3op8yc52i3fj	cmoqaearw0002vlhqhbr35lt8
cmpcq9wrc004p3op8o5uaec9k	cmpcq9wrc004n3op8dbmnfiru	cmoqaearw0002vlhqhbr35lt8
cmpcq9wrk004t3op85or36iwz	cmpcq9wrk004r3op8da4iekc3	cmoqaearw0002vlhqhbr35lt8
cmpcq9wrr004x3op8g91b6h01	cmpcq9wrr004v3op84bzv4kk2	cmoqaearw0002vlhqhbr35lt8
cmpcq9wrz00513op8112cxbr4	cmpcq9wrz004z3op8sshwqwci	cmoqaearw0002vlhqhbr35lt8
cmpcq9ws600553op8ymbze827	cmpcq9ws600533op8v4ux6are	cmoqaearw0002vlhqhbr35lt8
cmpcq9wsd00593op8g6zl4ow5	cmpcq9wsd00573op891eqn22x	cmoqaearw0002vlhqhbr35lt8
cmpcq9wsl005d3op8vu2xf4g2	cmpcq9wsl005b3op8uabnfpy0	cmoqaearw0002vlhqhbr35lt8
cmpcq9wss005h3op826bk1c7m	cmpcq9wss005f3op8xd87or4k	cmoqaearw0002vlhqhbr35lt8
cmpcq9wt1005l3op85qo7qkv3	cmpcq9wt1005j3op85r0aa0x9	cmoqaearw0002vlhqhbr35lt8
cmpcq9wt8005p3op8g8u8k3ty	cmpcq9wt8005n3op84wlbfvcp	cmoqaearw0002vlhqhbr35lt8
cmpcq9wth005t3op8fz7pdzy0	cmpcq9wth005r3op8ho2q2xg2	cmoqaearw0002vlhqhbr35lt8
cmpcq9wto005x3op8fcdca868	cmpcq9wto005v3op8lp8q5xol	cmoqaearw0002vlhqhbr35lt8
cmpcq9wtx00613op892twaa42	cmpcq9wtx005z3op8gai2fc31	cmoqaearw0002vlhqhbr35lt8
cmpcq9wu700653op89cucpz1y	cmpcq9wu700633op8mfdcchl4	cmoqaearw0002vlhqhbr35lt8
cmpcq9wug00693op8mp63lzt6	cmpcq9wug00673op8kadluw1m	cmoqaearw0002vlhqhbr35lt8
cmpcq9wun006d3op8bjlwcm39	cmpcq9wun006b3op8olrg3szd	cmoqaearw0002vlhqhbr35lt8
cmpcq9wuw006h3op8yii6ba9l	cmpcq9wuw006f3op8wvq7165b	cmoqaearw0002vlhqhbr35lt8
cmpcq9wv3006l3op8ixc33i3a	cmpcq9wv3006j3op88gxdmcfj	cmoqaearw0002vlhqhbr35lt8
cmpcq9wvd006p3op866ab0elc	cmpcq9wvc006n3op8e7mwkgi8	cmoqaearw0002vlhqhbr35lt8
cmpcq9wvk006t3op8b58m9jgh	cmpcq9wvk006r3op8y9wo5wmi	cmoqaearw0002vlhqhbr35lt8
cmpcq9wvs006x3op8nwch09l8	cmpcq9wvs006v3op88jlkqnwq	cmoqaearw0002vlhqhbr35lt8
cmpcq9wvz00713op88km740g9	cmpcq9wvz006z3op8yysipvle	cmoqaearw0002vlhqhbr35lt8
cmpcq9ww900753op8c3c1ye15	cmpcq9ww900733op8s5uyimgc	cmoqaearw0002vlhqhbr35lt8
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductImage" (id, "productId", url, alt, "order") FROM stdin;
cmobttv3e000ftqiaoggzasij	cmobttv3e000etqia530fetso	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1776969587703-Fernet-1882-jpg.webp	Fernet 1882	0
cmoefpcdd00122klvnh4vm6ui	cmoeetc0y000o2klv7irp0img	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777125769833-Monster-Energy-Zero-Ultra_ea5024f5-062c-4b42-bb45-a23676aa36be.d50a702be9fe5a9fe4d837a60a6b9a52.webp	MONSTER	0
cmoefpcdd00132klvn47uhmhq	cmoeetc0y000o2klv7irp0img	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777127158626-216794-800-auto.webp	MONSTER	1
cmoefpcdd00142klvtlxrn1y0	cmoeetc0y000o2klv7irp0img	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777127165556-13230-dr-lemon-pomelo-1000-cc-73fc9439e93a74786317458555373454-640-0.webp	MONSTER	2
cmomcamcf0000svo3kdmihple	cmomaxm4l000114j41e37poed	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777602670899-Papas-Fritas-Pringles-Original-X104gs-1-1000004.webp	PRINGLES Sabor Original	0
cmop8s88h000ve0hdiovjk6y8	cmop8s88h000ue0hdn8awyjwx	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777780674880-hepatalgina-en-gotas-x-120-ml-digestivo.webp	Hepatalgina	0
cmousp6yz00007475tyzn8wz2	cmoqaehdg000jermac3hjby8u	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1778116569760-Gemini_Generated_Image_acsvtpacsvtpacsv.webp	Caja electrodoméstico chico	0
cmpaf3404004w8eo0ponq7uvy	cmoqaehct000derma4qas6i7j	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1779060154236-ChatGPT_Image_7_feb_2026,_22_05_35.webp	Alfajor Havanna individual	0
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
cmomajv2p0000f17oy3cauxd5	ad3b80b8ba1aa839b6555b0dfcf5bec22f62419266341d03fd64995c8da056e0	Coca Cola 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.946	2026-05-01 02:26:04.946
cmomajv340001f17of7d9yn78	f3716ffc2b843eaef3f12d9dfe9e967ea6113d1f3de58a1c578650af49b31124	Coca Cola 2L	2000	2000	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.96	2026-05-01 02:26:04.96
cmomajv380002f17o4ajxfmxr	d7044978e3d024a672c1381d97f556bad777e0228549e6e58d69b201ec489ae4	Coca Cola 500ml	500	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:04.964	2026-05-01 02:26:04.964
cmomajv3d0003f17onevbqrsd	1a20e3e3aa2a5b6a5dabfe61896f5329597560ba53298d1347a6ba34dbe5eaba	Coca Cola 1L	1000	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.969	2026-05-01 02:26:04.969
cmomajv3i0004f17oje76ev3j	8cc17e033c429719d299294d4fa3455570190fffc9d9c2c13503850bed72d991	Coca Cola Zero 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.975	2026-05-01 02:26:04.975
cmomajv3n0005f17ol1kauaqa	1fe5b78a639073cf230dea67cf2c0196c70202ff9218253e7dec0c84c53f0093	Sprite 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.979	2026-05-01 02:26:04.979
cmomajv3r0006f17ouxlvv7yz	4245c164599eafd0d2309a4fd4ee231ed21557d5afe71343e00d9894f1843bef	Fanta 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.984	2026-05-01 02:26:04.984
cmomajv3v0007f17ojx9o3n6d	b2e82834c8cf449bdbe19c40bcf48e396f6dcbd8b54955208e3d76e97597ac05	Manaos 2.25L	2250	2250	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.988	2026-05-01 02:26:04.988
cmomajv400008f17oocdpykut	c76e295ecca2d02514d6cb5a4e94a6021eb73859b443627de0fc21422eb4cc6a	Pepsi 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:04.992	2026-05-01 02:26:04.992
cmomajv440009f17oue64ukmw	af2aa77fab2fad29a0e653123a0a79f7e33f5327835245ed9875b250521f2a53	Agua mineral 500ml	500	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:04.996	2026-05-01 02:26:04.996
cmomajv48000af17o2kqdbz0j	edbee3b4e41289b976f962870db9b2e67c79d3cfffc685f9d827437232500496	Agua mineral 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.001	2026-05-01 02:26:05.001
cmomajv4c000bf17oe2axdzdg	3a629da5caed88bd4bb33a795748c6c0684cc6853fe5177d7034f5dde9a4b7e6	Agua sin gas 6L	6000	6000	\N	CAR	SEED	100	0	2026-05-01 02:26:05.005	2026-05-01 02:26:05.005
cmomajv4g000cf17ozofmvbj6	6e0ac6e8c60750fc5c341682c4edc15577601df8eb803503dae590a2571b54a4	Agua con gas 1.5L	1500	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.009	2026-05-01 02:26:05.009
cmomajv4l000df17ojzehb9vr	c70d1abdf0ffce01c6598c3cacd1a6c2d5a1d221d057f2f22dcae1e3dcbe3e93	Cerveza Quilmes 1L	1000	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.013	2026-05-01 02:26:05.013
cmomajv4p000ef17og92zojvh	40f15a879f8151df54e7500f38f73629a6edcd2871de3bb8248ebcd43d48a6c8	Cerveza Quilmes 473ml lata	480	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.017	2026-05-01 02:26:05.017
cmomajv4t000ff17o1vsqqbca	10f635f4286efd7717230a756168c69cc49bcde8f31743a6abdfd282838dfed1	Cerveza Stella Artois 330ml	350	350	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.021	2026-05-01 02:26:05.021
cmomajv4x000gf17ofui0i62u	0b53aef8e9ec8d9f6b26ced169300cd33d920fb6565c0313b7053f083eb73850	Cerveza Heineken 330ml	350	350	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.025	2026-05-01 02:26:05.025
cmomajv51000hf17oubnpnpht	1847ac8fce4977fa708ed87f768c39a84208969796aa04037e575c1edf45a14e	Cerveza Brahma 1L	1000	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.03	2026-05-01 02:26:05.03
cmomajv55000if17o4p8amub7	a28b294e5fe25e1a8670d31282252076c39341240d83d009e882741b8967bcb1	Vino Toro 750ml	1200	750	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.034	2026-05-01 02:26:05.034
cmomajv59000jf17owpuec34p	1dcbc9917949a6c5e3879a1d61f45708f1bd3846923df226a3bee83f2e7b5a83	Vino Norton Malbec 750ml	1200	750	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.038	2026-05-01 02:26:05.038
cmomajv5d000kf17o38fzgob0	2a35e9162b22fc8b043f2db8fb4291f3d8f8e10fe74ba5c7348b4d0dfcc55fa7	Fernet Branca 750ml	1100	750	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.042	2026-05-01 02:26:05.042
cmomajv5i000lf17oh3lhav8y	fa61ffb8074caba82cc1f66d0968ea649e85ff7c5c891f83d0652786167278f6	Fernet Branca 1L	1450	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.046	2026-05-01 02:26:05.046
cmomajv5m000mf17oepymu0z7	3db5c266a06d5eb9ec9e2fb52a286710f1acebba462f09fe3dabe07962e8bc87	Speed XL 500ml	520	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.05	2026-05-01 02:26:05.05
cmomajv5q000nf17oyc84mwer	4ddb2bd0c4cbf11e0a79b6d8839fbe9509440a1eb170d366243375227958be4b	Red Bull 250ml	270	250	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.054	2026-05-01 02:26:05.054
cmomajv5u000of17ozvlriqgk	6e3c48f8c0787624b14e0c58cd5139a0bf90ca666edd72aacfad84166389a754	Yerba Playadito 1kg	1000	2000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.058	2026-05-01 02:26:05.058
cmomajv5y000pf17oeekwyj6h	e0abd09d77d60fbe4693cf7be6e02f5a99f4eb6a784fc3a3560be21784575163	Yerba Rosamonte 1kg	1000	2000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.062	2026-05-01 02:26:05.062
cmomajv62000qf17oei1bemf7	dd4f8ea1e0cd1d59482e73f00836a3f85d25e7fbe09b3a4ed8d1533581894689	Yerba Taragui 500g	500	1000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.067	2026-05-01 02:26:05.067
cmomajv66000rf17onwmz5r9b	7cf15cdc3eb4902a175dd4c2c1680f49dcbf6f5a5fbc021e34ffde1172173efe	Yerba CBSe 500g	500	1000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.071	2026-05-01 02:26:05.071
cmomajv6a000sf17oeiu2pa0r	e01071b2e777661a82d0b3570e1b5ab2150fc6a01a4a9270cc623e0f7383c87f	Mate cocido en saquitos x25	100	300	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.074	2026-05-01 02:26:05.074
cmomajv6e000tf17orpngkgj3	8ecd326ea152ade5abedd40be2a980c340de1154a8adc0a82eca476d816be14b	Cafe La Virginia 250g	250	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.079	2026-05-01 02:26:05.079
cmomajv6i000uf17osyn6a6gs	b882c19478ef14827b5371a7fa860a5b78dfdb2f865cd5aeb73095605c2a2a4d	Cafe Bonafide 500g	500	800	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.083	2026-05-01 02:26:05.083
cmomajv6m000vf17obsd0fys5	f111f15e362cd6db14538ab62dbde954946bbf029a022b7e7245afa2de80100d	Te Green Hills x25	50	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.087	2026-05-01 02:26:05.087
cmomajv6q000wf17og5kaoyo2	72f402662b0f94bfc31cdc47d89c7a70ee17a6d348a56f6443ceff637fc542ad	Azucar Ledesma 1kg	1000	1200	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.091	2026-05-01 02:26:05.091
cmomajv6u000xf17of3lf72wp	9be52b7132d3c7a66129f1b3b4ad87c7808beb98bb91412f425458d4209fd442	Harina 0000 Pureza 1kg	1000	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.095	2026-05-01 02:26:05.095
cmomajv6y000yf17ol5zx1rh0	b437b6225c3a5e4590204b01b69884f50b7eca8b053b5b1caef18587b58ed13f	Aceite girasol Natura 1.5L	1400	1500	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.099	2026-05-01 02:26:05.099
cmomajv72000zf17o4yispllc	7265cfc2cab1a9b4c184406878783aa03ff0e52c2f960976e5fbca07bb44e8a4	Aceite Cocinero 900ml	850	900	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.103	2026-05-01 02:26:05.103
cmomajv760010f17oy0wmsor5	373281b437e18f0bdc7333254d61baeeb1d6405159e7927e4fb426264acddc7e	Sal fina Celusal 500g	500	600	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.107	2026-05-01 02:26:05.107
cmomajv7a0011f17ohz6u8wc0	c7b898f561532fc7dfd43946b56eab69fe35fa41c771e27a15ea3b4e007a6294	Fideos Lucchetti 500g	500	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.111	2026-05-01 02:26:05.111
cmomajv7e0012f17oj5zt7s90	d6a87b04831a7b94d86adf29768246d68c4b5d11e0e02ac816b33acd446f4891	Fideos Matarazzo 500g	500	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.115	2026-05-01 02:26:05.115
cmomajv7i0013f17ot6cmr7yo	ef93d58c0a52671dfe65d974eedfa4a213e1d362c9aaa1fbb8d32e710756e326	Arroz Gallo 1kg	1000	1300	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.119	2026-05-01 02:26:05.119
cmomajv7m0014f17o0ssb2osj	82632183046838664a9e0a6b8ec109b31f2a0935c6fbbfeead5c3caceacb1b40	Lentejas 500g	500	700	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.122	2026-05-01 02:26:05.122
cmomajv7q0015f17oqebsh0pn	33501c462deceb988999b7b2a47fce1490ee19703cfb14d168724cd6842877ca	Salsa de tomate Arcor 520g	540	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.126	2026-05-01 02:26:05.126
cmomajv7u0016f17oihtc4y2z	32d237d79e69157adf650a2b132c98b79687f81b1dbb895858b8f86fdac79358	Pure de tomate La Campagnola 520g	540	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.13	2026-05-01 02:26:05.13
cmomajv7y0017f17ody2v7rm3	726911aecb57289fd9fa23c82edb319965fe71f10472fb92f81e24d06f764203	Mayonesa Hellmanns 500g	520	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.134	2026-05-01 02:26:05.134
cmomajv820018f17opsxri6ye	9230de594142890a039071deb79ffe987e58dd1c2b7519914359a53e4e522e3a	Ketchup Hellmanns 500g	520	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.138	2026-05-01 02:26:05.138
cmomajv860019f17ojx3mxmy7	5205d19d327232aeb019fe7a60f514b3c998a0fa5e1a0a89febeae81ab287d62	Mostaza Savora 200g	220	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.143	2026-05-01 02:26:05.143
cmomajv8a001af17ohs423g8f	abc46fd6d915d5ea30a6887baf84555cf6721db40872fe1e3b7b08a62bad5640	Dulce de leche La Serenisima 400g	420	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.147	2026-05-01 02:26:05.147
cmomajv8i001bf17oaca2dndo	4b6284c8998acbd8749a5e09b38080ec9e0755cb9b9450c5781693771b8681a3	Mermelada Arcor 454g	470	450	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.155	2026-05-01 02:26:05.155
cmomajv8n001cf17ojaaudutd	74d2af830f17835330e7a930308e61c38b2fdd95c37e31ffea561cec863c5a72	Leche La Serenisima 1L	1030	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.159	2026-05-01 02:26:05.159
cmomajv8r001df17o2j5ipdnq	aa74eb560b61a4e0ad217d43196e588cb10f2fd6a20084d3f4b4ec04e4cd54a4	Leche descremada 1L	1030	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.163	2026-05-01 02:26:05.163
cmomajv8v001ef17ofbkrbb0a	cac750eb8d89c315d5247e5754905846b7b33c4a266ea59cc7b37d053ea02cdd	Yogur Yogurisimo 900g	950	900	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.167	2026-05-01 02:26:05.167
cmomajv8z001ff17onywom5uz	9f2b62dd99e715312e06fc01288b779cd42666bb02e013c34588b36991c13f9f	Queso cremoso 500g	520	600	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.172	2026-05-01 02:26:05.172
cmomajv93001gf17ok3wt40m3	f1936a5790c259bdf838cb3e6838c4d2980ebeeaf54f6f70f3b2daf948d9e054	Queso reggianito 250g	270	350	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.175	2026-05-01 02:26:05.175
cmomajv97001hf17orh9z05am	cba00e44be2f0353a2d4e2bfda01f34ee7a0f8ca021e34835bb3c88b0e22cfa1	Manteca La Serenisima 200g	220	250	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.179	2026-05-01 02:26:05.179
cmomajv9b001if17oat7eaehn	d2b1e25373d9db63c23b3eda6986c5ae3811c76efcdb183ab03b58036f3d4ac2	Pan lactal Bimbo	600	4000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.183	2026-05-01 02:26:05.183
cmomajv9e001jf17o5wq8crvd	c4a6511ca243610583c4e040f64cedb2687b9a9314d473563a438c6ac2e56377	Pan frances	800	5000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.187	2026-05-01 02:26:05.187
cmomajv9i001kf17oiwgx6mvh	33c1175691f39a330d19c6b5b57b9b3c379c23c848f5d17947e4295970fa4278	Galletitas Oreo 118g	130	600	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.191	2026-05-01 02:26:05.191
cmomajv9m001lf17ok7vaejoq	c57ac581c0e68f9196a78acabb11833e1b4f16776c4a7e713586234597078a2d	Galletitas Pepitos 118g	130	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.195	2026-05-01 02:26:05.195
cmomajv9q001mf17o4v1tfzqc	ef35ad4cb2efbdfeeed8612e8ca2e604d760426ab8e18d5424c0c229595e4531	Alfajor Havanna	60	100	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.199	2026-05-01 02:26:05.199
cmomajva1001nf17ooxmj4dcm	38f00c3d45512b7c98febcedaf1c173d780b951ce9de692dddfae370df72eea9	Alfajor Jorgito	50	80	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.21	2026-05-01 02:26:05.21
cmomajva6001of17ofxks4db3	298c2639bd4fa0d7215f146cd0682a6aca1ac70526784d1938a548c6975929ad	Alfajor Aguila	50	80	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.214	2026-05-01 02:26:05.214
cmomajvab001pf17oqvm7e6bl	94498c3dbfb191e25666a6173b65b7e500c7c3105bb5f02b945d40f90a676a88	Chocolate Milka 100g	100	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.219	2026-05-01 02:26:05.219
cmomajvag001qf17o0ihetj7v	e07c195231ae384472f977cbe20762f348dbef10c69115a6c028738515fbd866	Chocolate Cofler 100g	100	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.224	2026-05-01 02:26:05.224
cmomajval001rf17ozatwgznj	bb164d89cc83da31526af8489dc3a8f29eb04ce0c650250c64f2c626ad9d0bbe	Caramelos Sugus	30	60	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.229	2026-05-01 02:26:05.229
cmomajvaq001sf17oqpzj3dsi	c21357f92d71f716f8602a17b053348f07628b17cc5daf05594d94d32ae6952e	Papas fritas Lays 130g	140	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.235	2026-05-01 02:26:05.235
cmomajvaw001tf17ol8pxhuz0	8b14b3b7592e83334b10a1e547f544f9e415232b33966338ad28d72ea5c6d0e1	Doritos 100g	110	1200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.24	2026-05-01 02:26:05.24
cmomajvb1001uf17o5atvhsal	0573d4d71b62e381ebdf96f2a0029a08f8c64214b96e51b3ac129d2f7b023f47	Hamburguesa simple	280	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.245	2026-05-01 02:26:05.245
cmomajvb6001vf17o315utrw3	be5b0bd6be38da670c4f1bf0cdaec03ea5c0ecf27d136a9f2cd53a0d67e13e7a	Hamburguesa doble con queso	400	700	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.25	2026-05-01 02:26:05.25
cmomajvbb001wf17opolkve9a	f9d38e5eccab8413b7643dda0bf18471e1e093eb0f309f3f5d58fb69ab005f74	Hamburguesa completa	450	800	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.255	2026-05-01 02:26:05.255
cmomajvbg001xf17oa5neo2po	ea421a5f57ba2ef27d6161296eb324727ab8dff31f769ab4467f90ea178d0aaf	Hamburguesa con papas	600	2000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.26	2026-05-01 02:26:05.26
cmomajvbl001yf17o5q1dp4ie	ad28575e32e229d48415401aff2a431b86cdd86c9a1f61d300bff6c89014c3fd	Pizza muzzarella grande	900	5000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.266	2026-05-01 02:26:05.266
cmomajvbq001zf17oysuxn8d9	ed39fa82d2257a6edbf45077114dd55a77effa0e143c315fa1bf1ff630d9380f	Pizza napolitana grande	1000	5000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.271	2026-05-01 02:26:05.271
cmomajvbx0020f17or9ul0bnt	28fa57f714a56f469438c65cbc1476594faccdde891966973e59e83f60a18883	Pizza especial chica	500	2500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.277	2026-05-01 02:26:05.277
cmomajvc20021f17o5f0511vh	4987904d867521fbeb8fa014970b094ee000f78d5632fa37eed8861a4447bab5	Empanada	80	150	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.282	2026-05-01 02:26:05.282
cmomajvc70022f17oz14xl7cq	4c5deb569c0862d878cd8292d1c4604532c3998b0c3302db4e43d09762abfbb4	Docena de empanadas	1000	3000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.288	2026-05-01 02:26:05.288
cmomajvcd0023f17odmk0cpye	18aea766cdac99b334cf68987200c389f6c600fa7ebe7341bcdaa6035d6ff4e4	Sandwich de miga jamon y queso	200	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.294	2026-05-01 02:26:05.294
cmomajvci0024f17ow7l7ck24	7d1cc6ab7f70cabba7d05a41be0c621a0db052f9f45c4def0593c8a04f4afdd6	Sandwich tostado	250	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.298	2026-05-01 02:26:05.298
cmomajvcn0025f17ohhu0j574	f0982c0cff4872b2331267d21abeec9d81adc6b260a07a0d20046de61d91b71f	Lomito completo	450	700	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.304	2026-05-01 02:26:05.304
cmomajvcu0026f17oyo6v8ap0	f6f278962b1af85d48348d0a655dcc55d92b8ec503d1b19437f63c18bebc5601	Milanesa con pure	500	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.311	2026-05-01 02:26:05.311
cmomajvd20027f17o5mgloshi	6d518f07806f0c4bf7eab37b3409e4bf93b24984b4f9c381c1353d6054d902b7	Pollo al spiedo entero	1500	4000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.318	2026-05-01 02:26:05.318
cmomajvd80028f17otqand55u	ee189a6c243d2ae1c89c192dfee7247d50c31eb0b79b3ca009ac96db0e008880	Medio pollo al spiedo	800	2500	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.324	2026-05-01 02:26:05.324
cmomajvdl0029f17osslqw4yn	b9d4e2c4d1e5df6d673a06bcdd181e64015a6611f947dfcb7d1f5bedf7f9c305	Sushi 12 piezas	350	1200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.338	2026-05-01 02:26:05.338
cmomajvdr002af17oeolfabr5	a7d2f2bc620b94b2f72a4dfc98a464c31aa9b9f1e41801bfaee393c8ba7e0ad0	Helado 1kg	1100	2000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.344	2026-05-01 02:26:05.344
cmomajvdy002bf17o04k1nq8y	15b9b1e9915b8e5735d727bb437707875b1855ed88c1ed7ea907184000995578	Helado 1/4 kg	280	600	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.35	2026-05-01 02:26:05.35
cmomajve4002cf17ody5gu213	f9d6151898e86a89b2410fa4d46f713e1378d03bfcdc79d01cf63990959bd0d6	Cucurucho de helado	150	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.356	2026-05-01 02:26:05.356
cmomajvea002df17oyopg2eov	85341eed0158b081066c9eb7c2a05a28058ba73fbcee9a46b33fb38b49c60bb9	Detergente Magistral 750ml	800	750	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.362	2026-05-01 02:26:05.362
cmomajveg002ef17o4qpdbtj4	fa86585091bd67baa136c0d7ddeb18bcdc710c64aaabe1660e38268181aff864	Lavandina Ayudin 1L	1100	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.369	2026-05-01 02:26:05.369
cmomajvem002ff17olvmxh33t	98750a964a8f3ab163076d5dc36f54374a1ee72372286097edef89b8d5a1b95d	Suavizante Vivere 900ml	950	900	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.375	2026-05-01 02:26:05.375
cmomajver002gf17ohfgo4s7n	e4845ea291671141eeaf82e1c904f4c5600ac8b5053ff6712f3e05d59745f6cd	Jabon en polvo Skip 800g	850	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.38	2026-05-01 02:26:05.38
cmomajvex002hf17okdyh079p	35a10a5487fd265085dbd88f70cab73eee09826d2df16cc1d6a3a3df057a90f0	Papel higienico Higienol x4	600	8000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.385	2026-05-01 02:26:05.385
cmomajvf2002if17ort01nnly	cf52a5d20d4a76c6f6d9a8f6c48fbe0c25fb2a750fd422b27e71690aac0feba9	Servilletas x100	200	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.391	2026-05-01 02:26:05.391
cmomajvf7002jf17o86od33ck	099cbfac71fe56f2e2a2982184c9f8c309c4868af8a337093b5753dd02bc5ef4	Shampoo Sedal 350ml	380	350	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.396	2026-05-01 02:26:05.396
cmomajvfd002kf17optebrm1f	3c022a5e958a35b76ed50a36dd0cbfdbf2263f21755681dddad5008604cbdfab	Acondicionador 350ml	380	350	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.401	2026-05-01 02:26:05.401
cmomajvfi002lf17oweqndy1o	55c629004885d17a2b8e20751c4d9d2cec46210c127060afb2e4916313ba1040	Jabon de tocador Lux	130	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.406	2026-05-01 02:26:05.406
cmomajvfo002mf17oob2sx2zg	8c7c73052984bc59e7fe38654dc12e10bbea082f6e97da0d6e2b3a05e2c6a5e8	Pasta dental Colgate 90g	100	100	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.412	2026-05-01 02:26:05.412
cmomajvfu002nf17ox8r73rty	75e11bb184b9fb33b0d811d396243a624a4e5b6aee73dbb081d438cc4e80e79e	Cepillo de dientes	30	100	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.418	2026-05-01 02:26:05.418
cmomajvg0002of17oqs41ybxr	5c153a55f8449d1593ac9e81c2dc674ffbe3e354cd8aa777b0c4c443f253ca87	Desodorante Axe 150ml	200	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.424	2026-05-01 02:26:05.424
cmomajvg4002pf17oktks5uk8	e9451579728018f0b1ea4ab0b041a9f95503d12c5fe3a7b591879ff9022c95c9	Paracetamol x16	30	80	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.429	2026-05-01 02:26:05.429
cmomajvga002qf17otgm3iy42	d4cae3ac0bea1e152aefffca29c9ccec67c65e9c2c7a9231731d2a1ffd1e7f70	Ibuprofeno 400 x10	30	80	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.434	2026-05-01 02:26:05.434
cmomajvge002rf17ol682bsfl	e8edda4aa500e8f05b2058190478302a8e0f1e32e0c9b348df4bdd82d90dc89a	Aspirina x20	30	80	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.439	2026-05-01 02:26:05.439
cmomajvgj002sf17o2ssy3fg2	153ef0daa034309be5a50b96ab7ef777ed87de80b7c00e23b647ac7e5d7f0207	Alcohol en gel 250ml	280	250	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.444	2026-05-01 02:26:05.444
cmomajvgo002tf17opjv14yh2	8018173032d7637d5f15d377092ad253a62b2ff35f334483a0cfae99c6118880	Alcohol etilico 500ml	500	500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.449	2026-05-01 02:26:05.449
cmomajvgu002uf17ogcsmtyfz	f9136d44865d2d5471a2256918a13164097d776635858759ff3b912dede342c9	Algodon 100g	110	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.454	2026-05-01 02:26:05.454
cmomajvgz002vf17olhjbswjr	131a1223d4eda02b92a354382ac1f038f86e6f95438a4ee13fc08740609feda0	Curitas x20	30	100	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.46	2026-05-01 02:26:05.46
cmomajvh5002wf17oopvi1sqx	062fb43a950d911a78a02196ab7797bfe76108d14af76080d22406382c558930	Termometro digital	60	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.466	2026-05-01 02:26:05.466
cmomajvhb002xf17om3erenyo	e731f9649005665736157c62cad3c4f1c77a7314b1d6e97a7ae1ab266c4e665a	Tornillos hex 1/4 x100	500	800	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.471	2026-05-01 02:26:05.471
cmomajvhg002yf17opvx54rpv	99bf5ffb7860dca4690cd7e834143007b05da560f59c7dd45cf619fd7edca10c	Tornillos para madera x50	200	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.477	2026-05-01 02:26:05.477
cmomajvhm002zf17okgee3qg2	dce9d57b6e9125ef20c946109d4bd1886c2be3fe56483db8bbaaff096c5c3cbf	Clavos surtidos 250g	250	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.482	2026-05-01 02:26:05.482
cmomajvhs0030f17ocmgjn03n	e9d4425b1bebac581d00371624893b4fcf1a34e4fdd44f194b3865234975d67d	Martillo de carpintero	600	800	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.488	2026-05-01 02:26:05.488
cmomajvhx0031f17orh5220ts	99f51bc4539c0cb8dfef75572bfa19b677416e1ba0de52265f7cf2421bd9d5cd	Destornillador Phillips	200	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.493	2026-05-01 02:26:05.493
cmomajvi20032f17oocjyy0j2	2b98b4ea5123aaee83ed47791f3ee19d55faa5165b8d69719599df42a067678e	Set de destornilladores 6 piezas	800	2000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.499	2026-05-01 02:26:05.499
cmomajvi70033f17o2eza527y	2849dd95405cae2b9c3e4d991673ee7c7ab2a0cb75a0c44858923c73cffe3f18	Llave francesa	400	600	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.503	2026-05-01 02:26:05.503
cmomajvic0034f17oeu2q6asu	dd6f2346742223609fdc6eb4e5a01b61db094aea37c21686f04108d08e508374	Cinta aisladora	80	200	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.508	2026-05-01 02:26:05.508
cmomajvig0035f17o89szqz9c	80c951d3f9a8f916fc4910ff4b2cf89413f3856b4df23983e8f8c82f3f678e44	Pintura latex 4L	5000	4000	\N	CAR	SEED	100	0	2026-05-01 02:26:05.513	2026-05-01 02:26:05.513
cmomajvil0036f17o3nczwfv6	431115daa6a833ebfcb442498db7ac030eb0ca51615b96eac1207afcf4bcbdc2	Pintura latex 1L	1300	1000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.517	2026-05-01 02:26:05.517
cmomajviq0037f17o4ubr1hj2	03a3ce78125d05910501c9f042940eb95ab79da535fe0792fec0f9da803515c0	Bolsa de cemento 25kg	25000	30000	\N	CAR	SEED	100	0	2026-05-01 02:26:05.522	2026-05-01 02:26:05.522
cmomajviv0038f17osh7r704v	ae151960f2a7646a303a8ebd533017f64366e07310f46f134d11cd805a85cb69	Bolsa de cal 25kg	25000	30000	\N	CAR	SEED	100	0	2026-05-01 02:26:05.527	2026-05-01 02:26:05.527
cmomajvj00039f17oab09ieat	f4a7817de116912d0f13618373492e8f1fb5590bfcb7850b359497d21d890216	Remera basica de algodon	200	1500	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.533	2026-05-01 02:26:05.533
cmomajvj6003af17o75zu1foz	ef2fa686dd1f0c327d167933dc26b36d8f242b9f21d24a8cb862901f753ed04a	Buzo con capucha	500	5000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.538	2026-05-01 02:26:05.538
cmomajvja003bf17o8on4ngo0	7e3b180920808eafdd1270edc0674833a4f8e4f840f86e3aff91cc971619ba93	Campera de invierno	900	8000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.543	2026-05-01 02:26:05.543
cmomajvjg003cf17ohc0zk0yr	a3fd7be1e5f2e685fa9ebfd1b9a9a59935dac2fb03784fe5459343b3545ebdcb	Pantalon de jean	600	4000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.548	2026-05-01 02:26:05.548
cmomajvjl003df17o15bpvnil	4ec64e34f22aee25addbc0e84a0fe76c3e58c29c9c682a3975f587ec4a8f6a79	Zapatillas deportivas	800	5000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.553	2026-05-01 02:26:05.553
cmomajvjq003ef17o4gj3ea42	56ebf53887fd7e4d8334409e231d204beefb3b411fbea5b7ac36b44b24155537	Medias x3 pares	200	1000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.558	2026-05-01 02:26:05.558
cmomajvjv003ff17oegiwrtsd	4aa08403157ba0196e06518426fb2cc66154a1f224e97dd1413f4856f10e69cc	Silla plastica de jardin	3000	50000	\N	CAR	SEED	100	0	2026-05-01 02:26:05.564	2026-05-01 02:26:05.564
cmomajvk1003gf17olj91umni	78b2aa45035b1559c092189db41d9993d0b28a75be51466a65fedc28ee19bbc4	Silla de madera de comedor	6000	80000	\N	CAR	SEED	100	0	2026-05-01 02:26:05.569	2026-05-01 02:26:05.569
cmomajvk6003hf17o9h8a7ur2	33d3e47b1b2d1d64342989d9ebaa1436cb34758e686b9179e35e176a076644fa	Mesa de comedor 4 personas	25000	200000	\N	TRUCK	SEED	100	0	2026-05-01 02:26:05.574	2026-05-01 02:26:05.574
cmomajvkb003if17o0w8jbdyn	4e693170056b6c9b330973b46f30fc33af78d2020098d7208c67e2dd6ba51049	Sillon 3 cuerpos	35000	400000	\N	TRUCK	SEED	100	0	2026-05-01 02:26:05.58	2026-05-01 02:26:05.58
cmomajvkh003jf17o89a6522x	51902b2148ccaf414612e105c38dacf51b7614f1db269c6d2284cae4bbcf2831	Colchon 2 plazas	25000	350000	\N	TRUCK	SEED	100	0	2026-05-01 02:26:05.585	2026-05-01 02:26:05.585
cmomajvkm003kf17oqyj0zhk1	f1d18aea3ba42e257d729059c4abeb2a57dd5ba7a8b68e0ebd9da9f2b4644198	Almohada	800	30000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.591	2026-05-01 02:26:05.591
cmomajvks003lf17oq098ukkb	fec12934e6bc873edb4537d4548746fed03da366f4657a2aac6664a99e4486d1	Sabanas matrimoniales	1500	8000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.597	2026-05-01 02:26:05.597
cmomajvky003mf17ops464haz	eebeed3b7c14e15c6acb9bb5b66b48dfb7e80f03655f5076451f0130db478db7	Toalla de bano	600	8000	\N	MOTO	SEED	100	0	2026-05-01 02:26:05.602	2026-05-01 02:26:05.602
cmomajvl4003nf17on6hhjw3a	19d6684555f562c65d7583a0beed6ef2bc4d376d3dee976c8cfbe4c2a2022297	Auriculares bluetooth	250	800	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.608	2026-05-01 02:26:05.608
cmomajvl9003of17oawslz2fs	1b0df58fffbc4dd15eaade4fcce9a27e08f4d44326cbe4a6877999c01061621f	Cargador USB-C 1m	80	250	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.614	2026-05-01 02:26:05.614
cmomajvlf003pf17obwolesto	038194d942f993fde7a79bc55acff62dc79da69cb002a20d861d7aec036e1905	Pen drive 32GB	20	60	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.619	2026-05-01 02:26:05.619
cmomajvlk003qf17ow88ds6h1	204c1f28e6ba30dca3b43f7114b4527eb0b5864625befa64cf487e2e433b5313	Mouse inalambrico	120	300	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.625	2026-05-01 02:26:05.625
cmomajvlq003rf17o01cz0z57	4ec890eec7af1512c26c30ce217c1ef65f25835de1b26ceb5fa094cf41a451fc	Teclado USB	600	2000	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.63	2026-05-01 02:26:05.63
cmomajvlv003sf17ougcw0am8	27b478f280d13af7c24257a2be5aba5f8a128534953035c5791b96b0e31f06c0	Power bank 10000mah	250	400	\N	BIKE	SEED	100	0	2026-05-01 02:26:05.636	2026-05-01 02:26:05.636
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

COPY public."SavedCart" (id, "userId", items, "merchantId", "createdAt", "updatedAt", "cartValue", "lastRemindedAt", "recoveredAt", "reminderCount") FROM stdin;
cmp61uq26000md60sgoho1ph8	cmp60qa3g0007d60svwywx818	[{"id": "cmobttv3e000etqia530fetso-default-1777068938059", "name": "Fernet 1882", "type": "product", "image": "https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1776969587703-Fernet-1882-jpg.webp", "price": 12000, "quantity": 1, "productId": "cmobttv3e000etqia530fetso", "merchantId": "cmobll552000cw4k6blur8j08"}]	\N	2026-05-14 22:17:58.637	2026-05-14 22:17:58.637	12000	\N	\N	0
cmp68w47n001sd60s4h4xcgto	cmobth34p0002tqiaji23ve3q	[{"id": "cmoqaehdg000jermac3hjby8u-default-1778808899869", "name": "Caja electrodoméstico chico", "type": "product", "image": "https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1778116569760-Gemini_Generated_Image_acsvtpacsvtpacsv.webp", "price": 35000, "quantity": 1, "productId": "cmoqaehdg000jermac3hjby8u", "merchantId": "cmoqaehc10009ermak74cbcs4"}]	\N	2026-05-15 01:35:00.946	2026-05-15 01:35:00.946	35000	\N	\N	0
cmomcchdn0003svo31lfazjua	cmoem7nkg0001k8grd394va3v	[{"id": "cmomaxm4l000114j41e37poed-default-1777605378380", "name": "PRINGLES Sabor Original", "type": "product", "image": "https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/products/1777602670899-Papas-Fritas-Pringles-Original-X104gs-1-1000004.webp", "price": 6000, "quantity": 1, "productId": "cmomaxm4l000114j41e37poed", "merchantId": "cmoem7nl10004k8grsztmzdot"}]	\N	2026-05-01 03:16:19.832	2026-05-01 03:16:19.832	6000	\N	\N	0
\.


--
-- Data for Name: SellerAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerAvailability" (id, "sellerId", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SellerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerProfile" (id, "userId", "displayName", bio, avatar, cuit, "acceptedTermsAt", "bankAlias", "bankCbu", "isActive", "isVerified", "totalSales", rating, "commissionRate", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "acceptedPrivacyAt", "applicationStatus", "approvedAt", "cancelledByUserAt", "cancelledByUserReason", "pausedByUserAt", "pausedByUserReason", "rejectionReason") FROM stdin;
cmoqaehxo000vermas76ki5pc	cmoqaehxc000qermah0y0rpfy	Vendedor Marketplace Test	Vendedor de prueba marketplace, pre-launch	\N	27345678901	2026-05-05 19:38:35.171	\N	0070123456789012345680	t	t	0	\N	12	\N	\N	\N	\N	\N	f	f	\N	15	t	{"1":[{"open":"09:00","close":"22:00"}],"2":[{"open":"09:00","close":"22:00"}],"3":[{"open":"09:00","close":"22:00"}],"4":[{"open":"09:00","close":"22:00"}],"5":[{"open":"09:00","close":"22:00"}],"6":[{"open":"09:00","close":"22:00"}],"7":[{"open":"09:00","close":"22:00"}]}	2026-05-03 21:32:59.34	2026-05-05 19:38:35.929	f	\N	\N	\N	2026-05-05 19:38:35.171	APPROVED	2026-05-05 19:38:35.171	\N	\N	\N	\N	\N
cmpaa60az002d8eo0v9w2fq4m	cmobkazic0002w4k6sk1luhha	DeTodo	Venta de usados en buen estado	\N	b21a5a69792228f982a8fba9979f8126:2032700c710795dab425c4f24c79d779:fc6f7466f93bcbf58899aa0b3f	2026-05-17 21:21:46.755	\N	\N	t	f	0	\N	12	\N	\N	\N	\N	\N	f	f	\N	15	f	\N	2026-05-17 21:21:46.762	2026-05-17 21:21:46.762	f	\N	\N	\N	2026-05-17 21:21:46.755	DRAFT	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "isMaintenanceMode", "maintenanceMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt", "promoPopupButtonText", "promoPopupDismissable", "promoPopupEnabled", "promoPopupImage", "promoPopupLink", "promoPopupMessage", "promoPopupTitle", "showComerciosCard", "showRepartidoresCard", "tiendaMaintenance", "maxCategoriesHome", "heroSliderEnabled", "heroSliderInterval", "heroSliderShowArrows", "promoBannerButtonLink", "promoBannerButtonText", "promoBannerEnabled", "promoBannerImage", "promoBannerSubtitle", "promoBannerTitle", "promoBannerCtaPosition", "promoSlidesJson", "riderCommissionPercent", "zoneMultipliersJson", "climateMultipliersJson", "activeClimateCondition", "operationalCostPercent", "defaultMerchantCommission", "defaultSellerCommission", "cashMpOnlyDeliveries", "cashLimitL1", "cashLimitL2", "cashLimitL3", "maxOrdersPerSlot", "slotDurationMinutes", "minAnticipationHours", "maxAnticipationHours", "operatingHoursStart", "operatingHoursEnd", "merchantConfirmTimeoutSec", "driverResponseTimeoutSec", "adPricePlatino", "adPriceDestacado", "adPricePremium", "adPriceHeroBanner", "adPriceBannerPromo", "adPriceProducto", "adLaunchDiscountPercent", "adMaxHeroBannerSlots", "adMaxDestacadosSlots", "adMaxProductosSlots", "adMinDurationDays", "adDiscount3Months", "adDiscount6Months", "adPaymentMethods", "adCancellation48hFullRefund", "adCancellationAdminFeePercent", "heroBackgroundsJson", "bankName", "bankAccountHolder", "bankCbu", "bankAlias", "bankCuit", "supportChatEnabled", "excludedZonesJson") FROM stdin;
settings	t	Volvemos pronto	f	Estamos preparando todo para vos. MOOVY llega pronto a Ushuaia.	1658	0.06	1500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-05-04 12:29:15.383	Ver mas	t	f					t	t	f	6	t	5000	t	/productos?categoria=pizzas	Ver locales	f	\N	2x1 en locales seleccionados de 20hs a 23hs.	Noches de\nPizza & Pelis	abajo-izquierda	[]	80	{"ZONA_A":1,"ZONA_B":1.15,"ZONA_C":1.35}	{"normal":1,"lluvia_leve":1.15,"temporal_fuerte":1.3}	normal	5	0	12	10	15000	25000	40000	15	120	1.5	48	09:00	22:00	300	60	150000	50000	100000	250000	180000	25000	50	3	8	12	7	10	20	["mercadopago","transferencia"]	t	10	{}						f	[]
\.


--
-- Data for Name: SubOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubOrder" (id, "orderId", "merchantId", "sellerId", status, subtotal, "deliveryFee", discount, total, "driverId", "moovyCommission", "sellerPayout", "paymentStatus", "deliveryStatus", "deliveredAt", "deliveryPhoto", "driverRating", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "pendingDriverId", "createdAt", "updatedAt", "mpTransferId", "payoutStatus", "paidOutAt", "deliveryPin", "deliveryPinAttempts", "deliveryPinVerifiedAt", "failedDeliveryAt", "failedDeliveryReason", "pickupPin", "pickupPinAttempts", "pickupPinVerifiedAt", "nearDestinationNotified", "driverPayoutAmount", "merchantCommissionRate", "merchantCommissionSource", "operationalCost", "tripCost", "zoneCode", "zoneDriverBonus", "zoneMultiplier", "driverStatus", "merchantStatus", "noShowFlag", "noShowReportedAt", "payoutHoldUntil", "waitingStartedAt") FROM stdin;
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

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "privacyConsentAt", "termsConsentAt", "resetToken", "resetTokenExpiry", "deletedAt", "archivedAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "onboardingCompletedAt", "age18Confirmed", "cookiesConsent", "cookiesConsentAt", "marketingConsent", "marketingConsentAt", "marketingConsentRevokedAt", "privacyConsentVersion", "termsConsentVersion", "pointsExpiryNotifiedAt", "failedLoginAttempts", "loginLockedUntil") FROM stdin;
cmoqaehxc000qermah0y0rpfy	seller.test@moovy.local	$2b$12$xInYNrZMFPn/0GTdTgqu0eSDKMprZKT0ixCT0t15qYjMNVpJt9g/C	Vendedor Marketplace Test	\N	\N	\N	USER	\N	\N	0	0	f	cmoqaehxc000rerman20em9rd	\N	2026-05-03 21:32:59.328	2026-05-05 19:38:35.909	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	0	\N
cmoqaeh2r0000erma67dv4jv8	buyer.test@moovy.local	$2b$12$412R1l70RwnUmDzOpJZZwuZL3eAojLfXLZtiYpvDCRzrUJsbl58Xm	Cliente Test	\N	\N	\N	USER	\N	\N	0	0	f	cmoqaeh2r0001ermagod8r998	\N	2026-05-03 21:32:58.227	2026-05-05 19:48:52.01	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	2026-05-05 19:48:52.005	f	\N	\N	f	\N	\N	\N	\N	\N	0	\N
cmoem7nkg0001k8grd394va3v	test@somosmoovy.com	$2b$10$oTZpzE1sYUHVQPZmLbB07uhWy6hdKAk.jlLOQUENzEAZiHLFZyoa6	Paola Ruiz	Paola	Ruiz	+549290112345678	USER	\N	\N	0	0	f	cmoem7nkg0002k8grwha1ub0f	\N	2026-04-25 17:30:21.327	2026-05-03 03:52:52.522	2026-04-25 17:30:21.33	2026-04-25 17:30:21.33	20de89980344250ee82f1602a46a413b97cc83c4c1bdb4ed44b6666f7bf300fd	2026-04-26 13:31:17.199	2026-05-03 03:52:52.52	\N	f	\N	\N	\N	2026-04-25 17:38:47.142	f	\N	\N	f	\N	\N	2.0	1.1	\N	0	\N
cmp60qa3g0007d60svwywx818	test2@somosmoovy.com	$2b$10$PMaeXVoYkeVwCJYSW4FhW..003rwlS1KagTgHW7XHj5XS7VrLtejW	Marcos Perez	Marcos	Perez	+54929014568798	USER	\N	\N	0	0	f	cmp60qa3g0008d60sgpzm3grp	\N	2026-05-14 21:46:31.707	2026-05-14 21:53:22.845	2026-05-14 21:46:31.704	2026-05-14 21:46:31.704	\N	\N	\N	\N	f	\N	\N	\N	\N	f	\N	\N	f	\N	\N	2.0	1.2	\N	0	\N
cmobtv7wq000ptqia8qc32mkw	facundotdf@gmail.com	$2b$10$7dbEhzk414ORxuSWITwXzuKdjPyTvCT0aYj3/bynmRa.JSaU2xiv.	Facundo Bellotto	Facundo	Bellotto	+542901405385	USER	\N	\N	0	0	f	cmobtv7wq000qtqia2nx4xfbr	\N	2026-04-23 18:41:19.562	2026-04-25 05:32:31.9	2026-04-23 18:41:19.561	2026-04-23 18:41:19.561	\N	\N	2026-04-25 05:32:31.899	\N	f	\N	\N	\N	\N	f	\N	\N	f	\N	\N	2.0	1.1	\N	0	\N
cmodw2bcv0004ornia10d6of8	getinnerdrop@gmail.com	$2b$10$.v2oxFMx4eLsCdy7wfqV4uQHzmu6sIkURq5Pb9a/5juD2zRiTOPVG	Juan Pedro	Juan	Pedro	+54 29011122336	USER	\N	\N	20	1000	f	MOV-JA97	\N	2026-04-25 05:18:22.206	2026-05-03 03:56:27.739	2026-04-25 05:18:22.203	2026-04-25 05:18:22.203	\N	\N	\N	\N	f	\N	\N	\N	2026-04-25 05:18:24.898	t	\N	\N	t	2026-04-25 05:18:22.203	\N	2.0	1.1	\N	0	\N
cmobkazic0002w4k6sk1luhha	maugrod@gmail.com	$2b$10$JmJnWqfoL3YLcfI084JdauwXXLsOK9slbvTEG8ROtpEsebHH4H6AG	Mauro Rodriguez	Mauro	Rodriguez	+54 2901652974	USER	\N	\N	36	1000	f	MOV-3CYV	\N	2026-04-23 14:13:39.009	2026-05-19 00:14:22.753	2026-04-23 14:13:39.006	2026-04-23 14:13:39.006	52eb1a08c953eabf35843a32e924ac18dd40772e8a27bd5ea0d52f05ae22fc67	2026-05-18 23:28:46.274	\N	\N	f	\N	\N	\N	2026-04-23 14:15:45.524	t	\N	\N	t	2026-04-23 14:13:39.006	\N	2.0	1.1	\N	0	\N
cmobth34p0002tqiaji23ve3q	ing.iyad@gmail.com	$2b$10$t1KKn.nw6Dzd2gWVPlJfSOtLXKvFoSblO/bGkCQxehzxPk.grv/.6	Iyad Marmoud Naser	Iyad	Marmoud Naser	+54 2901611605	USER	\N	\N	0	1000	f	MOV-48QG	\N	2026-04-23 18:30:20.184	2026-05-15 01:31:21.335	2026-04-23 18:30:20.183	2026-04-23 18:30:20.182	\N	\N	\N	\N	f	\N	\N	\N	2026-04-23 18:30:22.69	t	{"essential":true,"analytics":true,"functional":true,"marketing":true}	2026-04-23 18:43:58.533	t	2026-04-23 18:30:20.183	\N	2.0	1.1	\N	0	\N
cmoqaehbn0004erma23omyvjs	merchant.test@moovy.local	$2b$12$qOwVk0PVs.anfaNvcBqv7eDCZN1lXMdTucyizA.8BSXiDOiqyxBg.	 				USER	\N	\N	0	0	f	cmoqaehbn0005erma6znjky5y	\N	2026-05-03 21:32:58.547	2026-05-19 00:17:34.023	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	2026-05-07 00:27:41.104	f	\N	\N	f	\N	\N	\N	\N	\N	0	\N
cmoir8pja0006rxa6e52geiv5	test1@somosmoovy.com	$2b$10$RiIllcOya8YhIlgjDJyFY.0JXeZauzFgLS.4kNNhDbPhrM2KVoaTm	Marcos Perez	Marcos	Perez	\N	USER	\N	\N	0	0	f	cmoir8pja0007rxa6hwl9rfp8	\N	2026-04-28 15:02:13.317	2026-04-28 15:02:24.53	\N	\N	61163917cf5d721cb08febc1034666a9d4737cd5f1c5630a8c3940f7503ceeb9	2026-04-29 15:02:13.125	2026-04-28 15:02:24.529	\N	f	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	0	\N
cmoqaehm7000kerma58f7mpn4	driver.test@moovy.local	$2b$12$MEeHryTYZuvNaGQ/yBRjgOCAKUbbzEugqSCq4loCIh0J4KhbBF3JC	Repartidor Test	\N	\N	\N	USER	\N	\N	0	0	f	cmoqaehm7000lermanglgw29j	\N	2026-05-03 21:32:58.927	2026-05-05 20:14:48.874	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	0	\N
cmnuzx1fg0002zgw8zimoxguz	maurod@me.com	$2b$12$JsnYaQTYra8HYzOzFwhCH.owWDtAyP5Rj3EEA2NEZxo7ddSrpJy2K	Mauro Rodriguez	Mauro	Rodriguez	+54 2901652974	ADMIN	\N	\N	0	0	f	MOV-54Z4	\N	2026-04-11 23:58:37.179	2026-05-14 16:55:04.405	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	2026-04-26 01:51:04.538	f	{"essential":true,"analytics":true,"functional":true,"marketing":true}	2026-04-27 12:30:45.317	f	\N	\N	\N	\N	\N	0	\N
\.


--
-- Data for Name: UserActivityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserActivityLog" (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmobtp1rk000ctqiafswh74wv	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-23 18:36:31.664
cmoc807xa0001vghv8xm3o8pv	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-24 01:17:07.485
cmoddzqrs0001w2pcqty26i5p	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-24 20:52:29.127
cmodwgq48000forniospg9uw8	cmobth34p0002tqiaji23ve3q	LOGIN	User	cmobth34p0002tqiaji23ve3q	{"method":"credentials"}	\N	\N	2026-04-25 05:29:34.52
cmodww8z8000sorni4pgs58cc	cmobth34p0002tqiaji23ve3q	LOGIN	User	cmobth34p0002tqiaji23ve3q	{"method":"credentials"}	\N	\N	2026-04-25 05:41:38.804
cmoegfxhv001g2klvrsxjrlax	cmodw2bcv0004ornia10d6of8	ORDER_CREATED	Order	cmoegfxfd001a2klvtpbvu8s5	{"orderNumber":"MOV-B3V2","total":9034,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-04-25 14:48:49.747
cmoemig3r000gk8grv1ki6atl	cmoem7nkg0001k8grd394va3v	LOGIN	User	cmoem7nkg0001k8grd394va3v	{"method":"credentials"}	\N	\N	2026-04-25 17:38:44.871
cmof4m66z0001ybcyh2s3squk	cmoem7nkg0001k8grd394va3v	LOGIN	User	cmoem7nkg0001k8grd394va3v	{"method":"credentials"}	\N	\N	2026-04-26 02:05:31.738
cmofz05fv0001v3npuul8mcm1	cmodw2bcv0004ornia10d6of8	LOGIN	User	cmodw2bcv0004ornia10d6of8	{"method":"credentials"}	\N	\N	2026-04-26 16:16:12.426
cmogije3w000hkoavaho785nm	cmodw2bcv0004ornia10d6of8	ORDER_CREATED	Order	cmogijdxh000bkoav0u9x1qqb	{"orderNumber":"MOV-J5HU","total":2704,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-04-27 01:23:02.828
cmogkvs41000bljakpenm361f	cmoem7nkg0001k8grd394va3v	ORDER_CONFIRMED	Order	cmogkuicd0003ljak3fxcwmv5	{"orderNumber":"MOV-XMM9"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-27 02:28:40.082
cmoh6bmp50004f2miqm6ea3jx	cmobth34p0002tqiaji23ve3q	LOGIN	User	cmobth34p0002tqiaji23ve3q	{"method":"credentials"}	\N	\N	2026-04-27 12:28:51.498
cmohmpg4o00014lnnbsms6rry	cmodw2bcv0004ornia10d6of8	LOGIN	User	cmodw2bcv0004ornia10d6of8	{"method":"credentials"}	\N	\N	2026-04-27 20:07:30.02
cmohqmv4a00018a3gyr7wzkme	cmodw2bcv0004ornia10d6of8	LOGIN	User	cmodw2bcv0004ornia10d6of8	{"method":"credentials"}	\N	\N	2026-04-27 21:57:27.897
cmoir8y7c000arxa6ffvecyei	cmoir8pja0006rxa6e52geiv5	ADMIN_USER_DELETED	User	cmoir8pja0006rxa6e52geiv5	{"adminUserId":"cmnuzx1fg0002zgw8zimoxguz","email":"test1@somosmoovy.com","name":"Marcos Perez","roles":["USER"],"bulkOperation":true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-28 15:02:24.553
cmolovntf0001zrki68p7zjgz	cmnuzx1fg0002zgw8zimoxguz	LOGIN	User	cmnuzx1fg0002zgw8zimoxguz	{"method":"credentials"}	\N	\N	2026-04-30 16:19:23.857
cmomcfc5t0005svo3w20qn26g	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-01 03:18:33.041
cmop8dcx00006e0hdrfe8h8py	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-03 03:48:20.77
cmop8khz2000de0hdddvxxzq8	cmodw2bcv0004ornia10d6of8	LOGIN	User	cmodw2bcv0004ornia10d6of8	{"method":"credentials"}	\N	\N	2026-05-03 03:53:53.919
cmot1k6sd00019i9jdnd3t5rx	cmoqaeh2r0000erma67dv4jv8	LOGIN	User	cmoqaeh2r0000erma67dv4jv8	{"method":"credentials"}	\N	\N	2026-05-05 19:48:46.811
cmot2ho4k000a9i9juk9j6vc5	cmoqaehm7000kerma58f7mpn4	LOGIN	User	cmoqaehm7000kerma58f7mpn4	{"method":"credentials"}	\N	\N	2026-05-05 20:14:48.933
cmou2msjw001d2sh5eetcau8z	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmou27mue000z2sh5mwe5z8nr	{"orderNumber":"MOV-LJ3L"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 13:06:34.124
cmou4w8x0002z2sh5d3ughj84	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmou4sekb002p2sh59nq0qhgk	{"orderNumber":"MOV-T5VA"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 14:09:54.468
cmou875hx001efehvcaje7ykv	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmou83xhn0014fehvq9x78556	{"orderNumber":"MOV-QDDN"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 15:42:22.101
cmoubz5xx0015dndekvj2wvx7	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmoubv2c6000vdnde7r01x8we	{"orderNumber":"MOV-HZZ3"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 17:28:07.893
cmouced6o002cdnde933nepmz	cmoqaeh2r0000erma67dv4jv8	ORDER_CREATED	Order	cmouced440026dndezvzm4fss	{"orderNumber":"MOV-CBYP","total":9656,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 17:39:57.12
cmouo6097000xx4ktgfda06fr	cmoqaeh2r0000erma67dv4jv8	ORDER_CREATED	Order	cmouo606g000rx4ktv41n224g	{"orderNumber":"MOV-JB9A","total":1571,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 23:09:22.508
cmourrykr0014192pk4bff8ke	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmourhssa000u192pjt1jaqma	{"orderNumber":"MOV-NDX2"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-07 00:50:25.61
cmp5qbgv00001d60sejos70to	cmnuzx1fg0002zgw8zimoxguz	LOGIN	User	cmnuzx1fg0002zgw8zimoxguz	{"method":"credentials"}	\N	\N	2026-05-14 16:55:04.474
cmp60jil10005d60s2orv9ww1	cmoqaehbn0004erma23omyvjs	LOGIN	User	cmoqaehbn0004erma23omyvjs	{"method":"credentials"}	\N	\N	2026-05-14 21:41:16.115
cmp61rq7i000id60s6cxbmlhn	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-14 22:15:38.861
cmp68revp001qd60sshyeo1cx	cmobth34p0002tqiaji23ve3q	LOGIN	User	cmobth34p0002tqiaji23ve3q	{"method":"credentials"}	\N	\N	2026-05-15 01:31:21.492
cmpa5c9r3000l8eo0jx42j37t	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpa57zgp000b8eo0y5s1j7vh	{"orderNumber":"MOV-YDH6"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 19:06:40.864
cmpa8telu001g8eo0f674lipm	cmobkazic0002w4k6sk1luhha	ORDER_CREATED	Order	cmpa8teim001a8eo0dv5in5qq	{"orderNumber":"MOV-48P6","total":1448,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 20:43:59.154
cmpa9bfq0001y8eo0p1g631su	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpa9alo0001o8eo0979z2inr	{"orderNumber":"MOV-NALB"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 20:58:00.408
cmobtx23c0010tqiapbqxwr20	cmnuzx1fg0002zgw8zimoxguz	LOGIN	User	cmnuzx1fg0002zgw8zimoxguz	{"method":"credentials"}	\N	\N	2026-04-23 18:42:45.336
cmodw2box000corniydmodk2k	cmodw2bcv0004ornia10d6of8	LOGIN	User	cmodw2bcv0004ornia10d6of8	{"method":"credentials"}	\N	\N	2026-04-25 05:18:22.641
cmodwkj0v000lornirlzr23gt	cmobtv7wq000ptqia8qc32mkw	ADMIN_USER_DELETED	User	cmobtv7wq000ptqia8qc32mkw	{"adminUserId":"cmnuzx1fg0002zgw8zimoxguz","email":"facundotdf@gmail.com","name":"Facundo Bellotto","roles":["USER","DRIVER"],"bulkOperation":true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-25 05:32:31.951
cmoeenqgb000a2klvazxg02uh	cmodw2bcv0004ornia10d6of8	ORDER_CREATED	Order	cmoeenqcc00042klvzt0l8lad	{"orderNumber":"MOV-KAGM","total":13818,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-04-25 13:58:54.635
cmoeggyz1001k2klvow0mk6zz	cmobth34p0002tqiaji23ve3q	ORDER_CONFIRMED	Order	cmoegfxfd001a2klvtpbvu8s5	{"orderNumber":"MOV-B3V2"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-04-25 14:49:38.315
cmof7a2pq0001wtg5v10bcbtj	cmoem7nkg0001k8grd394va3v	LOGIN	User	cmoem7nkg0001k8grd394va3v	{"method":"credentials"}	\N	\N	2026-04-26 03:20:06.205
cmogc96ow000k8hykd4hlyi08	cmodw2bcv0004ornia10d6of8	ORDER_CREATED	Order	cmogc96lc000e8hykop0xc383	{"orderNumber":"MOV-57CB","total":2704,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-04-26 22:27:08.96
cmogiki6s000lkoavaaadvejt	cmoem7nkg0001k8grd394va3v	ORDER_CONFIRMED	Order	cmogijdxh000bkoav0u9x1qqb	{"orderNumber":"MOV-J5HU"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-27 01:23:54.773
cmogkxbty000gljakik2g8qop	cmoem7nkg0001k8grd394va3v	ORDER_DELIVERED	Order	cmogkuicd0003ljak3fxcwmv5	{"orderNumber":"MOV-XMM9","isPickup":true,"deliveredBy":"merchant"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-27 02:29:52.253
cmohbb1d5000611lkk7uhup1q	cmodw2bcv0004ornia10d6of8	LOGIN	User	cmodw2bcv0004ornia10d6of8	{"method":"credentials"}	\N	\N	2026-04-27 14:48:21.929
cmoir7g3b0004rxa6vfolkoxt	cmoem7nkg0001k8grd394va3v	LOGIN	User	cmoem7nkg0001k8grd394va3v	{"method":"credentials"}	\N	\N	2026-04-28 15:01:14.423
cmoiuje44000erxa6mm60o6dg	cmoem7nkg0001k8grd394va3v	LOGIN	User	cmoem7nkg0001k8grd394va3v	{"method":"credentials"}	\N	\N	2026-04-28 16:34:30.532
cmon1tv180001e0hdme8b8jzp	cmoem7nkg0001k8grd394va3v	LOGIN	User	cmoem7nkg0001k8grd394va3v	{"method":"credentials"}	\N	\N	2026-05-01 15:09:41.083
cmop8j6nh0009e0hdlbglmgcc	cmoem7nkg0001k8grd394va3v	ADMIN_USER_DELETED	User	cmoem7nkg0001k8grd394va3v	{"adminUserId":"cmnuzx1fg0002zgw8zimoxguz","email":"test@somosmoovy.com","name":"Paola Ruiz","roles":["USER","COMERCIO"],"bulkOperation":true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-03 03:52:52.59
cmop8v9fz000ze0hdn5zgwvcc	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-03 04:02:16.079
cmot1n18c00039i9jjxej9hri	cmoqaehbn0004erma23omyvjs	LOGIN	User	cmoqaehbn0004erma23omyvjs	{"method":"credentials"}	\N	\N	2026-05-05 19:50:59.58
cmot7wec5000jruh6l4kmiiea	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmot7n4100005ruh64x2x49q0	{"orderNumber":"MOV-K9CX"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-05 22:46:14.165
cmou3of6l002f2sh5gx4q5j87	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmou3g4a000252sh554pwytr4	{"orderNumber":"MOV-HV98"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 13:35:49.726
cmou6du8i000hfehv2xpf6n3n	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmou68jmb0005fehvtn7o7o2u	{"orderNumber":"MOV-G3YL"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 14:51:34.866
cmouaekhd000gdndexhg0vros	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmoua77ai0006dndeuqm929hr	{"orderNumber":"MOV-CYK4"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 16:44:07.345
cmobkb0cm000aw4k646hrbj1f	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-23 14:13:40.103
cmoblp8qi000hw4k6r9ggrq20	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-23 14:52:43.771
cmobth3c6000atqia7xa18xg0	cmobth34p0002tqiaji23ve3q	LOGIN	User	cmobth34p0002tqiaji23ve3q	{"method":"credentials"}	\N	\N	2026-04-23 18:30:20.454
cmouccao1001xdndevnp0vwsb	cmoqaeh2r0000erma67dv4jv8	ORDER_CREATED	Order	cmouccaka001rdndee72n3ans	{"orderNumber":"MOV-ELQF","total":37481,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 17:38:20.545
cmoucd73j001zdnde0kvl96li	cmoqaehbn0004erma23omyvjs	ORDER_REJECTED	Order	cmouccaka001rdndee72n3ans	{"orderNumber":"MOV-ELQF","reason":"Solicitud del cliente"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 17:39:02.575
cmounww66000fx4kt319rkpsd	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmounrgk00005x4kt2ete17tm	{"orderNumber":"MOV-CQSD"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 23:02:17.311
cmouo6e9q0011x4kt4pk8a7mg	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmouo606g000rx4ktv41n224g	{"orderNumber":"MOV-JB9A"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-06 23:09:40.671
cmp5wsdrb0003d60sx2za0gmi	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-14 19:56:11.193
cmp60z3de000gd60sw0bokph5	cmp60qa3g0007d60svwywx818	LOGIN	User	cmp60qa3g0007d60svwywx818	{"method":"credentials"}	\N	\N	2026-05-14 21:53:22.898
cmp61zetr0010d60sm0nw2nup	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmp61xkw5000qd60sq6gonbm4	{"orderNumber":"MOV-GKH3"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-14 22:21:37.36
cmpa57zkg000h8eo08rbk02oj	cmobkazic0002w4k6sk1luhha	ORDER_CREATED	Order	cmpa57zgp000b8eo0y5s1j7vh	{"orderNumber":"MOV-YDH6","total":37475,"isMultiVendor":false}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 19:03:21.04
cmpaaxuak002z8eo0vfpl14rr	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpaarmxl002p8eo06gknvo5w	{"orderNumber":"MOV-N2NW"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 21:43:25.341
cmpael41q00448eo0itfnkto9	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpaej6bq003u8eo0ybis0jdc	{"orderNumber":"MOV-UBAR"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 23:25:29.918
cmpaf6zl700598eo0qvo996bm	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpaf44bz004z8eo01ig2ptrc	{"orderNumber":"MOV-RGR3"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-17 23:42:30.571
cmpagrarz000gvg2frvoyrrw0	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpagot250006vg2fguv1865i	{"orderNumber":"MOV-3HGZ"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-18 00:26:17.807
cmpanlas7000gfdaqc0ej8u27	cmoqaehbn0004erma23omyvjs	ORDER_CONFIRMED	Order	cmpaniwc70006fdaqoyde34jk	{"orderNumber":"MOV-LSNJ"}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-18 03:37:35.191
cmpbqawse00013op8cl2838wm	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-18 21:41:15.513
cmpbvrtr600033op8xqcc1y4y	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-05-19 00:14:22.817
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" (id, "userId", role, "isActive", "activatedAt") FROM stdin;
cmnw2pyz700013ooek0ybrew9	cmnuzx1fg0002zgw8zimoxguz	ADMIN	t	2026-04-12 18:04:52.434
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


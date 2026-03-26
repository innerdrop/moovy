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
ALTER TABLE IF EXISTS ONLY public."UserRole" DROP CONSTRAINT IF EXISTS "UserRole_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportOperator" DROP CONSTRAINT IF EXISTS "SupportOperator_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_senderId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_chatId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportChat" DROP CONSTRAINT IF EXISTS "SupportChat_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupportChat" DROP CONSTRAINT IF EXISTS "SupportChat_operatorId_fkey";
ALTER TABLE IF EXISTS ONLY public."SubOrder" DROP CONSTRAINT IF EXISTS "SubOrder_sellerId_fkey";
ALTER TABLE IF EXISTS ONLY public."SubOrder" DROP CONSTRAINT IF EXISTS "SubOrder_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."SubOrder" DROP CONSTRAINT IF EXISTS "SubOrder_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."SubOrder" DROP CONSTRAINT IF EXISTS "SubOrder_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."SellerProfile" DROP CONSTRAINT IF EXISTS "SellerProfile_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SellerAvailability" DROP CONSTRAINT IF EXISTS "SellerAvailability_sellerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Referral" DROP CONSTRAINT IF EXISTS "Referral_referrerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Referral" DROP CONSTRAINT IF EXISTS "Referral_refereeId_fkey";
ALTER TABLE IF EXISTS ONLY public."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_packageCategoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."PointsTransaction" DROP CONSTRAINT IF EXISTS "PointsTransaction_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."PendingAssignment" DROP CONSTRAINT IF EXISTS "PendingAssignment_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."PackagePurchase" DROP CONSTRAINT IF EXISTS "PackagePurchase_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."PackagePurchase" DROP CONSTRAINT IF EXISTS "PackagePurchase_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_addressId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_subOrderId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_listingId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderChat" DROP CONSTRAINT IF EXISTS "OrderChat_participantBId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderChat" DROP CONSTRAINT IF EXISTS "OrderChat_participantAId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderChat" DROP CONSTRAINT IF EXISTS "OrderChat_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderChatMessage" DROP CONSTRAINT IF EXISTS "OrderChatMessage_senderId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderChatMessage" DROP CONSTRAINT IF EXISTS "OrderChatMessage_chatId_fkey";
ALTER TABLE IF EXISTS ONLY public."Merchant" DROP CONSTRAINT IF EXISTS "Merchant_ownerId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Listing" DROP CONSTRAINT IF EXISTS "Listing_sellerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Listing" DROP CONSTRAINT IF EXISTS "Listing_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."ListingImage" DROP CONSTRAINT IF EXISTS "ListingImage_listingId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_listingId_fkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DriverLocationHistory" DROP CONSTRAINT IF EXISTS "DriverLocationHistory_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."DriverLocationHistory" DROP CONSTRAINT IF EXISTS "DriverLocationHistory_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryRate" DROP CONSTRAINT IF EXISTS "DeliveryRate_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_couponId_fkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."AssignmentLog" DROP CONSTRAINT IF EXISTS "AssignmentLog_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."AssignmentLog" DROP CONSTRAINT IF EXISTS "AssignmentLog_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_userId_fkey";
DROP INDEX IF EXISTS public."User_referralCode_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."UserRole_userId_role_key";
DROP INDEX IF EXISTS public."UserRole_userId_idx";
DROP INDEX IF EXISTS public."SupportOperator_userId_key";
DROP INDEX IF EXISTS public."SupportOperator_isActive_isOnline_idx";
DROP INDEX IF EXISTS public."SupportMessage_createdAt_idx";
DROP INDEX IF EXISTS public."SupportMessage_chatId_idx";
DROP INDEX IF EXISTS public."SupportChat_userId_idx";
DROP INDEX IF EXISTS public."SupportChat_status_idx";
DROP INDEX IF EXISTS public."SupportChat_operatorId_idx";
DROP INDEX IF EXISTS public."SupportChat_createdAt_idx";
DROP INDEX IF EXISTS public."SubOrder_status_idx";
DROP INDEX IF EXISTS public."SubOrder_sellerId_idx";
DROP INDEX IF EXISTS public."SubOrder_paymentStatus_idx";
DROP INDEX IF EXISTS public."SubOrder_merchantId_idx";
DROP INDEX IF EXISTS public."SellerProfile_userId_key";
DROP INDEX IF EXISTS public."SellerProfile_mpUserId_key";
DROP INDEX IF EXISTS public."SellerAvailability_sellerId_key";
DROP INDEX IF EXISTS public."SavedCart_userId_key";
DROP INDEX IF EXISTS public."Referral_refereeId_key";
DROP INDEX IF EXISTS public."PushSubscription_userId_idx";
DROP INDEX IF EXISTS public."PushSubscription_endpoint_key";
DROP INDEX IF EXISTS public."Product_slug_key";
DROP INDEX IF EXISTS public."Product_merchantId_idx";
DROP INDEX IF EXISTS public."ProductCategory_productId_categoryId_key";
DROP INDEX IF EXISTS public."PendingAssignment_status_idx";
DROP INDEX IF EXISTS public."PendingAssignment_orderId_key";
DROP INDEX IF EXISTS public."PendingAssignment_expiresAt_idx";
DROP INDEX IF EXISTS public."Payment_orderId_idx";
DROP INDEX IF EXISTS public."Payment_mpPaymentId_key";
DROP INDEX IF EXISTS public."Payment_mpPaymentId_idx";
DROP INDEX IF EXISTS public."PackagePurchase_paymentStatus_idx";
DROP INDEX IF EXISTS public."PackagePurchase_mpExternalRef_key";
DROP INDEX IF EXISTS public."PackagePurchase_mpExternalRef_idx";
DROP INDEX IF EXISTS public."PackagePurchase_merchantId_idx";
DROP INDEX IF EXISTS public."PackageCategory_name_key";
DROP INDEX IF EXISTS public."Order_userId_idx";
DROP INDEX IF EXISTS public."Order_status_idx";
DROP INDEX IF EXISTS public."Order_paymentStatus_idx";
DROP INDEX IF EXISTS public."Order_orderNumber_key";
DROP INDEX IF EXISTS public."Order_driverId_idx";
DROP INDEX IF EXISTS public."Order_deliveryStatus_idx";
DROP INDEX IF EXISTS public."Order_deletedAt_idx";
DROP INDEX IF EXISTS public."Order_createdAt_idx";
DROP INDEX IF EXISTS public."OrderItem_listingId_idx";
DROP INDEX IF EXISTS public."OrderChat_status_idx";
DROP INDEX IF EXISTS public."OrderChat_participantBId_idx";
DROP INDEX IF EXISTS public."OrderChat_participantAId_idx";
DROP INDEX IF EXISTS public."OrderChat_orderId_idx";
DROP INDEX IF EXISTS public."OrderChat_orderId_chatType_participantAId_participantBId_key";
DROP INDEX IF EXISTS public."OrderChatMessage_senderId_idx";
DROP INDEX IF EXISTS public."OrderChatMessage_chatId_createdAt_idx";
DROP INDEX IF EXISTS public."OrderBackup_orderId_idx";
DROP INDEX IF EXISTS public."OrderBackup_deletedAt_idx";
DROP INDEX IF EXISTS public."OrderBackup_backupName_idx";
DROP INDEX IF EXISTS public."MpWebhookLog_resourceId_idx";
DROP INDEX IF EXISTS public."MpWebhookLog_eventId_key";
DROP INDEX IF EXISTS public."MoovyConfig_key_key";
DROP INDEX IF EXISTS public."Merchant_slug_key";
DROP INDEX IF EXISTS public."Merchant_ownerId_idx";
DROP INDEX IF EXISTS public."Merchant_mpUserId_key";
DROP INDEX IF EXISTS public."Merchant_loyaltyTier_idx";
DROP INDEX IF EXISTS public."Merchant_isActive_idx";
DROP INDEX IF EXISTS public."Merchant_approvalStatus_idx";
DROP INDEX IF EXISTS public."MerchantLoyaltyConfig_tier_key";
DROP INDEX IF EXISTS public."MerchantLoyaltyConfig_tier_idx";
DROP INDEX IF EXISTS public."MerchantCategory_merchantId_categoryId_key";
DROP INDEX IF EXISTS public."MerchantAcquiredProduct_merchantId_productId_key";
DROP INDEX IF EXISTS public."Listing_sellerId_idx";
DROP INDEX IF EXISTS public."Listing_isActive_idx";
DROP INDEX IF EXISTS public."Listing_categoryId_idx";
DROP INDEX IF EXISTS public."Favorite_userId_productId_key";
DROP INDEX IF EXISTS public."Favorite_userId_merchantId_key";
DROP INDEX IF EXISTS public."Favorite_userId_listingId_key";
DROP INDEX IF EXISTS public."Favorite_userId_idx";
DROP INDEX IF EXISTS public."Driver_userId_key";
DROP INDEX IF EXISTS public."Driver_isOnline_idx";
DROP INDEX IF EXISTS public."Driver_isActive_idx";
DROP INDEX IF EXISTS public."Driver_approvalStatus_idx";
DROP INDEX IF EXISTS public."DriverLocationHistory_timestamp_idx";
DROP INDEX IF EXISTS public."DriverLocationHistory_orderId_createdAt_idx";
DROP INDEX IF EXISTS public."DriverLocationHistory_driverId_createdAt_idx";
DROP INDEX IF EXISTS public."DeliveryRate_categoryId_key";
DROP INDEX IF EXISTS public."Coupon_isActive_idx";
DROP INDEX IF EXISTS public."Coupon_code_key";
DROP INDEX IF EXISTS public."Coupon_code_idx";
DROP INDEX IF EXISTS public."CouponUsage_userId_idx";
DROP INDEX IF EXISTS public."CouponUsage_couponId_idx";
DROP INDEX IF EXISTS public."ConfigAuditLog_configType_createdAt_idx";
DROP INDEX IF EXISTS public."ConfigAuditLog_adminUserId_idx";
DROP INDEX IF EXISTS public."Category_slug_key";
DROP INDEX IF EXISTS public."Category_name_key";
DROP INDEX IF EXISTS public."CartItem_userId_productId_variantId_key";
DROP INDEX IF EXISTS public."CannedResponse_shortcut_key";
DROP INDEX IF EXISTS public."CannedResponse_isActive_idx";
DROP INDEX IF EXISTS public."CannedResponse_category_idx";
DROP INDEX IF EXISTS public."AuditLog_userId_idx";
DROP INDEX IF EXISTS public."AuditLog_entityType_entityId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
DROP INDEX IF EXISTS public."AssignmentLog_orderId_idx";
DROP INDEX IF EXISTS public."AssignmentLog_notifiedAt_idx";
DROP INDEX IF EXISTS public."AssignmentLog_driverId_idx";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserRole" DROP CONSTRAINT IF EXISTS "UserRole_pkey";
ALTER TABLE IF EXISTS ONLY public."SupportOperator" DROP CONSTRAINT IF EXISTS "SupportOperator_pkey";
ALTER TABLE IF EXISTS ONLY public."SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."SupportChat" DROP CONSTRAINT IF EXISTS "SupportChat_pkey";
ALTER TABLE IF EXISTS ONLY public."SubOrder" DROP CONSTRAINT IF EXISTS "SubOrder_pkey";
ALTER TABLE IF EXISTS ONLY public."StoreSettings" DROP CONSTRAINT IF EXISTS "StoreSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."SellerProfile" DROP CONSTRAINT IF EXISTS "SellerProfile_pkey";
ALTER TABLE IF EXISTS ONLY public."SellerAvailability" DROP CONSTRAINT IF EXISTS "SellerAvailability_pkey";
ALTER TABLE IF EXISTS ONLY public."SavedCart" DROP CONSTRAINT IF EXISTS "SavedCart_pkey";
ALTER TABLE IF EXISTS ONLY public."Referral" DROP CONSTRAINT IF EXISTS "Referral_pkey";
ALTER TABLE IF EXISTS ONLY public."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_pkey";
ALTER TABLE IF EXISTS ONLY public."ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."PointsTransaction" DROP CONSTRAINT IF EXISTS "PointsTransaction_pkey";
ALTER TABLE IF EXISTS ONLY public."PointsConfig" DROP CONSTRAINT IF EXISTS "PointsConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."PendingAssignment" DROP CONSTRAINT IF EXISTS "PendingAssignment_pkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_pkey";
ALTER TABLE IF EXISTS ONLY public."PackagePurchase" DROP CONSTRAINT IF EXISTS "PackagePurchase_pkey";
ALTER TABLE IF EXISTS ONLY public."PackagePricingTier" DROP CONSTRAINT IF EXISTS "PackagePricingTier_pkey";
ALTER TABLE IF EXISTS ONLY public."PackageCategory" DROP CONSTRAINT IF EXISTS "PackageCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderChat" DROP CONSTRAINT IF EXISTS "OrderChat_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderChatMessage" DROP CONSTRAINT IF EXISTS "OrderChatMessage_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderBackup" DROP CONSTRAINT IF EXISTS "OrderBackup_pkey";
ALTER TABLE IF EXISTS ONLY public."MpWebhookLog" DROP CONSTRAINT IF EXISTS "MpWebhookLog_pkey";
ALTER TABLE IF EXISTS ONLY public."MoovyConfig" DROP CONSTRAINT IF EXISTS "MoovyConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."Merchant" DROP CONSTRAINT IF EXISTS "Merchant_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantLoyaltyConfig" DROP CONSTRAINT IF EXISTS "MerchantLoyaltyConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_pkey";
ALTER TABLE IF EXISTS ONLY public."Listing" DROP CONSTRAINT IF EXISTS "Listing_pkey";
ALTER TABLE IF EXISTS ONLY public."ListingImage" DROP CONSTRAINT IF EXISTS "ListingImage_pkey";
ALTER TABLE IF EXISTS ONLY public."HeroSlide" DROP CONSTRAINT IF EXISTS "HeroSlide_pkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_pkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_pkey";
ALTER TABLE IF EXISTS ONLY public."DriverLocationHistory" DROP CONSTRAINT IF EXISTS "DriverLocationHistory_pkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryRate" DROP CONSTRAINT IF EXISTS "DeliveryRate_pkey";
ALTER TABLE IF EXISTS ONLY public."Coupon" DROP CONSTRAINT IF EXISTS "Coupon_pkey";
ALTER TABLE IF EXISTS ONLY public."CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_pkey";
ALTER TABLE IF EXISTS ONLY public."ConfigAuditLog" DROP CONSTRAINT IF EXISTS "ConfigAuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_pkey";
ALTER TABLE IF EXISTS ONLY public."CannedResponse" DROP CONSTRAINT IF EXISTS "CannedResponse_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."AssignmentLog" DROP CONSTRAINT IF EXISTS "AssignmentLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_pkey";
DROP TABLE IF EXISTS public."UserRole";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."SupportOperator";
DROP TABLE IF EXISTS public."SupportMessage";
DROP TABLE IF EXISTS public."SupportChat";
DROP TABLE IF EXISTS public."SubOrder";
DROP TABLE IF EXISTS public."StoreSettings";
DROP TABLE IF EXISTS public."SellerProfile";
DROP TABLE IF EXISTS public."SellerAvailability";
DROP TABLE IF EXISTS public."SavedCart";
DROP TABLE IF EXISTS public."Referral";
DROP TABLE IF EXISTS public."PushSubscription";
DROP TABLE IF EXISTS public."ProductVariant";
DROP TABLE IF EXISTS public."ProductImage";
DROP TABLE IF EXISTS public."ProductCategory";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."PointsTransaction";
DROP TABLE IF EXISTS public."PointsConfig";
DROP TABLE IF EXISTS public."PendingAssignment";
DROP TABLE IF EXISTS public."Payment";
DROP TABLE IF EXISTS public."PackagePurchase";
DROP TABLE IF EXISTS public."PackagePricingTier";
DROP TABLE IF EXISTS public."PackageCategory";
DROP TABLE IF EXISTS public."OrderItem";
DROP TABLE IF EXISTS public."OrderChatMessage";
DROP TABLE IF EXISTS public."OrderChat";
DROP TABLE IF EXISTS public."OrderBackup";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."MpWebhookLog";
DROP TABLE IF EXISTS public."MoovyConfig";
DROP TABLE IF EXISTS public."MerchantLoyaltyConfig";
DROP TABLE IF EXISTS public."MerchantCategory";
DROP TABLE IF EXISTS public."MerchantAcquiredProduct";
DROP TABLE IF EXISTS public."Merchant";
DROP TABLE IF EXISTS public."ListingImage";
DROP TABLE IF EXISTS public."Listing";
DROP TABLE IF EXISTS public."HeroSlide";
DROP TABLE IF EXISTS public."Favorite";
DROP TABLE IF EXISTS public."DriverLocationHistory";
DROP TABLE IF EXISTS public."Driver";
DROP TABLE IF EXISTS public."DeliveryRate";
DROP TABLE IF EXISTS public."CouponUsage";
DROP TABLE IF EXISTS public."Coupon";
DROP TABLE IF EXISTS public."ConfigAuditLog";
DROP TABLE IF EXISTS public."Category";
DROP TABLE IF EXISTS public."CartItem";
DROP TABLE IF EXISTS public."CannedResponse";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."AssignmentLog";
DROP TABLE IF EXISTS public."Address";
DROP TYPE IF EXISTS public."VehicleTypeEnum";
DROP TYPE IF EXISTS public."UserRoleType";
DROP TYPE IF EXISTS public."PendingAssignmentStatus";
DROP TYPE IF EXISTS public."DeliveryType";
DROP TYPE IF EXISTS public."DeliveryStatus";
DROP TYPE IF EXISTS public."AssignmentOutcomeEnum";
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
    ubicacion public.geography
);


ALTER TABLE public."Driver" OWNER TO postgres;

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
    "weightKg" double precision,
    "lengthCm" double precision,
    "widthCm" double precision,
    "heightCm" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "categoryId" text,
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
    "loyaltyOrderCount" integer DEFAULT 0 NOT NULL,
    "loyaltyTier" text DEFAULT 'BRONCE'::text NOT NULL,
    "loyaltyUpdatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    "couponCode" text
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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "minPurchaseForBonus" double precision DEFAULT 5000 NOT NULL,
    "minReferralPurchase" double precision DEFAULT 8000 NOT NULL,
    "refereeBonus" integer DEFAULT 100 NOT NULL,
    "tierConfigJson" text,
    "tierWindowDays" integer DEFAULT 90 NOT NULL
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
    "heroSliderEnabled" boolean DEFAULT true NOT NULL,
    "heroSliderInterval" integer DEFAULT 5000 NOT NULL,
    "promoBannerButtonLink" text DEFAULT '/productos?categoria=pizzas'::text NOT NULL,
    "promoBannerButtonText" text DEFAULT 'Ver locales'::text NOT NULL,
    "promoBannerEnabled" boolean DEFAULT true NOT NULL,
    "promoBannerImage" text,
    "promoBannerSubtitle" text DEFAULT '2x1 en locales seleccionados de 20hs a 23hs.'::text NOT NULL,
    "promoBannerTitle" text DEFAULT 'Noches de
Pizza & Pelis'::text NOT NULL,
    "riderCommissionPercent" double precision DEFAULT 80 NOT NULL,
    "activeClimateCondition" text DEFAULT 'normal'::text NOT NULL,
    "cashLimitL1" double precision DEFAULT 15000 NOT NULL,
    "cashLimitL2" double precision DEFAULT 25000 NOT NULL,
    "cashLimitL3" double precision DEFAULT 40000 NOT NULL,
    "cashMpOnlyDeliveries" integer DEFAULT 10 NOT NULL,
    "climateMultipliersJson" text DEFAULT '{"normal":1.0,"lluvia":1.10,"nieve":1.15,"extremo":1.25}'::text NOT NULL,
    "defaultMerchantCommission" double precision DEFAULT 8 NOT NULL,
    "defaultSellerCommission" double precision DEFAULT 12 NOT NULL,
    "driverResponseTimeoutSec" integer DEFAULT 60 NOT NULL,
    "maxAnticipationHours" double precision DEFAULT 48 NOT NULL,
    "maxOrdersPerSlot" integer DEFAULT 15 NOT NULL,
    "merchantConfirmTimeoutSec" integer DEFAULT 300 NOT NULL,
    "minAnticipationHours" double precision DEFAULT 1.5 NOT NULL,
    "operatingHoursEnd" text DEFAULT '22:00'::text NOT NULL,
    "operatingHoursStart" text DEFAULT '09:00'::text NOT NULL,
    "operationalCostPercent" double precision DEFAULT 5 NOT NULL,
    "slotDurationMinutes" integer DEFAULT 120 NOT NULL,
    "zoneMultipliersJson" text DEFAULT '{"ZONA_A":1.0,"ZONA_B":1.15,"ZONA_C":1.35}'::text NOT NULL
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
    "paidOutAt" timestamp(3) without time zone
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
    status text DEFAULT 'waiting'::text NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    category text,
    "operatorId" text,
    priority text DEFAULT 'normal'::text NOT NULL,
    rating integer,
    "ratingComment" text,
    "resolvedAt" timestamp(3) without time zone
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
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "attachmentType" text,
    "attachmentUrl" text,
    "isSystem" boolean DEFAULT false NOT NULL
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
    "deletedAt" timestamp(3) without time zone
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
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Address" (id, "userId", label, street, number, apartment, neighborhood, city, province, "zipCode", latitude, longitude, "isDefault", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmn0pgw0n001g10epoytlshz2	cmn0pgw0k001d10epk4ld8bzq	Casa	San Mart├¡n 800	800	\N	\N	Ushuaia	Tierra del Fuego	9410	-54.8069	-68.304	f	2026-03-21 19:13:02.232	2026-03-21 21:46:30.553	2026-03-21 21:46:30.552
cmn0x52ux0002hrc6y19bcrq3	cmn0pgw0k001d10epk4ld8bzq	Mi Casa	Paseo de la Plaza	2065	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.82898400000001	-68.3487997	t	2026-03-21 22:47:48.153	2026-03-21 22:47:48.153	\N
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
-- Data for Name: CannedResponse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CannedResponse" (id, shortcut, title, content, category, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmn4xnvey0000sttbm9xg7rsv	/saludo	Buenos dias!	Hola! Me gustar├¡a saber en qu├⌐ te puedo ayudar el d├¡a de hoy?	general	0	t	2026-03-24 18:13:29.672	2026-03-24 18:13:29.672
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CartItem" (id, "userId", "productId", quantity, "variantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, slug, description, image, "isActive", "order", scope, "createdAt", "updatedAt", "allowIndividualPurchase", price, "starterPrice", "isStarter", "parentId", icon) FROM stdin;
cmn0pgvx2000210eppkm3lanu	Hamburguesas	hamburguesas	\N	\N	t	1	BOTH	2026-03-21 19:13:02.103	2026-03-21 19:13:02.103	t	0	\N	f	\N	\N
cmn0pgvxp000310epweimf78e	Sandwicher├¡a	sandwicheria	\N	\N	t	6	BOTH	2026-03-21 19:13:02.105	2026-03-21 19:13:02.105	t	0	\N	f	\N	\N
cmn0pgvxq000610eptmd45fc3	L├ícteos	lacteos	\N	\N	t	4	BOTH	2026-03-21 19:13:02.105	2026-03-21 19:13:02.105	t	0	\N	f	\N	\N
cmn0pgvxz000710ep5ija65pz	Almac├⌐n	almacen	\N	\N	t	8	BOTH	2026-03-21 19:13:02.105	2026-03-21 19:13:02.105	t	0	\N	f	\N	\N
cmn0pgvxq000510epgakpy194	Sushi	sushi	\N	\N	t	3	BOTH	2026-03-21 19:13:02.104	2026-03-21 19:13:02.104	t	0	\N	f	\N	\N
cmn0pgvxp000410ep0tb499uo	Pizzas	pizzas	\N	\N	t	2	BOTH	2026-03-21 19:13:02.104	2026-03-21 19:13:02.104	t	0	\N	f	\N	\N
cmn0pgvy8000910ep6n2j5gei	Limpieza	limpieza	\N	\N	t	9	BOTH	2026-03-21 19:13:02.105	2026-03-21 19:13:02.105	t	0	\N	f	\N	\N
cmn0pgvy9000a10epyhuiq9xv	Golosinas	golosinas	\N	\N	t	7	BOTH	2026-03-21 19:13:02.105	2026-03-21 19:13:02.105	t	0	\N	f	\N	\N
cmn0pgvy7000810eplzuozvpk	Bebidas	bebidas	\N	\N	t	5	BOTH	2026-03-21 19:13:02.105	2026-03-21 19:13:02.105	t	0	\N	f	\N	\N
\.


--
-- Data for Name: ConfigAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ConfigAuditLog" (id, "adminUserId", "adminEmail", "configType", "fieldChanged", "oldValue", "newValue", "createdAt") FROM stdin;
cmn6z7rz30000y236zdjy9hvr	cmn0pgvwf000010epggulhpgv	admin@somosmoovy.com	STORE_SETTINGS	timeouts	{"merchantConfirmTimeoutSec":300,"driverResponseTimeoutSec":60}	{"merchantConfirmTimeoutSec":300,"driverResponseTimeoutSec":20}	2026-03-26 04:32:30.303
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
-- Data for Name: DeliveryRate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryRate" (id, "categoryId", "basePriceArs", "pricePerKmArs", "isActive", "createdAt", "updatedAt") FROM stdin;
cmn4wezef000mksg2alnl4w0p	cmn4wezd6000gksg2psrgimig	300	80	t	2026-03-24 17:38:35.32	2026-03-24 17:38:35.32
cmn4wezf7000oksg23syf5dg8	cmn4wezdf000hksg20laifcy1	400	100	t	2026-03-24 17:38:35.347	2026-03-24 17:38:35.347
cmn4wezfg000qksg21u7uh21d	cmn4wezdk000iksg2n1zp0doj	600	130	t	2026-03-24 17:38:35.356	2026-03-24 17:38:35.356
cmn4wezfo000sksg2h850jmdb	cmn4wezdp000jksg2b1hvo5xg	900	180	t	2026-03-24 17:38:35.364	2026-03-24 17:38:35.364
cmn4wezfx000uksg2su5tk8ux	cmn4wezdy000kksg2vxilkxph	1500	250	t	2026-03-24 17:38:35.373	2026-03-24 17:38:35.373
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Driver" (id, "userId", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor", "licensePlate", cuit, "licenciaUrl", "seguroUrl", "vtvUrl", "dniFrenteUrl", "dniDorsoUrl", "acceptedTermsAt", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt", "availabilityStatus", "lastLocationAt", latitude, longitude, "approvalStatus", "approvedAt", "rejectionReason", ubicacion) FROM stdin;
cmn3zjqw7001ozbsr0yewc9iy	cmn3ze631001ezbsrowh7mtoj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	f	0	\N	2026-03-24 02:18:30.247	2026-03-25 02:42:37.709	DISPONIBLE	\N	\N	\N	APPROVED	2026-03-24 02:19:25.243	\N	\N
cmn0pgw0f001c10eplrwqp05q	cmn0pgw0c001910epgep8s9t9	MOTO	\N	\N	\N	\N	ABC 123	\N	\N	\N	\N	\N	\N	\N	t	t	0	\N	2026-03-21 19:13:02.223	2026-03-25 02:42:37.709	DISPONIBLE	2026-03-25 02:37:40.398	-54.83070319553021	-68.3504299084042	APPROVED	\N	\N	0101000020E6100000B90891716D1651C013BE787B546A4BC0
\.


--
-- Data for Name: DriverLocationHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DriverLocationHistory" (id, "driverId", "orderId", latitude, longitude, accuracy, speed, heading, "timestamp", "createdAt") FROM stdin;
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Favorite" (id, "userId", "merchantId", "productId", "listingId", "createdAt") FROM stdin;
\.


--
-- Data for Name: HeroSlide; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."HeroSlide" (id, title, subtitle, "buttonText", "buttonLink", gradient, image, "isActive", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Listing" (id, "sellerId", title, description, price, stock, condition, "weightKg", "lengthCm", "widthCm", "heightCm", "isActive", "categoryId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ListingImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ListingImage" (id, "listingId", url, "order") FROM stdin;
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "scheduleEnabled", "scheduleJson", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", cuit, "constanciaAfipUrl", "habilitacionMunicipalUrl", "registroSanitarioUrl", "acceptedTermsAt", "acceptedPrivacyAt", category, "ownerId", "createdAt", "updatedAt", rating, "adminNotes", "bankAccount", "businessName", "commissionRate", cuil, "displayOrder", "facebookUrl", "instagramUrl", "isPremium", "ownerBirthDate", "ownerDni", "premiumTier", "premiumUntil", "startedAt", "whatsappNumber", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "approvalStatus", "approvedAt", "rejectionReason", ubicacion, "loyaltyOrderCount", "loyaltyTier", "loyaltyUpdatedAt") FROM stdin;
cmn0pgvyn000e10ep68gshzgr	Burger Ushuaia	burger-ushuaia	Las mejores hamburguesas del fin del mundo	/uploads/products/1774366853111-IMG_0104.webp	\N	t	t	t	{"1":{"open":"09:00","close":"21:00"},"2":{"open":"09:00","close":"21:00"},"3":{"open":"09:00","close":"21:00"},"4":{"open":"09:00","close":"21:00"},"5":{"open":"09:00","close":"21:00"},"6":{"open":"10:00","close":"14:00"},"7":null}	t	comercio@somosmoovy.com	+54 9 2901 553173	Avenida San Mart├¡n 1100	-54.80848820000001	-68.31312	5	30	45	0	0	\N	\N	\N	\N	\N	\N	Restaurante	cmn0pgvyj000b10ep2u77j0im	2026-03-21 19:13:02.159	2026-03-24 15:40:57.507	\N	\N	\N	Burger Ushuaia	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	\N	\N	\N	0	BRONCE	2026-03-24 15:27:07.275
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
-- Data for Name: MerchantLoyaltyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantLoyaltyConfig" (id, tier, "minOrdersPerMonth", "commissionRate", "badgeText", "badgeColor", "benefitsJson", "displayOrder", "createdAt", "updatedAt") FROM stdin;
cmn7i6zs30006uu0l9f4uf96w	BRONCE	0	8	Comercio	gray	["Comisi├│n est├índar 8%","Soporte por chat"]	0	2026-03-26 13:23:46.468	2026-03-26 13:23:46.468
cmn7i6zsd0007uu0l17248co8	PLATA	50	7	Destacado	blue	["Comisi├│n reducida 7%","Soporte prioritario","Badge visible para compradores"]	1	2026-03-26 13:23:46.477	2026-03-26 13:23:46.477
cmn7i6zsh0008uu0laupc0yjp	ORO	150	6	Popular	yellow	["Comisi├│n reducida 6%","Soporte VIP","Posici├│n destacada en b├║squeda","Badge dorado"]	2	2026-03-26 13:23:46.482	2026-03-26 13:23:46.482
cmn7i6zsl0009uu0luo9a3nl6	DIAMANTE	300	5	Elite	purple	["Comisi├│n m├¡nima 5%","Account manager dedicado","Primera posici├│n en categor├¡a","Badge diamante","Acceso a analytics avanzados"]	3	2026-03-26 13:23:46.486	2026-03-26 13:23:46.486
\.


--
-- Data for Name: MoovyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MoovyConfig" (id, key, value, description, "updatedAt") FROM stdin;
cmn4wezad0006ksg23mz6csle	default_merchant_commission_pct	8	Comisi├│n MOOVY a comercios (%)	2026-03-24 17:38:35.174
cmn4wezas0007ksg20u94vytk	default_seller_commission_pct	12	Comisi├│n MOOVY a vendedores marketplace (%)	2026-03-24 17:38:35.188
cmn4wezb40008ksg2q4n387jm	merchant_confirm_timeout_seconds	300	Timeout para que el comercio confirme (seg)	2026-03-24 17:38:35.201
cmn4wezbm000aksg2qib6qsv6	max_assignment_attempts	5	M├íximo intentos de asignaci├│n de driver	2026-03-24 17:38:35.219
cmn4wezbx000bksg2osovdnhr	points_per_dollar	1	Puntos por peso gastado	2026-03-24 17:38:35.229
cmn4wezc3000cksg215to5497	signup_bonus	100	Puntos bonus por registro	2026-03-24 17:38:35.235
cmn4wezc8000dksg2pboi5hok	referral_bonus	200	Puntos bonus por referir	2026-03-24 17:38:35.241
cmn4wezcj000eksg2d5sm5nf5	min_points_to_redeem	100	M├¡nimo de puntos para canjear	2026-03-24 17:38:35.251
cmn4wezcr000fksg2bfs99ysr	max_discount_percent	50	M├íximo % de descuento con puntos	2026-03-24 17:38:35.259
cmn3orj5z000dchpmq27gbwcg	hero_title	Todo Ushuaia en\ntu puerta.	Hero config: hero_title	2026-03-23 21:23:34.256
cmn3orj6r000ichpm55ki2vg0	hero_bg_image		Hero config: hero_bg_image	2026-03-23 21:23:34.257
cmn7i6zmn0000uu0l37f9vav0	assignment_rating_radius_meters	3000	Radio (metros) dentro del cual se priorizan repartidores por rating en el assignment engine	2026-03-26 13:23:46.272
cmn7i6zov0001uu0lp9mdq3c2	max_delivery_distance_km	15	Distancia m├íxima en km entre comercio y cliente para aceptar delivery	2026-03-26 13:23:46.351
cmn7i6zph0002uu0lpv2pzn5p	min_order_amount_ars	1000	Monto m├¡nimo del carrito para poder hacer delivery	2026-03-26 13:23:46.373
cmn7i6zqg0003uu0l908petb2	scheduled_notify_before_minutes	30	Minutos antes de la hora programada para notificar al repartidor	2026-03-26 13:23:46.409
cmn7i6zqs0004uu0lxwhimxhg	scheduled_cancel_if_no_confirm_minutes	30	Minutos sin confirmaci├│n del comercio antes de cancelar pedido programado	2026-03-26 13:23:46.42
cmn4wezbb0009ksg2n7f4yq87	driver_response_timeout_seconds	20	Timeout para que el driver acepte oferta (seg)	2026-03-26 13:23:46.447
cmn3orj62000gchpm32q25rh1	hero_bg_gradient	linear-gradient(135deg, #a3000c 0%, #cc000f 25%, #e60012 50%, #ff1a2e 75%, #ff4d5e 100%)	Hero config: hero_bg_gradient	2026-03-23 21:23:34.257
cmn3orj74000lchpmmqwecfzj	hero_search_placeholder	┬┐Qu├⌐ quer├⌐s pedir?	Hero config: hero_search_placeholder	2026-03-23 21:23:34.26
cmn3orj75000mchpmr5d5gokq	hero_cta_link		Hero config: hero_cta_link	2026-03-23 21:23:34.258
cmn3orj68000hchpmq46fjq75	hero_search_enabled	true	Hero config: hero_search_enabled	2026-03-23 21:23:34.258
cmn3orj5z000echpmpvn0k1va	hero_subtitle	Pedidos de comercios locales en minutos	Hero config: hero_subtitle	2026-03-23 21:23:34.257
cmn3orj74000kchpmanzdivm4	hero_cta_text		Hero config: hero_cta_text	2026-03-23 21:23:34.257
cmn3orj61000fchpm0f470r1t	hero_bg_color	#e60012	Hero config: hero_bg_color	2026-03-23 21:23:34.257
cmn3orj70000jchpm8yciazdd	hero_person_image	/hero-person.png	Hero config: hero_person_image	2026-03-23 21:23:34.261
\.


--
-- Data for Name: MpWebhookLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MpWebhookLog" (id, "eventId", "eventType", "resourceId", processed, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "isPickup", "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveryStatus", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt", "cancelReason", "commissionPaid", "driverRating", "merchantPayout", "moovyCommission", "ratedAt", "ratingComment", "merchantRating", "merchantRatingComment", "sellerRating", "sellerRatingComment", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "lastAssignmentAt", "pendingDriverId", "deletedAt", "mpPreferenceId", "mpPaymentId", "mpMerchantOrderId", "mpStatus", "paidAt", "isMultiVendor", "deliveryType", "scheduledSlotStart", "scheduledSlotEnd", "scheduledConfirmedAt", "couponCode") FROM stdin;
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
cmn4wezd6000gksg2psrgimig	MICRO	500	20	15	10	1	{BIKE,MOTO,CAR,TRUCK}	t	1	2026-03-24 17:38:35.275	2026-03-24 17:38:35.275
cmn4wezdf000hksg20laifcy1	SMALL	2000	35	25	20	3	{BIKE,MOTO,CAR,TRUCK}	t	2	2026-03-24 17:38:35.284	2026-03-24 17:38:35.284
cmn4wezdk000iksg2n1zp0doj	MEDIUM	5000	50	40	30	6	{MOTO,CAR,TRUCK}	t	3	2026-03-24 17:38:35.288	2026-03-24 17:38:35.288
cmn4wezdp000jksg2b1hvo5xg	LARGE	15000	80	60	50	10	{CAR,TRUCK}	t	4	2026-03-24 17:38:35.294	2026-03-24 17:38:35.294
cmn4wezdy000kksg2vxilkxph	XL	50000	120	80	80	20	{TRUCK}	t	5	2026-03-24 17:38:35.302	2026-03-24 17:38:35.302
\.


--
-- Data for Name: PackagePricingTier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PackagePricingTier" (id, name, "minItems", "maxItems", "pricePerItem", "totalPrice", "isActive", "order", "createdAt") FROM stdin;
cmn4wezgb000vksg2u43ebewy	Pack x10	1	10	150	1500	t	1	2026-03-24 17:38:35.388
cmn4wezgn000wksg2wrxjr8pa	Pack x25	11	25	120	3000	t	2	2026-03-24 17:38:35.399
cmn4wezgw000xksg20604d5ii	Pack x50	26	50	90	4500	t	3	2026-03-24 17:38:35.408
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
-- Data for Name: PendingAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PendingAssignment" (id, "orderId", "currentDriverId", "attemptNumber", "expiresAt", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PointsConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsConfig" (id, "pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus", "reviewBonus", "pointsExpireDays", "updatedAt", "minPurchaseForBonus", "minReferralPurchase", "refereeBonus", "tierConfigJson", "tierWindowDays") FROM stdin;
points_config	1	0	0.01	100	50	100	200	10	\N	2026-03-24 17:38:35.163	5000	8000	100	\N	90
\.


--
-- Data for Name: PointsTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsTransaction" (id, "userId", "orderId", type, amount, "balanceAfter", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "createdAt", "updatedAt", "packageCategoryId") FROM stdin;
cmn0pgvza000m10epvgzb32xp	Hamburguesa Doble	burger-ushuaia-hamburguesa-doble	\N	cmn0pgvyn000e10ep68gshzgr	7500	4500	100	5	t	f	2026-03-21 19:13:02.182	2026-03-21 19:13:02.182	\N
cmn0pgvzk000s10epio10nlg1	Hamburguesa Veggie	burger-ushuaia-hamburguesa-veggie	\N	cmn0pgvyn000e10ep68gshzgr	5000	3000	100	5	t	f	2026-03-21 19:13:02.193	2026-03-21 19:13:02.193	\N
cmn0pgvzv000y10eput4tyvyz	Papas Fritas	burger-ushuaia-papas-fritas	\N	cmn0pgvyn000e10ep68gshzgr	2500	1500	100	5	t	f	2026-03-21 19:13:02.204	2026-03-21 19:13:02.204	\N
cmn0pgw03001410eptx02ubzu	Coca Cola 500ml	burger-ushuaia-coca-cola-500ml	\N	cmn0pgvyn000e10ep68gshzgr	1500	900	92	5	t	f	2026-03-21 19:13:02.212	2026-03-24 15:44:36.791	\N
cmn0pgvyw000g10epjrpq4iu1	Hamburguesa Cl├ísica	burger-ushuaia-hamburguesa-cl├ísica	\N	cmn0pgvyn000e10ep68gshzgr	5500	3300	86	5	t	f	2026-03-21 19:13:02.168	2026-03-24 17:42:02.233	\N
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, "productId", "categoryId") FROM stdin;
cmn0pgvz6000k10epn02jwqjk	cmn0pgvyw000g10epjrpq4iu1	cmn0pgvx2000210eppkm3lanu
cmn0pgvzh000q10ephh0mgczw	cmn0pgvza000m10epvgzb32xp	cmn0pgvx2000210eppkm3lanu
cmn0pgvzs000w10epjd4lgpst	cmn0pgvzk000s10epio10nlg1	cmn0pgvx2000210eppkm3lanu
cmn0pgw01001210ep03tyebv9	cmn0pgvzv000y10eput4tyvyz	cmn0pgvx2000210eppkm3lanu
cmn0pgw08001810epmbpi8dwj	cmn0pgw03001410eptx02ubzu	cmn0pgvy7000810eplzuozvpk
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductImage" (id, "productId", url, alt, "order") FROM stdin;
cmn0pgvz1000i10epml58m129	cmn0pgvyw000g10epjrpq4iu1	https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400	Hamburguesa Cl├ísica	0
cmn0pgvze000o10epqz2wr4s9	cmn0pgvza000m10epvgzb32xp	https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400	Hamburguesa Doble	0
cmn0pgvzo000u10ep6ondlcsl	cmn0pgvzk000s10epio10nlg1	https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400	Hamburguesa Veggie	0
cmn0pgvzy001010ep52figxk0	cmn0pgvzv000y10eput4tyvyz	https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400	Papas Fritas	0
cmn0pgw06001610ep9ou0hpb8	cmn0pgw03001410eptx02ubzu	https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400	Coca Cola 500ml	0
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
-- Data for Name: SellerAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerAvailability" (id, "sellerId", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SellerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerProfile" (id, "userId", "displayName", bio, avatar, cuit, "acceptedTermsAt", "bankAlias", "bankCbu", "isActive", "isVerified", "totalSales", rating, "commissionRate", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
cmn3zgcd9001lzbsrud87doc7	cmn3ze631001ezbsrowh7mtoj	Alnaar	Comida Arabe	\N	875cb53fda6a4f4cf855bf953ad4a301:df41fa07f8fc79a1fee3643b8f76ed2a:362f09b9db2712779990e9b265	2026-03-24 02:15:51.283	\N	\N	t	f	0	\N	12	\N	\N	\N	\N	\N	f	\N	2026-03-24 02:15:51.453	2026-03-24 02:17:14.676
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "isMaintenanceMode", "maintenanceMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt", "promoPopupButtonText", "promoPopupDismissable", "promoPopupEnabled", "promoPopupImage", "promoPopupLink", "promoPopupMessage", "promoPopupTitle", "showComerciosCard", "showRepartidoresCard", "tiendaMaintenance", "maxCategoriesHome", "heroSliderEnabled", "heroSliderInterval", "promoBannerButtonLink", "promoBannerButtonText", "promoBannerEnabled", "promoBannerImage", "promoBannerSubtitle", "promoBannerTitle", "riderCommissionPercent", "activeClimateCondition", "cashLimitL1", "cashLimitL2", "cashLimitL3", "cashMpOnlyDeliveries", "climateMultipliersJson", "defaultMerchantCommission", "defaultSellerCommission", "driverResponseTimeoutSec", "maxAnticipationHours", "maxOrdersPerSlot", "merchantConfirmTimeoutSec", "minAnticipationHours", "operatingHoursEnd", "operatingHoursStart", "operationalCostPercent", "slotDurationMinutes", "zoneMultipliersJson") FROM stdin;
settings	t	Estamos cerrados. ??Volvemos pronto!	f	??Volvemos pronto! Estamos trabajando para mejorar tu experiencia.	1200	0.06	500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-03-26 04:32:30.289	Ver m??s	t	f	\N	\N	\N	\N	t	t	f	10	t	5000	/productos?categoria=pizzas	Ver locales	t	\N	2x1 en locales seleccionados de 20hs a 23hs.	Noches de\nPizza & Pelis	80	normal	15000	25000	40000	10	{"normal":1.0,"lluvia":1.10,"nieve":1.15,"extremo":1.25}	8	12	20	48	15	300	1.5	22:00	09:00	5	120	{"ZONA_A":1.0,"ZONA_B":1.15,"ZONA_C":1.35}
\.


--
-- Data for Name: SubOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubOrder" (id, "orderId", "merchantId", "sellerId", status, subtotal, "deliveryFee", discount, total, "driverId", "moovyCommission", "sellerPayout", "paymentStatus", "deliveryStatus", "deliveredAt", "deliveryPhoto", "driverRating", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "pendingDriverId", "createdAt", "updatedAt", "mpTransferId", "payoutStatus", "paidOutAt") FROM stdin;
\.


--
-- Data for Name: SupportChat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportChat" (id, "userId", "merchantId", subject, status, "lastMessageAt", "createdAt", "updatedAt", category, "operatorId", priority, rating, "ratingComment", "resolvedAt") FROM stdin;
cmn3kmggj0007bf229jkw823k	cmn0pgw0k001d10epk4ld8bzq	\N	Consulta desde widget	closed	2026-03-23 19:21:22.946	2026-03-23 19:20:42.451	2026-03-23 20:05:28.941	pedido	cmn3k7fvw0005bf22o0gkd4tn	normal	3	\N	2026-03-23 19:24:30.564
cmn3m8e6m0001b4xf6yo3edij	cmn0pgw0k001d10epk4ld8bzq	\N	No me llegan los puntos	active	2026-03-23 20:05:45.546	2026-03-23 20:05:45.546	2026-03-23 20:05:45.546	cuenta	cmn3k7fvw0005bf22o0gkd4tn	normal	\N	\N	\N
cmn3nbm280001frplbehbon0n	cmn0pgw0k001d10epk4ld8bzq	\N	Hola!	active	2026-03-23 20:36:15.344	2026-03-23 20:36:15.344	2026-03-23 20:36:15.344	otro	cmn3k7fvw0005bf22o0gkd4tn	normal	\N	\N	\N
cmn3o8ldz0001chpm1a3y4mp5	cmn0pgw0k001d10epk4ld8bzq	\N	No puedo ingresar	active	2026-03-23 21:08:30.94	2026-03-23 21:01:54.115	2026-03-23 21:08:30.942	cuenta	cmn3k7fvw0005bf22o0gkd4tn	normal	\N	\N	\N
cmn3ykajy0007zbsrdtl9x17t	cmn0pgw0k001d10epk4ld8bzq	\N	No se acredit├│ mi pago	closed	2026-03-24 01:51:30.396	2026-03-24 01:50:56.11	2026-03-24 01:52:10.048	pago	cmn3ygv4h0005zbsr2dc8l62s	normal	5	\N	2026-03-24 01:51:51.883
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportMessage" (id, "chatId", "senderId", content, "isFromAdmin", "isRead", "createdAt", "attachmentType", "attachmentUrl", "isSystem") FROM stdin;
cmn3kmggj0009bf2225jl0a9v	cmn3kmggj0007bf229jkw823k	cmn0pgw0k001d10epk4ld8bzq	No ha llegado mi pedido a├║n	f	f	2026-03-23 19:20:42.451	\N	\N	f
cmn3knbpx000bbf22hsrt31lq	cmn3kmggj0007bf229jkw823k	cmn3k7fv40001bf2215pyris2	Maria (Zona PIipo) se uni├│ al chat	t	f	2026-03-23 19:21:22.966	\N	\N	t
cmn3knbq7000dbf22d5s6svbm	cmn3kmggj0007bf229jkw823k	cmn3k7fv40001bf2215pyris2	Maria (Zona PIipo) se uni├│ al chat	t	f	2026-03-23 19:21:22.976	\N	\N	t
cmn3m8e6m0004b4xf8v5tm3hn	cmn3m8e6m0001b4xf6yo3edij	cmn3k7fv40001bf2215pyris2	Maria (Zona PIipo) es tu operador asignado. En un momento te atiende, Cliente Demo.	t	f	2026-03-23 20:05:45.546	\N	\N	t
cmn3m8e6m0003b4xf4iv1qklb	cmn3m8e6m0001b4xf6yo3edij	cmn0pgw0k001d10epk4ld8bzq	No me llegan los puntos	f	t	2026-03-23 20:05:45.546	\N	\N	f
cmn3nbm280003frpljgmwuomn	cmn3nbm280001frplbehbon0n	cmn0pgw0k001d10epk4ld8bzq	Hola!	f	t	2026-03-23 20:36:15.344	\N	\N	f
cmn3o8ldz0004chpmprcf9cel	cmn3o8ldz0001chpm1a3y4mp5	cmn3k7fv40001bf2215pyris2	Maria (Zona PIipo) es tu operador asignado. En un momento te atiende, Cliente Demo.	t	t	2026-03-23 21:01:54.115	\N	\N	t
cmn3o8ldz0003chpmw6102el3	cmn3o8ldz0001chpm1a3y4mp5	cmn0pgw0k001d10epk4ld8bzq	No puedo ingresar	f	t	2026-03-23 21:01:54.115	\N	\N	f
cmn3oea2b0006chpms1wcdbww	cmn3o8ldz0001chpm1a3y4mp5	cmn3k7fv40001bf2215pyris2	Buenas tardes! Dejame hacer un refresh de tu contrase├▒a, te llegara al mail un correo	t	t	2026-03-23 21:06:19.379	\N	\N	f
cmn3oeqck0008chpmwbvc5n6o	cmn3o8ldz0001chpm1a3y4mp5	cmn0pgw0k001d10epk4ld8bzq	Graciassssss	f	t	2026-03-23 21:06:40.484	\N	\N	f
cmn3oezcr000achpm32gzevoj	cmn3o8ldz0001chpm1a3y4mp5	cmn3k7fv40001bf2215pyris2	No hay por qu├⌐! :)	t	t	2026-03-23 21:06:52.155	\N	\N	f
cmn3oh3ke000cchpmf5yxm906	cmn3o8ldz0001chpm1a3y4mp5	cmn0pgw0k001d10epk4ld8bzq	Hola	f	t	2026-03-23 21:08:30.927	\N	\N	f
cmn3ykajy000azbsrg0mnanvy	cmn3ykajy0007zbsrdtl9x17t	cmn3ygv3u0001zbsr6lkzqkuc	Iyad es tu operador asignado. En un momento te atiende, Cliente Demo.	t	t	2026-03-24 01:50:56.11	\N	\N	t
cmn3ykajy0009zbsrrs8pg1sh	cmn3ykajy0007zbsrdtl9x17t	cmn0pgw0k001d10epk4ld8bzq	No se acredit├│ mi pago	f	t	2026-03-24 01:50:56.11	\N	\N	f
cmn3ykrqm000czbsr4oj78n60	cmn3ykajy0007zbsrdtl9x17t	cmn3ygv3u0001zbsr6lkzqkuc	Hola mi amor hermoso	t	t	2026-03-24 01:51:18.382	\N	\N	f
cmn3yl0zy000ezbsriheaaui2	cmn3ykajy0007zbsrdtl9x17t	cmn0pgw0k001d10epk4ld8bzq	Hola!!	f	t	2026-03-24 01:51:30.382	\N	\N	f
cmn3nbm280004frpleka1za7f	cmn3nbm280001frplbehbon0n	cmn3k7fv40001bf2215pyris2	Maria (Zona PIipo) es tu operador asignado. En un momento te atiende, Cliente Demo.	t	t	2026-03-23 20:36:15.344	\N	\N	t
\.


--
-- Data for Name: SupportOperator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SupportOperator" (id, "userId", "displayName", "isActive", "isOnline", "maxChats", "lastSeenAt", "createdAt", "updatedAt") FROM stdin;
cmn3k7fvw0005bf22o0gkd4tn	cmn3k7fv40001bf2215pyris2	Maria (Zona PIipo)	t	t	5	2026-03-24 01:50:41.413	2026-03-23 19:09:01.869	2026-03-24 01:50:41.414
cmn3ygv4h0005zbsr2dc8l62s	cmn3ygv3u0001zbsr6lkzqkuc	Iyad	f	t	5	2026-03-24 01:50:39.641	2026-03-24 01:48:16.145	2026-03-24 18:12:31.367
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "privacyConsentAt", "termsConsentAt", "resetToken", "resetTokenExpiry", "deletedAt") FROM stdin;
cmn3ygv3u0001zbsr6lkzqkuc	operador1@somosmoovy.com	$2b$12$reuthjkxq7jyo4yYNq9d2u4UxgjRofmA0KSjtkbPHl2P/TnllD3YK	Iyad	\N	\N	\N	USER	\N	\N	100	0	f	cmn3ygv3u0002zbsrws7tm8hw	\N	2026-03-24 01:48:16.121	2026-03-25 02:42:37.722	\N	\N	\N	\N	\N
cmn0pgw0c001910epgep8s9t9	rider@somosmoovy.com	$2b$10$gBEkHwLXfAgtK0R/oYWyreYgviqXgw8AvoVc/loShLtT8IBPyjeke	Repartidor Demo	\N	\N	\N	DRIVER	\N	\N	100	0	f	cmn0pgw0c001a10epkob0eve5	\N	2026-03-21 19:13:02.22	2026-03-25 02:42:37.722	\N	\N	\N	\N	\N
cmn3ze631001ezbsrowh7mtoj	ing.iyad@gmail.com	$2b$10$pX0fMhcAPjBmVUNVZnb1UOaHR3MAIpi8Rm8XakM5wcuO1IB18gMCW	Iyad Marmoud	Iyad	Marmoud	+54 2901611605	USER	\N	\N	100	100	f	MOV-E2HN	\N	2026-03-24 02:14:09.997	2026-03-25 02:42:37.722	2026-03-24 02:14:09.995	2026-03-24 02:14:09.995	\N	\N	\N
cmn3k7fv40001bf2215pyris2	operador@somosmoovy.com	$2b$12$JnfS1fQnAh3DsUsvCfBpa.DtAtsqtrr6qoR0TkH3bfTYjCzhHzBry	Maria (Zona PIipo)	\N	\N	\N	USER	\N	\N	100	0	f	cmn3k7fv40002bf22tjmab0w5	\N	2026-03-23 19:09:01.839	2026-03-25 02:42:37.722	\N	\N	\N	\N	\N
cmn0pgvyj000b10ep2u77j0im	comercio@somosmoovy.com	$2b$10$gBEkHwLXfAgtK0R/oYWyreYgviqXgw8AvoVc/loShLtT8IBPyjeke	 				MERCHANT	\N	\N	100	0	f	cmn0pgvyj000c10epqzsa56vh	\N	2026-03-21 19:13:02.155	2026-03-25 02:42:37.722	\N	\N	\N	\N	\N
cmn4wez9a0000ksg2w5985ob8	somosmoovy@gmail.com	$2b$12$lEuq.hpPc91y/1X.O0.OXOwR4ghQTBqMujO3u.Z5Zktkue/zjIoPe	Admin MOOVY	\N	\N	\N	ADMIN	\N	\N	100	0	f	cmn4wez9a0001ksg2tfo8lqe0	\N	2026-03-24 17:38:35.135	2026-03-25 02:42:37.722	\N	\N	\N	\N	\N
cmn0pgw0k001d10epk4ld8bzq	cliente@somosmoovy.com	$2b$10$gBEkHwLXfAgtK0R/oYWyreYgviqXgw8AvoVc/loShLtT8IBPyjeke	Cliente Demo	\N	\N	\N	CLIENT	\N	\N	100	0	t	cmn0pgw0k001e10epwb1kkkyf	\N	2026-03-21 19:13:02.228	2026-03-25 02:42:37.722	\N	\N	\N	\N	\N
cmn0pgvwf000010epggulhpgv	admin@somosmoovy.com	$2b$10$gBEkHwLXfAgtK0R/oYWyreYgviqXgw8AvoVc/loShLtT8IBPyjeke	Admin MOOVY	\N	\N	\N	ADMIN	\N	\N	100	0	f	cmn0pgvwf000110epi5mbqxxu	\N	2026-03-21 19:13:02.079	2026-03-25 11:40:22.707	\N	\N	\N	\N	\N
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" (id, "userId", role, "isActive", "activatedAt") FROM stdin;
cmn3k7fv40003bf22l0grudqe	cmn3k7fv40001bf2215pyris2	ADMIN	t	2026-03-23 19:09:01.839
cmn3ygv3u0003zbsrkk0b3aai	cmn3ygv3u0001zbsr6lkzqkuc	ADMIN	t	2026-03-24 01:48:16.121
cmn3ze636001gzbsr49b7datz	cmn3ze631001ezbsrowh7mtoj	USER	t	2026-03-24 02:14:10.002
cmn3zgc8d001jzbsr3h6at1h2	cmn3ze631001ezbsrowh7mtoj	SELLER	t	2026-03-24 02:15:51.277
cmn3zjqwd001qzbsr5vnskd8m	cmn3ze631001ezbsrowh7mtoj	DRIVER	t	2026-03-24 02:18:30.254
cmn4wez9i0003ksg2kpsr0npy	cmn4wez9a0000ksg2w5985ob8	ADMIN	t	2026-03-24 17:38:35.142
cmn4wez9o0005ksg2sp9047d9	cmn4wez9a0000ksg2w5985ob8	USER	t	2026-03-24 17:38:35.148
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
-- Name: DeliveryRate DeliveryRate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryRate"
    ADD CONSTRAINT "DeliveryRate_pkey" PRIMARY KEY (id);


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
-- Name: SupportOperator SupportOperator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SupportOperator"
    ADD CONSTRAINT "SupportOperator_pkey" PRIMARY KEY (id);


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
-- Name: DeliveryRate_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeliveryRate_categoryId_key" ON public."DeliveryRate" USING btree ("categoryId");


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
-- Name: Driver_approvalStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Driver_approvalStatus_idx" ON public."Driver" USING btree ("approvalStatus");


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
-- Name: MerchantLoyaltyConfig_tier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MerchantLoyaltyConfig_tier_idx" ON public."MerchantLoyaltyConfig" USING btree (tier);


--
-- Name: MerchantLoyaltyConfig_tier_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MerchantLoyaltyConfig_tier_key" ON public."MerchantLoyaltyConfig" USING btree (tier);


--
-- Name: Merchant_approvalStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_approvalStatus_idx" ON public."Merchant" USING btree ("approvalStatus");


--
-- Name: Merchant_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Merchant_isActive_idx" ON public."Merchant" USING btree ("isActive");


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
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: Order_paymentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_paymentStatus_idx" ON public."Order" USING btree ("paymentStatus");


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
-- Name: DeliveryRate DeliveryRate_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryRate"
    ADD CONSTRAINT "DeliveryRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."PackageCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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


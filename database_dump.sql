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
ALTER TABLE IF EXISTS ONLY public."UserActivityLog" DROP CONSTRAINT IF EXISTS "UserActivityLog_userId_fkey";
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
ALTER TABLE IF EXISTS ONLY public."MerchantDocumentChangeRequest" DROP CONSTRAINT IF EXISTS "MerchantDocumentChangeRequest_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Listing" DROP CONSTRAINT IF EXISTS "Listing_sellerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Listing" DROP CONSTRAINT IF EXISTS "Listing_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."ListingImage" DROP CONSTRAINT IF EXISTS "ListingImage_listingId_fkey";
ALTER TABLE IF EXISTS ONLY public."HomeCategorySlot" DROP CONSTRAINT IF EXISTS "HomeCategorySlot_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_listingId_fkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DriverLocationHistory" DROP CONSTRAINT IF EXISTS "DriverLocationHistory_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."DriverLocationHistory" DROP CONSTRAINT IF EXISTS "DriverLocationHistory_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."DriverAvailabilitySubscription" DROP CONSTRAINT IF EXISTS "DriverAvailabilitySubscription_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."DriverAvailabilitySubscription" DROP CONSTRAINT IF EXISTS "DriverAvailabilitySubscription_merchantId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryRate" DROP CONSTRAINT IF EXISTS "DeliveryRate_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryAttempt" DROP CONSTRAINT IF EXISTS "DeliveryAttempt_subOrderId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryAttempt" DROP CONSTRAINT IF EXISTS "DeliveryAttempt_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryAttempt" DROP CONSTRAINT IF EXISTS "DeliveryAttempt_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_couponId_fkey";
ALTER TABLE IF EXISTS ONLY public."ConsentLog" DROP CONSTRAINT IF EXISTS "ConsentLog_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Bid" DROP CONSTRAINT IF EXISTS "Bid_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Bid" DROP CONSTRAINT IF EXISTS "Bid_listingId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."AssignmentLog" DROP CONSTRAINT IF EXISTS "AssignmentLog_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."AssignmentLog" DROP CONSTRAINT IF EXISTS "AssignmentLog_driverId_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."AdPlacement" DROP CONSTRAINT IF EXISTS "AdPlacement_merchantId_fkey";
DROP INDEX IF EXISTS public."User_referralCode_key";
DROP INDEX IF EXISTS public."User_isSuspended_idx";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."User_archivedAt_idx";
DROP INDEX IF EXISTS public."UserRole_userId_role_key";
DROP INDEX IF EXISTS public."UserRole_userId_idx";
DROP INDEX IF EXISTS public."UserActivityLog_userId_createdAt_idx";
DROP INDEX IF EXISTS public."UserActivityLog_entityType_entityId_idx";
DROP INDEX IF EXISTS public."UserActivityLog_createdAt_idx";
DROP INDEX IF EXISTS public."UserActivityLog_action_idx";
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
DROP INDEX IF EXISTS public."SubOrder_orderId_idx";
DROP INDEX IF EXISTS public."SubOrder_merchantId_idx";
DROP INDEX IF EXISTS public."SubOrder_driverId_idx";
DROP INDEX IF EXISTS public."SellerProfile_userId_key";
DROP INDEX IF EXISTS public."SellerProfile_mpUserId_key";
DROP INDEX IF EXISTS public."SellerProfile_isSuspended_idx";
DROP INDEX IF EXISTS public."SellerAvailability_sellerId_key";
DROP INDEX IF EXISTS public."SavedCart_userId_key";
DROP INDEX IF EXISTS public."SavedCart_updatedAt_idx";
DROP INDEX IF EXISTS public."Referral_refereeId_key";
DROP INDEX IF EXISTS public."PushSubscription_userId_idx";
DROP INDEX IF EXISTS public."PushSubscription_endpoint_key";
DROP INDEX IF EXISTS public."Product_slug_key";
DROP INDEX IF EXISTS public."Product_merchantId_idx";
DROP INDEX IF EXISTS public."Product_deletedAt_idx";
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
DROP INDEX IF EXISTS public."Merchant_isSuspended_idx";
DROP INDEX IF EXISTS public."Merchant_isActive_idx";
DROP INDEX IF EXISTS public."Merchant_approvalStatus_idx";
DROP INDEX IF EXISTS public."MerchantLoyaltyConfig_tier_key";
DROP INDEX IF EXISTS public."MerchantLoyaltyConfig_tier_idx";
DROP INDEX IF EXISTS public."MerchantDocumentChangeRequest_status_createdAt_idx";
DROP INDEX IF EXISTS public."MerchantDocumentChangeRequest_merchantId_status_idx";
DROP INDEX IF EXISTS public."MerchantCategory_merchantId_categoryId_key";
DROP INDEX IF EXISTS public."MerchantAcquiredProduct_merchantId_productId_key";
DROP INDEX IF EXISTS public."Listing_sellerId_idx";
DROP INDEX IF EXISTS public."Listing_listingType_idx";
DROP INDEX IF EXISTS public."Listing_isActive_idx";
DROP INDEX IF EXISTS public."Listing_deletedAt_idx";
DROP INDEX IF EXISTS public."Listing_categoryId_idx";
DROP INDEX IF EXISTS public."Listing_auctionStatus_idx";
DROP INDEX IF EXISTS public."Listing_auctionEndsAt_idx";
DROP INDEX IF EXISTS public."HomeCategorySlot_order_idx";
DROP INDEX IF EXISTS public."HomeCategorySlot_categoryId_key";
DROP INDEX IF EXISTS public."Favorite_userId_productId_key";
DROP INDEX IF EXISTS public."Favorite_userId_merchantId_key";
DROP INDEX IF EXISTS public."Favorite_userId_listingId_key";
DROP INDEX IF EXISTS public."Favorite_userId_idx";
DROP INDEX IF EXISTS public."Driver_userId_key";
DROP INDEX IF EXISTS public."Driver_isSuspended_idx";
DROP INDEX IF EXISTS public."Driver_isOnline_idx";
DROP INDEX IF EXISTS public."Driver_isActive_idx";
DROP INDEX IF EXISTS public."Driver_fraudScore_idx";
DROP INDEX IF EXISTS public."Driver_approvalStatus_idx";
DROP INDEX IF EXISTS public."DriverLocationHistory_timestamp_idx";
DROP INDEX IF EXISTS public."DriverLocationHistory_orderId_createdAt_idx";
DROP INDEX IF EXISTS public."DriverLocationHistory_driverId_createdAt_idx";
DROP INDEX IF EXISTS public."DriverAvailabilitySubscription_userId_idx";
DROP INDEX IF EXISTS public."DriverAvailabilitySubscription_notifiedAt_expiresAt_idx";
DROP INDEX IF EXISTS public."DriverAvailabilitySubscription_merchantId_idx";
DROP INDEX IF EXISTS public."DeliveryRate_categoryId_key";
DROP INDEX IF EXISTS public."DeliveryAttempt_subOrderId_idx";
DROP INDEX IF EXISTS public."DeliveryAttempt_startedAt_idx";
DROP INDEX IF EXISTS public."DeliveryAttempt_reason_idx";
DROP INDEX IF EXISTS public."DeliveryAttempt_orderId_idx";
DROP INDEX IF EXISTS public."DeliveryAttempt_driverId_idx";
DROP INDEX IF EXISTS public."CronRunLog_jobName_success_completedAt_idx";
DROP INDEX IF EXISTS public."CronRunLog_jobName_startedAt_idx";
DROP INDEX IF EXISTS public."Coupon_isActive_idx";
DROP INDEX IF EXISTS public."Coupon_code_key";
DROP INDEX IF EXISTS public."Coupon_code_idx";
DROP INDEX IF EXISTS public."CouponUsage_userId_idx";
DROP INDEX IF EXISTS public."CouponUsage_couponId_idx";
DROP INDEX IF EXISTS public."ConsentLog_userId_consentType_idx";
DROP INDEX IF EXISTS public."ConsentLog_acceptedAt_idx";
DROP INDEX IF EXISTS public."ConfigAuditLog_configType_createdAt_idx";
DROP INDEX IF EXISTS public."ConfigAuditLog_adminUserId_idx";
DROP INDEX IF EXISTS public."Category_slug_key";
DROP INDEX IF EXISTS public."Category_name_key";
DROP INDEX IF EXISTS public."CartItem_userId_productId_variantId_key";
DROP INDEX IF EXISTS public."CannedResponse_shortcut_key";
DROP INDEX IF EXISTS public."CannedResponse_isActive_idx";
DROP INDEX IF EXISTS public."CannedResponse_category_idx";
DROP INDEX IF EXISTS public."Bid_userId_idx";
DROP INDEX IF EXISTS public."Bid_listingId_amount_idx";
DROP INDEX IF EXISTS public."AuditLog_userId_idx";
DROP INDEX IF EXISTS public."AuditLog_entityType_entityId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
DROP INDEX IF EXISTS public."AssignmentLog_orderId_idx";
DROP INDEX IF EXISTS public."AssignmentLog_notifiedAt_idx";
DROP INDEX IF EXISTS public."AssignmentLog_driverId_idx";
DROP INDEX IF EXISTS public."AdPlacement_type_idx";
DROP INDEX IF EXISTS public."AdPlacement_status_idx";
DROP INDEX IF EXISTS public."AdPlacement_paymentStatus_idx";
DROP INDEX IF EXISTS public."AdPlacement_mpExternalRef_key";
DROP INDEX IF EXISTS public."AdPlacement_merchantId_idx";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."UserRole" DROP CONSTRAINT IF EXISTS "UserRole_pkey";
ALTER TABLE IF EXISTS ONLY public."UserActivityLog" DROP CONSTRAINT IF EXISTS "UserActivityLog_pkey";
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
ALTER TABLE IF EXISTS ONLY public."MerchantDocumentChangeRequest" DROP CONSTRAINT IF EXISTS "MerchantDocumentChangeRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantCategory" DROP CONSTRAINT IF EXISTS "MerchantCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."MerchantAcquiredProduct" DROP CONSTRAINT IF EXISTS "MerchantAcquiredProduct_pkey";
ALTER TABLE IF EXISTS ONLY public."Listing" DROP CONSTRAINT IF EXISTS "Listing_pkey";
ALTER TABLE IF EXISTS ONLY public."ListingImage" DROP CONSTRAINT IF EXISTS "ListingImage_pkey";
ALTER TABLE IF EXISTS ONLY public."HomeCategorySlot" DROP CONSTRAINT IF EXISTS "HomeCategorySlot_pkey";
ALTER TABLE IF EXISTS ONLY public."HeroSlide" DROP CONSTRAINT IF EXISTS "HeroSlide_pkey";
ALTER TABLE IF EXISTS ONLY public."Favorite" DROP CONSTRAINT IF EXISTS "Favorite_pkey";
ALTER TABLE IF EXISTS ONLY public."Driver" DROP CONSTRAINT IF EXISTS "Driver_pkey";
ALTER TABLE IF EXISTS ONLY public."DriverLocationHistory" DROP CONSTRAINT IF EXISTS "DriverLocationHistory_pkey";
ALTER TABLE IF EXISTS ONLY public."DriverAvailabilitySubscription" DROP CONSTRAINT IF EXISTS "DriverAvailabilitySubscription_pkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryRate" DROP CONSTRAINT IF EXISTS "DeliveryRate_pkey";
ALTER TABLE IF EXISTS ONLY public."DeliveryAttempt" DROP CONSTRAINT IF EXISTS "DeliveryAttempt_pkey";
ALTER TABLE IF EXISTS ONLY public."CronRunLog" DROP CONSTRAINT IF EXISTS "CronRunLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Coupon" DROP CONSTRAINT IF EXISTS "Coupon_pkey";
ALTER TABLE IF EXISTS ONLY public."CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_pkey";
ALTER TABLE IF EXISTS ONLY public."ConsentLog" DROP CONSTRAINT IF EXISTS "ConsentLog_pkey";
ALTER TABLE IF EXISTS ONLY public."ConfigAuditLog" DROP CONSTRAINT IF EXISTS "ConfigAuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_pkey";
ALTER TABLE IF EXISTS ONLY public."CannedResponse" DROP CONSTRAINT IF EXISTS "CannedResponse_pkey";
ALTER TABLE IF EXISTS ONLY public."Bid" DROP CONSTRAINT IF EXISTS "Bid_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."AssignmentLog" DROP CONSTRAINT IF EXISTS "AssignmentLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_pkey";
ALTER TABLE IF EXISTS ONLY public."AdPlacement" DROP CONSTRAINT IF EXISTS "AdPlacement_pkey";
DROP TABLE IF EXISTS public."UserRole";
DROP TABLE IF EXISTS public."UserActivityLog";
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
DROP TABLE IF EXISTS public."MerchantDocumentChangeRequest";
DROP TABLE IF EXISTS public."MerchantCategory";
DROP TABLE IF EXISTS public."MerchantAcquiredProduct";
DROP TABLE IF EXISTS public."Merchant";
DROP TABLE IF EXISTS public."ListingImage";
DROP TABLE IF EXISTS public."Listing";
DROP TABLE IF EXISTS public."HomeCategorySlot";
DROP TABLE IF EXISTS public."HeroSlide";
DROP TABLE IF EXISTS public."Favorite";
DROP TABLE IF EXISTS public."DriverLocationHistory";
DROP TABLE IF EXISTS public."DriverAvailabilitySubscription";
DROP TABLE IF EXISTS public."Driver";
DROP TABLE IF EXISTS public."DeliveryRate";
DROP TABLE IF EXISTS public."DeliveryAttempt";
DROP TABLE IF EXISTS public."CronRunLog";
DROP TABLE IF EXISTS public."CouponUsage";
DROP TABLE IF EXISTS public."Coupon";
DROP TABLE IF EXISTS public."ConsentLog";
DROP TABLE IF EXISTS public."ConfigAuditLog";
DROP TABLE IF EXISTS public."Category";
DROP TABLE IF EXISTS public."CartItem";
DROP TABLE IF EXISTS public."CannedResponse";
DROP TABLE IF EXISTS public."Bid";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."AssignmentLog";
DROP TABLE IF EXISTS public."Address";
DROP TABLE IF EXISTS public."AdPlacement";
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
    "acceptedPrivacyAt" timestamp(3) without time zone
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
    "registroSanitarioStatus" text DEFAULT 'PENDING'::text NOT NULL
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
    "nearDestinationNotified" boolean DEFAULT false NOT NULL
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
    "deletedReason" text
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
    "acceptedPrivacyAt" timestamp(3) without time zone
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
    "nearDestinationNotified" boolean DEFAULT false NOT NULL
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
    "termsConsentVersion" text
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
-- Data for Name: AdPlacement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdPlacement" (id, "merchantId", type, status, "startsAt", "endsAt", amount, "originalAmount", currency, "paymentStatus", "paymentMethod", "mpPreferenceId", "mpPaymentId", "mpExternalRef", notes, "adminNotes", "rejectionReason", "createdAt", "updatedAt", "approvedAt", "activatedAt") FROM stdin;
\.


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Address" (id, "userId", label, street, number, apartment, neighborhood, city, province, "zipCode", latitude, longitude, "isDefault", "createdAt", "updatedAt", "deletedAt") FROM stdin;
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
\.


--
-- Data for Name: Bid; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bid" (id, "listingId", "userId", amount, "createdAt") FROM stdin;
\.


--
-- Data for Name: CannedResponse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CannedResponse" (id, shortcut, title, content, category, "sortOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
cmnw2pza5001o3ooe7qdfmjcw	/saludo	Saludo inicial	┬íHola! Soy del equipo de MOOVY. ┬┐En qu├⌐ puedo ayudarte?	general	1	t	2026-04-12 18:04:52.83	2026-04-12 18:04:52.83
cmnw2pzac001p3ooeu68v6zal	/espera	Pedir paciencia	Dame unos minutos para revisar tu caso. Ya te respondo.	general	2	t	2026-04-12 18:04:52.837	2026-04-12 18:04:52.837
cmnw2pzah001q3ooe4u8crz30	/pedido-estado	Estado del pedido	Estoy revisando el estado de tu pedido. Un momento por favor.	pedido	3	t	2026-04-12 18:04:52.841	2026-04-12 18:04:52.841
cmnw2pzam001r3ooe5j4jd49i	/pedido-demora	Demora en pedido	Lamento la demora. Estoy contactando al comercio para acelerar tu pedido.	pedido	4	t	2026-04-12 18:04:52.846	2026-04-12 18:04:52.846
cmnw2pzau001s3ooehvvzhy1d	/pago-pendiente	Pago pendiente	Veo que el pago todav├¡a est├í pendiente. ┬┐Pudiste completarlo desde MercadoPago?	pago	5	t	2026-04-12 18:04:52.855	2026-04-12 18:04:52.855
cmnw2pzaz001t3ooewwj7axqe	/pago-reembolso	Reembolso	Voy a gestionar el reembolso ahora. Puede demorar hasta 48hs en reflejarse en tu cuenta de MercadoPago.	pago	6	t	2026-04-12 18:04:52.86	2026-04-12 18:04:52.86
cmnw2pzb6001u3ooeswx9y1md	/cuenta-datos	Datos de cuenta	Para proteger tu seguridad, no puedo modificar datos sensibles por chat. Pod├⌐s actualizarlos desde tu perfil en la app.	cuenta	7	t	2026-04-12 18:04:52.866	2026-04-12 18:04:52.866
cmnw2pzba001v3ooeuqmxm3qf	/cierre	Cierre de chat	┬íListo! ┬┐Hay algo m├ís en lo que pueda ayudarte? Si no, cierro el chat. ┬íQue tengas un excelente d├¡a!	cierre	8	t	2026-04-12 18:04:52.871	2026-04-12 18:04:52.871
cmnw2pzbe001w3ooesgjbjt3u	/horario	Horario de atenci├│n	Nuestro horario de atenci├│n es de lunes a s├íbado de 9:00 a 21:00. Fuera de ese horario, dejanos tu mensaje y te respondemos apenas abramos.	general	9	t	2026-04-12 18:04:52.875	2026-04-12 18:04:52.875
cmnw2pzbl001x3ooeuacc81f4	/repartidor	Problema con repartidor	Lamento el inconveniente. Voy a reportar la situaci├│n al equipo de operaciones para que tomen acci├│n.	pedido	10	t	2026-04-12 18:04:52.881	2026-04-12 18:04:52.881
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
cmnw2pz3v000i3ooejddg6d35	Pizzer├¡a	pizzeria	\N	\N	t	2	STORE	2026-04-12 18:04:52.603	2026-04-12 18:04:52.603	t	0	\N	f	t	\N	\N
cmnw2pz3z000j3ooeqo3xfgth	Hamburgueser├¡a	hamburgueseria	\N	\N	t	3	STORE	2026-04-12 18:04:52.608	2026-04-12 18:04:52.608	t	0	\N	f	t	\N	\N
cmnw2pz44000k3ooed9vepfz1	Parrilla	parrilla	\N	\N	t	4	STORE	2026-04-12 18:04:52.612	2026-04-12 18:04:52.612	t	0	\N	f	t	\N	\N
cmnw2pz49000l3ooegno5am0a	Cafeter├¡a	cafeteria	\N	\N	t	5	STORE	2026-04-12 18:04:52.617	2026-04-12 18:04:52.617	t	0	\N	f	t	\N	\N
cmnw2pz4e000m3ooeu0ik70ks	Panader├¡a	panaderia	\N	\N	t	6	STORE	2026-04-12 18:04:52.622	2026-04-12 18:04:52.622	t	0	\N	f	t	\N	\N
cmnw2pz4j000n3ooe3ln25yrx	Farmacia	farmacia	\N	\N	t	7	STORE	2026-04-12 18:04:52.627	2026-04-12 18:04:52.627	t	0	\N	f	t	\N	\N
cmnw2pz4q000o3ooeetdfhz46	Supermercado	supermercado	\N	\N	t	8	STORE	2026-04-12 18:04:52.635	2026-04-12 18:04:52.635	t	0	\N	f	t	\N	\N
cmnw2pz4u000p3ooerlyvtabj	Kiosco	kiosco	\N	\N	t	9	STORE	2026-04-12 18:04:52.639	2026-04-12 18:04:52.639	t	0	\N	f	t	\N	\N
cmnw2pz4z000q3ooeez0jc54c	Verduler├¡a	verduleria	\N	\N	t	10	STORE	2026-04-12 18:04:52.643	2026-04-12 18:04:52.643	t	0	\N	f	t	\N	\N
cmnw2pz54000r3ooecus3vhhr	Carnicer├¡a	carniceria	\N	\N	t	11	STORE	2026-04-12 18:04:52.649	2026-04-12 18:04:52.649	t	0	\N	f	t	\N	\N
cmnw2pz59000s3ooegksqh88s	Otro	otro	\N	\N	t	99	BOTH	2026-04-12 18:04:52.653	2026-04-12 18:04:52.653	t	0	\N	f	t	\N	\N
cmnw2pz5d000t3ooeypsf73lm	Electr├│nica	electronica	\N	\N	t	1	MARKETPLACE	2026-04-12 18:04:52.657	2026-04-12 18:04:52.657	t	0	\N	f	t	\N	\N
cmnw2pz5h000u3ooe9fu5jn1o	Ropa y Calzado	ropa-calzado	\N	\N	t	2	MARKETPLACE	2026-04-12 18:04:52.661	2026-04-12 18:04:52.661	t	0	\N	f	t	\N	\N
cmnw2pz5l000v3ooe9ymzwrfn	Hogar y Jard├¡n	hogar-jardin	\N	\N	t	3	MARKETPLACE	2026-04-12 18:04:52.665	2026-04-12 18:04:52.665	t	0	\N	f	t	\N	\N
cmnw2pz5p000w3ooej2c5lade	Deportes	deportes	\N	\N	t	4	MARKETPLACE	2026-04-12 18:04:52.669	2026-04-12 18:04:52.669	t	0	\N	f	t	\N	\N
cmnw2pz5t000x3ooep0jbcfaq	Juguetes	juguetes	\N	\N	t	5	MARKETPLACE	2026-04-12 18:04:52.673	2026-04-12 18:04:52.673	t	0	\N	f	t	\N	\N
cmnw2pz5x000y3ooeozweeavw	Libros y M├║sica	libros-musica	\N	\N	t	6	MARKETPLACE	2026-04-12 18:04:52.678	2026-04-12 18:04:52.678	t	0	\N	f	t	\N	\N
cmnw2pz61000z3ooes09qfjps	Mascotas	mascotas	\N	\N	t	7	MARKETPLACE	2026-04-12 18:04:52.681	2026-04-12 18:04:52.681	t	0	\N	f	t	\N	\N
cmnw2pz6500103ooe19uns92d	Automotor	automotor	\N	\N	t	8	MARKETPLACE	2026-04-12 18:04:52.685	2026-04-12 18:04:52.685	t	0	\N	f	t	\N	\N
cmnw2pz6900113ooenw7hjmjx	Artesan├¡as	artesanias	\N	\N	t	9	MARKETPLACE	2026-04-12 18:04:52.689	2026-04-12 18:04:52.689	t	0	\N	f	t	\N	\N
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
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Driver" (id, "userId", "vehicleType", "vehicleBrand", "vehicleModel", "vehicleYear", "vehicleColor", "licensePlate", cuit, "licenciaUrl", "seguroUrl", "vtvUrl", "dniFrenteUrl", "dniDorsoUrl", "acceptedTermsAt", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt", "availabilityStatus", "lastLocationAt", latitude, longitude, "approvalStatus", "approvedAt", "rejectionReason", ubicacion, "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "fraudScore", "lastFraudCheckAt", "acceptedPrivacyAt") FROM stdin;
\.


--
-- Data for Name: DriverAvailabilitySubscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DriverAvailabilitySubscription" (id, "userId", latitude, longitude, "merchantId", "createdAt", "expiresAt", "notifiedAt") FROM stdin;
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

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "scheduleEnabled", "scheduleJson", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", "allowPickup", cuit, "constanciaAfipUrl", "habilitacionMunicipalUrl", "registroSanitarioUrl", "acceptedTermsAt", "acceptedPrivacyAt", category, "ownerId", "createdAt", "updatedAt", rating, "adminNotes", "bankAccount", "businessName", "commissionRate", cuil, "displayOrder", "facebookUrl", "instagramUrl", "isPremium", "ownerBirthDate", "ownerDni", "premiumTier", "premiumUntil", "startedAt", "whatsappNumber", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "approvalStatus", "approvedAt", "rejectionReason", ubicacion, "loyaltyTier", "loyaltyOrderCount", "loyaltyUpdatedAt", "commissionOverride", "commissionOverrideReason", "isSuspended", "loyaltyTierLocked", "suspendedAt", "suspendedUntil", "suspensionReason", "firstOrderWelcomeSentAt", "bankAccountApprovedAt", "bankAccountRejectionReason", "bankAccountStatus", "constanciaAfipApprovedAt", "constanciaAfipRejectionReason", "constanciaAfipStatus", "cuitApprovedAt", "cuitRejectionReason", "cuitStatus", "habilitacionMunicipalApprovedAt", "habilitacionMunicipalRejectionReason", "habilitacionMunicipalStatus", "registroSanitarioApprovedAt", "registroSanitarioRejectionReason", "registroSanitarioStatus") FROM stdin;
cmobll552000cw4k6blur8j08	9410	9410	Nuevo comercio Moovy	\N	\N	t	t	f	\N	t	maugrod@gmail.com	+5492901652974	Magallanes 2093	-54.8079215	-68.3315944	5	30	45	0	0	f	206772d008396df2cf2f0aed76278b92:362552f4805c58a151973d643000cd57:c3e8575a29c0b3fa19c3daf627	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1776955754435-Guia_de_Descargas.pdf	https://pub-8e9cd8ba192646df98fa6e7adf48e70d.r2.dev/registration-docs/1776955765679-Guia_de_Descargas.pdf	\N	2026-04-23 14:49:32.477	2026-04-23 14:49:32.477	Kiosco	cmobkazic0002w4k6sk1luhha	2026-04-23 14:49:32.485	2026-04-23 14:51:09.147	\N	\N	58950ffa58bebb376038d1ff7bce4866:db204b962af55ff44ae99d9f2c1edee2:62a1aff9fdcafa0dd4e088144d2c57816c83a0d1f2	9410	8	\N	0	\N	\N	f	\N	\N	basic	\N	\N	\N	\N	\N	\N	\N	\N	APPROVED	2026-04-23 14:51:09.142	\N	\N	BRONCE	0	2026-04-23 14:49:32.485	\N	\N	f	f	\N	\N	\N	\N	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING	\N	\N	PENDING
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
\.


--
-- Data for Name: MerchantLoyaltyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MerchantLoyaltyConfig" (id, tier, "minOrdersPerMonth", "commissionRate", "badgeText", "badgeColor", "benefitsJson", "displayOrder", "createdAt", "updatedAt") FROM stdin;
cmnw2pz6c00123ooej2dvusub	BRONCE	0	8	Nuevo	gray	[]	1	2026-04-12 18:04:52.692	2026-04-12 18:04:52.692
cmnw2pz6m00133ooembsbszap	PLATA	30	7	Destacado	blue	["Comisi├│n reducida 7%","Prioridad en soporte"]	2	2026-04-12 18:04:52.703	2026-04-12 18:04:52.703
cmnw2pz6t00143ooeyfb895i9	ORO	80	6	Popular	yellow	["Comisi├│n reducida 6%","Prioridad en soporte","Destacado en b├║squedas"]	3	2026-04-12 18:04:52.71	2026-04-12 18:04:52.71
cmnw2pz6z00153ooeehit12au	DIAMANTE	200	5	Elite	purple	["Comisi├│n reducida 5%","Soporte prioritario 24/7","Destacado en home","Account manager dedicado"]	4	2026-04-12 18:04:52.716	2026-04-12 18:04:52.716
\.


--
-- Data for Name: MoovyConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MoovyConfig" (id, key, value, description, "updatedAt") FROM stdin;
cmnw2pz0n00023ooeot4m38v2	default_merchant_commission_pct	8	Comisi├│n MOOVY a comercios (%)	2026-04-12 18:04:52.487
cmnw2pz0y00033ooeineogqsl	default_seller_commission_pct	12	Comisi├│n MOOVY a vendedores marketplace (%)	2026-04-12 18:04:52.498
cmnw2pz1900043ooen0k9livo	merchant_confirm_timeout_seconds	300	Timeout para que el comercio confirme (seg)	2026-04-12 18:04:52.51
cmnw2pz1i00053ooeltp8eb0a	driver_response_timeout_seconds	60	Timeout para que el driver acepte oferta (seg)	2026-04-12 18:04:52.518
cmnw2pz1o00063ooena45c54c	max_assignment_attempts	5	M├íximo intentos de asignaci├│n de driver	2026-04-12 18:04:52.525
cmnw2pz1v00073ooeg4ma9ph3	points_per_dollar	1	Puntos por peso gastado	2026-04-12 18:04:52.531
cmnw2pz2500083ooexl552lcf	signup_bonus	100	Puntos bonus por registro	2026-04-12 18:04:52.541
cmnw2pz2d00093ooeop7ps99n	referral_bonus	200	Puntos bonus por referir	2026-04-12 18:04:52.549
cmnw2pz2i000a3ooecv55jhbj	min_points_to_redeem	100	M├¡nimo de puntos para canjear	2026-04-12 18:04:52.554
cmnw2pz2o000b3ooershwfe58	max_discount_percent	50	M├íximo % de descuento con puntos	2026-04-12 18:04:52.56
cmnw2pz2t000c3ooeu8a58kzz	cart_recovery_enabled	true	Habilitar recuperaci├│n de carritos abandonados	2026-04-12 18:04:52.566
cmnw2pz31000d3ooet00y8eva	cart_recovery_first_reminder_hours	2	Horas hasta 1er recordatorio de carrito	2026-04-12 18:04:52.573
cmnw2pz36000e3ooelgqtd83s	cart_recovery_second_reminder_hours	24	Horas hasta 2do recordatorio de carrito	2026-04-12 18:04:52.579
cmnw2pz3b000f3ooevwgrltfn	cart_recovery_max_reminders	2	M├íximo de recordatorios por carrito	2026-04-12 18:04:52.584
cmnw2pz3g000g3ooe3t9sic9i	cart_recovery_min_cart_value	5000	Valor m├¡nimo del carrito para enviar recordatorio (ARS)	2026-04-12 18:04:52.588
cmo4zf9yr0000a4dun3xxpm64	assignment_rating_radius_meters	3000	Radio (metros) dentro del cual se priorizan repartidores por rating en el assignment engine	2026-04-18 23:42:30.195
cmo4zf9zs0001a4durybs3xkn	max_delivery_distance_km	15	Distancia m├íxima en km entre comercio y cliente para aceptar delivery	2026-04-18 23:42:30.233
cmo4zfa0b0002a4duf1n1d2t0	min_order_amount_ars	1000	Monto m├¡nimo del carrito para poder hacer delivery	2026-04-18 23:42:30.252
cmo4zfa0o0003a4duqov1p6u9	scheduled_notify_before_minutes	30	Minutos antes de la hora programada para notificar al repartidor	2026-04-18 23:42:30.264
cmo4zfa150004a4duszp4pudf	scheduled_cancel_if_no_confirm_minutes	30	Minutos sin confirmaci├│n del comercio antes de cancelar pedido programado	2026-04-18 23:42:30.282
\.


--
-- Data for Name: MpWebhookLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MpWebhookLog" (id, "eventId", "eventType", "resourceId", processed, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "isPickup", "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveryStatus", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt", "cancelReason", "commissionPaid", "driverRating", "merchantPayout", "moovyCommission", "ratedAt", "ratingComment", "merchantRating", "merchantRatingComment", "sellerRating", "sellerRatingComment", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "lastAssignmentAt", "pendingDriverId", "deletedAt", "mpPreferenceId", "mpPaymentId", "mpMerchantOrderId", "mpStatus", "paidAt", "isMultiVendor", "deliveryType", "scheduledSlotStart", "scheduledSlotEnd", "scheduledConfirmedAt", "couponCode", "pointsEarned", "pointsUsed", "deliveryPin", "deliveryPinAttempts", "deliveryPinVerifiedAt", "failedDeliveryAt", "failedDeliveryReason", "pickupPin", "pickupPinAttempts", "pickupPinVerifiedAt", "nearDestinationNotified") FROM stdin;
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
-- Data for Name: PendingAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PendingAssignment" (id, "orderId", "currentDriverId", "attemptNumber", "expiresAt", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PointsConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsConfig" (id, "pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus", "reviewBonus", "pointsExpireDays", "refereeBonus", "minPurchaseForBonus", "minReferralPurchase", "tierWindowDays", "tierConfigJson", "updatedAt") FROM stdin;
points_config	0.01	0	1	500	20	1000	1000	10	180	500	5000	8000	90	\N	2026-04-22 18:38:02.696
\.


--
-- Data for Name: PointsTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PointsTransaction" (id, "userId", "orderId", type, amount, "balanceAfter", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "createdAt", "updatedAt", "packageCategoryId", "deletedAt", "deletedBy", "deletedReason") FROM stdin;
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductCategory" (id, "productId", "categoryId") FROM stdin;
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductImage" (id, "productId", url, alt, "order") FROM stdin;
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

COPY public."SavedCart" (id, "userId", items, "merchantId", "createdAt", "updatedAt", "cartValue", "lastRemindedAt", "recoveredAt", "reminderCount") FROM stdin;
\.


--
-- Data for Name: SellerAvailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerAvailability" (id, "sellerId", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SellerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SellerProfile" (id, "userId", "displayName", bio, avatar, cuit, "acceptedTermsAt", "bankAlias", "bankCbu", "isActive", "isVerified", "totalSales", rating, "commissionRate", "mpAccessToken", "mpRefreshToken", "mpUserId", "mpEmail", "mpLinkedAt", "isOnline", "isPaused", "pauseEndsAt", "preparationMinutes", "scheduleEnabled", "scheduleJson", "createdAt", "updatedAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "acceptedPrivacyAt") FROM stdin;
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "isMaintenanceMode", "maintenanceMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt", "promoPopupButtonText", "promoPopupDismissable", "promoPopupEnabled", "promoPopupImage", "promoPopupLink", "promoPopupMessage", "promoPopupTitle", "showComerciosCard", "showRepartidoresCard", "tiendaMaintenance", "maxCategoriesHome", "heroSliderEnabled", "heroSliderInterval", "heroSliderShowArrows", "promoBannerButtonLink", "promoBannerButtonText", "promoBannerEnabled", "promoBannerImage", "promoBannerSubtitle", "promoBannerTitle", "promoBannerCtaPosition", "promoSlidesJson", "riderCommissionPercent", "zoneMultipliersJson", "climateMultipliersJson", "activeClimateCondition", "operationalCostPercent", "defaultMerchantCommission", "defaultSellerCommission", "cashMpOnlyDeliveries", "cashLimitL1", "cashLimitL2", "cashLimitL3", "maxOrdersPerSlot", "slotDurationMinutes", "minAnticipationHours", "maxAnticipationHours", "operatingHoursStart", "operatingHoursEnd", "merchantConfirmTimeoutSec", "driverResponseTimeoutSec", "adPricePlatino", "adPriceDestacado", "adPricePremium", "adPriceHeroBanner", "adPriceBannerPromo", "adPriceProducto", "adLaunchDiscountPercent", "adMaxHeroBannerSlots", "adMaxDestacadosSlots", "adMaxProductosSlots", "adMinDurationDays", "adDiscount3Months", "adDiscount6Months", "adPaymentMethods", "adCancellation48hFullRefund", "adCancellationAdminFeePercent", "heroBackgroundsJson", "bankName", "bankAccountHolder", "bankCbu", "bankAlias", "bankCuit", "supportChatEnabled", "excludedZonesJson") FROM stdin;
settings	t	Volvemos pronto	f	Estamos preparando todo para vos. MOOVY llega pronto a Ushuaia.	1200	0.06	500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-04-14 23:39:27.92	Ver mas	t	f					t	t	f	6	t	5000	t	/productos?categoria=pizzas	Ver locales	f	\N	2x1 en locales seleccionados de 20hs a 23hs.	Noches de\nPizza & Pelis	abajo-izquierda	[]	80	{"ZONA_A":1.0,"ZONA_B":1.15,"ZONA_C":1.35}	{"normal":1.0,"lluvia_leve":1.15,"temporal_fuerte":1.30}	normal	5	8	12	10	15000	25000	40000	15	120	1.5	48	09:00	22:00	300	60	150000	95000	55000	250000	180000	25000	50	3	8	12	7	10	20	["mercadopago","transferencia"]	t	10	{}						f	[]
\.


--
-- Data for Name: SubOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SubOrder" (id, "orderId", "merchantId", "sellerId", status, subtotal, "deliveryFee", discount, total, "driverId", "moovyCommission", "sellerPayout", "paymentStatus", "deliveryStatus", "deliveredAt", "deliveryPhoto", "driverRating", "assignmentAttempts", "assignmentExpiresAt", "attemptedDriverIds", "pendingDriverId", "createdAt", "updatedAt", "mpTransferId", "payoutStatus", "paidOutAt", "deliveryPin", "deliveryPinAttempts", "deliveryPinVerifiedAt", "failedDeliveryAt", "failedDeliveryReason", "pickupPin", "pickupPinAttempts", "pickupPinVerifiedAt", "nearDestinationNotified") FROM stdin;
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

COPY public."User" (id, email, password, name, "firstName", "lastName", phone, role, "emailVerified", image, "pointsBalance", "pendingBonusPoints", "bonusActivated", "referralCode", "referredById", "createdAt", "updatedAt", "privacyConsentAt", "termsConsentAt", "resetToken", "resetTokenExpiry", "deletedAt", "archivedAt", "isSuspended", "suspendedAt", "suspendedUntil", "suspensionReason", "onboardingCompletedAt", "age18Confirmed", "cookiesConsent", "cookiesConsentAt", "marketingConsent", "marketingConsentAt", "marketingConsentRevokedAt", "privacyConsentVersion", "termsConsentVersion") FROM stdin;
cmnuzx1fg0002zgw8zimoxguz	maurod@me.com	$2b$12$JsnYaQTYra8HYzOzFwhCH.owWDtAyP5Rj3EEA2NEZxo7ddSrpJy2K	Mauro Rodriguez	Mauro	Rodriguez	+54 2901652974	ADMIN	\N	\N	0	0	f	MOV-54Z4	\N	2026-04-11 23:58:37.179	2026-04-22 18:27:33.424	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	f	\N	\N	f	\N	\N	\N	\N
cmobkazic0002w4k6sk1luhha	maugrod@gmail.com	$2b$10$JmJnWqfoL3YLcfI084JdauwXXLsOK9slbvTEG8ROtpEsebHH4H6AG	Mauro Rodriguez	Mauro	Rodriguez	+54 2901652974	USER	\N	\N	0	1000	f	MOV-3CYV	\N	2026-04-23 14:13:39.009	2026-04-23 14:52:43.705	2026-04-23 14:13:39.006	2026-04-23 14:13:39.006	\N	\N	\N	\N	f	\N	\N	\N	2026-04-23 14:15:45.524	t	\N	\N	t	2026-04-23 14:13:39.006	\N	2.0	1.1
\.


--
-- Data for Name: UserActivityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserActivityLog" (id, "userId", action, "entityType", "entityId", metadata, "ipAddress", "userAgent", "createdAt") FROM stdin;
cmobkb0cm000aw4k646hrbj1f	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-23 14:13:40.103
cmoblp8qi000hw4k6r9ggrq20	cmobkazic0002w4k6sk1luhha	LOGIN	User	cmobkazic0002w4k6sk1luhha	{"method":"credentials"}	\N	\N	2026-04-23 14:52:43.771
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" (id, "userId", role, "isActive", "activatedAt") FROM stdin;
cmnw2pyz700013ooek0ybrew9	cmnuzx1fg0002zgw8zimoxguz	ADMIN	t	2026-04-12 18:04:52.434
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
-- Name: DriverAvailabilitySubscription DriverAvailabilitySubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DriverAvailabilitySubscription"
    ADD CONSTRAINT "DriverAvailabilitySubscription_pkey" PRIMARY KEY (id);


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
-- Name: SubOrder_merchantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SubOrder_merchantId_idx" ON public."SubOrder" USING btree ("merchantId");


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


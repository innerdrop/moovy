--
-- PostgreSQL database dump
--

\restrict 9Sry82cAI2J6reEPcKcX151wWdexco1VBpRLa4tAyZfU5K5HEsUyrySIQFfv2fQ

-- Dumped from database version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: moovy_user
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Address" OWNER TO moovy_user;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: moovy_user
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


ALTER TABLE public."CartItem" OWNER TO moovy_user;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: moovy_user
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO moovy_user;

--
-- Name: Driver; Type: TABLE; Schema: public; Owner: moovy_user
--

CREATE TABLE public."Driver" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "vehicleType" text,
    "licensePlate" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    "totalDeliveries" integer DEFAULT 0 NOT NULL,
    rating double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Driver" OWNER TO moovy_user;

--
-- Name: Merchant; Type: TABLE; Schema: public; Owner: moovy_user
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
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Merchant" OWNER TO moovy_user;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: moovy_user
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO moovy_user;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: moovy_user
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


ALTER TABLE public."OrderItem" OWNER TO moovy_user;

--
-- Name: PointsConfig; Type: TABLE; Schema: public; Owner: moovy_user
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


ALTER TABLE public."PointsConfig" OWNER TO moovy_user;

--
-- Name: PointsTransaction; Type: TABLE; Schema: public; Owner: moovy_user
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


ALTER TABLE public."PointsTransaction" OWNER TO moovy_user;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: moovy_user
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


ALTER TABLE public."Product" OWNER TO moovy_user;

--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: moovy_user
--

CREATE TABLE public."ProductCategory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "categoryId" text NOT NULL
);


ALTER TABLE public."ProductCategory" OWNER TO moovy_user;

--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: moovy_user
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    alt text,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."ProductImage" OWNER TO moovy_user;

--
-- Name: ProductVariant; Type: TABLE; Schema: public; Owner: moovy_user
--

CREATE TABLE public."ProductVariant" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    price double precision,
    stock integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ProductVariant" OWNER TO moovy_user;

--
-- Name: Referral; Type: TABLE; Schema: public; Owner: moovy_user
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


ALTER TABLE public."Referral" OWNER TO moovy_user;

--
-- Name: StoreSettings; Type: TABLE; Schema: public; Owner: moovy_user
--

CREATE TABLE public."StoreSettings" (
    id text DEFAULT 'settings'::text NOT NULL,
    "isOpen" boolean DEFAULT true NOT NULL,
    "closedMessage" text DEFAULT 'Estamos cerrados. ¡Volvemos pronto!'::text NOT NULL,
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StoreSettings" OWNER TO moovy_user;

--
-- Name: User; Type: TABLE; Schema: public; Owner: moovy_user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    role text DEFAULT 'USER'::text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "pointsBalance" integer DEFAULT 0 NOT NULL,
    "referralCode" text NOT NULL,
    "referredById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO moovy_user;

--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Address" (id, "userId", label, street, number, apartment, neighborhood, city, province, "zipCode", latitude, longitude, "isDefault", "createdAt", "updatedAt") FROM stdin;
demo-address-1	cmkeck38j0008mwsnikk64vvb	Casa	Maipú	100	\N	\N	Ushuaia	Tierra del Fuego	\N	-54.805	-68.305	t	2026-01-14 18:21:16.165	2026-01-14 18:21:16.165
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."CartItem" (id, "userId", "productId", quantity, "variantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Category" (id, name, slug, description, image, "isActive", "order", "createdAt", "updatedAt") FROM stdin;
cmkeck32i0000mwsnfsv487r7	Lácteos	lacteos	Todo en Lácteos	\N	t	1	2026-01-14 18:21:15.787	2026-01-14 18:21:15.787
cmkeck32m0001mwsnixyoykm1	Bebidas	bebidas	Todo en Bebidas	\N	t	1	2026-01-14 18:21:15.79	2026-01-14 18:21:15.79
cmkeck32o0002mwsntgpeshg6	Sandwichería	sandwicheria	Todo en Sandwichería	\N	t	1	2026-01-14 18:21:15.792	2026-01-14 18:21:15.792
cmkeck32q0003mwsn6s753he1	Golosinas	golosinas	Todo en Golosinas	\N	t	1	2026-01-14 18:21:15.794	2026-01-14 18:21:15.794
cmkeck32r0004mwsnjm7m107k	Almacén	almacen	Todo en Almacén	\N	t	1	2026-01-14 18:21:15.796	2026-01-14 18:21:15.796
cmkeck32t0005mwsnz0lsyhft	Limpieza	limpieza	Todo en Limpieza	\N	t	1	2026-01-14 18:21:15.797	2026-01-14 18:21:15.797
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Driver" (id, "userId", "vehicleType", "licensePlate", "isActive", "isOnline", "totalDeliveries", rating, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Merchant; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Merchant" (id, name, slug, description, image, banner, "isActive", "isOpen", "isVerified", email, phone, address, latitude, longitude, "deliveryRadiusKm", "deliveryTimeMin", "deliveryTimeMax", "deliveryFee", "minOrderAmount", "ownerId", "createdAt", "updatedAt") FROM stdin;
cmkeck3cx000fmwsnr65ui0yu	Burgers Joe	burgers-joe	Las mejores hamburguesas del Fin del Mundo	\N	\N	t	t	f	contacto@burgersjoe.com	+5492901112222	San Martín 1234, Ushuaia	\N	\N	5	30	45	0	0	cmkeck3cu000cmwsn8un4888x	2026-01-14 18:21:16.161	2026-01-14 18:21:16.161
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Order" (id, "orderNumber", "userId", "addressId", "merchantId", status, "paymentId", "paymentStatus", "paymentMethod", subtotal, "deliveryFee", discount, total, "distanceKm", "deliveryNotes", "estimatedTime", "driverId", "deliveryStatus", "deliveredAt", "deliveryPhoto", "customerNotes", "adminNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."OrderItem" (id, "orderId", "productId", name, price, quantity, "variantName", subtotal) FROM stdin;
\.


--
-- Data for Name: PointsConfig; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."PointsConfig" (id, "pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus", "reviewBonus", "pointsExpireDays", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PointsTransaction; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."PointsTransaction" (id, "userId", "orderId", type, amount, "balanceAfter", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Product" (id, name, slug, description, "merchantId", price, "costPrice", stock, "minStock", "isActive", "isFeatured", "createdAt", "updatedAt") FROM stdin;
cmkeck3d4000hmwsnu6wvvev2	Leche La Serenísima 1L	leche-la-serenasima-1l	Descripción de ejemplo para Leche La Serenísima 1L	cmkeck3cx000fmwsnr65ui0yu	1200	840	100	5	t	f	2026-01-14 18:21:16.168	2026-01-14 18:21:16.168
cmkeck3d9000lmwsnyn6oz7a7	Yogur Bebible Frutilla	yogur-bebible-frutilla	Descripción de ejemplo para Yogur Bebible Frutilla	cmkeck3cx000fmwsnr65ui0yu	1500	1050	100	5	t	f	2026-01-14 18:21:16.173	2026-01-14 18:21:16.173
cmkeck3dc000pmwsn8my3kp4p	Coca Cola 2.25L	coca-cola-2.25l	Descripción de ejemplo para Coca Cola 2.25L	cmkeck3cx000fmwsnr65ui0yu	2800	1960	100	5	t	t	2026-01-14 18:21:16.177	2026-01-14 18:21:16.177
cmkeck3dg000tmwsnwf91rzga	Cerveza Andes Origen Roja	cerveza-andes-origen-roja	Descripción de ejemplo para Cerveza Andes Origen Roja	cmkeck3cx000fmwsnr65ui0yu	3200	2240	100	5	t	f	2026-01-14 18:21:16.18	2026-01-14 18:21:16.18
cmkeck3dj000xmwsn62ebserm	Sándwich de Miga J&Q	sandwich-de-miga-j&q	Descripción de ejemplo para Sándwich de Miga J&Q	cmkeck3cx000fmwsnr65ui0yu	3500	2450	100	5	t	t	2026-01-14 18:21:16.184	2026-01-14 18:21:16.184
cmkeck3dm0011mwsn08s33kdf	Peyogur	peyogur	Descripción de ejemplo para Peyogur	cmkeck3cx000fmwsnr65ui0yu	3500	2450	100	5	t	f	2026-01-14 18:21:16.187	2026-01-14 18:21:16.187
cmkeck3dq0015mwsnz622pl9s	Alfajor Jorgito	alfajor-jorgito	Descripción de ejemplo para Alfajor Jorgito	cmkeck3cx000fmwsnr65ui0yu	800	560	100	5	t	f	2026-01-14 18:21:16.19	2026-01-14 18:21:16.19
cmkeck3dt0019mwsnxzbgmwmv	Yerba Playadito 500g	yerba-playadito-500g	Descripción de ejemplo para Yerba Playadito 500g	cmkeck3cx000fmwsnr65ui0yu	2400	1680	100	5	t	f	2026-01-14 18:21:16.194	2026-01-14 18:21:16.194
cmkeck3dw001dmwsncz2whrqe	Arroz Gallo Oro	arroz-gallo-oro	Descripción de ejemplo para Arroz Gallo Oro	cmkeck3cx000fmwsnr65ui0yu	1800	1260	100	5	t	f	2026-01-14 18:21:16.197	2026-01-14 18:21:16.197
cmkeck3e0001hmwsnaz6ex5io	Lavandina Ayudín 1L	lavandina-ayudan-1l	Descripción de ejemplo para Lavandina Ayudín 1L	cmkeck3cx000fmwsnr65ui0yu	1500	1050	100	5	t	f	2026-01-14 18:21:16.201	2026-01-14 18:21:16.201
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."ProductCategory" (id, "productId", "categoryId") FROM stdin;
cmkeck3d6000jmwsnt8rj67g1	cmkeck3d4000hmwsnu6wvvev2	cmkeck32i0000mwsnfsv487r7
cmkeck3db000nmwsnom6pjuh4	cmkeck3d9000lmwsnyn6oz7a7	cmkeck32i0000mwsnfsv487r7
cmkeck3de000rmwsnzrcgcmvl	cmkeck3dc000pmwsn8my3kp4p	cmkeck32m0001mwsnixyoykm1
cmkeck3dh000vmwsn5pdcei37	cmkeck3dg000tmwsnwf91rzga	cmkeck32m0001mwsnixyoykm1
cmkeck3dl000zmwsn0v2pturi	cmkeck3dj000xmwsn62ebserm	cmkeck32o0002mwsntgpeshg6
cmkeck3do0013mwsnftmp6v85	cmkeck3dm0011mwsn08s33kdf	cmkeck32q0003mwsn6s753he1
cmkeck3ds0017mwsnm5gx4voa	cmkeck3dq0015mwsnz622pl9s	cmkeck32q0003mwsn6s753he1
cmkeck3dv001bmwsn3ttwcixi	cmkeck3dt0019mwsnxzbgmwmv	cmkeck32r0004mwsnjm7m107k
cmkeck3dy001fmwsnccmdkvbs	cmkeck3dw001dmwsncz2whrqe	cmkeck32r0004mwsnjm7m107k
cmkeck3e3001jmwsnt443420z	cmkeck3e0001hmwsnaz6ex5io	cmkeck32t0005mwsnz0lsyhft
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."ProductImage" (id, "productId", url, alt, "order") FROM stdin;
\.


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."ProductVariant" (id, "productId", name, price, stock, "isActive") FROM stdin;
\.


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."Referral" (id, "referrerId", "refereeId", "codeUsed", "referrerPoints", "refereePoints", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: StoreSettings; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."StoreSettings" (id, "isOpen", "closedMessage", "fuelPricePerLiter", "fuelConsumptionPerKm", "baseDeliveryFee", "maintenanceFactor", "freeDeliveryMinimum", "maxDeliveryDistance", "storeName", "storeAddress", "originLat", "originLng", "whatsappNumber", phone, email, schedule, "updatedAt") FROM stdin;
settings	t	Estamos cerrados. ¡Volvemos pronto!	1200	0.06	500	1.35	\N	15	Moovy Ushuaia	Ushuaia, Tierra del Fuego	-54.8019	-68.303	\N	\N	\N	\N	2026-01-14 18:21:15.781
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: moovy_user
--

COPY public."User" (id, email, password, name, phone, role, "emailVerified", image, "pointsBalance", "referralCode", "referredById", "createdAt", "updatedAt") FROM stdin;
cmkeck3640006mwsn6fwl4acy	admin@somosmoovy.com	$2b$10$U7mFEtXx.oULI/1Be0DbHezdrbVuG64M3KPi5Yeayvrf66nUy648C	Super Admin Moovy	+5492901555555	ADMIN	\N	\N	0	cmkeck3640007mwsn5qpaeiab	\N	2026-01-14 18:21:15.917	2026-01-14 18:21:15.917
cmkeck38j0008mwsnikk64vvb	cliente@somosmoovy.com	$2b$10$i/zfpAl0eu7gTnNMQdWBrezg/zSw3BHge14uHpPYcQYtc.wfEPYQ2	Cliente Demo	+5492901123456	USER	\N	\N	0	cmkeck38j0009mwsnb70d5xnr	\N	2026-01-14 18:21:16.003	2026-01-14 18:21:16.003
cmkeck3ap000amwsn6dog41od	repartidor@somosmoovy.com	$2b$10$AfJXZEdjZ9e0RncrL1VYtOiHA9Q2vIOHqNPf6OBv2esodxyvpYebe	Juan Repartidor	+5492901999999	DRIVER	\N	\N	0	cmkeck3ap000bmwsnet4ztp35	\N	2026-01-14 18:21:16.081	2026-01-14 18:21:16.081
cmkeck3cu000cmwsn8un4888x	burger@somosmoovy.com	$2b$10$LJXRb.MUtzH3MHzRCCqo/OqgtDW19tY7On2dbSYKpDqxnOO4CPCvO	Joe Burger Owner	+5492901112222	MERCHANT	\N	\N	0	cmkeck3cu000dmwsnyrx40lx5	\N	2026-01-14 18:21:16.159	2026-01-14 18:21:16.159
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (id);


--
-- Name: Merchant Merchant_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PointsConfig PointsConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."PointsConfig"
    ADD CONSTRAINT "PointsConfig_pkey" PRIMARY KEY (id);


--
-- Name: PointsTransaction PointsTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."PointsTransaction"
    ADD CONSTRAINT "PointsTransaction_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductVariant ProductVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Referral Referral_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_pkey" PRIMARY KEY (id);


--
-- Name: StoreSettings StoreSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."StoreSettings"
    ADD CONSTRAINT "StoreSettings_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: CartItem_userId_productId_variantId_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "CartItem_userId_productId_variantId_key" ON public."CartItem" USING btree ("userId", "productId", "variantId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Driver_userId_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Driver_userId_key" ON public."Driver" USING btree ("userId");


--
-- Name: Merchant_slug_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Merchant_slug_key" ON public."Merchant" USING btree (slug);


--
-- Name: Order_orderNumber_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Order_orderNumber_key" ON public."Order" USING btree ("orderNumber");


--
-- Name: ProductCategory_productId_categoryId_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "ProductCategory_productId_categoryId_key" ON public."ProductCategory" USING btree ("productId", "categoryId");


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Referral_refereeId_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "Referral_refereeId_key" ON public."Referral" USING btree ("refereeId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_referralCode_key; Type: INDEX; Schema: public; Owner: moovy_user
--

CREATE UNIQUE INDEX "User_referralCode_key" ON public."User" USING btree ("referralCode");


--
-- Name: Address Address_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Driver Driver_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Driver"
    ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Merchant Merchant_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Merchant"
    ADD CONSTRAINT "Merchant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public."Address"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Driver"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PointsTransaction PointsTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."PointsTransaction"
    ADD CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductCategory ProductCategory_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductVariant ProductVariant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_merchantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES public."Merchant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Referral Referral_refereeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Referral Referral_referrerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."Referral"
    ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_referredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moovy_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO moovy_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 9Sry82cAI2J6reEPcKcX151wWdexco1VBpRLa4tAyZfU5K5HEsUyrySIQFfv2fQ


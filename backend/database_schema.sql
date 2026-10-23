--
-- PostgreSQL database dump
--

\restrict ViZsRkxYIXF6AxQbud5OCGMIdyCKk79w7Dadh4WnhnGENeUOCr9zy75NpOGuvZT

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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
-- Name: fuel_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fuel_prices (
    price_id integer NOT NULL,
    station_id integer NOT NULL,
    fuel_type character varying(30) NOT NULL,
    price_per_liter numeric(6,2) NOT NULL,
    date_updated date DEFAULT CURRENT_DATE NOT NULL,
    time_updated time without time zone DEFAULT CURRENT_TIME NOT NULL,
    status character varying(10) NOT NULL,
    updated_by integer
);


ALTER TABLE public.fuel_prices OWNER TO postgres;

--
-- Name: fuel_prices_price_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fuel_prices_price_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fuel_prices_price_id_seq OWNER TO postgres;

--
-- Name: fuel_prices_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fuel_prices_price_id_seq OWNED BY public.fuel_prices.price_id;


--
-- Name: gas_stations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gas_stations (
    station_id integer NOT NULL,
    name character varying(150) NOT NULL,
    brand character varying(100),
    address character varying NOT NULL,
    barangay character varying(100),
    city character varying(100) NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    contact_info character varying(100),
    status character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gas_stations OWNER TO postgres;

--
-- Name: gas_stations_station_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gas_stations_station_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gas_stations_station_id_seq OWNER TO postgres;

--
-- Name: gas_stations_station_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gas_stations_station_id_seq OWNED BY public.gas_stations.station_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying NOT NULL,
    role character varying(10) NOT NULL,
    status character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: fuel_prices price_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fuel_prices ALTER COLUMN price_id SET DEFAULT nextval('public.fuel_prices_price_id_seq'::regclass);


--
-- Name: gas_stations station_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gas_stations ALTER COLUMN station_id SET DEFAULT nextval('public.gas_stations_station_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: fuel_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fuel_prices (price_id, station_id, fuel_type, price_per_liter, date_updated, time_updated, status, updated_by) FROM stdin;
2	1	Diesel	57.80	2026-09-24	13:55:10.424914	active	\N
3	1	Premium Gasoline	68.75	2026-09-24	13:55:10.424914	active	\N
4	2	Gasoline	63.10	2026-09-24	13:55:10.424914	active	\N
5	2	Diesel	58.20	2026-09-24	13:55:10.424914	active	\N
6	2	Premium Gasoline	69.50	2026-09-24	13:55:10.424914	active	\N
7	3	Gasoline	61.90	2026-09-24	13:55:10.424914	active	\N
8	3	Diesel	56.95	2026-09-24	13:55:10.424914	active	\N
9	3	Premium Gasoline	67.80	2026-09-24	13:55:10.424914	active	\N
10	4	Gasoline	62.75	2026-09-24	13:55:10.424914	active	\N
11	4	Diesel	57.50	2026-09-24	13:55:10.424914	active	\N
12	4	Premium Gasoline	68.90	2026-09-24	13:55:10.424914	active	\N
13	5	Gasoline	63.40	2026-09-24	13:55:10.424914	active	\N
14	5	Diesel	58.50	2026-09-24	13:55:10.424914	active	\N
15	5	Premium Gasoline	70.00	2026-09-24	13:55:10.424914	active	\N
16	6	Gasoline	61.50	2026-09-24	13:55:10.424914	active	\N
17	6	Diesel	56.75	2026-09-24	13:55:10.424914	active	\N
18	6	Premium Gasoline	67.25	2026-09-24	13:55:10.424914	active	\N
19	7	Gasoline	61.20	2026-09-24	13:55:10.424914	active	\N
20	7	Diesel	56.50	2026-09-24	13:55:10.424914	active	\N
21	8	Gasoline	62.00	2026-09-24	13:55:10.424914	active	\N
22	8	Diesel	57.25	2026-09-24	13:55:10.424914	active	\N
23	8	Premium Gasoline	68.00	2026-09-24	13:55:10.424914	active	\N
24	9	Gasoline	62.30	2026-09-24	13:55:10.424914	active	\N
25	9	Diesel	57.10	2026-09-24	13:55:10.424914	active	\N
26	10	Gasoline	63.00	2026-09-24	13:55:10.424914	active	\N
27	10	Diesel	58.00	2026-09-24	13:55:10.424914	active	\N
28	10	Premium Gasoline	69.20	2026-09-24	13:55:10.424914	active	\N
1	1	Gasoline	62.50	2026-09-24	13:55:10.424914	inactive	\N
\.


--
-- Data for Name: gas_stations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gas_stations (station_id, name, brand, address, barangay, city, latitude, longitude, contact_info, status, created_at) FROM stdin;
1	Petron BGC	Petron	9th Avenue, Bonifacio Global City	BGC	Taguig City	14.5500000	121.0494000	02-8818-5555	active	2026-09-24 13:55:10.424914+08
2	Shell BGC Station	Shell	5th Avenue corner 26th St, BGC	BGC	Taguig City	14.5485000	121.0520000	02-8819-1234	active	2026-09-24 13:55:10.424914+08
3	Caltex Taguig Central	Caltex	Hagonoy Road, Taguig	Hagonoy	Taguig City	14.5243000	121.0792000	02-8555-7890	active	2026-09-24 13:55:10.424914+08
4	Petron Fort Bonifacio	Petron	Lawton Avenue, Fort Bonifacio	Western Bicutan	Taguig City	14.5100000	121.0590000	02-8817-4321	active	2026-09-24 13:55:10.424914+08
5	Shell McKinley	Shell	McKinley Road, McKinley Hill	McKinley Hill	Taguig City	14.5380000	121.0560000	02-8850-1122	active	2026-09-24 13:55:10.424914+08
6	Unioil Taguig	Unioil	Bayani Road, Western Bicutan	Western Bicutan	Taguig City	14.5060000	121.0500000	02-8551-9900	active	2026-09-24 13:55:10.424914+08
7	Phoenix Taguig	Phoenix	Signal Village, Taguig	Signal Village	Taguig City	14.5170000	121.0700000	02-8556-3344	active	2026-09-24 13:55:10.424914+08
8	Caltex BGC North	Caltex	28th Street, Bonifacio Global City	BGC	Taguig City	14.5530000	121.0510000	02-8818-6677	active	2026-09-24 13:55:10.424914+08
9	Petron Upper Bicutan	Petron	Katuparan Road, Upper Bicutan	Upper Bicutan	Taguig City	14.5010000	121.0650000	02-8552-8877	active	2026-09-24 13:55:10.424914+08
10	Shell Ususan	Shell	Ususan Road, Ususan	Ususan	Taguig City	14.4900000	121.0730000	02-8553-5566	active	2026-09-24 13:55:10.424914+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, full_name, email, password_hash, role, status, created_at) FROM stdin;
1	Super Admin	admin@fuelfinder.ph	$2b$12$gj4SnTmDQq1PZrvrtrbIMu/9U9x9wvfkzt5/OqEy67g3qALEN140i	admin	active	2026-09-24 05:29:09.506392+08
2	Default User	user@fuelfinder.ph	$2b$12$pA2CD0WZGTPdXE2TeQuyGewSjeZWivOtxavPtM1c54ccP2IVk5ZYa	user	active	2026-09-24 13:40:55.197034+08
3	Test	test@gmail.com	$2b$12$JwF8ozSOlyvuupZtcTHj4e38O8tBvbbeo059gQI60V/NLD4iVWk6m	user	active	2026-09-24 14:25:09.325917+08
\.


--
-- Name: fuel_prices_price_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fuel_prices_price_id_seq', 29, true);


--
-- Name: gas_stations_station_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gas_stations_station_id_seq', 10, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 3, true);


--
-- Name: fuel_prices fuel_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_pkey PRIMARY KEY (price_id);


--
-- Name: gas_stations gas_stations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gas_stations
    ADD CONSTRAINT gas_stations_pkey PRIMARY KEY (station_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: ix_fuel_prices_price_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_fuel_prices_price_id ON public.fuel_prices USING btree (price_id);


--
-- Name: ix_gas_stations_station_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gas_stations_station_id ON public.gas_stations USING btree (station_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_user_id ON public.users USING btree (user_id);


--
-- Name: fuel_prices fuel_prices_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.gas_stations(station_id) ON DELETE CASCADE;


--
-- Name: fuel_prices fuel_prices_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict ViZsRkxYIXF6AxQbud5OCGMIdyCKk79w7Dadh4WnhnGENeUOCr9zy75NpOGuvZT


--
-- PostgreSQL database dump
--

\restrict i6Bhxv5M7dxhf3ZSyRdT31aHX9qPCgQ2qr728ZuQBUVjRrsa9OA1UaeAZv8fQU5

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

ALTER TABLE IF EXISTS ONLY "public"."switch_ports" DROP CONSTRAINT IF EXISTS "switch_ports_device_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."port_connections" DROP CONSTRAINT IF EXISTS "port_connections_switch_port_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."port_connections" DROP CONSTRAINT IF EXISTS "port_connections_remote_port_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."port_connections" DROP CONSTRAINT IF EXISTS "port_connections_connected_device_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."devices" DROP CONSTRAINT IF EXISTS "devices_floor_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."device_status_history" DROP CONSTRAINT IF EXISTS "device_status_history_device_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."device_software" DROP CONSTRAINT IF EXISTS "device_software_software_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."device_software" DROP CONSTRAINT IF EXISTS "device_software_device_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."device_details" DROP CONSTRAINT IF EXISTS "device_details_device_id_fkey";
DROP INDEX IF EXISTS "public"."idx_switch_ports_device_id";
DROP INDEX IF EXISTS "public"."idx_software_license_expiry";
DROP INDEX IF EXISTS "public"."idx_port_connections_switch_port_id";
DROP INDEX IF EXISTS "public"."idx_port_connections_remote_port_id";
DROP INDEX IF EXISTS "public"."idx_port_connections_one_active_per_remote_port";
DROP INDEX IF EXISTS "public"."idx_port_connections_one_active_per_port";
DROP INDEX IF EXISTS "public"."idx_port_connections_connected_device_id";
DROP INDEX IF EXISTS "public"."idx_hardware_warranty_expiry";
DROP INDEX IF EXISTS "public"."idx_devices_type";
DROP INDEX IF EXISTS "public"."idx_devices_status";
DROP INDEX IF EXISTS "public"."idx_devices_ip_address";
DROP INDEX IF EXISTS "public"."idx_devices_floor_id";
DROP INDEX IF EXISTS "public"."idx_device_status_history_device_id";
DROP INDEX IF EXISTS "public"."idx_device_software_unique";
DROP INDEX IF EXISTS "public"."idx_device_details_warranty_expiry";
DROP INDEX IF EXISTS "public"."idx_device_details_install_date";
DROP INDEX IF EXISTS "public"."idx_audit_logs_entity";
DROP INDEX IF EXISTS "public"."idx_audit_logs_created_at";
ALTER TABLE IF EXISTS ONLY "public"."switch_ports" DROP CONSTRAINT IF EXISTS "switch_ports_pkey";
ALTER TABLE IF EXISTS ONLY "public"."switch_ports" DROP CONSTRAINT IF EXISTS "switch_ports_device_id_port_number_key";
ALTER TABLE IF EXISTS ONLY "public"."software" DROP CONSTRAINT IF EXISTS "software_pkey";
ALTER TABLE IF EXISTS ONLY "public"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "public"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_filename_key";
ALTER TABLE IF EXISTS ONLY "public"."port_connections" DROP CONSTRAINT IF EXISTS "port_connections_pkey";
ALTER TABLE IF EXISTS ONLY "public"."hardware" DROP CONSTRAINT IF EXISTS "hardware_pkey";
ALTER TABLE IF EXISTS ONLY "public"."floors" DROP CONSTRAINT IF EXISTS "floors_pkey";
ALTER TABLE IF EXISTS ONLY "public"."devices" DROP CONSTRAINT IF EXISTS "devices_pkey";
ALTER TABLE IF EXISTS ONLY "public"."device_status_history" DROP CONSTRAINT IF EXISTS "device_status_history_pkey";
ALTER TABLE IF EXISTS ONLY "public"."device_software" DROP CONSTRAINT IF EXISTS "device_software_pkey";
ALTER TABLE IF EXISTS ONLY "public"."device_details" DROP CONSTRAINT IF EXISTS "device_details_pkey";
ALTER TABLE IF EXISTS ONLY "public"."audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_pkey";
ALTER TABLE IF EXISTS "public"."switch_ports" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."software" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."schema_migrations" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."port_connections" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."hardware" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."floors" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."devices" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."device_status_history" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."device_software" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."audit_logs" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "public"."switch_ports_id_seq";
DROP TABLE IF EXISTS "public"."switch_ports";
DROP SEQUENCE IF EXISTS "public"."software_id_seq";
DROP TABLE IF EXISTS "public"."software";
DROP SEQUENCE IF EXISTS "public"."schema_migrations_id_seq";
DROP TABLE IF EXISTS "public"."schema_migrations";
DROP SEQUENCE IF EXISTS "public"."port_connections_id_seq";
DROP TABLE IF EXISTS "public"."port_connections";
DROP SEQUENCE IF EXISTS "public"."hardware_id_seq";
DROP TABLE IF EXISTS "public"."hardware";
DROP SEQUENCE IF EXISTS "public"."floors_id_seq";
DROP TABLE IF EXISTS "public"."floors";
DROP SEQUENCE IF EXISTS "public"."devices_id_seq";
DROP TABLE IF EXISTS "public"."devices";
DROP SEQUENCE IF EXISTS "public"."device_status_history_id_seq";
DROP TABLE IF EXISTS "public"."device_status_history";
DROP SEQUENCE IF EXISTS "public"."device_software_id_seq";
DROP TABLE IF EXISTS "public"."device_software";
DROP TABLE IF EXISTS "public"."device_details";
DROP SEQUENCE IF EXISTS "public"."audit_logs_id_seq";
DROP TABLE IF EXISTS "public"."audit_logs";
--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."audit_logs" (
    "id" integer NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" integer NOT NULL,
    "action" character varying(50) NOT NULL,
    "actor_name" character varying(255),
    "changes" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."audit_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";


--
-- Name: device_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."device_details" (
    "device_id" integer NOT NULL,
    "os" character varying(255),
    "ram" character varying(255),
    "disk_space" character varying(255),
    "device_age" character varying(255),
    "serial_number" character varying(255),
    "warranty_expiry" "date",
    "location" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_name" character varying(255),
    "install_date" "date",
    "manufacturer" character varying(255)
);


--
-- Name: device_software; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."device_software" (
    "id" integer NOT NULL,
    "device_id" integer NOT NULL,
    "software_id" integer NOT NULL
);


--
-- Name: device_software_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."device_software_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_software_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."device_software_id_seq" OWNED BY "public"."device_software"."id";


--
-- Name: device_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."device_status_history" (
    "id" integer NOT NULL,
    "device_id" integer NOT NULL,
    "previous_status" character varying(50),
    "new_status" character varying(50) NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_name" character varying(255),
    "metadata" "jsonb"
);


--
-- Name: device_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."device_status_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."device_status_history_id_seq" OWNED BY "public"."device_status_history"."id";


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."devices" (
    "id" integer NOT NULL,
    "name" character varying(255),
    "ip_address" character varying(255),
    "type" character varying(255),
    "status" character varying(50) DEFAULT 'Active'::character varying,
    "x_position" double precision,
    "y_position" double precision,
    "floor_id" integer,
    "icon" character varying(32) DEFAULT '­ƒÆ╗'::character varying
);


--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."devices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."devices_id_seq" OWNED BY "public"."devices"."id";


--
-- Name: floors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."floors" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text"
);


--
-- Name: floors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."floors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: floors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."floors_id_seq" OWNED BY "public"."floors"."id";


--
-- Name: hardware; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."hardware" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "type" character varying(255) NOT NULL,
    "manufacturer" character varying(255),
    "model" character varying(255),
    "purchase_date" "date",
    "cost" character varying(255),
    "warranty_expiry" "date",
    "status" character varying(50) DEFAULT 'Active'::character varying,
    "location" character varying(255)
);


--
-- Name: hardware_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."hardware_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hardware_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."hardware_id_seq" OWNED BY "public"."hardware"."id";


--
-- Name: port_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."port_connections" (
    "id" integer NOT NULL,
    "switch_port_id" integer NOT NULL,
    "connected_device_id" integer,
    "remote_port_id" integer,
    "cable_label" character varying(255),
    "notes" "text",
    "connected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "disconnected_at" timestamp with time zone,
    CONSTRAINT "chk_port_connection_endpoint" CHECK ((("connected_device_id" IS NOT NULL) OR ("remote_port_id" IS NOT NULL)))
);


--
-- Name: port_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."port_connections_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: port_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."port_connections_id_seq" OWNED BY "public"."port_connections"."id";


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."schema_migrations" (
    "id" integer NOT NULL,
    "filename" character varying(255) NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."schema_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."schema_migrations_id_seq" OWNED BY "public"."schema_migrations"."id";


--
-- Name: software; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."software" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "version" character varying(255),
    "vendor" character varying(255) NOT NULL,
    "license_type" character varying(255),
    "license_expiry" "date",
    "installed_on" character varying(255),
    "installation_date" "date"
);


--
-- Name: software_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."software_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: software_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."software_id_seq" OWNED BY "public"."software"."id";


--
-- Name: switch_ports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."switch_ports" (
    "id" integer NOT NULL,
    "device_id" integer NOT NULL,
    "port_number" character varying(20) NOT NULL,
    "label" character varying(255),
    "speed" character varying(50),
    "vlan_id" integer,
    "port_type" character varying(50) DEFAULT 'copper'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: switch_ports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."switch_ports_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: switch_ports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."switch_ports_id_seq" OWNED BY "public"."switch_ports"."id";


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_id_seq"'::"regclass");


--
-- Name: device_software id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_software" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."device_software_id_seq"'::"regclass");


--
-- Name: device_status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_status_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."device_status_history_id_seq"'::"regclass");


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."devices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."devices_id_seq"'::"regclass");


--
-- Name: floors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."floors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."floors_id_seq"'::"regclass");


--
-- Name: hardware id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."hardware" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."hardware_id_seq"'::"regclass");


--
-- Name: port_connections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."port_connections" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."port_connections_id_seq"'::"regclass");


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."schema_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schema_migrations_id_seq"'::"regclass");


--
-- Name: software id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."software" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."software_id_seq"'::"regclass");


--
-- Name: switch_ports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."switch_ports" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."switch_ports_id_seq"'::"regclass");


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."audit_logs" ("id", "entity_type", "entity_id", "action", "actor_name", "changes", "metadata", "created_at") FROM stdin;
1	device	1	created	system	{"after": {"id": 1, "os": "Windows 11", "ram": "16", "icon": "­ƒûÑ´©Å", "name": "Home pc", "type": "PC", "status": "Active", "floor_id": null, "location": "Home", "user_name": "Irakli", "device_age": "0", "disk_space": "512G", "ip_address": "192.168.1.1", "x_position": 100, "y_position": 100, "install_date": "2026-04-19T00:00:00.000Z", "serial_number": "12345"}}	{"ip": "::ffff:172.18.0.1", "path": "/api/devices", "method": "POST"}	2026-04-19 18:37:08.878349+00
2	device	1	moved_or_updated	system	{"x_position": {"after": 310, "before": 100}, "y_position": {"after": 205, "before": 100}}	{"ip": "::ffff:172.18.0.1", "path": "/api/devices/1", "method": "PUT"}	2026-04-19 18:37:16.95639+00
3	device	1	moved_or_updated	system	{"x_position": {"after": 304, "before": 310}, "y_position": {"after": 203, "before": 205}}	{"ip": "::ffff:172.18.0.1", "path": "/api/devices/1", "method": "PUT"}	2026-04-19 18:37:20.339168+00
4	device	1	moved_or_updated	system	{"y_position": {"after": 190, "before": 203}}	{"ip": "::ffff:172.18.0.1", "path": "/api/devices/1", "method": "PUT"}	2026-04-19 18:54:18.562512+00
5	device	2	created	system	{"after": {"id": 2, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 19:57:32.318095+00
6	device	2	deleted	system	{"before": {"id": 2, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/2", "method": "DELETE"}	2026-05-02 19:59:10.605683+00
7	device	3	created	system	{"after": {"id": 3, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 19:59:12.263347+00
8	device	4	created	system	{"after": {"id": 4, "os": null, "ram": null, "icon": "­ƒø£", "name": "amazon-7566b242e", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.6", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 19:59:13.818897+00
9	device	5	created	system	{"after": {"id": 5, "os": null, "ram": null, "icon": "­ƒø£", "name": "MyRouter.home", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.254", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 19:59:14.987041+00
10	device	3	moved_or_updated	system	{"x_position": {"after": 100, "before": null}, "y_position": {"after": 100, "before": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/3", "method": "PUT"}	2026-05-02 19:59:36.80298+00
11	device	3	moved_or_updated	system	{"x_position": {"after": 199, "before": 100}, "y_position": {"after": 189, "before": 100}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/3", "method": "PUT"}	2026-05-02 19:59:43.500334+00
12	device	1	moved_or_updated	system	{"x_position": {"after": 300, "before": 304}, "y_position": {"after": 185, "before": 190}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/1", "method": "PUT"}	2026-05-02 19:59:57.242359+00
13	device	3	moved_or_updated	system	{"x_position": {"after": 234, "before": 199}, "y_position": {"after": 187, "before": 189}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/3", "method": "PUT"}	2026-05-02 19:59:58.521399+00
14	device	6	created	system	{"after": {"id": 6, "os": null, "ram": null, "icon": "­ƒÆ╗", "name": "1516", "type": null, "status": "Active", "floor_id": null, "location": null, "user_name": null, "device_age": null, "disk_space": null, "ip_address": null, "x_position": 232, "y_position": 155, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 20:00:06.694517+00
15	device	7	created	system	{"after": {"id": 7, "os": null, "ram": null, "icon": "­ƒôí", "name": "host.docker.internal", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.11", "x_position": null, "y_position": null, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 20:00:32.334524+00
16	device	3	moved_or_updated	system	{"x_position": {"after": 221, "before": 234}, "y_position": {"after": 183, "before": 187}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/3", "method": "PUT"}	2026-05-02 20:00:49.960407+00
17	device	7	deleted	system	{"before": {"id": 7, "os": null, "ram": null, "icon": "­ƒôí", "name": "host.docker.internal", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.11", "x_position": null, "y_position": null, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/7", "method": "DELETE"}	2026-05-02 20:00:55.522843+00
18	device	6	deleted	system	{"before": {"id": 6, "os": null, "ram": null, "icon": "­ƒÆ╗", "name": "1516", "type": null, "status": "Active", "floor_id": null, "location": null, "user_name": null, "device_age": null, "disk_space": null, "ip_address": null, "x_position": 232, "y_position": 155, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/6", "method": "DELETE"}	2026-05-02 20:00:57.178252+00
19	device	5	deleted	system	{"before": {"id": 5, "os": null, "ram": null, "icon": "­ƒø£", "name": "MyRouter.home", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.254", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/5", "method": "DELETE"}	2026-05-02 20:00:57.5471+00
20	device	4	deleted	system	{"before": {"id": 4, "os": null, "ram": null, "icon": "­ƒø£", "name": "amazon-7566b242e", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.6", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/4", "method": "DELETE"}	2026-05-02 20:00:57.904542+00
21	device	3	deleted	system	{"before": {"id": 3, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": 221, "y_position": 183, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/3", "method": "DELETE"}	2026-05-02 20:00:58.257986+00
22	device	8	created	system	{"after": {"id": 8, "os": null, "ram": null, "icon": "­ƒôí", "name": "host.docker.internal", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.11", "x_position": null, "y_position": null, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 20:01:21.795292+00
23	device	8	deleted	system	{"before": {"id": 8, "os": null, "ram": null, "icon": "­ƒôí", "name": "host.docker.internal", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.11", "x_position": null, "y_position": null, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/8", "method": "DELETE"}	2026-05-02 20:03:06.691262+00
24	device	9	created	system	{"after": {"id": 9, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 20:03:13.157715+00
25	device	9	deleted	system	{"before": {"id": 9, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": null, "y_position": null, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/9", "method": "DELETE"}	2026-05-02 20:05:51.367498+00
26	device	10	created	system	{"after": {"id": 10, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": 600, "y_position": 350, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 20:05:58.137271+00
27	device	10	moved_or_updated	system	{"x_position": {"after": 185, "before": 600}, "y_position": {"after": 271, "before": 350}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/10", "method": "PUT"}	2026-05-02 20:06:03.188828+00
28	device	11	created	system	{"after": {"id": 11, "os": null, "ram": null, "icon": "­ƒø£", "name": "amazon-7566b242e", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.6", "x_position": 600, "y_position": 350, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-02 20:06:12.589422+00
29	device	11	moved_or_updated	system	{"x_position": {"after": 135, "before": 600}, "y_position": {"after": 270, "before": 350}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/11", "method": "PUT"}	2026-05-02 20:06:18.683817+00
30	device	11	moved_or_updated	system	{"x_position": {"after": 138, "before": 135}, "y_position": {"after": 271, "before": 270}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/11", "method": "PUT"}	2026-05-02 20:06:21.194223+00
31	device	11	deleted	system	{"before": {"id": 11, "os": null, "ram": null, "icon": "­ƒø£", "name": "amazon-7566b242e", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.6", "x_position": 138, "y_position": 271, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/11", "method": "DELETE"}	2026-05-08 17:57:23.973198+00
32	device	10	deleted	system	{"before": {"id": 10, "os": null, "ram": null, "icon": "­ƒø£", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": 185, "y_position": 271, "install_date": null, "manufacturer": "Unknown", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/10", "method": "DELETE"}	2026-05-08 17:57:25.528542+00
33	device	1	deleted	system	{"before": {"id": 1, "os": "Windows 11", "ram": "16", "icon": "­ƒûÑ´©Å", "name": "Home pc", "type": "PC", "status": "Active", "floor_id": null, "location": "Home", "user_name": "Irakli", "device_age": "0", "disk_space": "512G", "ip_address": "192.168.1.1", "x_position": 300, "y_position": 185, "install_date": "2026-04-18T23:00:00.000Z", "manufacturer": null, "serial_number": "12345"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/1", "method": "DELETE"}	2026-05-08 18:14:02.207483+00
34	device	12	created	system	{"after": {"id": 12, "os": null, "ram": null, "icon": "­ƒôí", "name": "iPhone", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.3", "x_position": 600, "y_position": 350, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-08 18:14:24.791197+00
35	device	12	updated	system	{"icon": {"after": "­ƒô▒", "before": "­ƒôí"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:14:36.482756+00
36	device	12	moved_or_updated	system	{"x_position": {"after": 195, "before": 600}, "y_position": {"after": 276, "before": 350}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:14:44.677138+00
37	device	12	moved_or_updated	system	{"y_position": {"after": 277, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:14:49.297449+00
38	software	1	created	system	{"after": {"id": 1, "name": "qwq", "vendor": "wer", "version": "qeqw", "installed_on": "wer", "license_type": "wer", "license_expiry": null, "installation_date": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/software", "method": "POST"}	2026-05-08 18:25:20.303385+00
39	device	12	moved_or_updated	system	{"x_position": {"after": 202, "before": 195}, "y_position": {"after": 278, "before": 277}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:26:31.368439+00
40	device	13	created	system	{"after": {"id": 13, "os": "ewr", "ram": "wer", "icon": "­ƒûÑ´©Å", "name": "wewer", "type": "PC", "status": "Inactive", "floor_id": null, "location": null, "user_name": "ewr", "device_age": "wer", "disk_space": "wer", "ip_address": "ewrew", "x_position": 140, "y_position": 281, "install_date": null, "manufacturer": "werew", "serial_number": "wer"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-08 18:27:09.544269+00
41	device	13	moved_or_updated	system	{"x_position": {"after": 139, "before": 140}, "y_position": {"after": 280, "before": 281}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-08 18:27:14.495748+00
42	device	13	moved_or_updated	system	{"x_position": {"after": 180, "before": 139}, "y_position": {"after": 278, "before": 280}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-08 18:28:16.167392+00
43	device	13	moved_or_updated	system	{"x_position": {"after": 219, "before": 180}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-08 18:28:22.716496+00
44	device	12	moved_or_updated	system	{"x_position": {"after": 213, "before": 202}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:28:27.571785+00
45	device	12	moved_or_updated	system	{"x_position": {"after": 211, "before": 213}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:28:37.77738+00
46	device	12	moved_or_updated	system	{"x_position": {"after": 148, "before": 211}, "y_position": {"after": 277, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "PUT"}	2026-05-08 18:28:41.789216+00
47	device	12	bulk_updated	system	{"status": {"after": "Inactive", "before": "Active"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/bulk-update", "method": "POST"}	2026-05-09 11:45:49.083787+00
48	device	13	bulk_updated	system	{"status": {"after": "Active", "before": "Inactive"}, "location": {"after": "Office", "before": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/bulk-update", "method": "POST"}	2026-05-09 11:46:24.29148+00
49	device	14	created	system	{"after": {"id": 14, "os": null, "ram": null, "icon": "­ƒôí", "name": "LGwebOSTV", "type": "Other", "status": "Active", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.2", "x_position": 600, "y_position": 350, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-09 12:10:34.042262+00
50	device	14	moved_or_updated	system	{"x_position": {"after": 205, "before": 600}, "y_position": {"after": 305, "before": 350}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/14", "method": "PUT"}	2026-05-09 12:12:47.156235+00
51	hardware	1	created	system	{"after": {"id": 1, "cost": "sfgsfg", "name": "sgs", "type": "sfgs", "model": "sgs", "status": "Inactive", "location": "sfgsfg", "manufacturer": "gsfgf", "purchase_date": null, "warranty_expiry": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/hardware", "method": "POST"}	2026-05-16 18:15:30.40334+00
52	device	15	created	system	{"after": {"id": 15, "os": null, "ram": null, "icon": "­ƒôí", "name": null, "type": "Switch", "status": "Active", "floor_id": null, "location": null, "user_name": null, "device_age": null, "disk_space": null, "ip_address": "asdasd", "x_position": 231, "y_position": 210, "install_date": null, "manufacturer": "asdasd", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-21 18:04:32.125207+00
53	device	15	moved_or_updated	system	{"x_position": {"after": 190, "before": 231}, "y_position": {"after": 213, "before": 210}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:04:38.975065+00
54	device	15	moved_or_updated	system	{"x_position": {"after": 145, "before": 190}, "y_position": {"after": 279, "before": 213}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:10:12.817917+00
55	device	15	moved_or_updated	system	{"x_position": {"after": 219, "before": 145}, "y_position": {"after": 275, "before": 279}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:10:17.468219+00
56	device	15	moved_or_updated	system	{"x_position": {"after": 177, "before": 219}, "y_position": {"after": 268, "before": 275}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:10:19.554729+00
57	device	15	moved_or_updated	system	{"x_position": {"after": 182, "before": 177}, "y_position": {"after": 276, "before": 268}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:43:06.961384+00
58	device	15	moved_or_updated	system	{"x_position": {"after": 174, "before": 182}, "y_position": {"after": 266, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:43:07.598494+00
59	device	16	created	system	{"after": {"id": 16, "os": null, "ram": null, "icon": "­ƒÆ╗", "name": "ergert", "type": "Switch", "status": "Active", "floor_id": null, "location": "sgb", "user_name": null, "device_age": null, "disk_space": null, "ip_address": null, "x_position": 200, "y_position": 267, "install_date": null, "manufacturer": "ghrtwsb", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}	2026-05-21 18:43:22.276249+00
60	device	16	moved_or_updated	system	{"x_position": {"after": 174, "before": 200}, "y_position": {"after": 266, "before": 267}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:43:29.021382+00
61	device	15	moved_or_updated	system	{"x_position": {"after": 190, "before": 174}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:43:30.021266+00
62	device	16	moved_or_updated	system	{"x_position": {"after": 189, "before": 174}, "y_position": {"after": 267, "before": 266}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:43:30.985264+00
63	device	15	moved_or_updated	system	{"x_position": {"after": 180, "before": 190}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:43:31.821098+00
64	device	16	moved_or_updated	system	{"x_position": {"after": 191, "before": 189}, "y_position": {"after": 266, "before": 267}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:43:33.019932+00
65	device	16	updated	system	{"icon": {"after": "­ƒôí", "before": "­ƒÆ╗"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:43:43.694968+00
66	device	15	moved_or_updated	system	{"x_position": {"after": 174, "before": 180}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "PUT"}	2026-05-21 18:45:06.416352+00
67	device	16	moved_or_updated	system	{"x_position": {"after": 193, "before": 191}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:45:09.112593+00
68	device	16	moved_or_updated	system	{"x_position": {"after": 180, "before": 193}, "y_position": {"after": 271, "before": 266}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:09.133368+00
69	device	16	moved_or_updated	system	{"x_position": {"after": 173, "before": 180}, "y_position": {"after": 281, "before": 271}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:10.266481+00
70	device	16	moved_or_updated	system	{"x_position": {"after": 194, "before": 173}, "y_position": {"after": 265, "before": 281}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:11.687096+00
71	device	16	moved_or_updated	system	{"x_position": {"after": 183, "before": 194}, "y_position": {"after": 274, "before": 265}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:37.457854+00
72	device	16	moved_or_updated	system	{"x_position": {"after": 182, "before": 183}, "y_position": {"after": 280, "before": 274}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:38.379768+00
73	device	16	moved_or_updated	system	{"x_position": {"after": 201, "before": 182}, "y_position": {"after": 269, "before": 280}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:39.436233+00
74	device	16	moved_or_updated	system	{"x_position": {"after": 217, "before": 201}, "y_position": {"after": 266, "before": 269}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:40.318256+00
75	device	16	moved_or_updated	system	{"x_position": {"after": 221, "before": 217}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:41.252708+00
76	device	16	moved_or_updated	system	{"x_position": {"after": 212, "before": 221}, "y_position": {"after": 265, "before": 266}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:42.148491+00
77	device	16	moved_or_updated	system	{"x_position": {"after": 183, "before": 212}, "y_position": {"after": 276, "before": 265}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:43.518215+00
78	device	16	moved_or_updated	system	{"x_position": {"after": 182, "before": 183}, "y_position": {"after": 282, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:44.527023+00
79	device	16	moved_or_updated	system	{"x_position": {"after": 191, "before": 182}, "y_position": {"after": 272, "before": 282}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-21 18:50:45.367708+00
80	device	13	moved_or_updated	system	{"x_position": {"after": 213, "before": 219}, "y_position": {"after": 287, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-21 18:50:46.373714+00
81	device	13	moved_or_updated	system	{"x_position": {"after": 227, "before": 213}, "y_position": {"after": 278, "before": 287}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-21 18:50:47.23254+00
82	device	13	moved_or_updated	system	{"x_position": {"after": 226, "before": 227}, "y_position": {"after": 270, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-21 18:50:48.104621+00
83	device	13	moved_or_updated	system	{"x_position": {"after": 223, "before": 226}, "y_position": {"after": 272, "before": 270}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 12:47:11.784594+00
84	device	16	moved_or_updated	system	{"x_position": {"after": 220, "before": 191}, "y_position": {"after": 279, "before": 272}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 18:57:23.070128+00
85	device	16	moved_or_updated	system	{"x_position": {"after": 203, "before": 220}, "y_position": {"after": 276, "before": 279}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 18:57:24.173198+00
86	device	13	moved_or_updated	system	{"y_position": {"after": 276, "before": 272}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 18:57:25.52397+00
87	device	16	moved_or_updated	system	{"x_position": {"after": 236, "before": 203}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 18:59:16.495091+00
88	device	16	moved_or_updated	system	{"x_position": {"after": 232, "before": 236}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 18:59:17.760392+00
89	device	16	moved_or_updated	system	{"x_position": {"after": 236, "before": 232}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 18:59:19.21317+00
90	device	16	moved_or_updated	system	{"x_position": {"after": 233, "before": 236}, "y_position": {"after": 274, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:02:59.788934+00
91	device	16	moved_or_updated	system	{"x_position": {"after": 224, "before": 233}, "y_position": {"after": 276, "before": 274}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:03:41.507352+00
92	device	13	moved_or_updated	system	{"x_position": {"after": 228, "before": 223}, "y_position": {"after": 274, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:03:43.377864+00
93	device	13	moved_or_updated	system	{"x_position": {"after": 232, "before": 228}, "y_position": {"after": 275, "before": 274}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:03:44.920772+00
94	device	16	moved_or_updated	system	{"x_position": {"after": 225, "before": 224}, "y_position": {"after": 274, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:03:46.051391+00
95	device	13	moved_or_updated	system	{"x_position": {"after": 226, "before": 232}, "y_position": {"after": 276, "before": 275}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:03:47.095929+00
96	device	16	moved_or_updated	system	{"x_position": {"after": 234, "before": 225}, "y_position": {"after": 275, "before": 274}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:03:48.751005+00
97	device	13	moved_or_updated	system	{"x_position": {"after": 228, "before": 226}, "y_position": {"after": 275, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:03:50.083851+00
98	device	16	moved_or_updated	system	{"x_position": {"after": 235, "before": 234}, "y_position": {"after": 274, "before": 275}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:03:51.112755+00
99	device	16	moved_or_updated	system	{"x_position": {"after": 223, "before": 235}, "y_position": {"after": 280, "before": 274}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:04:14.965585+00
100	device	13	updated	system	{"icon": {"after": "´┐¢", "before": "­ƒûÑ´©Å"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:08:14.840113+00
101	device	13	moved_or_updated	system	{"x_position": {"after": 233, "before": 228}, "y_position": {"after": 276, "before": 275}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:12:15.10423+00
102	device	13	updated	system	{"icon": {"after": "­ƒûÑ´©Å", "before": "´┐¢"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:16:11.605923+00
103	device	13	moved_or_updated	system	{"x_position": {"after": 207, "before": 233}, "y_position": {"after": 278, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-05-31 19:16:16.388033+00
104	device	16	moved_or_updated	system	{"x_position": {"after": 227, "before": 223}, "y_position": {"after": 276, "before": 280}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:16:18.171706+00
105	device	16	moved_or_updated	system	{"x_position": {"after": 230, "before": 227}, "y_position": {"after": 278, "before": 276}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:16:19.880476+00
106	device	16	moved_or_updated	system	{"y_position": {"after": 277, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:18:53.646322+00
107	device	16	moved_or_updated	system	{"x_position": {"after": 229, "before": 230}, "y_position": {"after": 280, "before": 277}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:19:33.236608+00
108	device	16	moved_or_updated	system	{"x_position": {"after": 230, "before": 229}, "y_position": {"after": 279, "before": 280}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:19:34.171892+00
109	device	16	moved_or_updated	system	{"x_position": {"after": 231, "before": 230}, "y_position": {"after": 277, "before": 279}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:19:35.230755+00
110	device	16	moved_or_updated	system	{"x_position": {"after": 232, "before": 231}, "y_position": {"after": 278, "before": 277}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:19:36.066229+00
111	device	16	moved_or_updated	system	{"x_position": {"after": 226, "before": 232}, "y_position": {"after": 281, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:29:23.856106+00
112	device	16	moved_or_updated	system	{"x_position": {"after": 229, "before": 226}, "y_position": {"after": 277, "before": 281}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:29:24.804155+00
113	device	16	moved_or_updated	system	{"x_position": {"after": 228, "before": 229}, "y_position": {"after": 279, "before": 277}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:29:25.663246+00
114	device	16	moved_or_updated	system	{"x_position": {"after": 209, "before": 228}, "y_position": {"after": 271, "before": 279}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:29:34.5532+00
115	device	16	moved_or_updated	system	{"x_position": {"after": 224, "before": 209}, "y_position": {"after": 277, "before": 271}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:29:36.019215+00
116	device	16	moved_or_updated	system	{"x_position": {"after": 226, "before": 224}, "y_position": {"after": 278, "before": 277}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-05-31 19:29:36.916193+00
117	device	16	moved_or_updated	system	{"x_position": {"after": 225, "before": 226}, "y_position": {"after": 279, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-09-26 11:10:00.203912+00
118	device	13	moved_or_updated	system	{"x_position": {"after": 215, "before": 207}, "y_position": {"after": 264, "before": 278}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-09-26 11:14:10.522416+00
119	device	16	moved_or_updated	system	{"x_position": {"after": 216, "before": 225}, "y_position": {"after": 280, "before": 279}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "PUT"}	2026-09-26 11:14:17.705863+00
120	device	13	moved_or_updated	system	{"x_position": {"after": 211, "before": 215}, "y_position": {"after": 269, "before": 264}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-09-26 11:14:19.806887+00
121	device	13	moved_or_updated	system	{"x_position": {"after": 209, "before": 211}, "y_position": {"after": 270, "before": 269}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "PUT"}	2026-09-26 11:14:21.320364+00
122	device	17	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-183", "type": "PC", "status": "Active", "location": "B1 DHR", "user_name": "Anna Kwiatkowska", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
123	device	18	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-172", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Kate O'Meara", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP 400 Desk Pro G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
124	device	19	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-215", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Marco Patrocino", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
125	device	20	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-406", "type": "PC", "status": "Active", "location": "B1 DHR", "user_name": "Karolina Szoja", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
126	device	21	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-299", "type": "PC", "status": "Active", "location": "B1 DHR", "user_name": "Colin Dobey", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
127	device	22	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-295", "type": "PC", "status": "Active", "location": "B1 DHR", "user_name": "Rebecca Caldovino", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
128	device	23	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-345", "type": "PC", "status": "Active", "location": "B1 DHR", "user_name": "Mary-Rose Mallon", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
129	device	24	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-231", "type": "PC", "status": "Active", "location": "B1 HR", "user_name": "Peter McDonnell", "disk_space": "512GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
130	device	25	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-286", "type": "PC", "status": "Active", "location": "B1 HR", "user_name": "Maja Legin", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
131	device	26	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-181", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Padraic Stephens", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP 400 Pro Desk G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
132	device	27	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-320", "type": "PC", "status": "Active", "location": "B1 Milling", "user_name": "Milling Clocking", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
133	device	28	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-371", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "Laura Eastwood", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
134	device	29	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-192", "type": "PC", "status": "Active", "location": "B1", "user_name": "Patricia Conroy", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
135	device	30	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-296", "type": "PC", "status": "Active", "location": "B1 Shipping", "user_name": "Julia Goliat", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
136	device	31	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-332", "type": "PC", "status": "Active", "location": "B1 Training Room", "user_name": "Etching", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
137	device	32	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-412", "type": "PC", "status": "Active", "location": "B1 Up Stairs", "user_name": "Edward Kenny", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
138	device	33	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-405", "type": "PC", "status": "Active", "location": "B1 Up Stairs", "user_name": "Edward Kenny", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
139	device	34	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-373", "type": "PC", "status": "Active", "location": "B1 Up Stairs", "user_name": "Board Room", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
140	device	35	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-267", "type": "PC", "status": "Active", "location": "B2 Goods Delivered", "user_name": "Larry McDermott", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
141	device	36	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-417", "type": "PC", "status": "Active", "location": "B3", "user_name": "Training Room", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Z2 Mini G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
142	device	37	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-283", "type": "PC", "status": "Active", "location": "B3 Office", "user_name": "Maria Leticia", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
143	device	38	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-287", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Katie Rathbone", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Mini G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
144	device	39	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-187", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Tiago Villar", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
145	device	40	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-410", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Joanna Kasprowicz", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
146	device	41	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-205", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Brian Fahy", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
147	device	42	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-148", "type": "PC", "status": "Active", "location": "B1 Accounting", "user_name": "Dervilia Quinn", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Desktop Pro G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
148	device	43	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-396", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Paul Moisy", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
149	device	44	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-339", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Geraldine Heffernan", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
150	device	45	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-241", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Mike Mockler", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP 400 Pro Desk G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
151	device	46	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-328", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Dara Cunney", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
152	device	47	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-398", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Ballooning Software Only", "disk_space": "512GB", "ip_address": "", "install_date": "", "manufacturer": "Dell", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
153	device	48	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-266", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Clare A. McDermott", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
154	device	49	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-194", "type": "PC", "status": "Active", "location": "B1 Accounting", "user_name": "Anne Reidy", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
155	device	50	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-337", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Caoimhe N?? Cheallaigh", "disk_space": "512GB", "ip_address": "", "install_date": "2023-09-26", "manufacturer": "HP Mini G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
156	device	51	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-245", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Eric Whyte", "disk_space": "512GB", "ip_address": "", "install_date": "2023-09-26", "manufacturer": "HP Mini G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
157	device	52	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-160", "type": "PC", "status": "Active", "location": "B1 Accounting", "user_name": "Ruth Deacy", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
158	device	53	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-365", "type": "PC", "status": "Inactive", "location": "B1 HR", "user_name": "Free PC", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Elitdesk 800 G4 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
159	device	54	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-171", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "Pat Forde", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
160	device	55	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-169", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Training Room (Old Denis Forde)", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Desktop Pro 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
161	device	56	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-404", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
162	device	57	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-393", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "Clodagh Cannon", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
163	device	58	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-407", "type": "PC", "status": "Active", "location": "IT", "user_name": "Karl Leonard (For GSS Testing)", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
164	device	59	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-191", "type": "PC", "status": "Active", "location": "IT", "user_name": "Karl Leonard", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
165	device	60	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-401", "type": "PC", "status": "Active", "location": "IT", "user_name": "Irakli Lomidze", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Min Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
166	device	61	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-182", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "James O'Kane", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
167	device	62	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-338", "type": "PC", "status": "Active", "location": "Quality Manager", "user_name": "Sinead McMahon", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
168	device	63	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-271", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Paul Moisy, Conor", "disk_space": "512GB", "ip_address": "", "install_date": "2021-09-26", "manufacturer": "Dell Precision 3650 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
169	device	64	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-226", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Tool Room Clocking", "disk_space": "512GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
170	device	65	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-247", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Laura Varley", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP 400 Pro Desk G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
171	device	66	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-358", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Noel Cuffy", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Dell Precision 3260 mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
172	device	67	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-253", "type": "PC", "status": "Active", "location": "T&D", "user_name": "ToolRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
173	device	68	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-360", "type": "PC", "status": "Active", "location": "T&D", "user_name": "QC-ASH Camera", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
174	device	69	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-400", "type": "PC", "status": "Active", "location": "T&D", "user_name": "QC-Keyencee", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
175	device	70	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-382", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Arthur Pattar", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
176	device	71	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-391", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Kevin McMahon", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
177	device	72	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-210", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Cillian O'Malley", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP 400 Desk Pro G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
178	device	73	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-363", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Free", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Elitdesk 800 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
179	device	74	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-273", "type": "PC", "status": "Active", "location": "T&D", "user_name": "ToolRoom?", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Dell Precision 3650 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
180	device	75	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-359", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Ronald Belnavis", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Dell Precision 3260 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
181	device	76	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-272", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Martin Devlin", "disk_space": "512GB", "ip_address": "", "install_date": "2021-09-26", "manufacturer": "Dell Precision 3650 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
182	device	77	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-178", "type": "PC", "status": "Active", "location": "B4 Tool Room", "user_name": "Toolroom Clocking", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
183	device	78	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-322", "type": "PC", "status": "Active", "location": "T&D", "user_name": "David Cooke", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P348", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
184	device	79	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-274", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Ronan Mcloughlin", "disk_space": "512GB", "ip_address": "", "install_date": "2021-09-26", "manufacturer": "Dell Precision 3650 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
185	device	80	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-319", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Aidan Mannion", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P348", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
186	device	81	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-237", "type": "PC", "status": "Active", "location": "B4 Tool Room", "user_name": "Martan Conneely", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 SFF G4 Workstation", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
187	device	82	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-415", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Zuzana Mikulova", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
188	device	83	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-414", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Sophie Ronan", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
189	device	84	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-413", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Ola Jurga", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
190	device	85	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-CMM-006", "type": "PC", "status": "Active", "location": "Lathes Pucks B4", "user_name": "Precision 3630 Tower Dell", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "Lathes Pucks", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
191	device	86	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-208", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Rafal Broncel", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
192	device	87	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-364", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Tool Room Clocking", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Elitdesk 800 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
193	device	88	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-230", "type": "PC", "status": "Active", "location": "T&D", "user_name": "WireRoom", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
194	device	89	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-232", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Lukasz Kowalski", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
195	device	90	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-341", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Enda Mulligan", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
196	device	91	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-229", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Thomas Lydon", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
197	device	92	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-324", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Fernanda Pereira", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
198	device	93	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-336", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Ivana Vakova", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
199	device	94	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-216", "type": "PC", "status": "Active", "location": "T&D Officed", "user_name": "Michael Mortimer", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
200	device	95	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-394", "type": "PC", "status": "Active", "location": "T&D Training Room", "user_name": "Training Room", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
201	device	96	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-402", "type": "PC", "status": "Active", "location": "T&D Training Room", "user_name": "Liam", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
202	device	97	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-384", "type": "PC", "status": "Active", "location": "T&D Training Room", "user_name": "Training Room", "disk_space": "512GB", "ip_address": "", "install_date": "2024-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
203	device	98	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-292", "type": "PC", "status": "Active", "location": "Turning B4", "user_name": "Tony Nevin", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Prodesk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
204	device	99	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-303", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Martin Daniels", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "Dell Precision 5820 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
205	device	100	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-343", "type": "PC", "status": "Active", "location": "B1 Reception", "user_name": "Sabrina Mannion", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
206	device	101	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-389", "type": "PC", "status": "Active", "location": "B1 Milling", "user_name": "Filip/Brendan", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
207	device	102	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-351", "type": "PC", "status": "Active", "location": "B1 Milling", "user_name": "Eric La Clos", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Z2 Tower G9 Workstation", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
208	device	103	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-352", "type": "PC", "status": "Active", "location": "B1 Milling", "user_name": "Kevin Lee", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Z2 Tower G9 Workstation", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
209	device	104	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-409", "type": "PC", "status": "Active", "location": "B3 T&D", "user_name": "WireRoom (New PC)", "disk_space": "512GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "Lenova Thinkstatio P330", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
210	device	105	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-307", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Eric Whyte/Test Server", "disk_space": "512GB", "ip_address": "", "install_date": "", "manufacturer": "Dell vpro/ism 1", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
211	device	106	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-163", "type": "PC", "status": "Inactive", "location": "T&D Office", "user_name": "Ivana Vakova", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
212	device	107	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-166", "type": "PC", "status": "Inactive", "location": "T&D Office", "user_name": "Sophie Ronan", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
213	device	108	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-403", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Eric Whyte", "disk_space": "512GB", "ip_address": "", "install_date": "2023-09-26", "manufacturer": "Lenova ThinkStation P3", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
214	device	109	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-411", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Colm Conneely", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
215	device	110	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-387", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Kevin Egan", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
216	device	111	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-180", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Zuzana Mikulova", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
217	device	112	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-408", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Piotr W.", "disk_space": "512GB", "ip_address": "", "install_date": "2025-09-26", "manufacturer": "HP Z2 Tower G1i", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
218	device	113	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-185", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Paul Fahey", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
219	device	114	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-379", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Tim Ling", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
220	device	115	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC--399", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Sean Fla,ery", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
221	device	116	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-386", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Stewart Jameson", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
222	device	117	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-184", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Training Room (Old Ola Jurga)", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
223	device	118	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-275", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Leonard Neethling", "disk_space": "512GB", "ip_address": "", "install_date": "2021-09-26", "manufacturer": "Dell Precision 3650 Tower", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
224	device	119	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-197", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Colm Maher", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
225	device	120	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-381", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Tommy Feely", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
226	device	121	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-385", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "David Long", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
227	device	122	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-357", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Bernard Keigher", "disk_space": "512GB", "ip_address": "", "install_date": "", "manufacturer": "N/A", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
228	device	123	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-250", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Keith Haverty", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
229	device	124	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-388", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Shane Finn", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "Lenova ThinkStation P2", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
230	device	125	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-223", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Aidan Connolly", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
231	device	126	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-269", "type": "PC", "status": "Active", "location": "T&D Training Room", "user_name": "Training PC", "disk_space": "512GB", "ip_address": "", "install_date": "2024-09-26", "manufacturer": "Lenova ThinkStation P348", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
232	device	127	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-329", "type": "PC", "status": "Active", "location": "Turning B4", "user_name": "Adam Newell", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
233	device	128	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-346", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Adrian Glynn", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
234	device	129	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-236", "type": "PC", "status": "Active", "location": "T&D", "user_name": "ToolRoom", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
235	device	130	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-323", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "Annagh Moran", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
236	device	131	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-260", "type": "PC", "status": "Active", "location": "B4", "user_name": "B4 Meeting Room Up Stairs", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
237	device	132	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-265", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Bernadeta Szczepanska", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
238	device	133	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-305", "type": "PC", "status": "Active", "location": "Blasting", "user_name": "Blasting", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
239	device	134	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-344", "type": "PC", "status": "Active", "location": "B1 HR", "user_name": "Chloe Fogarty", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
240	device	135	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-311", "type": "Laptop", "status": "Active", "location": "Maintenance", "user_name": "Ciaran Clancy", "disk_space": "256GB", "ip_address": "", "install_date": "", "manufacturer": "Maintenance Laptop", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
241	device	136	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-370", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
242	device	137	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-327", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
243	device	138	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-397", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
244	device	139	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-277", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
245	device	140	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-291", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
246	device	141	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-263", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
247	device	142	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-362", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "CleanRoom Monitoring", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Elite Desk 800 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
248	device	143	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-354", "type": "PC", "status": "Active", "location": "Passivation 1", "user_name": "Cleanroom/Victor", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
249	device	144	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-242", "type": "PC", "status": "Active", "location": "B2 Materials", "user_name": "Dara Cumney", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
250	device	145	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-361", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Debora Piai", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
251	device	146	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-298", "type": "PC", "status": "Active", "location": "B1 Accounting", "user_name": "Donna McGoldrick", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
252	device	147	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-239", "type": "PC", "status": "Active", "location": "T&D", "user_name": "", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
253	device	148	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-279", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "Elaine McDonagh", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
254	device	149	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-218", "type": "PC", "status": "Active", "location": "Pucks Inspection B4", "user_name": "Emma Duffy", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
255	device	150	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-312", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
256	device	151	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-293", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
257	device	152	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-234", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Aiden Shapiro", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
258	device	153	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-233", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Colm Conneely", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
259	device	154	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-349", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
260	device	155	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-348", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
261	device	156	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-330", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
262	device	157	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-290", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
263	device	158	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-289", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Ewa Podbielska", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
264	device	159	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-238", "type": "PC", "status": "Active", "location": "T&D Office", "user_name": "Pat Ryan", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
265	device	160	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-204", "type": "PC", "status": "Active", "location": "Pucks Inspection B4", "user_name": "Finten Mcnamara", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
266	device	161	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-262", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Flavia Brad", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6 400", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
267	device	162	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-340", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Free", "disk_space": "256GB", "ip_address": "", "install_date": "2023-09-26", "manufacturer": "HP Mini Pro G9 400", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
268	device	163	created	system	{"after": {"os": "", "ram": "32GB", "name": "PC-235", "type": "PC", "status": "Active", "location": "T&D Training Room", "user_name": "Training Room", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Z2 G4", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
269	device	164	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-193", "type": "PC", "status": "Active", "location": "B1 Up Stairs", "user_name": "Edward Kenny (Projector PC)", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
270	device	165	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-268", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Gabriel Naughton", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
271	device	166	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-300", "type": "PC", "status": "Active", "location": "Turning B4", "user_name": "Gemab Lathes Teams", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Prodesk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
272	device	167	created	system	{"after": {"os": "", "ram": "8GB", "name": "Pc-301", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Gemba - Meditech", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
273	device	168	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-220", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Gerry Hanrahan", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
274	device	169	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-256", "type": "PC", "status": "Active", "location": "Maintenance", "user_name": "Hugh McEntee", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
275	device	170	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-342", "type": "PC", "status": "Active", "location": "Shipping B4", "user_name": "James Burton", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
276	device	171	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-222", "type": "PC", "status": "Active", "location": "B1 Shipping", "user_name": "James/Lorna", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
277	device	172	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-248", "type": "PC", "status": "Active", "location": "Pucks Inspection B4", "user_name": "Jayasree Mohanda", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
278	device	173	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-331", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Joe Hawkins", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G9 400", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
279	device	174	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-368", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Elitdesk 800 G4 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
280	device	175	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-367", "type": "PC", "status": "Active", "location": "B1 Etching", "user_name": "Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Elitdesk 800 G4 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
281	device	176	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-219", "type": "PC", "status": "Active", "location": "Shipping B4", "user_name": "John Keedy", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
282	device	177	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-214", "type": "PC", "status": "Active", "location": "Maintenance", "user_name": "John Ward", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
283	device	178	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-213", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Few Users", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
284	device	179	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-288", "type": "PC", "status": "Active", "location": "B1", "user_name": "Kevin Ward", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
285	device	180	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-177", "type": "PC", "status": "Inactive", "location": "B1 HR", "user_name": "Free PC", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
286	device	181	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-195", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "Free PC (Laura Furey)", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Desk Pro 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
287	device	182	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-211", "type": "PC", "status": "Active", "location": "Quality Department", "user_name": "John Eastwood", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Desk Top 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
288	device	183	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-418", "type": "PC", "status": "Active", "location": "B4 Lathes", "user_name": "Lathes Clocking", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
289	device	184	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-335", "type": "PC", "status": "Inactive", "location": "Sliding Head B4", "user_name": "Lathes Clocking", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro 400 G9 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
290	device	185	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-334", "type": "PC", "status": "Active", "location": "Lathes Pucks B4", "user_name": "Lathes Pucks", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
291	device	186	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-281", "type": "PC", "status": "Active", "location": "Lathes Pucks B4", "user_name": "Lathes Pucks", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Prodesk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
292	device	187	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-317", "type": "PC", "status": "Active", "location": "Lathes Pucks B4", "user_name": "Lathes Pucks", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
293	device	188	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-314", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Magolelena Kaczmarzyk", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
294	device	189	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-304", "type": "PC", "status": "Active", "location": "Pucks Inspection B4", "user_name": "Marcel Jezik", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "PH Prodesk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
295	device	190	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-186", "type": "PC", "status": "Active", "location": "B1 Shipping", "user_name": "John Keady", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
296	device	191	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-225", "type": "PC", "status": "Active", "location": "Pucks Inspection B4", "user_name": "Marko Bukvic", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
297	device	192	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-227", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Martina Honan", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
298	device	193	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-316", "type": "PC", "status": "Active", "location": "Bending", "user_name": "Meditech", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
299	device	194	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-280", "type": "PC", "status": "Active", "location": "B4 Office", "user_name": "Meeting Room", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
300	device	195	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-314", "type": "PC", "status": "Active", "location": "B1 Meeting Room 2", "user_name": "Meeting Room 2", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
301	device	196	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-164", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Lathes", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Prodesk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
302	device	197	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-333", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Lathes", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
303	device	198	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-259", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Natalia Bajura", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
304	device	199	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-372", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "Natalia Waclowka", "disk_space": "512GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
305	device	200	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-162", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Lathes", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
306	device	201	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-255", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Orla Neenan", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
307	device	202	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-176", "type": "PC", "status": "Active", "location": "B1 Milling", "user_name": "Milling", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
308	device	203	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-170", "type": "PC", "status": "Active", "location": "Clean Room", "user_name": "Mxolisi Tshabalala", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
309	device	204	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-168", "type": "PC", "status": "Active", "location": "T&D", "user_name": "Oisin Long", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
310	device	205	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-Home_01", "type": "PC", "status": "Active", "location": "Maintenance", "user_name": "Paul Barke", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "PC-Home-01", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
311	device	206	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-306", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "QC", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
312	device	207	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-209", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "QC", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
313	device	208	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-201", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "QC", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
314	device	209	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-203", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "QC", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
315	device	210	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-252", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "QC Microscop", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
316	device	211	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-321", "type": "PC", "status": "Active", "location": "T&D", "user_name": "QC-Keyence", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
317	device	212	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-315", "type": "PC", "status": "Active", "location": "B1 Office", "user_name": "QC", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
318	device	213	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-297", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Ruth Seale", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Mini Pro G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
319	device	214	created	system	{"after": {"os": "", "ram": "16GB", "name": "PC-257", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Sakkithi Yazhini", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
320	device	215	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-228", "type": "PC", "status": "Active", "location": "Sliding Head B4", "user_name": "Sean Byrne", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
321	device	216	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-167", "type": "PC", "status": "Active", "location": "B1", "user_name": "Room Beside Etching", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
322	device	217	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-188", "type": "PC", "status": "Active", "location": "Technical Sales", "user_name": "Shane Coleman", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Desk Pro 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
323	device	218	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-302", "type": "PC", "status": "Active", "location": "B1 Milling", "user_name": "Teams Milling (Gemba)", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6 Mini", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
324	device	219	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-206", "type": "PC", "status": "Active", "location": "Maintenance", "user_name": "Thomas Lawless", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
325	device	220	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-199", "type": "PC", "status": "Active", "location": "Maintenance", "user_name": "Shane D Coleman", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
326	device	221	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-154", "type": "PC", "status": "Active", "location": "Meckwash B4", "user_name": "Tool Room Meckwash", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
327	device	222	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-313", "type": "PC", "status": "Active", "location": "T&D", "user_name": "ToolRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Mini Pro G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
328	device	223	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-190", "type": "PC", "status": "Active", "location": "T&D", "user_name": "ToolRoom", "disk_space": "256GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
329	device	224	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-165", "type": "PC", "status": "Active", "location": "T&D", "user_name": "ToolRoom", "disk_space": "512GB", "ip_address": "", "install_date": "2018-09-26", "manufacturer": "HP Pro Desk 400 G5", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
330	device	225	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-207", "type": "PC", "status": "Active", "location": "T&D Training Room", "user_name": "Training Room", "disk_space": "256GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "HP Pro Desk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
331	device	226	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-318", "type": "PC", "status": "Active", "location": "B4 QC", "user_name": "Valentina Bukvic", "disk_space": "256GB", "ip_address": "", "install_date": "2023-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
332	device	227	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-224", "type": "PC", "status": "Active", "location": "Pucks Inspection B4", "user_name": "Valentina Bukvic", "disk_space": "256GB", "ip_address": "", "install_date": "2019-09-26", "manufacturer": "HP Prodesk 400 G6", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
333	device	228	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-326", "type": "PC", "status": "Active", "location": "B1 DHR", "user_name": "", "disk_space": "256GB", "ip_address": "", "install_date": "2022-09-26", "manufacturer": "HP Pro Mini 400 G9", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
334	device	229	created	system	{"after": {"os": "", "ram": "8GB", "name": "PC-HOME17", "type": "Laptop", "status": "Active", "location": "B1 Finance", "user_name": "Brendan Hennessy", "disk_space": "512GB", "ip_address": "", "install_date": "2020-09-26", "manufacturer": "Dell XPS 13 9310", "serial_number": ""}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/import/csv", "method": "POST"}	2026-09-26 11:37:54.773476+00
335	device	15	deleted	system	{"before": {"id": 15, "os": null, "ram": null, "icon": "­ƒôí", "name": null, "type": "Switch", "status": "Active", "floor_id": null, "location": null, "user_name": null, "device_age": null, "disk_space": null, "ip_address": "asdasd", "x_position": 174, "y_position": 266, "install_date": null, "manufacturer": "asdasd", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/15", "method": "DELETE"}	2026-09-26 11:39:37.632778+00
336	device	16	deleted	system	{"before": {"id": 16, "os": null, "ram": null, "icon": "­ƒôí", "name": "ergert", "type": "Switch", "status": "Active", "floor_id": null, "location": "sgb", "user_name": null, "device_age": null, "disk_space": null, "ip_address": null, "x_position": 216, "y_position": 280, "install_date": null, "manufacturer": "ghrtwsb", "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/16", "method": "DELETE"}	2026-09-26 11:39:41.084685+00
337	device	12	deleted	system	{"before": {"id": 12, "os": null, "ram": null, "icon": "­ƒô▒", "name": "iPhone", "type": "Other", "status": "Inactive", "floor_id": null, "location": "Auto-discovered", "user_name": null, "device_age": null, "disk_space": null, "ip_address": "192.168.1.3", "x_position": 148, "y_position": 277, "install_date": null, "manufacturer": null, "serial_number": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/12", "method": "DELETE"}	2026-09-26 11:39:42.35895+00
338	device	13	deleted	system	{"before": {"id": 13, "os": "ewr", "ram": "wer", "icon": "­ƒûÑ´©Å", "name": "wewer", "type": "PC", "status": "Active", "floor_id": null, "location": "Office", "user_name": "ewr", "device_age": "wer", "disk_space": "wer", "ip_address": "ewrew", "x_position": 209, "y_position": 270, "install_date": null, "manufacturer": "werew", "serial_number": "wer"}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/13", "method": "DELETE"}	2026-09-26 11:39:46.150483+00
339	device	229	moved_or_updated	system	{"x_position": {"after": 233, "before": null}, "y_position": {"after": 282, "before": null}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/229", "method": "PUT"}	2026-09-26 12:05:46.585817+00
340	device	229	moved_or_updated	system	{"x_position": {"after": 235, "before": 233}, "y_position": {"after": 418, "before": 282}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/229", "method": "PUT"}	2026-09-26 12:05:55.499114+00
341	device	229	moved_or_updated	system	{"x_position": {"after": 203, "before": 235}, "y_position": {"after": 443, "before": 418}}	{"ip": "::ffff:127.0.0.1", "path": "/api/devices/229", "method": "PUT"}	2026-09-26 12:06:02.546978+00
\.


--
-- Data for Name: device_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."device_details" ("device_id", "os", "ram", "disk_space", "device_age", "serial_number", "warranty_expiry", "location", "created_at", "updated_at", "user_name", "install_date", "manufacturer") FROM stdin;
17	\N	8GB	256GB	\N	\N	\N	B1 DHR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Anna Kwiatkowska	2018-09-26	HP Pro Desk 400 G5
18	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Kate O'Meara	2018-09-26	HP 400 Desk Pro G5
19	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Marco Patrocino	2018-09-26	HP Pro Desk 400 G5
20	\N	16GB	256GB	\N	\N	\N	B1 DHR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Karolina Szoja	2022-09-26	HP Pro Mini 400 G9
21	\N	16GB	256GB	\N	\N	\N	B1 DHR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Colin Dobey	2020-09-26	HP Pro Desk 400 G6 Mini
14	\N	\N	\N	\N	\N	\N	Auto-discovered	2026-05-09 12:10:34.042262+00	2026-05-09 12:12:47.156235+00	\N	\N	\N
22	\N	16GB	256GB	\N	\N	\N	B1 DHR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Rebecca Caldovino	2020-09-26	HP Pro Desk 400 G6 Mini
23	\N	16GB	256GB	\N	\N	\N	B1 DHR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Mary-Rose Mallon	2022-09-26	HP Pro Mini 400 G9
24	\N	16GB	512GB	\N	\N	\N	B1 HR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Peter McDonnell	2019-09-26	HP Pro Desk 400 G6
25	\N	16GB	512GB	\N	\N	\N	B1 HR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Maja Legin	2020-09-26	HP Pro Desk 400 G6 Mini
26	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Padraic Stephens	2018-09-26	HP 400 Pro Desk G5
27	\N	16GB	512GB	\N	\N	\N	B1 Milling	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Milling Clocking	2022-09-26	HP Pro Mini 400 G9
28	\N	16GB	512GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Laura Eastwood	2022-09-26	HP Mini Pro G9
29	\N	8GB	256GB	\N	\N	\N	B1	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Patricia Conroy	2018-09-26	HP Pro Desk 400 G5
30	\N	16GB	256GB	\N	\N	\N	B1 Shipping	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Julia Goliat	2019-09-26	HP Pro Desk 400 G6 Mini
31	\N	16GB	512GB	\N	\N	\N	B1 Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2022-09-26	HP Mini Pro G9
32	\N	16GB	512GB	\N	\N	\N	B1 Up Stairs	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Edward Kenny	2022-09-26	HP Mini Pro G9
33	\N	16GB	512GB	\N	\N	\N	B1 Up Stairs	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Edward Kenny	2022-09-26	HP Mini Pro G9
34	\N	16GB	512GB	\N	\N	\N	B1 Up Stairs	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Board Room	2022-09-26	HP Mini Pro G9
35	\N	16GB	256GB	\N	\N	\N	B2 Goods Delivered	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Larry McDermott	2020-09-26	HP Pro Desk 400 G6 Mini
36	\N	16GB	512GB	\N	\N	\N	B3	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room	2020-09-26	HP Z2 Mini G5
37	\N	16GB	256GB	\N	\N	\N	B3 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Maria Leticia	2020-09-26	HP Pro Desk 400 G6 Mini
38	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Katie Rathbone	2020-09-26	HP Pro Mini G6
39	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tiago Villar	2018-09-26	HP Pro Desk 400 G5
40	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Joanna Kasprowicz	2022-09-26	HP Mini Pro G9
41	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Brian Fahy	2020-09-26	HP Pro Desk 400 G6
42	\N	16GB	256GB	\N	\N	\N	B1 Accounting	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Dervilia Quinn	2018-09-26	HP Desktop Pro G5
43	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Paul Moisy	2022-09-26	HP Mini G9
44	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Geraldine Heffernan	2022-09-26	HP Mini G9
45	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Mike Mockler	2020-09-26	HP 400 Pro Desk G6
46	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Dara Cunney	2020-09-26	HP Mini G6
47	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ballooning Software Only	\N	Dell
48	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Clare A. McDermott	2020-09-26	HP Mini G6
49	\N	16GB	256GB	\N	\N	\N	B1 Accounting	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Anne Reidy	2018-09-26	HP Pro Desk G5
50	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Caoimhe N?? Cheallaigh	2023-09-26	HP Mini G9
51	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Eric Whyte	2023-09-26	HP Mini G9
52	\N	16GB	512GB	\N	\N	\N	B1 Accounting	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ruth Deacy	2018-09-26	HP Mini Pro G6
53	\N	16GB	512GB	\N	\N	\N	B1 HR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Free PC	2018-09-26	HP Elitdesk 800 G4 Mini
54	\N	16GB	256GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Pat Forde	2018-09-26	HP Pro Desk G5
55	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room (Old Denis Forde)	2018-09-26	HP Desktop Pro 400 G5
56	\N	16GB	512GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2022-09-26	HP Mini Pro G9
57	\N	16GB	512GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Clodagh Cannon	2022-09-26	HP Mini Pro G9
58	\N	16GB	512GB	\N	\N	\N	IT	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Karl Leonard (For GSS Testing)	2022-09-26	HP Mini Pro G9
59	\N	16GB	512GB	\N	\N	\N	IT	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Karl Leonard	2020-09-26	HP Pro Desk G5
60	\N	16GB	512GB	\N	\N	\N	IT	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Irakli Lomidze	2022-09-26	HP Min Pro G9
61	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	James O'Kane	2018-09-26	HP Pro Desk G5
62	\N	16GB	512GB	\N	\N	\N	Quality Manager	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sinead McMahon	2022-09-26	HP Mini Pro G9
63	\N	16GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Paul Moisy, Conor	2021-09-26	Dell Precision 3650 Tower
64	\N	16GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tool Room Clocking	2019-09-26	HP Prodesk 400 G6
65	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Laura Varley	2018-09-26	HP 400 Pro Desk G6
66	\N	16GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Noel Cuffy	2022-09-26	Dell Precision 3260 mini
67	\N	16GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	ToolRoom	2020-09-26	HP Mini Pro G6
68	\N	16GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC-ASH Camera	2022-09-26	HP Mini G5
69	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC-Keyencee	2022-09-26	Lenova ThinkStation P2
70	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Arthur Pattar	2022-09-26	HP Mini Pro G9
71	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Kevin McMahon	2022-09-26	HP Mini Pro G9
72	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Cillian O'Malley	2018-09-26	HP 400 Desk Pro G5
73	\N	16GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Free	2018-09-26	HP Elitdesk 800 G4
74	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	ToolRoom?	2022-09-26	Dell Precision 3650 Tower
75	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ronald Belnavis	2022-09-26	Dell Precision 3260 Tower
76	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Martin Devlin	2021-09-26	Dell Precision 3650 Tower
77	\N	16GB	512GB	\N	\N	\N	B4 Tool Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Toolroom Clocking	2018-09-26	HP Pro Desk 400 G5
78	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	David Cooke	2022-09-26	Lenova ThinkStation P348
79	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ronan Mcloughlin	2021-09-26	Dell Precision 3650 Tower
80	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Aidan Mannion	2022-09-26	Lenova ThinkStation P348
81	\N	16GB	512GB	\N	\N	\N	B4 Tool Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Martan Conneely	2018-09-26	HP Z2 SFF G4 Workstation
82	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Zuzana Mikulova	2022-09-26	HP Mini Pro G9
83	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sophie Ronan	2022-09-26	HP Mini Pro G9
84	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ola Jurga	2022-09-26	HP Mini Pro G9
85	\N	16GB	512GB	\N	\N	\N	Lathes Pucks B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Precision 3630 Tower Dell	2018-09-26	Lathes Pucks
86	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Rafal Broncel	2020-09-26	HP Pro Desk 400 G6
87	\N	16GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tool Room Clocking	2018-09-26	HP Elitdesk 800 G4
88	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	WireRoom	2018-09-26	HP Z2 G4
89	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lukasz Kowalski	2018-09-26	HP Z2 G4
90	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Enda Mulligan	2022-09-26	HP Mini Pro G9
91	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Thomas Lydon	2018-09-26	HP Z2 G4
92	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Fernanda Pereira	2022-09-26	HP Mini Pro G9
93	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ivana Vakova	2022-09-26	HP Mini Pro G9
94	\N	16GB	512GB	\N	\N	\N	T&D Officed	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Michael Mortimer	2020-09-26	HP Pro Desk 400 G6
95	\N	16GB	512GB	\N	\N	\N	T&D Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room	2022-09-26	HP Mini Pro G9
96	\N	16GB	512GB	\N	\N	\N	T&D Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Liam	2022-09-26	HP Mini Pro G9
97	\N	16GB	512GB	\N	\N	\N	T&D Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room	2024-09-26	Lenova ThinkStation P2
98	\N	16GB	512GB	\N	\N	\N	Turning B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tony Nevin	2020-09-26	HP Prodesk 400 G6 Mini
99	\N	16GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Martin Daniels	2018-09-26	Dell Precision 5820 Tower
100	\N	16GB	512GB	\N	\N	\N	B1 Reception	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sabrina Mannion	2022-09-26	HP Pro Mini 400 G9
101	\N	32GB	512GB	\N	\N	\N	B1 Milling	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Filip/Brendan	2022-09-26	Lenova ThinkStation P2
102	\N	32GB	512GB	\N	\N	\N	B1 Milling	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Eric La Clos	2022-09-26	HP Z2 Tower G9 Workstation
103	\N	32GB	512GB	\N	\N	\N	B1 Milling	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Kevin Lee	2022-09-26	HP Z2 Tower G9 Workstation
104	\N	32GB	512GB	\N	\N	\N	B3 T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	WireRoom (New PC)	2019-09-26	Lenova Thinkstatio P330
105	\N	32GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Eric Whyte/Test Server	\N	Dell vpro/ism 1
106	\N	16GB	256GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ivana Vakova	2018-09-26	HP Pro Desk 400 G5
107	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sophie Ronan	2018-09-26	HP Pro Desk 400 G5
108	\N	32GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Eric Whyte	2023-09-26	Lenova ThinkStation P3
109	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Colm Conneely	2022-09-26	Lenova ThinkStation P2
110	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Kevin Egan	2022-09-26	Lenova ThinkStation P2
111	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Zuzana Mikulova	2018-09-26	HP Pro Desk 400 G5
112	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Piotr W.	2025-09-26	HP Z2 Tower G1i
113	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Paul Fahey	2018-09-26	HP Pro Desk 400 G5
114	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tim Ling	2022-09-26	Lenova ThinkStation P2
115	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sean Fla,ery	2022-09-26	Lenova ThinkStation P2
116	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Stewart Jameson	2022-09-26	Lenova ThinkStation P2
117	\N	16GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room (Old Ola Jurga)	2018-09-26	HP Pro Desk 400 G5
118	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Leonard Neethling	2021-09-26	Dell Precision 3650 Tower
119	\N	16GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Colm Maher	2018-09-26	HP Pro Desk 400 G5
120	\N	32GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tommy Feely	2022-09-26	Lenova ThinkStation P2
121	\N	32GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	David Long	2022-09-26	Lenova ThinkStation P2
122	\N	32GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Bernard Keigher	\N	N/A
123	\N	32GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Keith Haverty	2018-09-26	HP Z2 G4
124	\N	32GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Shane Finn	2022-09-26	Lenova ThinkStation P2
125	\N	32GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Aidan Connolly	2018-09-26	HP Z2 G4
126	\N	32GB	512GB	\N	\N	\N	T&D Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training PC	2024-09-26	Lenova ThinkStation P348
127	\N	8GB	512GB	\N	\N	\N	Turning B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Adam Newell	2022-09-26	HP Pro Mini 400 G9
128	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Adrian Glynn	2022-09-26	HP Pro Mini 400 G9
129	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	ToolRoom	2018-09-26	HP Z2 G4
130	\N	8GB	256GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Annagh Moran	2020-09-26	HP Mini
131	\N	8GB	256GB	\N	\N	\N	B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	B4 Meeting Room Up Stairs	2020-09-26	HP Pro Desk 400 G6 Mini
132	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Bernadeta Szczepanska	2020-09-26	HP Mini Pro G6
133	\N	8GB	256GB	\N	\N	\N	Blasting	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Blasting	2022-09-26	HP Mini Pro G9
134	\N	8GB	256GB	\N	\N	\N	B1 HR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Chloe Fogarty	2022-09-26	HP Pro Mini 400 G9
135	\N	8GB	256GB	\N	\N	\N	Maintenance	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ciaran Clancy	\N	Maintenance Laptop
136	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2022-09-26	HP Mini Pro G9
137	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2022-09-26	HP Mini Pro G9
138	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2020-09-26	HP Mini Pro G6
139	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2020-09-26	HP Mini Pro G6
140	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2020-09-26	HP Mini Pro G6
141	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom	2020-09-26	HP Pro Desk 400 G5
142	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	CleanRoom Monitoring	2020-09-26	HP Elite Desk 800 G5
143	\N	8GB	512GB	\N	\N	\N	Passivation 1	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Cleanroom/Victor	2022-09-26	HP Mini Pro G9
144	\N	8GB	256GB	\N	\N	\N	B2 Materials	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Dara Cumney	2020-09-26	HP Pro Desk 400 G6
145	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Debora Piai	2020-09-26	HP Mini Pro G6
146	\N	8GB	256GB	\N	\N	\N	B1 Accounting	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Donna McGoldrick	2020-09-26	HP Mini Pro G6
147	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	\N	2018-09-26	HP Z2 G4
148	\N	8GB	512GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Elaine McDonagh	2020-09-26	HP Mini Pro G6
149	\N	8GB	256GB	\N	\N	\N	Pucks Inspection B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Emma Duffy	2019-09-26	HP Prodesk 400 G6
150	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2022-09-26	HP Mini Pro G9
151	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2019-09-26	HP Pro Desk 400 G6 Mini
152	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Aiden Shapiro	2018-09-26	HP Z2 G4
153	\N	32GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Colm Conneely	2018-09-26	HP Z2 G4
154	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2022-09-26	HP Mini Pro G9
155	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2022-09-26	HP Mini Pro G9
156	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2022-09-26	HP Mini Pro G9
157	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2020-09-26	HP Pro Desk 400 G6 Mini
158	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ewa Podbielska	2020-09-26	HP Mini Pro G6
159	\N	32GB	512GB	\N	\N	\N	T&D Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Pat Ryan	2018-09-26	HP Z2 G4
160	\N	8GB	256GB	\N	\N	\N	Pucks Inspection B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Finten Mcnamara	2019-09-26	HP Prodesk 400 G6
161	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Flavia Brad	2020-09-26	HP Mini Pro G6 400
162	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Free	2023-09-26	HP Mini Pro G9 400
163	\N	32GB	512GB	\N	\N	\N	T&D Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room	2018-09-26	HP Z2 G4
164	\N	8GB	256GB	\N	\N	\N	B1 Up Stairs	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Edward Kenny (Projector PC)	2018-09-26	HP Pro Desk 400 G5
165	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Gabriel Naughton	2022-09-26	HP
166	\N	8GB	512GB	\N	\N	\N	Turning B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Gemab Lathes Teams	2020-09-26	HP Prodesk 400 G6 Mini
167	\N	8GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Gemba - Meditech	2020-09-26	HP Pro Desk 400 G6 Mini
168	\N	8GB	256GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Gerry Hanrahan	2020-09-26	HP Pro Desk G6
169	\N	8GB	256GB	\N	\N	\N	Maintenance	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Hugh McEntee	2020-09-26	HP Pro Desk 400 G6
170	\N	8GB	256GB	\N	\N	\N	Shipping B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	James Burton	2022-09-26	HP Mini Pro 400 G9
171	\N	8GB	256GB	\N	\N	\N	B1 Shipping	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	James/Lorna	2019-09-26	HP Pro Desk 400 G6
172	\N	8GB	256GB	\N	\N	\N	Pucks Inspection B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Jayasree Mohanda	2019-09-26	HP Prodesk 400 G6
173	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Joe Hawkins	2020-09-26	HP Mini Pro G9 400
174	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2018-09-26	HP Elitdesk 800 G4 Mini
175	\N	8GB	256GB	\N	\N	\N	B1 Etching	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Etching	2018-09-26	HP Elitdesk 800 G4 Mini
176	\N	8GB	256GB	\N	\N	\N	Shipping B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	John Keedy	2019-09-26	HP Prodesk 400 G6
177	\N	8GB	256GB	\N	\N	\N	Maintenance	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	John Ward	2020-09-26	HP Pro Desk 400 G6
178	\N	8GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Few Users	2018-09-26	HP Pro Desk 400 G6
179	\N	8GB	256GB	\N	\N	\N	B1	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Kevin Ward	2019-09-26	HP Pro Desk 400 G6 Mini
180	\N	8GB	256GB	\N	\N	\N	B1 HR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Free PC	2018-09-26	HP Pro Desk 400 G5
181	\N	8GB	256GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Free PC (Laura Furey)	2018-09-26	HP Desk Pro 400 G5
182	\N	8GB	256GB	\N	\N	\N	Quality Department	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	John Eastwood	2018-09-26	HP Desk Top 400 G6
183	\N	8GB	256GB	\N	\N	\N	B4 Lathes	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes Clocking	2022-09-26	HP Mini Pro G9
184	\N	8GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes Clocking	2022-09-26	HP Pro 400 G9 Mini
185	\N	8GB	256GB	\N	\N	\N	Lathes Pucks B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes Pucks	2022-09-26	HP Pro Mini 400 G9
186	\N	8GB	256GB	\N	\N	\N	Lathes Pucks B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes Pucks	2020-09-26	HP Prodesk 400 G6 Mini
187	\N	8GB	256GB	\N	\N	\N	Lathes Pucks B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes Pucks	2022-09-26	HP Pro Mini 400 G9
188	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Magolelena Kaczmarzyk	2022-09-26	HP Pro Mini 400 G9
189	\N	8GB	256GB	\N	\N	\N	Pucks Inspection B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Marcel Jezik	2020-09-26	PH Prodesk 400 G6 Mini
190	\N	8GB	256GB	\N	\N	\N	B1 Shipping	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	John Keady	2018-09-26	HP Pro Desk 400 G5
191	\N	8GB	256GB	\N	\N	\N	Pucks Inspection B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Marko Bukvic	2019-09-26	HP Prodesk 400 G6
192	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Martina Honan	2020-09-26	HP Pro Desk 400 G6
193	\N	8GB	256GB	\N	\N	\N	Bending	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Meditech	2022-09-26	HP Mini Pro G9
194	\N	8GB	512GB	\N	\N	\N	B4 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Meeting Room	2022-09-26	HP Mini G9
195	\N	8GB	256GB	\N	\N	\N	B1 Meeting Room 2	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Meeting Room 2	2020-09-26	HP Mini
196	\N	8GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes	2018-09-26	HP Prodesk 400 G5
197	\N	8GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes	2018-09-26	HP Pro Mini 400 G9
198	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Natalia Bajura	2020-09-26	HP Mini Pro G6
199	\N	8GB	512GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Natalia Waclowka	2022-09-26	HP Mini Pro
200	\N	8GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Lathes	2018-09-26	HP Pro Desk 400 G5
201	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Orla Neenan	2020-09-26	HP Pro Desk 400 G6
202	\N	8GB	256GB	\N	\N	\N	B1 Milling	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Milling	2018-09-26	HP Pro Desk 400 G5
203	\N	8GB	256GB	\N	\N	\N	Clean Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Mxolisi Tshabalala	2018-09-26	HP Pro Desk 400 G5
204	\N	8GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Oisin Long	2018-09-26	HP Pro Desk 400 G5
205	\N	8GB	256GB	\N	\N	\N	Maintenance	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Paul Barke	2018-09-26	PC-Home-01
206	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC	2020-09-26	HP Pro Desk 400 G6 Mini
207	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC	2020-09-26	HP Pro Desk 400 G6
208	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC	2020-09-26	HP Pro Desk 400 G6
209	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC	2020-09-26	HP Pro Desk 400 G6
210	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC Microscop	2020-09-26	HP Pro Desk 400 G6
211	\N	8GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC-Keyence	2022-09-26	HP Mini Pro G9
212	\N	8GB	256GB	\N	\N	\N	B1 Office	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	QC	2018-09-26	HP Mini Pro G9
213	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Ruth Seale	2020-09-26	HP Mini Pro G6
214	\N	16GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sakkithi Yazhini	2020-09-26	HP Pro Desk 400 G6 Mini
215	\N	8GB	512GB	\N	\N	\N	Sliding Head B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Sean Byrne	2020-09-26	HP Pro Desk 400 G6
216	\N	8GB	256GB	\N	\N	\N	B1	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Room Beside Etching	2018-09-26	HP Pro Desk 400 G5
217	\N	8GB	256GB	\N	\N	\N	Technical Sales	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Shane Coleman	2018-09-26	HP Desk Pro 400 G5
218	\N	8GB	256GB	\N	\N	\N	B1 Milling	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Teams Milling (Gemba)	2020-09-26	HP Pro Desk 400 G6 Mini
219	\N	8GB	256GB	\N	\N	\N	Maintenance	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Thomas Lawless	2020-09-26	HP Pro Desk 400 G6
220	\N	8GB	256GB	\N	\N	\N	Maintenance	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Shane D Coleman	2018-09-26	HP Pro Desk 400 G5
221	\N	8GB	256GB	\N	\N	\N	Meckwash B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Tool Room Meckwash	2019-09-26	HP Prodesk 400 G6
222	\N	8GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	ToolRoom	2022-09-26	HP Mini Pro G9
223	\N	8GB	256GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	ToolRoom	2018-09-26	HP Pro Desk 400 G5
224	\N	8GB	512GB	\N	\N	\N	T&D	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	ToolRoom	2018-09-26	HP Pro Desk 400 G5
225	\N	8GB	256GB	\N	\N	\N	T&D Training Room	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Training Room	2020-09-26	HP Pro Desk 400 G6
226	\N	8GB	256GB	\N	\N	\N	B4 QC	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Valentina Bukvic	2023-09-26	HP Pro Mini 400 G9
227	\N	8GB	256GB	\N	\N	\N	Pucks Inspection B4	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	Valentina Bukvic	2019-09-26	HP Prodesk 400 G6
228	\N	8GB	256GB	\N	\N	\N	B1 DHR	2026-09-26 11:37:54.773476+00	2026-09-26 11:37:54.773476+00	\N	2022-09-26	HP Pro Mini 400 G9
229	\N	8GB	512GB	\N	\N	\N	B1 Finance	2026-09-26 11:37:54.773476+00	2026-09-26 12:06:02.546978+00	Brendan Hennessy	2020-09-26	Dell XPS 13 9310
\.


--
-- Data for Name: device_software; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."device_software" ("id", "device_id", "software_id") FROM stdin;
\.


--
-- Data for Name: device_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."device_status_history" ("id", "device_id", "previous_status", "new_status", "changed_at", "actor_name", "metadata") FROM stdin;
16	14	\N	Active	2026-05-09 12:10:34.042262+00	system	{"ip": "::ffff:127.0.0.1", "path": "/api/devices", "method": "POST"}
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."devices" ("id", "name", "ip_address", "type", "status", "x_position", "y_position", "floor_id", "icon") FROM stdin;
73	PC-363	\N	PC	Active	\N	\N	\N	­ƒÆ╗
74	PC-273	\N	PC	Active	\N	\N	\N	­ƒÆ╗
75	PC-359	\N	PC	Active	\N	\N	\N	­ƒÆ╗
76	PC-272	\N	PC	Active	\N	\N	\N	­ƒÆ╗
77	PC-178	\N	PC	Active	\N	\N	\N	­ƒÆ╗
78	PC-322	\N	PC	Active	\N	\N	\N	­ƒÆ╗
79	PC-274	\N	PC	Active	\N	\N	\N	­ƒÆ╗
80	PC-319	\N	PC	Active	\N	\N	\N	­ƒÆ╗
81	PC-237	\N	PC	Active	\N	\N	\N	­ƒÆ╗
82	PC-415	\N	PC	Active	\N	\N	\N	­ƒÆ╗
83	PC-414	\N	PC	Active	\N	\N	\N	­ƒÆ╗
84	PC-413	\N	PC	Active	\N	\N	\N	­ƒÆ╗
85	PC-CMM-006	\N	PC	Active	\N	\N	\N	­ƒÆ╗
86	PC-208	\N	PC	Active	\N	\N	\N	­ƒÆ╗
87	PC-364	\N	PC	Active	\N	\N	\N	­ƒÆ╗
88	PC-230	\N	PC	Active	\N	\N	\N	­ƒÆ╗
89	PC-232	\N	PC	Active	\N	\N	\N	­ƒÆ╗
90	PC-341	\N	PC	Active	\N	\N	\N	­ƒÆ╗
91	PC-229	\N	PC	Active	\N	\N	\N	­ƒÆ╗
92	PC-324	\N	PC	Active	\N	\N	\N	­ƒÆ╗
93	PC-336	\N	PC	Active	\N	\N	\N	­ƒÆ╗
14	LGwebOSTV	192.168.1.2	Other	Active	205	305	\N	­ƒôí
94	PC-216	\N	PC	Active	\N	\N	\N	­ƒÆ╗
95	PC-394	\N	PC	Active	\N	\N	\N	­ƒÆ╗
96	PC-402	\N	PC	Active	\N	\N	\N	­ƒÆ╗
97	PC-384	\N	PC	Active	\N	\N	\N	­ƒÆ╗
98	PC-292	\N	PC	Active	\N	\N	\N	­ƒÆ╗
99	PC-303	\N	PC	Active	\N	\N	\N	­ƒÆ╗
100	PC-343	\N	PC	Active	\N	\N	\N	­ƒÆ╗
101	PC-389	\N	PC	Active	\N	\N	\N	­ƒÆ╗
102	PC-351	\N	PC	Active	\N	\N	\N	­ƒÆ╗
17	PC-183	\N	PC	Active	\N	\N	\N	­ƒÆ╗
18	PC-172	\N	PC	Active	\N	\N	\N	­ƒÆ╗
19	PC-215	\N	PC	Active	\N	\N	\N	­ƒÆ╗
20	PC-406	\N	PC	Active	\N	\N	\N	­ƒÆ╗
21	PC-299	\N	PC	Active	\N	\N	\N	­ƒÆ╗
22	PC-295	\N	PC	Active	\N	\N	\N	­ƒÆ╗
23	PC-345	\N	PC	Active	\N	\N	\N	­ƒÆ╗
24	PC-231	\N	PC	Active	\N	\N	\N	­ƒÆ╗
25	PC-286	\N	PC	Active	\N	\N	\N	­ƒÆ╗
26	PC-181	\N	PC	Active	\N	\N	\N	­ƒÆ╗
27	PC-320	\N	PC	Active	\N	\N	\N	­ƒÆ╗
28	PC-371	\N	PC	Active	\N	\N	\N	­ƒÆ╗
29	PC-192	\N	PC	Active	\N	\N	\N	­ƒÆ╗
30	PC-296	\N	PC	Active	\N	\N	\N	­ƒÆ╗
31	PC-332	\N	PC	Active	\N	\N	\N	­ƒÆ╗
32	PC-412	\N	PC	Active	\N	\N	\N	­ƒÆ╗
33	PC-405	\N	PC	Active	\N	\N	\N	­ƒÆ╗
34	PC-373	\N	PC	Active	\N	\N	\N	­ƒÆ╗
35	PC-267	\N	PC	Active	\N	\N	\N	­ƒÆ╗
36	PC-417	\N	PC	Active	\N	\N	\N	­ƒÆ╗
37	PC-283	\N	PC	Active	\N	\N	\N	­ƒÆ╗
38	PC-287	\N	PC	Active	\N	\N	\N	­ƒÆ╗
103	PC-352	\N	PC	Active	\N	\N	\N	­ƒÆ╗
39	PC-187	\N	PC	Active	\N	\N	\N	­ƒÆ╗
104	PC-409	\N	PC	Active	\N	\N	\N	­ƒÆ╗
105	PC-307	\N	PC	Active	\N	\N	\N	­ƒÆ╗
40	PC-410	\N	PC	Active	\N	\N	\N	­ƒÆ╗
41	PC-205	\N	PC	Active	\N	\N	\N	­ƒÆ╗
42	PC-148	\N	PC	Active	\N	\N	\N	­ƒÆ╗
43	PC-396	\N	PC	Active	\N	\N	\N	­ƒÆ╗
44	PC-339	\N	PC	Active	\N	\N	\N	­ƒÆ╗
45	PC-241	\N	PC	Active	\N	\N	\N	­ƒÆ╗
46	PC-328	\N	PC	Active	\N	\N	\N	­ƒÆ╗
47	PC-398	\N	PC	Active	\N	\N	\N	­ƒÆ╗
48	PC-266	\N	PC	Active	\N	\N	\N	­ƒÆ╗
49	PC-194	\N	PC	Active	\N	\N	\N	­ƒÆ╗
50	PC-337	\N	PC	Active	\N	\N	\N	­ƒÆ╗
51	PC-245	\N	PC	Active	\N	\N	\N	­ƒÆ╗
52	PC-160	\N	PC	Active	\N	\N	\N	­ƒÆ╗
53	PC-365	\N	PC	Inactive	\N	\N	\N	­ƒÆ╗
54	PC-171	\N	PC	Active	\N	\N	\N	­ƒÆ╗
55	PC-169	\N	PC	Active	\N	\N	\N	­ƒÆ╗
56	PC-404	\N	PC	Active	\N	\N	\N	­ƒÆ╗
57	PC-393	\N	PC	Active	\N	\N	\N	­ƒÆ╗
58	PC-407	\N	PC	Active	\N	\N	\N	­ƒÆ╗
59	PC-191	\N	PC	Active	\N	\N	\N	­ƒÆ╗
60	PC-401	\N	PC	Active	\N	\N	\N	­ƒÆ╗
61	PC-182	\N	PC	Active	\N	\N	\N	­ƒÆ╗
62	PC-338	\N	PC	Active	\N	\N	\N	­ƒÆ╗
63	PC-271	\N	PC	Active	\N	\N	\N	­ƒÆ╗
64	PC-226	\N	PC	Active	\N	\N	\N	­ƒÆ╗
65	PC-247	\N	PC	Active	\N	\N	\N	­ƒÆ╗
66	PC-358	\N	PC	Active	\N	\N	\N	­ƒÆ╗
67	PC-253	\N	PC	Active	\N	\N	\N	­ƒÆ╗
68	PC-360	\N	PC	Active	\N	\N	\N	­ƒÆ╗
69	PC-400	\N	PC	Active	\N	\N	\N	­ƒÆ╗
70	PC-382	\N	PC	Active	\N	\N	\N	­ƒÆ╗
71	PC-391	\N	PC	Active	\N	\N	\N	­ƒÆ╗
72	PC-210	\N	PC	Active	\N	\N	\N	­ƒÆ╗
106	PC-163	\N	PC	Inactive	\N	\N	\N	­ƒÆ╗
107	PC-166	\N	PC	Inactive	\N	\N	\N	­ƒÆ╗
108	PC-403	\N	PC	Active	\N	\N	\N	­ƒÆ╗
109	PC-411	\N	PC	Active	\N	\N	\N	­ƒÆ╗
110	PC-387	\N	PC	Active	\N	\N	\N	­ƒÆ╗
111	PC-180	\N	PC	Active	\N	\N	\N	­ƒÆ╗
112	PC-408	\N	PC	Active	\N	\N	\N	­ƒÆ╗
113	PC-185	\N	PC	Active	\N	\N	\N	­ƒÆ╗
114	PC-379	\N	PC	Active	\N	\N	\N	­ƒÆ╗
115	PC--399	\N	PC	Active	\N	\N	\N	­ƒÆ╗
116	PC-386	\N	PC	Active	\N	\N	\N	­ƒÆ╗
117	PC-184	\N	PC	Active	\N	\N	\N	­ƒÆ╗
118	PC-275	\N	PC	Active	\N	\N	\N	­ƒÆ╗
119	PC-197	\N	PC	Active	\N	\N	\N	­ƒÆ╗
120	PC-381	\N	PC	Active	\N	\N	\N	­ƒÆ╗
121	PC-385	\N	PC	Active	\N	\N	\N	­ƒÆ╗
122	PC-357	\N	PC	Active	\N	\N	\N	­ƒÆ╗
123	PC-250	\N	PC	Active	\N	\N	\N	­ƒÆ╗
124	PC-388	\N	PC	Active	\N	\N	\N	­ƒÆ╗
125	PC-223	\N	PC	Active	\N	\N	\N	­ƒÆ╗
126	PC-269	\N	PC	Active	\N	\N	\N	­ƒÆ╗
127	PC-329	\N	PC	Active	\N	\N	\N	­ƒÆ╗
128	PC-346	\N	PC	Active	\N	\N	\N	­ƒÆ╗
129	PC-236	\N	PC	Active	\N	\N	\N	­ƒÆ╗
130	PC-323	\N	PC	Active	\N	\N	\N	­ƒÆ╗
131	PC-260	\N	PC	Active	\N	\N	\N	­ƒÆ╗
132	PC-265	\N	PC	Active	\N	\N	\N	­ƒÆ╗
133	PC-305	\N	PC	Active	\N	\N	\N	­ƒÆ╗
134	PC-344	\N	PC	Active	\N	\N	\N	­ƒÆ╗
135	PC-311	\N	Laptop	Active	\N	\N	\N	­ƒÆ╗
136	PC-370	\N	PC	Active	\N	\N	\N	­ƒÆ╗
137	PC-327	\N	PC	Active	\N	\N	\N	­ƒÆ╗
138	PC-397	\N	PC	Active	\N	\N	\N	­ƒÆ╗
139	PC-277	\N	PC	Active	\N	\N	\N	­ƒÆ╗
140	PC-291	\N	PC	Active	\N	\N	\N	­ƒÆ╗
141	PC-263	\N	PC	Active	\N	\N	\N	­ƒÆ╗
142	PC-362	\N	PC	Active	\N	\N	\N	­ƒÆ╗
143	PC-354	\N	PC	Active	\N	\N	\N	­ƒÆ╗
144	PC-242	\N	PC	Active	\N	\N	\N	­ƒÆ╗
145	PC-361	\N	PC	Active	\N	\N	\N	­ƒÆ╗
146	PC-298	\N	PC	Active	\N	\N	\N	­ƒÆ╗
147	PC-239	\N	PC	Active	\N	\N	\N	­ƒÆ╗
148	PC-279	\N	PC	Active	\N	\N	\N	­ƒÆ╗
149	PC-218	\N	PC	Active	\N	\N	\N	­ƒÆ╗
150	PC-312	\N	PC	Active	\N	\N	\N	­ƒÆ╗
151	PC-293	\N	PC	Active	\N	\N	\N	­ƒÆ╗
152	PC-234	\N	PC	Active	\N	\N	\N	­ƒÆ╗
153	PC-233	\N	PC	Active	\N	\N	\N	­ƒÆ╗
154	PC-349	\N	PC	Active	\N	\N	\N	­ƒÆ╗
155	PC-348	\N	PC	Active	\N	\N	\N	­ƒÆ╗
156	PC-330	\N	PC	Active	\N	\N	\N	­ƒÆ╗
157	PC-290	\N	PC	Active	\N	\N	\N	­ƒÆ╗
158	PC-289	\N	PC	Active	\N	\N	\N	­ƒÆ╗
159	PC-238	\N	PC	Active	\N	\N	\N	­ƒÆ╗
160	PC-204	\N	PC	Active	\N	\N	\N	­ƒÆ╗
161	PC-262	\N	PC	Active	\N	\N	\N	­ƒÆ╗
162	PC-340	\N	PC	Active	\N	\N	\N	­ƒÆ╗
163	PC-235	\N	PC	Active	\N	\N	\N	­ƒÆ╗
164	PC-193	\N	PC	Active	\N	\N	\N	­ƒÆ╗
165	PC-268	\N	PC	Active	\N	\N	\N	­ƒÆ╗
166	PC-300	\N	PC	Active	\N	\N	\N	­ƒÆ╗
167	Pc-301	\N	PC	Active	\N	\N	\N	­ƒÆ╗
168	PC-220	\N	PC	Active	\N	\N	\N	­ƒÆ╗
169	PC-256	\N	PC	Active	\N	\N	\N	­ƒÆ╗
170	PC-342	\N	PC	Active	\N	\N	\N	­ƒÆ╗
171	PC-222	\N	PC	Active	\N	\N	\N	­ƒÆ╗
172	PC-248	\N	PC	Active	\N	\N	\N	­ƒÆ╗
173	PC-331	\N	PC	Active	\N	\N	\N	­ƒÆ╗
174	PC-368	\N	PC	Active	\N	\N	\N	­ƒÆ╗
175	PC-367	\N	PC	Active	\N	\N	\N	­ƒÆ╗
176	PC-219	\N	PC	Active	\N	\N	\N	­ƒÆ╗
177	PC-214	\N	PC	Active	\N	\N	\N	­ƒÆ╗
178	PC-213	\N	PC	Active	\N	\N	\N	­ƒÆ╗
179	PC-288	\N	PC	Active	\N	\N	\N	­ƒÆ╗
180	PC-177	\N	PC	Inactive	\N	\N	\N	­ƒÆ╗
181	PC-195	\N	PC	Active	\N	\N	\N	­ƒÆ╗
182	PC-211	\N	PC	Active	\N	\N	\N	­ƒÆ╗
183	PC-418	\N	PC	Active	\N	\N	\N	­ƒÆ╗
184	PC-335	\N	PC	Inactive	\N	\N	\N	­ƒÆ╗
185	PC-334	\N	PC	Active	\N	\N	\N	­ƒÆ╗
186	PC-281	\N	PC	Active	\N	\N	\N	­ƒÆ╗
187	PC-317	\N	PC	Active	\N	\N	\N	­ƒÆ╗
188	PC-314	\N	PC	Active	\N	\N	\N	­ƒÆ╗
189	PC-304	\N	PC	Active	\N	\N	\N	­ƒÆ╗
190	PC-186	\N	PC	Active	\N	\N	\N	­ƒÆ╗
191	PC-225	\N	PC	Active	\N	\N	\N	­ƒÆ╗
192	PC-227	\N	PC	Active	\N	\N	\N	­ƒÆ╗
193	PC-316	\N	PC	Active	\N	\N	\N	­ƒÆ╗
194	PC-280	\N	PC	Active	\N	\N	\N	­ƒÆ╗
195	PC-314	\N	PC	Active	\N	\N	\N	­ƒÆ╗
196	PC-164	\N	PC	Active	\N	\N	\N	­ƒÆ╗
197	PC-333	\N	PC	Active	\N	\N	\N	­ƒÆ╗
198	PC-259	\N	PC	Active	\N	\N	\N	­ƒÆ╗
199	PC-372	\N	PC	Active	\N	\N	\N	­ƒÆ╗
200	PC-162	\N	PC	Active	\N	\N	\N	­ƒÆ╗
201	PC-255	\N	PC	Active	\N	\N	\N	­ƒÆ╗
202	PC-176	\N	PC	Active	\N	\N	\N	­ƒÆ╗
203	PC-170	\N	PC	Active	\N	\N	\N	­ƒÆ╗
204	PC-168	\N	PC	Active	\N	\N	\N	­ƒÆ╗
205	PC-Home_01	\N	PC	Active	\N	\N	\N	­ƒÆ╗
206	PC-306	\N	PC	Active	\N	\N	\N	­ƒÆ╗
207	PC-209	\N	PC	Active	\N	\N	\N	­ƒÆ╗
208	PC-201	\N	PC	Active	\N	\N	\N	­ƒÆ╗
209	PC-203	\N	PC	Active	\N	\N	\N	­ƒÆ╗
210	PC-252	\N	PC	Active	\N	\N	\N	­ƒÆ╗
211	PC-321	\N	PC	Active	\N	\N	\N	­ƒÆ╗
212	PC-315	\N	PC	Active	\N	\N	\N	­ƒÆ╗
213	PC-297	\N	PC	Active	\N	\N	\N	­ƒÆ╗
214	PC-257	\N	PC	Active	\N	\N	\N	­ƒÆ╗
215	PC-228	\N	PC	Active	\N	\N	\N	­ƒÆ╗
216	PC-167	\N	PC	Active	\N	\N	\N	­ƒÆ╗
217	PC-188	\N	PC	Active	\N	\N	\N	­ƒÆ╗
218	PC-302	\N	PC	Active	\N	\N	\N	­ƒÆ╗
219	PC-206	\N	PC	Active	\N	\N	\N	­ƒÆ╗
220	PC-199	\N	PC	Active	\N	\N	\N	­ƒÆ╗
221	PC-154	\N	PC	Active	\N	\N	\N	­ƒÆ╗
222	PC-313	\N	PC	Active	\N	\N	\N	­ƒÆ╗
223	PC-190	\N	PC	Active	\N	\N	\N	­ƒÆ╗
224	PC-165	\N	PC	Active	\N	\N	\N	­ƒÆ╗
225	PC-207	\N	PC	Active	\N	\N	\N	­ƒÆ╗
226	PC-318	\N	PC	Active	\N	\N	\N	­ƒÆ╗
227	PC-224	\N	PC	Active	\N	\N	\N	­ƒÆ╗
228	PC-326	\N	PC	Active	\N	\N	\N	­ƒÆ╗
229	PC-HOME17	\N	Laptop	Active	203	443	\N	­ƒÆ╗
\.


--
-- Data for Name: floors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."floors" ("id", "name", "description") FROM stdin;
\.


--
-- Data for Name: hardware; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."hardware" ("id", "name", "type", "manufacturer", "model", "purchase_date", "cost", "warranty_expiry", "status", "location") FROM stdin;
1	sgs	sfgs	gsfgf	sgs	\N	sfgsfg	\N	Inactive	sfgsfg
\.


--
-- Data for Name: port_connections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."port_connections" ("id", "switch_port_id", "connected_device_id", "remote_port_id", "cable_label", "notes", "connected_at", "disconnected_at") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."schema_migrations" ("id", "filename", "applied_at") FROM stdin;
1	000_initial_schema.sql	2026-04-19 18:23:04.941231+00
2	001_normalize_devices_and_add_audit.sql	2026-04-19 18:23:05.007021+00
3	002_add_device_user_and_install_date.sql	2026-04-19 18:23:05.128497+00
4	003_add_device_manufacturer.sql	2026-05-02 19:51:12.171894+00
5	004_add_port_management.sql	2026-05-21 18:03:37.68399+00
\.


--
-- Data for Name: software; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."software" ("id", "name", "version", "vendor", "license_type", "license_expiry", "installed_on", "installation_date") FROM stdin;
1	qwq	qeqw	wer	wer	\N	wer	\N
\.


--
-- Data for Name: switch_ports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."switch_ports" ("id", "device_id", "port_number", "label", "speed", "vlan_id", "port_type", "status", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."audit_logs_id_seq"', 341, true);


--
-- Name: device_software_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."device_software_id_seq"', 1, false);


--
-- Name: device_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."device_status_history_id_seq"', 18, true);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."devices_id_seq"', 229, true);


--
-- Name: floors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."floors_id_seq"', 1, false);


--
-- Name: hardware_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."hardware_id_seq"', 1, true);


--
-- Name: port_connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."port_connections_id_seq"', 2, true);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."schema_migrations_id_seq"', 5, true);


--
-- Name: software_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."software_id_seq"', 1, true);


--
-- Name: switch_ports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."switch_ports_id_seq"', 6, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");


--
-- Name: device_details device_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_details"
    ADD CONSTRAINT "device_details_pkey" PRIMARY KEY ("device_id");


--
-- Name: device_software device_software_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_software"
    ADD CONSTRAINT "device_software_pkey" PRIMARY KEY ("id");


--
-- Name: device_status_history device_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_status_history"
    ADD CONSTRAINT "device_status_history_pkey" PRIMARY KEY ("id");


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");


--
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."floors"
    ADD CONSTRAINT "floors_pkey" PRIMARY KEY ("id");


--
-- Name: hardware hardware_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."hardware"
    ADD CONSTRAINT "hardware_pkey" PRIMARY KEY ("id");


--
-- Name: port_connections port_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."port_connections"
    ADD CONSTRAINT "port_connections_pkey" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_filename_key" UNIQUE ("filename");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id");


--
-- Name: software software_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."software"
    ADD CONSTRAINT "software_pkey" PRIMARY KEY ("id");


--
-- Name: switch_ports switch_ports_device_id_port_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."switch_ports"
    ADD CONSTRAINT "switch_ports_device_id_port_number_key" UNIQUE ("device_id", "port_number");


--
-- Name: switch_ports switch_ports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."switch_ports"
    ADD CONSTRAINT "switch_ports_pkey" PRIMARY KEY ("id");


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");


--
-- Name: idx_device_details_install_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_device_details_install_date" ON "public"."device_details" USING "btree" ("install_date");


--
-- Name: idx_device_details_warranty_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_device_details_warranty_expiry" ON "public"."device_details" USING "btree" ("warranty_expiry");


--
-- Name: idx_device_software_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "idx_device_software_unique" ON "public"."device_software" USING "btree" ("device_id", "software_id");


--
-- Name: idx_device_status_history_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_device_status_history_device_id" ON "public"."device_status_history" USING "btree" ("device_id", "changed_at" DESC);


--
-- Name: idx_devices_floor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_devices_floor_id" ON "public"."devices" USING "btree" ("floor_id");


--
-- Name: idx_devices_ip_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_devices_ip_address" ON "public"."devices" USING "btree" ("ip_address");


--
-- Name: idx_devices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_devices_status" ON "public"."devices" USING "btree" ("status");


--
-- Name: idx_devices_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_devices_type" ON "public"."devices" USING "btree" ("type");


--
-- Name: idx_hardware_warranty_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_hardware_warranty_expiry" ON "public"."hardware" USING "btree" ("warranty_expiry");


--
-- Name: idx_port_connections_connected_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_port_connections_connected_device_id" ON "public"."port_connections" USING "btree" ("connected_device_id");


--
-- Name: idx_port_connections_one_active_per_port; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "idx_port_connections_one_active_per_port" ON "public"."port_connections" USING "btree" ("switch_port_id") WHERE ("disconnected_at" IS NULL);


--
-- Name: idx_port_connections_one_active_per_remote_port; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "idx_port_connections_one_active_per_remote_port" ON "public"."port_connections" USING "btree" ("remote_port_id") WHERE (("disconnected_at" IS NULL) AND ("remote_port_id" IS NOT NULL));


--
-- Name: idx_port_connections_remote_port_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_port_connections_remote_port_id" ON "public"."port_connections" USING "btree" ("remote_port_id");


--
-- Name: idx_port_connections_switch_port_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_port_connections_switch_port_id" ON "public"."port_connections" USING "btree" ("switch_port_id");


--
-- Name: idx_software_license_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_software_license_expiry" ON "public"."software" USING "btree" ("license_expiry");


--
-- Name: idx_switch_ports_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_switch_ports_device_id" ON "public"."switch_ports" USING "btree" ("device_id");


--
-- Name: device_details device_details_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_details"
    ADD CONSTRAINT "device_details_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;


--
-- Name: device_software device_software_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_software"
    ADD CONSTRAINT "device_software_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;


--
-- Name: device_software device_software_software_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_software"
    ADD CONSTRAINT "device_software_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE CASCADE;


--
-- Name: device_status_history device_status_history_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."device_status_history"
    ADD CONSTRAINT "device_status_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;


--
-- Name: devices devices_floor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE SET NULL;


--
-- Name: port_connections port_connections_connected_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."port_connections"
    ADD CONSTRAINT "port_connections_connected_device_id_fkey" FOREIGN KEY ("connected_device_id") REFERENCES "public"."devices"("id") ON DELETE SET NULL;


--
-- Name: port_connections port_connections_remote_port_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."port_connections"
    ADD CONSTRAINT "port_connections_remote_port_id_fkey" FOREIGN KEY ("remote_port_id") REFERENCES "public"."switch_ports"("id") ON DELETE SET NULL;


--
-- Name: port_connections port_connections_switch_port_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."port_connections"
    ADD CONSTRAINT "port_connections_switch_port_id_fkey" FOREIGN KEY ("switch_port_id") REFERENCES "public"."switch_ports"("id") ON DELETE CASCADE;


--
-- Name: switch_ports switch_ports_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."switch_ports"
    ADD CONSTRAINT "switch_ports_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict i6Bhxv5M7dxhf3ZSyRdT31aHX9qPCgQ2qr728ZuQBUVjRrsa9OA1UaeAZv8fQU5


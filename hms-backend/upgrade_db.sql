-- ============================================
-- HOTEL KIOSK DATABASE UPGRADE SCRIPT
-- Device Security & Multi-Tenancy Migration
-- ============================================
-- Run with: docker exec -i hms-postgres psql -U hms_user -d hms_db -f upgrade_db.sql

-- ============================================
-- TASK 1: DATABASE MIGRATION (Safe Mode)
-- ============================================

-- 1.1 Create Hotels Table
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1.2 Add hotel_id to existing bookings table (NULLABLE for safety)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'hotel_id'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN hotel_id UUID REFERENCES public.hotels(id);
    END IF;
END $$;

-- 1.3 Create Kiosk System Schema
CREATE SCHEMA IF NOT EXISTS kiosk_sys;

-- 1.4 Create Device Status Enum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_status') THEN
        CREATE TYPE kiosk_sys.device_status AS ENUM ('online', 'offline');
    END IF;
END $$;

-- 1.5 Create Devices Table
CREATE TABLE IF NOT EXISTS kiosk_sys.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    status kiosk_sys.device_status DEFAULT 'online',
    config JSONB DEFAULT '{}',
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster serial_number lookups
CREATE INDEX IF NOT EXISTS idx_devices_serial ON kiosk_sys.devices(serial_number);

-- ============================================
-- TASK 2: DATA SEEDING (Smart Update)
-- ============================================

-- 2.1 Insert Mock Hotel: Grand Budapest Hotel
INSERT INTO public.hotels (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Grand Budapest Hotel')
ON CONFLICT (id) DO NOTHING;

-- 2.2 Update existing booking 1001 to belong to Grand Budapest Hotel
UPDATE public.bookings 
SET hotel_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE booking_id = '1001';

-- Also update booking 1002
UPDATE public.bookings 
SET hotel_id = '550e8400-e29b-41d4-a716-446655440000' 
WHERE booking_id = '1002';

-- 2.3 Register Mock Kiosk Device
INSERT INTO kiosk_sys.devices (hotel_id, serial_number, status, config) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'ATC-SN-2026-001', 'online', 
 '{"volume": 100, "voice": "alloy", "hotel_name": "Grand Budapest Hotel"}'::jsonb)
ON CONFLICT (serial_number) DO UPDATE SET
    status = 'online',
    config = '{"volume": 100, "voice": "alloy", "hotel_name": "Grand Budapest Hotel"}'::jsonb,
    last_heartbeat = NOW();

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================
-- SELECT * FROM public.hotels;
-- SELECT * FROM kiosk_sys.devices;
-- SELECT booking_id, guest_name, hotel_id FROM public.bookings;

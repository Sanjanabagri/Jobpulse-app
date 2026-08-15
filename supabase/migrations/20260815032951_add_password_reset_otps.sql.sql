/*
# Password Reset OTP Table

## Purpose
Stores 6-digit OTP codes for password reset flow. An edge function generates
a random OTP, stores it here (hashed), and emails it to the user. The frontend
verifies the OTP against this table, then calls Supabase auth.admin.updateUserById
to set the new password.

## New Table
1. `password_reset_otps`
   - `id` (uuid PK)
   - `email` (text, not null — the account email)
   - `otp_hash` (text, not null — SHA-256 hash of the 6-digit OTP; we never store raw OTP)
   - `expires_at` (timestamptz — 10 minutes from creation)
   - `used` (boolean, default false — single-use)
   - `attempts` (integer, default 0 — tracks failed verification attempts, max 5)
   - `created_at` (timestamptz)

## Security
- RLS enabled. Only authenticated users can read (for their own email), but
  the edge function uses the service role key which bypasses RLS, so it can
  insert/update freely.
- The frontend never reads this table directly — it calls the edge function
  via fetch. So we keep policies restrictive: no anon access, authenticated
  users can only read rows matching their own email.
*/

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "password_reset_otps_read_own" ON password_reset_otps;
CREATE POLICY "password_reset_otps_read_own" ON password_reset_otps FOR SELECT
  TO authenticated USING (auth.uid()::text = email);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires ON password_reset_otps(expires_at DESC);

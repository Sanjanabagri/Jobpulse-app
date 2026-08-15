import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function hashOTP(otp: string): Promise<string> {
  const data = new TextEncoder().encode(otp + (Deno.env.get("SUPABASE_ANON_KEY") ?? ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const { error } = await adminClient.auth.admin.sendRawEmail(email, {
    subject: "JobPulse — Your password reset code",
    body: `Your JobPulse password reset code is: ${otp}

This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.`,
  });
  if (error) {
    console.error("Email send error:", error.message);
    throw new Error("Failed to send OTP email");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    if (action === "send_otp") {
      const { email } = await req.json();
      if (!email || typeof email !== "string") {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user exists in auth.users
      const { data: users, error: userError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (userError) {
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const user = users.users.find((u) => u.email === email);
      if (!user) {
        // For security, don't reveal whether the email exists
        return new Response(JSON.stringify({ success: true, message: "If the email exists, an OTP has been sent." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Invalidate any previous unused OTPs for this email
      await adminClient
        .from("password_reset_otps")
        .update({ used: true })
        .eq("email", email)
        .eq("used", false);

      // Insert new OTP
      const { error: insertError } = await adminClient
        .from("password_reset_otps")
        .insert({ email, otp_hash: otpHash, expires_at: expiresAt });

      if (insertError) {
        console.error("OTP insert error:", insertError.message);
        return new Response(JSON.stringify({ error: "Failed to generate OTP" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await sendOtpEmail(email, otp);

      return new Response(JSON.stringify({ success: true, message: "OTP sent to your email." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_otp") {
      const { email, otp, newPassword } = await req.json();
      if (!email || !otp || !newPassword) {
        return new Response(JSON.stringify({ error: "Email, OTP, and new password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the latest unused OTP for this email
      const { data: otpRecord, error: otpError } = await adminClient
        .from("password_reset_otps")
        .select("*")
        .eq("email", email)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError || !otpRecord) {
        return new Response(JSON.stringify({ error: "No active OTP found. Please request a new one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiry
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "OTP has expired. Please request a new one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check attempts
      if (otpRecord.attempts >= 5) {
        await adminClient
          .from("password_reset_otps")
          .update({ used: true })
          .eq("id", otpRecord.id);
        return new Response(JSON.stringify({ error: "Too many attempts. Please request a new OTP." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify OTP hash
      const inputHash = await hashOTP(otp);
      if (inputHash !== otpRecord.otp_hash) {
        await adminClient
          .from("password_reset_otps")
          .update({ attempts: otpRecord.attempts + 1 })
          .eq("id", otpRecord.id);
        return new Response(JSON.stringify({ error: `Invalid OTP. ${4 - otpRecord.attempts} attempts remaining.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // OTP verified — mark as used
      await adminClient
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);

      // Find user and update password
      const { data: users } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const user = users.users.find((u) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update error:", updateError.message);
        return new Response(JSON.stringify({ error: "Failed to update password" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Password updated successfully." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Edge function error:", err.message);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

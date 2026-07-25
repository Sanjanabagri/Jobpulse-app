import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Get all active domains
    const { data: domains } = await supabase
      .from("domains")
      .select("id, slug, name")
      .order("name");

    if (!domains) {
      return new Response(JSON.stringify({ error: "No domains" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Jobs fetched in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const results: any[] = [];

    for (const domain of domains) {
      const { data: newJobs, error } = await supabase
        .from("job_postings")
        .select("id, company, title")
        .eq("domain_id", domain.id)
        .gte("fetched_at", since)
        .order("posted_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error(`Digest error for ${domain.slug}:`, error.message);
        continue;
      }

      const jobCount = newJobs?.length ?? 0;
      const topCompanies = [...new Set((newJobs || []).map((j) => j.company))].slice(0, 8);
      const newJobIds = (newJobs || []).map((j) => j.id);

      // Upsert today's digest for this domain
      const { error: upsertError } = await supabase
        .from("daily_digests")
        .upsert({
          digest_date: today,
          domain_id: domain.id,
          job_count: jobCount,
          top_companies: topCompanies,
          new_job_ids: newJobIds,
          trigger_sent: jobCount > 0,
          created_at: new Date().toISOString(),
        }, { onConflict: "digest_date,domain_id" });

      if (upsertError) console.error(`Upsert digest ${domain.slug}:`, upsertError.message);

      results.push({
        domain: domain.name,
        slug: domain.slug,
        new_jobs: jobCount,
        top_companies: topCompanies,
        trigger_sent: jobCount > 0,
      });
    }

    // Count active subscribers who will receive triggers
    const { count: subscriberCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    return new Response(JSON.stringify({
      success: true,
      digest_date: today,
      domains_processed: results.length,
      subscribers: subscriberCount ?? 0,
      triggers: results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

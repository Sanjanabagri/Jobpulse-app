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

const DOMAIN_ALIASES: Record<string, string> = {
  "frontend": "frontend", "front-end": "frontend", "front end": "frontend", "react": "frontend", "vue": "frontend", "angular": "frontend", "ui": "frontend",
  "backend": "backend", "back-end": "backend", "back end": "backend", "node": "backend", "python": "backend", "django": "backend", "java": "backend", "golang": "backend", "api": "backend",
  "fullstack": "fullstack", "full-stack": "fullstack", "full stack": "fullstack", "mern": "fullstack",
  "devops": "devops", "sre": "devops", "cloud": "devops", "aws": "devops", "kubernetes": "devops", "k8s": "devops", "terraform": "devops", "platform": "devops",
  "data": "data-science", "data science": "data-science", "ml": "data-science", "machine learning": "data-science", "ai": "data-science", "data engineer": "data-science", "data analyst": "data-science", "analytics": "data-science",
  "mobile": "mobile", "ios": "mobile", "android": "mobile", "react native": "mobile", "flutter": "mobile",
  "design": "design", "ux": "design", "ui design": "design", "product design": "design", "figma": "design",
  "product": "product", "pm": "product", "product manager": "product", "project manager": "product",
  "security": "security", "cybersecurity": "security", "cyber": "security", "pentest": "security", "infosec": "security",
  "blockchain": "blockchain", "web3": "blockchain", "solidity": "blockchain", "crypto": "blockchain", "smart contract": "blockchain",
  "qa": "qa", "testing": "qa", "test engineer": "qa", "automation": "qa", "sdet": "qa",
  "devrel": "devrel", "developer advocate": "devrel", "community": "devrel",
  // Non-tech domains
  "network": "network-engineering", "network engineer": "network-engineering", "ccna": "network-engineering", "ccnp": "network-engineering", "routing": "network-engineering", "switching": "network-engineering", "firewall": "network-engineering", "cisco": "network-engineering",
  "marketing": "marketing", "seo": "marketing", "sem": "marketing", "digital marketing": "marketing", "social media": "marketing", "content marketing": "marketing", "ppc": "marketing", "google ads": "marketing",
  "finance": "finance", "financial": "finance", "investment banking": "finance", "fp&a": "finance", "treasury": "finance", "cfa": "finance", "financial analyst": "finance",
  "hr": "hr", "human resources": "hr", "recruiter": "hr", "recruitment": "hr", "talent acquisition": "hr", "people operations": "hr", "payroll": "hr",
  "sales": "sales", "account executive": "sales", "account manager": "sales", "business development": "sales", "b2b": "sales", "b2c": "sales", "sdr": "sales", "bdr": "sales",
  "operations": "operations", "operations manager": "operations", "process improvement": "operations", "ops": "operations",
  "customer support": "customer-support", "customer success": "customer-support", "customer service": "customer-support", "helpdesk": "customer-support", "technical support": "customer-support",
  "logistics": "logistics", "supply chain": "logistics", "warehouse": "logistics", "inventory": "logistics", "procurement": "logistics", "shipping": "logistics", "freight": "logistics",
  "education": "education", "teacher": "education", "trainer": "education", "instructional design": "education", "teaching": "education", "tutor": "education",
  "content writer": "content-writing", "copywriter": "content-writing", "technical writer": "content-writing", "content writing": "content-writing", "copywriting": "content-writing",
  "accounting": "accounting", "accountant": "accounting", "bookkeeping": "accounting", "tax": "accounting", "audit": "accounting", "tally": "accounting", "quickbooks": "accounting",
  "legal": "legal", "lawyer": "legal", "attorney": "legal", "paralegal": "legal", "counsel": "legal", "compliance officer": "legal", "litigation": "legal",
  "healthcare": "healthcare", "nurse": "healthcare", "nursing": "healthcare", "medical": "healthcare", "clinical": "healthcare", "pharma": "healthcare", "patient care": "healthcare",
  "consulting": "consulting", "consultant": "consulting", "management consulting": "consulting", "strategy consultant": "consulting", "advisory": "consulting", "business analyst": "consulting",
};

type Intent = "search_jobs" | "match_for_me" | "domain_stats" | "trending" | "overall_stats" | "help" | "subscribe_info" | "unknown";

function detectIntent(q: string): Intent {
  const lower = q.toLowerCase();
  if (lower.includes("match for me") || lower.includes("best match") || lower.includes("recommend") || lower.includes("for my profile") || lower.includes("my skills") || lower.includes("best fit")) return "match_for_me";
  if (lower.includes("subscribe") || lower.includes("sign up") || lower.includes("join")) return "subscribe_info";
  if (lower.includes("trend") || lower.includes("hot") || lower.includes("popular") || lower.includes("trending")) return "trending";
  if (lower.includes("how many") || lower.includes("count") || lower.includes("total") || lower.includes("stats")) return "overall_stats";
  if (lower.includes("help") || lower.includes("what can you")) return "help";
  if (lower.includes("show") || lower.includes("find") || lower.includes("jobs") || lower.includes("looking") || lower.includes("search") || lower.includes("any ") || lower.includes("get me")) return "search_jobs";
  return "unknown";
}

function extractDomains(q: string): string[] {
  const lower = q.toLowerCase();
  const found = new Set<string>();
  for (const [alias, slug] of Object.entries(DOMAIN_ALIASES)) {
    if (lower.includes(alias)) found.add(slug);
  }
  return [...found];
}

function extractLocation(q: string): string | null {
  const lower = q.toLowerCase();
  const patterns = [
    /(?:in|from|at|near)\s+([a-z\s]+?)(?:\s+(?:remote|today|this week|jobs|job|developer|engineer|role|position|company|companies)|$|[,.])/i,
    /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|kolkata|gurgaon|noida|remote|san francisco|new york|london|berlin|toronto|singapore|dubai|australia|canada|india|usa|uk|germany)\b/i,
  ];
  for (const p of patterns) {
    const m = lower.match(p);
    if (m) return m[1] ? m[1].trim() : m[0].trim();
  }
  return null;
}

function extractRemote(q: string): boolean {
  return q.toLowerCase().includes("remote");
}

function extractLimit(q: string): number {
  const m = q.match(/(?:top|first|best)?\s*(\d{1,2})\s*(?:jobs|roles|positions|listings|results)?/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 20) return n;
  }
  return 6;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const intent = detectIntent(query);
    const domainSlugs = extractDomains(query);
    const location = extractLocation(query);
    const remoteOnly = extractRemote(query);
    const limit = extractLimit(query);

    // Load user profile if auth token provided
    let userProfile: any = null;
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer eyJ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: profile } = await userClient.from("profiles").select("*").eq("id", user.id).maybeSingle();
        userProfile = profile;
      }
    }

    // Load domains
    const { data: domains } = await supabase.from("domains").select("id, slug, name, icon, color");
    const slugToDomain = new Map((domains || []).map((d) => [d.slug, d]));

    // ---- HELP ----
    if (intent === "help") {
      const profileHint = userProfile
        ? "\n\n• \"Best match for my profile\" — personalized recommendations based on your skills"
        : "\n\n• Create a profile to unlock \"Best match for my profile\" — personalized recommendations based on your skills";
      return new Response(JSON.stringify({
        reply: "I'm your JobPulse agent. I scan job portals across the web daily, classify every posting by domain, and score each job for trust and freshness. Try asking:\n\n• \"Show me 5 React jobs\"\n• \"Any remote DevOps roles?\"\n• \"Data science jobs in Bangalore\"\n• \"What's trending today?\"\n• \"How many jobs do we have?\"\n• \"Stats for frontend\"" + profileHint,
        intent,
        jobs: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- SUBSCRIBE INFO ----
    if (intent === "subscribe_info") {
      return new Response(JSON.stringify({
        reply: "You can join the JobPulse community by clicking the Subscribe button on the dashboard. Pick the domains you care about (Frontend, Backend, DevOps, etc.), set your location and remote preference, and you'll get a daily trigger with new postings matched to your domains. It's free and email-based — no account needed.",
        intent,
        jobs: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- OVERALL STATS ----
    if (intent === "overall_stats") {
      const { count: totalJobs } = await supabase
        .from("job_postings").select("id", { count: "exact", head: true });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: newToday } = await supabase
        .from("job_postings").select("id", { count: "exact", head: true })
        .gte("fetched_at", since);
      const { count: remoteCount } = await supabase
        .from("job_postings").select("id", { count: "exact", head: true })
        .eq("is_remote", true);
      const { count: subscriberCount } = await supabase
        .from("subscriptions").select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Per-domain counts
      const domainStats: any[] = [];
      for (const d of domains || []) {
        const { count } = await supabase
          .from("job_postings").select("id", { count: "exact", head: true })
          .eq("domain_id", d.id);
        domainStats.push({ domain: d.name, slug: d.slug, count: count ?? 0, color: d.color, icon: d.icon });
      }
      domainStats.sort((a, b) => b.count - a.count);

      return new Response(JSON.stringify({
        reply: `Here's the current JobPulse snapshot:\n\n• Total job postings: ${totalJobs ?? 0}\n• New in the last 24h: ${newToday ?? 0}\n• Remote roles: ${remoteCount ?? 0}\n• Active community subscribers: ${subscriberCount ?? 0}\n\nTop domains by volume:\n${domainStats.slice(0, 5).map((d, i) => `  ${i + 1}. ${d.domain}: ${d.count} jobs`).join("\n")}`,
        intent,
        jobs: [],
        stats: { totalJobs, newToday, remoteCount, subscriberCount, domainStats },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- TRENDING ----
    if (intent === "trending") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const trending: any[] = [];
      for (const d of domains || []) {
        const { count } = await supabase
          .from("job_postings").select("id", { count: "exact", head: true })
          .eq("domain_id", d.id).gte("fetched_at", since);
        if ((count ?? 0) > 0) {
          trending.push({ domain: d.name, slug: d.slug, count: count ?? 0, color: d.color, icon: d.icon });
        }
      }
      trending.sort((a, b) => b.count - a.count);

      const reply = trending.length > 0
        ? `Trending domains in the last 24 hours:\n\n${trending.map((d, i) => `  ${i + 1}. ${d.domain} — ${d.count} new jobs`).join("\n")}\n\n${trending[0].domain} is leading today with ${trending[0].count} fresh postings.`
        : "No new jobs in the last 24 hours. The agent fetches fresh postings daily — try again soon or trigger a refresh from the dashboard.";

      return new Response(JSON.stringify({
        reply,
        intent,
        jobs: [],
        trending,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- DOMAIN STATS ----
    if (intent === "search_jobs" && domainSlugs.length === 1 && (query.toLowerCase().includes("how many") || query.toLowerCase().includes("count") || query.toLowerCase().includes("stats"))) {
      const d = slugToDomain.get(domainSlugs[0]);
      if (d) {
        const { count } = await supabase
          .from("job_postings").select("id", { count: "exact", head: true })
          .eq("domain_id", d.id);
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: newToday } = await supabase
          .from("job_postings").select("id", { count: "exact", head: true })
          .eq("domain_id", d.id).gte("fetched_at", since);
        const { count: remoteCount } = await supabase
          .from("job_postings").select("id", { count: "exact", head: true })
          .eq("domain_id", d.id).eq("is_remote", true);

        return new Response(JSON.stringify({
          reply: `Stats for ${d.name}:\n\n• Total postings: ${count ?? 0}\n• New in last 24h: ${newToday ?? 0}\n• Remote roles: ${remoteCount ?? 0}\n\nAsk me to "show ${d.name.toLowerCase()} jobs" to see the latest listings.`,
          intent: "domain_stats",
          jobs: [],
          stats: { domain: d.name, total: count, newToday, remote: remoteCount },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ---- MATCH FOR ME (personalized) ----
    if (intent === "match_for_me") {
      if (!userProfile) {
        return new Response(JSON.stringify({
          reply: "To get personalized job matches, you need to create a profile first. Sign in and complete your profile with your skills, experience, and preferred domain — then I'll match jobs to your profile and show you a fit percentage for each.",
          intent,
          jobs: [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userSkills = (userProfile.skills || []).map((s: string) => s.toLowerCase());
      const prefDomainId = userProfile.preferred_domain_id;
      const userLocation = (userProfile.preferred_location || userProfile.location || "").toLowerCase();
      const remoteOnlyPref = userProfile.remote_only;

      let matchQuery = supabase
        .from("job_postings")
        .select("id, title, company, company_logo, location, is_remote, job_type, tags, apply_url, posted_at, domain_id, trust_score, freshness_label, domains!inner(slug, name, icon, color)")
        .order("trust_score", { ascending: false })
        .limit(30);

      if (prefDomainId) matchQuery = matchQuery.eq("domain_id", prefDomainId);
      if (remoteOnlyPref) matchQuery = matchQuery.eq("is_remote", true);

      const { data: matchJobs } = await matchQuery;

      if (!matchJobs || matchJobs.length === 0) {
        return new Response(JSON.stringify({
          reply: "I couldn't find jobs matching your profile yet. The agent fetches fresh postings daily — try again after the next crawl, or broaden your profile preferences.",
          intent,
          jobs: [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Compute match score for each job
      const scored = matchJobs.map((j: any) => {
        const jobTags = (j.tags || []).map((t: string) => t.toLowerCase());
        const matchedSkills = userSkills.filter((s: string) =>
          jobTags.some((t: string) => t.includes(s) || s.includes(t)) ||
          (j.title || "").toLowerCase().includes(s)
        );
        const matchPercent = userSkills.length > 0
          ? Math.round((matchedSkills.length / userSkills.length) * 100)
          : 50;
        return { ...j, match_score: matchPercent, matched_skills: matchedSkills };
      });

      scored.sort((a: any, b: any) => (b.match_score + b.trust_score * 0.3) - (a.match_score + a.trust_score * 0.3));
      const topMatches = scored.slice(0, limit);

      const missingSkills = userSkills.length > 0
        ? userSkills.filter((s: string) => !topMatches.some((j: any) => j.matched_skills.includes(s)))
        : [];

      const domainName = prefDomainId ? (slugToDomain.get(domains?.find((d: any) => d.id === prefDomainId)?.slug || "")?.name || "your domain") : "all domains";

      const reply = `Based on your profile (${userProfile.headline || userProfile.current_job_title || "Professional"}, ${domainName}), here are your top ${topMatches.length} matches:\n\n${topMatches.map((j: any, i: number) =>
  `${i + 1}. **${j.title}** at ${j.company} — ${j.match_score}% match${j.trust_score >= 70 ? " | High Trust" : ""}${j.freshness_label === "fresh" ? " | Fresh" : ""}`
).join("\n")}${missingSkills.length > 0 ? `\n\nSkills in your profile not yet matched in these jobs: ${missingSkills.join(", ")}. Keep an eye out — the agent adds new postings daily.` : ""}`;

      return new Response(JSON.stringify({
        reply,
        intent,
        jobs: topMatches,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- SEARCH JOBS (default) ----
    let baseQuery = supabase
      .from("job_postings")
      .select("id, title, company, company_logo, location, is_remote, job_type, tags, apply_url, posted_at, domain_id, trust_score, freshness_label, domains!inner(slug, name, icon, color)")
      .order("posted_at", { ascending: false })
      .limit(limit);

    if (domainSlugs.length > 0) {
      const matchedDomainIds = domainSlugs
        .map((s) => slugToDomain.get(s)?.id)
        .filter(Boolean) as string[];
      if (matchedDomainIds.length > 0) {
        baseQuery = baseQuery.in("domain_id", matchedDomainIds);
      }
    }

    if (remoteOnly) baseQuery = baseQuery.eq("is_remote", true);

    const { data: jobs, error } = await baseQuery;

    if (error) {
      return new Response(JSON.stringify({ reply: `Search error: ${error.message}`, intent, jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let filteredJobs = jobs || [];
    if (location && location !== "remote") {
      const locLower = location.toLowerCase();
      filteredJobs = filteredJobs.filter((j: any) =>
        (j.location || "").toLowerCase().includes(locLower)
      );
    }

    if (filteredJobs.length === 0) {
      const criteria: string[] = [];
      if (domainSlugs.length) criteria.push(domainSlugs.map(s => slugToDomain.get(s)?.name || s).join(" / "));
      if (location) criteria.push(`in ${location}`);
      if (remoteOnly) criteria.push("remote");
      const critStr = criteria.length ? ` matching your criteria (${criteria.join(", ")})` : "";
      return new Response(JSON.stringify({
        reply: `No jobs found${critStr}. The agent crawls fresh postings daily — try broadening your search or check back after the next fetch. You can also ask "what's trending today?" to see active domains.`,
        intent,
        jobs: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const domainLabel = domainSlugs.length
      ? domainSlugs.map(s => slugToDomain.get(s)?.name || s).join(" / ")
      : "All domains";
    const locLabel = location && location !== "remote" ? ` in ${location}` : "";
    const remoteLabel = remoteOnly ? " (remote only)" : "";

    const reply = `Found ${filteredJobs.length} ${domainLabel} job${filteredJobs.length > 1 ? "s" : ""}${locLabel}${remoteLabel}:\n\n${filteredJobs.map((j: any, i: number) =>
      `${i + 1}. **${j.title}** at ${j.company}${j.location ? ` — ${j.location}` : ""}${j.is_remote ? " (Remote)" : ""}`
    ).join("\n")}\n\nClick any job in the feed to see full details and apply.`;

    return new Response(JSON.stringify({
      reply,
      intent,
      jobs: filteredJobs,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

type DomainRule = { slug: string; keywords: string[] };

const DOMAIN_RULES: DomainRule[] = [
  { slug: "frontend", keywords: ["frontend", "front-end", "react", "vue", "angular", "svelte", "next.js", "nextjs", "css", "tailwind", "ui developer", "web developer"] },
  { slug: "backend", keywords: ["backend", "back-end", "node", "python", "django", "flask", "fastapi", "golang", "go developer", "java ", "spring", "ruby", "rails", "php", "laravel", "api developer", "microservices"] },
  { slug: "fullstack", keywords: ["fullstack", "full-stack", "full stack", "mern", "mean"] },
  { slug: "devops", keywords: ["devops", "sre", "site reliability", "kubernetes", "docker", "terraform", "ansible", "aws", "gcp", "azure", "ci/cd", "jenkins", "cloud engineer", "platform engineer"] },
  { slug: "data-science", keywords: ["data scientist", "data engineer", "machine learning", "ml engineer", "ai engineer", "deep learning", "nlp", "data analyst", "analytics", "big data", "spark", "pytorch", "tensorflow", "llm"] },
  { slug: "mobile", keywords: ["ios", "android", "swift", "kotlin", "react native", "flutter", "mobile developer", "mobile engineer"] },
  { slug: "design", keywords: ["product designer", "ux designer", "ui designer", "graphic designer", "brand designer", "design systems", "figma", "ux/ui", "interaction designer"] },
  { slug: "product", keywords: ["product manager", "product owner", "program manager", "project manager", "scrum master", "agile coach"] },
  { slug: "security", keywords: ["security engineer", "cybersecurity", "penetration", "pentest", "appsec", "infosec", "security analyst", "compliance", "soc analyst"] },
  { slug: "blockchain", keywords: ["blockchain", "web3", "solidity", "smart contract", "defi", "ethereum", "solana", "crypto"] },
  { slug: "qa", keywords: ["qa engineer", "test engineer", "automation engineer", "sdet", "quality assurance", "qa automation", "selenium", "cypress", "playwright"] },
  { slug: "devrel", keywords: ["developer advocate", "devrel", "developer relations", "community manager", "technical evangelist"] },
  { slug: "network-engineering", keywords: ["network engineer", "network admin", "systemadministrator", "system administrator", "it administrator", "system admin", "ccna", "ccnp", "ccie", "routing", "switching", "firewall", "lan", "wan", "network architect", "network security", "tcp/ip", "cisco", "juniper", "networking", "network administration", "it systems"] },
  { slug: "marketing", keywords: ["marketing", "seo manager", "seo", "sem", "sea-manager", "digital marketing", "social media", "content marketing", "growth", "email marketing", "brand marketing", "marketing manager", "marketing specialist", "ppc", "google ads", "hubspot", "online marketing", "influencer marketing", "strategic marketing", "cro"] },
  { slug: "finance", keywords: ["financial analyst", "finance manager", "investment banking", "fp&a", "treasury", "risk management", "portfolio", "equity research", "credit analyst", "finance", "bloomberg", "cfa", "financial planning", "financial"] },
  { slug: "hr", keywords: ["hr manager", "human resources", "recruiter", "recruitment", "talent acquisition", "people operations", "hr business partner", "hr generalist", "payroll", "employee relations", "hr specialist", "talent partner", "personalmanager", "personalreferent"] },
  { slug: "sales", keywords: ["sales", "account executive", "account manager", "business development", "business developer", "b2b sales", "b2c sales", "sales representative", "sales development", "sdr", "bdr", "inside sales", "field sales", "territory manager", "vertrieb"] },
  { slug: "operations", keywords: ["operations manager", "operations analyst", "business operations", "process improvement", "operations associate", "ops manager", "chief operating officer", "operations lead", "operational excellence", "projektmanager", "project manager", "project management", "immobilienverwaltung"] },
  { slug: "customer-support", keywords: ["customer support", "customer success", "customer service", "helpdesk", "technical support", "support engineer", "support specialist", "cx", "client success", "customer experience", "kundenservice"] },
  { slug: "logistics", keywords: ["logistics", "supply chain", "warehouse", "inventory", "procurement", "shipping", "freight", "3pl", "distribution", "warehouse manager", "supply chain manager", "logistics coordinator", "speditionskaufmann"] },
  { slug: "education", keywords: ["teacher", "trainer", "instructional designer", "curriculum", "education", "tutor", "lecturer", "professor", "e-learning", "lms", "teaching assistant", "education specialist", "lehrer", "dozent"] },
  { slug: "content-writing", keywords: ["content writer", "copywriter", "technical writer", "content strategist", "blog writer", "content creator", "editor", "copywriting", "ghostwriter", "content lead", "content manager", "redakteur"] },
  { slug: "accounting", keywords: ["accountant", "accounting", "bookkeeping", "bookkeeper", "tax", "audit", "accounts payable", "accounts receivable", "tally", "quickbooks", "gst", "ledger", "payable specialist", "steuerberater", "tax advisor", "steuer", "buchhalter", "finanzbuchhaltung"] },
  { slug: "legal", keywords: ["legal counsel", "lawyer", "attorney", "paralegal", "legal advisor", "corporate law", "compliance officer", "contract", "litigation", "legal associate", "legal consultant", "jurist", "rechtsanwalt", "recht"] },
  { slug: "healthcare", keywords: ["nurse", "doctor", "medical", "clinical", "healthcare", "pharma", "pharmacist", "medical devices", "patient care", "healthcare admin", "radiologist", "lab technician", "medical officer", "pflegekraft", "krankenpflege"] },
  { slug: "consulting", keywords: ["consultant", "management consulting", "strategy consultant", "advisor", "advisory", "business analyst", "m&a", "mergers", "consulting associate", "principal consultant", "berater", "unternehmensberatung"] },
];

function classifyDomain(title: string, tags: string[]): string | null {
  const haystack = `${title} ${tags.join(" ")}`.toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.slug;
  }
  return null;
}

function truncate(s: string, max: number): string {
  if (!s) return s;
  return s.length > max ? s.slice(0, max) : s;
}

function computeFreshness(postedAt: string | null): string {
  if (!postedAt) return "active";
  const ageHours = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60);
  if (ageHours <= 24) return "fresh";
  if (ageHours <= 168) return "active";
  if (ageHours <= 720) return "aging";
  return "stale";
}

function computeTrustScore(job: {
  title: string;
  company: string;
  tags: string[];
  description: string;
  apply_url: string | null;
  company_logo: string | null;
  sourceSlug: string;
  domainSlug: string | null;
  hasSalary: boolean;
}): number {
  let score = 50;

  // Source credibility: established APIs score higher
  if (job.sourceSlug === "remoteok") score += 15;
  else if (job.sourceSlug === "arbeitnow") score += 15;
  else if (job.sourceSlug === "manual") score += 20;

  // Domain classification confidence: classified jobs are more trustworthy
  if (job.domainSlug) score += 10;

  // Has a real apply URL
  if (job.apply_url && job.apply_url.startsWith("http")) score += 8;

  // Has company logo (established company signal)
  if (job.company_logo) score += 5;

  // Has salary transparency
  if (job.hasSalary) score += 7;

  // Has meaningful description (>100 chars)
  if (job.description && job.description.length > 100) score += 5;

  // Has tags (structured data = better quality posting)
  if (job.tags && job.tags.length >= 3) score += 5;

  // Company name is not "Unknown"
  if (job.company && job.company.toLowerCase() !== "unknown") score += 5;

  // Penalty: very short titles (<10 chars) are often low quality
  if (job.title && job.title.length < 10) score -= 10;

  // Penalty: company name looks like spam (all caps, excessive punctuation)
  if (job.company && /^(.{0,2}|[A-Z\s]{6,}|.*[!@#$].*)$/.test(job.company)) score -= 5;

  return Math.max(0, Math.min(100, score));
}

async function fetchRemoteOK(sourceId: string): Promise<any[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "JobPulse-Agent/1.0" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.slice(1).slice(0, 80).map((j: any) => ({
      external_id: String(j.id || j.slug || `${j.company}-${j.position}`),
      source_id: sourceId,
      title: truncate(j.position || j.title || "Remote Role", 300),
      company: truncate(j.company || "Unknown", 200),
      company_logo: j.company_logo || null,
      description: truncate(j.description || j.tag_description || "", 5000),
      location: truncate(j.location || "Remote", 200),
      is_remote: true,
      job_type: j.tags?.includes("full-time") ? "Full-time" : j.tags?.includes("contract") ? "Contract" : null,
      tags: Array.isArray(j.tags) ? j.tags.slice(0, 12) : [],
      apply_url: j.url || j.apply_url || null,
      posted_at: j.date ? new Date(j.date * 1000).toISOString() : new Date().toISOString(),
      has_salary: !!(j.salary_min || j.salary_max),
    }));
  } catch (e) {
    console.error("RemoteOK error:", e.message);
    return [];
  }
}

async function fetchArbeitnow(sourceId: string): Promise<any[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
      headers: { "User-Agent": "JobPulse-Agent/1.0" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const jobs = json.data || json.jobs || [];
    if (!Array.isArray(jobs)) return [];
    return jobs.slice(0, 80).map((j: any) => ({
      external_id: String(j.slug || j.id || `${j.company_name}-${j.title}`),
      source_id: sourceId,
      title: truncate(j.title || "Role", 300),
      company: truncate(j.company_name || "Unknown", 200),
      company_logo: j.company_logo || null,
      description: truncate(j.description || "", 5000),
      location: truncate(j.location || (Array.isArray(j.locations) ? j.locations.join(", ") : "Unknown"), 200),
      is_remote: j.remote || (j.location || "").toLowerCase().includes("remote"),
      job_type: j.job_types?.[0] || null,
      tags: Array.isArray(j.tags) ? j.tags.slice(0, 12) : [],
      apply_url: j.url || null,
      posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
      has_salary: false,
    }));
  } catch (e) {
    console.error("Arbeitnow error:", e.message);
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { data: sources } = await supabase
      .from("job_sources")
      .select("id, slug, is_active")
      .eq("is_active", true);

    if (!sources) {
      return new Response(JSON.stringify({ error: "No sources found" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: domains } = await supabase.from("domains").select("id, slug");
    const domainMap = new Map((domains || []).map((d) => [d.slug, d.id]));

    let totalNew = 0;
    let totalSkipped = 0;
    const perSource: Record<string, number> = {};

    for (const source of sources) {
      let jobs: any[] = [];
      if (source.slug === "remoteok") jobs = await fetchRemoteOK(source.id);
      else if (source.slug === "arbeitnow") jobs = await fetchArbeitnow(source.id);
      else continue;

      perSource[source.slug] = jobs.length;

      for (const job of jobs) {
        const domainSlug = classifyDomain(job.title, job.tags || []);
        const domainId = domainSlug ? domainMap.get(domainSlug) ?? null : null;
        const trustScore = computeTrustScore({
          title: job.title,
          company: job.company,
          tags: job.tags || [],
          description: job.description || "",
          apply_url: job.apply_url,
          company_logo: job.company_logo,
          sourceSlug: source.slug,
          domainSlug,
          hasSalary: job.has_salary || false,
        });
        const freshnessLabel = computeFreshness(job.posted_at);

        const { error } = await supabase.from("job_postings").upsert(
          {
            ...job,
            domain_id: domainId,
            trust_score: trustScore,
            freshness_label: freshnessLabel,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "external_id,source_id", ignoreDuplicates: true },
        );

        if (error) {
          if (error.code === "23505") totalSkipped++;
          else console.error("Insert error:", error.message);
        } else {
          totalNew++;
        }
      }

      await supabase
        .from("job_sources")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", source.id);
    }

    // Also update trust scores + freshness for existing jobs that were skipped
    // (their posted_at may have aged since last fetch)
    const { data: existingJobs } = await supabase
      .from("job_postings")
      .select("id, posted_at, trust_score, freshness_label")
      .lt("trust_score", 1)
      .limit(200);

    if (existingJobs && existingJobs.length > 0) {
      for (const ej of existingJobs) {
        const fresh = computeFreshness(ej.posted_at);
        if (fresh !== ej.freshness_label) {
          await supabase.from("job_postings").update({ freshness_label: fresh, trust_score: 50 }).eq("id", ej.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      fetched: totalNew,
      duplicates_skipped: totalSkipped,
      per_source: perSource,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

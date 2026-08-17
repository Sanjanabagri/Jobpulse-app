export interface Domain {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  created_at: string;
}

export interface JobPosting {
  id: string;
  external_id: string;
  source_id: string;
  domain_id: string | null;
  title: string;
  company: string;
  company_logo: string | null;
  description: string | null;
  location: string | null;
  is_remote: boolean;
  job_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  experience: string | null;
  tags: string[];
  apply_url: string | null;
  posted_at: string | null;
  fetched_at: string;
  created_at: string;
  trust_score: number;
  freshness_label: string;
  company_website: string | null;
  has_salary: boolean;
  domains?: Domain;
  match_score?: number;
  matched_skills?: string[];
  is_saved?: boolean;
}

export interface Subscription {
  id: string;
  email: string;
  name: string | null;
  domain_ids: string[];
  location_pref: string | null;
  remote_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DailyDigest {
  id: string;
  digest_date: string;
  domain_id: string;
  job_count: number;
  top_companies: string[];
  new_job_ids: string[];
  trigger_sent: boolean;
  created_at: string;
  domains?: Domain;
}

export interface JobSource {
  id: string;
  name: string;
  slug: string;
  api_url: string | null;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  preferred_domain_id: string | null;
  skills: string[];
  experience_years: number;
  current_job_title: string;
  current_company: string;
  location: string;
  preferred_location: string;
  remote_only: boolean;
  salary_expectation_min: number | null;
  salary_expectation_currency: string;
  profile_completed: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentJob {
  id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string | null;
  is_remote: boolean;
  job_type: string | null;
  tags: string[];
  apply_url: string | null;
  posted_at: string | null;
  domain_id: string | null;
  trust_score?: number;
  freshness_label?: string;
  match_score?: number;
  matched_skills?: string[];
  domains?: Domain;
}

export interface AgentResponse {
  reply: string;
  intent: string;
  jobs: AgentJob[];
  stats?: {
    totalJobs?: number;
    newToday?: number;
    remoteCount?: number;
    subscriberCount?: number;
    domainStats?: Array<{ domain: string; slug: string; count: number; color: string; icon: string }>;
  };
  trending?: Array<{ domain: string; slug: string; count: number; color: string; icon: string }>;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  jobs?: AgentJob[];
  timestamp: number;
  stats?: AgentResponse['stats'];
  trending?: AgentResponse['trending'];
}

export type FeedbackCategory = 'bug' | 'feature_request' | 'general' | 'praise';
export type FeedbackStatus = 'open' | 'reviewing' | 'resolved';

export interface Feedback {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  created_at: string;
}

export interface AppRating {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'pending' | 'accepted' | 'declined';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  role: MemberRole;
  invited_email: string | null;
  status: MemberStatus;
  joined_at: string | null;
  created_at: string;
}

export interface SharedJob {
  id: string;
  team_id: string;
  job_id: string;
  shared_by: string;
  note: string | null;
  created_at: string;
  job_postings?: JobPosting;
}

// ============ JOB APPLICATIONS ============

export type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  created_at: string;
  updated_at: string;
  job_postings?: JobPosting;
}

// ============ COMPANY PROFILES ============

export interface CompanyProfile {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  location: string | null;
  size_range: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============ EMPLOYER JOBS ============

export type EmployerJobStatus = 'draft' | 'active' | 'closed';

export interface EmployerJob {
  id: string;
  company_profile_id: string;
  posted_by: string;
  title: string;
  description: string | null;
  location: string | null;
  is_remote: boolean;
  job_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  tags: string[];
  status: EmployerJobStatus;
  is_promoted: boolean;
  domain_id: string | null;
  apply_url: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
  company_profiles?: CompanyProfile;
  domains?: Domain;
}

// ============ NOTIFICATIONS ============

export type NotificationType = 'job_alert' | 'application_update' | 'team_invite' | 'system' | 'promoted';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ============ EXTENDED PROFILE ============

export interface ExtendedProfile extends Profile {
  resume_url?: string | null;
  is_employer?: boolean;
  company_profile_id?: string | null;
}

// ============ VISITOR SESSIONS ============

export interface VisitorSession {
  id: string;
  user_id: string | null;
  session_id: string | null;
  user_email: string | null;
  user_name: string | null;
  is_signin: boolean;
  page: string | null;
  created_at: string;
}

// ============ ADMIN FEEDBACK (with profile info) ============

export interface AdminFeedback extends Feedback {
  user_email?: string | null;
  user_name?: string | null;
}

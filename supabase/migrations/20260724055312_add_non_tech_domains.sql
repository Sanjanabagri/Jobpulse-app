-- Add non-tech domains to make JobPulse a full-spectrum job portal
INSERT INTO domains (slug, name, icon, color, description) VALUES
  ('network-engineering', 'Network Engineering', 'Network', 'bg-blue-600', 'Network architecture, CCNA/CCNP, routing, switching, firewalls, infrastructure'),
  ('marketing', 'Marketing', 'Megaphone', 'bg-fuchsia-500', 'Digital marketing, SEO, SEM, social media, content marketing, growth'),
  ('finance', 'Finance', 'Landmark', 'bg-green-600', 'Financial analysis, investment banking, FP&A, treasury, risk management'),
  ('hr', 'HR & People', 'Users', 'bg-pink-400', 'Human resources, talent acquisition, recruitment, employee relations, payroll'),
  ('sales', 'Sales', 'TrendingUp', 'bg-amber-600', 'B2B/B2C sales, account management, business development, CRM, lead generation'),
  ('operations', 'Operations', 'Settings', 'bg-slate-600', 'Business operations, process optimization, project operations, administration'),
  ('customer-support', 'Customer Support', 'Headphones', 'bg-teal-600', 'Customer success, technical support, helpdesk, ticketing, CX'),
  ('logistics', 'Logistics & Supply Chain', 'Truck', 'bg-orange-600', 'Supply chain, inventory, warehousing, procurement, shipping, logistics'),
  ('education', 'Education & Training', 'GraduationCap', 'bg-cyan-600', 'Teaching, training, instructional design, LMS, curriculum development'),
  ('content-writing', 'Content & Writing', 'FileText', 'bg-rose-400', 'Copywriting, technical writing, content strategy, editing, blogging'),
  ('accounting', 'Accounting', 'Calculator', 'bg-emerald-600', 'Bookkeeping, taxation, audit, accounts payable/receivable, SAP, Tally'),
  ('legal', 'Legal', 'Scale', 'bg-red-600', 'Corporate law, compliance, contracts, paralegal, legal counsel'),
  ('healthcare', 'Healthcare', 'HeartPulse', 'bg-pink-600', 'Medical, nursing, clinical, healthcare administration, pharma, medical devices'),
  ('consulting', 'Consulting', 'Lightbulb', 'bg-yellow-500', 'Management consulting, strategy, advisory, business analysis, M&A')
ON CONFLICT (slug) DO NOTHING;
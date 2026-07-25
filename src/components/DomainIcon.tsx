import {
  MonitorSmartphone, Server, Layers, Cloud, BrainCircuit, Smartphone,
  Palette, Target, ShieldCheck, Boxes, Bug, Megaphone, Briefcase,
  Network, Landmark, Users, TrendingUp, Settings, Headphones, Truck,
  GraduationCap, FileText, Calculator, Scale, HeartPulse, Lightbulb,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  MonitorSmartphone, Server, Layers, Cloud, BrainCircuit, Smartphone,
  Palette, Target, ShieldCheck, Boxes, Bug, Megaphone, Briefcase,
  Network, Landmark, Users, TrendingUp, Settings, Headphones, Truck,
  GraduationCap, FileText, Calculator, Scale, HeartPulse, Lightbulb,
};

export function DomainIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Briefcase;
  return <Icon className={className} />;
}

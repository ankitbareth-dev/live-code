import {
  LuClipboardCheck,
  LuCode,
  LuCompass,
  LuDatabase,
  LuLayers,
  LuChartLine,
  LuPalette,
  LuPenTool,
  LuShieldCheck,
  LuSmartphone,
  LuTrendingUp,
  LuUsers,
  LuWorkflow,
} from "react-icons/lu";
import type { Service, ServiceCategory } from "../types/domain";

export const serviceCategories: readonly ServiceCategory[] = [
  {
    id: "development",
    name: "Development",
    description: "Build, ship, and harden software.",
  },
  {
    id: "design",
    name: "Design",
    description: "Research, UX, and interface craft.",
  },
  {
    id: "strategy",
    name: "Strategy",
    description: "Positioning, roadmaps, and growth.",
  },
];

export const services: readonly Service[] = [
  {
    id: "architecture-review",
    name: "Solution Architecture Review",
    description:
      "A senior architect reviews your system design, scaling bottlenecks, and technology choices, then shares a prioritised improvement plan.",
    categoryId: "development",
    durationMinutes: 60,
    priceInr: 4500,
    icon: LuLayers,
  },
  {
    id: "code-audit",
    name: "Codebase Health Audit",
    description:
      "Deep review of one focused module — code quality, test coverage gaps, and maintainability risks, with concrete refactoring steps.",
    categoryId: "development",
    durationMinutes: 90,
    priceInr: 6500,
    icon: LuCode,
  },
  {
    id: "devops-consultation",
    name: "CI/CD & DevOps Consultation",
    description:
      "Improve build pipelines, deployment automation, and monitoring. You leave with a working pipeline checklist for your stack.",
    categoryId: "development",
    durationMinutes: 60,
    priceInr: 4000,
    icon: LuWorkflow,
  },
  {
    id: "mobile-mvp-planning",
    name: "Mobile App MVP Planning",
    description:
      "Scope the smallest shippable version of your app: feature cut-off, tech stack selection, and a realistic delivery roadmap.",
    categoryId: "development",
    durationMinutes: 90,
    priceInr: 5500,
    icon: LuSmartphone,
  },
  {
    id: "database-clinic",
    name: "Database Performance Clinic",
    description:
      "Slow queries, indexing strategy, and schema review for PostgreSQL or MySQL workloads, measured against your real access patterns.",
    categoryId: "development",
    durationMinutes: 60,
    priceInr: 4000,
    icon: LuDatabase,
  },
  {
    id: "security-review",
    name: "Application Security Review",
    description:
      "OWASP-aligned review of your web application — authentication flows, data handling, and a ranked list of vulnerabilities to fix first.",
    categoryId: "development",
    durationMinutes: 120,
    priceInr: 9000,
    icon: LuShieldCheck,
  },
  {
    id: "ux-usability-audit",
    name: "UX & Usability Audit",
    description:
      "Task-based walkthrough of your product with heuristic scoring, a prioritised usability issue list, and quick-win recommendations.",
    categoryId: "design",
    durationMinutes: 60,
    priceInr: 3500,
    icon: LuClipboardCheck,
  },
  {
    id: "design-system-foundations",
    name: "Design System Foundations",
    description:
      "Component inventory, design tokens, and accessibility guidelines to bring visual consistency across your product surface.",
    categoryId: "design",
    durationMinutes: 90,
    priceInr: 5000,
    icon: LuPalette,
  },
  {
    id: "product-redesign-session",
    name: "Product Redesign Session",
    description:
      "Hands-on session to rethink your product’s key flows, including quick wireframes you can put in front of users immediately.",
    categoryId: "design",
    durationMinutes: 120,
    priceInr: 8000,
    icon: LuPenTool,
  },
  {
    id: "product-strategy-workshop",
    name: "Product Strategy Workshop",
    description:
      "Define the problem worth solving: market positioning, user segments, and a 90-day execution plan your team can start Monday.",
    categoryId: "strategy",
    durationMinutes: 120,
    priceInr: 10000,
    icon: LuCompass,
  },
  {
    id: "tech-due-diligence",
    name: "Tech Due Diligence",
    description:
      "Investor- or acquirer-focused review of your engineering organisation, codebase risks, and scalability under growth.",
    categoryId: "strategy",
    durationMinutes: 90,
    priceInr: 8500,
    icon: LuTrendingUp,
  },
  {
    id: "data-analytics-roadmap",
    name: "Data & Analytics Roadmap",
    description:
      "Plan measurement from the start — event taxonomy, dashboard priorities, and the metrics that matter at your stage.",
    categoryId: "strategy",
    durationMinutes: 60,
    priceInr: 4500,
    icon: LuChartLine,
  },
  {
    id: "engineering-team-scaling",
    name: "Engineering Team Scaling Plan",
    description:
      "Hiring plan, interview loop design, and team topology for the next twelve months of engineering growth.",
    categoryId: "strategy",
    durationMinutes: 60,
    priceInr: 4500,
    icon: LuUsers,
  },
];

const servicesById: ReadonlyMap<string, Service> = new Map(
  services.map((service) => [service.id, service]),
);

const categoriesById: ReadonlyMap<string, ServiceCategory> = new Map(
  serviceCategories.map((category) => [category.id, category]),
);

/** Lookup by id; returns undefined for unknown or removed service ids. */
export function findService(id: string): Service | undefined {
  return servicesById.get(id);
}

export function findCategory(id: string): ServiceCategory | undefined {
  return categoriesById.get(id);
}

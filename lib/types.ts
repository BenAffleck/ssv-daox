export enum ModuleStatus {
  ACTIVE = 'active',
  COMING_SOON = 'coming_soon',
}

export interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: ModuleStatus;
  sortOrder: number;
}

export enum ExternalToolCategory {
  SIMULATOR = 'Simulator',
  CALCULATOR = 'Calculator',
  DASHBOARD = 'Dashboard',
  EXPLORER = 'Explorer',
  CLAIM = 'Claim',
}

export interface ExternalTool {
  id: string;
  name: string;
  description: string;
  categories: ExternalToolCategory[];
  inputs: string;
  outputs: string;
  host: string;
  url: string;
  featured?: boolean;
  sortOrder: number;
}

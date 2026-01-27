export enum ModuleStatus {
  ACTIVE = 'active',
  COMING_SOON = 'coming_soon',
}

export interface Module {
  id: string;
  slug: string;
  name: string;
  status: ModuleStatus;
  sortOrder: number;
}

export interface CommunityTool {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
  sortOrder: number;
}

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

export type ComponentType = 
  | 'chart' 
  | 'card' 
  | 'gauge' 
  | 'map' 
  | 'indicator' 
  | 'table' 
  | 'widget' 
  | 'panel' 
  | 'module'
  | 'banner';

export interface ComponentConfig {
  id: string;
  name: string;
  type?: ComponentType;
  title?: string;
  subtitle?: string;
  visible?: boolean;
  order?: number;
  width?: 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4' | 'auto';
  height?: 'auto' | '200px' | '300px' | '400px' | '500px' | '600px';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  theme?: 'default' | 'dark' | 'light' | 'cyan' | 'slate' | 'emerald' | 'amber';
  bgColor?: string;
  borderColor?: string;
  borderWidth?: 'none' | '1px' | '2px' | '4px';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  transparency?: number; // 0 (opaque) to 100 (fully transparent)
  padding?: 'p-0' | 'p-2' | 'p-4' | 'p-6' | 'p-8';
  margin?: 'm-0' | 'm-2' | 'm-4' | 'my-2' | 'my-4';
  station?: string;
  municipality?: string;
  dataSource?: string;
  updateInterval?: string;
  showLegend?: boolean;
  showProjections?: boolean;
  showUncertaintyBands?: boolean;
  icon?: string;
  typographySize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  isLocked?: boolean;
  customProps?: Record<string, any>;
}

export interface DashboardLayoutState {
  version: number;
  updatedAt: string;
  components: Record<string, ComponentConfig>;
}

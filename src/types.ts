export interface WorkZoneItem {
  workZoneLabel: string;
  workZoneName: string;
  status: string;
  travelArea: string;
  keys: string[];
}

export interface WorkZoneResponse {
  items: WorkZoneItem[];
  hasMore: boolean;
  offset: number;
  totalResults: number;
}
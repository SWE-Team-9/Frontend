export interface ResolveResponse {
  matched: boolean;
  resourceType?: "TRACK" | "PLAYLIST" | "USER";
  id?: string;
  slug?: string;
  handle?: string;
}
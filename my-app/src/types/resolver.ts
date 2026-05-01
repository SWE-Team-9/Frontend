export type ResolveResponse = {
  matched: boolean;
  resourceType?: "USER" | "TRACK" | "PLAYLIST";
  id?: string;
  handle?: string;
  slug?: string;
};
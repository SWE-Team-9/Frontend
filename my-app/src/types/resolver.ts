export type ResolvableType = "TRACK" | "USER" | "PLAYLIST";

export interface ResolveResponse {
  type: ResolvableType;
  resource_id: string;
  owner_id?: string; // when resolving a user there's no separate owner
}
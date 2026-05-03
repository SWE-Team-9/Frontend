export type ResolveResponse =
  | { matched: false }
  | { matched: true; resourceType: "USER";     id: string; handle: string }
  | { matched: true; resourceType: "TRACK";    id: string; slug: string   }
  | { matched: true; resourceType: "PLAYLIST"; id: string; slug: string   };
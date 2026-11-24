/** Staff roles, highest first. Shared by server and client (no secrets here). */
export const STAFF_ROLES = ["admin", "agent", "editor"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const roleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  agent: "Agent",
  editor: "Editor",
};

export const roleDescriptions: Record<StaffRole, string> = {
  admin: "Everything, including settings, team roles and deleting leads.",
  agent: "Listings, content and leads (enquiries and saved searches).",
  editor: "Listings and content. No access to leads' personal details.",
};

/** Who can do what. The database (RLS, migration 0003) enforces the same rules. */
export const can = {
  manageLeads: (r: StaffRole) => r === "admin" || r === "agent",
  deleteLeads: (r: StaffRole) => r === "admin",
  editSettings: (r: StaffRole) => r === "admin",
  manageTeam: (r: StaffRole) => r === "admin",
  deleteListings: (r: StaffRole) => r === "admin",
};

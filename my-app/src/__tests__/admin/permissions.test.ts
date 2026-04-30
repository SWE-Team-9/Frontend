/**
 * Module 11: Permission matrix tests
 *
 * Tests that RoleGuard / canPerform correctly enforces
 * the ADMIN > MODERATOR > USER hierarchy.
 */

import { canPerform, PermissionAction } from "@/src/components/admin/permissions";
import { AdminUser } from "@/src/types/admin";

function makeUser(role: AdminUser["system_role"]): AdminUser {
  return {
    id: `${role.toLowerCase()}-1`,
    display_name: `${role} User`,
    handle: role.toLowerCase(),
    email: `${role.toLowerCase()}@test.com`,
    system_role: role,
    account_status: "ACTIVE",
    is_verified: true,
    created_at: new Date().toISOString(),
    avatar_url: null,
    account_type: "FREE",
    track_count: 0,
    report_count: 0,
    last_login_at: new Date().toISOString(),
  };
}

const adminUser = makeUser("ADMIN");
const modUser = makeUser("MODERATOR");
const regularUser = makeUser("USER");

// Actions only ADMIN can perform
const ADMIN_ONLY_ACTIONS: PermissionAction[] = ["WARN_USER", "SUSPEND_USER", "BAN_USER"];

// Actions MODERATOR and ADMIN can perform
const MOD_ADMIN_ACTIONS: PermissionAction[] = ["VIEW_REPORTS", "RESOLVE_REPORT", "REJECT_REPORT"];

describe("canPerform — ADMIN capabilities", () => {
  it.each(ADMIN_ONLY_ACTIONS)("ADMIN can perform %s", (action) => {
    expect(canPerform(adminUser, action)).toBe(true);
  });

  it.each(MOD_ADMIN_ACTIONS)("ADMIN can perform %s", (action) => {
    expect(canPerform(adminUser, action)).toBe(true);
  });
});

describe("canPerform — MODERATOR capabilities", () => {
  it.each(MOD_ADMIN_ACTIONS)("MODERATOR can perform %s", (action) => {
    expect(canPerform(modUser, action)).toBe(true);
  });

  it.each(ADMIN_ONLY_ACTIONS)("MODERATOR CANNOT perform %s", (action) => {
    expect(canPerform(modUser, action)).toBe(false);
  });
});

describe("canPerform — USER capabilities", () => {
  const allActions: PermissionAction[] = [...ADMIN_ONLY_ACTIONS, ...MOD_ADMIN_ACTIONS];

  it.each(allActions)("USER CANNOT perform %s", (action) => {
    expect(canPerform(regularUser, action)).toBe(false);
  });
});

describe("canPerform — null user", () => {
  it("returns false for null user on any action", () => {
    expect(canPerform(null, "VIEW_REPORTS")).toBe(false);
    expect(canPerform(null, "BAN_USER")).toBe(false);
  });
});

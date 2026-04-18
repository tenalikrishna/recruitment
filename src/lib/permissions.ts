export type Role = "manager" | "panelist" | "tele_panelist";

export function canViewApplicant(
  role: string,
  userId: string,
  applicant: { telePanelistId?: string | null }
): boolean {
  if (role === "manager") return true;
  if (role === "panelist") return true; // panelists see assigned + Pending Interview
  if (role === "tele_panelist") {
    return applicant.telePanelistId === userId;
  }
  return false;
}

export function canChangeStage(role: string): boolean {
  return role === "manager";
}

export function canAssignTelePanelist(role: string): boolean {
  return role === "manager";
}

export function canSubmitTeleFeedback(role: string): boolean {
  return role === "tele_panelist" || role === "manager";
}

export function canManageUsers(role: string): boolean {
  return role === "manager";
}

export function canAddApplicant(role: string): boolean {
  return role === "manager";
}

export function canEditApplicant(role: string): boolean {
  return role === "manager";
}

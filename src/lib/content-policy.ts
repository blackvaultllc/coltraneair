// Compliance: US federal + Alabama state acceptable-use policy.
// Blocks the categories that no business in the US may host: credible
// threats of violence, doxxing, hate-based harassment, sexual content
// involving minors, instructions for clearly illegal activity, etc.
//
// Intentionally narrow — false positives are worse than missed informal
// language. All blocks/flags are also written to audit_log for review.

export const COMPLIANCE_BANNER =
  "All communications are subject to United States federal law and the laws of the State of Alabama. " +
  "Harassment, threats of violence, illegal solicitations, doxxing, and content harmful to minors are " +
  "prohibited and logged for review.";

// Word-boundary patterns, case-insensitive. Keep this list conservative.
const PROHIBITED: { label: string; pattern: RegExp }[] = [
  { label: "credible threat of violence", pattern: /\b(?:i(?:'?m| am| will| wanna| want to)\s+(?:going to\s+)?(?:kill|murder|shoot|stab|bomb|hurt)\s+(?:you|him|her|them|\w+))\b/i },
  { label: "threat of violence", pattern: /\b(?:kill|shoot|stab|bomb|lynch)\s+(?:you|him|her|them|all of (?:you|them))\b/i },
  { label: "bomb / mass-casualty threat", pattern: /\b(?:plant(?:ing)?\s+a\s+bomb|shoot\s+up\s+(?:the|a)\s+\w+|mass\s+shoot(?:ing|er))\b/i },
  { label: "racial slur", pattern: /\b(?:n[i1!]gg(?:er|a)|f[a@]gg(?:ot|et)|ch[i1]nk|sp[i1]c|k[i1]ke|tr[a@]nny)s?\b/i },
  { label: "sexual content involving minors", pattern: /\b(?:child|minor|underage|kid|teen|preteen)\s+(?:porn|nudes?|sex(?:ual)?)\b/i },
  { label: "doxxing / SSN sharing", pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: "explicit illegal solicitation", pattern: /\b(?:buy|sell|sell\s+me)\s+(?:meth|crack|heroin|fentanyl|illegal\s+guns?)\b/i },
];

export type PolicyCheck =
  | { ok: true }
  | { ok: false; reason: string };

export function checkContent(text: string): PolicyCheck {
  const t = text.normalize("NFKC");
  for (const rule of PROHIBITED) {
    if (rule.pattern.test(t)) {
      return { ok: false, reason: `Blocked: ${rule.label}. This content is prohibited under federal/Alabama law.` };
    }
  }
  return { ok: true };
}

// Fire-and-forget audit logger. Always returns a promise but we never await
// in hot paths so a logging failure can't block the user's action.
export async function logAudit(
  // Lazy import to avoid a hard dep cycle in tests; using `any` keeps this
  // helper portable across the two supabase clients without leaking types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({ user_id: userId, action, resource, details: details ?? null });
  } catch {
    // swallow — audit failures must never block UX
  }
}

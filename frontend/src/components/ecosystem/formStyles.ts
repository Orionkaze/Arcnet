// Shared field styling for the ecosystem creation modals, so "Post a Role" and
// "Become a Mentor" match each other and the existing CreatePrivateHubModal.
export const LABEL =
  "block text-xs font-chakra text-[var(--c-text-muted)] mb-1 uppercase tracking-wider";

export const FIELD =
  "w-full bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded p-2 text-white font-inter text-sm focus:outline-none focus:border-[#10B981] transition-colors";

export const TEXTAREA = `${FIELD} resize-none`;

export const SUBMIT =
  "w-full py-2.5 rounded bg-[#10B981] text-[var(--c-surface)] font-chakra font-bold text-sm uppercase tracking-wider hover:bg-[#00d0e0] transition-colors mt-2 disabled:opacity-50";

export const OVERLAY =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";

export const CARD =
  "bg-[var(--c-surface)] border border-[var(--c-border)] rounded-lg p-6 w-[460px] max-w-[92vw] max-h-[88vh] overflow-y-auto shadow-2xl relative";

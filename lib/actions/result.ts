/**
 * Shared helpers for Server Actions.
 *
 * Actions return `{ error }` rather than throwing, so a form can show the
 * message inline. `at` is a success marker with a changing value: the form
 * components watch it in an effect to clear themselves after a successful
 * submit, which a plain `null` error could not distinguish from a repeat.
 */
export type ActionResult = {
  error: string | null;
  at?: number;
  taskId?: string;
};

export const ok = (taskId?: string): ActionResult =>
  taskId ? { error: null, at: Date.now(), taskId } : { error: null, at: Date.now() };

export const fail = (message: string): ActionResult => ({ error: message });

/** Trimmed string field, or "" when absent. */
export function readString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** "true" only when the field is exactly "true", so a missing field means false. */
export function readBoolean(formData: FormData, key: string): boolean {
  return readString(formData, key) === "true";
}

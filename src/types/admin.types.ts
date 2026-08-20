/**
 * Request/response shapes for the admin-data-cleanup edge function.
 * Keep in sync with supabase/functions/admin-data-cleanup/index.ts.
 */

/** Typed confirmation phrase required by execute mode (validated server-side). */
export const CLEANUP_CONFIRMATION_PHRASE = "ELIMINAR";

export type CleanupEntityKey = "messages" | "tasks" | "reports";

export type CleanupPreviewRequest = {
  mode: "preview";
};

export type CleanupExecuteRequest = {
  mode: "execute";
  /** Exact cutoff ISO timestamp returned by a prior preview. */
  cutoff: string;
  confirmationPhrase: string;
};

export type CleanupRequest = CleanupPreviewRequest | CleanupExecuteRequest;

export type CleanupEntityPreview = {
  rows: number;
  objects: number;
};

export type CleanupPreviewResponse = {
  cutoff: string;
  entities: Record<CleanupEntityKey, CleanupEntityPreview>;
};

export type CleanupEntityExecuteResult = {
  rowsDeleted: number;
  objectsDeleted: number;
  error?: string;
};

export type CleanupExecuteResponse = {
  cutoff: string;
  entities: Record<CleanupEntityKey, CleanupEntityExecuteResult>;
};

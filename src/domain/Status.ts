export const Status = {
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
} as const;

export type Status = (typeof Status)[keyof typeof Status];
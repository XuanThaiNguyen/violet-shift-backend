export const API_STATUS = {
  OK: "OK",
} as const;

export type ApiStatus = (typeof API_STATUS)[keyof typeof API_STATUS];

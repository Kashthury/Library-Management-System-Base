/** Shared API client configuration. */
import { API_BASE_URL } from "../utils/apiEndpoint";

export class ApiError extends Error {
  fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
  }
}

export const apiClient = {
  baseUrl: API_BASE_URL,

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      let message = "";
      let fieldErrors: Record<string, string> | undefined;

      if (responseText) {
        try {
          const body: unknown = JSON.parse(responseText);
          if (body && typeof body === "object") {
            const errorBody = body as Record<string, unknown>;
            const primaryMessage = [errorBody.message, errorBody.detail]
              .find((value): value is string => typeof value === "string" && value.trim().length > 0);
            const rawFieldErrors = [errorBody.fieldErrors, errorBody.errors, errorBody.validationErrors]
              .find((value) => value !== undefined && value !== null);

            if (primaryMessage) {
              message = primaryMessage;
            }

            if (rawFieldErrors && typeof rawFieldErrors === "object" && !Array.isArray(rawFieldErrors)) {
              fieldErrors = Object.fromEntries(Object.entries(rawFieldErrors as Record<string, unknown>)
                .map(([field, value]) => [field, typeof value === "string" ? value : ""])
                .filter(([, value]) => Boolean(value)));
            } else if (Array.isArray(rawFieldErrors)) {
              fieldErrors = {};
              message ||= rawFieldErrors.map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                  const error = item as Record<string, unknown>;
                  const field = typeof error.field === "string" ? error.field : "";
                  const description = [error.defaultMessage, error.message]
                    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
                  if (field && description) fieldErrors![field] = description;
                  return [field, description].filter(Boolean).join(": ");
                }
                return "";
              }).filter(Boolean).join("\n");
            }

            if (!message && typeof errorBody.error === "string" && errorBody.error !== "Conflict") {
              message = errorBody.error;
            } else if (!message && typeof errorBody.title === "string") {
              message = errorBody.title;
            }
          }
        } catch {
          message = responseText;
        }
      }

      const hasFieldErrors = Boolean(fieldErrors && Object.keys(fieldErrors).length > 0);
      if (hasFieldErrors) message = "";
      throw new ApiError(message || (hasFieldErrors ? "" : `Request failed (${response.status} ${response.statusText})`), fieldErrors);
    }

    if (response.status === 204) return undefined as T;
    const responseText = await response.text();
    if (!responseText.trim()) return undefined as T;
    return JSON.parse(responseText) as T;
  },
};

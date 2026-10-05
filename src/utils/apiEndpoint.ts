/** Base URL and API endpoint paths used by the application. */
export const API_BASE_URL = "http://localhost:8080";

export const API_ENDPOINTS = {
  students: "/api/students",
  studentById: (id: number) => `/api/students/${id}`,
  studentsByGender: (gender: string) => `/api/students/gender/${gender}`,
  studentFine: (id: number) => `/api/students/${id}/fine`,
  books: "/api/books",
  borrow: "/api/borrow",
  return: "/api/return",
  librarySummary: "/api/library/summary",
} as const;

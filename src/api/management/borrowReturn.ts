import type { BorrowInput, BorrowRecord } from "../../types";
import { apiClient } from "../../lib/api";
import { API_ENDPOINTS } from "../../utils/apiEndpoint";
import { booksApi } from "./books";
import { studentsApi } from "./students";

/** Borrowing and returning API methods. */
export const borrowReturnApi = {
  getStudents: studentsApi.getAll,
  getBooks: booksApi.getAll,

  getRecords(): Promise<BorrowRecord[]> {
    return apiClient.request<BorrowRecord[]>(API_ENDPOINTS.borrow);
  },

  borrow(input: BorrowInput): Promise<BorrowRecord> {
    return apiClient.request<BorrowRecord>(API_ENDPOINTS.borrow, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  return(input: BorrowInput): Promise<BorrowRecord> {
    return apiClient.request<BorrowRecord>(API_ENDPOINTS.return, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

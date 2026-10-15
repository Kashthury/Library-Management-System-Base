export type Gender = "M" | "F";

export interface Student {
  studentId: number;
  studentName: string;
  age: number;
  gender: Gender;
  course: string;
  fineAmount: number;
}

export interface Book {
  bookId: number;
  bookTitle: string;
  author: string;
  category: string;
  availableQuantity: number;
}

export interface BorrowRecord {
  borrowRecordId: number;
  borrowDate: string;
  dueDate?: string | null;
  returnDate: string | null;
  numberOfBooks: number;
  studentId: number;
  bookId: number;
  overdueDays?: number | null;
  fineAmount?: number | null;
}

export interface StudentInput {
  studentName: string;
  age: number;
  gender: Gender;
  course: string;
}

export interface BookInput {
  bookTitle: string;
  author: string;
  category: string;
  availableQuantity: number;
}

export interface BorrowInput {
  studentId: number;
  bookId: number;
  numberOfBooks: number;
  borrowDate?: string;
  dueDate?: string;
  returnDate?: string;
}

export interface FineInput {
  studentId: number;
  lateDays: number;
}

export interface LibrarySummary {
  totalStudents: number;
  totalMaleStudents: number;
  totalFemaleStudents: number;
  totalBooksCurrentlyBorrowed: number;
  studentsBorrowing0Books: number;
  studentsBorrowing1Book: number;
  studentsBorrowing2Books: number;
  studentsBorrowing3Books: number;
  studentsBorrowing4Books: number;
  studentsBorrowing5Books: number;
  totalRegisteredBooks: number;
  totalAvailableBooks: number;
  totalBorrowedBooks: number;
}

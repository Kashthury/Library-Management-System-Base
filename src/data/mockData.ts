import type { Book, BorrowRecord, Student } from "../types";

export const mockStudents: Student[] = [
  { studentId: 1, studentName: "Kamal Perera", age: 21, gender: "M", course: "Computer Science", fineAmount: 0 },
  { studentId: 2, studentName: "Nimali Fernando", age: 22, gender: "F", course: "Information Technology", fineAmount: 100 },
  { studentId: 3, studentName: "Arun Kumar", age: 20, gender: "M", course: "Software Engineering", fineAmount: 0 },
  { studentId: 4, studentName: "Tharushi Silva", age: 23, gender: "F", course: "Business Management", fineAmount: 250 },
  { studentId: 5, studentName: "Suresh Raj", age: 21, gender: "M", course: "Data Science", fineAmount: 0 }
];

export const mockBooks: Book[] = [
  { bookId: 1, bookTitle: "Clean Code", author: "Robert C. Martin", category: "Programming", availableQuantity: 4 },
  { bookId: 2, bookTitle: "Effective Java", author: "Joshua Bloch", category: "Programming", availableQuantity: 3 },
  { bookId: 3, bookTitle: "The Alchemist", author: "Paulo Coelho", category: "Fiction", availableQuantity: 7 },
  { bookId: 4, bookTitle: "Database System Concepts", author: "Abraham Silberschatz", category: "Database", availableQuantity: 2 },
  { bookId: 5, bookTitle: "Atomic Habits", author: "James Clear", category: "Self Help", availableQuantity: 5 }
];

export const mockBorrowRecords: BorrowRecord[] = [
  { borrowRecordId: 1, borrowDate: "2026-10-01", returnDate: null, numberOfBooks: 2, studentId: 1, bookId: 1 },
  { borrowRecordId: 2, borrowDate: "2026-10-02", returnDate: null, numberOfBooks: 1, studentId: 2, bookId: 3 },
  { borrowRecordId: 3, borrowDate: "2026-09-28", returnDate: null, numberOfBooks: 2, studentId: 3, bookId: 2 },
  { borrowRecordId: 4, borrowDate: "2026-09-25", returnDate: "2026-10-03", numberOfBooks: 1, studentId: 4, bookId: 5 }
];
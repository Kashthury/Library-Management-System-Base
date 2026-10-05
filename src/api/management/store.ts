import { mockBooks, mockBorrowRecords, mockStudents } from "../../data/mockData";
import type { Book, Student } from "../../types";

/** Shared in-memory mock database used by all management services. */
export const database = {
  students: [...mockStudents],
  books: [...mockBooks],
  borrowRecords: [...mockBorrowRecords],
};

export const wait = <T,>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 150));

export const copy = <T extends object>(value: T): T => ({ ...value });

export function findStudent(id: number): Student {
  const student = database.students.find((item) => item.studentId === id);
  if (!student) throw new Error("Student Not Found");
  return student;
}

export function findBook(id: number): Book {
  const book = database.books.find((item) => item.bookId === id);
  if (!book) throw new Error("Book Not Found");
  return book;
}

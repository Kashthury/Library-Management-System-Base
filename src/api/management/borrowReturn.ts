import type { BorrowInput, BorrowRecord } from "../../types";
import { MAX_BORROWED_BOOKS } from "../../utils/constants";
import { copy, database, findBook, findStudent, wait } from "./store";
import { booksApi } from "./books";
import { studentsApi } from "./students";

/** Borrowing and returning API methods. */
export const borrowReturnApi = {
  getStudents: studentsApi.getAll,
  getBooks: booksApi.getAll,

  async getRecords(): Promise<BorrowRecord[]> {
    return wait(database.borrowRecords.map(copy));
  },

  async borrow(input: BorrowInput): Promise<BorrowRecord> {
    if (input.numberOfBooks <= 0) throw new Error("Number of books must be greater than 0");
    findStudent(input.studentId);
    const book = findBook(input.bookId);
    if (book.availableQuantity < input.numberOfBooks) throw new Error("Insufficient available quantity");

    const currentCount = database.borrowRecords
      .filter((record) => record.studentId === input.studentId && record.returnDate === null)
      .reduce((total, record) => total + record.numberOfBooks, 0);
    if (currentCount + input.numberOfBooks > MAX_BORROWED_BOOKS) {
      throw new Error(`Student cannot borrow more than ${MAX_BORROWED_BOOKS} books`);
    }

    book.availableQuantity -= input.numberOfBooks;
    const record: BorrowRecord = {
      borrowRecordId: Math.max(0, ...database.borrowRecords.map((item) => item.borrowRecordId)) + 1,
      borrowDate: input.borrowDate ?? new Date().toISOString().slice(0, 10),
      returnDate: null,
      numberOfBooks: input.numberOfBooks,
      studentId: input.studentId,
      bookId: input.bookId,
    };
    database.borrowRecords.push(record);
    return wait(copy(record));
  },

  async return(input: BorrowInput): Promise<BorrowRecord> {
    if (input.numberOfBooks <= 0) throw new Error("Number of books must be greater than 0");
    findStudent(input.studentId);
    const book = findBook(input.bookId);
    const record = database.borrowRecords.find(
      (item) => item.studentId === input.studentId && item.bookId === input.bookId && item.returnDate === null && item.numberOfBooks > 0,
    );
    if (!record) throw new Error("No active borrow record found for this book");
    if (input.numberOfBooks > record.numberOfBooks) throw new Error("Return quantity exceeds currently borrowed quantity");

    record.numberOfBooks -= input.numberOfBooks;
    book.availableQuantity += input.numberOfBooks;
    if (record.numberOfBooks === 0) {
      record.returnDate = input.returnDate ?? new Date().toISOString().slice(0, 10);
    }
    return wait(copy(record));
  },
};

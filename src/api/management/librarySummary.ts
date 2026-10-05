import type { LibrarySummary } from "../../types";
import { database, wait } from "./store";

/** Library summary API method. */
export const librarySummaryApi = {
  async get(): Promise<LibrarySummary> {
    const activeRecords = database.borrowRecords.filter(
      (record) => record.returnDate === null && record.numberOfBooks > 0,
    );
    const borrowCounts = database.students.map((student) =>
      activeRecords
        .filter((record) => record.studentId === student.studentId)
        .reduce((total, record) => total + record.numberOfBooks, 0),
    );
    const totalBorrowed = activeRecords.reduce((total, record) => total + record.numberOfBooks, 0);
    const totalAvailable = database.books.reduce((total, book) => total + book.availableQuantity, 0);

    return wait({
      totalStudents: database.students.length,
      totalMaleStudents: database.students.filter((student) => student.gender === "M").length,
      totalFemaleStudents: database.students.filter((student) => student.gender === "F").length,
      totalBooksCurrentlyBorrowed: totalBorrowed,
      studentsBorrowing0Books: borrowCounts.filter((count) => count === 0).length,
      studentsBorrowing1Book: borrowCounts.filter((count) => count === 1).length,
      studentsBorrowing2Books: borrowCounts.filter((count) => count === 2).length,
      studentsBorrowing3Books: borrowCounts.filter((count) => count === 3).length,
      studentsBorrowing4Books: borrowCounts.filter((count) => count === 4).length,
      studentsBorrowing5Books: borrowCounts.filter((count) => count === 5).length,
      totalRegisteredBooks: totalAvailable + totalBorrowed,
      totalAvailableBooks: totalAvailable,
      totalBorrowedBooks: totalBorrowed,
    });
  },
};

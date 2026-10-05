import type { FineInput, Gender, Student, StudentInput } from "../../types";
import { FINE_RULES } from "../../utils/constants";
import { copy, database, findStudent, wait } from "./store";

/** Student management API methods. */
export const studentsApi = {
  async getAll(): Promise<Student[]> {
    return wait(database.students.map(copy));
  },

  async getById(id: number): Promise<Student> {
    return wait(copy(findStudent(id)));
  },

  async getByGender(gender: Gender): Promise<Student[]> {
    return wait(database.students.filter((student) => student.gender === gender).map(copy));
  },

  async create(input: StudentInput): Promise<Student> {
    const student: Student = {
      studentId: Math.max(0, ...database.students.map((item) => item.studentId)) + 1,
      ...input,
      fineAmount: 0,
    };
    database.students.push(student);
    return wait(copy(student));
  },

  async update(id: number, input: StudentInput): Promise<Student> {
    const student = findStudent(id);
    Object.assign(student, input);
    return wait(copy(student));
  },

  async remove(id: number): Promise<void> {
    findStudent(id);
    const hasActiveBorrow = database.borrowRecords.some(
      (record) => record.studentId === id && record.returnDate === null && record.numberOfBooks > 0,
    );
    if (hasActiveBorrow) throw new Error("Cannot delete student with active borrow records");

    database.students = database.students.filter((student) => student.studentId !== id);
    database.borrowRecords = database.borrowRecords.filter((record) => record.studentId !== id);
    return wait(undefined);
  },

  async calculateFine(input: FineInput): Promise<Student> {
    const student = findStudent(input.studentId);
    if (input.lateDays < 0) throw new Error("Late days cannot be negative");
    const rule = FINE_RULES.find(({ min, max }) => input.lateDays >= min && input.lateDays <= max);
    if (!rule) throw new Error("Fine rule not found");
    student.fineAmount = rule.amount;
    return wait(copy(student));
  },
};

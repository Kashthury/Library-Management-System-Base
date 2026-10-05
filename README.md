# Library Management System

A beginner-friendly React + TypeScript library app. It uses mock data, so no backend is needed to run it.

## Run the app

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Simple project structure

```text
src/
  components/   Reusable visual pieces
  data/         Starter mock records
  pages/        One screen per feature
  services/     Shared API calls and mock behavior
  types/        Data shapes used by the app
  utils/        Shared constants and helpers
```

Start with `src/pages/Students.tsx` to see how a screen works. Each page imports its service from `src/api/management/`: `students.ts`, `books.ts`, `borrowReturn.ts`, or `librarySummary.ts`. Shared mock data and helpers are in `store.ts`; shared client configuration is in `src/lib/api.ts`; endpoint URLs are in `src/utils/apiEndpoint.ts`. Starter records are in `src/data/mockData.ts`.

## Call the shared API

```ts
import { studentsApi } from "../api/management/students";

const students = await studentsApi.getAll();
const newStudent = await studentsApi.create({
  studentName: "Alex Lee",
  age: 20,
  gender: "M",
  course: "Computer Science",
});
```

Each page uses the matching service: `studentsApi`, `booksApi`, `borrowReturnApi`, or `librarySummaryApi`. The mock data stays in memory and resets when the page is refreshed.

## Connect a backend later

Replace the mock functions in the matching `src/api/management/*.ts` file with calls through the shared `apiClient` in `src/lib/api.ts`. Keep the same function names and return types so the pages do not need to change. Endpoint paths are listed in `src/utils/apiEndpoint.ts`.

```ts
async getAll(): Promise<Student[]> {
  return apiClient.request<Student[]>(API_ENDPOINTS.students);
}
```

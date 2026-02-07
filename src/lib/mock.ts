import type { ScheduleItem } from "./types";

export function generateMockSchedule(): ScheduleItem[] {
  return [
    { id: "1", title: "Deep Work: Algorithms", time: "09:00 - 10:30", type: "study" },
    { id: "2", title: "Short Break", time: "10:30 - 10:45", type: "break" },
    { id: "3", title: "Class: Project Management", time: "11:00 - 12:15", type: "class" },
    { id: "4", title: "Lunch + Walk", time: "12:30 - 13:15", type: "health" },
    { id: "5", title: "Focus Block: Aurora Build", time: "14:00 - 16:00", type: "study" },
  ];
}
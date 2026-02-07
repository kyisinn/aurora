export type ConnectedTools = {
  googleCalendar: boolean;
  notion: boolean;
  canvas: boolean;
};

export type Preferences = {
  studyTime: "morning" | "afternoon" | "night";
  academicRigor: number; // 0..100
  focusBlocks: number;   // hours/day
};

export type ScheduleItem = {
  id: string;
  title: string;
  time: string;     // "09:00 - 10:30"
  type: "study" | "class" | "break" | "health" | "admin";
};

export type AuroraProfile = {
  tools: ConnectedTools;
  preferences: Preferences;
  scheduleDraft: ScheduleItem[];
};
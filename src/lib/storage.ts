import type { AuroraProfile, ConnectedTools, Preferences, ScheduleItem } from "./types";

const KEY = "aurora_profile_v1";

const defaultProfile: AuroraProfile = {
  tools: { googleCalendar: true, notion: false, canvas: false },
  preferences: { studyTime: "morning", academicRigor: 65, focusBlocks: 3 },
  scheduleDraft: [],
};

export function loadProfile(): AuroraProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: AuroraProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function updateTools(tools: ConnectedTools) {
  const p = loadProfile();
  saveProfile({ ...p, tools });
}

export function updatePreferences(preferences: Preferences) {
  const p = loadProfile();
  saveProfile({ ...p, preferences });
}

export function updateScheduleDraft(scheduleDraft: ScheduleItem[]) {
  const p = loadProfile();
  saveProfile({ ...p, scheduleDraft });
}

export function resetProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
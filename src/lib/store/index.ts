import { atom } from "jotai";

// Example atoms
export const userPreferencesAtom = atom({
  theme: "light",
  notifications: true,
});

export const messageCountAtom = atom(0);

// Derived atom example
export const hasUnreadMessagesAtom = atom((get) => get(messageCountAtom) > 0);

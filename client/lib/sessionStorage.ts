const SESSION_STORAGE_KEY = "sessionId";
const USERNAME_KEY = "lastUsername";
const ROOM_CODE_KEY = "lastRoomCode";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(key, value);
}

function removeStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(key);
}

export function getStoredSessionId(): string | null {
  return readStorage(SESSION_STORAGE_KEY);
}

export function setStoredSessionId(sessionId: string): void {
  writeStorage(SESSION_STORAGE_KEY, sessionId);
}

export function clearStoredSessionId(): void {
  removeStorage(SESSION_STORAGE_KEY);
}

export function getStoredUsername(): string | null {
  return readStorage(USERNAME_KEY);
}

export function setStoredUsername(username: string): void {
  writeStorage(USERNAME_KEY, username);
}

export function getStoredRoomCode(): string | null {
  return readStorage(ROOM_CODE_KEY);
}

export function setStoredRoomCode(roomCode: string): void {
  writeStorage(ROOM_CODE_KEY, roomCode.toUpperCase());
}

export function clearStoredRoomCode(): void {
  removeStorage(ROOM_CODE_KEY);
}

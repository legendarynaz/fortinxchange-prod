
import { LoginAttemptInfo } from '../types';

const ATTEMPTS_KEY_PREFIX = 'fortinXchange_loginAttempts_';
const MAX_ATTEMPTS = 4;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const getStorageKey = (userId: string): string => `${ATTEMPTS_KEY_PREFIX}${userId}`;

const getAttempts = (userId: string): LoginAttemptInfo | null => {
    try {
        const storedData = localStorage.getItem(getStorageKey(userId));
        if (!storedData) return null;
        
        const data: LoginAttemptInfo = JSON.parse(storedData);
        
        // Check if the lockout period has expired
        if (Date.now() - data.firstAttemptTimestamp > LOCKOUT_DURATION_MS) {
            clearAttempts(userId);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Failed to parse login attempts from localStorage", error);
        return null;
    }
};

const saveAttempts = (userId: string, data: LoginAttemptInfo): void => {
    try {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save login attempts to localStorage", error);
    }
};

export const recordFailedAttempt = (userId: string): void => {
    if (!userId) return;
    let attempts = getAttempts(userId);
    
    if (!attempts) {
        attempts = { count: 1, firstAttemptTimestamp: Date.now() };
    } else {
        attempts.count += 1;
    }
    saveAttempts(userId, attempts);
};

export const clearAttempts = (userId: string): void => {
    if (!userId) return;
    localStorage.removeItem(getStorageKey(userId));
};

export const isLockedOut = (userId: string): boolean => {
    if (!userId) return false;
    const attempts = getAttempts(userId);
    return !!attempts && attempts.count >= MAX_ATTEMPTS;
};

export const getLockoutTimeRemaining = (userId: string): number => {
    const attempts = getAttempts(userId);
    if (!attempts || attempts.count < MAX_ATTEMPTS) return 0;

    const lockoutEndTime = attempts.firstAttemptTimestamp + LOCKOUT_DURATION_MS;
    return Math.max(0, lockoutEndTime - Date.now());
};

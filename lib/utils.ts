import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserId(): string {
  if (typeof window === 'undefined') return 'default_user';
  let userId = localStorage.getItem('forum_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('forum_user_id', userId);
  }
  return userId;
}

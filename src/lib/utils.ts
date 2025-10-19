import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "firebase/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIdentifierForUser(user: User): string {
    if (user.email) {
      // For phone-based accounts, the email is an internal representation like `+12345@tazrimony.app`
      if (user.email.endsWith('@tazrimony.app')) {
        // If there's a display name and it looks like a phone number, prefer that.
        // It might be more nicely formatted.
        if (user.displayName && /^\+?\d+$/.test(user.displayName)) {
          return user.displayName;
        }
        // Otherwise, parse it from the email
        return user.email.split('@')[0];
      }
      return user.email;
    }
    if (user.phoneNumber) {
        return user.phoneNumber;
    }
    // Fallback if neither is available
    return user.uid;
}

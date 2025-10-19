import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "firebase/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIdentifierForUser(user: User): string {
    if (user.email) {
      return user.email;
    }
    if (user.phoneNumber) {
        return user.phoneNumber;
    }
    // Fallback if neither is available
    return user.uid;
}

    
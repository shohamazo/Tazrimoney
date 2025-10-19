'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  linkWithPopup,
  deleteUser,
} from 'firebase/auth';
import { initializeFirebase } from './index';
import { z } from 'zod';

async function getFirebaseAuth() {
  const { auth } = initializeFirebase();
  return auth;
}

const isEmail = (identifier: string) => z.string().email().safeParse(identifier).success;


export async function handleGoogleSignIn() {
  const auth = await getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}


export async function handlePasswordSignUp(identifier: string, password: string) {
  const auth = await getFirebaseAuth();
  let email: string;
  let phoneNumber: string | undefined = undefined;

  if (isEmail(identifier)) {
    email = identifier;
  } else {
    // Firebase requires phone numbers to be in E.164 format.
    // For this implementation, we assume a simple transformation.
    // A more robust solution would use a library like libphonenumber-js.
    const numericPhone = identifier.replace(/\D/g, '');
    phoneNumber = `+972${numericPhone.startsWith('0') ? numericPhone.substring(1) : numericPhone}`;
    // We still use an email for the underlying account, as Firebase requires it for password auth.
    // This email is internal and not exposed to the user.
    email = `${phoneNumber}@tazrimony.app`;
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // If it was a phone number, we save it to the user's profile
    if (phoneNumber) {
      await updateProfile(userCredential.user, { displayName: phoneNumber });
    }
  } catch (error) {
    console.error('Password Sign-Up Error:', error);
    throw error;
  }
}

export async function handlePasswordSignIn(identifier: string, password: string) {
  const auth = await getFirebaseAuth();
  let email: string;

  if (isEmail(identifier)) {
    email = identifier;
  } else {
    const numericPhone = identifier.replace(/\D/g, '');
    const phoneNumber = `+972${numericPhone.startsWith('0') ? numericPhone.substring(1) : numericPhone}`;
    email = `${phoneNumber}@tazrimony.app`;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Password Sign-In Error:', error);
    throw error;
  }
}

export async function handleSignOut() {
  const auth = await getFirebaseAuth();
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

export async function handleUpdateProfile(data: { displayName: string }) {
    const auth = await getFirebaseAuth();
    if (auth.currentUser) {
        try {
            await updateProfile(auth.currentUser, data);
        } catch (error) {
            console.error('Update Profile Error:', error);
            throw error;
        }
    } else {
        throw new Error("No user is currently signed in.");
    }
}

export async function handleLinkGoogle() {
    const auth = await getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    if (auth.currentUser) {
        try {
            await linkWithPopup(auth.currentUser, provider);
        } catch (error) {
            console.error('Link Google Error:', error);
            throw error;
        }
    } else {
        throw new Error("No user is currently signed in to link a provider.");
    }
}

export async function handleDeleteUser() {
    const auth = await getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
        try {
            await deleteUser(user);
        } catch (error) {
            console.error("Delete User Error:", error);
            throw error;
        }
    } else {
        throw new Error("No user is currently signed in.");
    }
}

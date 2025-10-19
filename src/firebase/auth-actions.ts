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
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { initializeFirebase } from './index';
import { z } from 'zod';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

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

export async function handlePasswordSignUp(email: string, password: string) {
  const auth = await getFirebaseAuth();
  if (!isEmail(email)) {
    throw new Error('Invalid email format for sign-up.');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential;
  } catch (error) {
    console.error('Password Sign-Up Error:', error);
    throw error;
  }
}

export async function handlePasswordSignIn(email: string, password: string) {
  const auth = await getFirebaseAuth();
   if (!isEmail(email)) {
    throw new Error('Invalid email format for sign-in.');
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Password Sign-In Error:', error);
    throw error;
  }
}

export async function sendPhoneVerificationCode(phoneNumber: string, verifier: RecaptchaVerifier) {
    const auth = await getFirebaseAuth();
    // Reformat phone number to E.164 standard for Firebase
    const numericPhone = phoneNumber.replace(/\D/g, '');
    const e164PhoneNumber = `+972${numericPhone.startsWith('0') ? numericPhone.substring(1) : numericPhone}`;

    try {
        const confirmationResult = await signInWithPhoneNumber(auth, e164PhoneNumber, verifier);
        return confirmationResult;
    } catch (error) {
        console.error('SMS Sending Error:', error);
        throw error;
    }
}

export async function verifyPhoneCode(confirmationResult: ConfirmationResult, code: string) {
    try {
        const result = await confirmationResult.confirm(code);
        return result.user;
    } catch (error) {
        console.error('Phone Verification Error:', error);
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

export async function resendVerificationEmail() {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (user) {
    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Resend Verification Email Error:', error);
      throw error;
    }
  } else {
    throw new Error('No user is currently signed in.');
  }
}

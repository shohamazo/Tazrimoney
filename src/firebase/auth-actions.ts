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

async function getFirebaseAuth() {
  const { auth } = initializeFirebase();
  return auth;
}

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
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Password Sign-In Error:', error);
    throw error;
  }
}

export async function sendPhoneVerificationCode(phoneNumber: string, verifier: RecaptchaVerifier) {
    const auth = await getFirebaseAuth();

    // Sanitize the phone number to the E.164 format required by Firebase
    let cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digit characters

    if (cleanNumber.startsWith('972')) {
        // Number already has country code, just ensure it has a '+'
        cleanNumber = `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0')) {
        // Replace leading 0 with country code
        cleanNumber = `+972${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length > 0) {
        // Assume it's a local number without a leading 0 and add country code
        cleanNumber = `+972${cleanNumber}`;
    }
    
    const e164PhoneNumber = cleanNumber;

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
        const userCredential = await confirmationResult.confirm(code);
        return userCredential.user;
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

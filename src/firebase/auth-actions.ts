'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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
    // The user object and redirect are handled by the AuthGuard
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    // Re-throw to be caught by the UI
    throw error;
  }
}

// This is a simplified version. A full implementation requires SMS verification.
// For now, we create a user with an "email" that is the phone number.
// This is NOT secure for production without SMS verification.
const formatPhoneAsEmail = (phone: string) => `${phone.replace(/\D/g, '')}@tazrimony.app`;

export async function handlePhoneSignUp(phone: string, password: string) {
  const auth = await getFirebaseAuth();
  const email = formatPhoneAsEmail(phone);
  try {
    // Firebase Auth doesn't directly support phone+password. We simulate it
    // by creating an email user with a formatted phone number.
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Phone Sign-Up Error:', error);
    throw error;
  }
}

export async function handlePhoneSignIn(phone: string, password: string) {
  const auth = await getFirebaseAuth();
  const email = formatPhoneAsEmail(phone);
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Phone Sign-In Error:', error);
    throw error;
  }
}

export async function handleSignOut() {
  const auth = await getFirebaseAuth();
  try {
    await signOut(auth);
    // Redirect is handled by the AuthGuard
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

    
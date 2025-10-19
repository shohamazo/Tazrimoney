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

export async function handleEmailSignUp(email: string, password: string) {
  const auth = await getFirebaseAuth();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
}

export async function handleEmailSignIn(email: string, password: string) {
  const auth = await getFirebaseAuth();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Email Sign-In Error:', error);
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

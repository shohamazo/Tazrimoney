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
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { initializeFirebase } from './index';

async function getFirebaseAuth() {
  const { auth } = initializeFirebase();
  return auth;
}

export async function setAuthPersistence(rememberMe: boolean) {
  const auth = await getFirebaseAuth();
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  try {
    await setPersistence(auth, persistence);
  } catch (error) {
    console.error('Set Persistence Error:', error);
    throw error;
  }
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

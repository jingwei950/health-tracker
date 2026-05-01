// src/lib/firebase/auth.ts
import {
  signOut,
  type User,
  deleteUser,
  signInWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  reauthenticateWithCredential,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Opens a Google sign-in popup and returns the result
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Signs in an existing user with their email and password
export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// Creates a new account using an email and password
export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

// Signs out the currently logged-in user
export const logOut = () => signOut(auth);

// Subscribes to auth state changes — calls onUserChange(user) whenever the user signs in or out
// (user is null when signed out); returns an unsubscribe function to stop listening
export const onAuthChange = (onUserChange: (user: User | null) => void) => {
  if (!auth) {
    onUserChange(null);
    return () => {};
  }
  return onAuthStateChanged(auth, onUserChange);
};

// Returns the currently signed-in user, or null if no one is logged in
export const getCurrentUser = () => auth?.currentUser ?? null;

// Re-authenticates with the user's password, then permanently deletes their account
export const deleteAccount = async (password: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No authenticated user");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await deleteUser(user);
};

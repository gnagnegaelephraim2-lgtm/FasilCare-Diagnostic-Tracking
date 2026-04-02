import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const isPlaceholder = (val: string | undefined) => !val || val.startsWith('PLACEHOLDER_') || val === 'undefined';

// Use environment variables if available and not placeholders, otherwise fallback to the JSON config.
const firebaseConfig = {
  apiKey: !isPlaceholder(import.meta.env.VITE_FIREBASE_API_KEY) ? import.meta.env.VITE_FIREBASE_API_KEY : firebaseConfigJson.apiKey,
  authDomain: !isPlaceholder(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : firebaseConfigJson.authDomain,
  projectId: !isPlaceholder(import.meta.env.VITE_FIREBASE_PROJECT_ID) ? import.meta.env.VITE_FIREBASE_PROJECT_ID : firebaseConfigJson.projectId,
  storageBucket: !isPlaceholder(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : firebaseConfigJson.storageBucket,
  messagingSenderId: !isPlaceholder(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : firebaseConfigJson.messagingSenderId,
  appId: !isPlaceholder(import.meta.env.VITE_FIREBASE_APP_ID) ? import.meta.env.VITE_FIREBASE_APP_ID : firebaseConfigJson.appId,
  measurementId: !isPlaceholder(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : firebaseConfigJson.measurementId,
  firestoreDatabaseId: !isPlaceholder(import.meta.env.VITE_FIREBASE_DATABASE_ID) ? import.meta.env.VITE_FIREBASE_DATABASE_ID : firebaseConfigJson.firestoreDatabaseId
};

// Log configuration source (obfuscated for security)
console.log('Firebase Config Source:', {
  apiKey: !isPlaceholder(import.meta.env.VITE_FIREBASE_API_KEY) ? 'Env Var' : 'JSON Config',
  projectId: !isPlaceholder(import.meta.env.VITE_FIREBASE_PROJECT_ID) ? 'Env Var' : 'JSON Config',
  databaseId: !isPlaceholder(import.meta.env.VITE_FIREBASE_DATABASE_ID) ? 'Env Var' : 'JSON Config',
  usingPlaceholder: isPlaceholder(firebaseConfig.apiKey) || isPlaceholder(firebaseConfig.projectId)
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Mock Auth
let authStateListener: ((user: any) => void) | null = null;
export const auth = {
  currentUser: null as { uid: string; email: string; displayName: string; emailVerified: boolean; isAnonymous: boolean; tenantId: string | null; providerData: any[] } | null
};

export const loginWithGoogle = async () => {
  const mockUser = {
    uid: 'mock-user-123',
    email: 'demo@fasilcare.mu',
    displayName: 'Demo User',
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: []
  };
  auth.currentUser = mockUser;
  if (authStateListener) authStateListener(mockUser);
  return { user: mockUser };
};

export const logout = async () => {
  auth.currentUser = null;
  if (authStateListener) authStateListener(null);
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  authStateListener = callback;
  callback(auth.currentUser);
  return () => { authStateListener = null; };
};

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    // Try to get a document from the server to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified.");
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Failed to get document'))) {
      console.error("Firebase connection failed. Please check your configuration (Project ID, API Key, Database ID).");
      console.log("Current Config Source:", {
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId,
        hasApiKey: !!firebaseConfig.apiKey
      });
    }
  }
}
testConnection();

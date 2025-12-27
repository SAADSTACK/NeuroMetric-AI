import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously
} from "firebase/auth";

// --- Configuration ---
// Replace these with your actual Firebase Console values for Production
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// --- Mock Implementation Details ---

// Helper to generate a stable hash/slug from a string
const generateStableId = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

class MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;

  constructor(identifier: string, type: 'provider' | 'email') {
    if (type === 'email') {
      this.email = identifier;
      this.uid = `mock-uid-${generateStableId(identifier)}`;
      const namePart = identifier.split('@')[0];
      this.displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      this.photoURL = `https://ui-avatars.com/api/?name=${this.displayName}&background=random&color=fff`;
    } else {
      // Provider based (e.g., 'google')
      const domains: Record<string, string> = {
        'google': 'gmail.com',
        'microsoft': 'outlook.com',
        'apple': 'icloud.com'
      };
      const domain = domains[identifier] || 'example.com';
      
      // Make these stable for the provider so you can log back in as "The Google User"
      this.uid = `mock-uid-${identifier}-stable`;
      this.displayName = `Mock ${identifier.charAt(0).toUpperCase() + identifier.slice(1)} User`;
      this.email = `${identifier}_user@${domain}`;
      this.photoURL = `https://ui-avatars.com/api/?name=${this.displayName}&background=random&color=fff`;
    }
  }
}

// Observers for Mock Auth State Changes
const mockObservers: ((user: any) => void)[] = [];

const notifyObservers = (user: any) => {
  mockObservers.forEach(callback => callback(user));
};

const mockSignIn = async (providerName: string) => {
  console.log(`[Mock Auth] Signing in with ${providerName} (Stable ID)...`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
  
  const user = new MockUser(providerName, 'provider');
  
  localStorage.setItem('neuro_mock_user', JSON.stringify(user));
  notifyObservers(user);
  return { user };
};

const mockSignInWithEmail = async (email: string) => {
  console.log(`[Mock Auth] Signing in with email: ${email}...`);
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
  
  const user = new MockUser(email, 'email');
  
  localStorage.setItem('neuro_mock_user', JSON.stringify(user));
  notifyObservers(user);
  return { user };
};

const mockSignOut = async () => {
  console.log("[Mock Auth] Signed out");
  localStorage.removeItem('neuro_mock_user');
  notifyObservers(null);
};

// --- Initialization Logic ---
let auth: any;
let googleProvider: any;
let microsoftProvider: any;
let appleProvider: any;
let signInFunc: any;
let signInEmailFunc: any;
let signOutFunc: any;
let onAuthStateChangedFunc: any;

try {
  // Check if we are in a "real" environment or forcing mock
  if (firebaseConfig.apiKey === "mock-key" || !firebaseConfig.apiKey) {
    throw new Error("Using Mock Config");
  }

  // Attempt Real Initialization
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  googleProvider = new GoogleAuthProvider();
  microsoftProvider = new OAuthProvider('microsoft.com');
  appleProvider = new OAuthProvider('apple.com');
  
  signInFunc = signInWithPopup;
  // For real implementation fallback
  signInEmailFunc = async (authObj: any, email: string) => {
      console.warn("Real email auth requires full backend setup. Falling back to anonymous.");
      return signInAnonymously(authObj);
  };
  
  signOutFunc = firebaseSignOut;
  onAuthStateChangedFunc = firebaseOnAuthStateChanged;

} catch (error) {
  console.warn("⚠️ Firebase fallback: Using Mock Authentication (Check API Keys if this is unexpected).");
  
  // Mock Auth Object
  auth = { currentUser: null }; 
  
  // Mock Providers
  googleProvider = { providerId: 'google' };
  microsoftProvider = { providerId: 'microsoft' };
  appleProvider = { providerId: 'apple' };

  // Mock Functions
  signInFunc = async (authObj: any, provider: any) => mockSignIn(provider.providerId);
  signInEmailFunc = async (authObj: any, email: string) => mockSignInWithEmail(email);
  
  signOutFunc = mockSignOut;

  onAuthStateChangedFunc = (authObj: any, callback: (user: any) => void) => {
    // 1. Register the callback
    mockObservers.push(callback);

    // 2. Check for existing session immediately
    const stored = localStorage.getItem('neuro_mock_user');
    if (stored) {
      const user = JSON.parse(stored);
      auth.currentUser = user;
      callback(user);
    } else {
      callback(null);
    }

    // 3. Return unsubscribe function
    return () => {
      const idx = mockObservers.indexOf(callback);
      if (idx > -1) mockObservers.splice(idx, 1);
    };
  };
}

export { 
  auth, 
  googleProvider, 
  microsoftProvider, 
  appleProvider,
  signInFunc as signInWithPopup,
  signInEmailFunc as signInWithEmail,
  signOutFunc as signOut,
  onAuthStateChangedFunc as onAuthStateChanged
};
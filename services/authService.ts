import { UserProfile, UserStatus, Role } from "../types";
import { auth, signOut } from "./firebase";

const USERS_DB_KEY = 'neuro_metric_users';

// Get local profile associated with Firebase UID
export const getProfileByUid = async (uid: string): Promise<UserProfile | undefined> => {
  const users: UserProfile[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  // Assuming 'username' field now stores the Firebase UID for linking
  return users.find(u => u.username === uid);
};

// Create a new profile after Firebase Auth success
export const createProfile = async (
  uid: string, 
  name: string, 
  email: string | undefined,
  role: Role
): Promise<{ success: boolean; message: string }> => {
  const users: UserProfile[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  
  if (users.find(u => u.username === uid)) {
    return { success: false, message: "Profile already exists" };
  }

  // Admins are automatically approved if they passed the UI check
  const status: UserStatus = role === 'admin' ? 'approved' : 'pending';

  const newUser: UserProfile = {
    id: crypto.randomUUID(),
    name,
    username: uid, // Linking Firebase UID here
    email,         // Storing email for reference
    role,
    status
  };

  users.push(newUser);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  
  // Trigger storage event for reactivity
  window.dispatchEvent(new Event('local-storage-update'));

  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true, message: "Profile created successfully." };
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getPendingUsers = async (): Promise<UserProfile[]> => {
  const users: UserProfile[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  return users.filter(u => u.role === 'patient' && u.status === 'pending');
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  const users: UserProfile[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
  const index = users.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    console.log(`Updating user ${users[index].name} (${userId}) to ${status}`);
    users[index].status = status;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    
    // Dispatch a custom event so App.tsx can react immediately in the same window
    window.dispatchEvent(new Event('local-storage-update'));
  } else {
    console.error(`User with ID ${userId} not found for update.`);
  }
};
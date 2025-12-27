import React, { useState, useEffect, useCallback } from 'react';
import { AssessmentResult, Role, UserProfile } from './types';
import { ADMIN_PASSWORD_HASH } from './constants';
import AssessmentView from './components/AssessmentView';
import AdminDashboard from './components/AdminDashboard';
import { getProfileByUid, createProfile, logoutUser } from './services/authService';
import { 
  auth, 
  googleProvider, 
  microsoftProvider, 
  appleProvider, 
  signInWithPopup, 
  signInWithEmail,
  onAuthStateChanged 
} from './services/firebase';

type View = 'landing' | 'onboarding' | 'assessment' | 'admin' | 'results' | 'loading' | 'pending';

const App: React.FC = () => {
  const [view, setView] = useState<View>('loading');
  const [currentUser, setCurrentUser] = useState<any>(null); // Firebase User
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Local Profile
  const [isAuthProcessing, setIsAuthProcessing] = useState(false); // For login buttons
  
  // Landing Page State
  const [loginEmail, setLoginEmail] = useState('');

  // Onboarding State
  const [onboardName, setOnboardName] = useState('');
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardRole, setOnboardRole] = useState<Role>('patient');
  const [adminSecret, setAdminSecret] = useState('');
  const [adminError, setAdminError] = useState(''); // Inline error state
  const [isProcessing, setIsProcessing] = useState(false); // For profile creation
  const [lastResult, setLastResult] = useState<AssessmentResult | null>(null);

  // Helper to process profile and set view
  const processProfile = useCallback((profile: UserProfile | undefined) => {
    if (profile) {
      setUserProfile(profile);
      if (profile.role === 'admin') setView('admin');
      else if (profile.status === 'approved') setView('assessment');
      else if (profile.status === 'rejected') {
        alert("Your account has been rejected by the administrator.");
        handleLogout();
      } else {
         // Patient pending
         setView('pending');
      }
    } else {
      // No profile found -> Onboarding
      setView('onboarding');
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // Pre-fill onboarding
        setOnboardName(firebaseUser.displayName || '');
        setOnboardEmail(firebaseUser.email || '');
        
        // Check for existing profile
        const profile = await getProfileByUid(firebaseUser.uid);
        processProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setView('landing');
      }
      setIsAuthProcessing(false);
    });
    return () => unsubscribe();
  }, [processProfile]);

  // Reactive Storage Listener (Cross-tab and same-window updates)
  useEffect(() => {
    const handleStorageChange = async () => {
      if (currentUser?.uid) {
        console.log("Storage changed, refreshing profile...");
        const profile = await getProfileByUid(currentUser.uid);
        // Only update if we are not in the middle of onboarding or something else critical
        // But for status approval, we usually want to jump straight to assessment
        if (profile && view === 'pending') {
             processProfile(profile);
        }
      }
    };

    // Listen for cross-tab changes
    window.addEventListener('storage', handleStorageChange);
    // Listen for same-window changes (dispatched by authService)
    window.addEventListener('local-storage-update', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
    };
  }, [currentUser, view, processProfile]);

  const handleProviderLogin = async (provider: any) => {
    setIsAuthProcessing(true);
    try {
      await signInWithPopup(auth, provider);
      // Listener handles the rest
    } catch (error) {
      console.error("Login failed", error);
      alert("Authentication failed. Please try again.");
      setIsAuthProcessing(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setIsAuthProcessing(true);
    try {
      await signInWithEmail(auth, loginEmail);
    } catch (error) {
      console.error("Email login failed", error);
      alert("Authentication failed. Please try again.");
      setIsAuthProcessing(false);
    }
  };

  const handleOnboardingSubmit = async () => {
    setAdminError('');
    if (!onboardName) return alert("Please enter your name");
    if (!onboardEmail) return alert("Please enter your email");
    
    if (onboardRole === 'admin') {
        if (adminSecret !== ADMIN_PASSWORD_HASH) {
            setAdminError("Invalid Organization Code. Access denied.");
            return;
        }
    }

    setIsProcessing(true);
    // Pass email from state (editable)
    const result = await createProfile(currentUser.uid, onboardName, onboardEmail, onboardRole);
    setIsProcessing(false);

    if (result.success) {
      const profile = await getProfileByUid(currentUser.uid);
      processProfile(profile);
    } else {
      alert(result.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setView('landing');
    setLastResult(null);
    setLoginEmail('');
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setLastResult(result);
    setView('results');
  };

  // --- Render Functions ---

  const renderLanding = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-900 p-8 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-white mb-2">NeuroMetric AI</h1>
          <p className="text-slate-400">Enterprise Mental Health Assessment</p>
        </div>

        <div className="p-8 space-y-4">
          <p className="text-center text-slate-600 mb-6">Sign in with your corporate or personal account to continue.</p>
          
          {isAuthProcessing ? (
             <div className="flex flex-col items-center justify-center py-8 space-y-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
               <p className="text-slate-500 text-sm">Authenticating...</p>
             </div>
          ) : (
            <>
              <button 
                onClick={() => handleProviderLogin(googleProvider)}
                className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-all shadow-sm group"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Google" />
                <span>Continue with Google</span>
              </button>

              <button 
                onClick={() => handleProviderLogin(microsoftProvider)}
                className="w-full flex items-center justify-center space-x-3 bg-[#2F2F2F] hover:bg-black text-white font-medium py-3 rounded-lg transition-all shadow-sm group"
              >
                <img src="https://www.svgrepo.com/show/452062/microsoft.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Microsoft" />
                <span>Sign in with Microsoft</span>
              </button>

              <button 
                onClick={() => handleProviderLogin(appleProvider)}
                className="w-full flex items-center justify-center space-x-3 bg-black hover:bg-slate-900 text-white font-medium py-3 rounded-lg transition-all shadow-sm group"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-1.01 4.15-.87c.7.04 2.22.25 3.33 1.63-2.92 1.5-2.45 5.56.55 6.78-.65 1.65-1.55 3.25-3.11 4.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.17 2.29-2.06 4.13-3.74 4.25z"/></svg>
                <span>Sign in with Apple</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="flex flex-col space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-all shadow-md shadow-indigo-200"
                >
                  Continue
                </button>
              </form>
            </>
          )}
        </div>
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-500 border-t border-slate-100">
           Secure HIPAA-compliant login via Firebase Auth
        </div>
      </div>
    </div>
  );

  const renderPending = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in">
        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⏳
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Pending</h2>
        <p className="text-slate-600 mb-6">
          Your account has been created and is waiting for administrator approval. 
          Please contact your organization's IT department or check back later.
        </p>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-left">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">Authenticated As</p>
          <p className="text-sm text-slate-700 font-medium truncate">{userProfile?.email || currentUser?.email}</p>
          <p className="text-xs text-slate-400 mt-1 truncate">ID: {currentUser?.uid}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-indigo-600 font-medium hover:text-indigo-800 underline transition-colors"
        >
          Sign Out & Return Home
        </button>
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-indigo-600 p-6 text-white text-center">
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <p className="opacity-80">One last step to access the system</p>
          </div>
          <div className="p-8 space-y-6">
             <div className="text-center">
               {currentUser?.photoURL && (
                 <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-indigo-100 shadow-sm" />
               )}
               <p className="text-sm font-medium text-slate-900">{currentUser?.displayName}</p>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
               <input 
                 type="text" 
                 value={onboardName}
                 onChange={e => setOnboardName(e.target.value)}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
               <input 
                 type="email" 
                 value={onboardEmail}
                 onChange={e => setOnboardEmail(e.target.value)}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">I am a...</label>
               <div className="grid grid-cols-2 gap-4">
                 <button 
                   type="button"
                   onClick={() => setOnboardRole('patient')}
                   className={`p-4 border rounded-xl text-center transition-all ${
                     onboardRole === 'patient' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   <div className="text-2xl mb-1">👤</div>
                   <div className="font-semibold">Patient</div>
                 </button>
                 <button 
                   type="button"
                   onClick={() => setOnboardRole('admin')}
                   className={`p-4 border rounded-xl text-center transition-all ${
                     onboardRole === 'admin' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   <div className="text-2xl mb-1">🛡️</div>
                   <div className="font-semibold">Admin</div>
                 </button>
               </div>
             </div>

             {onboardRole === 'admin' && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 animate-in fade-in">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Organization Code</label>
                  <input
                    type="password"
                    value={adminSecret}
                    onChange={e => {
                        setAdminSecret(e.target.value);
                        setAdminError('');
                    }}
                    className={`w-full px-4 py-2 rounded-lg border ${adminError ? 'border-red-500 bg-red-50' : 'border-orange-200'} focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-colors`}
                    placeholder="Required for admin access"
                  />
                  <div className="flex justify-between items-start mt-1">
                     <p className="text-xs text-orange-600/80">Hint: demo code is <strong>hfelab</strong></p>
                     {adminError && <p className="text-xs text-red-600 font-bold">{adminError}</p>}
                  </div>
                </div>
             )}

             <button 
               onClick={handleOnboardingSubmit}
               disabled={isProcessing}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
             >
               {isProcessing ? 'Creating Profile...' : 'Complete Registration'}
             </button>
             
             <button 
               type="button"
               onClick={handleLogout}
               className="w-full text-slate-500 text-sm hover:text-slate-700"
             >
               Cancel & Sign Out
             </button>
          </div>
       </div>
    </div>
  );

  const renderResults = () => {
    if (!lastResult) return null;
    const isGood = ['Good', 'Normal', 'Excellent'].includes(lastResult.status);
    
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className={`p-8 ${isGood ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-orange-600'}`}>
            <h2 className="text-3xl font-bold text-white mb-2">Assessment Completed</h2>
            <p className="text-white/90">Thank you, {userProfile?.name}. Your results have been processed.</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wide">Score</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{lastResult.percentage.toFixed(0)}%</div>
                <div className="text-xs text-slate-400 mt-1">{lastResult.score}/{lastResult.max_score}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wide">Status</div>
                <div className={`text-xl font-bold mt-2 px-2 py-1 rounded-full inline-block
                   ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {lastResult.status}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wide">Consistency</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{Math.round(lastResult.consistency_score)}%</div>
              </div>
               <div className="bg-slate-50 p-4 rounded-xl text-center">
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wide">Time</div>
                <div className="text-xl font-bold text-slate-900 mt-2">
                  {Math.floor(lastResult.response_time_seconds / 60)}m {lastResult.response_time_seconds % 60}s
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">🤖</span> AI Clinical Interpretation
              </h3>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-slate-700 leading-relaxed whitespace-pre-line">
                {lastResult.ai_interpretation}
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button 
                onClick={handleLogout}
                className="bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (view === 'landing') return renderLanding();
  if (view === 'onboarding') return renderOnboarding();
  if (view === 'pending') return renderPending();
  
  if (view === 'assessment') {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <AssessmentView 
          patientName={userProfile?.name || 'Patient'}
          onComplete={handleAssessmentComplete}
          onCancel={handleLogout}
        />
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'results') return renderResults();

  return <div>Loading...</div>;
};

export default App;
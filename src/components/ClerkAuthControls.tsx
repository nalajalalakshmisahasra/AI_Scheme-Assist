import React from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from '../context/AuthContext.tsx';
import { LogIn, UserPlus } from 'lucide-react';

interface ClerkAuthControlsProps {
  onClerkUserSync?: (clerkUser: any) => void;
  variant?: 'navbar' | 'expanded';
}

export const ClerkAuthControls: React.FC<ClerkAuthControlsProps> = ({
  onClerkUserSync,
  variant = 'navbar'
}) => {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return null;
  }

  if (variant === 'expanded') {
    return (
      <div className="w-full space-y-2.5">
        <SignedOut>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SignInButton mode="modal">
              <button
                type="button"
                id="clerk-sign-in-modal-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 shadow-sm transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-indigo-400" />
                Sign In with Clerk
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                id="clerk-sign-up-modal-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-white" />
                Sign Up with Clerk
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-indigo-500/30">
            <div className="flex items-center gap-2.5">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8 ring-2 ring-indigo-500/50',
                  }
                }}
              />
              <ClerkUserSyncHandler onSync={onClerkUserSync} />
            </div>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Authenticated via Clerk
            </span>
          </div>
        </SignedIn>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            id="clerk-sign-in-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            Clerk Sign In
          </button>
        </SignInButton>

        <SignUpButton mode="modal">
          <button
            type="button"
            id="clerk-sign-up-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Clerk Sign Up
          </button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-indigo-500/30">
          <ClerkUserSyncHandler onSync={onClerkUserSync} />
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'w-7 h-7 ring-2 ring-indigo-500/50',
              }
            }}
          />
        </div>
      </SignedIn>
    </div>
  );
};

const ClerkUserSyncHandler: React.FC<{ onSync?: (user: any) => void }> = ({ onSync }) => {
  const { user } = useUser();

  React.useEffect(() => {
    if (user && onSync) {
      onSync(user);
    }
  }, [user, onSync]);

  return (
    <div className="text-right hidden sm:block">
      <p className="text-xs font-semibold text-indigo-200 leading-tight">
        {user?.fullName || user?.firstName || 'Citizen'}
      </p>
      <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
        {user?.primaryEmailAddress?.emailAddress || ''}
      </p>
    </div>
  );
};

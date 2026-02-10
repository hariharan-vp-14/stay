import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import GoogleButton from '../components/GoogleButton';
import { LogIn, User, Building2 } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('user');

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <LogIn className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
          <p className="text-mist/60 text-sm mt-1">Choose your account type to continue</p>
        </div>

        {/* Role Toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {[
            { id: 'user', label: 'User', icon: User },
            { id: 'owner', label: 'Owner', icon: Building2 }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                role === r.id
                  ? 'bg-accent text-night shadow-md'
                  : 'text-mist/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <r.icon size={18} />
              {r.label}
            </button>
          ))}
        </div>

        <AuthForm role={role} mode="login" />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-night text-mist/60">or continue with</span>
          </div>
        </div>

        <GoogleButton role={role} />

        {/* Security Notice */}
        <p className="text-xs text-center text-mist/50 flex items-center justify-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secured with SSL encryption
        </p>
      </div>
    </div>
  );
}

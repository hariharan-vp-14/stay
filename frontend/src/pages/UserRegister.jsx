import AuthForm from '../components/AuthForm';
import GoogleButton from '../components/GoogleButton';
import { User } from 'lucide-react';

export default function UserRegister() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <User className="w-8 h-8 text-accent" />
          </div>
        </div>
        
        <AuthForm role="user" mode="register" />
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-night text-mist/60">or continue with</span>
          </div>
        </div>
        
        <GoogleButton role="user" />
        
        {/* Terms */}
        <p className="text-xs text-center text-mist/50">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-accent hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-accent hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

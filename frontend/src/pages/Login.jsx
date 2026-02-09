import { useState } from 'react';
import AuthForm from '../components/AuthForm';
import GoogleButton from '../components/GoogleButton';

export default function Login() {
  const [role, setRole] = useState('user');

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-10">
      <div className="flex gap-3 justify-center">
        {['user', 'owner'].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-full border ${role === r ? 'border-accent text-accent' : 'border-white/20 text-mist/80'}`}
          >
            {r === 'user' ? 'User Login' : 'Owner Login'}
          </button>
        ))}
      </div>
      <AuthForm role={role} mode="login" />
      <GoogleButton role={role} />
    </div>
  );
}

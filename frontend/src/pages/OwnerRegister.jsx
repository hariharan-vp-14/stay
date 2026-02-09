import AuthForm from '../components/AuthForm';
import GoogleButton from '../components/GoogleButton';

export default function OwnerRegister() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-10">
      <AuthForm role="owner" mode="register" />
      <GoogleButton role="owner" />
    </div>
  );
}

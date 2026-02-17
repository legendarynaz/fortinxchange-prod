import React, { useState } from 'react';
import LogoIcon from '../icons/LogoIcon';
import Button from '../ui/Button';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import type { User } from '../../types';
import { signUp, signIn, supabase } from '../../lib/supabase';
import { sendEmail } from '../../emails/templates';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot_password' | 'check_email'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { data, error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const userToLogin: User = {
        userId: data.user.id,
        email: data.user.email || email,
        country: 'US',
      };
      onLoginSuccess(userToLogin);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    const { data, error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      if (data.user.identities?.length === 0) {
        setError('An account with this email already exists.');
      } else {
        // Send welcome email
        sendEmail('welcome', { email }, email);
        setView('check_email');
      }
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the password reset link.');
    }
    setIsLoading(false);
  };

  const renderLogin = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Welcome Back</h2>
      <p className="text-center text-slate-500 mb-8">Login with your email.</p>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <Input 
          id="email" 
          type="email" 
          label="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={isLoading} 
        />
        <div>
          <PasswordInput 
            id="password" 
            label="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            show={showPassword} 
            onToggleVisibility={() => setShowPassword(!showPassword)} 
            required 
            disabled={isLoading} 
          />
          <div className="text-right mt-2">
            <button 
              type="button" 
              onClick={() => { setView('forgot_password'); setError(''); setMessage(''); }} 
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account? <button onClick={() => { setView('signup'); setError(''); }} className="font-semibold text-sky-600 hover:underline">Sign up</button>
      </p>
    </>
  );

  const renderSignup = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Create Account</h2>
      <p className="text-center text-slate-500 mb-8">Start your crypto journey with FortinXchange.</p>
      <form onSubmit={handleSignup} className="space-y-4">
        <Input 
          id="signup-email" 
          type="email" 
          label="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={isLoading}
        />
        <PasswordInput 
          id="signup-password" 
          label="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          show={showPassword} 
          onToggleVisibility={() => setShowPassword(!showPassword)} 
          required 
          disabled={isLoading}
        />
        <PasswordInput 
          id="confirm-password" 
          label="Confirm Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          show={showPassword} 
          onToggleVisibility={() => setShowPassword(!showPassword)} 
          required 
          disabled={isLoading}
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account? <button onClick={() => { setView('login'); setError(''); }} className="font-semibold text-sky-600 hover:underline">Login</button>
      </p>
    </>
  );

  const renderCheckEmail = () => (
    <>
      <div className="flex justify-center mb-6">
        <EnvelopeIcon className="w-16 h-16 text-sky-500"/>
      </div>
      <h2 className="text-2xl font-bold text-center text-slate-900">Check Your Email</h2>
      <p className="text-center text-slate-500 mb-8">
        We've sent a confirmation link to <strong className="text-slate-700">{email}</strong>. Please check your inbox and click the link to verify your account.
      </p>
      <Button onClick={() => setView('login')} variant="primary" className="w-full">
        Back to Login
      </Button>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Reset Password</h2>
      <p className="text-center text-slate-500 mb-8">Enter your email to receive a reset link.</p>
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <Input 
          id="forgot-email" 
          type="email" 
          label="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={isLoading}
        />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Remember your password? <button onClick={() => { setView('login'); setError(''); setMessage(''); }} className="font-semibold text-sky-600 hover:underline">Back to Login</button>
      </p>
    </>
  );

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-3 mb-6">
          <LogoIcon />
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">FortinXchange</h1>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-lg p-8 shadow-sm">
          {view === 'login' && renderLogin()}
          {view === 'signup' && renderSignup()}
          {view === 'check_email' && renderCheckEmail()}
          {view === 'forgot_password' && renderForgotPassword()}
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-slate-600 block mb-2">{label}</label>
    <input id={id} {...props} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-200 disabled:cursor-not-allowed" />
  </div>
);

const PasswordInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; show: boolean; onToggleVisibility: () => void; }> = 
({ id, label, show, onToggleVisibility, ...props }) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-slate-600 block mb-2">{label}</label>
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} {...props} className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-200 disabled:cursor-not-allowed" />
      <button type="button" onClick={onToggleVisibility} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800">
        {show ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default AuthView;

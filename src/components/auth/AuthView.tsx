
import React, { useState, useRef, useEffect } from 'react';
import LogoIcon from '../icons/LogoIcon';
import Button from '../ui/Button';
import { generateSecretPhrase } from '../../utils/crypto';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import ClipboardIcon from '../icons/ClipboardIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import UserIcon from '../icons/UserIcon';
import LockClosedIcon from '../icons/LockClosedIcon';
import { User } from '../../types';
import * as securityService from '../../services/securityService';
import { simulateSendEmail } from '../../emails/templates';


interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'phrase' | 'forgot_password' | 'login_with_phrase' | 'verify_email' | 'create_user_id'>('login');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState<string[]>([]);
  const [phraseWords, setPhraseWords] = useState(Array(12).fill(''));
  const [copySuccess, setCopySuccess] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const phraseInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (view === 'login' && userId) {
      const locked = securityService.isLockedOut(userId);
      setIsLocked(locked);
      if (locked) {
        setLockoutTime(securityService.getLockoutTimeRemaining(userId));
        const interval = setInterval(() => {
            const timeRemaining = securityService.getLockoutTimeRemaining(userId);
            if(timeRemaining <= 0) {
                setIsLocked(false);
                setLoginError('');
                clearInterval(interval);
            } else {
                setLockoutTime(timeRemaining);
            }
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [view, userId]);

  const handleLoginAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (securityService.isLockedOut(userId)) {
        setIsLocked(true);
        setLoginError('This account is temporarily locked.');
        return;
    }
    
    // --- MOCK PASSWORD CHECK ---
    // In a real app, this would be a secure API call.
    // For this demo, any password other than 'password123' is incorrect.
    if (password === 'password123') {
        securityService.clearAttempts(userId);
        
        const mockCountries: User['country'][] = ['US', 'CA', 'GB', 'NG', 'DE'];
        const randomCountry = mockCountries[Math.floor(Math.random() * mockCountries.length)];
        const userToLogin: User = {
            userId: userId,
            email: email || 'user@email.com',
            country: randomCountry,
        };
        onLoginSuccess(userToLogin);

    } else {
        // Incorrect password
        securityService.recordFailedAttempt(userId);
        const nowLocked = securityService.isLockedOut(userId);
        
        if (nowLocked) {
            setIsLocked(true);
            setLockoutTime(securityService.getLockoutTimeRemaining(userId));
            setLoginError('Too many failed attempts. Your account is locked for 24 hours.');
            simulateSendEmail('accountLocked', { userId });
        } else {
            setLoginError('Invalid User ID or password.');
        }
    }
  };

  const handleSuccessfulRestore = (event?: React.FormEvent) => {
    event?.preventDefault();

    const mockCountries: User['country'][] = ['US', 'CA', 'GB', 'NG', 'DE'];
    const randomCountry = mockCountries[Math.floor(Math.random() * mockCountries.length)];

    const userToLogin: User = {
      userId: 'recovered_user',
      email: 'user@email.com',
      country: randomCountry,
    };
    onLoginSuccess(userToLogin);
  };


  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match.");
      return;
    }
    setView('verify_email');
  };

  const handleCreateUserId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      alert('User ID cannot be empty.');
      return;
    }
    setSecretPhrase(generateSecretPhrase());
    setView('phrase');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretPhrase.join(' ')).then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
        setCopySuccess('Failed to copy.');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handlePhraseWordChange = (index: number, value: string) => {
    const newPhraseWords = [...phraseWords];
    newPhraseWords[index] = value;
    setPhraseWords(newPhraseWords);
    
    if (value && index < 11) {
      phraseInputsRef.current[index + 1]?.focus();
    }
  };


  const renderLogin = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Welcome Back</h2>
      <p className="text-center text-slate-500 mb-8">Login with your User ID.</p>
      
      {isLocked && (
        <div className="bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg p-4 mb-4 text-center">
            <LockClosedIcon className="w-8 h-8 mx-auto mb-2"/>
            <p className="font-bold">Account Locked</p>
            <p>Too many failed login attempts. Please try again in <strong className="font-mono">{Math.ceil(lockoutTime / 1000 / 60)} minutes</strong>.</p>
        </div>
      )}

      <form onSubmit={handleLoginAttempt} className="space-y-4">
        <Input id="userId" type="text" label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required disabled={isLocked} />
        <div>
          <PasswordInput id="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} show={showPassword} onToggleVisibility={() => setShowPassword(!showPassword)} required disabled={isLocked} />
          <div className="text-right mt-2">
             <button type="button" onClick={() => setView('forgot_password')} className="text-xs font-semibold text-sky-600 hover:underline" disabled={isLocked}>Forgot Password?</button>
          </div>
        </div>
         {loginError && !isLocked && <p className="text-red-600 text-sm text-center">{loginError}</p>}
        <Button type="submit" variant="primary" className="w-full !mt-6" disabled={isLocked}>Login</Button>
      </form>
       <p className="text-center text-sm text-slate-500 mt-4 pt-4 border-t border-slate-200">
        Or <button onClick={() => setView('login_with_phrase')} className="font-semibold text-sky-600 hover:underline" disabled={isLocked}>login with your Secret Phrase</button>
      </p>
      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account? <button onClick={() => setView('signup')} className="font-semibold text-sky-600 hover:underline" disabled={isLocked}>Sign up</button>
      </p>
    </>
  );

  const renderSignup = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Create Account</h2>
      <p className="text-center text-slate-500 mb-8">Start your crypto journey with FortinXchange.</p>
      <form onSubmit={handleSignup} className="space-y-6">
        <Input id="signup-email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput id="signup-password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} show={showPassword} onToggleVisibility={() => setShowPassword(!showPassword)} required />
        <PasswordInput id="confirm-password" label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} show={showPassword} onToggleVisibility={() => setShowPassword(!showPassword)} required />
        <Button type="submit" variant="primary" className="w-full !mt-8">Create Account</Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account? <button onClick={() => setView('login')} className="font-semibold text-sky-600 hover:underline">Login</button>
      </p>
    </>
  );
  
  const renderVerifyEmail = () => {
    return (
    <>
      <div className="flex justify-center mb-6">
        <EnvelopeIcon className="w-16 h-16 text-sky-500"/>
      </div>
      <h2 className="text-2xl font-bold text-center text-slate-900">Verify Your Email</h2>
      <p className="text-center text-slate-500 mb-8">
        We've sent a verification link to <strong className="text-slate-700">{email}</strong>. Please check your inbox and click the link to continue.
      </p>
      <Button onClick={() => setView('create_user_id')} variant="primary" className="w-full">
        I've Verified My Email
      </Button>
      <p className="text-center text-sm text-slate-500 mt-6">
        Wrong email? <button onClick={() => setView('signup')} className="font-semibold text-sky-600 hover:underline">Go back</button>
      </p>
    </>
    );
  };

  const renderCreateUserId = () => (
    <>
      <div className="flex justify-center mb-6">
        <UserIcon className="w-16 h-16 text-sky-500"/>
      </div>
      <h2 className="text-2xl font-bold text-center text-slate-900">Create Your User ID</h2>
      <p className="text-center text-slate-500 mb-8">This ID will be used to log in. Choose something unique and memorable.</p>
      <form onSubmit={handleCreateUserId} className="space-y-6">
        <Input id="create-user-id" type="text" label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <Button type="submit" variant="primary" className="w-full !mt-8">Create User ID</Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Changed your mind? <button onClick={() => setView('signup')} className="font-semibold text-sky-600 hover:underline">Go back</button>
      </p>
    </>
  );

  const renderSecretPhrase = () => (
    <>
        <h2 className="text-2xl font-bold text-center text-slate-900">Your Secret Phrase</h2>
        <p className="text-center text-slate-500 mb-6">Write down or copy these words in the right order and save them somewhere safe. A welcome email with your User ID has been sent to <strong className="text-slate-700">{email}</strong>.</p>
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-slate-900 font-mono">
                {secretPhrase.map((word, index) => (
                    <div key={index} className="flex items-center">
                        <span className="text-slate-400 w-6">{index + 1}.</span>
                        <span>{word}</span>
                    </div>
                ))}
            </div>
        </div>
        <button onClick={copyToClipboard} className="flex items-center justify-center w-full text-sm text-sky-600 hover:text-sky-700 mb-6 disabled:opacity-50">
            <ClipboardIcon className="w-4 h-4 mr-2" />
            {copySuccess || 'Copy to Clipboard'}
        </button>
        <div className="bg-yellow-100/70 border border-yellow-300 text-yellow-800 text-sm rounded-lg p-4 mb-8">
            <p className="font-bold">Do not share your secret phrase!</p>
            <p>Anyone with this phrase can take your assets forever.</p>
        </div>
        <Button onClick={() => handleLoginAttempt({ preventDefault: () => {} } as React.FormEvent)} variant="primary" className="w-full">I've saved my phrase, proceed to login</Button>
    </>
  );

    const renderForgotPassword = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Forgot Password</h2>
      <p className="text-center text-slate-500 mb-8">Enter your User ID to reset your password.</p>
      <form onSubmit={(e) => { e.preventDefault(); alert('Password reset email sent!'); setView('login'); }} className="space-y-6">
        <Input id="forgot-user-id" type="text" label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <Button type="submit" variant="primary" className="w-full !mt-8">Send Reset Link</Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Remembered your password? <button onClick={() => setView('login')} className="font-semibold text-sky-600 hover:underline">Back to Login</button>
      </p>
    </>
  );
  
    const renderLoginWithPhrase = () => (
    <>
      <h2 className="text-2xl font-bold text-center text-slate-900">Restore Wallet</h2>
      <p className="text-center text-slate-500 mb-8">Enter your 12-word secret phrase to restore your account.</p>
      <form onSubmit={handleSuccessfulRestore} className="space-y-4">
         <div className="grid grid-cols-3 gap-3">
             {phraseWords.map((word, index) => (
                 <div key={index} className="relative">
                     <span className="absolute -left-1 top-2 text-xs text-slate-400 font-mono">{index + 1}.</span>
                     <input
                        ref={el => { if(el) phraseInputsRef.current[index] = el; }}
                        type="text"
                        value={word}
                        onChange={(e) => handlePhraseWordChange(index, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2 text-sm text-slate-900 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-center"
                        autoComplete="off"
                     />
                 </div>
             ))}
         </div>
        <Button type="submit" variant="primary" className="w-full !mt-8">Restore Wallet</Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Prefer to use your User ID? <button onClick={() => setView('login')} className="font-semibold text-sky-600 hover:underline">Back to Login</button>
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
          {view === 'verify_email' && renderVerifyEmail()}
          {view === 'create_user_id' && renderCreateUserId()}
          {view === 'phrase' && renderSecretPhrase()}
          {view === 'forgot_password' && renderForgotPassword()}
          {view === 'login_with_phrase' && renderLoginWithPhrase()}
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

import React, { useState, useRef } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface AdminPasswordGateProps {
  onSuccess: (email: string, password: string) => Promise<boolean>;
  onCancel: () => void;
  authorName?: string;
}

export const AdminPasswordGate: React.FC<AdminPasswordGateProps> = ({
  onSuccess,
  onCancel,
  authorName = 'Huong Diep',
}) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setBusy(true);
    setError('');
    if (await onSuccess(email.trim(), password)) {
      setPassword('');
    } else {
      setError('Đăng nhập thất bại hoặc tài khoản chưa được cấp quyền Admin.');
      setShake(true);
      setPassword('');
      if (inputRef.current) inputRef.current.focus();
      setTimeout(() => setShake(false), 500);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#fafaf9] text-[#1c1917] font-sans antialiased selection:bg-stone-200 selection:text-black">
      {/* Return to Portfolio button */}
      <button
        onClick={onCancel}
        className="fixed top-6 left-6 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer font-editorial-mono"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Quay lại Portfolio</span>
      </button>

      {/* Center Auth Card - Monochrome Minimalist matching screenshot structure */}
      <div
        className={`w-full max-w-[460px] bg-white border border-stone-200 rounded-[28px] p-8 sm:p-11 shadow-xl shadow-stone-200/40 transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email quản trị" className="w-full px-4 py-3 border border-stone-300 rounded-xl bg-white text-sm" />
          {/* Input pill capsule matching screenshot shape */}
          <div className="relative flex items-center bg-[#fafaf9] rounded-[20px] border border-stone-300 focus-within:border-stone-900 focus-within:bg-white px-4 py-2.5 transition-all shadow-inner shadow-stone-100">
            <input
              ref={inputRef}
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              placeholder="enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-stone-900 placeholder-stone-400 text-sm focus:outline-hidden font-sans pr-3 tracking-wider"
            />

            {/* Black arrow submit button */}
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 w-10 h-10 rounded-[14px] bg-stone-900 hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
              title="Đăng nhập"
            >
              <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </div>
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}

          {/* Helper caption: "contact Huong Diep for the password" */}
          <div className="text-center">
            <p className="text-xs text-stone-500 font-editorial-mono tracking-wide">
              contact <span className="text-stone-900 font-semibold">{authorName}</span> for the password
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

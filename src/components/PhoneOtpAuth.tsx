// Book.299wala.com - Real Firebase Phone Auth (Mobile OTP Verification)
// Demo OTP 1234 completely removed; uses Firebase Auth RecaptchaVerifier + signInWithPhoneNumber.

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { auth } from '../firebase';

interface PhoneOtpAuthProps {
  initialMobile?: string;
  title?: string;
  subtitle?: string;
  onVerified: (phoneNumber10Digits: string, uid: string) => void;
}

export const PhoneOtpAuth: React.FC<PhoneOtpAuthProps> = ({
  initialMobile = '',
  title = 'Mobile OTP Verification',
  subtitle = 'Apne 10-digit mobile number par real SMS OTP bhejkar verify karein',
  onVerified,
}) => {
  const containerId = `recaptcha-${useId().replace(/:/g, '')}`;
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const [mobileInput, setMobileInput] = useState(initialMobile);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch {
          // ignore
        }
        verifierRef.current = null;
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = mobileInput.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      setError('Kripya sahi 10-digit mobile number dalein.');
      return;
    }

    setLoading(true);
    try {
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
        });
      }
      const result = await signInWithPhoneNumber(auth, `+91${digits}`, verifierRef.current);
      setConfirmationResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed') || msg.includes('auth/configuration-not-found')) {
        setError(
          'Firebase Phone Auth abhi Console me enabled nahi hai. Admin ko Firebase Console > Authentication > Sign-in method > Phone enable karna hoga.'
        );
      } else {
        setError(`OTP bhejne me samasya: ${msg}`);
      }
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch {
          // ignore
        }
        verifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      const cred = await confirmationResult.confirm(otpInput.trim());
      const digits = (cred.user.phoneNumber || mobileInput).replace(/\D/g, '').slice(-10);
      onVerified(digits, cred.user.uid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Galat ya expired OTP: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div id={containerId} />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B2C6F] text-white">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {!confirmationResult ? (
        <form onSubmit={handleSendOtp} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Mobile Number (+91 India) *
            </label>
            <div className="mt-1 flex">
              <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3 text-sm font-bold text-slate-700 font-mono-num">
                +91
              </span>
              <input
                type="tel"
                required
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                placeholder="10-digit mobile number"
                className="h-11 flex-1 rounded-r-lg border border-slate-300 px-3 text-sm font-mono-num"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full rounded-lg bg-[#0B2C6F] text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'SMS OTP Bhej Rahe Hain...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2.5 text-xs font-semibold text-[#16A34A] border border-green-200">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>+91 {mobileInput.replace(/\D/g, '').slice(-10)} par 6-digit SMS OTP bheja gaya hai.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">6-Digit OTP Dalein *</label>
            <input
              type="text"
              required
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="6-digit OTP"
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-center text-lg font-bold tracking-widest font-mono-num"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] w-full rounded-lg bg-[#16A34A] text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify OTP & Continue'}
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmationResult(null);
              setOtpInput('');
            }}
            className="w-full text-xs font-semibold text-slate-600 hover:underline cursor-pointer"
          >
            Number Badlein / Resend OTP
          </button>
        </form>
      )}
    </div>
  );
};

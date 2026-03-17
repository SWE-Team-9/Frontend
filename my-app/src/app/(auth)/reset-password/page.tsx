"use client";

import React, { useState } from 'react';
import AuthInput from '@/src/components/auth/AuthInput';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Member 1: Standardized Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Logic for Member 2/3: Send new password to backend
    console.log("Password reset successfully");
    setIsSuccess(true);
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      window.location.href = "/"; 
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1b1b1b] w-full max-w-[450px] p-10 rounded-sm shadow-xl text-center">
        <h1 className="text-3xl text-white font-bold mb-6">Choose a new password</h1>
        
        {isSuccess ? (
          <div className="space-y-4">
            <p className="text-green-500 font-medium">Your password has been reset!</p>
            <p className="text-gray-400 text-sm">Redirecting you to the sign-in page...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-6">
            <p className="text-sm text-gray-400">
              Make sure your new password is secure and something you haven't used before.
            </p>
            
            <AuthInput 
              type="password" 
              label="New Password" 
              placeholder="Enter new password" 
              value={password}
              onChange={(e:any) => setPassword(e.target.value)}
            />

            <AuthInput 
              type="password" 
              label="Confirm New Password" 
              placeholder="Repeat new password" 
              value={confirmPassword}
              onChange={(e:any) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-xs text-left">{error}</p>}

            <button 
              type="submit" 
              className="bg-white/80 text-black py-3 font-bold rounded-sm hover:bg-white transition-colors mt-2"
            >
              Save and continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
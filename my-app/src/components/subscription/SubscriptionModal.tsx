import React from "react";
import { X, CheckCircle2 } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const SubscriptionModal = ({
  isOpen,
  onClose,
  onUpgrade,
}: SubscriptionModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Main Container - Now White and Clean like the screenshots */}
      <div className="relative bg-white w-full max-w-[500px] rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Close Button - Dark to match white background */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black/40 hover:text-black transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Header Section */}
        <div className="p-8 text-center border-b border-gray-100">
          <h2 className="text-4xl font-black text-black mb-4 tracking-tight">
            Available plans.
          </h2>
          <p className="text-gray-500 text-lg">
            Choose the plan that is right for your music.
          </p>
        </div>

        {/* Content Section - "Compare Features" Style */}
        <div className="p-8">
          <div className="space-y-6">
            {/* Feature Item 1 */}
            <div className="flex items-start gap-4">
              <CheckCircle2 
  className="text-[#D4AF37] mt-1 shrink-0 filter drop-shadow-[0_0_2px_rgba(212,175,55,0.5)]" 
  size={20} 
/>
              <div>
                <h4 className="font-bold text-black">Unlimited uploads</h4>
                <p className="text-sm text-gray-500">
                  Upload as much as you want without limits.
                </p>
              </div>
            </div>

            {/* Feature Item 2 */}
            <div className="flex items-start gap-4">
             <CheckCircle2 
  className="text-[#D4AF37] mt-1 shrink-0 filter drop-shadow-[0_0_2px_rgba(212,175,55,0.5)]" 
  size={20} 
/>
              <div>
                <h4 className="font-bold text-black">
                  Advanced audience stats
                </h4>
                <p className="text-sm text-gray-500">
                  See how listeners found your music and where they are located.
                </p>
              </div>
            </div>

            {/* Feature Item 3 */}
            <div className="flex items-start gap-4">
              <CheckCircle2
                className="text-[#D4AF37] mt-1 shrink-0 filter drop-shadow-[0_0_2px_rgba(212,175,55,0.5)]"
                size={20}
              />
              <div>
                <h4 className="font-bold text-black">Exclusive Artist Badge</h4>
                <p className="text-sm text-gray-500">
                  Stand out with a PRO badge on your profile.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button - Big Orange/Dark button like the UI */}
          <div className="mt-10 space-y-4">
        <button 
  onClick={onUpgrade}
  className="w-full relative group overflow-hidden bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-white font-black py-4 rounded-md transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_10px_20px_rgba(184,134,11,0.3)]"
>
  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
  
  <span className="relative z-10 text-lg uppercase tracking-wider drop-shadow-sm">
    Get started
  </span>
</button>
            <button
              onClick={onClose}
              className="w-full text-gray-400 text-sm font-medium hover:text-black transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>

        {/* Footer - Social Proof or Extra Info */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Join 100M+ Artists worldwide
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;

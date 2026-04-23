import React from 'react';
import { Check } from 'lucide-react';

/** * Interface for individual plan features 
 */
interface Feature {
  text: string;
  badge?: string;
  icon?: React.ReactNode; 
}

/** * Props for the PlanCard component 
 */
interface PlanCardProps {
  title: string;
  price: string;
  isLoading?: boolean;
  yearlyPrice: string;
  description: string;
  features: Feature[];
  isPopular?: boolean;
  colorTheme: string; // Dynamic branding color
  onSubscribe: () => void;
  
}

export const PlanCard: React.FC<PlanCardProps> = ({
  title,
  price,
  yearlyPrice,
  description,
  features,
  isPopular,
  colorTheme,
  onSubscribe,
  isLoading,
}) => {
  return (
    <div 
      className={`relative p-10 rounded-2xl bg-white transition-all duration-500 flex flex-col h-full ${
        isPopular ? 'border-2 shadow-2xl scale-105 z-10' : 'border border-zinc-200 shadow-sm'
      }`}
      style={{ borderColor: isPopular ? colorTheme : undefined }}
    >
      {/* ─── MOST POPULAR BADGE ─── */}
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 transform translate-y-[-100%]">
          <div 
            className="text-white px-6 py-2 rounded-t-2xl text-[10px] font-black uppercase tracking-widest text-center"
            style={{ backgroundColor: colorTheme }}
          >
            Most Popular
          </div>
        </div>
      )}

      {/* ─── 1. HEADER & PRICING SECTION ─── */}
      {/* min-h ensures buttons stay aligned even if descriptions vary in length */}
      <div className="min-h-[220px] mb-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-3xl font-black text-black tracking-tight">{title}</h3>
          <span style={{ color: colorTheme }} className="text-4xl font-bold">
            {isPopular ? '✪' : '✦'}
          </span>
        </div>
        
        {/* Description with fixed min-height for vertical alignment */}
        <p className="text-zinc-500 text-[14px] font-medium mb-8 leading-relaxed min-h-[40px]">
          {description}
        </p>
        
        {/* Pricing details pushed to the bottom of the header section */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black" style={{ color: colorTheme }}>{price}</span>
            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-tighter">/ Month</span>
          </div>
          <p className="text-zinc-400 text-[10px] mt-1 italic tracking-tight">
            Billed yearly for {yearlyPrice}
          </p>
        </div>
      </div>

      {/* ─── 2. ACTION BUTTON SECTION ─── */}
      {/* Fixed position relative to the header section */}
      <div className="mb-10">
        <button 
          onClick={onSubscribe}
            disabled={isLoading}  
          className="w-full py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 bg-[#111] text-white hover:opacity-90"
          style={{ backgroundColor: '#111' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colorTheme)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111')}
        >
         {isLoading ? (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      Upgrading...
    </span>
  ) : (
    "Get started"
  )}
</button>
      </div>

      {/* ─── 3. FEATURES LIST SECTION ─── */}
      {/* flex-grow fills the remaining card space */}
      <ul className="space-y-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center justify-between group min-h-[24px]">
            <div className="flex items-center gap-4">
              {/* Feature Icon Container */}
              <span className="text-zinc-400 group-hover:scale-110 transition-transform" style={{ color: colorTheme }}>
                {/* Renders the passed icon or the default Check icon if none is provided */}
                {feature.icon || <Check size={40} />} 
              </span>
              <span className="text-[13px] font-bold text-zinc-800">{feature.text}</span>
            </div>
            {feature.badge && (
              <span 
                className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter"
                style={{ backgroundColor: `${colorTheme}15`, color: colorTheme }}
              >
                {feature.badge}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
import React from "react";

interface AuthInputProps {
  label?: string;
  type: string;
  id?: string;
  placeholder: string;
  // Added for Member 2 & 3 Integration
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

export default function AuthInput({ 
  label, 
  type, 
  id, 
  placeholder, 
  value, 
  onChange,
  name 
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase text-gray-400">
          {label}
        </label>
      )}
      <input 
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // Updated styling to match your dark theme screenshot
        className="w-full h-11 px-3 bg-[#333] text-white border-none rounded-sm text-sm focus:ring-1 focus:ring-gray-500 outline-none placeholder-gray-500 transition-all"
      />
    </div>
  );
}
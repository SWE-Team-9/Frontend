"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string; 
}

export default function DatePickerInput({
  value,
  onChange,
  label,
  className,
}: DatePickerInputProps) {
  const selected = value ? new Date(value) : null;

  const handleChange = (d: Date | null) => {
    if (d) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      onChange(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xl font-medium">{label}</label>}

      <DatePicker
        selected={selected}
        onChange={handleChange}
        maxDate={new Date()}
        dateFormat="yyyy-MM-dd"
        placeholderText="Select a date"
        popperPlacement="bottom-start"
        popperClassName="custom-datepicker-popper"
        calendarClassName="custom-calendar"
        className={
          className ??
          "w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        }
      />
    </div>
  );
}

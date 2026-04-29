"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DatePickerInput({
  value,
  onChange,
}: DatePickerInputProps) {
  const selected = value ? new Date(value) : null;

  const handleChange = (d: Date | null) => {
    if (d) {
      onChange(d.toISOString());
    } else {
      onChange("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xl font-medium">Release Date</label>

      <DatePicker
        selected={selected}
        onChange={handleChange}
        maxDate={new Date()}
        dateFormat="yyyy-MM-dd"
        placeholderText="Select a date"
        popperClassName="custom-datepicker-popper"
        calendarClassName="custom-calendar"
        className="w-full p-2 rounded border border-[#8c8c8c] 
                   focus:outline-none focus:border-[#ff5500] 
                   transition duration-300"
      />
    </div>
  );
}

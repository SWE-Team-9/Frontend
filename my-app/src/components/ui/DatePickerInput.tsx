"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DatePickerInput() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xl font-medium">Release Date</label>

      <DatePicker
        selected={date}
        onChange={(d: Date | null) => setDate(d)}
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
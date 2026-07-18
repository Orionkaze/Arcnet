import React, { useRef } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}

export function OTPInput({ length = 6, value, onChange, onComplete }: OTPInputProps) {
  const digits = value.split("").concat(Array(Math.max(0, length - value.length)).fill("")).slice(0, length);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, ""); // Allow only numbers
    if (!val) return;

    const newDigits = [...digits];
    newDigits[index] = val.substring(val.length - 1); // take the last char if multiple
    
    const newValue = newDigits.join("");
    onChange(newValue);
    
    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }

    // Move to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      
      if (!newDigits[index] && index > 0) {
        // If current is empty, move back and clear previous
        newDigits[index - 1] = "";
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current
        newDigits[index] = "";
      }
      
      onChange(newDigits.join(""));
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/[^0-9]/g, "").slice(0, length);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    
    const newValue = newDigits.join("");
    onChange(newValue);

    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }

    // Focus next empty input or the last one
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between w-full" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-[48px] h-[56px] bg-[#080c14] border border-[rgba(16, 185, 129,0.18)] focus:border-[#10B981] rounded-[8px] text-center text-white font-chakra font-bold text-[24px] outline-none transition-colors duration-200 flex-1 md:flex-none"
        />
      ))}
    </div>
  );
}

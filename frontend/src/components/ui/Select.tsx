import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  children,
  icon,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[13px] font-semibold text-slate-700 mb-1.5"
        >
          {label} {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}

        <select
          id={selectId}
          className={`appearance-none block w-full h-12 text-sm font-medium text-slate-800 bg-white border rounded-xl py-3 pr-10 transition duration-150 focus:outline-none focus:ring-1 focus:ring-[#163D5C] focus:border-[#163D5C] cursor-pointer ${
            icon ? 'pl-11' : 'px-4'
          } ${
            error
              ? 'border-red-300 focus:border-red-500 text-red-900'
              : 'border-slate-200 hover:border-slate-300'
          } ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

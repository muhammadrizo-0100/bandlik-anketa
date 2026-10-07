import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
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

        <input
          id={inputId}
          className={`block w-full text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-white border rounded-xl h-12 py-3 transition duration-150 focus:outline-none focus:ring-1 focus:ring-[#163D5C] focus:border-[#163D5C] ${
            icon ? 'pl-11 pr-4' : 'px-4'
          } ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900'
              : 'border-slate-200 hover:border-slate-300'
          } ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

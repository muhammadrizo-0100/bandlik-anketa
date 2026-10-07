import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const textareaId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-[13px] font-semibold text-slate-700 mb-1.5"
        >
          {label} {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        <textarea
          id={textareaId}
          rows={rows}
          className={`block w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white border rounded-xl p-3.5 transition duration-150 focus:outline-none focus:ring-1 focus:ring-[#163D5C] focus:border-[#163D5C] ${
            error
              ? 'border-red-300 focus:border-red-500 text-red-900'
              : 'border-slate-200 hover:border-slate-300'
          } ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${className}`}
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

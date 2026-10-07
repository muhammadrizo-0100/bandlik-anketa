import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface CustomSelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  triggerClassName?: string;
  icon?: React.ReactNode;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  placeholder = 'Tanlang...',
  value,
  onChange,
  options = [],
  error,
  helperText,
  disabled = false,
  required = false,
  searchable,
  className = '',
  triggerClassName = '',
  icon,
  id,
}) => {
  const isSearchable = searchable !== undefined ? searchable : options.length >= 4;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tashqariga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input if searchable
      if (isSearchable) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    } else {
      setSearchQuery('');
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isSearchable]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
  };

  const filteredOptions = isSearchable && searchQuery.trim()
    ? options.filter((opt) => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        opt.sublabel?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  return (
    <div className={`w-full space-y-1.5 ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full h-12 flex items-center justify-between text-sm font-medium bg-white border rounded-xl py-3 px-4 transition duration-150 focus:outline-none focus:ring-1 focus:ring-[#163D5C] text-left ${
            isOpen
              ? 'border-[#163D5C] ring-1 ring-[#163D5C]'
              : error
              ? 'border-red-300'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'cursor-pointer'} ${triggerClassName}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
            <span
              className={`truncate ${
                selectedOption
                  ? 'text-slate-800 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {isSearchable && (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-normal hidden sm:inline-block">
                Qidiruv
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#163D5C]' : ''
              }`}
            />
          </div>
        </button>

        {/* Floating Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 mt-1.5 max-h-72 flex flex-col bg-white rounded-2xl shadow-2xl shadow-slate-300/80 border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            {isSearchable && (
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Nomini yozib qidiring..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2 outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C] transition-all font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {options.length > 3 && (
                  <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400">
                    <span>Qidiruv natijasi:</span>
                    <span className="font-semibold text-slate-600">{filteredOptions.length} ta topildi</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="overflow-y-auto flex-1 p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-5 text-center text-xs text-slate-400 space-y-1">
                  <Search className="w-5 h-5 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-500">"{searchQuery}" boʻyicha hech narsa topilmadi</p>
                  <p className="text-[11px] text-slate-400">Nomini toʻgʻri yozganingizni tekshiring</p>
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  const isCustomOption = option.value === '_CUSTOM_';
                  const isOptionDisabled = option.disabled;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isOptionDisabled}
                      onClick={() => !isOptionDisabled && handleSelect(option.value)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition duration-150 text-left ${
                        isOptionDisabled
                          ? 'opacity-60 bg-slate-50/70 text-slate-400 cursor-not-allowed select-none'
                          : isCustomOption
                          ? 'mt-1 border-t border-slate-100 text-blue-600 hover:bg-blue-50 font-bold cursor-pointer'
                          : isSelected
                          ? 'bg-[#163D5C]/10 text-[#163D5C] font-bold cursor-pointer'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Checkmark icon for selected option */}
                        <div className="w-4 h-4 flex items-center justify-center shrink-0">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                          ) : null}
                        </div>

                        <div className="flex-1 min-w-0 truncate">
                          <span
                            className={`block truncate ${
                              isOptionDisabled ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {option.label}
                          </span>
                          {option.sublabel && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate">
                              {option.sublabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {isOptionDisabled && option.disabledReason && (
                        <span className="ml-2 shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 max-w-[150px] truncate" title={option.disabledReason}>
                          {option.disabledReason}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

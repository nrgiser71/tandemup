'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Globe } from 'lucide-react';
import { LanguageCode, Languages } from '@/types/database';
import { LANGUAGES } from '@/lib/constants';

interface MultiLanguageSelectProps {
  /** Currently selected language codes */
  value: Languages;
  /** Callback when selection changes */
  onChange: (languages: Languages) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show validation error state */
  error?: boolean;
  /** Help text or error message */
  helperText?: string;
  /** Component label */
  label?: string;
  /** Placeholder text when no languages selected */
  placeholder?: string;
  /** Custom className for the container */
  className?: string;
}

export function MultiLanguageSelect({
  value = [],
  onChange,
  disabled = false,
  error = false,
  helperText,
  label = "Languages",
  placeholder = "Select languages...",
  className = "",
}: MultiLanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Create a map of language codes to language objects for quick lookup
  const languageMap = new Map(
    LANGUAGES.map(lang => [lang.code, lang])
  );

  // Get selected language objects
  const selectedLanguages = value
    .map(code => languageMap.get(code))
    .filter(Boolean) as typeof LANGUAGES;

  const handleToggleLanguage = useCallback((languageCode: LanguageCode) => {
    if (disabled) return;

    let newSelection: Languages;
    if (value.includes(languageCode)) {
      // Remove if already selected (but ensure at least 1 remains)
      if (value.length > 1) {
        newSelection = value.filter(code => code !== languageCode);
      } else {
        // Don't remove if it's the last one
        return;
      }
    } else {
      // Add if not selected
      newSelection = [...value, languageCode];
    }

    onChange(newSelection);
  }, [value, onChange, disabled]);

  const handleRemoveLanguage = useCallback((languageCode: LanguageCode) => {
    if (disabled || value.length <= 1) return;
    
    const newSelection = value.filter(code => code !== languageCode);
    onChange(newSelection);
  }, [value, onChange, disabled]);

  const handleDropdownToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOpen(prev => !prev);
  }, [disabled]);

  // Validation: At least 1 language must be selected
  const hasMinimumSelection = value.length >= 1;
  const showError = error || !hasMinimumSelection;

  return (
    <div className={`form-control w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="label">
          <span className="label-text font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {label}
          </span>
          {!hasMinimumSelection && (
            <span className="label-text-alt text-error">
              Select at least 1 language
            </span>
          )}
        </label>
      )}

      {/* Selected Languages Display */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedLanguages.map(language => (
            <div
              key={language.code}
              className={`badge badge-primary gap-2 ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              <span className="text-sm font-medium">
                {language.nativeName}
              </span>
              {!disabled && selectedLanguages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveLanguage(language.code);
                  }}
                  className="btn btn-ghost btn-xs btn-circle hover:bg-primary-content/20"
                  aria-label={`Remove ${language.nativeName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Container */}
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleDropdownToggle}
          disabled={disabled}
          className={`select select-bordered w-full flex items-center justify-between ${
            showError ? 'select-error' : ''
          } ${
            disabled ? 'select-disabled' : 'hover:select-primary focus:select-primary'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={`flex-1 text-left ${
            selectedLanguages.length === 0 ? 'text-base-content/50' : 'text-base-content'
          }`}>
            {selectedLanguages.length === 0 
              ? placeholder 
              : `${selectedLanguages.length} language${selectedLanguages.length === 1 ? '' : 's'} selected`
            }
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1">
            <ul className="menu bg-base-100 rounded-box p-2 shadow-lg border border-base-300 max-h-60 overflow-auto">
              {LANGUAGES.map(language => {
                const isSelected = value.includes(language.code);
                const isLastSelected = isSelected && value.length === 1;
                
                return (
                  <li key={language.code}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleLanguage(language.code);
                      }}
                      disabled={isLastSelected}
                      className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'hover:bg-base-200'
                      } ${
                        isLastSelected ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {language.nativeName}
                          </span>
                          <span className="text-xs text-base-content/60">
                            {language.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-content" />
                          </div>
                        )}
                        {!isSelected && (
                          <div className="w-5 h-5 rounded-full border-2 border-base-300" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && (
        <label className="label">
          <span className={`label-text-alt ${
            showError ? 'text-error' : 'text-base-content/60'
          }`}>
            {helperText}
          </span>
        </label>
      )}
    </div>
  );
}

// Export type for convenience
export type { MultiLanguageSelectProps };
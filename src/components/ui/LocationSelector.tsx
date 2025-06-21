import React from 'react';
import { getCountryOptions, getStateOptions } from '../../lib/locationData';

interface LocationSelectorProps {
  country: string;
  state: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  className?: string;
  countryLabel?: string;
  stateLabel?: string;
  required?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  state,
  onCountryChange,
  onStateChange,
  className = '',
  countryLabel = 'Country',
  stateLabel = 'State/Province',
  required = false
}) => {
  const countryOptions = getCountryOptions();
  const stateOptions = getStateOptions(country);

  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
    // Reset state when country changes
    if (state) {
      onStateChange('');
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {countryLabel} {required && <span className="text-red-400">*</span>}
        </label>
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        >
          <option value="">Select a Country</option>
          {countryOptions.map((option: { value: string; label: string }) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {stateLabel} {required && <span className="text-red-400">*</span>}
        </label>
        {stateOptions.length > 0 ? (
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
          >
            <option value="">Select a {stateLabel}</option>
            {stateOptions.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
            placeholder={`Enter ${stateLabel.toLowerCase()}`}
            disabled={!country}
          />
        )}
        {!country && (
          <p className="text-xs text-gray-500 mt-1">Select a country first</p>
        )}
      </div>
    </div>
  );
};

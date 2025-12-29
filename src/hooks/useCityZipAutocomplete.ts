// City and Zip Code Autocomplete Hook
// Provides autocomplete suggestions and auto-fill functionality

import { useState, useEffect, useCallback } from 'react';

interface CityZipData {
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AutocompleteResult {
  suggestions: CityZipData[];
  loading: boolean;
}

export function useCityZipAutocomplete(
  query: string,
  country: string,
  searchType: 'city' | 'zip' = 'city',
  debounceMs: number = 300
): AutocompleteResult {
  const [suggestions, setSuggestions] = useState<CityZipData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2 || !country) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchCityZip(query, country, searchType);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching city/zip suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, country, searchType, debounceMs]);

  return { suggestions, loading };
}

// Search function that queries the API
async function searchCityZip(
  query: string,
  country: string,
  searchType: 'city' | 'zip'
): Promise<CityZipData[]> {
  try {
    // Try API endpoint first
    const response = await fetch(
      `/api/location/search?query=${encodeURIComponent(query)}&country=${country}&type=${searchType}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.results || [];
    }
  } catch (error) {
    console.warn('API search failed, using fallback:', error);
  }

  // Fallback to client-side search with limited data
  return searchClientSide(query, country, searchType);
}

// Client-side fallback with common US cities
function searchClientSide(
  query: string,
  country: string,
  searchType: 'city' | 'zip'
): CityZipData[] {
  if (country !== 'US') return [];

  const normalizedQuery = query.toLowerCase().trim();

  if (searchType === 'zip') {
    // Search by zip code
    return US_CITY_ZIP_DATA.filter(item =>
      item.zipCode.startsWith(normalizedQuery)
    ).slice(0, 10);
  } else {
    // Search by city name
    return US_CITY_ZIP_DATA.filter(item =>
      item.city.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10);
  }
}

// Sample data for major US cities (in production, this would come from an API)
const US_CITY_ZIP_DATA: CityZipData[] = [
  // Major cities by state
  { city: 'New York', state: 'New York', zipCode: '10001', country: 'US' },
  { city: 'Los Angeles', state: 'California', zipCode: '90001', country: 'US' },
  { city: 'Chicago', state: 'Illinois', zipCode: '60601', country: 'US' },
  { city: 'Houston', state: 'Texas', zipCode: '77001', country: 'US' },
  { city: 'Phoenix', state: 'Arizona', zipCode: '85001', country: 'US' },
  { city: 'Philadelphia', state: 'Pennsylvania', zipCode: '19101', country: 'US' },
  { city: 'San Antonio', state: 'Texas', zipCode: '78201', country: 'US' },
  { city: 'San Diego', state: 'California', zipCode: '92101', country: 'US' },
  { city: 'Dallas', state: 'Texas', zipCode: '75201', country: 'US' },
  { city: 'San Jose', state: 'California', zipCode: '95101', country: 'US' },
  { city: 'Austin', state: 'Texas', zipCode: '73301', country: 'US' },
  { city: 'Jacksonville', state: 'Florida', zipCode: '32099', country: 'US' },
  { city: 'Fort Worth', state: 'Texas', zipCode: '76101', country: 'US' },
  { city: 'Columbus', state: 'Ohio', zipCode: '43004', country: 'US' },
  { city: 'Charlotte', state: 'North Carolina', zipCode: '28201', country: 'US' },
  { city: 'San Francisco', state: 'California', zipCode: '94102', country: 'US' },
  { city: 'Indianapolis', state: 'Indiana', zipCode: '46201', country: 'US' },
  { city: 'Seattle', state: 'Washington', zipCode: '98101', country: 'US' },
  { city: 'Denver', state: 'Colorado', zipCode: '80201', country: 'US' },
  { city: 'Boston', state: 'Massachusetts', zipCode: '02101', country: 'US' },
  { city: 'Nashville', state: 'Tennessee', zipCode: '37201', country: 'US' },
  { city: 'Detroit', state: 'Michigan', zipCode: '48201', country: 'US' },
  { city: 'Portland', state: 'Oregon', zipCode: '97201', country: 'US' },
  { city: 'Las Vegas', state: 'Nevada', zipCode: '89101', country: 'US' },
  { city: 'Memphis', state: 'Tennessee', zipCode: '37501', country: 'US' },
  { city: 'Louisville', state: 'Kentucky', zipCode: '40201', country: 'US' },
  { city: 'Baltimore', state: 'Maryland', zipCode: '21201', country: 'US' },
  { city: 'Milwaukee', state: 'Wisconsin', zipCode: '53201', country: 'US' },
  { city: 'Albuquerque', state: 'New Mexico', zipCode: '87101', country: 'US' },
  { city: 'Tucson', state: 'Arizona', zipCode: '85701', country: 'US' },
  { city: 'Fresno', state: 'California', zipCode: '93650', country: 'US' },
  { city: 'Sacramento', state: 'California', zipCode: '94203', country: 'US' },
  { city: 'Kansas City', state: 'Missouri', zipCode: '64101', country: 'US' },
  { city: 'Mesa', state: 'Arizona', zipCode: '85201', country: 'US' },
  { city: 'Atlanta', state: 'Georgia', zipCode: '30301', country: 'US' },
  { city: 'Omaha', state: 'Nebraska', zipCode: '68101', country: 'US' },
  { city: 'Colorado Springs', state: 'Colorado', zipCode: '80901', country: 'US' },
  { city: 'Raleigh', state: 'North Carolina', zipCode: '27601', country: 'US' },
  { city: 'Miami', state: 'Florida', zipCode: '33101', country: 'US' },
  { city: 'Cleveland', state: 'Ohio', zipCode: '44101', country: 'US' },
  { city: 'Tulsa', state: 'Oklahoma', zipCode: '74101', country: 'US' },
  { city: 'Oakland', state: 'California', zipCode: '94601', country: 'US' },
  { city: 'Minneapolis', state: 'Minnesota', zipCode: '55401', country: 'US' },
  { city: 'Wichita', state: 'Kansas', zipCode: '67201', country: 'US' },
  { city: 'Arlington', state: 'Texas', zipCode: '76001', country: 'US' },
  { city: 'Tampa', state: 'Florida', zipCode: '33601', country: 'US' },
  { city: 'New Orleans', state: 'Louisiana', zipCode: '70112', country: 'US' },
  { city: 'Honolulu', state: 'Hawaii', zipCode: '96801', country: 'US' },
  { city: 'Anaheim', state: 'California', zipCode: '92801', country: 'US' },
  { city: 'Aurora', state: 'Colorado', zipCode: '80010', country: 'US' },
  { city: 'Santa Ana', state: 'California', zipCode: '92701', country: 'US' },
];

// Utility function to look up city/state by zip code
export async function getCityStateFromZip(
  zipCode: string,
  country: string
): Promise<{ city: string; state: string } | null> {
  if (!zipCode || zipCode.length < 5) return null;

  try {
    // Try API endpoint first
    const response = await fetch(
      `/api/location/lookup?zip=${encodeURIComponent(zipCode)}&country=${country}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.city && data.state) {
        return { city: data.city, state: data.state };
      }
    }
  } catch (error) {
    console.warn('API lookup failed, using fallback:', error);
  }

  // Fallback to client-side data
  const match = US_CITY_ZIP_DATA.find(item => item.zipCode === zipCode);
  if (match) {
    return { city: match.city, state: match.state };
  }

  return null;
}

// Utility function to look up zip code by city/state
export async function getZipFromCityState(
  city: string,
  state: string,
  country: string
): Promise<string | null> {
  if (!city || !state) return null;

  try {
    // Try API endpoint first
    const response = await fetch(
      `/api/location/lookup?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${country}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.zipCode) {
        return data.zipCode;
      }
    }
  } catch (error) {
    console.warn('API lookup failed, using fallback:', error);
  }

  // Fallback to client-side data
  const match = US_CITY_ZIP_DATA.find(
    item => item.city.toLowerCase() === city.toLowerCase() && item.state === state
  );
  if (match) {
    return match.zipCode;
  }

  return null;
}

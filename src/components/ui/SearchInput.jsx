import { Search } from 'lucide-react';

/**
 * Search input with icon and focus ring.
 *
 * @param {{ placeholder?: string, value: string, onChange: (e: Event) => void, className?: string }} props
 */
export default function SearchInput({ placeholder = 'Search...', value, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-djati-muted pointer-events-none"
      />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-base !pl-11"
      />
    </div>
  );
}

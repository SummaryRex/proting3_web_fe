import { Loader2 } from 'lucide-react';

/**
 * Full-page or inline loading spinner.
 *
 * @param {{ message?: string, fullPage?: boolean, className?: string }} props
 */
export default function LoadingSpinner({ message = 'Loading...', fullPage = false, className = '' }) {
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-djati-amber animate-spin" />
        <p className="text-sm text-white/50 font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 size={24} className="text-djati-amber animate-spin" />
      <span className="text-sm text-white/50 font-medium">{message}</span>
    </div>
  );
}

import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error state display with optional retry button.
 *
 * @param {{ message?: string, onRetry?: () => void, className?: string }} props
 */
export default function ErrorMessage({ message = 'Something went wrong', onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-status-critical-bg border border-status-critical-border flex items-center justify-center">
        <AlertCircle size={28} className="text-status-critical" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/70 mb-1">Error</p>
        <p className="text-[0.82rem] text-white/45 max-w-[400px]">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost gap-2 px-5 py-2.5 text-sm font-semibold mt-1">
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}

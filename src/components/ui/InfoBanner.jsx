export default function InfoBanner({ children, className = '' }) {
  return (
    <div className={`max-w-md w-full rounded-xl border border-gray-200 bg-gray-50/90 text-gray-800 px-4 py-3 text-center shadow-sm dark:border-gray-600/40 dark:bg-gray-800/60 dark:text-gray-100 ${className}`}>
      <div className="text-sm md:text-base">{children}</div>
    </div>
  );
}


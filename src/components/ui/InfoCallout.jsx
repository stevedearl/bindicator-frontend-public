export default function InfoCallout({ title, children, className = '' }) {
  return (
    <div className={`max-w-md w-full rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 px-4 py-4 text-center shadow-sm dark:border-blue-500/30 dark:bg-blue-900/30 dark:text-blue-100 ${className}`}>
      {title ? <div className="font-semibold text-base md:text-lg">{title}</div> : null}
      {children ? <div className="text-sm opacity-80">{children}</div> : null}
    </div>
  );
}


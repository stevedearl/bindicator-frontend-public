export default function Button({ children, variant = 'primary', className = '', compact = false, ...props }) {
  const base = 'rounded-lg transition focus:outline-none focus:ring-2 disabled:opacity-70 disabled:cursor-not-allowed';
  const size = compact ? 'px-3 py-2 text-sm md:text-base' : 'px-4 py-2';
  const variants = {
    primary: 'bg-blue-600 text-white shadow hover:bg-blue-700 focus:ring-blue-400',
    secondary:
      'border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-300 dark:bg-transparent dark:border-sky-300 dark:text-sky-100 dark:hover:bg-slate-800/60 dark:hover:border-sky-200 dark:focus:ring-sky-300',
  };
  return (
    <button className={`${base} ${size} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

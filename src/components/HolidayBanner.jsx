export default function HolidayBanner({ message, isChristmas = false, className = '' }) {
  if (!message) return null;

  const trimmed = message.trim();
  const messageHasEmoji =
    trimmed.startsWith('🎄') ||
    trimmed.startsWith('🎅') ||
    trimmed.startsWith('🌲') ||
    trimmed.startsWith('🌳');
  const icon = isChristmas ? '🎄' : '🔔';
  const showIcon = !messageHasEmoji;

  return (
    <div className={`holiday-banner ${isChristmas ? 'christmas' : ''} ${className}`.trim()}>
      {showIcon ? <span className="icon">{icon}</span> : null}
      <div className="text">{message}</div>
    </div>
  );
}

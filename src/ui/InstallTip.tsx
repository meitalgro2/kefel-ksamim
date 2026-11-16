/** How to add the app to the home screen. Hidden when already running as an installed app. */
export function InstallTip() {
  const installed =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone);
  if (installed) return null;
  return (
    <div className="install-tip">
      <b>📲 להתקנה במסך הבית:</b>
      <ul>
        <li><b>אייפון (Safari):</b> כפתור השיתוף ↑, ואז “הוספה למסך הבית”.</li>
        <li><b>אנדרואיד (Chrome):</b> תפריט ⋮, ואז “התקנת אפליקציה” או “הוספה למסך הבית”.</li>
      </ul>
      <small>אחרי ההתקנה האפליקציה עובדת גם בלי אינטרנט, והמידע נשמר טוב יותר.</small>
    </div>
  );
}

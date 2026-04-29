export function TruckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="1"
        y="6"
        width="16"
        height="12"
        rx="1.5"
        fill="currentColor"
      />
      <path
        d="M17 9h6.5l4 4v5H17V9z"
        fill="currentColor"
      />
      <rect x="3.5" y="8.5" width="3" height="2" rx="0.5" fill="#0a0a0a" opacity="0.55" />
      <rect x="7.5" y="8.5" width="3" height="2" rx="0.5" fill="#0a0a0a" opacity="0.55" />
      <rect x="11.5" y="8.5" width="3" height="2" rx="0.5" fill="#0a0a0a" opacity="0.55" />
      <circle cx="8" cy="20" r="2.6" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="22" cy="20" r="2.6" fill="#0a0a0a" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

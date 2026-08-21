type CPLogoProps = {
  className?: string;
};

export function CPLogo({ className = "h-8 w-8" }: CPLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" fill="currentColor" />
      <path d="M29 13H20L11 22V42L20 51H29V42H24L20 38V26L24 22H29V13Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M33 13H44L53 22V33L44 42H42V51H33V13ZM42 22V33H44L45 32V23L44 22H42Z" fill="white" />
    </svg>
  );
}

import React from 'react';

interface UnitArtworkProps {
  unitId: number;
  className?: string;
}

export const UnitArtwork: React.FC<UnitArtworkProps> = ({ unitId, className = 'w-14 h-14' }) => {
  switch (unitId) {
    case 1: // My New School
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#EFF6FF" />
          <path d="M14 30L32 16L50 30" stroke="#1D4ED8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="18" y="30" width="28" height="20" rx="2" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.4" />
          <rect x="28" y="38" width="8" height="12" rx="1" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="2" />
          <circle cx="32" cy="24" r="3" fill="#F59E0B" />
          <path d="M32 10V16" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M32 10L40 12.5L32 15" fill="#3B82F6" />
        </svg>
      );
    case 2: // My Home
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#F0FDFA" />
          <path d="M14 31L32 17L50 31V49H14V31Z" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M11 32L32 15L53 32" stroke="#0D9488" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="21" y="35" width="9" height="9" rx="1.5" fill="#99F6E4" stroke="#0F766E" strokeWidth="2" />
          <rect x="35" y="35" width="8" height="14" rx="1.5" fill="#FDE68A" stroke="#0F766E" strokeWidth="2" />
          <path d="M25.5 35V44M21 39.5H30" stroke="#0F766E" strokeWidth="1.6" />
        </svg>
      );
    case 3: // My Friends
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#F5F3FF" />
          <circle cx="24" cy="26" r="7" fill="#DDD6FE" stroke="#6D28D9" strokeWidth="2.4" />
          <circle cx="41" cy="28" r="6" fill="#FDE68A" stroke="#6D28D9" strokeWidth="2.4" />
          <path d="M13 48C13 40.5 18 36 24 36C30 36 35 40.5 35 48" fill="#FFFFFF" stroke="#6D28D9" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M34 48C34 42 37.5 38 42.5 38C47.5 38 51 42 51 48" fill="#EDE9FE" stroke="#6D28D9" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M35 16H48C49.6 16 51 17.4 51 19V22" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 4: // My Neighbourhood
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#F0F9FF" />
          <path d="M14 48L24 18H40L50 48H14Z" fill="#E0F2FE" stroke="#0369A1" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M32 22V44" stroke="#0284C7" strokeWidth="2.2" strokeDasharray="4 4" strokeLinecap="round" />
          <path d="M32 13C27.5 13 24 16.5 24 21C24 26.8 32 34 32 34C32 34 40 26.8 40 21C40 16.5 36.5 13 32 13Z" fill="#FFFFFF" stroke="#0369A1" strokeWidth="2.4" />
          <circle cx="32" cy="21" r="3" fill="#0284C7" />
        </svg>
      );
    case 5: // Natural Wonders
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#ECFDF5" />
          <circle cx="46" cy="19" r="5" fill="#FBBF24" />
          <path d="M12 46L26 22L36 38L43 28L53 46H12Z" fill="#A7F3D0" stroke="#047857" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M22 29L26 22L30 29L26 27L22 29Z" fill="#FFFFFF" />
          <path d="M14 51C20 48.5 26 53.5 32 51C38 48.5 44 53.5 50 51" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 6: // Our Tet Holiday
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#FEF2F2" />
          <path d="M32 12V18" stroke="#B91C1C" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="25" y="18" width="14" height="4" rx="1.5" fill="#F59E0B" stroke="#B91C1C" strokeWidth="1.8" />
          <ellipse cx="32" cy="33" rx="13" ry="11" fill="#EF4444" stroke="#B91C1C" strokeWidth="2.4" />
          <ellipse cx="32" cy="33" rx="6" ry="11" stroke="#FCA5A5" strokeWidth="1.8" />
          <rect x="26" y="44" width="12" height="3.5" rx="1.5" fill="#F59E0B" stroke="#B91C1C" strokeWidth="1.8" />
          <path d="M29 48V53M32 48V54M35 48V53" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="21" r="2.2" fill="#F59E0B" />
          <circle cx="48" cy="22" r="2.2" fill="#F59E0B" />
        </svg>
      );
    case 7: // Television
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#EEF2FF" />
          <path d="M24 16L32 23L40 16" stroke="#4338CA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="13" y="23" width="38" height="26" rx="5" fill="#FFFFFF" stroke="#4338CA" strokeWidth="2.4" />
          <rect x="18" y="28" width="22" height="16" rx="2.5" fill="#C7D2FE" stroke="#4338CA" strokeWidth="1.8" />
          <path d="M27 33L33 36L27 39V33Z" fill="#4338CA" />
          <circle cx="45" cy="32" r="2" fill="#F59E0B" />
          <circle cx="45" cy="39" r="2" fill="#6366F1" />
        </svg>
      );
    case 8: // Sports and Games
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#FFF7ED" />
          <path d="M22 18H42V29C42 34.5 37.5 39 32 39C26.5 39 22 34.5 22 29V18Z" fill="#FDE68A" stroke="#C2410C" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M22 22H16C16 27 18.5 30 22 30" stroke="#C2410C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M42 22H48C48 27 45.5 30 42 30" stroke="#C2410C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M32 39V47" stroke="#C2410C" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="23" y="47" width="18" height="4.5" rx="2" fill="#FFFFFF" stroke="#C2410C" strokeWidth="2.2" />
        </svg>
      );
    case 9: // Cities of the World
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#ECFEFF" />
          <circle cx="32" cy="32" r="17" fill="#FFFFFF" stroke="#0E7490" strokeWidth="2.4" />
          <ellipse cx="32" cy="32" rx="8" ry="17" stroke="#06B6D4" strokeWidth="2" />
          <path d="M15.5 32H48.5M18.5 23.5H45.5M18.5 40.5H45.5" stroke="#06B6D4" strokeWidth="2" />
          <circle cx="44" cy="18" r="4" fill="#F59E0B" />
        </svg>
      );
    case 10: // Our Houses in the Future
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#F0F9FF" />
          <circle cx="47" cy="18" r="5" fill="#FBBF24" />
          <path d="M16 34C16 25.2 23.2 18 32 18C40.8 18 48 25.2 48 34V46H16V34Z" fill="#FFFFFF" stroke="#0369A1" strokeWidth="2.4" />
          <rect x="22" y="29" width="20" height="8" rx="4" fill="#BAE6FD" stroke="#0369A1" strokeWidth="2" />
          <path d="M12 46H52" stroke="#0369A1" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M26 21L38 21" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 11: // Our Greener World
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#F0FDF4" />
          <path d="M47 17C31 17 19 25 19 43C19 45.5 21 47 23.5 47C41 47 47 34 47 17Z" fill="#86EFAC" stroke="#15803D" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M18 48C24 41 33 32 44 22" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M28 38H36M34 32V25" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 12: // Robots
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="56" height="56" rx="14" fill="#F0FDFA" />
          <path d="M32 13V19" stroke="#0F766E" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="32" cy="12" r="2.5" fill="#F59E0B" />
          <rect x="17" y="19" width="30" height="24" rx="6" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2.4" />
          <circle cx="26" cy="29" r="3" fill="#14B8A6" />
          <circle cx="38" cy="29" r="3" fill="#14B8A6" />
          <path d="M26 36.5H38" stroke="#0F766E" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M13 28V34M51 28V34" stroke="#0F766E" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="23" y="43" width="18" height="7" rx="3" fill="#CCFBF1" stroke="#0F766E" strokeWidth="2.2" />
        </svg>
      );
  }
};

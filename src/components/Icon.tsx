import type { ReactNode } from 'react'

/*
 * Hand-drawn icon set (24×24, flat and chunky with a small highlight, like the rest of the app).
 * Every icon brings its own colours, so it reads as a little illustration instead of an emoji.
 */

const C = {
  green: '#58cc02',
  greenDark: '#46a302',
  blue: '#1cb0f6',
  blueDark: '#1899d6',
  blueLight: '#84d8ff',
  yellow: '#ffc800',
  yellowDark: '#e5a400',
  orange: '#ff9600',
  orangeDark: '#e07b00',
  red: '#ff4b4b',
  redDark: '#d93636',
  purple: '#ce82ff',
  purpleDark: '#a568cc',
  pink: '#ff86d0',
  pinkDark: '#e066b0',
  brown: '#b86b2b',
  brownDark: '#8c4f1d',
  gray: '#afafaf',
  grayDark: '#8a8a8a',
  white: '#ffffff',
}

const shine = (d: string) => <path d={d} fill="#fff" opacity={0.45} />

const ICONS: Record<string, ReactNode> = {
  flame: (
    <>
      <path d="M12 1.8c.7 3.3 3.2 4.8 4.8 7.1 1.4 2 2.4 4.1 2.4 6.3 0 3.9-3.2 7-7.2 7s-7.2-3.1-7.2-7c0-2.5 1.2-4.4 2.7-5.8.3 1.7 1.2 2.9 2.5 3.3C9.4 9.6 10.3 5.3 12 1.8z" fill={C.orange} />
      <path d="M12 11.8c1.8 1.5 3.3 3 3.3 5.1A3.3 3.3 0 0 1 12 20.2a3.3 3.3 0 0 1-3.3-3.2c0-1.6 1-2.7 2-3.4.1 1 .5 1.6 1.1 1.8-.2-1.2.2-2.5.2-3.6z" fill={C.yellow} />
    </>
  ),
  flameGray: (
    <>
      <path d="M12 1.8c.7 3.3 3.2 4.8 4.8 7.1 1.4 2 2.4 4.1 2.4 6.3 0 3.9-3.2 7-7.2 7s-7.2-3.1-7.2-7c0-2.5 1.2-4.4 2.7-5.8.3 1.7 1.2 2.9 2.5 3.3C9.4 9.6 10.3 5.3 12 1.8z" fill={C.gray} />
      <path d="M12 11.8c1.8 1.5 3.3 3 3.3 5.1A3.3 3.3 0 0 1 12 20.2a3.3 3.3 0 0 1-3.3-3.2c0-1.6 1-2.7 2-3.4.1 1 .5 1.6 1.1 1.8-.2-1.2.2-2.5.2-3.6z" fill="#d6d6d6" />
    </>
  ),
  gem: (
    <>
      <path d="M6.2 3.5h11.6l4.2 5.3L12 21.5 2 8.8z" fill={C.blue} />
      <path d="M2 8.8h20L12 21.5z" fill={C.blueDark} />
      <path d="M8.6 8.8 12 21.5l3.4-12.7z" fill={C.blue} />
      <path d="M6.2 3.5 8.6 8.8h6.8l2.4-5.3z" fill={C.blueLight} />
      {shine('M7 4.6h2.6L8.3 7.6z')}
    </>
  ),
  star: (
    <>
      <path d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.1l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" fill={C.yellow} />
      <path d="M12 17.1l-5.9 3.1 1.2-6.5L12 12z" fill={C.yellowDark} opacity={0.6} />
      {shine('M10.6 6.6 12 3.9l.6 1.3-1.3 2.4z')}
    </>
  ),
  bolt: (
    <>
      <path d="M14 1.8 4 13.6h6.6L9.4 22.2 20 10h-6.8z" fill={C.yellow} />
      <path d="M10.6 13.6 9.4 22.2 20 10h-3z" fill={C.yellowDark} opacity={0.7} />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" fill={C.red} />
      <circle cx="12" cy="12" r="7.2" fill={C.white} />
      <circle cx="12" cy="12" r="4.6" fill={C.red} />
      <circle cx="12" cy="12" r="2" fill={C.white} />
      <path d="M12 12 20.5 3.5" stroke={C.brownDark} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M18.4 2.6l3 3-1.6.5-1.9-1.9z" fill={C.blue} />
    </>
  ),
  trophy: (
    <>
      <path d="M6.5 5.5H3.8c0 3.3 1.6 5.2 4.2 5.4M17.5 5.5h2.7c0 3.3-1.6 5.2-4.2 5.4" fill="none" stroke={C.yellowDark} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.5 2.5h11v6.2a5.5 5.5 0 0 1-11 0z" fill={C.yellow} />
      <rect x="10.6" y="13.6" width="2.8" height="4" fill={C.yellowDark} />
      <rect x="7.5" y="17.4" width="9" height="3.6" rx="1.2" fill={C.brown} />
      <rect x="7.5" y="17.4" width="9" height="1.4" rx=".7" fill={C.brownDark} opacity={0.4} />
      {shine('M8.6 3.8h1.6v5.4c0 1 .3 1.9.9 2.6-1.6-.4-2.5-1.7-2.5-3.3z')}
    </>
  ),
  map: (
    <>
      <path d="M2.5 5.6 8.6 3.5v15.4l-6.1 2.1z" fill={C.green} />
      <path d="M8.6 3.5l6.8 2.1v15.4l-6.8-2.1z" fill="#89e219" />
      <path d="M15.4 5.6l6.1-2.1v15.4l-6.1 2.1z" fill={C.green} />
      <path d="M5.2 15.2c2-1.5 3.6-.2 5.3-1.6 1.7-1.4 2.2-3.5 4.6-3.6" fill="none" stroke={C.white} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.4 1.8" />
      <path d="M17.6 4.2a2.8 2.8 0 0 1 2.8 2.8c0 2.1-2.8 4.8-2.8 4.8s-2.8-2.7-2.8-4.8a2.8 2.8 0 0 1 2.8-2.8z" fill={C.red} />
      <circle cx="17.6" cy="7" r="1" fill={C.white} />
    </>
  ),
  dumbbell: (
    <>
      <rect x="6" y="10.6" width="12" height="2.8" rx="1" fill={C.grayDark} />
      <rect x="2.2" y="7.4" width="4.4" height="9.2" rx="1.4" fill={C.blue} />
      <rect x="17.4" y="7.4" width="4.4" height="9.2" rx="1.4" fill={C.blue} />
      <rect x="1" y="9.4" width="2" height="5.2" rx=".8" fill={C.blueDark} />
      <rect x="21" y="9.4" width="2" height="5.2" rx=".8" fill={C.blueDark} />
      {shine('M3.2 8.4h1.2v4.4H3.2z')}
    </>
  ),
  quests: (
    <>
      <rect x="4" y="3.6" width="16" height="18" rx="2.6" fill={C.purple} />
      <rect x="6" y="6.6" width="12" height="13" rx="1.4" fill={C.white} />
      <rect x="8.4" y="1.8" width="7.2" height="4" rx="1.4" fill={C.purpleDark} />
      <path d="M8 10.6l1.2 1.2 2-2.2M8 15.2l1.2 1.2 2-2.2" fill="none" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12.6" y="10" width="3.8" height="1.4" rx=".7" fill="#e5e5e5" />
      <rect x="12.6" y="14.6" width="3.8" height="1.4" rx=".7" fill="#e5e5e5" />
    </>
  ),
  medal: (
    <>
      <path d="M6.5 1.8h4.2l2.6 6.4-3.6 2.4z" fill={C.blue} />
      <path d="M17.5 1.8h-4.2l-2.6 6.4 3.6 2.4z" fill={C.red} />
      <circle cx="12" cy="15" r="7" fill={C.yellowDark} />
      <circle cx="12" cy="15" r="5.4" fill={C.yellow} />
      <path d="M12 11.4l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill={C.yellowDark} />
    </>
  ),
  shop: (
    <>
      <path d="M8.2 8V6.6a3.8 3.8 0 0 1 7.6 0V8" fill="none" stroke={C.pinkDark} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.4 7.6h15.2l-1 13.1a1.6 1.6 0 0 1-1.6 1.5H7a1.6 1.6 0 0 1-1.6-1.5z" fill={C.pink} />
      <path d="M4.4 7.6h15.2l-.2 2.6H4.6z" fill={C.pinkDark} opacity={0.5} />
      <path d="M12 12.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill={C.white} />
    </>
  ),
  profile: (
    <>
      <circle cx="4.6" cy="11" r="3.4" fill="#d48f34" />
      <circle cx="19.4" cy="11" r="3.4" fill="#d48f34" />
      <circle cx="4.6" cy="11" r="1.9" fill="#f6e7c8" />
      <circle cx="19.4" cy="11" r="1.9" fill="#f6e7c8" />
      <circle cx="12" cy="11.4" r="9.4" fill="#e3a03c" />
      <path d="M12 4.6c3 0 4.4 1.8 4.6 3.8 3 1.4 2.8 9.6-4.6 9.6S4.4 9.8 7.4 8.4C7.6 6.4 9 4.6 12 4.6z" fill="#fbf2e0" />
      <circle cx="9.6" cy="8.8" r="1.25" fill="#1a120c" />
      <circle cx="14.4" cy="8.8" r="1.25" fill="#1a120c" />
      <circle cx="10" cy="8.4" r=".4" fill="#fff" />
      <circle cx="14.8" cy="8.4" r=".4" fill="#fff" />
      <path d="M8.4 14.2q3.6 2.4 7.2 0" stroke="#c8323e" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </>
  ),
  repeat: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3" fill="none" stroke={C.purple} strokeWidth="3" strokeLinecap="round" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3" fill="none" stroke={C.purpleDark} strokeWidth="3" strokeLinecap="round" />
      <path d="M14.6 3.6l5.2.6-.9 5.1z" fill={C.purple} />
      <path d="M9.4 20.4l-5.2-.6.9-5.1z" fill={C.purpleDark} />
    </>
  ),
  abc: (
    <>
      <rect x="2" y="4" width="20" height="17" rx="3.4" fill="#4f46e5" />
      <rect x="2" y="3" width="20" height="15.6" rx="3.4" fill="#6366f1" />
      <text x="12" y="15" textAnchor="middle" fontSize="7.4" fontWeight="900" fontFamily="'Segoe UI', system-ui, sans-serif" fill="#fff">ABC</text>
    </>
  ),
  keyboard: (
    <>
      <rect x="1.5" y="6" width="21" height="13.5" rx="2.6" fill={C.grayDark} />
      <rect x="1.5" y="5" width="21" height="12.8" rx="2.6" fill="#e9eef0" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={`a${i}`} x={3.6 + i * 3.5} y="7.2" width="2.6" height="2.4" rx=".6" fill={C.grayDark} opacity={0.6} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={`b${i}`} x={5.3 + i * 3.5} y="10.6" width="2.6" height="2.4" rx=".6" fill={i === 1 ? C.green : C.grayDark} opacity={i === 1 ? 1 : 0.6} />
      ))}
      <rect x="6.4" y="14" width="11.2" height="2.2" rx=".8" fill={C.grayDark} opacity={0.6} />
    </>
  ),
  lock: (
    <>
      <path d="M7.4 10.6V7.8a4.6 4.6 0 0 1 9.2 0v2.8" fill="none" stroke={C.grayDark} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="4.4" y="10" width="15.2" height="12" rx="2.8" fill={C.gray} />
      <circle cx="12" cy="15.2" r="1.7" fill={C.grayDark} />
      <rect x="11.2" y="15.8" width="1.6" height="3" rx=".8" fill={C.grayDark} />
    </>
  ),
  crown: (
    <>
      <path d="M2.6 7.6l5 4.4L12 4.2l4.4 7.8 5-4.4-2.2 11.6H4.8z" fill={C.yellow} />
      <rect x="4.6" y="17.6" width="14.8" height="3.2" rx="1" fill={C.yellowDark} />
      <circle cx="12" cy="13.2" r="1.6" fill={C.red} />
      <circle cx="7.4" cy="14.4" r="1.1" fill={C.blue} />
      <circle cx="16.6" cy="14.4" r="1.1" fill={C.blue} />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="10" fill={C.green} />
      <path d="M7.2 12.4l3.2 3.2 6.4-7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.4C9.8 4.6 6.6 4 2.6 4.4v14.4c4-.4 7.2.2 9.4 2z" fill={C.blue} />
      <path d="M12 6.4c2.2-1.8 5.4-2.4 9.4-2v14.4c-4-.4-7.2.2-9.4 2z" fill={C.blueDark} />
      <path d="M4.6 8.2c2.2 0 3.8.3 5.2 1M4.6 11.2c2.2 0 3.8.3 5.2 1M14.2 9.2c1.4-.7 3-1 5.2-1M14.2 12.2c1.4-.7 3-1 5.2-1" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity={0.7} />
    </>
  ),
  chest: (
    <>
      <path d="M3 10.4h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={C.brown} />
      <path d="M3 10.4V8.6A5 5 0 0 1 8 3.6h8a5 5 0 0 1 5 5v1.8z" fill="#d9883f" />
      <rect x="3" y="10" width="18" height="2.4" fill={C.yellowDark} />
      <rect x="6.2" y="3.8" width="2.2" height="17.6" fill={C.yellow} opacity={0.9} />
      <rect x="15.6" y="3.8" width="2.2" height="17.6" fill={C.yellow} opacity={0.9} />
      <rect x="10" y="9" width="4" height="5" rx="1.2" fill={C.yellow} />
      <circle cx="12" cy="11.4" r=".9" fill={C.brownDark} />
    </>
  ),
  flag: (
    <>
      <rect x="4" y="2" width="2.2" height="20" rx="1.1" fill={C.grayDark} />
      <path d="M6.2 3.4c4.6-2 7.4 2 13 0v9.4c-5.6 2-8.4-2-13 0z" fill={C.red} />
      <path d="M6.2 3.4c2-.9 3.7-.7 5.2-.2v9.4c-1.5-.5-3.2-.7-5.2.2z" fill={C.redDark} opacity={0.5} />
    </>
  ),
  rocket: (
    <>
      <path d="M12 1.8c3.4 2.6 5 6.4 4.4 11.2H7.6C7 8.2 8.6 4.4 12 1.8z" fill="#e9eef0" />
      <path d="M7.6 13l-3 3.4 3.6.6zM16.4 13l3 3.4-3.6.6z" fill={C.red} />
      <circle cx="12" cy="8" r="2.2" fill={C.blue} />
      <circle cx="12" cy="8" r="1.1" fill={C.blueLight} />
      <path d="M9.4 14.6h5.2c0 3.4-1.4 5.6-2.6 7.6-1.2-2-2.6-4.2-2.6-7.6z" fill={C.orange} />
      <path d="M10.8 14.6h2.4c0 2-.6 3.4-1.2 4.4-.6-1-1.2-2.4-1.2-4.4z" fill={C.yellow} />
    </>
  ),
  ice: (
    <>
      <path d="M12 2.4 20.6 7v10L12 21.6 3.4 17V7z" fill={C.blueLight} />
      <path d="M12 12v9.6L3.4 17V7z" fill="#5ec8f8" />
      <path d="M12 2.4 20.6 7 12 12 3.4 7z" fill="#c9eeff" />
      {shine('M6.4 9.6l2.4 1.4v4.2l-2.4-1.4z')}
    </>
  ),
  moon: (
    <>
      <path d="M20 14.6A8.6 8.6 0 1 1 9.4 4a7 7 0 0 0 10.6 10.6z" fill="#8b9cff" />
      <circle cx="9.4" cy="12.6" r="1.2" fill="#6f7fe0" />
      <circle cx="12.6" cy="17" r="1.6" fill="#6f7fe0" />
    </>
  ),
  sun: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="11" y="1" width="2" height="4" rx="1" fill={C.orange} transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="5.6" fill={C.yellow} />
      {shine('M9 10a3.4 3.4 0 0 1 2.4-2.2l.4.9A2.6 2.6 0 0 0 10 10.4z')}
    </>
  ),
  sunrise: (
    <>
      <path d="M4.4 15.6a7.6 7.6 0 0 1 15.2 0z" fill={C.yellow} />
      {[-60, -30, 0, 30, 60].map((a) => (
        <rect key={a} x="11" y="2.4" width="2" height="3.4" rx="1" fill={C.orange} transform={`rotate(${a} 12 15.6)`} />
      ))}
      <rect x="2" y="15.6" width="20" height="2.4" rx="1.2" fill={C.blue} />
      <rect x="5" y="19.6" width="14" height="2" rx="1" fill={C.blueLight} />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 1.8c.8 5 2.4 6.8 7.6 7.8-5.2 1-6.8 2.8-7.6 7.8-.8-5-2.4-6.8-7.6-7.8 5.2-1 6.8-2.8 7.6-7.8z" fill={C.purple} />
      <path d="M18.6 14.4c.4 2.4 1.2 3.2 3.6 3.6-2.4.4-3.2 1.2-3.6 3.6-.4-2.4-1.2-3.2-3.6-3.6 2.4-.4 3.2-1.2 3.6-3.6z" fill={C.yellow} />
    </>
  ),
  stopwatch: (
    <>
      <rect x="9.6" y="1.6" width="4.8" height="2.6" rx="1" fill={C.redDark} />
      <rect x="17.2" y="4.4" width="3" height="2.2" rx=".8" fill={C.redDark} transform="rotate(40 18.7 5.5)" />
      <circle cx="12" cy="13.4" r="8.8" fill={C.red} />
      <circle cx="12" cy="13.4" r="6.6" fill={C.white} />
      <path d="M12 13.4V9" stroke="#3c3c3c" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13.4l3 2" stroke={C.red} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="13.4" r="1.1" fill="#3c3c3c" />
    </>
  ),
  chat: (
    <>
      <path d="M4 3.4h16a2.4 2.4 0 0 1 2.4 2.4v9.4a2.4 2.4 0 0 1-2.4 2.4h-8.4L6.4 21.4v-3.8H4a2.4 2.4 0 0 1-2.4-2.4V5.8A2.4 2.4 0 0 1 4 3.4z" fill="#14b8a6" />
      <circle cx="7.6" cy="10.4" r="1.4" fill="#fff" />
      <circle cx="12" cy="10.4" r="1.4" fill="#fff" />
      <circle cx="16.4" cy="10.4" r="1.4" fill="#fff" />
    </>
  ),
  numbers: (
    <>
      <rect x="2" y="4" width="20" height="17" rx="3.4" fill="#7c3aed" />
      <rect x="2" y="3" width="20" height="15.6" rx="3.4" fill="#8b5cf6" />
      <text x="12" y="14.8" textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="'Segoe UI', system-ui, sans-serif" fill="#fff">123</text>
    </>
  ),
  shift: (
    <>
      <rect x="2" y="4" width="20" height="17" rx="3.4" fill={C.redDark} />
      <rect x="2" y="3" width="20" height="15.6" rx="3.4" fill={C.red} />
      <path d="M12 5.8l5.4 5.6h-3v4.2H9.6v-4.2h-3z" fill="#fff" />
    </>
  ),
  pencil: (
    <>
      <path d="M15.6 3.4l5 5L9 20l-6 1 1-6z" fill={C.yellow} />
      <path d="M15.6 3.4l2.2-2.2 5 5-2.2 2.2z" fill={C.pink} />
      <path d="M4 15l5 5-6 1z" fill="#f5d6a8" />
      <path d="M3.4 18.6 5.4 20.6 3 21z" fill="#3c3c3c" />
      <path d="M6.6 17.4l10.6-10.6" stroke={C.yellowDark} strokeWidth="1.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="2.6" y="4.4" width="18.8" height="17" rx="2.6" fill="#e9eef0" />
      <path d="M2.6 7a2.6 2.6 0 0 1 2.6-2.6h13.6A2.6 2.6 0 0 1 21.4 7v2.6H2.6z" fill={C.red} />
      <rect x="6.6" y="2.4" width="2" height="4.4" rx="1" fill={C.grayDark} />
      <rect x="15.4" y="2.4" width="2" height="4.4" rx="1" fill={C.grayDark} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={5 + c * 3.8} y={11.6 + r * 3.1} width="2.4" height="2" rx=".5" fill={r === 1 && c === 2 ? C.green : '#c4ccd0'} />
        )),
      )}
    </>
  ),
  chart: (
    <>
      <rect x="2.6" y="13" width="4.4" height="8.4" rx="1.2" fill={C.blue} />
      <rect x="9.8" y="8" width="4.4" height="13.4" rx="1.2" fill={C.green} />
      <rect x="17" y="3" width="4.4" height="18.4" rx="1.2" fill={C.yellow} />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="9" width="18" height="12.4" rx="1.8" fill={C.red} />
      <rect x="2" y="6.6" width="20" height="4.4" rx="1.4" fill={C.redDark} />
      <rect x="10.6" y="6.6" width="2.8" height="14.8" fill={C.yellow} />
      <path d="M12 6.6C10 3 6.6 2.6 6.4 4.8c-.2 1.8 3 1.8 5.6 1.8zM12 6.6c2-3.6 5.4-4 5.6-1.8.2 1.8-3 1.8-5.6 1.8z" fill={C.yellow} />
    </>
  ),
  sound: (
    <>
      <path d="M3 9h4l5-4.4v14.8L7 15H3z" fill={C.blue} />
      <path d="M15.4 8.4a5 5 0 0 1 0 7.2M18.2 5.6a9 9 0 0 1 0 12.8" fill="none" stroke={C.blueDark} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.2a2 2 0 0 1 3.4 0l8.4 15a2 2 0 0 1-1.7 3H3.6a2 2 0 0 1-1.7-3z" fill={C.red} />
      <rect x="10.8" y="8.4" width="2.4" height="7" rx="1.2" fill="#fff" />
      <circle cx="12" cy="18" r="1.3" fill="#fff" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" fill={C.blue} />
      <circle cx="12" cy="12" r="7.6" fill="#fff" />
      <path d="M12 7.4V12l3.2 2" fill="none" stroke="#3c3c3c" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  cap: (
    <>
      <path d="M3.6 14.6a8.4 8.4 0 0 1 16.8 0z" fill="#3b82f6" />
      <path d="M12 6.2a8.4 8.4 0 0 1 8.4 8.4h-4.2c0-3.6-1.8-6.8-4.2-8.4z" fill="#2563eb" />
      <path d="M2 14.6h15.6c2.6 0 4.6 1 4.6 2.2H4.6c-1.6 0-2.6-1-2.6-2.2z" fill="#1d4ed8" />
      <circle cx="12" cy="6.4" r="1.1" fill="#1d4ed8" />
    </>
  ),
  glasses: (
    <>
      <path d="M1.6 9.4h20.8" stroke="#1f2937" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2.6 9.4h8l-.8 4.6a3 3 0 0 1-3 2.4H6.2a3 3 0 0 1-3-2.6z" fill="#1f2937" />
      <path d="M13.4 9.4h8l-.6 4.4a3 3 0 0 1-3 2.6h-.6a3 3 0 0 1-3-2.4z" fill="#1f2937" />
      <path d="M4.2 10.6l1.6 0-1 3.4" stroke="#fff" strokeWidth="1" opacity={0.5} />
      <path d="M15 10.6l1.6 0-1 3.4" stroke="#fff" strokeWidth="1" opacity={0.5} />
    </>
  ),
  scarf: (
    <>
      <path d="M3 7.6c5.8 2.4 12.2 2.4 18 0v4.4c-5.8 2.4-12.2 2.4-18 0z" fill={C.red} />
      <path d="M14.4 11.6l3.2 9.4-3.2-.6-1.6 1.8-2.2-9.4z" fill={C.redDark} />
      <path d="M6 9.2v4M10 10v4M14 10v4M18 9.2v4" stroke="#fff" strokeWidth="1.2" opacity={0.6} />
    </>
  ),
  shield: (
    <>
      <path d="M12 1.8l8.6 3.2v6.6c0 5-3.6 9-8.6 10.6C7 20.6 3.4 16.6 3.4 11.6V5z" fill={C.blue} />
      <path d="M12 1.8l8.6 3.2v6.6c0 5-3.6 9-8.6 10.6z" fill={C.blueDark} />
      <path d="M8.2 11.8l2.6 2.6 5-5.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M12 2a7 7 0 0 1 4.2 12.6c-.8.6-1.2 1.4-1.2 2.2v.8H9v-.8c0-.8-.4-1.6-1.2-2.2A7 7 0 0 1 12 2z" fill={C.yellow} />
      <rect x="9" y="17.6" width="6" height="2.2" rx=".6" fill={C.grayDark} />
      <rect x="9.8" y="19.8" width="4.4" height="2" rx="1" fill={C.gray} />
      {shine('M8.4 6.6a4.6 4.6 0 0 1 3-2.2l.3 1.2a3.4 3.4 0 0 0-2.2 1.6z')}
    </>
  ),
  heart: (
    <>
      <path d="M12 21s-8.6-5.2-8.6-11.2A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.6 3.2C20.6 15.8 12 21 12 21z" fill={C.red} />
      {shine('M6.8 7.6a2.6 2.6 0 0 1 2.4-.4l-.4 1.2A1.6 1.6 0 0 0 7.4 9z')}
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />,
  chevron: <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />,
}


interface Props {
  name: string
  size?: number
  className?: string
  /** grey it out (locked / not reached yet) */
  muted?: boolean
  title?: string
}

/** Renders one of the drawn icons; unknown names fall back to the given text (e.g. an emoji or a letter). */
export default function Icon({ name, size = 24, className, muted, title }: Props) {
  const icon = ICONS[name]
  if (!icon) {
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1, filter: muted ? 'grayscale(1)' : undefined }} aria-hidden={!title} title={title}>
        {name}
      </span>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ filter: muted ? 'grayscale(1) opacity(.55)' : undefined, flexShrink: 0, overflow: 'visible' }}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {icon}
    </svg>
  )
}

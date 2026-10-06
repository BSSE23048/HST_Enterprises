import type { CSSProperties, ReactNode } from 'react';
export type IconName = 'arrow' | 'diagonal' | 'down' | 'menu' | 'close' | 'portal' | 'check' | 'pin' | 'phone' | 'mail' | 'supply' | 'power' | 'automation' | 'install' | 'maintenance' | 'cable' | 'globe' | 'whatsapp';
const paths: Record<Exclude<IconName, 'whatsapp'>, ReactNode> = {
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  diagonal: <><path d="M6 18 18 6M6 6h12v12" /></>,
  down: <><path d="M12 4v16M6 14l6 6 6-6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  portal: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
  check: <path d="m5 12 4 4L19 6" />,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  phone: <path d="m8 3 2 5-3 2c1 3 4 6 7 7l2-3 5 2v4c0 1-1 2-2 1C9 21 3 15 3 5c0-1 1-2 2-2Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  supply: <><path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7 4.7l9 5V14"/></>,
  power: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="m13 6-4 7h6l-4 5M7 5h.01M17 19h.01"/></>,
  automation: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><rect x="10" y="10" width="4" height="4"/></>,
  install: <><path d="M8 3v6m8-6v6M6 9h12v3a6 6 0 0 1-12 0V9Zm6 9v4"/></>,
  maintenance: <><path d="M14 4a6 6 0 0 0-7 8L3 16a3 3 0 0 0 4 4l5-5a6 6 0 0 0 8-7l-4 4-4-4 4-4-2-1Z"/></>,
  cable: <><path d="M7 2v4m-3 0h6v4a3 3 0 0 1-6 0V6Zm3 7v3a5 5 0 0 0 10 0v-3m-3-7h6v4a3 3 0 0 1-6 0V6Zm3-4v4"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
};
export function Icon({ name, size = 22, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  if (name === 'whatsapp') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={style}><path d="M20.5 11.5a9 9 0 0 1-13.3 7.9L3 21l1.5-4.5A9 9 0 1 1 20.5 11.5Z"/><path d="m8 7 1.4 2.8-1 1c.9 1.7 2.1 2.9 3.8 3.8l1-1L16 15c-.3 2.7-3.7 1.8-6.3-.7C7 11.7 5.7 8.3 8 7Z"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}

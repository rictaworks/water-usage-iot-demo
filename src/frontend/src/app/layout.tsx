import { config } from '@fortawesome/fontawesome-svg-core';
import './globals.css';

config.autoAddCss = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

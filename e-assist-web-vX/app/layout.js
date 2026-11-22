import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Shell from '@/components/Shell'; // [NEW]

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata = {
  title: 'E·Assist',
  description: 'Get things done without leaving your day.',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#242B47' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans text-ink antialiased">
        <Providers>
          {/* [CHANGED] phone frame moved into <Shell> so /admin can use the full desktop width */}
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}

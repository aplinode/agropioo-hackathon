import './global.css';
import { Playfair_Display, DM_Sans } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Agropioo — AI-Powered Smart Agriculture',
  description:
    'Agropioo helps farmers make informed decisions with AI guidance, digital farm records, and local-language support. Built for Pakistan, ready for the world.',
  keywords: [
    'agriculture',
    'AI farming',
    'smart agriculture',
    'Pakistan',
    'crop advisor',
    'farm records',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

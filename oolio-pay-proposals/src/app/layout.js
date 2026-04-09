import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700','800','900'] });

export const metadata = {
  title: 'Oolio Pay — Rate Proposal Generator',
  description: 'Generate branded rate proposals for Oolio Pay customers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

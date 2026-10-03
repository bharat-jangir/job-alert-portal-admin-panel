import './globals.css';
import './admin.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProviderWrapper } from './components/AuthProviderWrapper';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Admin Dashboard | Job Alert',
  description: 'Admin dashboard for Job Alert.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.className}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900">
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
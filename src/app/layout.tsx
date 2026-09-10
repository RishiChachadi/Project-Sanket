import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Sanket | Crisis Response',
  description: 'Emergency Distress Beacon & Incident Command System',
  manifest: '/manifest.json',
  themeColor: '#09090b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sanket SOS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

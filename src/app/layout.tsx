import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'ChillBill | Smart Restaurant POS & Management Software',
    template: '%s | ChillBill',
  },
  description: 'ChillBill is the all-in-one restaurant POS system for managing orders, billing, staff, kitchen, inventory, and vendors — built for modern cafes and restaurants.',
  keywords: [
    'restaurant POS', 'cafe POS software', 'restaurant management system',
    'billing software for restaurant', 'online POS system', 'restaurant billing app',
    'cafe management software', 'ChillBill', 'smart POS', 'restaurant order management',
  ],
  authors: [{ name: 'ChillBill', url: 'https://chillbill.co' }],
  creator: 'ChillBill',
  publisher: 'ChillBill',
  metadataBase: new URL('https://chillbill.co'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chillbill.co',
    siteName: 'ChillBill',
    title: 'ChillBill | Smart Restaurant POS & Management Software',
    description: 'All-in-one restaurant POS system for cafes and restaurants. Manage orders, billing, staff, kitchen, inventory, and vendors in one place.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChillBill Restaurant POS Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChillBill | Smart Restaurant POS & Management Software',
    description: 'All-in-one restaurant POS system for cafes and restaurants.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
};


export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ChillBill',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'ChillBill is the all-in-one restaurant POS system for managing orders, billing, staff, kitchen, inventory, and vendors.',
    url: 'https://chillbill.co',
    featureList: [
      'Point of Sale (POS)', 'Kitchen Order Tickets (KOT)', 'Staff Management',
      'Inventory Tracking', 'Vendor Management', 'Customer Management',
      'Expense Tracking', 'Sales Reports',
    ],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    creator: { '@type': 'Organization', name: 'ChillBill', url: 'https://chillbill.co' },
  };

  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body className="font-body antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}


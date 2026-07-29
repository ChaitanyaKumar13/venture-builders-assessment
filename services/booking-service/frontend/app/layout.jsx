import './globals.css';

export const metadata = {
  title: 'Consulting Booking',
  description: 'Book a consulting session — Venture Builders assignment',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}

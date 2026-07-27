import './globals.css';

export const metadata = {
  title: 'AI Query Assistant',
  description: 'Streaming multi-session AI chat — Venture Builders assignment',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

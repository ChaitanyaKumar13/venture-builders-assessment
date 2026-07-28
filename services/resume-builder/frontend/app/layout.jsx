import './globals.css';

export const metadata = {
  title: 'Resume Builder',
  description: 'LLM-assisted, ATS-friendly resume builder — Venture Builders assignment',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

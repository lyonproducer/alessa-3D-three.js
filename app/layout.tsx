import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Alessa · Nuestro pequeño universo',
  description:
    'Vamos a ser papás. Conoce a Alessa y acompaña nuestra espera, mes a mes.',
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

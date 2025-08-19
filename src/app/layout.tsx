import './globals.css';

export const metadata = {
  title: 'Tortas por Red',
  description: 'Indicadores por Red y Perfil desde CSV'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}



import type { Metadata } from 'next';
import './globals.css';  // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
import Header from './components/Header';
import Footer from './components/Footer';
import AuthInitializer from './components/AuthInitializer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Belarus Cosmetics - Подбор белорусской косметики',
  description: 'Индивидуальный подбор косметики белорусских брендов по типу кожи',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AuthInitializer />
        <Header />
        <main style={{ minHeight: 'calc(100vh - 200px)' }}>
          {children}
        </main>
        <Footer />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
import { Sora, Inter, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import AppProviders from '../components/AppProviders';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import MusicPlayer from '../components/layout/MusicPlayer';
import AmbientBackground from '../components/layout/AmbientBackground';
import AntiInspectGuard from '../components/security/AntiInspectGuard';
import HumanGate from '../components/security/HumanGate';

const sora = Sora({ subsets: ['latin'], variable: '--font-display', weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Khanghuynh.shop - File, Cheatgame, Proxy, Config chất lượng',
  description:
    'Khanghuynh.shop cung cấp key proxy, file, menu, config chất lượng, tương thích mọi thiết bị, nhận hàng tức thì.',
  keywords: ['file game', 'cheatgame', 'proxy', 'config', 'key vip', 'khanghuynh shop'],
};

/**
 * Script nho chay TRUOC khi React hydrate, doc theme da luu trong cookie
 * va gan class 'light'/'dark' ngay vao <html> de tranh hien tuong "nhap nhay"
 * (flash sai theme trong 1 khoanh khac truoc khi JS chinh chay xong).
 */
const themeInitScript = `
(function() {
  try {
    var match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
    var theme = match && decodeURIComponent(match[1]) === 'light' ? 'light' : 'dark';
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-ink-950 text-mist-100 antialiased font-body">
        <AppProviders>
          <AmbientBackground variant="shop" />
          <AntiInspectGuard />
          <HumanGate />
          <div className="relative z-10">
            <AnnouncementBar />
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <MusicPlayer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

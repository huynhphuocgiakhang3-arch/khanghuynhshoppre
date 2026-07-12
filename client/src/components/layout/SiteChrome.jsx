'use client';

import Header from './Header';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import MusicPlayer from './MusicPlayer';
import { useAuthStore } from '../../context/useAuthStore';

/**
 * Voi tai khoan Co van: AN HOAN TOAN Header/Footer/AnnouncementBar (khong
 * co menu, khong co link nao khac de bam sang trang khac) - chi con lai
 * NOI DUNG TRANG (chinh la trang /advisor, nho AdvisorGate da ep o dung
 * route nay) VA nut nghe nhac (Co van van duoc nghe nhac Admin dang phat,
 * theo yeu cau).
 */
export default function SiteChrome({ children }) {
  const user = useAuthStore((s) => s.user);
  const isAdvisor = user?.role === 'advisor';

  if (isAdvisor) {
    return (
      <>
        <main className="min-h-screen">{children}</main>
        <MusicPlayer />
      </>
    );
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <MusicPlayer />
    </>
  );
}

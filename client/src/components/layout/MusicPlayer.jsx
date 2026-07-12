'use client';

import { useEffect } from 'react';
import { FiMusic, FiPause, FiPlay } from 'react-icons/fi';
import api from '../../lib/api';
import { useLiveData } from '../../hooks/useLiveData';
import { useMusicStore } from '../../context/useMusicStore';

/**
 * Nut nhac nen: nguoi dung bam "Bat dau" de phat nhac (trinh duyet chan
 * autoplay co am thanh neu chua co tuong tac cua nguoi dung, nen phai
 * cho ho bam truoc). Link MP3 va trang thai bat/tat lay dong tu Admin,
 * tu cap nhat trong 1 giay khi Admin doi bai hat.
 *
 * Dung chung 1 audio voi PopupAnnouncement (qua useMusicStore) - neu khach
 * dong popup thong bao va nhac tu bat len, bam nut nay se hien dung trang
 * thai "Dang phat" thay vi tao ra 1 nguon am thanh thu 2 chong tieng.
 */
export default function MusicPlayer() {
  const { isPlaying, toggle, setConfig } = useMusicStore();

  const { data: musicConfig } = useLiveData(
    async () => {
      const { data } = await api.get('/config/public');
      return data.data.musicConfig;
    },
    [],
    3000
  );

  useEffect(() => {
    if (musicConfig?.musicUrl) {
      setConfig({ musicUrl: musicConfig.musicUrl, volume: musicConfig.volume });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicConfig?.musicUrl, musicConfig?.volume]);

  if (!musicConfig?.isEnabled || !musicConfig?.musicUrl) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        onClick={toggle}
        className="flex items-center gap-2 rounded-full bg-ink-800/90 border border-ink-600 backdrop-blur-md px-4 py-2.5 shadow-lg hover:border-ember-500/50 transition-colors"
        title={musicConfig.title || 'Nhạc nền'}
      >
        <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-ember-gradient text-ink-950 ${isPlaying ? 'animate-pulse-glow' : ''}`}>
          {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />}
        </span>
        <span className="text-xs text-mist-300 hidden sm:inline max-w-[140px] truncate">
          {isPlaying ? musicConfig.title || 'Đang phát...' : 'Bắt đầu nghe nhạc'}
        </span>
        <FiMusic className="text-mist-500 sm:hidden" size={14} />
      </button>
    </div>
  );
}

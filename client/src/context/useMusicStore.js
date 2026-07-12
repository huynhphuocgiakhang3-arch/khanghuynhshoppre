'use client';

import { create } from 'zustand';

// 1 the <audio> DUY NHAT dung chung cho ca nut nhac (MusicPlayer) LAN nut
// dong popup thong bao (PopupAnnouncement) - tranh tinh trang 2 noi cung
// tao audio rieng roi phat CHONG LEN NHAU thanh 2 bai hat cung luc. Bien
// nay song NGOAI React (module-level), khong phai React state, vi ban than
// doi tuong Audio khong can re-render khi thay doi.
let audioEl = null;

const ensureAudioEl = () => {
  if (!audioEl && typeof window !== 'undefined') {
    audioEl = new Audio();
    audioEl.loop = true;
    audioEl.preload = 'none';
  }
  return audioEl;
};

/**
 * Store dieu khien nhac nen toan cuc. Bat ky component nao (nut nhac o goc
 * man hinh, popup thong bao...) deu co the goi play()/pause()/toggle() va
 * TAT CA se dong bo cung trang thai isPlaying.
 */
export const useMusicStore = create((set, get) => ({
  isPlaying: false,
  hasStarted: false,
  musicUrl: '',
  volume: 0.5,

  /** Goi moi khi tai duoc cau hinh nhac moi nhat tu server (qua polling /config/public) */
  setConfig: ({ musicUrl, volume }) => {
    const prevUrl = get().musicUrl;
    set({ musicUrl: musicUrl || '', volume: volume ?? 0.5 });

    // Neu Admin doi sang bai khac trong luc dang phat, tu dong doi nguon va
    // tiep tuc phat luon (khong bat khach phai bam lai).
    const el = audioEl;
    if (el && musicUrl && musicUrl !== prevUrl && get().isPlaying) {
      el.src = musicUrl;
      el.load();
      el.play().catch(() => {});
    }
  },

  play: () => {
    const { musicUrl, volume } = get();
    if (!musicUrl) return;
    const el = ensureAudioEl();
    if (!el) return;
    if (el.src !== musicUrl) el.src = musicUrl;
    el.volume = volume;
    el
      .play()
      .then(() => set({ isPlaying: true, hasStarted: true }))
      .catch(() => {
        // Trinh duyet chan autoplay (chua co tuong tac nguoi dung) - im
        // lang bo qua, nut nhac van hien de khach tu bam neu muon.
      });
  },

  pause: () => {
    if (audioEl) audioEl.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) pause();
    else play();
  },
}));

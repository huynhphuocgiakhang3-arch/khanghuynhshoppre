'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell } from 'react-icons/fi';
import api from '../../lib/api';
import { useLiveData } from '../../hooks/useLiveData';
import { useMusicStore } from '../../context/useMusicStore';
import RobotWaving from './RobotWaving';

const SESSION_KEY_PREFIX = 'khs_popup_seen_v';
// Rieng cho nhac: CHI tu dong bat nhac dung 1 LAN duy nhat trong ca phien
// truy cap (lan dau tien khach dong thong bao) - du sau do Admin co doi
// noi dung khien popup hien lai (version moi) va khach dong tiep, nhung
// lan do KHONG tu bat nhac nua (tranh nhac tu nhien phat lai giua chung
// khi khach dang xem trang, gay kho chiu).
const MUSIC_AUTOPLAY_SESSION_KEY = 'khs_popup_music_autoplayed';

/**
 * Hop thoai thong bao LON hien 1 LAN moi khi khach vao web (khac voi thanh
 * "AnnouncementBar" mong o dau trang) - noi dung do Admin cau hinh trong
 * trang quan tri (tab "Thông báo popup"). Kem robot AI truot vao tu ben
 * phai va VAY TAY LIEN TUC cho toi khi khach bam nut dong (X); luc do nhac
 * nen (do Admin cau hinh o tab "Nhạc nền") se TU DONG bat len.
 *
 * "Hien 1 lan": dung sessionStorage kem so `version` (Admin luu la version
 * tang 1) - neu Admin sua noi dung va luu lai, khach DA TUNG dong popup cu
 * trong phien nay van se thay popup MOI (vi key session khac version cu).
 */
export default function PopupAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);
  const musicPlay = useMusicStore((s) => s.play);
  const setMusicConfig = useMusicStore((s) => s.setConfig);

  const { data: config } = useLiveData(
    async () => {
      const { data } = await api.get('/config/public');
      return { popup: data.data.popupAnnouncement, music: data.data.musicConfig };
    },
    [],
    3000
  );

  // Cap nhat cau hinh nhac (de sẵn sàng phát ngay khi khach bam dong, khong
  // can cho lan poll tiep theo cua MusicPlayer).
  useEffect(() => {
    if (config?.music?.musicUrl) {
      setMusicConfig({ musicUrl: config.music.musicUrl, volume: config.music.volume });
    }
  }, [config?.music?.musicUrl, config?.music?.volume, setMusicConfig]);

  useEffect(() => {
    const popup = config?.popup;
    if (!popup?.isActive || !popup?.content) return;

    const sessionKey = `${SESSION_KEY_PREFIX}${popup.version || 0}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return; // da tung xem popup PHIEN BAN nay trong phien nay roi
    } catch {
      /* sessionStorage khong kha dung -> cu hien binh thuong, khong chan trang */
    }
    setIsVisible(true);
  }, [config?.popup]);

  const handleClose = () => {
    setIsVisible(false);
    const popup = config?.popup;
    try {
      sessionStorage.setItem(`${SESSION_KEY_PREFIX}${popup?.version || 0}`, '1');
    } catch {
      /* noop */
    }

    // Chi tu dong bat nhac o LAN DAU TIEN khach dong thong bao trong ca
    // phien nay - kiem tra co MUSIC_AUTOPLAY_SESSION_KEY chua truoc khi
    // phat, va DANH DAU ngay sau do de moi lan dong sau (vd popup hien lai
    // do Admin doi noi dung) se KHONG tu bat nhac nua.
    let alreadyAutoplayed = false;
    try {
      alreadyAutoplayed = sessionStorage.getItem(MUSIC_AUTOPLAY_SESSION_KEY) === '1';
    } catch {
      /* Neu khong doc duoc sessionStorage, coi nhu chua tung phat de van co 1 lan trai nghiem nhac */
    }

    if (!alreadyAutoplayed && config?.music?.isEnabled && config?.music?.musicUrl) {
      // Bam dong la mot "tuong tac nguoi dung" hop le -> trinh duyet cho
      // phep tu dong phat am thanh ngay tai day (khong bi chan boi chinh
      // sach autoplay, vi day KHONG PHAI tu dong phat khi trang vua tai xong).
      musicPlay();
      try {
        sessionStorage.setItem(MUSIC_AUTOPLAY_SESSION_KEY, '1');
      } catch {
        /* noop */
      }
    }
  };

  const popup = config?.popup;

  return (
    <AnimatePresence>
      {isVisible && popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center bg-ink-950/90 backdrop-blur-md p-4 sm:p-8"
        >
          <div className="relative w-full max-w-md mx-auto">
            {/* Hop thoai chinh - thiet ke "sang trong" voi vien gradient noi bat */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="relative w-full max-w-md rounded-[26px] p-[1.5px] bg-gradient-to-br from-ember-500/70 via-gold-500/50 to-ember-600/70 shadow-[0_0_60px_rgba(255,138,61,0.25)]"
            >
              <div className="relative rounded-[24px] bg-ink-900/95 overflow-hidden">
                {popup.imageUrl && (
                  <div className="relative w-full aspect-[16/9]">
                    <Image src={popup.imageUrl} alt={popup.title || 'Thông báo'} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
                  </div>
                )}

                <button
                  onClick={handleClose}
                  aria-label="Đóng thông báo"
                  className="absolute top-3.5 right-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 border border-ink-600 text-mist-300 hover:text-mist-100 hover:border-ember-500/50 transition-colors backdrop-blur-sm"
                >
                  <FiX size={16} />
                </button>

                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember-gradient text-ink-950">
                      <FiBell size={16} />
                    </span>
                    <h2 className="font-display font-bold text-lg text-mist-100 leading-tight">
                      {popup.title || 'Thông báo từ Khanghuynh.shop'}
                    </h2>
                  </div>

                  <p className="text-sm text-mist-300 leading-relaxed whitespace-pre-line">{popup.content}</p>

                  <button
                    onClick={handleClose}
                    className="mt-6 w-full rounded-xl bg-ember-gradient py-3 text-sm font-semibold text-ink-950 hover:opacity-90 transition-opacity"
                  >
                    Đã hiểu, tiếp tục vào shop
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Robot AI truot vao tu ben phai, dung SAT canh hop thoai (chong
                mot phan len goc phai) de trong nhu dang "dung canh" thong
                bao thay vi dung tach roi xa - CHI hien tren man hinh du
                rong (md+) de tranh de len noi dung tren dien thoai. */}
            <div className="hidden md:block absolute right-0 top-6 translate-x-[52%] w-40 lg:w-48 pointer-events-none select-none z-20">
              <RobotWaving />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

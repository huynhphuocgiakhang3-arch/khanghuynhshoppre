'use client';

import { useState } from 'react';
import { FiInfo, FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';
import api from '../../lib/api';
import { useLiveData } from '../../hooks/useLiveData';

const ICON_MAP = {
  info: FiInfo,
  warning: FiAlertTriangle,
  success: FiCheckCircle,
};

const STYLE_MAP = {
  info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  warning: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
  success: 'bg-green-500/10 text-green-300 border-green-500/30',
};

/**
 * Thanh thong bao hien o dau trang, noi dung lay tu cau hinh Admin
 * (SystemConfig.announcement). Tu dong cap nhat trong vong 1 giay khi
 * Admin thay doi noi dung, khong can nguoi dung F5 lai trang.
 */
export default function AnnouncementBar() {
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: announcement } = useLiveData(
    async () => {
      const { data } = await api.get('/config/public');
      return data.data.announcement;
    },
    [],
    3000
  );

  if (!announcement?.isActive || !announcement?.content || isDismissed) return null;

  const Icon = ICON_MAP[announcement.type] || FiInfo;

  return (
    <div className={`border-b px-4 py-2.5 text-sm flex items-center justify-center gap-2 ${STYLE_MAP[announcement.type]}`}>
      <Icon className="shrink-0" />
      <span className="text-center">{announcement.content}</span>
      <button
        onClick={() => setIsDismissed(true)}
        className="ml-2 shrink-0 opacity-70 hover:opacity-100"
        aria-label="Đóng thông báo"
      >
        <FiX />
      </button>
    </div>
  );
}

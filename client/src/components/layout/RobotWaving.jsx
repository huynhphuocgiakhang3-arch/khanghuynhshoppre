'use client';

import { motion } from 'framer-motion';

// Moc thoi gian (giay) dieu phoi 3 giai doan xuat hien cua robot, dung
// CHUNG boi ca phan "di ra" (container) lan phan "mo man hinh ao" va "vay
// tay chao" (de 2 hieu ung nay LUON bat dau dung sau khi robot da di vao
// hoan toan, khong bi chong len nhau).
const WALK_IN_DURATION = 1.4; // robot di ra CHAM (tu tu), khong bat ngo hien ra
const SCREEN_APPEAR_DELAY = WALK_IN_DURATION + 0.15;
const WAVE_START_DELAY = SCREEN_APPEAR_DELAY + 0.55; // cho man hinh ao hien xong roi moi vay tay

/**
 * Minh hoa robot AI mau trang/bac trinh dien theo dung 3 buoc nhu yeu cau:
 *   1) Robot TU TU di ra tu ben phai (khong hien ra dot ngot).
 *   2) Sau khi den noi, robot MO 1 man hinh/bang dieu khien ao truoc mat
 *      (hieu ung phong to + sang dan, giong nhu dang "trien khai" 1 giao
 *      dien hologram, lay cam hung tu tu the cham vao man hinh ao).
 *   3) Cuoi cung robot VAY TAY CHAO (dong tac chao thuc su - vay 1 nhip
 *      ngan roi nghi, LAP LAI theo tung dot, khong phai lac lien tuc khong
 *      ngung) - va tiep tuc chao nhu vay cho den khi component nay bi go
 *      (tuc la khi PopupAnnouncement dong lai).
 */
export default function RobotWaving({ className = '' }) {
  return (
    <motion.div
      initial={{ x: 220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: WALK_IN_DURATION, ease: [0.22, 0.61, 0.36, 1] }}
      className={`relative ${className}`}
    >
      {/* Nhe nhang lac lu khi "buoc di" trong luc tien vao, dung lai khi da
          toi noi (delay = dung luc walk-in ket thuc) */}
      <motion.div
        animate={{ rotate: [0, -2.5, 2.5, -1.5, 0] }}
        transition={{ duration: WALK_IN_DURATION, ease: 'easeInOut' }}
      >
        {/* Man hinh/bang dieu khien AO - hien ra TRUOC MAT robot (ben trai,
            huong ve phia hop thoai) SAU KHI robot da toi noi, truoc khi vay
            tay - giong hinh anh robot AI dang thao tac tren 1 bang dieu
            khien hologram noi lo lung. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, x: 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.45, delay: SCREEN_APPEAR_DELAY, ease: 'backOut' }}
          className="absolute right-[62%] top-[18%] w-[92px] sm:w-[112px] pointer-events-none"
          style={{ transformOrigin: 'bottom right' }}
        >
          <svg viewBox="0 0 120 90" width="100%" height="100%">
            <defs>
              <linearGradient id="holoPanel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="116" height="86" rx="8" fill="url(#holoPanel)" stroke="#ffb066" strokeOpacity="0.7" strokeWidth="1.5" />
            {/* Vach ke gia lap giao dien du lieu */}
            <line x1="10" y1="18" x2="70" y2="18" stroke="#ffcf9b" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" y1="30" x2="52" y2="30" stroke="#ffcf9b" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
            {/* Bieu do cot mini */}
            <g>
              {[14, 26, 20, 32, 24].map((h, i) => (
                <rect key={i} x={10 + i * 15} y={72 - h} width="8" height={h} rx="2" fill="#ffb066" fillOpacity="0.85">
                  <animate attributeName="height" values={`${h};${h * 0.5};${h}`} dur="1.8s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                  <animate attributeName="y" values={`${72 - h};${72 - h * 0.5};${72 - h}`} dur="1.8s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
                </rect>
              ))}
            </g>
            <circle cx="100" cy="16" r="5" fill="none" stroke="#ffcf9b" strokeWidth="1.5" opacity="0.8" />
          </svg>
        </motion.div>

        <svg viewBox="0 0 220 260" width="100%" height="100%">
          <defs>
            <linearGradient id="robotBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4f6fa" />
              <stop offset="55%" stopColor="#d7dee8" />
              <stop offset="100%" stopColor="#b7c1d1" />
            </linearGradient>
            <linearGradient id="robotVisor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff8a3d" />
              <stop offset="100%" stopColor="#ffcf6b" />
            </linearGradient>
            <radialGradient id="robotGlow" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Vang sang hao quang phia sau */}
          <circle cx="110" cy="120" r="105" fill="url(#robotGlow)" />

          {/* Chan/de robot */}
          <rect x="78" y="222" width="64" height="18" rx="9" fill="#9aa5b6" />

          {/* Than duoi */}
          <rect x="70" y="150" width="80" height="76" rx="24" fill="url(#robotBody)" stroke="#8d97a8" strokeWidth="2" />
          {/* Chi tiet nguc phat sang */}
          <circle cx="110" cy="182" r="12" fill="#161b22" />
          <circle cx="110" cy="182" r="6" fill="#ff8a3d">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
          </circle>

          {/* Canh tay TRAI (khong vay - huong ve phia man hinh ao, giu yen) */}
          <rect x="52" y="158" width="16" height="52" rx="8" fill="#c7cedb" stroke="#8d97a8" strokeWidth="2" />

          {/* Canh tay PHAI - VAY CHAO, xoay quanh vai. Chi bat dau sau khi
              man hinh ao da hien xong (WAVE_START_DELAY), theo tung DOT
              chao ngan (3 nhip) roi nghi 1 chut - giong dong tac vay tay
              chao that (khong phai lac lien tuc khong ngung). */}
          <motion.g
            style={{ transformOrigin: '156px 162px' }}
            animate={{ rotate: [0, 0, 24, 6, 22, 6, 24, 0, 0] }}
            transition={{
              duration: 2.6,
              delay: WAVE_START_DELAY,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: 'easeInOut',
              times: [0, 0.08, 0.28, 0.42, 0.58, 0.72, 0.9, 0.96, 1],
            }}
          >
            <rect x="150" y="130" width="16" height="56" rx="8" fill="#c7cedb" stroke="#8d97a8" strokeWidth="2" />
            {/* Ban tay */}
            <circle cx="158" cy="128" r="12" fill="#e3e8f0" stroke="#8d97a8" strokeWidth="2" />
          </motion.g>

          {/* Co */}
          <rect x="98" y="98" width="24" height="20" rx="6" fill="#a9b3c4" />

          {/* Dau */}
          <rect x="62" y="30" width="96" height="76" rx="30" fill="url(#robotBody)" stroke="#8d97a8" strokeWidth="2" />
          {/* Anten */}
          <line x1="110" y1="14" x2="110" y2="30" stroke="#8d97a8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="110" cy="10" r="6" fill="#ff8a3d">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>

          {/* Kinh/visor mat */}
          <rect x="78" y="58" width="64" height="26" rx="13" fill="#161b22" />
          <rect x="86" y="65" width="20" height="10" rx="5" fill="url(#robotVisor)">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </rect>
          <rect x="114" y="65" width="20" height="10" rx="5" fill="url(#robotVisor)">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" begin="0.3s" />
          </rect>
        </svg>
      </motion.div>
    </motion.div>
  );
}

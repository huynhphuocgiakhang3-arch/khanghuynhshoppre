'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook dung chung de fetch du lieu va TU DONG fetch lai theo chu ky ngan,
 * giup cac trang cong khai (trang chu, san pham, thong bao...) phan anh
 * thay doi tu Admin trong vong vai giay, ma khong can nguoi dung phai F5
 * lai trang.
 *
 * Ky thuat: dung setInterval goi lai API, so sanh ket qua moi voi ket qua cu
 * (qua JSON.stringify) - chi setState (gay re-render) khi du lieu THAT SU
 * thay doi, tranh nhay/giat giao dien khi khong co gi moi.
 *
 * LUU Y QUAN TRONG: cac component dung hook nay (dac biet component nam
 * trong layout chung, hien dien tren MOI trang nhu AnnouncementBar/MusicPlayer)
 * se tao 1 request HTTP moi `intervalMs`. Khong dat interval qua thap (vd
 * duoi 2000ms) cho cac component toan cuc, neu khong se de bi rate-limit
 * chinh server cua chinh minh (xem RATE_LIMIT_MAX trong server/.env).
 *
 * @param {Function} fetchFn - ham async tra ve du lieu can lay (vd: () => api.get('/products'))
 * @param {Array} deps - dependency array, giong useEffect, dung khi tham so fetch thay doi
 * @param {number} intervalMs - chu ky fetch lai, mac dinh 3000ms (3 giay)
 */
export function useLiveData(fetchFn, deps = [], intervalMs = 3000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastDataRef = useRef(null);
  const intervalRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);

  const load = useCallback(
    async (isInitial = false) => {
      // Khong fetch khi tab dang an (nguoi dung chuyen sang tab khac), giam
      // tai khong can thiet len server va tranh gop phan gay rate-limit.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && !isInitial) {
        return;
      }

      try {
        const result = await fetchFn();
        const serialized = JSON.stringify(result);
        consecutiveErrorsRef.current = 0;

        // Chi cap nhat state khi du lieu thuc su khac, tranh re-render khong can thiet
        if (serialized !== lastDataRef.current) {
          lastDataRef.current = serialized;
          setData(result);
        }
        setError(null);
      } catch (err) {
        consecutiveErrorsRef.current += 1;
        setError(err);

        // Neu bi rate-limit (429) lien tuc, tam dung polling 30s de "ha nhiet"
        // cho server, tranh vong lap loi-thu lai-loi lam tinh hinh xau them.
        if (err?.response?.status === 429 && intervalRef.current) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            intervalRef.current = setInterval(() => load(false), intervalMs);
          }, 30000);
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    setIsLoading(true);
    lastDataRef.current = null;
    consecutiveErrorsRef.current = 0;
    load(true);

    intervalRef.current = setInterval(() => load(false), intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, refetch: () => load(false) };
}

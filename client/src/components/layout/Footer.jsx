'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiMail, FiMessageCircle } from 'react-icons/fi';
import api from '../../lib/api';

export default function Footer() {
  const [zaloUrl, setZaloUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('support@khanghuynh.shop');

  useEffect(() => {
    api
      .get('/config/public')
      .then(({ data }) => {
        if (data.data.shopInfo?.zaloUrl) setZaloUrl(data.data.shopInfo.zaloUrl);
        if (data.data.shopInfo?.contactEmail) setContactEmail(data.data.shopInfo.contactEmail);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-ink-700 bg-ink-950 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-display font-extrabold text-xl bg-ember-gradient bg-clip-text text-transparent">
              Khanghuynh.shop
            </span>
            <p className="mt-3 text-sm text-mist-400 leading-relaxed">
              Hệ thống cung cấp file, key proxy, menu, config chất lượng — tương thích mọi thiết bị, nhận hàng tức thì.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-mist-100 mb-3 uppercase tracking-wide">Liên kết</h4>
            <ul className="space-y-2 text-sm text-mist-400">
              <li><Link href="/products" className="hover:text-ember-400">Sản phẩm</Link></li>
              <li><Link href="/contact" className="hover:text-ember-400">Liên hệ</Link></li>
              <li><Link href="/wallet" className="hover:text-ember-400">Nạp tiền</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-mist-100 mb-3 uppercase tracking-wide">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-mist-400">
              <li className="flex items-center gap-2">
                <FiMail /> {contactEmail}
              </li>
              {zaloUrl && (
                <li>
                  <a
                    href={zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-ember-400"
                  >
                    <FiMessageCircle /> Liên hệ qua Zalo
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-700 text-center text-xs text-mist-500">
          © {new Date().getFullYear()} Khanghuynh.shop. Mọi giao dịch đều được mã hóa và bảo mật.
        </div>
      </div>
    </footer>
  );
}

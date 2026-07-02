'use client';

import { useState } from 'react';
import SignaturePreloader from '../components/layout/SignaturePreloader';
import Hero from '../components/home/Hero';
import FeaturedProducts from '../components/home/FeaturedProducts';

export default function HomePage() {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      {showPreloader && <SignaturePreloader onComplete={() => setShowPreloader(false)} />}
      <Hero />
      <FeaturedProducts />
    </>
  );
}

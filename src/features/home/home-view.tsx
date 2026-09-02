'use client';

/* ============================================================
   CircuitHub — HomeView orchestrator
   Composes in order:
     Hero → Categories → FeaturedProducts → TopSellers → Services → Trust
   ============================================================ */

import { Hero } from './hero';
import { CategoriesSection } from './categories-section';
import { FeaturedProducts } from './featured-products';
import { TopSellers } from './top-sellers';
import { ServicesSection } from './services-section';
import { TrustSection } from './trust-section';

export function HomeView() {
  return (
    <main className="flex flex-col">
      <Hero />
      <CategoriesSection />
      <FeaturedProducts />
      <TopSellers />
      <ServicesSection />
      <TrustSection />
    </main>
  );
}

export default HomeView;

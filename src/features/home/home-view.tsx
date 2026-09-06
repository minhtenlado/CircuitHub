'use client';

/* ============================================================
   CircuitHub — HomeView orchestrator
   Composes in order:
     Hero → Categories → FeaturedProducts → RecentlyViewed → TopSellers → Services → Trust
   ============================================================ */

import { Hero } from './hero';
import { FlashSaleSection } from './flash-sale-section';
import { CategoriesSection } from './categories-section';
import { HomeProductsGrid } from './home-products-grid';
import { BomServiceBanner } from './bom-service-banner';
import { FeaturedProducts } from './featured-products';
import { RecentlyViewedSection } from './recently-viewed-section';
import { TopSellers } from './top-sellers';
import { OpenSourceSection } from './open-source-section';
import { TrustSection } from './trust-section';

export function HomeView() {
  return (
    <main className="flex flex-col">
      <Hero />
      <FlashSaleSection />
      <CategoriesSection />
      <HomeProductsGrid />
      <BomServiceBanner />
      <FeaturedProducts />
      <RecentlyViewedSection />
      <TopSellers />
      <OpenSourceSection />
      <TrustSection />
    </main>
  );
}

export default HomeView;

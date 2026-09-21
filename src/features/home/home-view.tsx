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
import { FeaturedProducts } from './featured-products';
import { RecentlyViewedSection } from './recently-viewed-section';
import { MakerStory } from './maker-story';
import { TrustSection } from './trust-section';

export function HomeView() {
  return (
    <main className="flex flex-col">
      <Hero />
      <CategoriesSection />
      <HomeProductsGrid />
      <FlashSaleSection />
      <FeaturedProducts />
      <MakerStory />
      <TrustSection />
      <RecentlyViewedSection />
    </main>
  );
}

export default HomeView;

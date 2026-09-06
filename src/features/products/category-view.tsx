'use client';

/* ============================================================
   CircuitHub — CategoryView
   - Reads `slug` from useNavStore.params.slug
   - Resolves category metadata from useCategories()
   - Renders: Breadcrumb → Category header → ProductsView with
     the category filter pre-applied via the initialCategory prop.
   - Breadcrumb: Home / Categories [<Parent>] / <Name>
   ============================================================ */

import {
  Home,
  PackageSearch,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/lib/api/hooks';
import { useNavStore } from '@/stores/nav-store';
import { useI18n, getCategoryName } from '@/lib/i18n';
import { ProductsView } from './products-view';

/* ---------------- Top-level helpers (pure) ---------------- */

function resolveCategory(
  categories: any[] | undefined,
  slug: string | undefined,
): { name: string; parentName?: string } | null {
  if (!Array.isArray(categories) || !slug) return null;
  for (const c of categories) {
    if (c.slug === slug) {
      return {
        name: c.name,
      };
    }
    if (Array.isArray(c.children)) {
      for (const ch of c.children) {
        if (ch.slug === slug) {
          return {
            name: ch.name,
            parentName: c.name,
          };
        }
      }
    }
  }
  return null;
}

/* ============================================================
   CategoryView
   ============================================================ */
export function CategoryView() {
  const slug = useNavStore((s) => s.params.slug);
  const goHome = useNavStore((s) => s.goHome);
  const { data: categories } = useCategories();
  const { t } = useI18n();

  const resolved = resolveCategory(categories, slug);
  const rawName = resolved?.name ?? 'Category';
  const name = getCategoryName(slug, rawName, t);
  const isSubCategory = !!resolved?.parentName;
  const parentName = resolved?.parentName;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={goHome} className="hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1 text-muted-foreground transition-colors">
                  <Home className="h-3.5 w-3.5" />
                  {t('common.home')}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button onClick={goHome} className="hover:text-cyan-600 dark:hover:text-cyan-400 text-muted-foreground transition-colors">
                  {t('common.categories')}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {isSubCategory && parentName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button className="hover:text-cyan-600 dark:hover:text-cyan-400 text-muted-foreground transition-colors">{parentName}</button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-cyan-600 dark:text-cyan-400 font-semibold">{name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Products view with category pre-applied */}
      <ProductsView initialCategory={slug ?? undefined} />
    </main>
  );
}

/* ============================================================
   Fallback empty state
   ============================================================ */
export function CategoryNotFound({ slug }: { slug?: string }) {
  const goHome = useNavStore((s) => s.goHome);
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-cyan-50 text-cyan-500 border border-cyan-100">
          <PackageSearch className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Category not found</h1>
        <p className="text-sm text-muted-foreground">
          The category “{slug ?? 'unknown'}” doesn’t exist or has been removed.
        </p>
        <Button onClick={goHome} className="bg-cyan-500 hover:bg-cyan-600 text-white">
          Back to Home
        </Button>
      </div>
    </main>
  );
}

export default CategoryView;

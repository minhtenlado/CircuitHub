/**
 * Fix broken Unsplash image URLs in the database.
 * Some photo IDs return 404; replace them with working alternatives.
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Broken → working replacements (verified electronics/tech themed photos)
const REPLACEMENTS: Record<string, string> = {
  'photo-1581092160562-40aa08e78832': 'photo-1542831371-29b0f74f9713', // laptop code
  'photo-1518770660439-4636190af434': 'photo-1498050108023-c5249f4df085', // macbook code
  'photo-1451187580459-4348727d0d4d': 'photo-1551033406-611cf9a28f67', // tech desk
};

async function main() {
  console.log('🔧 Fixing broken image URLs...');

  // Fix ProductImage URLs
  for (const [broken, working] of Object.entries(REPLACEMENTS)) {
    const images = await prisma.productImage.findMany({
      where: { url: { contains: broken } },
    });
    for (const img of images) {
      const newUrl = img.url.replace(broken, working);
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
    }
    console.log(`  ProductImage: ${images.length} records updated (${broken} → ${working})`);
  }

  // Fix Shop bannerUrl
  for (const [broken, working] of Object.entries(REPLACEMENTS)) {
    const shops = await prisma.shop.findMany({
      where: { bannerUrl: { contains: broken } },
    });
    for (const shop of shops) {
      const newUrl = (shop.bannerUrl ?? '').replace(broken, working);
      await prisma.shop.update({
        where: { id: shop.id },
        data: { bannerUrl: newUrl },
      });
    }
    console.log(`  Shop.bannerUrl: ${shops.length} records updated (${broken} → ${working})`);
  }

  // Fix Product imageUrl (for OrderItems)
  for (const [broken, working] of Object.entries(REPLACEMENTS)) {
    const items = await prisma.orderItem.findMany({
      where: { imageUrl: { contains: broken } },
    });
    for (const item of items) {
      const newUrl = (item.imageUrl ?? '').replace(broken, working);
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { imageUrl: newUrl },
      });
    }
    console.log(`  OrderItem.imageUrl: ${items.length} records updated (${broken} → ${working})`);
  }

  console.log('✅ Image URL fix complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

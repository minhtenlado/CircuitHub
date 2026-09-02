/**
 * Seed script — populates CircuitHub with realistic demo data.
 * Run: `bun run db:seed`
 */
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ---------- helpers ----------
function hash(password: string) {
  return createHash('sha256').update(password).digest('hex'); // demo only
}

const VND = (n: number) => Math.round(n);

async function main() {
  console.log('🌱 Seeding CircuitHub...');

  // ---------- System settings ----------
  const settings = [
    { key: 'BRAND_NAME', value: 'CircuitHub', note: 'Centralized brand name' },
    { key: 'CURRENCY', value: 'VND' },
    { key: 'CURRENCY_SYMBOL', value: '₫' },
    { key: 'TIMEZONE', value: 'Asia/Ho_Chi_Minh' },
    { key: 'DEFAULT_COMMISSION_RATE', value: '0.05' },
    { key: 'SETTLEMENT_DAYS', value: '7' },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, create: s, update: { value: s.value } });
  }

  // ---------- Users ----------
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@circuithub.vn',
      passwordHash: hash('Demo@2025'),
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: 'admin@circuithub.vn',
      passwordHash: hash('Demo@2025'),
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@circuithub.vn',
      passwordHash: hash('Demo@2025'),
      name: 'Moderator',
      role: 'MODERATOR',
      emailVerified: true,
    },
  });
  const support = await prisma.user.create({
    data: {
      email: 'support@circuithub.vn',
      passwordHash: hash('Demo@2025'),
      name: 'Support Agent',
      role: 'SUPPORT',
      emailVerified: true,
    },
  });
  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@circuithub.vn',
      passwordHash: hash('Demo@2025'),
      name: 'Accountant',
      role: 'ACCOUNTANT',
      emailVerified: true,
    },
  });

  // Sellers
  const sellerA = await prisma.user.create({
    data: {
      email: 'seller@boardforge.vn',
      passwordHash: hash('Demo@2025'),
      name: 'BoardForge Studio',
      role: 'SELLER',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=boardforge&backgroundColor=06b6d4',
    },
  });
  const sellerB = await prisma.user.create({
    data: {
      email: 'seller@kicadcraft.vn',
      passwordHash: hash('Demo@2025'),
      name: 'KiCad Craft Lab',
      role: 'SELLER',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kicadcraft&backgroundColor=22d3ee',
    },
  });
  const sellerC = await prisma.user.create({
    data: {
      email: 'seller@embedpro.vn',
      passwordHash: hash('Demo@2025'),
      name: 'EmbedPro Solutions',
      role: 'SELLER',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=embedpro&backgroundColor=2dd4bf',
    },
  });

  // Buyers
  const buyers = await Promise.all(
    Array.from({ length: 12 }).map(async (_, i) => {
      return prisma.user.create({
        data: {
          email: `buyer${i + 1}@example.com`,
          passwordHash: hash('Demo@2025'),
          name: `Buyer ${i + 1}`,
          role: 'BUYER',
          emailVerified: true,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=buyer${i + 1}&backgroundColor=ecfeff`,
        },
      });
    }),
  );

  // ---------- Addresses ----------
  await prisma.address.create({
    data: {
      userId: buyers[0].id,
      fullName: buyers[0].name,
      phone: '0901234567',
      line1: '12 Nguyễn Huệ',
      city: 'Ho Chi Minh',
      district: 'District 1',
      ward: 'Ben Nghe',
      isDefault: true,
    },
  });

  // ---------- Shops ----------
  const shopA = await prisma.shop.create({
    data: {
      sellerId: sellerA.id,
      name: 'BoardForge Studio',
      slug: 'boardforge-studio',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=boardforge&backgroundColor=06b6d4',
      bannerUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80',
      description: 'PCB design & manufacturing studio specializing in ESP32 and STM32 development boards.',
      rating: 4.9,
      ratingCount: 234,
      followersCount: 1840,
      productCount: 28,
      completedOrders: 3120,
      responseRate: 0.97,
      responseTime: 25,
      verified: true,
      verifiedAt: new Date('2024-08-15'),
      specializations: 'PCB,Dev Boards,Embedded',
      badges: 'VERIFIED,PCB_SPECIALIST,HARDWARE_SPECIALIST',
    },
  });
  const shopB = await prisma.shop.create({
    data: {
      sellerId: sellerB.id,
      name: 'KiCad Craft Lab',
      slug: 'kicad-craft-lab',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=kicadcraft&backgroundColor=22d3ee',
      bannerUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
      description: 'Premium digital designs: KiCad projects, Altium templates, Gerber packages & firmware.',
      rating: 4.8,
      ratingCount: 412,
      followersCount: 2980,
      productCount: 41,
      completedOrders: 5840,
      responseRate: 0.99,
      responseTime: 12,
      verified: true,
      verifiedAt: new Date('2024-06-01'),
      specializations: 'Digital,KiCad,Altium,Gerber,Firmware',
      badges: 'VERIFIED,DIGITAL_DESIGN',
    },
  });
  const shopC = await prisma.shop.create({
    data: {
      sellerId: sellerC.id,
      name: 'EmbedPro Solutions',
      slug: 'embedpro-solutions',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=embedpro&backgroundColor=2dd4bf',
      bannerUrl: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=1200&q=80',
      description: 'Engineering services: custom PCB design, schematic review, firmware development.',
      rating: 4.95,
      ratingCount: 187,
      followersCount: 920,
      productCount: 18,
      completedOrders: 840,
      responseRate: 0.96,
      responseTime: 45,
      verified: true,
      verifiedAt: new Date('2024-09-10'),
      specializations: 'Services,Custom Electronics,Firmware',
      badges: 'VERIFIED,HARDWARE_SPECIALIST',
    },
  });

  // ---------- Categories ----------
  const catDev = await prisma.category.create({ data: { name: 'Development Boards', slug: 'dev-boards', order: 1, icon: 'CircuitBoard' } });
  const catPcb = await prisma.category.create({ data: { name: 'PCB Boards', slug: 'pcb-boards', order: 2, icon: 'Layers' } });
  const catComp = await prisma.category.create({ data: { name: 'Components', slug: 'components', order: 3, icon: 'Cpu' } });
  const catSensor = await prisma.category.create({ data: { name: 'Sensors', slug: 'sensors', order: 4, icon: 'Radar' } });
  const catModule = await prisma.category.create({ data: { name: 'Modules', slug: 'modules', order: 5, icon: 'Box' } });
  const catTool = await prisma.category.create({ data: { name: 'Tools', slug: 'tools', order: 6, icon: 'Wrench' } });
  const catKicad = await prisma.category.create({ data: { name: 'KiCad Projects', slug: 'kicad-projects', order: 7, icon: 'FileCode' } });
  const catAltium = await prisma.category.create({ data: { name: 'Altium Projects', slug: 'altium-projects', order: 8, icon: 'FileCode' } });
  const catGerber = await prisma.category.create({ data: { name: 'Gerber Packages', slug: 'gerber-packages', order: 9, icon: 'FileArchive' } });
  const catFirmware = await prisma.category.create({ data: { name: 'Firmware', slug: 'firmware', order: 10, icon: 'Binary' } });
  const catService = await prisma.category.create({ data: { name: 'Engineering Services', slug: 'services', order: 11, icon: 'Cog' } });

  // Sub-categories
  await prisma.category.create({ data: { name: 'ESP32', slug: 'esp32', parentId: catDev.id, order: 1, icon: 'Wifi' } });
  await prisma.category.create({ data: { name: 'STM32', slug: 'stm32', parentId: catDev.id, order: 2, icon: 'CircuitBoard' } });
  await prisma.category.create({ data: { name: 'Raspberry Pi', slug: 'raspberry-pi', parentId: catDev.id, order: 3, icon: 'CircuitBoard' } });
  await prisma.category.create({ data: { name: 'Arduino', slug: 'arduino', parentId: catDev.id, order: 4, icon: 'CircuitBoard' } });
  await prisma.category.create({ data: { name: 'Resistors', slug: 'resistors', parentId: catComp.id, order: 1, icon: 'Cpu' } });
  await prisma.category.create({ data: { name: 'Capacitors', slug: 'capacitors', parentId: catComp.id, order: 2, icon: 'Cpu' } });
  await prisma.category.create({ data: { name: 'ICs', slug: 'ics', parentId: catComp.id, order: 3, icon: 'Cpu' } });

  // ---------- Products ----------
  type ProductInput = {
    name: string; slug: string; productType: string; price: number;
    compareAt?: number; brand?: string; mpn?: string; sku?: string;
    shortDescription?: string; description?: string;
    image: string; images?: string[]; category: string;
    shop: string; seller: string;
    stock?: number; weight?: number;
    isFeatured?: boolean; isTrending?: boolean; isNew?: boolean;
    software?: string; softwareVersion?: string; currentVersion?: string;
    fileFormat?: string; fileSizeBytes?: number; licenseType?: string; compatibility?: string; changelog?: string;
    pcbLayers?: number; pcbThickness?: number; pcbMaterial?: string; pcbSurfaceFinish?: string;
    pcbCopperWeight?: string; pcbColor?: string; pcbDimensions?: string; pcbRevision?: string; pcbMoq?: number; pcbLeadTimeDays?: number;
    serviceScope?: string; serviceDeliverables?: string; serviceDurationDays?: number; serviceRevisions?: number;
    rating?: number; ratingCount?: number; soldCount?: number;
  };

  const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

  const products: ProductInput[] = [
    // === PHYSICAL: Dev boards ===
    {
      name: 'ESP32-WROOM-32 DevKit V1',
      slug: 'esp32-wroom-32-devkit-v1',
      productType: 'PHYSICAL',
      price: VND(89000), compareAt: VND(120000),
      brand: 'Espressif', mpn: 'ESP32-WROOM-32', sku: 'BF-ESP32-DK-V1',
      shortDescription: 'Dual-core WiFi + Bluetooth dev board, 4MB Flash, 38-pin',
      description: 'ESP32-WROOM-32 DevKit V1 — flagship Wi-Fi + BLE development board with dual-core Xtensa CPU @ 240MHz, 4MB Flash, 520KB SRAM. Ideal for IoT, robotics, and edge AI.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76'), img('photo-1542831371-29b0f74f9713'), img('photo-1498050108023-c5249f4df085')],
      category: catDev.id, shop: shopA.id, seller: sellerA.id,
      stock: 240, weight: 12,
      isFeatured: true, isTrending: true,
      rating: 4.8, ratingCount: 156, soldCount: 3200,
    },
    {
      name: 'STM32F103C8T6 Blue Pill',
      slug: 'stm32f103c8t6-blue-pill',
      productType: 'PHYSICAL',
      price: VND(55000), compareAt: VND(75000),
      brand: 'STMicroelectronics', mpn: 'STM32F103C8T6', sku: 'BF-STM32-BP',
      shortDescription: 'ARM Cortex-M3 72MHz, 64KB Flash, 20KB SRAM',
      description: 'STM32F103C8T6 Blue Pill — the iconic cheap STM32 dev board with ARM Cortex-M3 @ 72MHz, 64KB Flash, 20KB SRAM, USB, CAN, and rich peripheral set.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76'), img('photo-1542831371-29b0f74f9713')],
      category: catDev.id, shop: shopA.id, seller: sellerA.id,
      stock: 380, weight: 9,
      isTrending: true,
      rating: 4.7, ratingCount: 234, soldCount: 5800,
    },
    {
      name: 'Raspberry Pi 5 8GB',
      slug: 'raspberry-pi-5-8gb',
      productType: 'PHYSICAL',
      price: VND(2199000), compareAt: VND(2499000),
      brand: 'Raspberry Pi', mpn: 'RPI5-8GB', sku: 'BF-RPI5-8GB',
      shortDescription: 'Quad-core Cortex-A76 @ 2.4GHz, 8GB LPDDR4X-4267',
      description: 'Raspberry Pi 5 with 8GB RAM — the most powerful Pi yet, quad-core ARM Cortex-A76 @ 2.4GHz, 8GB LPDDR4X, dual 4Kp60 HDMI, PCIe 2.0, RP1 southbridge.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085'), img('photo-1553406830-ef2513450d76')],
      category: catDev.id, shop: shopA.id, seller: sellerA.id,
      stock: 42, weight: 47,
      isFeatured: true, isNew: true,
      rating: 4.9, ratingCount: 89, soldCount: 670,
    },
    {
      name: 'Arduino Nano ESP32',
      slug: 'arduino-nano-esp32',
      productType: 'PHYSICAL',
      price: VND(359000),
      brand: 'Arduino', mpn: 'ABX00092', sku: 'BF-ARD-NANO-ESP32',
      shortDescription: 'Nano form factor with ESP32-S3, Wi-Fi + BLE',
      description: 'Arduino Nano ESP32 — first Arduino based on ESP32-S3, combines the Nano form factor with Wi-Fi + BLE and Arduino IoT Cloud support.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713'), img('photo-1553406830-ef2513450d76')],
      category: catDev.id, shop: shopA.id, seller: sellerA.id,
      stock: 120, weight: 8,
      isNew: true,
      rating: 4.6, ratingCount: 42, soldCount: 240,
    },
    {
      name: 'ESP32-S3-DevKitC-1 N16R8',
      slug: 'esp32-s3-devkitc-1-n16r8',
      productType: 'PHYSICAL',
      price: VND(159000),
      brand: 'Espressif', mpn: 'ESP32-S3-DevKitC-1', sku: 'BF-ESP32-S3-N16R8',
      shortDescription: 'ESP32-S3 16MB Flash, 8MB PSRAM, dual USB',
      description: 'ESP32-S3-DevKitC-1 N16R8 — AI-accelerated MCU with vector instructions, 16MB Flash, 8MB octal PSRAM, native USB OTG.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catDev.id, shop: shopA.id, seller: sellerA.id,
      stock: 95, weight: 14,
      isTrending: true,
      rating: 4.8, ratingCount: 67, soldCount: 540,
    },
    // === PCB boards ===
    {
      name: 'ESP32 Custom PCB — 4 Layer',
      slug: 'esp32-custom-pcb-4-layer',
      productType: 'PHYSICAL',
      price: VND(450000), compareAt: VND(580000),
      brand: 'BoardForge', mpn: 'BF-PCB-ESP32-4L',
      sku: 'BF-PCB-ESP32-4L',
      shortDescription: '4-layer FR4, ENIG finish, blue solder mask',
      description: 'Premium 4-layer ESP32 custom PCB with ENIG surface finish, blue solder mask, white silkscreen. Stackup: Signal/GND/PWR/Signal, controlled impedance 50Ω.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713'), img('photo-1498050108023-c5249f4df085')],
      category: catPcb.id, shop: shopA.id, seller: sellerA.id,
      stock: 60, weight: 22,
      isFeatured: true,
      rating: 4.9, ratingCount: 38, soldCount: 120,
      pcbLayers: 4, pcbThickness: 1.6, pcbMaterial: 'FR4', pcbSurfaceFinish: 'ENIG',
      pcbCopperWeight: '1oz', pcbColor: 'Blue', pcbDimensions: '50x80mm', pcbRevision: 'Rev C',
      pcbMoq: 5, pcbLeadTimeDays: 7,
    },
    {
      name: 'STM32 Blue Pill Clone PCB',
      slug: 'stm32-blue-pill-clone-pcb',
      productType: 'PHYSICAL',
      price: VND(120000),
      brand: 'BoardForge', mpn: 'BF-PCB-STM32-BP',
      sku: 'BF-PCB-STM32-BP',
      shortDescription: '2-layer FR4, HASL, blue solder mask',
      description: 'STM32 Blue Pill clone PCB — 2-layer FR4, HASL finish, blue mask, white silkscreen. Compatible with STM32F103C8T6.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76'), img('photo-1542831371-29b0f74f9713')],
      category: catPcb.id, shop: shopA.id, seller: sellerA.id,
      stock: 180, weight: 8,
      rating: 4.6, ratingCount: 22, soldCount: 410,
      pcbLayers: 2, pcbThickness: 1.6, pcbMaterial: 'FR4', pcbSurfaceFinish: 'HASL',
      pcbCopperWeight: '1oz', pcbColor: 'Blue', pcbDimensions: '53x22mm', pcbRevision: 'Rev A',
      pcbMoq: 10, pcbLeadTimeDays: 5,
    },
    {
      name: 'Raspberry Pi Hat Carrier PCB',
      slug: 'rpi-hat-carrier-pcb',
      productType: 'PHYSICAL',
      price: VND(280000),
      brand: 'BoardForge', mpn: 'BF-PCB-RPI-HAT',
      sku: 'BF-PCB-RPI-HAT',
      shortDescription: '4-layer FR4, ENIG, 40-pin compatible',
      description: 'Raspberry Pi HAT-compatible carrier PCB — 4-layer with ENIG finish, follows HAT mechanical spec, includes EEPROM footprint.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085'), img('photo-1553406830-ef2513450d76')],
      category: catPcb.id, shop: shopA.id, seller: sellerA.id,
      stock: 45, weight: 35,
      isNew: true,
      rating: 4.8, ratingCount: 12, soldCount: 67,
      pcbLayers: 4, pcbThickness: 1.4, pcbMaterial: 'FR4', pcbSurfaceFinish: 'ENIG',
      pcbCopperWeight: '1oz', pcbColor: 'Black', pcbDimensions: '65x56mm', pcbRevision: 'Rev B',
      pcbMoq: 5, pcbLeadTimeDays: 10,
    },
    // === Components ===
    {
      name: '10KΩ Resistor 0603 1% (Pack of 100)',
      slug: '10k-0603-resistor-pack-100',
      productType: 'PHYSICAL',
      price: VND(25000),
      brand: 'Yageo', mpn: 'RC0603FR-0710KL', sku: 'BF-COMP-R10K-0603-100',
      shortDescription: '100 pcs 10K 1% 0.0625W 0603 SMD resistors',
      description: 'Pack of 100 Yageo 10KΩ 0603 1% SMD resistors — 0.0625W, ±100ppm/°C, AEC-Q200 qualified.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085')],
      category: catComp.id, shop: shopA.id, seller: sellerA.id,
      stock: 1200, weight: 25,
      rating: 4.7, ratingCount: 89, soldCount: 2100,
    },
    {
      name: '100µF 16V Electrolytic Capacitor (Pack of 50)',
      slug: '100uf-16v-cap-pack-50',
      productType: 'PHYSICAL',
      price: VND(42000),
      brand: 'Nichicon', mpn: 'UPW1C101MPD6', sku: 'BF-COMP-C100UF-50',
      shortDescription: '50 pcs 100µF 16V aluminum electrolytic caps',
      description: 'Pack of 50 Nichicon 100µF 16V electrolytic caps, low-ESR, 105°C, 8000h life.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76')],
      category: catComp.id, shop: shopA.id, seller: sellerA.id,
      stock: 800, weight: 120,
      rating: 4.8, ratingCount: 56, soldCount: 1450,
    },
    {
      name: 'AMS1117-3.3 LDO Regulator SOT-223 (Pack of 20)',
      slug: 'ams1117-33-ldo-sot223-20',
      productType: 'PHYSICAL',
      price: VND(38000),
      brand: 'AMS', mpn: 'AMS1117-3.3', sku: 'BF-COMP-AMS1117-33-20',
      shortDescription: '20 pcs 1A LDO 3.3V SOT-223 regulator',
      description: 'Pack of 20 AMS1117-3.3 LDO regulators, 1A output, 3.3V fixed, SOT-223 package.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catComp.id, shop: shopA.id, seller: sellerA.id,
      stock: 540, weight: 30,
      rating: 4.6, ratingCount: 34, soldCount: 890,
    },
    // === Sensors ===
    {
      name: 'BME280 Temperature/Humidity/Pressure Sensor',
      slug: 'bme280-temp-humidity-pressure-sensor',
      productType: 'PHYSICAL',
      price: VND(78000),
      brand: 'Bosch', mpn: 'BME280', sku: 'BF-SEN-BME280',
      shortDescription: 'I2C/SPI, ±1°C, ±3%RH, ±1hPa',
      description: 'Bosch BME280 breakout — temperature, humidity, pressure triple sensor with I2C/SPI, ±1°C accuracy, low power.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085'), img('photo-1553406830-ef2513450d76')],
      category: catSensor.id, shop: shopA.id, seller: sellerA.id,
      stock: 220, weight: 4,
      isTrending: true,
      rating: 4.9, ratingCount: 145, soldCount: 1980,
    },
    {
      name: 'MPU6050 6-Axis Gyro+Accelerometer',
      slug: 'mpu6050-6-axis-gyro-accel',
      productType: 'PHYSICAL',
      price: VND(45000),
      brand: 'InvenSense', mpn: 'MPU6050', sku: 'BF-SEN-MPU6050',
      shortDescription: 'I2C, 6DOF, ±2000°/s, ±16g',
      description: 'MPU6050 6-axis gyro + accelerometer breakout with I2C, DMP, 3.3V/5V compatible.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76')],
      category: catSensor.id, shop: shopA.id, seller: sellerA.id,
      stock: 320, weight: 5,
      rating: 4.7, ratingCount: 98, soldCount: 2450,
    },
    {
      name: 'VL53L0X Time-of-Flight Distance Sensor',
      slug: 'vl53l0x-tof-distance-sensor',
      productType: 'PHYSICAL',
      price: VND(95000),
      brand: 'STMicro', mpn: 'VL53L0X', sku: 'BF-SEN-VL53L0X',
      shortDescription: 'Laser ranging, 30-2000mm, I2C',
      description: 'VL53L0X ToF laser distance sensor breakout, 30mm to 2000mm range, I2C interface, ±3% accuracy.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catSensor.id, shop: shopA.id, seller: sellerA.id,
      stock: 140, weight: 3,
      isNew: true,
      rating: 4.8, ratingCount: 56, soldCount: 670,
    },
    // === Modules ===
    {
      name: 'Relay Module 4-Channel 5V',
      slug: 'relay-module-4ch-5v',
      productType: 'PHYSICAL',
      price: VND(68000),
      brand: 'Generic', mpn: 'REL-4CH-5V', sku: 'BF-MOD-RELAY-4CH',
      shortDescription: '4-channel 5V relay, opto-isolated, 10A 250VAC',
      description: '4-channel 5V relay module with opto-isolated inputs, 10A contacts, flyback diodes, supports 3.3V and 5V logic.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76')],
      category: catModule.id, shop: shopA.id, seller: sellerA.id,
      stock: 180, weight: 65,
      rating: 4.6, ratingCount: 78, soldCount: 1320,
    },
    {
      name: '0.96" OLED Display I2C SSD1306',
      slug: 'oled-096-ssd1306-i2c',
      productType: 'PHYSICAL',
      price: VND(52000),
      brand: 'Solomon', mpn: 'SSD1306', sku: 'BF-MOD-OLED-096',
      shortDescription: '128x64 monochrome OLED, I2C, 3.3V/5V',
      description: '0.96" 128x64 OLED display with SSD1306 driver, I2C interface, 3.3V/5V compatible, crisp visibility.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catModule.id, shop: shopA.id, seller: sellerA.id,
      stock: 260, weight: 8,
      isTrending: true,
      rating: 4.7, ratingCount: 167, soldCount: 3200,
    },
    // === Tools ===
    {
      name: 'T12 OLED Soldering Station',
      slug: 't12-oled-soldering-station',
      productType: 'PHYSICAL',
      price: VND(1290000), compareAt: VND(1590000),
      brand: 'Quicko', mpn: 'T12-OLED', sku: 'BF-TOOL-T12',
      shortDescription: 'T12 cartridge soldering iron, OLED display, 70W',
      description: 'T12 OLED soldering station with rapid heat-up (~5s), precise temp control, interchangeable cartridges.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085'), img('photo-1553406830-ef2513450d76')],
      category: catTool.id, shop: shopA.id, seller: sellerA.id,
      stock: 24, weight: 1200,
      isFeatured: true,
      rating: 4.9, ratingCount: 87, soldCount: 280,
    },
    // === DIGITAL: KiCad ===
    {
      name: 'ESP32 IoT Board — KiCad 9 Project',
      slug: 'esp32-iot-board-kicad-9',
      productType: 'DIGITAL',
      price: VND(350000), compareAt: VND(450000),
      brand: 'KiCad Craft', mpn: 'KC-ESP32-IOT',
      sku: 'KC-ESP32-IOT',
      shortDescription: 'Complete KiCad 9 project: schematic, PCB, gerbers, BOM, 3D model',
      description: 'Production-ready ESP32 IoT board KiCad 9 project. Includes schematic (10 sheets), 4-layer PCB layout, Gerber package, drill files, BOM (CSV), 3D STEP model, and assembly drawings.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085'), img('photo-1542831371-29b0f74f9713'), img('photo-1553406830-ef2513450d76')],
      category: catKicad.id, shop: shopB.id, seller: sellerB.id,
      unlimited: true,
      isFeatured: true, isTrending: true,
      software: 'KiCad', softwareVersion: 'KiCad 9', currentVersion: 'v2.1.0',
      fileFormat: '.kicad_pro,.kicad_pcb,.kicad_sch,.zip',
      fileSizeBytes: 28 * 1024 * 1024, licenseType: 'COMMERCIAL',
      compatibility: 'Windows,Linux,macOS', changelog: 'v2.1.0: Fixed USB routing, added USB-C.\nv2.0.0: 4-layer stackup, ENIG.\nv1.0.0: Initial release.',
      releaseDate: new Date('2025-09-15'),
      rating: 4.9, ratingCount: 124, soldCount: 890, downloadCount: 4500,
    },
    {
      name: 'STM32 Blue Pill Clone — KiCad 8 Project',
      slug: 'stm32-blue-pill-kicad-8',
      productType: 'DIGITAL',
      price: VND(180000),
      brand: 'KiCad Craft', mpn: 'KC-STM32-BP',
      sku: 'KC-STM32-BP',
      shortDescription: '2-layer KiCad 8 project of the iconic Blue Pill',
      description: 'KiCad 8 project of the STM32 Blue Pill clone — 2-layer FR4, complete schematic, PCB, gerbers, BOM, 3D model.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76'), img('photo-1542831371-29b0f74f9713')],
      category: catKicad.id, shop: shopB.id, seller: sellerB.id,
      unlimited: true,
      software: 'KiCad', softwareVersion: 'KiCad 8', currentVersion: 'v1.2.0',
      fileFormat: '.kicad_pro,.kicad_pcb,.kicad_sch,.zip',
      fileSizeBytes: 14 * 1024 * 1024, licenseType: 'PERSONAL',
      compatibility: 'Windows,Linux,macOS', changelog: 'v1.2.0: Improved silkscreen.\nv1.0.0: Initial release.',
      releaseDate: new Date('2025-03-10'),
      rating: 4.7, ratingCount: 67, soldCount: 340, downloadCount: 1200,
    },
    {
      name: 'Raspberry Pi HAT Template — KiCad 9',
      slug: 'rpi-hat-template-kicad-9',
      productType: 'DIGITAL',
      price: VND(220000),
      brand: 'KiCad Craft', mpn: 'KC-RPI-HAT',
      sku: 'KC-RPI-HAT',
      shortDescription: 'Reusable 4-layer Pi HAT template with EEPROM',
      description: 'KiCad 9 Raspberry Pi HAT template — follows HAT mechanical spec, includes EEPROM footprint and I2C ID pair.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catKicad.id, shop: shopB.id, seller: sellerB.id,
      unlimited: true,
      isNew: true,
      software: 'KiCad', softwareVersion: 'KiCad 9', currentVersion: 'v1.0.0',
      fileFormat: '.kicad_pro,.kicad_pcb,.kicad_sch,.zip',
      fileSizeBytes: 9 * 1024 * 1024, licenseType: 'COMMERCIAL',
      compatibility: 'Windows,Linux,macOS', changelog: 'v1.0.0: Initial release.',
      releaseDate: new Date('2025-10-01'),
      rating: 4.8, ratingCount: 18, soldCount: 75, downloadCount: 320,
    },
    // === DIGITAL: Altium ===
    {
      name: 'STM32 Flight Controller — Altium 24 Project',
      slug: 'stm32-flight-controller-altium-24',
      productType: 'DIGITAL',
      price: VND(850000), compareAt: VND(990000),
      brand: 'KiCad Craft', mpn: 'AL-FC-STM32',
      sku: 'AL-FC-STM32',
      shortDescription: '6-layer STM32 flight controller with IMU, baro, OSD',
      description: 'Altium 24 project of an STM32F4 flight controller — 6-layer HDI, integrated MPU6000, MS5611 baro, AT7456E OSD, USB-C.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085'), img('photo-1553406830-ef2513450d76')],
      category: catAltium.id, shop: shopB.id, seller: sellerB.id,
      unlimited: true,
      isFeatured: true,
      software: 'Altium', softwareVersion: 'Altium 24', currentVersion: 'v3.0.0',
      fileFormat: '.PrjPcb,.SchDoc,.PcbDoc,.zip',
      fileSizeBytes: 56 * 1024 * 1024, licenseType: 'EXTENDED_COMMERCIAL',
      compatibility: 'Windows', changelog: 'v3.0.0: Full redesign for STM32F4.\nv2.0.0: Added OSD.\nv1.0.0: Initial release.',
      releaseDate: new Date('2025-08-20'),
      rating: 4.9, ratingCount: 42, soldCount: 180, downloadCount: 670,
    },
    // === DIGITAL: Gerber ===
    {
      name: 'ESP32 Weather Station Gerber Package',
      slug: 'esp32-weather-station-gerber',
      productType: 'DIGITAL',
      price: VND(95000),
      brand: 'KiCad Craft', mpn: 'GB-ESP32-WEATHER',
      sku: 'GB-ESP32-WEATHER',
      shortDescription: 'Gerber + drill + BOM + pick-and-place',
      description: 'Production-ready Gerber package for ESP32 weather station — 2-layer, BME280, OLED, solar charging.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catGerber.id, shop: shopB.id, seller: sellerB.id,
      unlimited: true,
      isTrending: true,
      software: 'Gerber', softwareVersion: 'RS-274X', currentVersion: 'v1.0.0',
      fileFormat: '.gbr,.drl,.csv,.zip',
      fileSizeBytes: 3 * 1024 * 1024, licenseType: 'COMMERCIAL',
      compatibility: 'Universal', changelog: 'v1.0.0: Initial release.',
      releaseDate: new Date('2025-06-12'),
      rating: 4.7, ratingCount: 28, soldCount: 110, downloadCount: 480,
    },
    // === DIGITAL: Firmware ===
    {
      name: 'ESP32 FreeRTOS IoT Firmware Template',
      slug: 'esp32-freertos-iot-template',
      productType: 'DIGITAL',
      price: VND(280000),
      brand: 'KiCad Craft', mpn: 'FW-ESP32-IOT',
      sku: 'FW-ESP32-IOT',
      shortDescription: 'ESP-IDF v5.2 + FreeRTOS + MQTT + OTA',
      description: 'Production-grade ESP32 firmware template — ESP-IDF v5.2, FreeRTOS tasks, MQTT, secure OTA, WiFi provisioning, device shadow.',
      image: img('photo-1553406830-ef2513450d76'),
      images: [img('photo-1553406830-ef2513450d76'), img('photo-1498050108023-c5249f4df085')],
      category: catFirmware.id, shop: shopB.id, seller: sellerB.id,
      unlimited: true,
      isFeatured: true,
      software: 'ESP-IDF', softwareVersion: 'v5.2', currentVersion: 'v1.4.0',
      fileFormat: '.c,.h,.zip',
      fileSizeBytes: 8 * 1024 * 1024, licenseType: 'COMMERCIAL',
      compatibility: 'Windows,Linux,macOS', changelog: 'v1.4.0: OTA improvements.\nv1.0.0: Initial release.',
      releaseDate: new Date('2025-07-08'),
      rating: 4.8, ratingCount: 36, soldCount: 220, downloadCount: 890,
    },
    // === SERVICES ===
    {
      name: 'Custom PCB Design Service — 4 Layer',
      slug: 'custom-pcb-design-service-4-layer',
      productType: 'SERVICE',
      price: VND(2500000),
      brand: 'EmbedPro', mpn: 'SVC-PCB-4L',
      sku: 'SVC-PCB-4L',
      shortDescription: 'From schematic to Gerber — 4-layer custom PCB design',
      description: 'End-to-end custom PCB design service. You provide requirements, we deliver: schematic, 4-layer PCB layout, Gerbers, BOM, 3D model, and design review documentation.',
      image: img('photo-1551033406-611cf9a28f67'),
      images: [img('photo-1551033406-611cf9a28f67'), img('photo-1498050108023-c5249f4df085')],
      category: catService.id, shop: shopC.id, seller: sellerC.id,
      unlimited: true,
      isFeatured: true,
      serviceScope: 'Schematic capture, PCB layout, Gerber generation, BOM, design review.',
      serviceDeliverables: 'Schematic (PDF + source), PCB layout, Gerbers, drill files, BOM, 3D STEP, design review document.',
      serviceDurationDays: 14, serviceRevisions: 3,
      rating: 4.95, ratingCount: 48, soldCount: 95,
    },
    {
      name: 'PCB Design Review Service',
      slug: 'pcb-design-review-service',
      productType: 'SERVICE',
      price: VND(800000),
      brand: 'EmbedPro', mpn: 'SVC-PCB-REVIEW',
      sku: 'SVC-PCB-REVIEW',
      shortDescription: 'Professional review of your existing PCB design',
      description: 'Comprehensive PCB design review — signal integrity, power integrity, DFM, DFT, thermal, EMI/EMC. Get a detailed report with actionable recommendations.',
      image: img('photo-1498050108023-c5249f4df085'),
      images: [img('photo-1498050108023-c5249f4df085')],
      category: catService.id, shop: shopC.id, seller: sellerC.id,
      unlimited: true,
      serviceScope: 'Schematic + PCB review, SI/PI, DFM, thermal, EMI/EMC.',
      serviceDeliverables: 'Detailed review report (PDF), annotated screenshots, prioritized action list.',
      serviceDurationDays: 5, serviceRevisions: 1,
      rating: 4.9, ratingCount: 32, soldCount: 67,
    },
    {
      name: 'Embedded Firmware Development',
      slug: 'embedded-firmware-development',
      productType: 'SERVICE',
      price: VND(4500000),
      brand: 'EmbedPro', mpn: 'SVC-FW-DEV',
      sku: 'SVC-FW-DEV',
      shortDescription: 'Custom embedded firmware for ESP32/STM32',
      description: 'Custom embedded firmware development — bare-metal or RTOS-based. Includes driver development, communication stacks, OTA, and documentation.',
      image: img('photo-1551033406-611cf9a28f67'),
      images: [img('photo-1551033406-611cf9a28f67'), img('photo-1542831371-29b0f74f9713')],
      category: catService.id, shop: shopC.id, seller: sellerC.id,
      unlimited: true,
      isFeatured: true,
      serviceScope: 'Driver development, RTOS integration, communication, OTA, unit tests.',
      serviceDeliverables: 'Source code, build system, unit tests, API documentation, user guide.',
      serviceDurationDays: 30, serviceRevisions: 3,
      rating: 4.95, ratingCount: 21, soldCount: 38,
    },
    {
      name: 'Gerber Verification & DFM Check',
      slug: 'gerber-verification-dfm-check',
      productType: 'SERVICE',
      price: VND(350000),
      brand: 'EmbedPro', mpn: 'SVC-GERBER-DFM',
      sku: 'SVC-GERBER-DFM',
      shortDescription: 'Verify Gerbers for manufacturability',
      description: 'Quick DFM check on your Gerber files — trace width, spacing, drill, impedance, panelization. Get a pass/fail report and fix recommendations.',
      image: img('photo-1542831371-29b0f74f9713'),
      images: [img('photo-1542831371-29b0f74f9713')],
      category: catService.id, shop: shopC.id, seller: sellerC.id,
      unlimited: true,
      serviceScope: 'Gerber + drill + BOM check against fab capabilities.',
      serviceDeliverables: 'Pass/fail report, annotated layers, fix recommendations.',
      serviceDurationDays: 2, serviceRevisions: 1,
      rating: 4.8, ratingCount: 18, soldCount: 120,
    },
  ];

  for (const p of products) {
    const created = await prisma.product.create({
      data: {
        sellerId: p.seller,
        shopId: p.shop,
        categoryId: p.category,
        name: p.name,
        slug: p.slug,
        productType: p.productType,
        shortDescription: p.shortDescription,
        description: p.description,
        sku: p.sku,
        mpn: p.mpn,
        brand: p.brand,
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        status: 'ACTIVE',
        rating: p.rating ?? 0,
        ratingCount: p.ratingCount ?? 0,
        soldCount: p.soldCount ?? 0,
        viewCount: Math.floor((p.soldCount ?? 50) * 8),
        weight: p.weight,
        // PCB
        pcbLayers: p.pcbLayers,
        pcbThickness: p.pcbThickness,
        pcbMaterial: p.pcbMaterial,
        pcbSurfaceFinish: p.pcbSurfaceFinish,
        pcbCopperWeight: p.pcbCopperWeight,
        pcbColor: p.pcbColor,
        pcbDimensions: p.pcbDimensions,
        pcbRevision: p.pcbRevision,
        pcbMoq: p.pcbMoq,
        pcbLeadTimeDays: p.pcbLeadTimeDays,
        // Digital
        software: p.software,
        softwareVersion: p.softwareVersion,
        currentVersion: p.currentVersion,
        releaseDate: p.releaseDate,
        fileFormat: p.fileFormat,
        fileSizeBytes: p.fileSizeBytes,
        licenseType: p.licenseType,
        compatibility: p.compatibility,
        changelog: p.changelog,
        downloadCount: (p as any).downloadCount ?? 0,
        // Service
        serviceScope: p.serviceScope,
        serviceDeliverables: p.serviceDeliverables,
        serviceDurationDays: p.serviceDurationDays,
        serviceRevisions: p.serviceRevisions,
        // Inventory
        stockTotal: p.stock ?? 0,
        stockAvailable: p.stock ?? 0,
        unlimited: !p.stock,
        // Flags
        isFeatured: !!p.isFeatured,
        isTrending: !!p.isTrending,
        isNew: !!p.isNew,
      },
    });

    const imageList = p.images ?? [p.image];
    for (let i = 0; i < imageList.length; i++) {
      await prisma.productImage.create({
        data: { productId: created.id, url: imageList[i], order: i, alt: p.name },
      });
    }

    // Versions for digital products
    if (p.productType === 'DIGITAL' && p.currentVersion) {
      const versions = p.changelog?.split('\n').map((line) => line.trim()).filter(Boolean) ?? [];
      for (let i = 0; i < versions.length; i++) {
        const m = versions[i].match(/^v([0-9.]+):/);
        if (m) {
          await prisma.productVersion.create({
            data: {
              productId: created.id,
              version: `v${m[1]}`,
              changelog: versions[i].replace(`v${m[1]}: `, ''),
              fileSizeBytes: p.fileSizeBytes,
              downloadCount: Math.floor((p.soldCount ?? 100) * 4 / (i + 1)),
            },
          });
        }
      }
    }
  }

  // ---------- Vouchers ----------
  await prisma.voucher.create({
    data: {
      code: 'WELCOME10',
      name: 'Welcome 10% Off',
      description: '10% discount for new buyers (max 50,000 VND)',
      scope: 'PLATFORM',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrder: 100000,
      maxDiscount: 50000,
      totalUsageLimit: 1000,
      perUserLimit: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });
  await prisma.voucher.create({
    data: {
      code: 'PCB50K',
      name: 'PCB 50K Off',
      description: '50,000 VND off for PCB boards',
      scope: 'CATEGORY',
      discountType: 'FIXED_AMOUNT',
      discountValue: 50000,
      minOrder: 200000,
      perUserLimit: 1,
      startDate: new Date('2025-01-01'),
      categoryId: catPcb.id,
      status: 'ACTIVE',
    },
  });
  await prisma.voucher.create({
    data: {
      code: 'FORGE15',
      name: 'BoardForge 15% Off',
      description: '15% off all BoardForge products',
      scope: 'SELLER',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrder: 50000,
      maxDiscount: 100000,
      perUserLimit: 3,
      startDate: new Date('2025-01-01'),
      shopId: shopA.id,
      status: 'ACTIVE',
    },
  });

  // ---------- Wallets ----------
  await prisma.wallet.create({ data: { sellerId: sellerA.id, pendingBalance: VND(8450000), availableBalance: VND(23700000), totalEarned: VND(124800000), totalWithdrawn: VND(92650000) } });
  await prisma.wallet.create({ data: { sellerId: sellerB.id, pendingBalance: VND(12300000), availableBalance: VND(45600000), totalEarned: VND(245000000), totalWithdrawn: VND(187100000) } });
  await prisma.wallet.create({ data: { sellerId: sellerC.id, pendingBalance: VND(4200000), availableBalance: VND(18700000), totalEarned: VND(89000000), totalWithdrawn: VND(66100000) } });

  // ---------- Demo orders ----------
  let orderCounter = 100001;
  for (let i = 0; i < 8; i++) {
    const buyer = buyers[i % buyers.length];
    const product = products[i % products.length];
    if (!product) continue;
    const shop = product.shop;
    const seller = product.seller;
    const orderCode = `CH-${orderCounter++}`;
    const qty = (i % 3) + 1;
    const subtotal = product.price * qty;
    const shipping = product.productType === 'PHYSICAL' ? 30000 : 0;
    const grand = subtotal + shipping;
    const commissionRate = 0.05;
    const commission = Math.round(subtotal * commissionRate);
    const revenue = subtotal - commission;

    const order = await prisma.order.create({
      data: {
        code: orderCode,
        userId: buyer.id,
        status: i < 5 ? 'COMPLETED' : i < 7 ? 'SHIPPED' : 'PAID',
        subtotal,
        shippingTotal: shipping,
        grandTotal: grand,
        paymentMethod: 'MOCK',
        paymentStatus: 'SUCCESS',
        shippingAddress: JSON.stringify({ fullName: buyer.name, phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh' }),
      },
    });
    const sellerOrder = await prisma.sellerOrder.create({
      data: {
        orderId: order.id,
        sellerId: seller,
        shopId: shop,
        code: `${orderCode}-1`,
        status: i < 5 ? 'COMPLETED' : i < 7 ? 'SHIPPING' : 'CONFIRMED',
        subtotal,
        shippingTotal: shipping,
        commissionRate,
        commissionAmount: commission,
        sellerRevenue: revenue,
        fulfillmentType: product.productType === 'PHYSICAL' ? 'PHYSICAL' : product.productType === 'DIGITAL' ? 'DIGITAL' : 'SERVICE',
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        sellerOrderId: sellerOrder.id,
        productId: (await prisma.product.findFirst({ where: { slug: product.slug } }))!.id,
        name: product.name,
        sku: product.sku,
        productType: product.productType,
        unitPrice: product.price,
        quantity: qty,
        lineTotal: subtotal,
        imageUrl: product.image,
        fulfillmentType: product.productType === 'PHYSICAL' ? 'PHYSICAL' : product.productType === 'DIGITAL' ? 'DIGITAL' : 'SERVICE',
      },
    });
    await prisma.payment.create({
      data: { orderId: order.id, provider: 'MOCK', amount: grand, status: 'SUCCESS', transactionCode: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`, paidAt: new Date() },
    });
    if (product.productType === 'PHYSICAL') {
      await prisma.shipment.create({
        data: { orderId: order.id, sellerOrderId: sellerOrder.id, provider: 'GHN', service: 'Standard', trackingNumber: `GHN${randomUUID().slice(0, 10).toUpperCase()}`, status: i < 5 ? 'DELIVERED' : 'IN_TRANSIT', shippingFee: shipping, estimatedDays: 3 },
      });
    }
  }

  // ---------- Demo reviews ----------
  const reviewComments = [
    'Excellent product, exactly as described. Works perfectly with my setup.',
    'Fast shipping, great quality. Highly recommend this seller!',
    'Solid PCB, traces are clean. Documentation included is comprehensive.',
    'KiCad project opened without issues in v9. All sheets well-organized.',
    'Great service, the engineer delivered ahead of schedule with detailed report.',
    'Good value for money. Packaging could be improved but product is genuine.',
    'Responsive seller, answered all my questions within hours. Will buy again.',
    'Premium quality, feels like a real engineering marketplace, not a flea market.',
  ];
  for (let i = 0; i < 16; i++) {
    const product = products[i % products.length];
    const buyer = buyers[i % buyers.length];
    const p = await prisma.product.findFirst({ where: { slug: product.slug } });
    if (!p) continue;
    await prisma.review.create({
      data: {
        userId: buyer.id,
        productId: p.id,
        reviewType: 'PRODUCT',
        rating: 4 + (i % 2),
        comment: reviewComments[i % reviewComments.length],
        verifiedPurchase: true,
        moderationStatus: 'APPROVED',
      },
    });
  }

  // ---------- Notifications ----------
  for (const b of buyers.slice(0, 4)) {
    await prisma.notification.create({
      data: { userId: b.id, type: 'ORDER_SHIPPED', title: 'Your order has shipped', body: 'Order CH-100003 is on its way via GHN.', link: '#/orders' },
    });
    await prisma.notification.create({
      data: { userId: b.id, type: 'PROMOTION', title: '15% off BoardForge', body: 'Use code FORGE15 at checkout for 15% off all BoardForge products.', link: '#/products' },
    });
  }
  for (const s of [sellerA, sellerB, sellerC]) {
    await prisma.notification.create({
      data: { userId: s.id, type: 'NEW_ORDER', title: 'You have a new order', body: 'Order CH-100006 was just placed.', link: '#/seller/orders' },
    });
  }
  await prisma.notification.create({ data: { userId: admin.id, type: 'WITHDRAWAL_REQUEST', title: 'Withdrawal pending approval', body: 'BoardForge requested a 5,000,000 VND withdrawal.', link: '#/admin/withdrawals' } });
  await prisma.notification.create({ data: { userId: admin.id, type: 'NEW_SELLER', title: 'New seller application', body: 'A new seller applied — review required.', link: '#/admin/sellers' } });

  // ---------- Audit logs ----------
  await prisma.auditLog.create({ data: { userId: superAdmin.id, action: 'SYSTEM_INIT', entityType: 'system', entityId: null, newValue: 'Seeded demo data' } });
  await prisma.auditLog.create({ data: { userId: admin.id, action: 'SELLER_APPROVED', entityType: 'shop', entityId: shopA.id, oldValue: 'PENDING_REVIEW', newValue: 'ACTIVE' } });
  await prisma.auditLog.create({ data: { userId: admin.id, action: 'SELLER_APPROVED', entityType: 'shop', entityId: shopB.id, oldValue: 'PENDING_REVIEW', newValue: 'ACTIVE' } });

  // ---------- Demo withdrawals ----------
  await prisma.withdrawal.create({ data: { sellerId: sellerA.id, amount: VND(5000000), status: 'PENDING', bankInfo: JSON.stringify({ bank: 'Vietcombank', account: '0123456789', holder: 'BoardForge Studio' }) } });
  await prisma.withdrawal.create({ data: { sellerId: sellerB.id, amount: VND(3200000), status: 'COMPLETED', bankInfo: JSON.stringify({ bank: 'Techcombank', account: '9876543210', holder: 'KiCad Craft Lab' }), processedAt: new Date() } });

  console.log('✅ Seeded complete!');
  console.log('  - Users: 5 staff + 3 sellers + 12 buyers');
  console.log('  - Shops: 3');
  console.log('  - Categories: 11 + subcategories');
  console.log('  - Products: 20 (physical, digital, service)');
  console.log('  - Vouchers: 3');
  console.log('  - Orders: 8');
  console.log('  - Reviews: 16');
  console.log('  - Notifications + audit logs + withdrawals');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

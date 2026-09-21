/**
 * Centralized brand config — easily change brand without touching components.
 */
export const brand = {
  name: 'CircuitHub',
  tagline: 'Cửa hàng linh kiện & Dự án Maker cá nhân',
  description:
    'Chuyên cung cấp bo mạch phát triển IoT, ESP32, STM32, module cảm biến, mạch nguồn và kit DIY được kiểm tra, nạp test 100% trước khi giao. Hỗ trợ kỹ thuật 1-1 tận tình.',
  currency: 'VND',
  currencySymbol: '₫',
  timezone: 'Asia/Ho_Chi_Minh',
  email: 'hotro@circuithub.io.vn',
  phone: '0987.654.321',
  zalo: 'https://zalo.me',
  address: 'TP. Hồ Chí Minh, Việt Nam',
  socials: {
    github: 'https://github.com/minhtenlado/CircuitHub',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com',
  },
};

export const navLinks = [
  { label: 'Trang chủ', view: 'home', icon: 'LayoutGrid' },
  { label: 'Sản phẩm', view: 'products', icon: 'Package' },
  { label: 'Bo MCU & IoT', view: 'category', params: { slug: 'dev-boards' }, icon: 'Layers' },
  { label: 'Cảm biến', view: 'category', params: { slug: 'sensors' }, icon: 'Radar' },
  { label: 'Module chức năng', view: 'category', params: { slug: 'modules' }, icon: 'Box' },
] as const;

export const footerLinks = {
  'Sản phẩm & Danh mục': [
    { label: 'Tất cả sản phẩm', view: 'products' },
    { label: 'Bo phát triển MCU', view: 'category', params: { slug: 'dev-boards' } },
    { label: 'Module & Cảm biến', view: 'category', params: { slug: 'sensors' } },
    { label: 'Mạch in PCB & KiCad', view: 'category', params: { slug: 'pcb-boards' } },
    { label: 'Module chức năng & Nguồn', view: 'category', params: { slug: 'modules' } },
  ],
  'Hỗ trợ khách hàng': [
    { label: 'Về chủ shop & Cam kết', view: 'home' },
    { label: 'Hướng dẫn mua hàng', view: 'products' },
    { label: 'Tư vấn kỹ thuật Zalo', view: 'home' },
    { label: 'Đơn hàng của tôi', view: 'buyer-orders' },
  ],
  'Chính sách bán hàng': [
    { label: 'Bảo hành & Đổi trả 7 ngày', view: 'terms' },
    { label: 'Giao hàng COD toàn quốc', view: 'terms' },
    { label: 'Chính sách bảo mật', view: 'privacy' },
    { label: 'Cam kết chất lượng', view: 'terms' },
  ],
} as const;

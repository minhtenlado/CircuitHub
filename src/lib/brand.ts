/**
 * Centralized brand config — easily change brand without touching components.
 */
export const brand = {
  name: 'CircuitHub',
  tagline: 'Build it. Design it. Ship it.',
  description:
    'The modern engineering marketplace for hardware creators. Buy & sell PCB boards, KiCad/Altium projects, Gerber packages, electronic components, and engineering services.',
  currency: 'VND',
  currencySymbol: '₫',
  timezone: 'Asia/Ho_Chi_Minh',
  email: 'hello@circuithub.vn',
  phone: '+84 28 7300 1234',
  address: 'Saigon Hi-Tech Park, District 9, Ho Chi Minh City, Vietnam',
  socials: {
    github: 'https://github.com/circuithub',
    twitter: 'https://twitter.com/circuithub',
    linkedin: 'https://linkedin.com/company/circuithub',
    youtube: 'https://youtube.com/@circuithub',
  },
};

export const navLinks = [
  { label: 'Marketplace', view: 'home', icon: 'LayoutGrid' },
  { label: 'Products', view: 'products', icon: 'Package' },
  { label: 'PCB Boards', view: 'category', params: { slug: 'pcb-boards' }, icon: 'Layers' },
  { label: 'KiCad Projects', view: 'category', params: { slug: 'kicad-projects' }, icon: 'FileCode' },
  { label: 'Services', view: 'category', params: { slug: 'services' }, icon: 'Cog' },
] as const;

export const footerLinks = {
  Marketplace: [
    { label: 'Browse Products', view: 'products' },
    { label: 'Dev Boards', view: 'category', params: { slug: 'dev-boards' } },
    { label: 'PCB Boards', view: 'category', params: { slug: 'pcb-boards' } },
    { label: 'Components', view: 'category', params: { slug: 'components' } },
    { label: 'Services', view: 'category', params: { slug: 'services' } },
  ],
  'For Sellers': [
    { label: 'Become a Seller', view: 'seller-onboarding' },
    { label: 'Seller Center', view: 'seller' },
    { label: 'Pricing & Commission', view: 'seller-pricing' },
    { label: 'Seller Guide', view: 'seller-guide' },
  ],
  Company: [
    { label: 'About Us', view: 'about' },
    { label: 'Engineering Blog', view: 'blog' },
    { label: 'Careers', view: 'careers' },
    { label: 'Contact', view: 'contact' },
  ],
  Legal: [
    { label: 'Terms of Service', view: 'terms' },
    { label: 'Privacy Policy', view: 'privacy' },
    { label: 'License Terms', view: 'license-terms' },
    { label: 'Refund Policy', view: 'refund-policy' },
  ],
} as const;

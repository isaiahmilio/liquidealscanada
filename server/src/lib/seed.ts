import { prisma } from './db.js';
import { hashPassword } from '../services/auth.js';

const DEMO_LISTINGS = [
  {
    title: 'Apple AirPods (2nd gen)',
    description: 'Open-box, like new. Original packaging included.',
    category: 'Electronics',
    photoPath: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80',
    retailPriceCents: 19999, suggestedPriceCents: 11999, listedPriceCents: 9999, costCents: 5000,
    identifiedProduct: 'Apple AirPods (2nd gen)',
    priceSources: [
      { retailer: 'amazon.ca',  priceCents: 19999, url: 'https://www.amazon.ca' },
      { retailer: 'bestbuy.ca', priceCents: 21999, url: 'https://www.bestbuy.ca' },
    ],
  },
  {
    title: 'Instant Pot Duo 6qt',
    description: 'Lightly used, full accessory set.',
    category: 'Kitchen',
    photoPath: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
    retailPriceCents: 13999, suggestedPriceCents: 8399, listedPriceCents: 6999, costCents: 3000,
    identifiedProduct: 'Instant Pot Duo 6qt',
    priceSources: [
      { retailer: 'walmart.ca',      priceCents: 13999, url: 'https://www.walmart.ca' },
      { retailer: 'canadiantire.ca', priceCents: 14999, url: 'https://www.canadiantire.ca' },
    ],
  },
  {
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Used twice, pristine condition with all accessories.',
    category: 'Electronics',
    photoPath: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80',
    retailPriceCents: 44999, suggestedPriceCents: 29999, listedPriceCents: 26999, costCents: 15000,
    identifiedProduct: 'Sony WH-1000XM5',
    priceSources: [
      { retailer: 'amazon.ca',    priceCents: 44999, url: 'https://www.amazon.ca' },
      { retailer: 'bestbuy.ca',   priceCents: 42999, url: 'https://www.bestbuy.ca' },
    ],
  },
  {
    title: 'Nintendo Switch OLED',
    description: 'White edition, barely used. Includes dock, HDMI, and Joy-Con straps.',
    category: 'Gaming',
    photoPath: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80',
    retailPriceCents: 44999, suggestedPriceCents: 34999, listedPriceCents: 32999, costCents: 20000,
    identifiedProduct: 'Nintendo Switch OLED',
    priceSources: [
      { retailer: 'walmart.ca',  priceCents: 44999, url: 'https://www.walmart.ca' },
      { retailer: 'bestbuy.ca',  priceCents: 44999, url: 'https://www.bestbuy.ca' },
    ],
  },
  {
    title: 'KitchenAid Artisan Stand Mixer 5qt',
    description: 'Empire Red, light use. Includes flat beater, dough hook, and wire whip.',
    category: 'Kitchen',
    photoPath: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=600&q=80',
    retailPriceCents: 59999, suggestedPriceCents: 39999, listedPriceCents: 37999, costCents: 22000,
    identifiedProduct: 'KitchenAid KSM150PS',
    priceSources: [
      { retailer: 'canadiantire.ca', priceCents: 59999, url: 'https://www.canadiantire.ca' },
      { retailer: 'amazon.ca',       priceCents: 57999, url: 'https://www.amazon.ca' },
    ],
  },
  {
    title: 'Dyson V8 Cordless Vacuum',
    description: '40-min runtime. All heads and wall mount included.',
    category: 'Home',
    photoPath: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80',
    retailPriceCents: 64999, suggestedPriceCents: 44999, listedPriceCents: 42999, costCents: 28000,
    identifiedProduct: 'Dyson V8 Absolute',
    priceSources: [
      { retailer: 'dyson.ca',  priceCents: 64999, url: 'https://www.dyson.ca' },
      { retailer: 'amazon.ca', priceCents: 62999, url: 'https://www.amazon.ca' },
    ],
  },
  {
    title: 'Lululemon Align High-Rise Leggings 28"',
    description: 'Black, size 6. Worn once. Buttery-soft nulu fabric.',
    category: 'Clothing',
    photoPath: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
    retailPriceCents: 14800, suggestedPriceCents: 9999, listedPriceCents: 8999, costCents: 4500,
    identifiedProduct: 'Lululemon Align HR 28"',
    priceSources: [
      { retailer: 'lululemon.ca', priceCents: 14800, url: 'https://www.lululemon.ca' },
    ],
  },
];

export async function runSeed() {
  try {
    const email = 'demo@liquidealscanada.test';
    let seller = await prisma.user.findUnique({ where: { email } });
    if (!seller) {
      seller = await prisma.user.create({
        data: { email, passwordHash: await hashPassword('demopass123'), role: 'BOTH' },
      });
      console.log('[seed] created demo user');
    }

    let created = 0;
    for (const item of DEMO_LISTINGS) {
      const exists = await prisma.listing.findFirst({ where: { sellerId: seller.id, title: item.title } });
      if (exists) continue;
      await prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: item.title, description: item.description, category: item.category,
          photoPath: item.photoPath, retailPriceCents: item.retailPriceCents,
          suggestedPriceCents: item.suggestedPriceCents, listedPriceCents: item.listedPriceCents,
          costCents: item.costCents, identifiedProduct: item.identifiedProduct,
          status: 'LIVE',
          priceSources: { create: item.priceSources },
        },
      });
      created++;
    }
    if (created > 0) console.log(`[seed] created ${created} demo listing(s)`);
  } catch (err) {
    console.error('[seed] failed:', err);
  }
}

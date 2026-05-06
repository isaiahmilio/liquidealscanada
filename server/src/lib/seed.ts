import { prisma } from './db.js';
import { hashPassword } from '../services/auth.js';

const DEMO_LISTINGS = [
  {
    title: 'Sony 65" 4K OLED Smart TV',
    description: 'Open box — pulled from retail floor. All cables and remote included. Minor scuff on back panel, screen is perfect. Pick up only.',
    category: 'Electronics',
    photoPath: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80',
    retailPriceCents: 199999, suggestedPriceCents: 119999, listedPriceCents: 109999, costCents: 70000,
    identifiedProduct: 'Sony BRAVIA XR 65" OLED',
    condition: 'Like New — 9/10',
    quantity: 1,
    priceSources: [
      { retailer: 'bestbuy.ca',  priceCents: 199999, url: 'https://www.bestbuy.ca' },
      { retailer: 'amazon.ca',   priceCents: 209999, url: 'https://www.amazon.ca' },
    ],
  },
  {
    title: 'Apple AirPods Pro (2nd Gen)',
    description: 'Sealed in original box. Bought extras, never opened. MagSafe charging case included.',
    category: 'Electronics',
    photoPath: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80',
    retailPriceCents: 32999, suggestedPriceCents: 19999, listedPriceCents: 18999, costCents: 11000,
    identifiedProduct: 'Apple AirPods Pro 2nd Gen',
    condition: 'Brand New',
    quantity: 3,
    priceSources: [
      { retailer: 'apple.com/ca',  priceCents: 32999, url: 'https://www.apple.com/ca' },
      { retailer: 'bestbuy.ca',    priceCents: 32999, url: 'https://www.bestbuy.ca' },
    ],
  },
  {
    title: 'DeWalt 20V MAX Drill & Impact Driver Combo Kit',
    description: 'Liquidation lot — 6 units available. Brand new in box, sealed. Never used. DCK240C2 model.',
    category: 'Tools',
    photoPath: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
    retailPriceCents: 24999, suggestedPriceCents: 14999, listedPriceCents: 13999, costCents: 8000,
    identifiedProduct: 'DeWalt DCK240C2 Combo Kit',
    condition: 'Brand New',
    quantity: 6,
    priceSources: [
      { retailer: 'homedepot.ca',     priceCents: 24999, url: 'https://www.homedepot.ca' },
      { retailer: 'canadiantire.ca',  priceCents: 26999, url: 'https://www.canadiantire.ca' },
    ],
  },
  {
    title: 'Nintendo Switch OLED — White',
    description: 'Lightly used, great shape. Comes with dock, HDMI cable, Joy-Con grips and straps. No games included.',
    category: 'Gaming',
    photoPath: 'https://images.unsplash.com/photo-1643576988450-68b8e565be5a?w=600&q=80',
    retailPriceCents: 44999, suggestedPriceCents: 32999, listedPriceCents: 29999, costCents: 18000,
    identifiedProduct: 'Nintendo Switch OLED White',
    condition: 'Like New — 9/10',
    quantity: 2,
    priceSources: [
      { retailer: 'walmart.ca',  priceCents: 44999, url: 'https://www.walmart.ca' },
      { retailer: 'bestbuy.ca',  priceCents: 44999, url: 'https://www.bestbuy.ca' },
    ],
  },
  {
    title: 'Instant Pot Duo 7-in-1 6qt',
    description: 'Used twice, still in original box with all accessories. Moving sale — needs to go.',
    category: 'Kitchen',
    photoPath: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
    retailPriceCents: 13999, suggestedPriceCents: 7999, listedPriceCents: 6499, costCents: 3000,
    identifiedProduct: 'Instant Pot Duo 6qt',
    condition: 'Like New — 9/10',
    quantity: 1,
    priceSources: [
      { retailer: 'walmart.ca',       priceCents: 13999, url: 'https://www.walmart.ca' },
      { retailer: 'canadiantire.ca',  priceCents: 14999, url: 'https://www.canadiantire.ca' },
    ],
  },
  {
    title: 'Dyson V8 Cordless Vacuum',
    description: 'Ex-display unit from store. All attachments included, wall mount bracket included. Works perfectly.',
    category: 'Home',
    photoPath: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80',
    retailPriceCents: 64999, suggestedPriceCents: 43999, listedPriceCents: 39999, costCents: 28000,
    identifiedProduct: 'Dyson V8 Absolute',
    condition: 'Like New — 8/10',
    quantity: 1,
    priceSources: [
      { retailer: 'dyson.ca',   priceCents: 64999, url: 'https://www.dyson.ca' },
      { retailer: 'amazon.ca',  priceCents: 62999, url: 'https://www.amazon.ca' },
    ],
  },
  {
    title: 'Lululemon Align High-Rise Leggings 28"',
    description: 'Bought wrong size, never worn. Black, size 6. Tags still attached. Authentic.',
    category: 'Clothing',
    photoPath: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
    retailPriceCents: 14800, suggestedPriceCents: 9999, listedPriceCents: 8500, costCents: 4500,
    identifiedProduct: 'Lululemon Align HR 28"',
    condition: 'Brand New',
    quantity: 1,
    priceSources: [
      { retailer: 'lululemon.ca', priceCents: 14800, url: 'https://www.lululemon.ca' },
    ],
  },
  {
    title: 'KitchenAid Artisan Stand Mixer 5qt — Empire Red',
    description: 'Store return in original box. Used once for a demo. Includes flat beater, dough hook, and wire whip. Box has shelf wear.',
    category: 'Kitchen',
    photoPath: 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=600&q=80',
    retailPriceCents: 59999, suggestedPriceCents: 37999, listedPriceCents: 34999, costCents: 22000,
    identifiedProduct: 'KitchenAid KSM150PS',
    condition: 'Like New — 9/10',
    quantity: 2,
    priceSources: [
      { retailer: 'canadiantire.ca',  priceCents: 59999, url: 'https://www.canadiantire.ca' },
      { retailer: 'amazon.ca',        priceCents: 57999, url: 'https://www.amazon.ca' },
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
      console.log('[seed] created demo seller user');
    }

    const buyerEmail = 'buyer@liquidealscanada.test';
    const buyerExists = await prisma.user.findUnique({ where: { email: buyerEmail } });
    if (!buyerExists) {
      await prisma.user.create({
        data: { email: buyerEmail, passwordHash: await hashPassword('buyerpass123'), role: 'BUYER' },
      });
      console.log('[seed] created demo buyer user');
    }

    let created = 0;
    let updated = 0;
    for (const item of DEMO_LISTINGS) {
      const exists = await prisma.listing.findFirst({ where: { sellerId: seller.id, title: item.title } });
      if (exists) {
        // Always refresh photo, description, condition, quantity in case we updated them.
        await prisma.listing.update({
          where: { id: exists.id },
          data: {
            photoPath:   item.photoPath,
            description: item.description,
            condition:   item.condition,
            quantity:    item.quantity,
          },
        });
        updated++;
        continue;
      }
      await prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: item.title, description: item.description, category: item.category,
          photoPath: item.photoPath, retailPriceCents: item.retailPriceCents,
          suggestedPriceCents: item.suggestedPriceCents, listedPriceCents: item.listedPriceCents,
          costCents: item.costCents, identifiedProduct: item.identifiedProduct,
          condition: item.condition, quantity: item.quantity,
          status: 'LIVE',
          priceSources: { create: item.priceSources },
        },
      });
      created++;
    }
    if (created > 0) console.log(`[seed] created ${created} demo listing(s)`);
    if (updated > 0) console.log(`[seed] refreshed ${updated} demo listing(s)`);
  } catch (err) {
    console.error('[seed] failed:', err);
  }
}

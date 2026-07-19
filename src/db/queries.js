import prisma from './prisma.js';

/**
 * Inserts a new URL mapping into the database.
 */
export async function insertMapping(shortCode, longUrl, expiryDate = null) {
  return prisma.urlMapping.create({
    data: {
      short_code: shortCode,
      long_url: longUrl,
      expiry_date: expiryDate,
    },
  });
}

export async function findByShortCode(shortCode) {
  return prisma.urlMapping.findUnique({
    where: {
      short_code: shortCode,
    },
  });
}

/**
 * Atomically increments the click counter for a short code.
 */
export async function incrementClicks(shortCode) {
  try {
    return await prisma.urlMapping.update({
      where: {
        short_code: shortCode,
      },
      data: {
        click_count: {
          increment: 1,
        },
      },
      select: {
        click_count: true,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return null;
    }
    throw error;
  }
}

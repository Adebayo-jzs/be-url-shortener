import prisma from './src/db/prisma.js';

async function main() {
  try {
    console.log('Testing Prisma database connection...');
    
    // 1. Create a mock url mapping
    // const shortCode = `test_${Math.random().toString(36).substring(7)}`;
    const newMapping = await prisma.urlMapping.create({
      data: {
        short_code: 'test-1',
        long_url: 'https://example.com/test-prisma',
      },
    });
    console.log('\n✅ Successfully created mapping:');
    console.log(newMapping);
    
    // 2. Read the mapping
    const found = await prisma.urlMapping.findUnique({
      where: { short_code: 'test-1' },
    });
    console.log('\n✅ Successfully read mapping:');
    console.log(found);
    
    // 3. Update clicks
    const updated = await prisma.urlMapping.update({
      where: { short_code: 'test-1' },
      data: { click_count: { increment: 1 } },
    });
    console.log('\n✅ Successfully incremented clicks. New count:', updated.click_count);
    
    // 4. Clean up (delete the mapping)
    await prisma.urlMapping.delete({
      where: { short_code: 'test-1' }
    });
    console.log('\n✅ Successfully cleaned up test mapping.');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

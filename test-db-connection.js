const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test user table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible. Total users: ${userCount}`);
    
    // Test session table
    const sessionCount = await prisma.userSession.count();
    console.log(`✅ UserSession table accessible. Total sessions: ${sessionCount}`);
    
    // Test activity table
    const activityCount = await prisma.userActivity.count();
    console.log(`✅ UserActivity table accessible. Total activities: ${activityCount}`);
    
    // Test creating a test user (if none exists)
    if (userCount === 0) {
      console.log('Creating test user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      const testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          role: 'user'
        }
      });
      console.log(`✅ Test user created with ID: ${testUser.id}`);
    }
    
    console.log('✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
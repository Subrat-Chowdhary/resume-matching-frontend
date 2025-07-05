const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('Users found:', users);
    
    if (users.length === 0) {
      console.log('No users found. Creating a test user...');
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
      console.log('Test user created:', {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      });
      console.log('You can now login with:');
      console.log('Email: test@example.com');
      console.log('Password: test123');
    } else {
      console.log('Existing users found. You can try logging in with their credentials.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActivities() {
  try {
    console.log('Checking activities in database...');
    
    const activities = await prisma.userActivity.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`Found ${activities.length} recent activities:`);
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.activityType} - ${activity.description} (${activity.user.name}) - ${activity.timestamp}`);
    });
    
    const sessions = await prisma.userSession.findMany({
      orderBy: { loginTime: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`\nFound ${sessions.length} recent sessions:`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.user.name} - ${session.sessionId} - Active: ${session.isActive} - ${session.loginTime}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivities();
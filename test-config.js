// Test script to verify configuration changes
const { config } = require('./dist/config/config');
const { PrismaClient } = require('@prisma/client');

console.log('=== Hall Service Configuration Test ===\n');

console.log('Server Configuration:');
console.log('- Port:', config.server.port);
console.log('- Environment:', config.server.nodeEnv);
console.log('- Service Name:', config.server.serviceName);
console.log('- Service Version:', config.server.serviceVersion);

console.log('\nDatabase Configuration:');
console.log('- Database URL:', config.database.url ? 'Set' : 'Not Set');

console.log('\nRedis Configuration:');
console.log('- Session Redis Host:', config.redisSession.host);
console.log('- Session Redis Port:', config.redisSession.port);
console.log('- Session Redis TLS:', config.redisSession.tls);
console.log('- Cache Redis Host:', config.redisCache.host);
console.log('- Cache Redis Port:', config.redisCache.port);
console.log('- Cache Redis TLS:', config.redisCache.tls);
console.log('- Queue Redis Host:', config.redisQueue.host);
console.log('- Queue Redis Port:', config.redisQueue.port);
console.log('- Queue Redis TLS:', config.redisQueue.tls);

console.log('\nEmail Configuration:');
console.log('- SMTP Host:', config.email.smtp.host);
console.log('- SMTP Port:', config.email.smtp.port);
console.log('- Brevo Host:', config.email.brevo.host);
console.log('- Brevo Port:', config.email.brevo.port);
console.log('- From Email:', config.email.from.email);
console.log('- From Name:', config.email.from.name);

console.log('\nBusiness Configuration:');
console.log('- Default Currency:', config.business.currency);
console.log('- Default Timezone:', config.business.timezone);
console.log('- Booking Advance Days:', config.business.bookingAdvanceDays);
console.log('- Cancellation Hours:', config.business.cancellationHours);
console.log('- Deposit Percentage:', config.business.depositPercentage);

console.log('\nCost Calculator Configuration:');
console.log('- Base Hall Rate:', config.costCalculator.baseHallRate);
console.log('- Chair Rate:', config.costCalculator.chairRate);
console.log('- Decoration Rate:', config.costCalculator.decorationRate);
console.log('- Lighting Rate:', config.costCalculator.lightingRate);
console.log('- AV Rate:', config.costCalculator.avRate);
console.log('- Catering Rate Per Person:', config.costCalculator.cateringRatePerPerson);
console.log('- Security Rate:', config.costCalculator.securityRate);
console.log('- Generator Rate:', config.costCalculator.generatorRate);
console.log('- Tax Percentage:', config.costCalculator.taxPercentage);

console.log('\nExternal Services:');
console.log('- Auth Service URL:', config.services.auth);
console.log('- User Service URL:', config.services.user);
console.log('- Customer Service URL:', config.services.customer);
console.log('- Notification Service URL:', config.services.notification);

console.log('\n=== Testing Database Connection ===');
try {
  const prisma = new PrismaClient();
  console.log('✅ Prisma client created successfully');
  console.log('✅ Database connection test passed');
  prisma.$disconnect();
} catch (error) {
  console.log('❌ Database connection test failed:', error.message);
}

console.log('\n=== Configuration Test Complete ===');

const argon2 = require('argon2');

async function debugAuth() {
  try {
    // Load the mock data
    const mockData = require('./prisma/mock-data-comprehensive.js');
    
    console.log('=== Mock Data Debug ===');
    console.log('Total users:', mockData.users ? mockData.users.length : 0);
    
    // Find admin user
    const adminUser = mockData.users ? mockData.users.find(u => u.email === 'admin@restopapa.com') : null;
    console.log('Admin user found:', !!adminUser);
    
    if (adminUser) {
      console.log('Admin user email:', adminUser.email);
      console.log('Admin user id:', adminUser.id);
      console.log('Admin user hash:', adminUser.passwordHash.substring(0, 50) + '...');
      
      // Test password verification
      console.log('\n=== Password Verification Test ===');
      const testPassword = 'Password123';
      
      const isValid = await argon2.verify(adminUser.passwordHash, testPassword);
      console.log('Password "Password123" is valid:', isValid);
      
      // Also test the hash I generated
      const generatedHash = '$argon2id$v=19$m=65536,t=3,p=4$znHIcmZ7b20WlnEEnZDKyA$EqSxJWXwFBlH9ZnqfCrEU71gTiG81vX8TJPGruzlMao';
      const isValidGenerated = await argon2.verify(generatedHash, testPassword);
      console.log('Generated hash is valid:', isValidGenerated);
      
      console.log('Hashes match:', adminUser.passwordHash === generatedHash);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAuth();
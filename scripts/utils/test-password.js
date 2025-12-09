// Quick password hash test and generator
const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'password123';
  const existingHash = '$2a$10$rGqOG.xSRKF3xvT0.qC1QODq7L5m/BuL3LY1xE1qZ5zV6Y.bT5KIi';
  
  console.log('=== Password Hash Test ===\n');
  console.log('Testing password:', password);
  console.log('Against hash:', existingHash);
  console.log('');
  
  // Test existing hash
  const isValid = await bcrypt.compare(password, existingHash);
  console.log('Result:', isValid ? '✓ VALID' : '✗ INVALID');
  console.log('');
  
  // Generate new hash
  console.log('Generating fresh hash for "password123"...');
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash:', newHash);
  console.log('');
  
  // Verify new hash
  const newIsValid = await bcrypt.compare(password, newHash);
  console.log('New hash verification:', newIsValid ? '✓ VALID' : '✗ INVALID');
  console.log('');
  
  if (!isValid) {
    console.log('⚠️  The existing hash is INVALID!');
    console.log('📝 Replace the password hash in MOCK_USERS with:');
    console.log(newHash);
  }
}

testPassword().catch(console.error);

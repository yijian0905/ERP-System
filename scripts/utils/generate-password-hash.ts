import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'password123';
  const saltRounds = 10;
  
  console.log('Generating bcrypt hash for password:', password);
  console.log('Salt rounds:', saltRounds);
  console.log('');
  
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('Generated hash:');
  console.log(hash);
  console.log('');
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification test:', isValid ? '✓ PASSED' : '✗ FAILED');
  console.log('');
  
  console.log('Copy this hash to MOCK_USERS in apps/api/src/routes/auth.ts');
}

generateHash().catch(console.error);

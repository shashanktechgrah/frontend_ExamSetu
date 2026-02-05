// Quick Test Runner for Login Functionality
// Run this to test your login system

import { runLoginTests, testUsers } from './login-tests.js'

console.log('🚀 Starting Login System Tests...\n');

// Run the tests
runLoginTests().then(() => {
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure your backend server is running on port 5000');
  console.log('2. Make sure your frontend is running on port 5173');
  console.log('3. Test manually in browser using these credentials:');
  console.log(`   - Admin: ${testUsers.admin.email} / ${testUsers.admin.password}`);
  console.log(`   - Teacher: ${testUsers.teacher.email} / ${testUsers.teacher.password}`);
  console.log(`   - Student: ${testUsers.student.email} / ${testUsers.student.password}`);
  console.log('\n4. Check that role-based navigation works correctly');
  console.log('   - Admin/Teacher -> /admin-dashboard');
  console.log('   - Student -> /dashboard');
  console.log('5. Verify localStorage is set after successful login');
}).catch(error => {
  console.error('❌ Test runner failed:', error);
});

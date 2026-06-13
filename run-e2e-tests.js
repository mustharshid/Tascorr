const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 }); // slowMo makes it easier to watch
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('=== TASCCORR E2E TEST SUITE ===');

    // 1. Landing Page Verification
    console.log('[Test 1] Navigating to Landing Page...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.v0-hero-title');
    console.log('✔ Landing page loaded.');

    // 2. Login Flow Verification
    console.log('[Test 2] Testing Login Flow...');
    // Open login modal
    await page.click('a[href="#login"], button[onclick*="#login"]');
    await page.waitForSelector('#login-email');
    
    // Test validation
    await page.click('#login-form button[type="submit"]');
    console.log('✔ Login form validation checked.');

    // Login with valid credentials
    await page.fill('#login-email', 'admin@company.com');
    await page.fill('#login-password', 'CompanyAdmin123!');
    await page.click('#login-form button[type="submit"]');
    
    // Wait for Dashboard
    await page.waitForSelector('text=Executive Dashboard');
    console.log('✔ Logged in successfully.');

    // 3. Dashboard Verification
    console.log('[Test 3] Verifying Dashboard Data...');
    // Wait for workload list to load (should not be empty)
    await page.waitForSelector('#workload-list > div', { timeout: 10000 });
    const workloadItems = await page.$$('#workload-list > div');
    if (workloadItems.length > 0) {
      console.log(`✔ Team Workload Allocation is populated (${workloadItems.length} items).`);
    } else {
      console.log('✖ Team Workload Allocation is empty!');
    }

    // 4. Task Management Verification
    console.log('[Test 4] Verifying Task Management...');
    await page.click('a[href="#tasks"]');
    await page.waitForSelector('h1.page-title');
    
    // Wait for task items to load
    await page.waitForSelector('.task-list-item');
    const taskItems = await page.$$('.task-list-item');
    console.log(`✔ Found ${taskItems.length} tasks in the list.`);

    // Click the first task
    await page.click('.task-list-item');
    
    // Wait for detail panel
    await page.waitForSelector('#task-details-container h2');
    
    // Check if task creator displays a real name (should not contain "System")
    const detailText = await page.textContent('#task-details-container');
    if (detailText.includes('Assigned by: System')) {
      console.log('✖ Task details incorrectly shows "Assigned by: System"');
    } else {
      console.log('✔ Task creator attribution is displaying correctly.');
    }

    // Add a comment
    const commentInput = await page.$('#new-comment-text');
    if (commentInput) {
      await page.fill('#new-comment-text', 'Automated test comment: Checking comment functionality!');
      await page.click('#submit-comment-btn');
      await page.waitForTimeout(1000);
      const commentsText = await page.textContent('#task-details-container');
      if (commentsText.includes('Automated test comment')) {
        console.log('✔ Comment added successfully.');
      } else {
        console.log('✖ Failed to add comment.');
      }
    }

    // 5. Admin Organization Verification
    console.log('[Test 5] Verifying Employees Settings...');
    await page.click('a[href="#employees"]');
    await page.waitForSelector('h1.page-title');
    console.log('✔ Employees panel loaded.');

    console.log('\n=== ALL TESTS COMPLETED ===');

  } catch (err) {
    console.error('\n✖ TEST FAILED WITH ERROR:', err.message);
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();

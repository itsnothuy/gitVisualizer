import { test } from '@playwright/test'

test('Take screenshots of theme toggle', async ({ page }) => {
  // Navigate to home page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  
  // Screenshot 1: Default theme home page
  await page.screenshot({ path: '/tmp/screenshots/01-default-theme-home.png', fullPage: true })
  console.log('✓ Screenshot 1: Default theme home page')
  
  // Screenshot 2: Toggle button OFF
  const toggle = page.getByTestId('theme-toggle')
  await toggle.waitFor({ state: 'visible' })
  await toggle.screenshot({ path: '/tmp/screenshots/02-toggle-off.png' })
  console.log('✓ Screenshot 2: Toggle button (OFF)')
  
  // Click to enable LGB theme
  await toggle.click()
  await page.waitForTimeout(500)
  
  // Screenshot 3: LGB theme home page
  await page.screenshot({ path: '/tmp/screenshots/03-lgb-theme-home.png', fullPage: true })
  console.log('✓ Screenshot 3: LGB theme home page')
  
  // Screenshot 4: Toggle button ON
  await toggle.screenshot({ path: '/tmp/screenshots/04-toggle-on.png' })
  console.log('✓ Screenshot 4: Toggle button (ON)')
  
  // Navigate to demo page
  await page.goto('http://localhost:3000/demo', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  
  // Screenshot 5: LGB theme demo with graph
  await page.screenshot({ path: '/tmp/screenshots/05-lgb-theme-demo.png', fullPage: true })
  console.log('✓ Screenshot 5: LGB theme demo page')
  
  // Toggle back to default
  await toggle.click()
  await page.waitForTimeout(500)
  
  // Screenshot 6: Default theme demo
  await page.screenshot({ path: '/tmp/screenshots/06-default-theme-demo.png', fullPage: true })
  console.log('✓ Screenshot 6: Default theme demo page')
})

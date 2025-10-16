import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('home has no critical a11y violations', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  const results = await new AxeBuilder({ page }).analyze()
  const critical = results.violations.filter(v => v.impact === 'critical')
  expect(critical).toHaveLength(0)
})

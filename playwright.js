const { chromium } = require('playwright');
const fs = require('fs');
const csv = require('csv-parser');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Open a new page
  const page = await context.newPage();

  // Load the website
  await page.goto('https://www.saucedemo.com/');

  // Login to the webapp
  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('#login-button');

  // Read test data from CSV
  const testData = [];
  fs.createReadStream('testData.csv')
    .pipe(csv())
    .on('data', (data) => testData.push(data))
    .on('end', async () => {
      for (const item of testData) {
        const itemName = item['items'];
        // Check if item is present on landing page
        const isItemPresent = await page.$(`//div[contains(text(), '${itemName}')]`);
        if (!isItemPresent) {
          throw new Error(`${itemName} is not present on landing page`);
        }
        // Add item to cart
        await page.click(`//div[contains(text(), '${itemName}')]/ancestor::div[@class='inventory_item']//button`);
      }
      
      // Go to cart
      await page.click('.shopping_cart_link');

      // Remove "Sauce Labs Bike Light" from item list
      await page.click(`//div[contains(text(), 'Sauce Labs Bike Light')]/ancestor::div[@class='cart_item']//button`);

      // Click "Checkout"
      await page.click('#checkout');

      // Provide First Name, Last Name, Zip Code
      await page.fill('#first-name', 'John');
      await page.fill('#last-name', 'Doe');
      await page.fill('#postal-code', '12345');

      // Click "Continue"
      await page.click('#continue');

      // Remove "Sauce Labs Bolt T-Shirt" in checkout
      await page.click(`//div[contains(text(), 'Sauce Labs Bolt T-Shirt')]/ancestor::div[@class='cart_item']//button`);

      // Click on the cart
      await page.click('.shopping_cart_link');

      // Click "Checkout"
      await page.click('#checkout');

      // Provide First Name, Last Name, Zip Code again
      await page.fill('#first-name', 'John');
      await page.fill('#last-name', 'Doe');
      await page.fill('#postal-code', '12345');

      // On Checkout: Overview screen
      const totalPrice = await page.textContent('.summary_total_label');
      if (parseFloat(totalPrice.substring(13)) < 40.00) {
        await page.click('#finish');
      } else {
        await page.click('#cancel');
      }

      // Verify Thank you message
      const thankYouMessage = await page.textContent('.complete-header');
      if (thankYouMessage !== 'THANK YOU FOR YOUR ORDER') {
        throw new Error('Thank you message not displayed');
      }

      // Click "Back Home"
      await page.click('.bm-burger-button');
      await page.click('#logout_sidebar_link');

      // Close the browser
      await browser.close();
    });
})();

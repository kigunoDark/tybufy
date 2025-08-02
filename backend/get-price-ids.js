// Создайте файл get-price-ids.js в папке backend:

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function getPriceIds() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY не найден в .env файле!');
      return;
    }

    const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
    
    const prices = await stripe.prices.list({
      limit: 100,
      expand: ['data.product']
    });

    if (prices.data.length === 0) {
      console.log(`❌ Цены не найдены в ${isTestMode ? 'тестовом' : 'реальном'} режиме.`);
      return;
    }

    // Автоматический поиск по цене
    const price999 = prices.data.find(p => p.unit_amount === 999);
    const price2499 = prices.data.find(p => p.unit_amount === 2499);
    const price7999 = prices.data.find(p => p.unit_amount === 7999);
    
    if (isTestMode) {
      console.log(`
// ✅ ТЕСТОВЫЕ Price IDs (вставьте в server.js):
const testPriceIds = {
  'price_creator': '${price999?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$9.99'}',
  'price_pro': '${price2499?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$24.99'}',
  'price_agency': '${price7999?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$79.99'}',
};`);
    } else {
      console.log(`
// ✅ РЕАЛЬНЫЕ Price IDs (вставьте в server.js):
const realPriceIds = {
  'price_creator': '${price999?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$9.99'}',
  'price_pro': '${price2499?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$24.99'}',
  'price_agency': '${price7999?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$79.99'}',
};`);
    }

    // Проверка недостающих продуктов
    const missing = [];
    if (!price999) missing.push('$9.99/месяц (Creator)');
    if (!price2499) missing.push('$24.99/месяц (Pro)');
    if (!price7999) missing.push('$79.99/месяц (Agency)');

    if (missing.length > 0) {
      missing.forEach(item => console.log(`❌ ${item}`));
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

getPriceIds();
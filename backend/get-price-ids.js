// Создайте файл get-price-ids.js в папке backend:

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_LIVE_SECRET);

async function getPriceIds() {
  try {
    if (!process.env.STRIPE_LIVE_SECRET) {
      console.error('❌ STRIPE_LIVE_SECRET не найден в .env файле!');
      return;
    }

    const isTestMode = process.env.STRIPE_LIVE_SECRET.startsWith('sk_test_');
    
    const prices = await stripe.prices.list({
      limit: 100,
      expand: ['data.product']
    });

    if (prices.data.length === 0) {
      console.log(`❌ Цены не найдены в ${isTestMode ? 'тестовом' : 'реальном'} режиме.`);
      return;
    }

    console.log(`\n🔍 Найдено ${prices.data.length} цен в ${isTestMode ? 'тестовом' : 'реальном'} режиме Stripe:\n`);

    // Поиск по нужным ценам (в центах)
    const priceBoost = prices.data.find(p => p.unit_amount === 1658); // $16.58
    const pricePro = prices.data.find(p => p.unit_amount === 9900);   // $99.00
    
    // Показать все найденные цены для справки
    prices.data.forEach(price => {
      const amount = (price.unit_amount / 100).toFixed(2);
      const product = price.product?.name || 'Без названия';
      console.log(`- ${product}: $${amount}/${price.recurring?.interval} (ID: ${price.id})`);
    });

    console.log('\n' + '='.repeat(60));
    
    if (isTestMode) {
      console.log(`
// ✅ ТЕСТОВЫЕ Price IDs (вставьте в ваш код):
const testPriceIds = {
  'boost': '${priceBoost?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$16.58'}',
  'pro': '${pricePro?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$99.00'}',
};

// Для фронтенда используйте:
onClick={() => handleUpgrade('${priceBoost?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$16.58'}', 'boost')}
onClick={() => handleUpgrade('${pricePro?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$99.00'}', 'pro')}`);
    } else {
      console.log(`
// ✅ РЕАЛЬНЫЕ Price IDs (вставьте в ваш код):
const livePriceIds = {
  'boost': '${priceBoost?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$16.58'}',
  'pro': '${pricePro?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$99.00'}',
};

// Для фронтенда используйте:
onClick={() => handleUpgrade('${priceBoost?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$16.58'}', 'boost')}
onClick={() => handleUpgrade('${pricePro?.id || 'СОЗДАЙТЕ_ПРОДУКТ_$99.00'}', 'pro')}`);
    }

    // Проверка недостающих продуктов
    const missing = [];
    if (!priceBoost) missing.push('Boost Plan - $16.58/месяц');
    if (!pricePro) missing.push('Pro Plan - $99.00/месяц');

    if (missing.length > 0) {
      console.log('\n❌ Необходимо создать в Stripe Dashboard:');
      missing.forEach(item => console.log(`   - ${item}`));
      console.log('\nИнструкция:');
      console.log('1. Войдите в Stripe Dashboard');
      console.log('2. Products → Create product');
      console.log('3. Создайте продукты с точными ценами: $16.58 и $99.00');
      console.log('4. Запустите скрипт снова');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Проверьте:');
      console.log('- Правильность STRIPE_LIVE_SECRET в .env файле');
      console.log('- Соответствие режима (test/live) в Stripe Dashboard');
    }
  }
}

getPriceIds();
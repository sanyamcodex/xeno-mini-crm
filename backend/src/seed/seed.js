require('dotenv').config();

const { v4: uuidv4 } = require('uuid');
const { initDB, query, pool } = require('../db');

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Kabir', 'Arjun', 'Rohan', 'Ishaan', 'Dev', 'Reyansh', 'Karan',
  'Ananya', 'Diya', 'Isha', 'Meera', 'Aisha', 'Kiara', 'Saanvi', 'Naina', 'Riya', 'Tara'
];

const lastNames = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Mehta', 'Kapoor', 'Reddy', 'Patel', 'Bose', 'Malhotra',
  'Chopra', 'Rao', 'Singh', 'Gupta', 'Menon', 'Das', 'Joshi', 'Kulkarni', 'Agarwal', 'Bhat'
];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad'];
const items = [
  'Blue Denim Jacket',
  'Floral Kurta Set',
  'White Sneakers',
  'Cotton Palazzo',
  'Leather Tote Bag',
  'Linen Co-ord Set',
  'Printed Saree',
  'Oversized Shirt',
  'Silk Scarf',
  'Relaxed Fit Jeans'
];
const orderChannels = ['online', 'offline'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function randomFrom(values) {
  return values[randomInt(0, values.length - 1)];
}

function shopperBand(index) {
  if (index < 30) {
    return randomInt(1, 15);
  }

  if (index < 70) {
    return randomInt(20, 60);
  }

  return randomInt(90, 180);
}

async function clearTables() {
  await query('DELETE FROM communications');
  await query('DELETE FROM campaigns');
  await query('DELETE FROM orders');
  await query('DELETE FROM customers');
}

async function seed() {
  try {
    await initDB();
    await clearTables();

    for (let index = 0; index < 100; index += 1) {
      const id = uuidv4();
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index + 1}@styleaura.example`;
      const phone = `+91${randomInt(7000000000, 9999999999)}`;
      const city = randomFrom(cities);
      const lastPurchaseDaysAgo = shopperBand(index);
      const lastPurchaseDate = daysAgo(lastPurchaseDaysAgo);

      await query(
        `
          INSERT INTO customers (
            id, name, email, phone, city, last_purchase_date
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [id, name, email, phone, city, lastPurchaseDate]
      );

      const orderCount = randomInt(1, 8);

      for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
        const purchasedAt =
          orderIndex === 0
            ? lastPurchaseDate
            : daysAgo(randomInt(lastPurchaseDaysAgo + 1, 240));

        await query(
          `
            INSERT INTO orders (
              id, customer_id, amount, items, channel, purchased_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            uuidv4(),
            id,
            randomInt(499, 8999),
            randomFrom(items),
            randomFrom(orderChannels),
            purchasedAt
          ]
        );
      }
    }

    await query(`
      UPDATE customers
      SET
        total_orders = order_totals.total_orders,
        total_spent = order_totals.total_spent
      FROM (
        SELECT customer_id, COUNT(*)::int AS total_orders, COALESCE(SUM(amount), 0) AS total_spent
        FROM orders
        GROUP BY customer_id
      ) AS order_totals
      WHERE customers.id = order_totals.customer_id
    `);

    console.log('Seeded 100 StyleAura customers with orders.');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');

describe('Order Routes', () => {
  let server;
  let token;
  let user;
  let product;

  beforeAll(async () => {
    // Use in-memory MongoDB in a real-world scenario.
    // Here we rely on the configured MongoDB URI for basic integration testing.
    server = app.listen(0);

    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    token = user.generateToken();

    product = new Product({
      name: 'Test Product',
      description: 'Test description',
      price: 1000,
      category: 'dress',
      subcategory: 'test',
      images: [{ url: '/images/test.jpg' }],
      stock: 10,
      seller: user._id
    });
    await product.save();

    // Seed cart for user
    user.cart.items = [{
      product: product._id,
      quantity: 1
    }];
    user.cart.total = 1000;
    user.addresses.push({
      type: 'home',
      street: '123 Street',
      city: 'City',
      state: 'State',
      zipCode: '123456',
      country: 'India',
      isDefault: true
    });
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  it('should create an order from cart', async () => {
    const addressId = user.addresses[0]._id.toString();

    const res = await request(server)
      .post('/api/orders/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        addressId,
        paymentMethod: 'cod'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('orderId');
    expect(res.body.data).toHaveProperty('orderNumber');
  });
});


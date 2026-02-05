const dotenv = require('dotenv');

// Ensure env vars are loaded when this module is imported directly
dotenv.config();

// Lazy-load SDKs so the app can start even if they aren't installed yet.
let Razorpay = null;
let Stripe = null;

try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  Razorpay = require('razorpay');
} catch (e) {
  Razorpay = null;
}

try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  Stripe = require('stripe');
} catch (e) {
  Stripe = null;
}

const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  CARD: 'card',
  UPI: 'upi',
  COD: 'cod',
  WALLET: 'wallet',
  STRIPE: 'stripe'
};

function getRazorpayInstance() {
  if (!Razorpay) {
    return null;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

function getStripeInstance() {
  if (!Stripe) {
    return null;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  // Safe default; project owner can adjust API version if needed
  return new Stripe(secretKey, {
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16'
  });
}

module.exports = {
  PAYMENT_METHODS,
  getRazorpayInstance,
  getStripeInstance
};


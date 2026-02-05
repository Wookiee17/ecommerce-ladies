# Evara - Complete E-Commerce Platform

A full-stack e-commerce platform for ladies' fashion (dresses, beauty electronics, jewelry) built with React, Node.js, and MongoDB.

## 📦 Source Code Archives

| File | Description | Size |
|------|-------------|------|
| `evara-frontend-source.tar.gz` | React frontend source code | ~280 KB |
| `evara-backend-source.tar.gz` | Node.js backend source code | ~35 KB |
| `evara-mobile-apps.tar.gz` | Android & iOS app source | ~8.5 MB |
| `evara-complete-new.tar.gz` | Complete project (frontend + backend) | ~7.8 MB |

---

## ✨ Features Implemented

### 1. **Payment System** (Razorpay Integration)
- ✅ UPI Payments
- ✅ Credit/Debit Cards
- ✅ Net Banking
- ✅ Cash on Delivery (COD)
- ✅ Wallet Payments
- ✅ Payment verification & webhooks
- ✅ Refund processing
- **Cost**: 2% transaction fee (cheapest in India)

### 2. **Review & Sharing System**
- ✅ Write product reviews with ratings
- ✅ Share review links via WhatsApp, Email, SMS
- ✅ Mark reviews as helpful
- ✅ Report inappropriate reviews
- ✅ Admin moderation panel
- ✅ Review analytics & distribution

### 3. **Email & Notification System**
- ✅ Order confirmations
- ✅ Shipping notifications
- ✅ Payment receipts
- ✅ Review request emails
- ✅ Admin/Seller alerts
- ✅ Push notifications (FCM ready)

### 4. **Free Deployment Options** (AWS Alternatives)
- ✅ **Vercel** (Frontend) + **Railway** (Backend) = ₹0/month
- ✅ **Render** (Full-stack) = ₹0/month
- ✅ **Firebase** (Google) = ₹0/month
- See `evara-complete/docs/FREE_DEPLOYMENT_GUIDE.md` for details

### 5. **Clothing Subcategories** (10 Categories)
- Casual Dresses
- Formal Dresses
- Party Wear
- Wedding Collection
- Summer Dresses
- Winter Collection
- Ethnic Wear
- Office Wear
- Evening Gowns
- Maxi Dresses

### 6. **Enhanced Signup & Guest Browsing**
- ✅ Name, Email, Mobile, Password
- ✅ Complete Address (Address, City, State, Pincode)
- ✅ Guest browsing allowed
- ✅ Persistent cart for guests

### 7. **Role-Based Dashboards**
- **Admin** (id: admin, password: subir)
  - Analytics dashboard
  - User management
  - Product moderation
  - Reported reviews
  - Bulk notifications
  
- **Seller** (id: seller, password: subir)
  - Product upload (single/bulk)
  - Excel/JSON bulk import
  - Sample download
  - Order management
  - Sales analytics

### 8. **Analytics Features**
- ✅ User login tracking
- ✅ Page visit analytics
- ✅ Location tracking (GeoIP)
- ✅ Time spent on pages
- ✅ Search history
- ✅ Product views
- ✅ Cart abandonment

### 9. **Search Functionality**
- ✅ Text search with suggestions
- ✅ Image search (TensorFlow.js)
- ✅ Recent searches display
- ✅ "Product not available" message
- ✅ Category-based filtering

### 10. **Mobile Apps**
- ✅ Android (Capacitor + React)
- ✅ iOS (Capacitor + React)
- ✅ All web features synced
- ✅ Native navigation
- ✅ Push notification ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Frontend Setup
```bash
cd app
npm install
npm run dev
```

### Backend Setup
```bash
cd evara-complete/backend
npm install
# Create .env file (see below)
npm start
```

### Environment Variables (Backend `.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/evara
JWT_SECRET=your_jwt_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

---

## 📱 Mobile App Build Instructions

### Android APK
```bash
cd app
npm run build
npx cap copy android
cd android
./gradlew assembleDebug
# APK located at: android/app/build/outputs/apk/debug/app-debug.apk
```

### iOS IPA
```bash
cd app
npm run build
npx cap copy ios
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

---

## 🌐 Deployment Guides

### Free Deployment (Recommended for Startups)

#### Option 1: Vercel + Railway (₹0/month)
1. **Frontend (Vercel)**:
   - Connect GitHub repo to Vercel
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Backend (Railway)**:
   - Deploy backend folder
   - Add MongoDB plugin
   - Set environment variables

#### Option 2: Render (₹0/month)
- Deploy full-stack on Render
- Free tier includes:
  - 750 hours/month
  - 512 MB RAM
  - 0.1 CPU
  - 1 GB storage

See `evara-complete/docs/FREE_DEPLOYMENT_GUIDE.md` for detailed instructions.

### AWS Deployment (Production Scale)
See `evara-complete/docs/AWS_DEPLOYMENT_GUIDE.md` for:
- EC2 setup
- S3 bucket configuration
- CloudFront CDN
- Route 53 DNS
- DocumentDB (MongoDB)

---

## 📊 Admin & Seller Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | subir |
| Seller | seller | subir |

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Seller/Admin)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update` - Update quantity
- `DELETE /api/cart/remove` - Remove item

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Payments (Razorpay)
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Process refund

### Reviews
- `GET /api/reviews/product/:id` - Get product reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/share-link` - Share review link
- `POST /api/reviews/:id/helpful` - Mark helpful

### Analytics
- `GET /api/analytics/dashboard` - Admin dashboard
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/products` - Product analytics

---

## 🛡️ Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

---

## 📈 Future Improvements

See `evara-complete/docs/FUTURE_IMPROVEMENTS.md` for:
- AI-powered recommendations
- Live chat support
- Multi-language support
- Advanced analytics
- Loyalty program
- Subscription model
- Social login
- AR try-on

---

## 📞 Support

For issues or questions:
1. Check the documentation in `evara-complete/docs/`
2. Review API endpoints
3. Check environment variables

---

## 📄 License

MIT License - Feel free to use for commercial projects.

---

**Built with ❤️ for the Indian Market**

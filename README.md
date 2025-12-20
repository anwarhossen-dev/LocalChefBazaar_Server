🍽️ LocalChefBazaarBD – Backend Server

A Node.js + Express backend for LocalChefBazaarBD, a food marketplace platform where users can order meals from chefs, manage roles (user/chef/admin), make Stripe payments, leave reviews, and more.
Authentication is handled via Firebase Admin, data is stored in MongoDB Atlas, and payments are processed with Stripe Checkout.

🚀 Features
👤 Authentication & Authorization

Firebase Authentication (JWT verification)

Role-based access control:

User

Chef

Admin

Fraud user blocking system

👥 User Management

Create users automatically on signup

Admin can:

View all users

Promote users to Chef/Admin

Mark users as Fraud

🍱 Meals Management (Chef)

Add meals

Update meals

Delete meals

View meals by chef email

Pagination & latest meals

⭐ Reviews & Ratings

Add one review per meal per user

Update & delete reviews

Auto-calculate average meal rating

❤️ Favorites

Add meals to favorites

Remove favorites

View favorite meals per user

🛒 Orders

Place orders

View orders by:

User

Chef

Update order status (Chef)

Delete orders

Track payment & delivery status

💳 Payments (Stripe)

Stripe Checkout integration

Payment success verification

Store transaction records

Link payments with orders

📊 Admin Dashboard Stats

Total users

Pending orders

Delivered orders

Total payment amount

📩 Contact

Store user contact messages

🧱 Tech Stack

Node.js

Express.js

MongoDB Atlas

Firebase Admin SDK

Stripe API

dotenv

CORS

📂 Project Structure
├── index.js
├── serviceAccountKey.json
├── .env
├── package.json
└── README.md

🔐 Environment Variables

Create a .env file in the root directory:

PORT=3000
CLIENT_DOMAIN=https://localchefbazaar-612c0.web.app

STRIPE_SECRET_KEY=your_stripe_secret_key

use_Name=your_mongodb_username
user_Pass=your_mongodb_password
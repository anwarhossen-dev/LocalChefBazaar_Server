// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const admin = require("firebase-admin");
// const fs = require("fs");
// const path = require("path");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// const app = express();
// const port = process.env.PORT || 3000;

// // ── Stripe ──────────────────────────────────────────────────────────────────
// let stripe;
// if (process.env.STRIPE_SECRET_KEY) {
//   stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// } else {
//   console.warn("⚠️  STRIPE_SECRET_KEY missing");
// }

// // ── Firebase ─────────────────────────────────────────────────────────────────
// let firebaseInitialized = false;
// try {
//   let serviceAccount;
//   if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//     serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//   } else {
//     const saPath = path.join(__dirname, "serviceAccountKey.json");
//     if (fs.existsSync(saPath)) {
//       serviceAccount = require(saPath);
//     } else {
//       console.warn(
//         "Firebase service account not found; skipping Firebase initialization"
//       );
//     }
//   }

//   if (serviceAccount && !admin.apps.length) {
//     admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
//     firebaseInitialized = true;
//   }
// } catch (error) {
//   console.error("Firebase Error:", error.message);
//   console.warn(
//     "Firebase encountered an error during initialization; set FIREBASE_SERVICE_ACCOUNT correctly"
//   );
// }

// // ── Middleware ────────────────────────────────────────────────────────────────
// app.use(
//   cors({
//     origin: [
//       process.env.CLIENT_DOMAIN || "http://localhost:5173",
//       "https://local-chef-bazaar-pied.vercel.app", // Adding the production domain seen in older versions
//     ],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );
// app.use(express.json());

// // ── MongoDB ───────────────────────────────────────────────────────────────────
// // Prefer a full MONGO_URI; fall back to common user/pass env names, or legacy names
// const uri =
//   process.env.MONGO_URI ||
//   `mongodb+srv://${process.env.MONGO_USER || process.env.use_Name}:${process.env.MONGO_PASS || process.env.user_Pass}@allunityit.looszdp.mongodb.net/?retryWrites=true&w=majority&appName=AllUnityIt`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// // ── Firebase Token Verify ─────────────────────────────────────────────────────
// // const verifyFBToken = async (req, res, next) => {
// //   try {
// //     const authHeader = req.headers.authorization;
// //     if (!authHeader) return res.status(401).send({ message: "Unauthorized" });
// //     const token = authHeader.split(" ")[1];
// //     const decoded = await admin.auth().verifyIdToken(token);
// //     req.decoded_email = decoded.email;
// //     next();
// //   } catch (error) {
// //     return res.status(401).send({ message: "Unauthorized" });
// //   }
// // };

// const verifyFBToken = async (req, res, next) => {
//   try {
//     if (!firebaseInitialized) {
//       return res
//         .status(500)
//         .send({ message: "Firebase not configured on server" });
//     }

//     console.log("AUTH HEADER:", req.headers.authorization);

//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       console.log("NO AUTH HEADER");
//       return res.status(401).send({ message: "Unauthorized" });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = await admin.auth().verifyIdToken(token);

//     console.log("DECODED EMAIL:", decoded.email);

//     req.decoded_email = decoded.email;

//     next();
//   } catch (error) {
//     console.log("VERIFY ERROR:", error.message);

//     return res.status(401).send({ message: "Unauthorized" });
//   }
// };
// // ── Run ───────────────────────────────────────────────────────────────────────
// async function run() {
//   try {
//     // Ensure the client connects before using the database
//     await client.connect();
//     const db = client.db("LocalChefBazzaarBD");

//     const usersCollection      = db.collection("users");
//     const mealsCollection      = db.collection("meals");
//     const ordersCollection     = db.collection("orders");
//     const reviewsCollection    = db.collection("reviews");
//     const favouriteCollection  = db.collection("favourites");
//     const paymentsCollection   = db.collection("payments");
//     const requestsCollection   = db.collection("requests");
//     const contactCollection    = db.collection("contacts");

//     // ── Role Guards ─────────────────────────────────────────────────────────
//     const verifyAdmin = async (req, res, next) => {
//       const user = await usersCollection.findOne({ email: req.decoded_email });
//       if (!user)            return res.status(404).send({ error: "User not found" });
//       if (user.role !== "admin") return res.status(403).send({ error: "Admin only" });
//       next();
//     };

//     const verifyChef = async (req, res, next) => {
//       const user = await usersCollection.findOne({ email: req.decoded_email });
//       if (!user)           return res.status(404).send({ error: "User not found" });
//       if (user.role !== "chef") return res.status(403).send({ error: "Chef only" });
//       next();
//     };

//     const verifyFraud = async (req, res, next) => {
//       const user = await usersCollection.findOne({ email: req.decoded_email });
//       if (!user)                  return res.status(404).send({ error: "User not found" });
//       if (user.status === "fraud") return res.status(403).send({ error: "Fraud user blocked" });
//       next();
//     };

//     // ════════════════════════════════════════════════════════════════════════
//     // USERS
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/users", async (req, res) => {
//       try {
//         const user = req.body;
//         const exists = await usersCollection.findOne({ email: user.email });
//         if (exists) return res.send({ message: "User already exists" });
//         user.role = "user";
//         user.status = "active";
//         user.createdAt = new Date();
//         const result = await usersCollection.insertOne(user);
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to create user" });
//       }
//     });

//     app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const users = await usersCollection.find().sort({ createdAt: -1 }).toArray();
//         res.send(users);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/users/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email)
//           return res.status(403).send({ error: "Access denied" });
//         const user = await usersCollection.findOne({ email });
//         if (!user) return res.status(404).send({ error: "User not found" });
//         res.send(user);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/users/:email/role", async (req, res) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.params.email });
//         res.send({ role: user?.role || "user" });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.patch("/users/fraud/:email", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const result = await usersCollection.updateOne(
//           { email: req.params.email },
//           { $set: { status: "fraud" } }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // REQUESTS
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/requests", verifyFBToken, async (req, res) => {
//       try {
//         const request = req.body;
//         request.requestStatus = "pending";
//         request.requestTime = new Date();
//         const result = await requestsCollection.insertOne(request);
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/requests", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const requests = await requestsCollection.find().sort({ requestTime: -1 }).toArray();
//         res.send(requests);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/requests/:email", async (req, res) => {
//       try {
//         const requests = await requestsCollection
//           .find({ userEmail: req.params.email })
//           .sort({ requestTime: -1 })
//           .toArray();
//         res.send(requests);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.patch("/requests/update/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const { requestStatus, userEmail, requestType } = req.body;
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ success: false });

//         await requestsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: { requestStatus } }
//         );

//         if (requestStatus === "approved") {
//           let updateData = {};
//           if (requestType === "chef") {
//             updateData = {
//               role: "chef",
//               chefId: "chef-" + Math.floor(1000 + Math.random() * 9000),
//             };
//           } else if (requestType === "admin") {
//             updateData = { role: "admin" };
//           }
//           await usersCollection.updateOne(
//             { email: userEmail },
//             { $set: updateData }
//           );
//         }
//         res.send({ success: true });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // MEALS
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/meals", verifyFBToken, verifyFraud, verifyChef, async (req, res) => {
//       try {
//         const meal = req.body;
//         if (req.decoded_email !== meal.userEmail)
//           return res.status(403).send({ error: "Access denied" });
//         meal.createdAt = new Date();
//         const result = await mealsCollection.insertOne(meal);
//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (error) {
//         res.status(500).send({ success: false, error: "Failed" });
//       }
//     });

//     app.get("/latestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .limit(8)
//           .toArray();
//         res.send(meals);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/leatestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .limit(8)
//           .toArray();
//         res.send(meals);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/meals", async (req, res) => {
//       try {
//         const page  = parseInt(req.query.page)  || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip  = (page - 1) * limit;
//         const total = await mealsCollection.countDocuments();
//         const meals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .toArray();
//         res.send({ total, page, limit, meals });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/meals/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
//         const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });
//         if (!meal) return res.status(404).send({ error: "Meal not found" });
//         res.send(meal);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email)
//           return res.status(403).send({ error: "Access denied" });
//         const meals = await mealsCollection
//           .find({ userEmail: email })
//           .sort({ createdAt: -1 })
//           .toArray();
//         res.send(meals);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
//         const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
//         const result = await mealsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: req.body }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // REVIEWS
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/reviews", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const review = req.body;
//         const exists = await reviewsCollection.findOne({
//           foodId: review.foodId,
//           reviewerEmail: review.reviewerEmail,
//         });
//         if (exists)
//           return res.send({ success: false, message: "Already reviewed" });
//         review.date = new Date();
//         const result = await reviewsCollection.insertOne(review);

//         if (ObjectId.isValid(review.foodId)) {
//           const all  = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//           const avg  = all.reduce((s, r) => s + Number(r.rating || 0), 0) / all.length;
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: Number(avg.toFixed(2)) } }
//           );
//         }
//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/reviews", async (req, res) => {
//       try {
//         const reviews = await reviewsCollection
//           .find()
//           .sort({ date: -1 })
//           .limit(20)
//           .toArray();
//         res.send(reviews);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/reviews/:mealId", async (req, res) => {
//       try {
//         const reviews = await reviewsCollection
//           .find({ foodId: req.params.mealId })
//           .toArray();
//         res.send(reviews);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email)
//           return res.status(403).send({ error: "Access denied" });
//         const result = await reviewsCollection
//           .find({ reviewerEmail: email })
//           .toArray();
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
//         await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
//         if (review && ObjectId.isValid(review.foodId)) {
//           const remaining = await reviewsCollection
//             .find({ foodId: review.foodId })
//             .toArray();
//           const avg = remaining.length
//             ? remaining.reduce((s, r) => s + Number(r.rating || 0), 0) / remaining.length
//             : 0;
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: Number(avg.toFixed(2)) } }
//           );
//         }
//         res.send({ success: true });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id     = req.params.id;
//         const { rating, comment } = req.body;
//         const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
//         await reviewsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: { rating: Number(rating), comment, date: new Date() } }
//         );
//         if (review && ObjectId.isValid(review.foodId)) {
//           const all = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//           const avg = all.reduce((s, r) => s + Number(r.rating || 0), 0) / all.length;
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: Number(avg.toFixed(2)) } }
//           );
//         }
//         res.send({ success: true });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // FAVOURITES
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/favorites", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const fav    = req.body;
//         const exists = await favouriteCollection.findOne({
//           userEmail: fav.userEmail,
//           mealId:    fav.mealId,
//         });
//         if (exists)
//           return res.send({ success: false, message: "Already in favorites" });
//         fav.addedTime = new Date();
//         const result = await favouriteCollection.insertOne(fav);
//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/favorites/:email", verifyFBToken, async (req, res) => {
//       try {
//         const result = await favouriteCollection
//           .find({ userEmail: req.params.email })
//           .toArray();
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.delete("/favourites/:id", verifyFBToken, async (req, res) => {
//       try {
//         const result = await favouriteCollection.deleteOne({
//           _id: new ObjectId(req.params.id),
//         });
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // ORDERS
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/orders", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const order         = req.body;
//         order.orderTime     = new Date();
//         order.orderStatus   = "pending";
//         order.paymentStatus = "pending";
//         const result        = await ordersCollection.insertOne(order);
//         res.send({ insertedId: result.insertedId });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/orders/:id", async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id))
//           return res.status(400).send({ error: "Invalid ID" });
//         const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
//         if (!order) return res.status(404).send({ error: "Order not found" });
//         res.send(order);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/orders/by-user/:email", verifyFBToken, async (req, res) => {
//       try {
//         const result = await ordersCollection
//           .find({ userEmail: req.params.email })
//           .sort({ orderTime: -1 })
//           .toArray();
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.get("/orders/by-chef/:chefEmail", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const orders = await ordersCollection
//           .find({ chefEmail: req.params.chefEmail })
//           .sort({ orderTime: -1 })
//           .toArray();
//         res.send(orders);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.patch("/orders/update/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const { status } = req.body;
//         const allowed = ["pending", "accepted", "cancelled", "delivered"];
//         if (!allowed.includes(status))
//           return res.status(400).send({ error: "Invalid status" });
//         const result = await ordersCollection.updateOne(
//           { _id: new ObjectId(req.params.id) },
//           { $set: { orderStatus: status } }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     app.delete("/orders/:id", verifyFBToken, async (req, res) => {
//       try {
//         const result = await ordersCollection.deleteOne({
//           _id: new ObjectId(req.params.id),
//         });
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // PAYMENTS
//     // ════════════════════════════════════════════════════════════════════════

//     app.get("/payments", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const payments = await paymentsCollection.find().sort({ paidAt: -1 }).toArray();
//         res.send(payments);
//       } catch (error) {
//         res.status(500).send({ error: "Failed to fetch payments" });
//       }
//     });

//     app.post("/order-payment-checkout", verifyFBToken, async (req, res) => {
//       try {
//         if (!stripe)
//           return res.status(500).send({ error: "Stripe not configured" });
//         const { orderId, mealName, price, quantity, userEmail } = req.body;
//         const session = await stripe.checkout.sessions.create({
//           line_items: [
//             {
//               price_data: {
//                 currency: "usd",
//                 unit_amount: Math.round(price * 100),
//                 product_data: { name: mealName },
//               },
//               quantity: quantity || 1,
//             },
//           ],
//           mode: "payment",
//           metadata:       { orderId, mealName },
//           customer_email: userEmail,
//           success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//           cancel_url:  `${process.env.CLIENT_DOMAIN}/dashboard/payment-cancelled`,
//         });
//         res.send({ url: session.url });
//       } catch (error) {
//         res.status(500).send({ error: "Payment failed" });
//       }
//     });

//     app.patch("/order-payment-success", verifyFBToken, async (req, res) => {
//       try {
//         if (!stripe)
//           return res.status(500).send({ error: "Stripe not configured" });
//         const session       = await stripe.checkout.sessions.retrieve(req.query.session_id);
//         if (session.payment_status !== "paid")
//           return res.send({ success: false });

//         const orderId       = session.metadata.orderId;
//         const transactionId = session.payment_intent;

//         await ordersCollection.updateOne(
//           { _id: new ObjectId(orderId) },
//           { $set: { paymentStatus: "paid", transactionId, paidAt: new Date() } }
//         );
//         await paymentsCollection.updateOne(
//           { transactionId },
//           {
//             $setOnInsert: {
//               amount:        session.amount_total / 100,
//               currency:      session.currency,
//               userEmail:     session.customer_email,
//               orderId,
//               mealName:      session.metadata.mealName,
//               transactionId,
//               paymentStatus: "paid",
//               paidAt:        new Date(),
//             },
//           },
//           { upsert: true }
//         );
//         res.send({ success: true });
//       } catch (error) {
//         res.status(500).send({ error: "Verification failed" });
//       }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // STATS
//     // ════════════════════════════════════════════════════════════════════════

//     app.get("/admin/stats/totalUsers", async (req, res) => {
//       try {
//         const count = await usersCollection.countDocuments();
//         res.send({ totalUsers: count });
//       } catch { res.status(500).send({ totalUsers: 0 }); }
//     });

//     app.get("/admin/stats/totalPayments", async (req, res) => {
//       try {
//         const result = await paymentsCollection.aggregate([
//           { $group: { _id: null, total: { $sum: "$amount" } } },
//         ]).toArray();
//         res.send({ totalPayments: result[0]?.total || 0 });
//       } catch { res.status(500).send({ totalPayments: 0 }); }
//     });

//     app.get("/admin/stats/ordersPending", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
//         res.send({ pendingOrders: count });
//       } catch { res.status(500).send({ pendingOrders: 0 }); }
//     });

//     app.get("/admin/stats/ordersDelivered", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
//         res.send({ deliveredOrders: count });
//       } catch { res.status(500).send({ deliveredOrders: 0 }); }
//     });

//     // ════════════════════════════════════════════════════════════════════════
//     // CONTACT
//     // ════════════════════════════════════════════════════════════════════════

//     app.post("/contact", async (req, res) => {
//       try {
//         const message   = req.body;
//         message.createdAt = new Date();
//         const result    = await contactCollection.insertOne(message);
//         res.send({ success: !!result.insertedId });
//       } catch (error) {
//         res.status(500).send({ error: "Failed" });
//       }
//     });

//     // ────────────────────────────────────────────────────────────────────────
//     await client.db("admin").command({ ping: 1 });
//     console.log("✅ MongoDB Connected");
//   } catch (error) {
//     console.error("❌ Startup Error:", error);
//   }
// }

// run().catch(console.dir);

// app.get("/", (req, res) => res.send("🍽️ LocalChef Bazaar Server Running"));

// app.listen(port, () => console.log(`🚀 Server on port ${port}`));



/* cspell:disable */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// ───────────────────────────── Stripe ─────────────────────────────
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

// ───────────────────────────── Firebase ─────────────────────────────
let firebaseInitialized = false;

try {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const filePath = path.join(__dirname, "serviceAccountKey.json");
    if (fs.existsSync(filePath)) {
      serviceAccount = require(filePath);
    }
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
  }
} catch (err) {
  console.log("Firebase init skipped:", err.message);
}

// ───────────────────────────── Middleware ─────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_DOMAIN,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

// ───────────────────────────── MongoDB ─────────────────────────────
const uri =
  process.env.MONGO_URI ||
 // `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster.mongodb.net/LocalChefBazzaarBD`;
  `mongodb+srv://${process.env.MONGO_USER || process.env.use_Name}:${process.env.MONGO_PASS || process.env.user_Pass}@allunityit.looszdp.mongodb.net/?retryWrites=true&w=majority&appName=AllUnityIt`;

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

// ───────────────────────────── Auth Middleware ─────────────────────────────
// const verifyFBToken = async (req, res, next) => {
//   try {
//     if (!firebaseInitialized) return next();

//     const auth = req.headers.authorization;
//     if (!auth) return res.status(401).send({ error: "No token" });

//     const token = auth.split(" ")[1];
//     const decoded = await admin.auth().verifyIdToken(token);

//     req.email = decoded.email;
//     next();
//   } catch {
//     res.status(401).send({ error: "Unauthorized" });
//   }
// };


// const verifyFBToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).send({
//         error: "Unauthorized Access",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     const decoded = await admin.auth().verifyIdToken(token);

//     req.decoded_email = decoded.email;

//     next();
//   } catch (error) {
//     console.error("verifyFBToken Error:", error);

//     return res.status(401).send({
//       error: "Unauthorized Access",
//     });
//   }
// };
const verifyFBToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        error: "Unauthorized Access",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    console.log("Decoded Email:", decoded.email);

    req.decoded_email = decoded.email;

    next();
  } catch (error) {
    console.error("verifyFBToken Error:", error);

    return res.status(401).send({
      error: "Unauthorized Access",
    });
  }
};

// Global middleware to verify admin users (does not rely on in-function variables)
// const verifyAdmin = async (req, res, next) => {
//   try {
//     const requesterEmail = req.decoded_email || req.email;
//     if (!requesterEmail) return res.status(401).send({ error: "Unauthorized" });

//     const db = client.db("LocalChefBazzaarBD");
//     const users = db.collection("users");

//     const requester = await users.findOne({ email: requesterEmail });
//     if (!requester || requester.role !== "admin")
//       return res.status(403).send({ error: "Forbidden" });

//     next();
//   } catch (error) {
//     console.error("verifyAdmin Error:", error);
//     res.status(500).send({ error: error.message });
//   }
// };

const verifyAdmin = async (req, res, next) => {
  try {
    const requesterEmail = req.decoded_email;

    if (!requesterEmail) {
      return res.status(401).send({
        error: "Unauthorized",
      });
    }

    const requester = await users.findOne({
      email: requesterEmail,
    });

    if (!requester || requester.role !== "admin") {
      return res.status(403).send({
        error: "Forbidden",
      });
    }

    next();
  } catch (error) {
    console.error("verifyAdmin Error:", error);

    res.status(500).send({
      error: error.message,
    });
  }
};

// ───────────────────────────── DB + API ─────────────────────────────
async function run() {
  await client.connect();
  const db = client.db("LocalChefBazzaarBD");

  const users = db.collection("users");
  const meals = db.collection("meals");
  const orders = db.collection("orders");
  const reviews = db.collection("reviews");
  const payments = db.collection("payments");
  const requests = db.collection("requests");
  const Contacts = db.collection("Contacts");

  // ================= USERS =================
  // app.post("/users", async (req, res) => {
  //   const data = req.body;
  //   const exist = await users.findOne({ email: data.email });

  //   if (exist) return res.send({ message: "exists" });

  //   data.role = "user";
  //   data.status = "active";

  //   const result = await users.insertOne(data);
  //   res.send(result);
  // });

  // app.get("/users/:email", verifyFBToken, async (req, res) => {
  //   try {
  //     const requesterEmail = req.email;
  //     const targetEmail = req.params.email;
  //     console.log("GET /users/:email - requester:", requesterEmail, "target:", targetEmail);

  //     if (requesterEmail !== targetEmail) {
  //       // allow if requester is admin
  //       const requester = await users.findOne({ email: requesterEmail });
  //       if (!requester || requester.role !== "admin")
  //         return res.status(403).send({ error: "Forbidden" });
  //     }

  //     const user = await users.findOne({ email: targetEmail });
  //     if (!user) return res.status(404).send({ error: "User not found" });
  //     res.send(user);
  //   } catch (err) {
  //     res.status(500).send({ error: err.message });
  //   }
  // });

  // app.get("/users/:email/role", verifyFBToken, async (req, res) => {
  //   const user = await users.findOne({ email: req.params.email });
  //   res.send({ role: user?.role || "user" });
  // });


//   app.get("/users/:email", verifyFBToken, async (req, res) => {
//   try {
//     const requesterEmail = req.decoded_email;
//     const targetEmail = req.params.email;

//     console.log("Requester:", requesterEmail);
//     console.log("Target:", targetEmail);

//     if (requesterEmail !== targetEmail) {
//       const requester = await users.findOne({
//         email: requesterEmail,
//       });

//       if (!requester || requester.role !== "admin") {
//         return res.status(403).send({
//           error: "Forbidden",
//         });
//       }
//     }

//     const user = await users.findOne({
//       email: targetEmail,
//     });

//     if (!user) {
//       return res.status(404).send({
//         error: "User not found",
//       });
//     }

//     res.send(user);
//   } catch (error) {
//     console.error(error);

//     res.status(500).send({
//       error: error.message,
//     });
//   }
// });

app.get("/users/:email/role", verifyFBToken, async (req, res) => {
  try {
    const requesterEmail = req.decoded_email;
    const targetEmail = req.params.email;

    if (requesterEmail !== targetEmail) {
      const requester = await users.findOne({
        email: requesterEmail,
      });

      if (!requester || requester.role !== "admin") {
        return res.status(403).send({
          error: "Forbidden",
        });
      }
    }

    const user = await users.findOne({
      email: targetEmail,
    });

    res.send({
      role: user?.role || "user",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      error: error.message,
    });
  }
});
  // Admin-only: set role for a user
  // app.patch("/users/role/:email", verifyFBToken, async (req, res) => {
  //   try {
  //     const requesterEmail = req.email;
  //     const requester = await users.findOne({ email: requesterEmail });
  //     if (!requester || requester.role !== "admin")
  //       return res.status(403).send({ error: "Forbidden" });

  //     const targetEmail = req.params.email;
  //     const { role } = req.body;
  //     if (!role) return res.status(400).send({ error: "Missing role" });

  //     const result = await users.updateOne(
  //       { email: targetEmail },
  //       { $set: { role } }
  //     );
  //     res.send({ success: result.modifiedCount > 0 });
  //   } catch (err) {
  //     res.status(500).send({ error: err.message });
  //   }
  // });

//   app.get("/users/:email/role", verifyFBToken, async (req, res) => {
//   try {
//     const requesterEmail = req.decoded_email;
//     const targetEmail = req.params.email;

//     if (requesterEmail !== targetEmail) {
//       const requester = await users.findOne({
//         email: requesterEmail,
//       });

//       if (!requester || requester.role !== "admin") {
//         return res.status(403).send({
//           error: "Forbidden",
//         });
//       }
//     }

//     const user = await users.findOne({
//       email: targetEmail,
//     });

//     res.send({
//       role: user?.role || "user",
//     });
//   } catch (error) {
//     res.status(500).send({
//       error: error.message,
//     });
//   }
// });


app.get(
  "/api/users",
  verifyFBToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const list = await users
        .find()
        .sort({ createdAt: -1 })
        .toArray();

      res.send(list);
    } catch (error) {
      res.status(500).send({
        error: error.message,
      });
    }
  }
);
  // --- API-prefixed aliases for frontend proxies ---
  // app.get("/api/users", verifyFBToken, verifyAdmin, async (req, res) => {
  //   try {
  //     const list = await users.find().sort({ createdAt: -1 }).toArray();
  //     res.send(list);
  //   } catch (err) {
  //     res.status(500).send({ error: err.message });
  //   }
  // });

  app.get("/api/users/:email", verifyFBToken, async (req, res) => {
  try {
    const requesterEmail = req.decoded_email;
    const targetEmail = req.params.email;

    console.log(
      "GET USER =>",
      "Requester:",
      requesterEmail,
      "Target:",
      targetEmail
    );

    if (requesterEmail !== targetEmail) {
      const requester = await users.findOne({
        email: requesterEmail,
      });

      if (!requester || requester.role !== "admin") {
        return res.status(403).send({
          error: "Forbidden",
        });
      }
    }

    const user = await users.findOne({
      email: targetEmail,
    });

    if (!user) {
      return res.status(404).send({
        error: "User not found",
      });
    }

    res.send(user);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      error: error.message,
    });
  }
});

  // app.get("/api/users/:email", verifyFBToken, async (req, res) => {
  //   try {
  //     const requesterEmail = req.email;
  //     const targetEmail = req.params.email;
  //     console.log("GET /api/users/:email - requester:", requesterEmail, "target:", targetEmail);

  //     if (requesterEmail !== targetEmail) {
  //       const requester = await users.findOne({ email: requesterEmail });
  //       if (!requester || requester.role !== "admin")
  //         return res.status(403).send({ error: "Forbidden" });
  //     }

  //     const user = await users.findOne({ email: targetEmail });
  //     if (!user) return res.status(404).send({ error: "User not found" });
  //     res.send(user);
  //   } catch (err) {
  //     res.status(500).send({ error: err.message });
  //   }
  // });

  app.patch(
  "/api/users/role/:email",
  verifyFBToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const targetEmail = req.params.email;
      const { role } = req.body;

      if (!role) {
        return res.status(400).send({
          error: "Role is required",
        });
      }

      const result = await users.updateOne(
        {
          email: targetEmail,
        },
        {
          $set: {
            role,
          },
        }
      );

      res.send({
        success: result.modifiedCount > 0,
      });
    } catch (error) {
      console.error(error);

      res.status(500).send({
        error: error.message,
      });
    }
  }
);
  app.get("/api/users/:email/role", verifyFBToken, async (req, res) => {
    try {
      const user = await users.findOne({ email: req.params.email });
      res.send({ role: user?.role || "user" });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  app.patch("/api/users/role/:email", verifyFBToken, async (req, res) => {
    try {
      const requesterEmail = req.email;
      const requester = await users.findOne({ email: requesterEmail });
      if (!requester || requester.role !== "admin")
        return res.status(403).send({ error: "Forbidden" });

      const targetEmail = req.params.email;
      const { role } = req.body;
      if (!role) return res.status(400).send({ error: "Missing role" });

      const result = await users.updateOne(
        { email: targetEmail },
        { $set: { role } }
      );
      res.send({ success: result.modifiedCount > 0 });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  // ================= MEALS =================
  app.get("/meals", async (req, res) => {
    const data = await meals.find().toArray();
    res.send(data);
  });

  // // latest meals (most recent 8)
  // app.get("/latestMeals", async (req, res) => {
  //   try {
  //     const list = await meals.find().sort({ createdAt: -1 }).limit(8).toArray();
  //     res.send(list);
  //   } catch (err) {
  //     res.status(500).send({ error: err.message });
  //   }
  // });

  // // single latest meal (most recent)
  // app.get("/latestMeal", async (req, res) => {
  //   try {
  //     const list = await meals.find().sort({ createdAt: -1 }).limit(1).toArray();
  //     res.send(list[0] || null);
  //   } catch (err) {
  //     res.status(500).send({ error: err.message });
  //   }
  // });

  app.get("/latestMeals", async (req, res) => {
  try {
    const result = await meals
      .find({})
      .sort({ _id: -1 })
      .limit(8)
      .toArray();

    res.send(result);
  } catch (error) {
    console.error("Latest Meals Error:", error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

  // ================= REQUESTS =================
  app.post("/requests", verifyFBToken, async (req, res) => {
    try {
      const request = req.body;
      request.requestStatus = "pending";
      request.requestTime = new Date();
      const result = await requests.insertOne(request);
      res.send(result);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  // GET requests by query param or return all
  const handleGetRequests = async (req, res) => {
    try {
      const email = req.query.email || req.params.email;
      if (email) {
        const result = await requests
          .find({ userEmail: email })
          .sort({ requestTime: -1 })
          .toArray();
        return res.send(result);
      }
      const all = await requests.find().sort({ requestTime: -1 }).toArray();
      res.send(all);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  };

  app.get("/requests", handleGetRequests);
  app.get("/requests/:email", handleGetRequests);
  // Support frontend dev server proxy that uses `/api` prefix
  app.get("/api/requests", handleGetRequests);
  app.get("/api/requests/:email", handleGetRequests);

  app.post("/meals", verifyFBToken, async (req, res) => {
    const meal = req.body;
    meal.createdAt = new Date();

    const result = await meals.insertOne(meal);
    res.send(result);
  });

  // ================= ORDERS =================
  app.post("/orders", verifyFBToken, async (req, res) => {
    const order = req.body;
    order.status = "pending";

    const result = await orders.insertOne(order);
    res.send(result);
  });

  app.get("/orders/:email", verifyFBToken, async (req, res) => {
    if (req.email !== req.params.email)
      return res.status(403).send({ error: "Forbidden" });

    const result = await orders.find({ email: req.params.email }).toArray();
    res.send(result);
  });

  // ================= STRIPE =================
  app.post("/create-payment", verifyFBToken, async (req, res) => {
    if (!stripe) return res.status(500).send({ error: "Stripe not set" });

    const { price, name, orderId, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_DOMAIN}/cancel`,
      metadata: { orderId, email },
    });

    res.send({ url: session.url });
  });

  // ⚠️ FIXED: NO firebase auth here (Stripe redirect safe)
  app.post("/payment-success", async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.body.session_id
      );

      if (session.payment_status !== "paid")
        return res.send({ success: false });

      await orders.updateOne(
        { _id: new ObjectId(session.metadata.orderId) },
        { $set: { status: "paid" } }
      );

      await payments.insertOne({
        orderId: session.metadata.orderId,
        email: session.metadata.email,
        amount: session.amount_total / 100,
        createdAt: new Date(),
      });

      res.send({ success: true });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  // ================= REVIEWS =================
  app.post("/reviews", verifyFBToken, async (req, res) => {
    const review = req.body;
    review.createdAt = new Date();

    const result = await reviews.insertOne(review);
    res.send(result);
  });

  // ================= START =================
  await client.db("admin").command({ ping: 1 });

  console.log("✅ MongoDB Connected");
}

run().catch(console.error);

app.get("/", (req, res) => {
  res.send("🍽️ API Running");
});

app.listen(port, () => {
  console.log("🚀 Server running on", port);
});

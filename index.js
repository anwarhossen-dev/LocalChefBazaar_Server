
// require('dotenv').config()
// const express = require('express')
// const cors = require('cors')

// let stripe;
// if (process.env.STRIPE_SECRET_KEY) {
//   stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// } else {
//   console.warn("WARNING: STRIPE_SECRET_KEY is missing. Payment routes will fail.");
// }

// const admin = require('firebase-admin')

// // Initialize Firebase safely - handles both local file and environment variable for Vercel
// try {
//   const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
//     ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
//     : require("./serviceAccountKey.json");

//   if (!admin.apps.length) {
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//   }
// } catch (error) {
//   console.error("Firebase Initialization Error:", error.message);
// }

// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 

// const port = process.env.PORT || 3000
// const crypto = require("crypto");
// const verifyFBToken = async (req, res, next) => {
//   const token = req.headers.authorization;

//   if (!token) {
//     return res.status(401).send({ message: 'unauthorized access' })
//   }

//   try {
//     const idToken = token.split(' ')[1];
//     const decoded = await admin.auth().verifyIdToken(idToken);
//     console.log('decoded in the token', decoded);
//     req.decoded_email = decoded.email;
//     next();
//   }
//   catch (err) {
//     return res.status(401).send({ message: 'unauthorized access' })
//   }


// }

// const app = express()


// // middleware

// // app.use(
// //   cors({
// //     origin: [process.env.CLIENT_DOMAIN || "http://localhost:5173"],
// //     credentials: true,
// //     optionSuccessStatus: 200,
// //   })
// // )

// app.use(
//   cors({
//     origin: [
//       process.env.CLIENT_DOMAIN || "http://localhost:5173",
//     ],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ এটা যোগ করো
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );
// app.use(express.json())


// const uri = `mongodb+srv://${process.env.use_Name}:${process.env.user_Pass}@allunityit.looszdp.mongodb.net/?appName=AllUnityIt`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// let mealsCollection;

// async function run() {
//   try {

//     const db = client.db("LocalChefBazzaarBD");
//     const usersCollection = db.collection("users");
//     const requestsCollection = db.collection("requests");
//     mealsCollection = db.collection("meals"); // Assign to the outer variable instead of shadowing
//     const reviewsCollection = db.collection("reviews")
//     const favouriteCollection = db.collection("favourites")
//     const ordersCollection = db.collection("orders")
//     const paymentsCollection = db.collection("payments")
//     const contactCollection = db.collection("contacts")
//     // ------------Reusable api---------
//     // admin
//     const verifyAdmin = async (req, res, next) => {
//       try {
//         const email = req.decoded_email;
//         const user = await usersCollection.findOne({ email });

//         if (!user) {
//           return res.status(404).send({ error: "User not Found" });
//         }
//         if (user.role !== "admin") {
//           return res.status(403).send({ error: "Admin Access denied" });
//         }
//         next();
//       } catch (error) {
//         res.status(500).send({ error: "Admin Verificatin failed" });
//       }
//     };
//     // chef
//     const verifyChef = async (req, res, next) => {
//       try {
//         const email = req.decoded_email;
//         const user = await usersCollection.findOne({ email });

//         if (!user) {
//           return res.status(404).send({ error: "User not found" });
//         }
//         if (user.role !== "chef") {
//           return res.status(403).send({ error: "Chef access denied" });
//         }
//         next();
//       } catch (error) {
//         res.status(500).send({ error: "Chef verification failed " });
//       }
//     };
//     // Fraud
//     const verifyFraud = async (req, res, next) => {
//       try {
//         const email = req.decoded_email;
//         const user = await usersCollection.findOne({ email });
//         if (!user) {
//           return res.status(404).send({ error: "User not found" });
//         }
//         if (user.status === "fraud") {
//           return res.status(403).send({ error: "Fraud user - action blocked" });
//         }
//         next();
//       } catch (error) {
//         res.status(500).send({ error: "Fraud verification fraud" });
//       }
//     };

//     // ------------------Users API------------------
//     app.post("/users", async (req, res) => {
//       const user = req.body;
//       user.role = "user";
//       user.createdAt = new Date();
//       user.status = "active";
//       const email = user.email;

//       const userExists = await usersCollection.findOne({ email });
//       if (userExists) {
//         return res.send({ message: "user exists" });
//       }

//       const result = await usersCollection.insertOne(user);
//       res.send(result);
//     });
//     // get all users on frontend
//     app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
//       const allUsers = await usersCollection.find().sort({ createdAt: -1 }).toArray();
//       res.send(allUsers);
//     });
//     // role based access
//     app.get("/users/:email/role", async (req, res) => {
//       const email = req.params.email;
//       const query = { email: email };
//       const user = await usersCollection.findOne(query);
//       res.send({ role: user?.role });
//     });
//     // updated user status
//     app.patch("/users/fraud/:email", verifyFBToken, verifyAdmin, async (req, res) => {
//       const email = req.params.email;
//       const result = await usersCollection.updateOne({ email }, { $set: { status: "fraud" } });

//       if (result.modifiedCount > 0) {
//         return res.send({ success: true });
//       }

//       res.send({ success: false });
//     });

//     // showing users on my profile page on frontend
//     app.get("/users/:email", verifyFBToken, async (req, res) => {
//       const email = req.params.email;
//       if (req.decoded_email !== email) {
//         return res.status(403).send({ error: "Access Denied" });
//       }
//       const user = await usersCollection.findOne({ email });
//       if (!user) return res.status(404).send({ error: "User not found" });
//       res.send(user);
//     });
//     app.get("/admin/stats/totalUsers", async (req, res) => {
//       const count = await usersCollection.countDocuments();
//       res.send({ totalUsers: count });
//     });

//     // ------------------request api------------------

//     app.post("/requests", verifyFBToken, async (req, res) => {
//       const request = req.body;
//       request.requestStatus = "pending";
//       request.requestTime = new Date();
//       const result = await requestsCollection.insertOne(request);
//       res.send(result);
//     });

//     app.get("/requests/:email", async (req, res) => {
//       const email = req.params.email;

//       const requests = await requestsCollection.find({ userEmail: email }).sort({ requestTime: -1 }).toArray();

//       res.send(requests);
//     });

//     app.get("/requests", verifyFBToken, verifyAdmin, async (req, res) => {
//       const requests = await requestsCollection.find().sort({ requestTime: -1 }).toArray();
//       res.send(requests);
//     });

//     app.patch("/requests/update/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//       const id = req.params.id;
//       const { requestStatus, userEmail, requestType } = req.body;

//       if (!ObjectId.isValid(id)) {
//         return res.status(400).send({ success: false, message: "Invalid ID format" });
//       }

//       const requestUpdate = await requestsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { requestStatus } });

//       if (requestUpdate.modifiedCount === 0) {
//         return res.send({ success: false, message: "Request update failed" });
//       }
//       if (requestStatus === "approved") {
//         let updateData = {};
//         if (requestType === "chef") {
//           const chefId = "chef-" + Math.floor(1000 + Math.random() * 9000);
//           updateData = { role: "chef", chefId };
//         }
//         if (requestType === "admin") {
//           updateData = { role: "admin" };
//         }
//         const userUpdate = await usersCollection.updateOne({ email: userEmail }, { $set: updateData });
//         console.log("User Update:", userUpdate);
//         if (userUpdate.modifiedCount === 0) {
//           return res.send({ success: false, message: "User role update failed" });
//         }
//       }
//       return res.send({ success: true, message: "Request processed successfully" });
//     });

//     // ---------------Meals api---------------

//     app.post("/meals", verifyFBToken, verifyFraud, verifyChef, async (req, res) => {
//       try {
//         const meal = req.body;

//         if (req.decoded_email !== meal.userEmail) {
//           return res.status(403).send({ error: "Access denied" });
//         }
//         meal.createdAt = new Date();

//         const result = await mealsCollection.insertOne(meal);
//         res.send({ success: true, result });
//       } catch (error) {
//         res.status(500).send({ success: false, error: "Failed to creat meal" });
//       }
//     });
//     // // get meals to show on home page
//     // app.get("/latestMeals", async (req, res) => {
//     //   const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
//     //   res.send(meals);
//     // });

//     // app.get("/LatestMeal", async (req, res) => {
//     //   const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
//     //   res.send(meals);
//     // });

//         app.get("/leatestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
//         res.send(meals);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch meals" });
//       }
//     });
//     // Show meals Pagination
//     app.get("/meals", async (req, res) => {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const skip = (page - 1) * limit;
//       const total = await mealsCollection.countDocuments();
//       const meals = await mealsCollection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
//       res.send({ total, page, limit, meals });
//     });
//     // showing meal details on frontend as per id
//     app.get("/meals/:id", verifyFBToken, async (req, res) => {
//       const id = req.params.id;
//       const result = await mealsCollection.findOne({ _id: new ObjectId(id) });
//       res.send(result);
//     });

//     // get meals by email
//     app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
//       const email = req.params.email;

//       if (req.decoded_email !== email) {
//         return res.status(403).send({ error: "Access Denied" });
//       }
//       const meals = await mealsCollection.find({ userEmail: email }).sort({ createdAt: -1 }).toArray();
//       res.send(meals);
//     });
//     // delete meals
//     app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       const id = req.params.id;
//       const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
//       res.send(result);
//     });
//     // update meals information by id
//     app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       const id = req.params.id;
//       const updatedData = req.body;
//       const result = await mealsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
//       res.send({ success: result.modifiedCount > 0 });
//     });
//     // ---------Reviews api-----------------
//     app.post("/reviews", verifyFBToken, verifyFraud, async (req, res) => {
//       const review = req.body;
//       const exists = await reviewsCollection.findOne({
//         foodId: review.foodId,
//         reviewerEmail: review.reviewerEmail,
//       });
//       if (exists) {
//         return res.send({
//           success: false,
//           message: "Already you have added review to this meal",
//         });
//       }
//       const result = await reviewsCollection.insertOne(review);
//       const allReviews = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//       const total = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
//       const avgRating = total / allReviews.length;
//       if (!ObjectId.isValid(review.foodId)) {
//         return res.status(400).send({ success: false, message: "Invalid foodId formate" });
//       }
//       const newFoodId = new ObjectId(review.foodId);
//       await mealsCollection.updateOne({ _id: newFoodId }, { $set: { rating: Number(avgRating.toFixed(2)) } });
//       res.send({
//         success: true,
//         insertedId: result.insertedId,
//       });
//     });
//     app.get("/reviews/:mealId", async (req, res) => {
//       const mealId = req.params.mealId;
//       const reviews = await reviewsCollection.find({ foodId: mealId }).toArray();
//       res.send(reviews);
//     });
//     // app.get("/reviews", async (req, res) => {
//     //   const review = await reviewsCollection.find().sort({ date: -1 }).limit(10).toArray();
//     //   res.send(review);
//     // });
//     // app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
//     //   const email = req.params.email;
//     //   if (req.decoded_email !== email) {
//     //     return res.status(403).send({ error: "Access Denied" });
//     //   }
//     //   const result = await reviewsCollection.find({ reviewerEmail: email }).toArray();
//     //   res.send(result);
//     // });

//     // ✅ Public route — no auth needed
// app.get("/reviews", async (req, res) => {
//   try {
//     const result = await reviewsCollection.find().toArray();
//     res.send(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "Failed to fetch reviews" });
//   }
// });
//     app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
//       const id = req.params.id;
//       const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
//       const deleteResult = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

//       const givenReview = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//       let newRating = 0;
//       if (givenReview.length > 0) {
//         const total = givenReview.reduce((sum, r) => sum + Number(r.rating || 0), 0);
//         newRating = Number((total / givenReview.length).toFixed(3));
//       }

//       await mealsCollection.updateOne({ _id: new ObjectId(review.foodId) }, { $set: { rating: newRating } });
//       res.send({
//         success: deleteResult.deletedCount > 0,
//         message: "Review deleted Successfully",
//       });
//     });
//     app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
//       const id = req.params.id;
//       const { rating, comment } = req.body;
//       const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

//       // Update review
//       const updateReview = await reviewsCollection.updateOne(
//         { _id: new ObjectId(id) },
//         {
//           $set: {
//             rating: Number(rating),
//             comment,
//             date: new Date(),
//           },
//         }
//       );
//       const allRatings = await reviewsCollection.find({ foodId: review.foodId }).toArray();

//       let avgRating = 0;

//       if (allRatings.length > 0) {
//         const total = allRatings.reduce((sum, r) => sum + Number(r.rating || 0), 0);
//         avgRating = Number((total / allRatings.length).toFixed(2));
//       }

//       await mealsCollection.updateOne({ _id: new ObjectId(review.foodId) }, { $set: { rating: avgRating } });

//       res.send({
//         success: true,
//         message: "Review updated successfully",
//       });
//     });

//     // --------fav api ---------
//     app.post("/favorites", verifyFBToken, verifyFraud, async (req, res) => {
//       const favourite = req.body;

//       const exists = await favouriteCollection.findOne({
//         userEmail: favourite.userEmail,
//         mealId: favourite.mealId,
//       });
//       if (exists) {
//         return res.send({
//           success: false,
//           message: "Already added to favorite",
//         });
//       }
//       favourite.addedTime = new Date();
//       const result = await favouriteCollection.insertOne(favourite);
//       res.send({
//         success: true,
//         insertedId: result.insertedId,
//       });
//     });
//     app.get("/favorites/:email", verifyFBToken, async (req, res) => {
//       const email = req.params.email;
//       const result = await favouriteCollection.find({ userEmail: email }).toArray();
//       res.send(result);
//     });
//     app.delete("/favourites/:id", verifyFBToken, async (req, res) => {
//       const id = req.params.id;
//       const result = await favouriteCollection.deleteOne({ _id: new ObjectId(id) });
//       res.send(result);
//     });
//     // -----------------Order api----------------
//     app.post("/orders", verifyFBToken, verifyFraud, async (req, res) => {
//       const order = req.body;
//       order.orderTime = new Date().toISOString();

//       (order.orderStatus = "pending"), (order.paymentStatus = "pending");
//       const result = await ordersCollection.insertOne(order);
//       res.send(result);
//     });

//     // // GET order by ID
//     // app.get("/orders/:id", async (req, res) => {
//     //   try {
//     //     const { id } = req.params;

//     //     // Validate MongoDB ObjectId
//     //     if (!mongoose.Types.ObjectId.isValid(id)) {
//     //       return res.status(400).send("Invalid order ID");
//     //     }

//     //     const order = await order.findById(id);
//     //     if (!order) return res.status(404).send("Order not found");

//     //     res.json(order);
//     //   } catch (err) {
//     //     console.error("Error fetching order:", err);
//     //     res.status(500).send("Internal server error");
//     //   }
//     // });

//     app.get("/orders/:id", async (req, res) => {
//       try {
//         const id = req.params.id;

//         // Validate ObjectId
//         if (!ObjectId.isValid(id)) {
//           return res.status(400).json({ message: "Invalid order ID" });
//         }

//         const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

//         if (!order) return res.status(404).json({ message: "Order not found" });

//         res.json(order);
//       } catch (err) {
//         console.error("Error fetching order:", err);
//         res.status(500).json({ message: "Internal server error" });
//       }
//     });

//     // get users order
//     app.get("/orders/by-user/:email", verifyFBToken, async (req, res) => {
//       const email = req.params.email;
//       if (email !== req.params.email) {
//         return res.status(403).send({ message: "Forbidden Access" });
//       }
//       const query = { userEmail: email };
//       const result = await ordersCollection.find(query).sort({ orderTime: -1 }).toArray();
//       res.send(result);
//     });
//     // get the order bessed on chefId
//     app.get("/orders/by-chef/:chefEmail", verifyFBToken, verifyChef, async (req, res) => {
//       const chefEmail = req.params.chefEmail;
//       const orders = await ordersCollection.find({ chefEmail }).sort({ orderTime: -1 }).toArray();
//       res.send(orders);
//     });
//     app.patch("/orders/update/:id", verifyFBToken, verifyChef, async (req, res) => {
//       const id = req.params.id;
//       const { status } = req.body;
//       const allowed = ["pending", "accepted", "cancelled", "delivered"];
//       if (!allowed.includes(status)) {
//         return res.status(400).send({ error: "Invalid status" });
//       }
//       const result = await ordersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { orderStatus: status } });
//       res.send({ success: result.modifiedCount > 0 });
//     });
//     // app.get("/admin/stats/ordersPending", async (req, res) => {
//     //   const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
//     //   res.send({ pendingOrders: count });
//     // });
//     // app.get("/admin/stats/orderDelivered", async (req, res) => {
//     //   const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
//     //   res.send({ deliveredOrders: count });
//     // });

//     // -------------- Stats APIs ----------------

//     // Total Users
//     app.get("/admin/stats/totalUsers", async (req, res) => {
//       try {
//         const count = await usersCollection.countDocuments();
//         res.send({ totalUsers: count });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ totalUsers: 0 });
//       }
//     });

//     // Pending Orders
//     app.get("/admin/stats/ordersPending", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
//         res.send({ pendingOrders: count });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ pendingOrders: 0 });
//       }
//     });

//     // Delivered Orders
//     app.get("/admin/stats/ordersDelivered", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
//         res.send({ deliveredOrders: count });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ deliveredOrders: 0 });
//       }
//     });

//     // Total Payments
//     app.get("/admin/stats/totalPayments", async (req, res) => {
//       try {
//         const result = await paymentsCollection.aggregate([
//           { $group: { _id: null, total: { $sum: "$amount" } } }
//         ]).toArray();
//         res.send({ totalPayments: result[0]?.total || 0 });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ totalPayments: 0 });
//       }
//     });

//     app.get("/payments", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const payments = await paymentsCollection.find().sort({ paidAt: -1 }).toArray();
//         res.send(payments);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: "Failed to fetch payments" });
//       }
//     });

//     // --------------------Payment api-----------------
//     app.post("/order-payment-checkout", verifyFBToken, async (req, res) => {
//       if (!stripe) {
//         return res.status(500).send({ error: "Stripe is not configured on the server." });
//       }

//       const info = req.body;
//       const amount = parseInt(info.price) * 100;

//       const session = await stripe.checkout.sessions.create({
//         line_items: [
//           {
//             price_data: {
//               currency: "usd",
//               unit_amount: amount,
//               product_data: {
//                 name: `Payment for ${info.mealName}`,
//               },
//             },
//             quantity: info.quantity,
//           },
//         ],
//         mode: "payment",

//         metadata: {
//           orderId: info.orderId,
//           mealName: info.mealName,
//         },

//         customer_email: info.userEmail,

//         success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-cancelled`,
//       });

//       res.send({ url: session.url });
//     });
//     // Express example
//     app.get('/payment-success', async (req, res) => {
//       const { sessionId } = req.query;
//       if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

//       if (!stripe) {
//         return res.status(500).send({ error: "Stripe is not configured on the server." });
//       }

//       try {
//         // Lookup payment session in Stripe or database
//         const session = await stripe.checkout.sessions.retrieve(sessionId);
//         res.json({ success: true, session });
//       } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Could not verify payment' });
//       }
//     });

//     app.patch("/order-payment-success", verifyFBToken, async (req, res) => {
//       if (!stripe) {
//         return res.status(500).send({ error: "Stripe is not configured on the server." });
//       }

//       const sessionId = req.query.session_id;
//       const session = await stripe.checkout.sessions.retrieve(sessionId);
//       const transactionId = session.payment_intent;
//       if (session.payment_status === "paid") {
//         const orderId = session.metadata.orderId;

//         await ordersCollection.updateOne(
//           { _id: new ObjectId(orderId) },
//           {
//             $set: {
//               paymentStatus: "paid",
//               transactionId,
//               paidAt: new Date(),
//             },
//           }
//         );
//         const payment = {
//           amount: session.amount_total / 100,
//           currency: session.currency,
//           userEmail: session.customer_email,
//           orderId,
//           mealName: session.metadata.mealName,
//           transactionId,
//           paymentStatus: session.payment_status,
//           paidAt: new Date(),
//         };

//         await paymentsCollection.updateOne({ transactionId }, { $setOnInsert: payment }, { upsert: true });
//         return res.send({ success: true });
//       }
//       res.send({ success: false });
//     });
//    // const { ObjectId } = require("mongodb");

//     // Delete an order by ID
//     app.delete("/orders/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const result = await ordersCollection.deleteOne({ _id: new ObjectId(id) });

//         if (result.deletedCount > 0) {
//           res.status(200).send({ message: "Order deleted", deletedCount: result.deletedCount });
//         } else {
//           res.status(404).send({ message: "Order not found" });
//         }
//       } catch (error) {
//         console.error("Delete order error:", error);
//         res.status(500).send({ message: "Internal server error" });
//       }
//     });

//     // app.get("/admin/stats/totalPayments", async (req, res) => {
//     //   const result = await paymentCollection.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray();
//     //   res.send({ totalPayments: result[0].total || 0 });
//     // });
//     // --------Contact api----------
//     app.post("/contact", async (req, res) => {
//       const message = req.body;
//       message.createdAt = new Date();
//       const result = await contactCollection.insertOne(message);
//       if (result.insertedId) {
//         return res.send({ success: true });
//       }
//       res.send({ success: false });
//     });

//     // Connect the client to the server	(optional starting in v4.7)
//     // await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error

//     //await client.close();
//   }
// }
// run().catch(console.dir);


// app.get('/', (req, res) => {
//   res.send('Hello from Server..')
// })

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`)
// })




// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const admin = require("firebase-admin");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// const app = express();
// const port = process.env.PORT || 3000;

// // ================= Stripe =================
// let stripe;
// if (process.env.STRIPE_SECRET_KEY) {
//   stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// } else {
//   console.warn("⚠️ STRIPE_SECRET_KEY missing");
// }

// // ================= Firebase =================
// try {
//   const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
//     ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
//     : require("./serviceAccountKey.json");

//   if (!admin.apps.length) {
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//   }
// } catch (error) {
//   console.error("Firebase Error:", error.message);
// }

// // ================= Middleware =================
// // app.use(
// //   cors({
// //     origin: [process.env.CLIENT_DOMAIN || "http://localhost:5173"],
// //     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //     credentials: true,
// //   })
// // );
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://local-chef-bazaar-pied.vercel.app",
//     ],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );
// app.use(express.json());

// // ================= MongoDB =================
// const uri = `mongodb+srv://${process.env.use_Name}:${process.env.user_Pass}@allunityit.looszdp.mongodb.net/?retryWrites=true&w=majority&appName=AllUnityIt`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// // ================= Verify Firebase Token =================
// const verifyFBToken = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).send({ message: "Unauthorized access" });
//     }
//     const token = authHeader.split(" ")[1];
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.decoded_email = decoded.email;
//     next();
//   } catch (error) {
//     console.error("Token Error:", error.message);
//     return res.status(401).send({ message: "Unauthorized access" });
//   }
// };

// async function run() {
//   try {
//     const db = client.db("LocalChefBazzaarBD");

//     const usersCollection = db.collection("users");
//     const mealsCollection = db.collection("meals");
//     const ordersCollection = db.collection("orders");
//     const reviewsCollection = db.collection("reviews");
//     const favouriteCollection = db.collection("favourites");
//     const paymentsCollection = db.collection("payments");
//     const requestsCollection = db.collection("requests");
//     const contactCollection = db.collection("contacts");

//     // ================= Verify Admin =================
//     const verifyAdmin = async (req, res, next) => {
//       try {
//         const email = req.decoded_email;
//         const user = await usersCollection.findOne({ email });
//         if (!user) {
//           return res.status(404).send({ error: "User not found" });
//         }
//         if (user.role !== "admin") {
//           return res.status(403).send({ error: "Admin access denied" });
//         }
//         next();
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Admin verification failed" });
//       }
//     };

//     // ================= Verify Chef =================
//     const verifyChef = async (req, res, next) => {
//       try {
//         const email = req.decoded_email;
//         const user = await usersCollection.findOne({ email });
//         if (!user) {
//           return res.status(404).send({ error: "User not found" });
//         }
//         if (user.role !== "chef") {
//           return res.status(403).send({ error: "Chef access denied" });
//         }
//         next();
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Chef verification failed" });
//       }
//     };

//     // ================= Verify Fraud =================
//     const verifyFraud = async (req, res, next) => {
//       try {
//         const email = req.decoded_email;
//         const user = await usersCollection.findOne({ email });
//         if (!user) {
//           return res.status(404).send({ error: "User not found" });
//         }
//         if (user.status === "fraud") {
//           return res.status(403).send({ error: "Fraud user blocked" });
//         }
//         next();
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Fraud verification failed" });
//       }
//     };

//     // =========================================================
//     // USERS API
//     // =========================================================

//     // Create user
//     app.post("/users", async (req, res) => {
//       try {
//         const user = req.body;
//         const exists = await usersCollection.findOne({ email: user.email });
//         if (exists) {
//           return res.send({ message: "User already exists" });
//         }
//         user.role = "user";
//         user.status = "active";
//         user.createdAt = new Date();
//         const result = await usersCollection.insertOne(user);
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to create user" });
//       }
//     });

//     // Get all users (admin)
//     app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const allUsers = await usersCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .toArray();
//         res.send(allUsers);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch users" });
//       }
//     });

//     // Get user role by email — PUBLIC (no auth needed)
//     app.get("/users/:email/role", async (req, res) => {
//       try {
//         const email = req.params.email;
//         const user = await usersCollection.findOne({ email });
//         res.send({ role: user?.role || "user" });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to get role" });
//       }
//     });

//     // Get single user by email (profile page)
//     app.get("/users/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email) {
//           return res.status(403).send({ error: "Access denied" });
//         }
//         const user = await usersCollection.findOne({ email });
//         if (!user) return res.status(404).send({ error: "User not found" });
//         res.send(user);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to get user" });
//       }
//     });

//     // Mark user as fraud (admin)
//     app.patch(
//       "/users/fraud/:email",
//       verifyFBToken,
//       verifyAdmin,
//       async (req, res) => {
//         try {
//           const email = req.params.email;
//           const result = await usersCollection.updateOne(
//             { email },
//             { $set: { status: "fraud" } }
//           );
//           res.send({ success: result.modifiedCount > 0 });
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ error: "Failed to update user status" });
//         }
//       }
//     );

//     // =========================================================
//     // REQUESTS API
//     // =========================================================

//     // Create request
//     app.post("/requests", verifyFBToken, async (req, res) => {
//       try {
//         const request = req.body;
//         request.requestStatus = "pending";
//         request.requestTime = new Date();
//         const result = await requestsCollection.insertOne(request);
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to create request" });
//       }
//     });

//     // Get requests by user email
//     app.get("/requests/:email", async (req, res) => {
//       try {
//         const email = req.params.email;
//         const requests = await requestsCollection
//           .find({ userEmail: email })
//           .sort({ requestTime: -1 })
//           .toArray();
//         res.send(requests);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch requests" });
//       }
//     });

//     // Get all requests (admin)
//     app.get("/requests", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const requests = await requestsCollection
//           .find()
//           .sort({ requestTime: -1 })
//           .toArray();
//         res.send(requests);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch requests" });
//       }
//     });

//     // Update request status (admin)
//     app.patch(
//       "/requests/update/:id",
//       verifyFBToken,
//       verifyAdmin,
//       async (req, res) => {
//         try {
//           const id = req.params.id;
//           const { requestStatus, userEmail, requestType } = req.body;

//           if (!ObjectId.isValid(id)) {
//             return res
//               .status(400)
//               .send({ success: false, message: "Invalid ID format" });
//           }

//           const requestUpdate = await requestsCollection.updateOne(
//             { _id: new ObjectId(id) },
//             { $set: { requestStatus } }
//           );

//           if (requestUpdate.modifiedCount === 0) {
//             return res.send({
//               success: false,
//               message: "Request update failed",
//             });
//           }

//           if (requestStatus === "approved") {
//             let updateData = {};
//             if (requestType === "chef") {
//               const chefId = "chef-" + Math.floor(1000 + Math.random() * 9000);
//               updateData = { role: "chef", chefId };
//             }
//             if (requestType === "admin") {
//               updateData = { role: "admin" };
//             }
//             await usersCollection.updateOne(
//               { email: userEmail },
//               { $set: updateData }
//             );
//           }

//           res.send({ success: true, message: "Request processed successfully" });
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ error: "Failed to update request" });
//         }
//       }
//     );

//     // =========================================================
//     // MEALS API
//     // =========================================================

//     // Create meal (chef only)
//     app.post(
//       "/meals",
//       verifyFBToken,
//       verifyFraud,
//       verifyChef,
//       async (req, res) => {
//         try {
//           const meal = req.body;
//           if (req.decoded_email !== meal.userEmail) {
//             return res.status(403).send({ error: "Access denied" });
//           }
//           meal.createdAt = new Date();
//           const result = await mealsCollection.insertOne(meal);
//           res.send({ success: true, insertedId: result.insertedId });
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ success: false, error: "Failed to create meal" });
//         }
//       }
//     );

//     // Latest meals (home page) — supports both spellings
//     app.get("/latestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .limit(8)
//           .toArray();
//         res.send(meals);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch latest meals" });
//       }
//     });

//     // typo alias so old frontend calls still work
//     app.get("/leatestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .limit(8)
//           .toArray();
//         res.send(meals);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch latest meals" });
//       }
//     });

//     // All meals with pagination
//     app.get("/meals", async (req, res) => {
//       try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;
//         const total = await mealsCollection.countDocuments();
//         const meals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .toArray();
//         res.send({ total, page, limit, meals });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch meals" });
//       }
//     });

//     // Meals by chef email — must be before /meals/:id
//     app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email) {
//           return res.status(403).send({ error: "Access denied" });
//         }
//         const meals = await mealsCollection
//           .find({ userEmail: email })
//           .sort({ createdAt: -1 })
//           .toArray();
//         res.send(meals);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch meals" });
//       }
//     });

//     // Single meal by id
//     app.get("/meals/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) {
//           return res.status(400).send({ error: "Invalid meal ID" });
//         }
//         const meal = await mealsCollection.findOne({
//           _id: new ObjectId(id),
//         });
//         if (!meal) return res.status(404).send({ error: "Meal not found" });
//         res.send(meal);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch meal" });
//       }
//     });

//     // Delete meal
//     app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) {
//           return res.status(400).send({ error: "Invalid meal ID" });
//         }
//         const result = await mealsCollection.deleteOne({
//           _id: new ObjectId(id),
//         });
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to delete meal" });
//       }
//     });

//     // Update meal
//     app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) {
//           return res.status(400).send({ error: "Invalid meal ID" });
//         }
//         const updatedData = req.body;
//         const result = await mealsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: updatedData }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to update meal" });
//       }
//     });

//     // =========================================================
//     // REVIEWS API
//     // =========================================================

//     // Create review
//     app.post("/reviews", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const review = req.body;
//         const exists = await reviewsCollection.findOne({
//           foodId: review.foodId,
//           reviewerEmail: review.reviewerEmail,
//         });
//         if (exists) {
//           return res.send({
//             success: false,
//             message: "You have already reviewed this meal",
//           });
//         }
//         const result = await reviewsCollection.insertOne(review);

//         // Update meal average rating
//         if (ObjectId.isValid(review.foodId)) {
//           const allReviews = await reviewsCollection
//             .find({ foodId: review.foodId })
//             .toArray();
//           const total = allReviews.reduce(
//             (sum, r) => sum + Number(r.rating || 0),
//             0
//           );
//           const avgRating = Number((total / allReviews.length).toFixed(2));
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: avgRating } }
//           );
//         }

//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to create review" });
//       }
//     });

//     // Get all reviews (home page / public)
//     app.get("/reviews", async (req, res) => {
//       try {
//         const reviews = await reviewsCollection
//           .find()
//           .sort({ date: -1 })
//           .limit(10)
//           .toArray();
//         res.send(reviews);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch reviews" });
//       }
//     });

//     // Get reviews by email (my reviews page) — must be before /reviews/:mealId
//     app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email) {
//           return res.status(403).send({ error: "Access denied" });
//         }
//         const result = await reviewsCollection
//           .find({ reviewerEmail: email })
//           .toArray();
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch reviews" });
//       }
//     });

//     // Get reviews by meal id
//     app.get("/reviews/:mealId", async (req, res) => {
//       try {
//         const mealId = req.params.mealId;
//         const reviews = await reviewsCollection
//           .find({ foodId: mealId })
//           .toArray();
//         res.send(reviews);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch reviews" });
//       }
//     });

//     // Delete review
//     app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const review = await reviewsCollection.findOne({
//           _id: new ObjectId(id),
//         });
//         const deleteResult = await reviewsCollection.deleteOne({
//           _id: new ObjectId(id),
//         });

//         if (review && ObjectId.isValid(review.foodId)) {
//           const remaining = await reviewsCollection
//             .find({ foodId: review.foodId })
//             .toArray();
//           let newRating = 0;
//           if (remaining.length > 0) {
//             const total = remaining.reduce(
//               (sum, r) => sum + Number(r.rating || 0),
//               0
//             );
//             newRating = Number((total / remaining.length).toFixed(2));
//           }
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: newRating } }
//           );
//         }

//         res.send({
//           success: deleteResult.deletedCount > 0,
//           message: "Review deleted successfully",
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to delete review" });
//       }
//     });

//     // Update review
//     app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const { rating, comment } = req.body;
//         const review = await reviewsCollection.findOne({
//           _id: new ObjectId(id),
//         });

//         await reviewsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: { rating: Number(rating), comment, date: new Date() } }
//         );

//         if (review && ObjectId.isValid(review.foodId)) {
//           const allRatings = await reviewsCollection
//             .find({ foodId: review.foodId })
//             .toArray();
//           let avgRating = 0;
//           if (allRatings.length > 0) {
//             const total = allRatings.reduce(
//               (sum, r) => sum + Number(r.rating || 0),
//               0
//             );
//             avgRating = Number((total / allRatings.length).toFixed(2));
//           }
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: avgRating } }
//           );
//         }

//         res.send({ success: true, message: "Review updated successfully" });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to update review" });
//       }
//     });

//     // =========================================================
//     // FAVOURITES API
//     // =========================================================

//     // Add favourite
//     app.post("/favorites", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const favourite = req.body;
//         const exists = await favouriteCollection.findOne({
//           userEmail: favourite.userEmail,
//           mealId: favourite.mealId,
//         });
//         if (exists) {
//           return res.send({
//             success: false,
//             message: "Already added to favourites",
//           });
//         }
//         favourite.addedTime = new Date();
//         const result = await favouriteCollection.insertOne(favourite);
//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to add favourite" });
//       }
//     });

//     // Get favourites by email
//     app.get("/favorites/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         const result = await favouriteCollection
//           .find({ userEmail: email })
//           .toArray();
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch favourites" });
//       }
//     });

//     // Delete favourite
//     app.delete("/favourites/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const result = await favouriteCollection.deleteOne({
//           _id: new ObjectId(id),
//         });
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to delete favourite" });
//       }
//     });

//     // =========================================================
//     // ORDERS API
//     // =========================================================

//     // Create order
//     app.post("/orders", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const order = req.body;
//         order.orderTime = new Date();
//         order.orderStatus = "pending";
//         order.paymentStatus = "pending";
//         const result = await ordersCollection.insertOne(order);
//         res.send({ insertedId: result.insertedId });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to create order" });
//       }
//     });

//     // Get orders by user email — must be before /orders/:id
//     app.get("/orders/by-user/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         const result = await ordersCollection
//           .find({ userEmail: email })
//           .sort({ orderTime: -1 })
//           .toArray();
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch orders" });
//       }
//     });

//     // Get orders by chef email — must be before /orders/:id
//     app.get(
//       "/orders/by-chef/:chefEmail",
//       verifyFBToken,
//       verifyChef,
//       async (req, res) => {
//         try {
//           const chefEmail = req.params.chefEmail;
//           const orders = await ordersCollection
//             .find({ chefEmail })
//             .sort({ orderTime: -1 })
//             .toArray();
//           res.send(orders);
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ error: "Failed to fetch orders" });
//         }
//       }
//     );

//     // Update order status (chef)
//     app.patch(
//       "/orders/update/:id",
//       verifyFBToken,
//       verifyChef,
//       async (req, res) => {
//         try {
//           const id = req.params.id;
//           const { status } = req.body;
//           const allowed = ["pending", "accepted", "cancelled", "delivered"];
//           if (!allowed.includes(status)) {
//             return res.status(400).send({ error: "Invalid status" });
//           }
//           const result = await ordersCollection.updateOne(
//             { _id: new ObjectId(id) },
//             { $set: { orderStatus: status } }
//           );
//           res.send({ success: result.modifiedCount > 0 });
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ error: "Failed to update order" });
//         }
//       }
//     );

//     // Get single order by id
//     app.get("/orders/:id", async (req, res) => {
//       try {
//         const id = req.params.id;
//         if (!ObjectId.isValid(id)) {
//           return res.status(400).json({ message: "Invalid order ID" });
//         }
//         const order = await ordersCollection.findOne({
//           _id: new ObjectId(id),
//         });
//         if (!order)
//           return res.status(404).json({ message: "Order not found" });
//         res.json(order);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal server error" });
//       }
//     });

//     // Delete order
//     app.delete("/orders/:id", verifyFBToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const result = await ordersCollection.deleteOne({
//           _id: new ObjectId(id),
//         });
//         if (result.deletedCount > 0) {
//           res.send({ message: "Order deleted", deletedCount: result.deletedCount });
//         } else {
//           res.status(404).send({ message: "Order not found" });
//         }
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Internal server error" });
//       }
//     });

//     // =========================================================
//     // PAYMENTS API
//     // =========================================================

//     // Create Stripe checkout session
//     app.post(
//       "/order-payment-checkout",
//       verifyFBToken,
//       async (req, res) => {
//         if (!stripe) {
//           return res
//             .status(500)
//             .send({ error: "Stripe is not configured on the server." });
//         }
//         try {
//           const info = req.body;
//           const amount = parseInt(info.price) * 100;

//           const session = await stripe.checkout.sessions.create({
//             line_items: [
//               {
//                 price_data: {
//                   currency: "usd",
//                   unit_amount: amount,
//                   product_data: {
//                     name: `Payment for ${info.mealName}`,
//                   },
//                 },
//                 quantity: info.quantity,
//               },
//             ],
//             mode: "payment",
//             metadata: {
//               orderId: info.orderId,
//               mealName: info.mealName,
//             },
//             customer_email: info.userEmail,
//             success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-cancelled`,
//           });

//           res.send({ url: session.url });
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ error: "Payment session creation failed" });
//         }
//       }
//     );

//     // Verify payment success (Stripe)
//     app.get("/payment-success", async (req, res) => {
//       const { sessionId } = req.query;
//       if (!sessionId)
//         return res.status(400).json({ error: "Session ID is required" });
//       if (!stripe) {
//         return res
//           .status(500)
//           .send({ error: "Stripe is not configured on the server." });
//       }
//       try {
//         const session = await stripe.checkout.sessions.retrieve(sessionId);
//         res.json({ success: true, session });
//       } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Could not verify payment" });
//       }
//     });

//     // Update order after successful payment
//     app.patch(
//       "/order-payment-success",
//       verifyFBToken,
//       async (req, res) => {
//         if (!stripe) {
//           return res
//             .status(500)
//             .send({ error: "Stripe is not configured on the server." });
//         }
//         try {
//           const sessionId = req.query.session_id;
//           const session =
//             await stripe.checkout.sessions.retrieve(sessionId);
//           const transactionId = session.payment_intent;

//           if (session.payment_status === "paid") {
//             const orderId = session.metadata.orderId;

//             await ordersCollection.updateOne(
//               { _id: new ObjectId(orderId) },
//               {
//                 $set: {
//                   paymentStatus: "paid",
//                   transactionId,
//                   paidAt: new Date(),
//                 },
//               }
//             );

//             const payment = {
//               amount: session.amount_total / 100,
//               currency: session.currency,
//               userEmail: session.customer_email,
//               orderId,
//               mealName: session.metadata.mealName,
//               transactionId,
//               paymentStatus: session.payment_status,
//               paidAt: new Date(),
//             };

//             await paymentsCollection.updateOne(
//               { transactionId },
//               { $setOnInsert: payment },
//               { upsert: true }
//             );

//             return res.send({ success: true });
//           }

//           res.send({ success: false });
//         } catch (error) {
//           console.error(error);
//           res.status(500).send({ error: "Payment update failed" });
//         }
//       }
//     );

//     // Get all payments (admin)
//     app.get("/payments", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const payments = await paymentsCollection
//           .find()
//           .sort({ paidAt: -1 })
//           .toArray();
//         res.send(payments);
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to fetch payments" });
//       }
//     });

//     // =========================================================
//     // ADMIN STATS API
//     // =========================================================

//     app.get("/admin/stats/totalUsers", async (req, res) => {
//       try {
//         const count = await usersCollection.countDocuments();
//         res.send({ totalUsers: count });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ totalUsers: 0 });
//       }
//     });

//     app.get("/admin/stats/ordersPending", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({
//           orderStatus: "pending",
//         });
//         res.send({ pendingOrders: count });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ pendingOrders: 0 });
//       }
//     });

//     app.get("/admin/stats/ordersDelivered", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({
//           orderStatus: "delivered",
//         });
//         res.send({ deliveredOrders: count });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ deliveredOrders: 0 });
//       }
//     });

//     app.get("/admin/stats/totalPayments", async (req, res) => {
//       try {
//         const result = await paymentsCollection
//           .aggregate([
//             { $group: { _id: null, total: { $sum: "$amount" } } },
//           ])
//           .toArray();
//         res.send({ totalPayments: result[0]?.total || 0 });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ totalPayments: 0 });
//       }
//     });

//     // =========================================================
//     // CONTACT API
//     // =========================================================

//     app.post("/contact", async (req, res) => {
//       try {
//         const message = req.body;
//         message.createdAt = new Date();
//         const result = await contactCollection.insertOne(message);
//         res.send({ success: !!result.insertedId });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: "Failed to send message" });
//       }
//     });

//     // =========================================================
//     // ROOT
//     // =========================================================
//     app.get("/", (req, res) => {
//       res.send("🍽️ LocalChef Bazzaar Server Running...");
//     });

//     await client.db("admin").command({ ping: 1 });
//     console.log("✅ MongoDB Connected");
//   } catch (error) {
//     console.error("❌ Server startup error:", error);
//   }
// }

// run().catch(console.dir);

// app.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });

// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const admin = require("firebase-admin");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// const app = express();
// const port = process.env.PORT || 3000;

// // ================= STRIPE =================
// let stripe;
// if (process.env.STRIPE_SECRET_KEY) {
//   stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// } else {
//   console.warn("⚠️ STRIPE_SECRET_KEY missing");
// }

// // ================= MIDDLEWARE =================
// app.use(
//   cors({
//     origin: process.env.CLIENT_DOMAIN?.split(",") || [
//       "http://localhost:5173",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use(express.json());

// // ================= FIREBASE =================
// try {
//   const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
//     ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
//     : require("./serviceAccountKey.json");

//   if (!admin.apps.length) {
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//   }
// } catch (err) {
//   console.error("Firebase error:", err.message);
// }

// // ================= MONGODB =================
// const uri = `mongodb+srv://${process.env.use_Name}:${process.env.user_Pass}@allunityit.looszdp.mongodb.net/?retryWrites=true&w=majority`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// // ================= VERIFY TOKEN =================
// const verifyFBToken = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).send({ message: "Unauthorized" });
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.decoded_email = decoded.email;
//     next();
//   } catch (err) {
//     return res.status(401).send({ message: "Invalid token" });
//   }
// };

// // ================= MAIN =================
// async function run() {
//   try {
//     const db = client.db("LocalChefBazzaarBD");

//     const usersCollection     = db.collection("users");
//     const mealsCollection     = db.collection("meals");
//     const ordersCollection    = db.collection("orders");
//     const reviewsCollection   = db.collection("reviews");
//     const favouriteCollection = db.collection("favourites");
//     const paymentsCollection  = db.collection("payments");
//     const requestsCollection  = db.collection("requests");
//     const contactCollection   = db.collection("contacts");

//     await client.db("admin").command({ ping: 1 });
//     console.log("✅ MongoDB Connected");

//     // ================= VERIFY ADMIN =================
//     const verifyAdmin = async (req, res, next) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.decoded_email });
//         if (!user) return res.status(404).send({ error: "User not found" });
//         if (user.role !== "admin") return res.status(403).send({ error: "Admin access denied" });
//         next();
//       } catch (err) {
//         res.status(500).send({ error: "Admin verification failed" });
//       }
//     };

//     // ================= VERIFY CHEF =================
//     const verifyChef = async (req, res, next) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.decoded_email });
//         if (!user) return res.status(404).send({ error: "User not found" });
//         if (user.role !== "chef") return res.status(403).send({ error: "Chef access denied" });
//         next();
//       } catch (err) {
//         res.status(500).send({ error: "Chef verification failed" });
//       }
//     };

//     // ================= VERIFY FRAUD =================
//     const verifyFraud = async (req, res, next) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.decoded_email });
//         if (!user) return res.status(404).send({ error: "User not found" });
//         if (user.status === "fraud") return res.status(403).send({ error: "Fraud user blocked" });
//         next();
//       } catch (err) {
//         res.status(500).send({ error: "Fraud verification failed" });
//       }
//     };

//     // ================= ROOT =================
//     app.get("/", (req, res) => {
//       res.send("🍽️ LocalChef Bazzaar Server Running...");
//     });

//     // =====================================================
//     // USERS API
//     // =====================================================

//     // Create user
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
//       } catch (err) {
//         res.status(500).send({ error: "Failed to create user" });
//       }
//     });

//     // Get all users (admin)
//     app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const allUsers = await usersCollection.find().sort({ createdAt: -1 }).toArray();
//         res.send(allUsers);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch users" });
//       }
//     });

//     // Get user role by email — PUBLIC (legacy route)
//     app.get("/users/:email/role", async (req, res) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.params.email });
//         res.send({ role: user?.role || "user" });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to get role" });
//       }
//     });

//     // Get user role by email — API route (new)
//     app.get("/api/users/:email/role", async (req, res) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.params.email });
//         res.send({ role: user?.role || "user" });
//       } catch (err) {
//         res.status(500).send({ role: "user" });
//       }
//     });

//     // Get single user by email (profile page)
//     app.get("/users/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email) return res.status(403).send({ error: "Access denied" });
//         const user = await usersCollection.findOne({ email });
//         if (!user) return res.status(404).send({ error: "User not found" });
//         res.send(user);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to get user" });
//       }
//     });

//     // Mark user as fraud (admin)
//     app.patch("/users/fraud/:email", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const result = await usersCollection.updateOne(
//           { email: req.params.email },
//           { $set: { status: "fraud" } }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to update user status" });
//       }
//     });

//     // =====================================================
//     // REQUESTS API
//     // =====================================================

//     // Create request
//     app.post("/requests", verifyFBToken, async (req, res) => {
//       try {
//         const request = req.body;
//         request.requestStatus = "pending";
//         request.requestTime = new Date();
//         const result = await requestsCollection.insertOne(request);
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to create request" });
//       }
//     });

//     // Get all requests (admin) — must be before /requests/:email
//     app.get("/requests", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const requests = await requestsCollection.find().sort({ requestTime: -1 }).toArray();
//         res.send(requests);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch requests" });
//       }
//     });

//     // Get requests by user email
//     app.get("/requests/:email", async (req, res) => {
//       try {
//         const requests = await requestsCollection
//           .find({ userEmail: req.params.email })
//           .sort({ requestTime: -1 })
//           .toArray();
//         res.send(requests);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch requests" });
//       }
//     });

//     // Update request status (admin)
//     app.patch("/requests/update/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const { id } = req.params;
//         const { requestStatus, userEmail, requestType } = req.body;

//         if (!ObjectId.isValid(id)) {
//           return res.status(400).send({ success: false, message: "Invalid ID format" });
//         }

//         const requestUpdate = await requestsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: { requestStatus } }
//         );

//         if (requestUpdate.modifiedCount === 0) {
//           return res.send({ success: false, message: "Request update failed" });
//         }

//         if (requestStatus === "approved") {
//           let updateData = {};
//           if (requestType === "chef") {
//             const chefId = "chef-" + Math.floor(1000 + Math.random() * 9000);
//             updateData = { role: "chef", chefId };
//           }
//           if (requestType === "admin") {
//             updateData = { role: "admin" };
//           }
//           await usersCollection.updateOne({ email: userEmail }, { $set: updateData });
//         }

//         res.send({ success: true, message: "Request processed successfully" });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to update request" });
//       }
//     });

//     // =====================================================
//     // MEALS API
//     // =====================================================

//     // Create meal (chef only)
//     app.post("/meals", verifyFBToken, verifyFraud, verifyChef, async (req, res) => {
//       try {
//         const meal = req.body;
//         if (req.decoded_email !== meal.userEmail) {
//           return res.status(403).send({ error: "Access denied" });
//         }
//         meal.createdAt = new Date();
//         const result = await mealsCollection.insertOne(meal);
//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (err) {
//         res.status(500).send({ success: false, error: "Failed to create meal" });
//       }
//     });

//     // Latest meals (home page)
//     app.get("/latestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
//         res.send(meals);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch latest meals" });
//       }
//     });

//     // Typo alias — old frontend calls still work
//     app.get("/leatestMeals", async (req, res) => {
//       try {
//         const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
//         res.send(meals);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch latest meals" });
//       }
//     });

//     // All meals with pagination
//     app.get("/meals", async (req, res) => {
//       try {
//         const page  = parseInt(req.query.page)  || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip  = (page - 1) * limit;
//         const total = await mealsCollection.countDocuments();
//         const meals = await mealsCollection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
//         res.send({ total, page, limit, meals });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch meals" });
//       }
//     });

//     // Meals by chef email — must be BEFORE /meals/:id
//     app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email) return res.status(403).send({ error: "Access denied" });
//         const meals = await mealsCollection.find({ userEmail: email }).sort({ createdAt: -1 }).toArray();
//         res.send(meals);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch meals" });
//       }
//     });

//     // Single meal by id
//     app.get("/meals/:id", verifyFBToken, async (req, res) => {
//       try {
//         const { id } = req.params;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid meal ID" });
//         const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });
//         if (!meal) return res.status(404).send({ error: "Meal not found" });
//         res.send(meal);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch meal" });
//       }
//     });

//     // Delete meal
//     app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const { id } = req.params;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid meal ID" });
//         const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to delete meal" });
//       }
//     });

//     // Update meal
//     app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const { id } = req.params;
//         if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid meal ID" });
//         const result = await mealsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: req.body }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to update meal" });
//       }
//     });

//     // =====================================================
//     // REVIEWS API
//     // =====================================================

//     // Create review
//     app.post("/reviews", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const review = req.body;
//         const exists = await reviewsCollection.findOne({
//           foodId: review.foodId,
//           reviewerEmail: review.reviewerEmail,
//         });
//         if (exists) return res.send({ success: false, message: "You have already reviewed this meal" });

//         const result = await reviewsCollection.insertOne(review);

//         if (ObjectId.isValid(review.foodId)) {
//           const allReviews = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//           const total = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
//           const avgRating = Number((total / allReviews.length).toFixed(2));
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: avgRating } }
//           );
//         }

//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to create review" });
//       }
//     });

//     // Get all reviews (public / home page)
//     app.get("/reviews", async (req, res) => {
//       try {
//         const reviews = await reviewsCollection.find().sort({ date: -1 }).limit(10).toArray();
//         res.send(reviews);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch reviews" });
//       }
//     });

//     // Get reviews by email — must be BEFORE /reviews/:mealId
//     app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         if (req.decoded_email !== email) return res.status(403).send({ error: "Access denied" });
//         const result = await reviewsCollection.find({ reviewerEmail: email }).toArray();
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch reviews" });
//       }
//     });

//     // Get reviews by meal id
//     app.get("/reviews/:mealId", async (req, res) => {
//       try {
//         const reviews = await reviewsCollection.find({ foodId: req.params.mealId }).toArray();
//         res.send(reviews);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch reviews" });
//       }
//     });

//     // Delete review
//     app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
//       try {
//         const { id } = req.params;
//         const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
//         const deleteResult = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

//         if (review && ObjectId.isValid(review.foodId)) {
//           const remaining = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//           let newRating = 0;
//           if (remaining.length > 0) {
//             const total = remaining.reduce((sum, r) => sum + Number(r.rating || 0), 0);
//             newRating = Number((total / remaining.length).toFixed(2));
//           }
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: newRating } }
//           );
//         }

//         res.send({ success: deleteResult.deletedCount > 0, message: "Review deleted successfully" });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to delete review" });
//       }
//     });

//     // Update review
//     app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
//       try {
//         const { id } = req.params;
//         const { rating, comment } = req.body;
//         const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

//         await reviewsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: { rating: Number(rating), comment, date: new Date() } }
//         );

//         if (review && ObjectId.isValid(review.foodId)) {
//           const allRatings = await reviewsCollection.find({ foodId: review.foodId }).toArray();
//           let avgRating = 0;
//           if (allRatings.length > 0) {
//             const total = allRatings.reduce((sum, r) => sum + Number(r.rating || 0), 0);
//             avgRating = Number((total / allRatings.length).toFixed(2));
//           }
//           await mealsCollection.updateOne(
//             { _id: new ObjectId(review.foodId) },
//             { $set: { rating: avgRating } }
//           );
//         }

//         res.send({ success: true, message: "Review updated successfully" });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to update review" });
//       }
//     });

//     // =====================================================
//     // FAVOURITES API
//     // =====================================================

//     // Add favourite
//     app.post("/favorites", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const favourite = req.body;
//         const exists = await favouriteCollection.findOne({
//           userEmail: favourite.userEmail,
//           mealId: favourite.mealId,
//         });
//         if (exists) return res.send({ success: false, message: "Already added to favourites" });
//         favourite.addedTime = new Date();
//         const result = await favouriteCollection.insertOne(favourite);
//         res.send({ success: true, insertedId: result.insertedId });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to add favourite" });
//       }
//     });

//     // Get favourites by email
//     app.get("/favorites/:email", verifyFBToken, async (req, res) => {
//       try {
//         const result = await favouriteCollection.find({ userEmail: req.params.email }).toArray();
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch favourites" });
//       }
//     });

//     // Delete favourite
//     app.delete("/favourites/:id", verifyFBToken, async (req, res) => {
//       try {
//         const result = await favouriteCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to delete favourite" });
//       }
//     });

//     // =====================================================
//     // ORDERS API
//     // =====================================================

//     // Create order
//     app.post("/orders", verifyFBToken, verifyFraud, async (req, res) => {
//       try {
//         const order = req.body;
//         order.orderTime = new Date();
//         order.orderStatus = "pending";
//         order.paymentStatus = "pending";
//         const result = await ordersCollection.insertOne(order);
//         res.send({ insertedId: result.insertedId });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to create order" });
//       }
//     });

//     // Get orders by user email — must be BEFORE /orders/:id
//     app.get("/orders/by-user/:email", verifyFBToken, async (req, res) => {
//       try {
//         const email = req.params.email;
//         const orders = await ordersCollection
//           .find({ userEmail: email })
//           .sort({ orderTime: -1 })
//           .toArray();
//         res.send(orders);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch orders" });
//       }
//     });

//     // Get orders by chef email — must be BEFORE /orders/:id
//     app.get("/orders/by-chef/:chefEmail", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const orders = await ordersCollection
//           .find({ chefEmail: req.params.chefEmail })
//           .sort({ orderTime: -1 })
//           .toArray();
//         res.send(orders);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch orders" });
//       }
//     });

//     // Update order status (chef) — must be BEFORE /orders/:id
//     app.patch("/orders/update/:id", verifyFBToken, verifyChef, async (req, res) => {
//       try {
//         const { status } = req.body;
//         const allowed = ["pending", "accepted", "cancelled", "delivered"];
//         if (!allowed.includes(status)) return res.status(400).send({ error: "Invalid status" });
//         const result = await ordersCollection.updateOne(
//           { _id: new ObjectId(req.params.id) },
//           { $set: { orderStatus: status } }
//         );
//         res.send({ success: result.modifiedCount > 0 });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to update order" });
//       }
//     });

//     // Get single order by id
//     app.get("/orders/:id", async (req, res) => {
//       try {
//         const { id } = req.params;
//         if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid order ID" });
//         const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
//         if (!order) return res.status(404).json({ message: "Order not found" });
//         res.json(order);
//       } catch (err) {
//         res.status(500).json({ message: "Internal server error" });
//       }
//     });

//     // Delete order
//     app.delete("/orders/:id", verifyFBToken, async (req, res) => {
//       try {
//         const result = await ordersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//         if (result.deletedCount > 0) {
//           res.send({ message: "Order deleted", deletedCount: result.deletedCount });
//         } else {
//           res.status(404).send({ message: "Order not found" });
//         }
//       } catch (err) {
//         res.status(500).send({ message: "Internal server error" });
//       }
//     });

//     // =====================================================
//     // PAYMENTS API
//     // =====================================================

//     // Create Stripe checkout session
//     app.post("/order-payment-checkout", verifyFBToken, async (req, res) => {
//       if (!stripe) return res.status(500).send({ error: "Stripe is not configured on the server." });
//       try {
//         const info = req.body;
//         const amount = parseInt(info.price) * 100;
//         const session = await stripe.checkout.sessions.create({
//           line_items: [
//             {
//               price_data: {
//                 currency: "usd",
//                 unit_amount: amount,
//                 product_data: { name: `Payment for ${info.mealName}` },
//               },
//               quantity: info.quantity,
//             },
//           ],
//           mode: "payment",
//           metadata: { orderId: info.orderId, mealName: info.mealName },
//           customer_email: info.userEmail,
//           success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//           cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-cancelled`,
//         });
//         res.send({ url: session.url });
//       } catch (err) {
//         res.status(500).send({ error: "Payment session creation failed" });
//       }
//     });

//     // Verify payment success (Stripe)
//     app.get("/payment-success", async (req, res) => {
//       const { sessionId } = req.query;
//       if (!sessionId) return res.status(400).json({ error: "Session ID is required" });
//       if (!stripe) return res.status(500).send({ error: "Stripe is not configured on the server." });
//       try {
//         const session = await stripe.checkout.sessions.retrieve(sessionId);
//         res.json({ success: true, session });
//       } catch (err) {
//         res.status(500).json({ error: "Could not verify payment" });
//       }
//     });

//     // Update order after successful payment
//     app.patch("/order-payment-success", verifyFBToken, async (req, res) => {
//       if (!stripe) return res.status(500).send({ error: "Stripe is not configured on the server." });
//       try {
//         const sessionId = req.query.session_id;
//         const session = await stripe.checkout.sessions.retrieve(sessionId);
//         const transactionId = session.payment_intent;

//         if (session.payment_status === "paid") {
//           const orderId = session.metadata.orderId;

//           await ordersCollection.updateOne(
//             { _id: new ObjectId(orderId) },
//             { $set: { paymentStatus: "paid", transactionId, paidAt: new Date() } }
//           );

//           const payment = {
//             amount: session.amount_total / 100,
//             currency: session.currency,
//             userEmail: session.customer_email,
//             orderId,
//             mealName: session.metadata.mealName,
//             transactionId,
//             paymentStatus: session.payment_status,
//             paidAt: new Date(),
//           };

//           await paymentsCollection.updateOne(
//             { transactionId },
//             { $setOnInsert: payment },
//             { upsert: true }
//           );

//           return res.send({ success: true });
//         }

//         res.send({ success: false });
//       } catch (err) {
//         res.status(500).send({ error: "Payment update failed" });
//       }
//     });

//     // Get all payments (admin)
//     app.get("/payments", verifyFBToken, verifyAdmin, async (req, res) => {
//       try {
//         const payments = await paymentsCollection.find().sort({ paidAt: -1 }).toArray();
//         res.send(payments);
//       } catch (err) {
//         res.status(500).send({ error: "Failed to fetch payments" });
//       }
//     });

//     // =====================================================
//     // ADMIN STATS API
//     // =====================================================

//     app.get("/admin/stats/totalUsers", async (req, res) => {
//       try {
//         const count = await usersCollection.countDocuments();
//         res.send({ totalUsers: count });
//       } catch (err) {
//         res.status(500).send({ totalUsers: 0 });
//       }
//     });

//     app.get("/admin/stats/ordersPending", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
//         res.send({ pendingOrders: count });
//       } catch (err) {
//         res.status(500).send({ pendingOrders: 0 });
//       }
//     });

//     app.get("/admin/stats/ordersDelivered", async (req, res) => {
//       try {
//         const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
//         res.send({ deliveredOrders: count });
//       } catch (err) {
//         res.status(500).send({ deliveredOrders: 0 });
//       }
//     });

//     app.get("/admin/stats/totalPayments", async (req, res) => {
//       try {
//         const result = await paymentsCollection
//           .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
//           .toArray();
//         res.send({ totalPayments: result[0]?.total || 0 });
//       } catch (err) {
//         res.status(500).send({ totalPayments: 0 });
//       }
//     });

//     // =====================================================
//     // CONTACT API
//     // =====================================================

//     app.post("/contact", async (req, res) => {
//       try {
//         const message = req.body;
//         message.createdAt = new Date();
//         const result = await contactCollection.insertOne(message);
//         res.send({ success: !!result.insertedId });
//       } catch (err) {
//         res.status(500).send({ error: "Failed to send message" });
//       }
//     });

//     // ================= 404 HANDLER (KEEP LAST) =================
//     app.use((req, res) => {
//       res.status(404).send({ error: "Route not found", path: req.originalUrl });
//     });

//   } catch (err) {
//     console.error("❌ Server startup error:", err);
//   }
// }

// run();

// // ================= START =================
// app.listen(port, () => {
//   console.log(`🚀 Server running on port ${port}`);
// });




require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// ── Stripe ──────────────────────────────────────────────────────────────────
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("⚠️  STRIPE_SECRET_KEY missing");
}

// ── Firebase ─────────────────────────────────────────────────────────────────
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require("./serviceAccountKey.json");

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (error) {
  console.error("Firebase Error:", error.message);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.CLIENT_DOMAIN || "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────────────────────
const uri = `mongodb+srv://${process.env.use_Name}:${process.env.user_Pass}@allunityit.looszdp.mongodb.net/?retryWrites=true&w=majority&appName=AllUnityIt`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ── Firebase Token Verify ─────────────────────────────────────────────────────
const verifyFBToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send({ message: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized" });
  }
};

// ── Run ───────────────────────────────────────────────────────────────────────
async function run() {
  try {
    const db = client.db("LocalChefBazzaarBD");

    const usersCollection      = db.collection("users");
    const mealsCollection      = db.collection("meals");
    const ordersCollection     = db.collection("orders");
    const reviewsCollection    = db.collection("reviews");
    const favouriteCollection  = db.collection("favourites");
    const paymentsCollection   = db.collection("payments");
    const requestsCollection   = db.collection("requests");
    const contactCollection    = db.collection("contacts");

    // ── Role Guards ─────────────────────────────────────────────────────────
    const verifyAdmin = async (req, res, next) => {
      const user = await usersCollection.findOne({ email: req.decoded_email });
      if (!user)            return res.status(404).send({ error: "User not found" });
      if (user.role !== "admin") return res.status(403).send({ error: "Admin only" });
      next();
    };

    const verifyChef = async (req, res, next) => {
      const user = await usersCollection.findOne({ email: req.decoded_email });
      if (!user)           return res.status(404).send({ error: "User not found" });
      if (user.role !== "chef") return res.status(403).send({ error: "Chef only" });
      next();
    };

    const verifyFraud = async (req, res, next) => {
      const user = await usersCollection.findOne({ email: req.decoded_email });
      if (!user)                  return res.status(404).send({ error: "User not found" });
      if (user.status === "fraud") return res.status(403).send({ error: "Fraud user blocked" });
      next();
    };

    // ════════════════════════════════════════════════════════════════════════
    // USERS
    // ════════════════════════════════════════════════════════════════════════

    // Create user
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const exists = await usersCollection.findOne({ email: user.email });
        if (exists) return res.send({ message: "User already exists" });
        user.role = "user";
        user.status = "active";
        user.createdAt = new Date();
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create user" });
      }
    });

    // Get all users (admin)
    app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const users = await usersCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Get user by email
    app.get("/users/:email", verifyFBToken, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded_email !== email)
          return res.status(403).send({ error: "Access denied" });
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).send({ error: "User not found" });
        res.send(user);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Get user role
    app.get("/users/:email/role", async (req, res) => {
      try {
        const user = await usersCollection.findOne({ email: req.params.email });
        res.send({ role: user?.role || "user" });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Mark user as fraud
    app.patch("/users/fraud/:email", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const result = await usersCollection.updateOne(
          { email: req.params.email },
          { $set: { status: "fraud" } }
        );
        res.send({ success: result.modifiedCount > 0 });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // REQUESTS
    // ════════════════════════════════════════════════════════════════════════

    app.post("/requests", verifyFBToken, async (req, res) => {
      try {
        const request = req.body;
        request.requestStatus = "pending";
        request.requestTime = new Date();
        const result = await requestsCollection.insertOne(request);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    app.get("/requests", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const requests = await requestsCollection.find().sort({ requestTime: -1 }).toArray();
        res.send(requests);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    app.get("/requests/:email", async (req, res) => {
      try {
        const requests = await requestsCollection
          .find({ userEmail: req.params.email })
          .sort({ requestTime: -1 })
          .toArray();
        res.send(requests);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    app.patch("/requests/update/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const { requestStatus, userEmail, requestType } = req.body;
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send({ success: false });

        await requestsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { requestStatus } }
        );

        if (requestStatus === "approved") {
          let updateData = {};
          if (requestType === "chef") {
            updateData = {
              role: "chef",
              chefId: "chef-" + Math.floor(1000 + Math.random() * 9000),
            };
          } else if (requestType === "admin") {
            updateData = { role: "admin" };
          }
          await usersCollection.updateOne(
            { email: userEmail },
            { $set: updateData }
          );
        }
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // MEALS
    // ════════════════════════════════════════════════════════════════════════

    // Create meal
    app.post("/meals", verifyFBToken, verifyFraud, verifyChef, async (req, res) => {
      try {
        const meal = req.body;
        if (req.decoded_email !== meal.userEmail)
          return res.status(403).send({ error: "Access denied" });
        meal.createdAt = new Date();
        const result = await mealsCollection.insertOne(meal);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, error: "Failed" });
      }
    });

    // Latest meals (typo route kept for compatibility)
    app.get("/leatestMeals", async (req, res) => {
      try {
        const meals = await mealsCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .toArray();
        res.send(meals);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    app.get("/latestMeals", async (req, res) => {
      try {
        const meals = await mealsCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(8)
          .toArray();
        res.send(meals);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // All meals with pagination
    app.get("/meals", async (req, res) => {
      try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip  = (page - 1) * limit;
        const total = await mealsCollection.countDocuments();
        const meals = await mealsCollection
          .find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        res.send({ total, page, limit, meals });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Single meal
    app.get("/meals/:id", verifyFBToken, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
        const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });
        if (!meal) return res.status(404).send({ error: "Meal not found" });
        res.send(meal);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Meals by chef email
    app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded_email !== email)
          return res.status(403).send({ error: "Access denied" });
        const meals = await mealsCollection
          .find({ userEmail: email })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(meals);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Delete meal
    app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
        const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Update meal
    app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
        const result = await mealsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: req.body }
        );
        res.send({ success: result.modifiedCount > 0 });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // REVIEWS
    // ════════════════════════════════════════════════════════════════════════

    app.post("/reviews", verifyFBToken, verifyFraud, async (req, res) => {
      try {
        const review = req.body;
        const exists = await reviewsCollection.findOne({
          foodId: review.foodId,
          reviewerEmail: review.reviewerEmail,
        });
        if (exists)
          return res.send({ success: false, message: "Already reviewed" });
        review.date = new Date();
        const result = await reviewsCollection.insertOne(review);

        // Update meal avg rating
        if (ObjectId.isValid(review.foodId)) {
          const all  = await reviewsCollection.find({ foodId: review.foodId }).toArray();
          const avg  = all.reduce((s, r) => s + Number(r.rating || 0), 0) / all.length;
          await mealsCollection.updateOne(
            { _id: new ObjectId(review.foodId) },
            { $set: { rating: Number(avg.toFixed(2)) } }
          );
        }
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // All reviews (public — home page)
    app.get("/reviews", async (req, res) => {
      try {
        const reviews = await reviewsCollection
          .find()
          .sort({ date: -1 })
          .limit(20)
          .toArray();
        res.send(reviews);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Reviews by meal ID
    app.get("/reviews/:mealId", async (req, res) => {
      try {
        const reviews = await reviewsCollection
          .find({ foodId: req.params.mealId })
          .toArray();
        res.send(reviews);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Reviews by user email
    app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded_email !== email)
          return res.status(403).send({ error: "Access denied" });
        const result = await reviewsCollection
          .find({ reviewerEmail: email })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Delete review
    app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
      try {
        const id = req.params.id;
        const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
        await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
        // Recalculate rating
        if (review && ObjectId.isValid(review.foodId)) {
          const remaining = await reviewsCollection
            .find({ foodId: review.foodId })
            .toArray();
          const avg = remaining.length
            ? remaining.reduce((s, r) => s + Number(r.rating || 0), 0) / remaining.length
            : 0;
          await mealsCollection.updateOne(
            { _id: new ObjectId(review.foodId) },
            { $set: { rating: Number(avg.toFixed(2)) } }
          );
        }
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Update review
    app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
      try {
        const id     = req.params.id;
        const { rating, comment } = req.body;
        const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
        await reviewsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { rating: Number(rating), comment, date: new Date() } }
        );
        if (review && ObjectId.isValid(review.foodId)) {
          const all = await reviewsCollection.find({ foodId: review.foodId }).toArray();
          const avg = all.reduce((s, r) => s + Number(r.rating || 0), 0) / all.length;
          await mealsCollection.updateOne(
            { _id: new ObjectId(review.foodId) },
            { $set: { rating: Number(avg.toFixed(2)) } }
          );
        }
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // FAVOURITES
    // ════════════════════════════════════════════════════════════════════════

    app.post("/favorites", verifyFBToken, verifyFraud, async (req, res) => {
      try {
        const fav    = req.body;
        const exists = await favouriteCollection.findOne({
          userEmail: fav.userEmail,
          mealId:    fav.mealId,
        });
        if (exists)
          return res.send({ success: false, message: "Already in favorites" });
        fav.addedTime = new Date();
        const result = await favouriteCollection.insertOne(fav);
        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    app.get("/favorites/:email", verifyFBToken, async (req, res) => {
      try {
        const result = await favouriteCollection
          .find({ userEmail: req.params.email })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    app.delete("/favourites/:id", verifyFBToken, async (req, res) => {
      try {
        const result = await favouriteCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // ORDERS
    // ════════════════════════════════════════════════════════════════════════

    app.post("/orders", verifyFBToken, verifyFraud, async (req, res) => {
      try {
        const order         = req.body;
        order.orderTime     = new Date();
        order.orderStatus   = "pending";
        order.paymentStatus = "pending";
        const result        = await ordersCollection.insertOne(order);
        res.send({ insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Single order by ID
    app.get("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id))
          return res.status(400).send({ error: "Invalid ID" });
        const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
        if (!order) return res.status(404).send({ error: "Order not found" });
        res.send(order);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Orders by user
    app.get("/orders/by-user/:email", verifyFBToken, async (req, res) => {
      try {
        const result = await ordersCollection
          .find({ userEmail: req.params.email })
          .sort({ orderTime: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Orders by chef
    app.get("/orders/by-chef/:chefEmail", verifyFBToken, verifyChef, async (req, res) => {
      try {
        const orders = await ordersCollection
          .find({ chefEmail: req.params.chefEmail })
          .sort({ orderTime: -1 })
          .toArray();
        res.send(orders);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Update order status
    app.patch("/orders/update/:id", verifyFBToken, verifyChef, async (req, res) => {
      try {
        const { status } = req.body;
        const allowed = ["pending", "accepted", "cancelled", "delivered"];
        if (!allowed.includes(status))
          return res.status(400).send({ error: "Invalid status" });
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { orderStatus: status } }
        );
        res.send({ success: result.modifiedCount > 0 });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // Delete order
    app.delete("/orders/:id", verifyFBToken, async (req, res) => {
      try {
        const result = await ordersCollection.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // STATS
    // ════════════════════════════════════════════════════════════════════════

    app.get("/admin/stats/totalUsers", async (req, res) => {
      try {
        const count = await usersCollection.countDocuments();
        res.send({ totalUsers: count });
      } catch { res.status(500).send({ totalUsers: 0 }); }
    });

    app.get("/admin/stats/totalPayments", async (req, res) => {
      try {
        const result = await paymentsCollection.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]).toArray();
        res.send({ totalPayments: result[0]?.total || 0 });
      } catch { res.status(500).send({ totalPayments: 0 }); }
    });

    app.get("/admin/stats/ordersPending", async (req, res) => {
      try {
        const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
        res.send({ pendingOrders: count });
      } catch { res.status(500).send({ pendingOrders: 0 }); }
    });

    app.get("/admin/stats/ordersDelivered", async (req, res) => {
      try {
        const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
        res.send({ deliveredOrders: count });
      } catch { res.status(500).send({ deliveredOrders: 0 }); }
    });

    // ════════════════════════════════════════════════════════════════════════
    // PAYMENTS (Stripe)
    // ════════════════════════════════════════════════════════════════════════

    app.post("/order-payment-checkout", verifyFBToken, async (req, res) => {
      try {
        if (!stripe)
          return res.status(500).send({ error: "Stripe not configured" });
        const { orderId, mealName, price, quantity, userEmail } = req.body;
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: Math.round(price * 100),
                product_data: { name: mealName },
              },
              quantity: quantity || 1,
            },
          ],
          mode: "payment",
          metadata:       { orderId, mealName },
          customer_email: userEmail,
          success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url:  `${process.env.CLIENT_DOMAIN}/dashboard/payment-cancelled`,
        });
        res.send({ url: session.url });
      } catch (error) {
        res.status(500).send({ error: "Payment failed" });
      }
    });

    app.patch("/order-payment-success", verifyFBToken, async (req, res) => {
      try {
        if (!stripe)
          return res.status(500).send({ error: "Stripe not configured" });
        const session       = await stripe.checkout.sessions.retrieve(req.query.session_id);
        if (session.payment_status !== "paid")
          return res.send({ success: false });

        const orderId       = session.metadata.orderId;
        const transactionId = session.payment_intent;

        await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { paymentStatus: "paid", transactionId, paidAt: new Date() } }
        );
        await paymentsCollection.updateOne(
          { transactionId },
          {
            $setOnInsert: {
              amount:        session.amount_total / 100,
              currency:      session.currency,
              userEmail:     session.customer_email,
              orderId,
              mealName:      session.metadata.mealName,
              transactionId,
              paymentStatus: "paid",
              paidAt:        new Date(),
            },
          },
          { upsert: true }
        );
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ error: "Verification failed" });
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    // CONTACT
    // ════════════════════════════════════════════════════════════════════════

    app.post("/contact", async (req, res) => {
      try {
        const message   = req.body;
        message.createdAt = new Date();
        const result    = await contactCollection.insertOne(message);
        res.send({ success: !!result.insertedId });
      } catch (error) {
        res.status(500).send({ error: "Failed" });
      }
    });

    // ────────────────────────────────────────────────────────────────────────
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => res.send("🚀 Server running"));

app.listen(port, () => console.log(`Server on port ${port}`));


require('dotenv').config()
const express = require('express')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const admin = require('firebase-admin')
const serviceAccount = require("./serviceAccountKey.json");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 3000
const crypto = require("crypto");

//const serviceAccount = JSON.parse(decoded)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})


const verifyFBToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  try {
    const idToken = token.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log('decoded in the token', decoded);
    req.decoded_email = decoded.email;
    next();
  }
  catch (err) {
    return res.status(401).send({ message: 'unauthorized access' })
  }


}

const app = express()
// middleware
app.use(
  cors({
    origin: [process.env.CLIENT_DOMAIN],
    credentials: true,
    optionSuccessStatus: 200,
  })
)
app.use(express.json())


const uri = `mongodb+srv://${process.env.use_Name}:${process.env.user_Pass}@allunityit.looszdp.mongodb.net/?appName=AllUnityIt`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let mealsCollection;

async function run() {
  try {

    const db = client.db("LocalChefBazzaarBD");
    const usersCollection = db.collection("users");
    const requestsCollection = db.collection("requests");
    const mealsCollection = db.collection("meals")
    const reviewsCollection = db.collection("reviews")
    const favouriteCollection = db.collection("favourites")
    const ordersCollection = db.collection("orders")
    const paymentsCollection = db.collection("payments")
    const contactCollection = db.collection("contacts")
    // ------------Reusable api---------
    // admin
    const verifyAdmin = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: "User not Found" });
        }
        if (user.role !== "admin") {
          return res.status(403).send({ error: "Admin Access denied" });
        }
        next();
      } catch (error) {
        res.status(500).send({ error: "Admin Verificatin failed" });
      }
    };
    // chef
    const verifyChef = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }
        if (user.role !== "chef") {
          return res.status(403).send({ error: "Chef access denied" });
        }
        next();
      } catch (error) {
        res.status(500).send({ error: "Chef verification failed " });
      }
    };
    // Fraud
    const verifyFraud = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }
        if (user.status === "fraud") {
          return res.status(403).send({ error: "Fraud user - action blocked" });
        }
        next();
      } catch (error) {
        res.status(500).send({ error: "Fraud verification fraud" });
      }
    };

    // ------------------Users API------------------
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.createdAt = new Date();
      user.status = "active";
      const email = user.email;

      const userExists = await usersCollection.findOne({ email });
      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // get all users on frontend
    app.get("/users", verifyFBToken, verifyAdmin, async (req, res) => {
      const allUsers = await usersCollection.find().sort({ createdAt: -1 }).toArray();
      res.send(allUsers);
    });
    // role based access
    app.get("/users/:email/role", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role });
    });
    // updated user status
    app.patch("/users/fraud/:email", verifyFBToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.updateOne({ email }, { $set: { status: "fraud" } });

      if (result.modifiedCount > 0) {
        return res.send({ success: true });
      }

      res.send({ success: false });
    });

    // showing users on my profile page on frontend
    app.get("/users/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded_email !== email) {
        return res.status(403).send({ error: "Access Denied" });
      }
      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).send({ error: "User not found" });
      res.send(user);
    });
    app.get("/admin/stats/totalUsers", async (req, res) => {
      const count = await usersCollection.countDocuments();
      res.send({ totalUsers: count });
    });

    // ------------------request api------------------

    app.post("/requests", verifyFBToken, async (req, res) => {
      const request = req.body;
      request.requestStatus = "pending";
      request.requestTime = new Date();
      const result = await requestsCollection.insertOne(request);
      res.send(result);
    });

    app.get("/requests/:email", async (req, res) => {
      const email = req.params.email;

      const requests = await requestsCollection.find({ userEmail: email }).sort({ requestTime: -1 }).toArray();

      res.send(requests);
    });

    app.get("/requests", verifyFBToken, verifyAdmin, async (req, res) => {
      const requests = await requestsCollection.find().sort({ requestTime: -1 }).toArray();
      res.send(requests);
    });

    app.patch("/requests/update/:id", verifyFBToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const { requestStatus, userEmail, requestType } = req.body;

      const requestUpdate = await requestsCollection.updateOne({ _id: id }, { $set: { requestStatus } });

      if (requestUpdate.modifiedCount === 0) {
        return res.send({ success: false, message: "Request update failed" });
      }
      if (requestStatus === "approved") {
        let updateData = {};
        if (requestType === "chef") {
          const chefId = "chef-" + Math.floor(1000 + Math.random() * 9000);
          updateData = { role: "chef", chefId };
        }
        if (requestType === "admin") {
          updateData = { role: "admin" };
        }
        const userUpdate = await usersCollection.updateOne({ email: userEmail }, { $set: updateData });
        console.log("User Update:", userUpdate);
        if (userUpdate.modifiedCount === 0) {
          return res.send({ success: false, message: "User role update failed" });
        }
      }
      return res.send({ success: true, message: "Request processed successfully" });
    });

    // ---------------Meals api---------------

    app.post("/meals", verifyFBToken, verifyFraud, verifyChef, async (req, res) => {
      try {
        const meal = req.body;

        if (req.decoded_email !== meal.userEmail) {
          return res.status(403).send({ error: "Access denied" });
        }
        meal.createdAt = new Date();

        const result = await mealsCollection.insertOne(meal);
        res.send({ success: true, result });
      } catch (error) {
        res.status(500).send({ success: false, error: "Failed to creat meal" });
      }
    });
    // get meals to show on home page
    app.get("/leatestMeals", async (req, res) => {
      const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
      res.send(meals);
    });
    // Show meals Pagination
    app.get("/meals", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const total = await mealsCollection.countDocuments();
      const meals = await mealsCollection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
      res.send({ total, page, limit, meals });
    });
    // showing meal details on frontend as per id
    app.get("/meals/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const result = await mealsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // get meals by email
    app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;

      if (req.decoded_email !== email) {
        return res.status(403).send({ error: "Access Denied" });
      }
      const meals = await mealsCollection.find({ userEmail: email }).sort({ createdAt: -1 }).toArray();
      res.send(meals);
    });
    // delete meals
    app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
      const id = req.params.id;
      const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // update meals information by id
    app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await mealsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
      res.send({ success: result.modifiedCount > 0 });
    });
    // ---------Reviews api-----------------
    app.post("/reviews", verifyFBToken, verifyFraud, async (req, res) => {
      const review = req.body;
      const exists = await reviewsCollection.findOne({
        foodId: review.foodId,
        reviewerEmail: review.reviewerEmail,
      });
      if (exists) {
        return res.send({
          success: false,
          message: "Already you have added review to this meal",
        });
      }
      const result = await reviewsCollection.insertOne(review);
      const allReviews = await reviewsCollection.find({ foodId: review.foodId }).toArray();
      const total = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      const avgRating = total / allReviews.length;
      if (!ObjectId.isValid(review.foodId)) {
        return res.status(400).send({ success: false, message: "Invalid foodId formate" });
      }
      const newFoodId = new ObjectId(review.foodId);
      await mealsCollection.updateOne({ _id: newFoodId }, { $set: { rating: Number(avgRating.toFixed(2)) } });
      res.send({
        success: true,
        insertedId: result.insertedId,
      });
    });
    app.get("/reviews/:mealId", async (req, res) => {
      const mealId = req.params.mealId;
      const reviews = await reviewsCollection.find({ foodId: mealId }).toArray();
      res.send(reviews);
    });
    app.get("/reviews", async (req, res) => {
      const review = await reviewsCollection.find().sort({ date: -1 }).limit(10).toArray();
      res.send(review);
    });
    app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded_email !== email) {
        return res.status(403).send({ error: "Access Denied" });
      }
      const result = await reviewsCollection.find({ reviewerEmail: email }).toArray();
      res.send(result);
    });
    app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
      const deleteResult = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

      const givenReview = await reviewsCollection.find({ foodId: review.foodId }).toArray();
      let newRating = 0;
      if (givenReview.length > 0) {
        const total = givenReview.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        newRating = Number((total / givenReview.length).toFixed(3));
      }

      await mealsCollection.updateOne({ _id: new ObjectId(review.foodId) }, { $set: { rating: newRating } });
      res.send({
        success: deleteResult.deletedCount > 0,
        message: "Review deleted Successfully",
      });
    });
    app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const { rating, comment } = req.body;
      const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

      // Update review
      const updateReview = await reviewsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            rating: Number(rating),
            comment,
            date: new Date(),
          },
        }
      );
      const allRatings = await reviewsCollection.find({ foodId: review.foodId }).toArray();

      let avgRating = 0;

      if (allRatings.length > 0) {
        const total = allRatings.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        avgRating = Number((total / allRatings.length).toFixed(2));
      }

      await mealsCollection.updateOne({ _id: new ObjectId(review.foodId) }, { $set: { rating: avgRating } });

      res.send({
        success: true,
        message: "Review updated successfully",
      });
    });

    // --------fav api ---------
    app.post("/favorites", verifyFBToken, verifyFraud, async (req, res) => {
      const favourite = req.body;

      const exists = await favouriteCollection.findOne({
        userEmail: favourite.userEmail,
        mealId: favourite.mealId,
      });
      if (exists) {
        return res.send({
          success: false,
          message: "Already added to favorite",
        });
      }
      favourite.addedTime = new Date();
      const result = await favouriteCollection.insertOne(favourite);
      res.send({
        success: true,
        insertedId: result.insertedIdz,
      });
    });
    app.get("/favorites/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      const result = await favouriteCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });
    app.delete("/favourites/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const result = await favouriteCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // -----------------Order api----------------
    app.post("/orders", verifyFBToken, verifyFraud, async (req, res) => {
      const order = req.body;
      order.orderTime = new Date().toISOString();

      (order.orderStatus = "pending"), (order.paymentStatus = "pending");
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    // // GET order by ID
    // app.get("/orders/:id", async (req, res) => {
    //   try {
    //     const { id } = req.params;

    //     // Validate MongoDB ObjectId
    //     if (!mongoose.Types.ObjectId.isValid(id)) {
    //       return res.status(400).send("Invalid order ID");
    //     }

    //     const order = await order.findById(id);
    //     if (!order) return res.status(404).send("Order not found");

    //     res.json(order);
    //   } catch (err) {
    //     console.error("Error fetching order:", err);
    //     res.status(500).send("Internal server error");
    //   }
    // });

    app.get("/orders/:id", async (req, res) => {
  const order = await order.findById(req.params.id);
  if (!order) return res.status(404).send("Order not found");
  res.json(order);
});


    // get users order
    app.get("/orders/by-user/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.params.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { userEmail: email };
      const result = await ordersCollection.find(query).sort({ orderTime: -1 }).toArray();
      res.send(result);
    });
    // get the order bessed on chefId
    app.get("/orders/by-chef/:chefEmail", verifyFBToken, verifyChef, async (req, res) => {
      const chefEmail = req.params.chefEmail;
      const orders = await ordersCollection.find({ chefEmail }).sort({ orderTime: -1 }).toArray();
      res.send(orders);
    });
    app.patch("/orders/update/:id", verifyFBToken, verifyChef, async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const allowed = ["pending", "accepted", "cancelled", "delivered"];
      if (!allowed.includes(status)) {
        return res.status(400).send({ error: "Invalid status" });
      }
      const result = await ordersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { orderStatus: status } });
      res.send({ success: result.modifiedCount > 0 });
    });
    // app.get("/admin/stats/ordersPending", async (req, res) => {
    //   const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
    //   res.send({ pendingOrders: count });
    // });
    // app.get("/admin/stats/orderDelivered", async (req, res) => {
    //   const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
    //   res.send({ deliveredOrders: count });
    // });

    // -------------- Stats APIs ----------------

    // Total Users
    app.get("/admin/stats/totalUsers", async (req, res) => {
      try {
        const count = await usersCollection.countDocuments();
        res.send({ totalUsers: count });
      } catch (err) {
        console.error(err);
        res.status(500).send({ totalUsers: 0 });
      }
    });

    // Pending Orders
    app.get("/admin/stats/ordersPending", async (req, res) => {
      try {
        const count = await ordersCollection.countDocuments({ orderStatus: "pending" });
        res.send({ pendingOrders: count });
      } catch (err) {
        console.error(err);
        res.status(500).send({ pendingOrders: 0 });
      }
    });

    // Delivered Orders
    app.get("/admin/stats/ordersDelivered", async (req, res) => {
      try {
        const count = await ordersCollection.countDocuments({ orderStatus: "delivered" });
        res.send({ deliveredOrders: count });
      } catch (err) {
        console.error(err);
        res.status(500).send({ deliveredOrders: 0 });
      }
    });

    // Total Payments
    app.get("/admin/stats/totalPayments", async (req, res) => {
      try {
        const result = await paymentsCollection.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        res.send({ totalPayments: result[0]?.total || 0 });
      } catch (err) {
        console.error(err);
        res.status(500).send({ totalPayments: 0 });
      }
    });

    // --------------------Payment api-----------------
    app.post("/order-payment-checkout", verifyFBToken, async (req, res) => {
      const info = req.body;
      const amount = parseInt(info.price) * 100;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: `Payment for ${info.mealName}`,
              },
            },
            quantity: info.quantity,
          },
        ],
        mode: "payment",

        metadata: {
          orderId: info.orderId,
          mealName: info.mealName,
        },

        customer_email: info.userEmail,

        success_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment-cancelled`,
      });

      res.send({ url: session.url });
    });
    // Express example
    app.get('/payment-success', async (req, res) => {
      const { sessionId } = req.query;
      if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

      try {
        // Lookup payment session in Stripe or database
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        res.json({ success: true, session });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not verify payment' });
      }
    });

    app.patch("/order-payment-success", verifyFBToken, async (req, res) => {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const transactionId = session.payment_intent;
      if (session.payment_status === "paid") {
        const orderId = session.metadata.orderId;

        await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              paymentStatus: "paid",
              transactionId,
              paidAt: new Date(),
            },
          }
        );
        const payment = {
          amount: session.amount_total / 100,
          currency: session.currency,
          userEmail: session.customer_email,
          orderId,
          mealName: session.metadata.mealName,
          transactionId,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
        };

        await paymentsCollection.updateOne({ transactionId }, { $setOnInsert: payment }, { upsert: true });
        return res.send({ success: true });
      }
      res.send({ success: false });
    });
    const { ObjectId } = require("mongodb");

    // Delete an order by ID
    app.delete("/orders/:id", verifyFBToken, async (req, res) => {
      try {
        const id = req.params.id;
        const result = await ordersCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount > 0) {
          res.status(200).send({ message: "Order deleted", deletedCount: result.deletedCount });
        } else {
          res.status(404).send({ message: "Order not found" });
        }
      } catch (error) {
        console.error("Delete order error:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // app.get("/admin/stats/totalPayments", async (req, res) => {
    //   const result = await paymentCollection.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray();
    //   res.send({ totalPayments: result[0].total || 0 });
    // });
    // --------Contact api----------
    app.post("/contact", async (req, res) => {
      const message = req.body;
      message.createdAt = new Date();
      const result = await contactCollection.insertOne(message);
      if (result.insertedId) {
        return res.send({ success: true });
      }
      res.send({ success: false });
    });



    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from Server..')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

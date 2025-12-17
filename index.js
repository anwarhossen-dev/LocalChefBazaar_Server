

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const admin = require('firebase-admin')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 3000
const crypto = require("crypto");

const serviceAccount = JSON.parse(decoded)
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

    const db = client.db("local-chef-bazarDB");
    const usersCollection = db.collection("users");
    const requestsCollection = db.collection("requests");
    const mealsCollection = db.collection("meals")
    const reviewsCollection = db.collection("reviews")
    const favouriteCollection = db.collection("favourites")

    // ------------Reusable api---------
    // admin
    const verifyAdmin = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: "User not Found" })
        }
        if (user.role !== "admin") {
          return res.status(403).send({ error: "Admin Access denied" })
        }
        next()
      } catch (error) {
        res.status(500).send({ error: "Admin Verificatin failed" })
      }
    }
    // chef
    const verifyChef = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: "User not found" })
        }
        if (user.role !== "chef") {
          return res.status(403).send({ error: "Chef access denied" })
        }
        next()
      } catch (error) {
        res.status(500).send({ error: "Chef verification failed " })
      }
    }
    // Fraud
    const verifyFraud = async (req, res, next) => {
      try {
        const email = req.decoded_email;
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ error: "User not found" })
        }
        if (user.status === "fraud") {
          return res.status(403).send({ error: "Fraud user - action blocked" })
        }
        next()
      } catch (error) {
        res.status(500).send({ error: "Fraud verification fraud" })
      }
    }


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
      res.send(allUsers)
    })
    // role based access
    app.get("/users/:email/role", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ role: user?.role });
    });
    // updated user status 
    app.patch("/users/fraud/:email", verifyFBToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.updateOne(
        { email },
        { $set: { status: "fraud" } }
      )

      if (result.modifiedCount > 0) {
        return res.send({ success: true })
      }

      res.send({ success: false })
    })

    // showing users on my profile page on frontend
    app.get("/users/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded_email !== email) {
        return res.status(403).send({ error: "Access Denied" })
      }
      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).send({ error: "User not found" });
      res.send(user);
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
          return res.status(403).send({ error: "Access denied" })
        }
        meal.createdAt = new Date();

        const result = await mealsCollection.insertOne(meal)
        res.send({ success: true, result })
      } catch (error) {
        res.status(500).send({ success: false, error: "Failed to creat meal" })
      }
    })
    // get meals to show on home page
    app.get("/leatestMeals", async (req, res) => {
      const meals = await mealsCollection.find().sort({ createdAt: -1 }).limit(8).toArray();
      res.send(meals)
    })
    app.get("/meals", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const total = await mealsCollection.countDocuments();
      const meals = await mealsCollection
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send({ total, page, limit, meals })
    })
    // showing meal details on frontend as per id
    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const result = await mealsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result)
    })
    // get meals by email 
    app.get("/meals/by-email/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;

      if (req.decoded_email !== email) {
        return res.status(403).send({ error: "Access Denied" })
      }
      const meals = await mealsCollection.find({ userEmail: email }).sort({ createdAt: -1 }).toArray()
      res.send(meals)
    })
    // delete meals
    app.delete("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
      const id = req.params.id;
      const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(result)
    })
    // update meals information by id
    app.patch("/meals/:id", verifyFBToken, verifyChef, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await mealsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      )
      res.send({ success: result.modifiedCount > 0 })
    })
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
        return res.status(400).send({ success: false, message: "Invalid foodId formate" })
      }
      const newFoodId = new ObjectId(review.foodId)
      await mealsCollection.updateOne({ _id: newFoodId }, { $set: { rating: Number(avgRating.toFixed(2)) } })
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
    app.get("/reviews", verifyFBToken, async (req, res) => {
      const review = await reviewsCollection.find().sort({ date: -1 }).limit(10).toArray();
      res.send(review)
    })
    app.get("/reviews/by-email/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded_email !== email) {
        return res.status(403).send({ error: "Access Denied" })
      }
      const result = await reviewsCollection.find({ reviewerEmail: email }).toArray();
      res.send(result);
    });
    app.delete('/reviews/:id', verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const review = await reviewsCollection.findOne({ _id: new ObjectId(id) })
      const deleteResult = await reviewsCollection.deleteOne({ _id: new ObjectId(id) })

      const givenReview = await reviewsCollection.find({ foodId: review.foodId }).toArray()
      let newRating = 0;
      if (givenReview.length > 0) {
        const total = givenReview.reduce(
          (sum, r) => sum + Number(r.rating || 0), 0
        )
        newRating = Number((total / givenReview.length).toFixed(3))
      }

      await mealsCollection.updateOne(
        { _id: new ObjectId(review.foodId) },
        { $set: { rating: newRating } }
      )
      res.send({
        success: deleteResult.deletedCount > 0,
        message: "Review deleted Successfully",
      })
    })
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
      })
      if (exists) {
        return res.send({
          success: false,
          message: "Already added to favorite"
        })
      }
      favourite.addedTime = new Date();
      const result = await favouriteCollection.insertOne(favourite)
      res.send({
        success: true,
        insertedId: result.insertedIdz,
      })
    })
    app.get("/favorites/:email", verifyFBToken, async (req, res) => {
      const email = req.params.email;
      const result = await favouriteCollection.find({ userEmail: email }).toArray();
      res.send(result)
    })
    app.delete("/favourites/:id", async (req, res) => {
      const id = req.params.id;
      const result = await favouriteCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result)
    })


    //payment method
    app.post("/create-checkout-session", async (req, res) => {
      try {
        const {
          mealId,
          foodName,
          description,
          image,
          price,
          quantity,
          customer,
          address,
        } = req.body;

        if (!mealId || !price || !customer?.email) {
          return res.status(400).json({ error: "Invalid payment data" });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: customer.email,

          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: foodName,
                  description,
                  images: image ? [image] : [],
                },
                unit_amount: Math.round(price * 100),
              },
              quantity,
            },
          ],

          metadata: {
            mealId,
            quantity,
            customerEmail: customer.email,
            address,
          },

          success_url: `${process.env.CLIENT_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_DOMAIN}/order/${mealId}`,
        });

        res.send({ url: session.url });
      } catch (err) {
        console.error("Stripe Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    });


    app.get("/payment-success", async (req, res) => {
      try {
        const { session_id } = req.query

        if (!session_id) {
          return res.status(400).json({ error: "Session ID missing" })
        }

        const session = await stripe.checkout.sessions.retrieve(session_id)

        if (session.payment_status !== "paid") {
          return res.status(400).json({ error: "Payment not completed" })
        }

        const existingOrder = await ordersCollection.findOne({
          transactionId: session.payment_intent,
        })

        if (existingOrder) {
          return res.json({ success: true })
        }

        const meal = await mealsCollection.findOne({
          _id: new ObjectId(session.metadata.mealId),
        })

        const order = {
          mealId: session.metadata.mealId,
          transactionId: session.payment_intent,
          customerEmail: session.metadata.customerEmail,
          foodName: meal.foodName,
          chefName: meal.chefName,
          chefId: meal.chefId,
          quantity: Number(session.metadata.quantity),
          price: session.amount_total / 100,
          image: meal.image,
          address: session.metadata.address,
          paymentStatus: "paid",
          orderStatus: "pending",
          orderTime: new Date(),
        }

        await ordersCollection.insertOne(order)

        await mealsCollection.updateOne(
          { _id: meal._id },
          { $inc: { quantity: -order.quantity } }
        )

        res.json({ success: true })
      } catch (err) {
        res.status(500).json({ error: "Payment failed" })
      }
    })

    app.post('/orders', async (req, res) => {
      const ordersData = req.body
      console.log(ordersData)
      const result = await ordersCollection.insertOne(ordersData)
      res.send(result)
    })

    app.get('/my-orders/:email', async (req, res) => {
      const email = req.params.email
      const result = await ordersCollection.find({ customer: email }).toArray()
      res.send(result)
    })

    // // get all orders for a chef by email
    // app.get('/manage-orders/:email', async (req, res) => {
    //   const email = req.params.email

    //   const result = await ordersCollection
    //     .find({ 'chef.email': email })
    //     .toArray()
    //   res.send(result)
    // })

    app.get('/orders', async (req, res) => {
      const email = req.query.email;
      const result = await ordersCollection.find({ customer: email }).toArray();
      res.send(result);
    });

    app.patch('/orders/:id', async (req, res) => {
      const { id } = req.params;
      const { orderStatus } = req.body;
      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { orderStatus } }
      );
      res.send(result);
    });



    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
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


// require('dotenv').config()
// const express = require('express')
// const cors = require('cors')
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

// /* =====================
//    Express Setup
// ===================== */
// const app = express()
// const port = process.env.PORT || 3000

// app.use(cors({ origin: process.env.CLIENT_DOMAIN, credentials: true }))
// app.use(express.json())

// /* =====================
//    MongoDB Setup
// ===================== */
// const uri = `mongodb+srv://${process.env.use_Name}:${process.env.user_Pass}@allunityit.looszdp.mongodb.net/?appName=AllUnityIt`;
// const client = new MongoClient(uri, {
//   serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
// })

// let usersCollection, mealsCollection, ordersCollection, reviewsCollection, favoritesCollection, requestsCollection

// /* =====================
//    Start MongoDB
// ===================== */
// async function run() {
//   try {
//     await client.connect()
//     const db = client.db('LocalChefBazzaarBD')
//     usersCollection = db.collection('users')
//     mealsCollection = db.collection('meals')
//     ordersCollection = db.collection('orders')
//     reviewsCollection = db.collection('mealsReviews')
//     favoritesCollection = db.collection('favorites')
//     requestsCollection = db.collection('requests')

//     console.log('MongoDB connected')

//     /* =====================
//        USER ROUTES
//     ===================== */
//     // Create or update user
//     app.post('/user', async (req, res) => {
//       const { email, name, profileImage, address } = req.body
//       const user = await usersCollection.findOne({ email })

//       if (user) {
//         await usersCollection.updateOne(
//           { email },
//           { $set: { lastLoggedIn: new Date() } }
//         )
//         return res.send({ message: 'User already exists' })
//       }

//       const newUser = {
//         name,
//         email,
//         profileImage,
//         address,
//         role: 'user',
//         status: 'active',
//         createdAt: new Date(),
//         lastLoggedIn: new Date(),
//       }

//       const result = await usersCollection.insertOne(newUser)
//       res.send(result)
//     })

//     // Get all users
//     app.get('/users', async (req, res) => {
//       const users = await usersCollection.find().toArray()
//       res.send(users)
//     })

//     // Update role
//     app.patch('/users/role', async (req, res) => {
//       const { userId, role } = req.body
//       if (!['user', 'chef', 'admin'].includes(role)) return res.status(400).send({ message: 'Invalid role' })

//       const updateData = { role }
//       if (role === 'chef') {
//         updateData.chefId = 'chef-' + Math.floor(1000 + Math.random() * 9000)
//       }

//       const result = await usersCollection.updateOne(
//         { _id: new ObjectId(userId) },
//         { $set: updateData }
//       )
//       res.send(result)
//     })

//     // Make fraud
//     app.patch('/users/fraud/:id', async (req, res) => {
//       const id = req.params.id
//       const result = await usersCollection.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: { status: 'fraud' } }
//       )
//       res.send(result)
//     })

//     /* =====================
//        MEALS
//     ===================== */
//     app.post('/meals', async (req, res) => {
//       const meal = req.body
//       const chef = await usersCollection.findOne({ email: meal.userEmail })
//       if (chef?.status === 'fraud') return res.status(403).send({ message: 'Fraud chef cannot create meal' })

//       const result = await mealsCollection.insertOne({ ...meal, createdAt: new Date() })
//       res.send(result)
//     })

//     app.get('/meals', async (req, res) => {
//       const page = parseInt(req.query.page) || 1
//       const limit = 10
//       const meals = await mealsCollection.find()
//         .skip((page - 1) * limit)
//         .limit(limit)
//         .toArray()
//       const total = await mealsCollection.countDocuments()
//       res.send({ meals, total })
//     })

//     app.get('/meals/:id', async (req, res) => {
//       const meal = await mealsCollection.findOne({ _id: new ObjectId(req.params.id) })
//       res.send(meal)
//     })

//     /* =====================
//        ORDERS
//     ===================== */
//     app.post('/orders', async (req, res) => {
//       const order = req.body
//       const user = await usersCollection.findOne({ email: order.userEmail })
//       if (user?.status === 'fraud') return res.status(403).send({ message: 'Fraud user cannot order' })

//       const result = await ordersCollection.insertOne({ ...order, orderTime: new Date(), orderStatus: 'pending', paymentStatus: 'Pending' })
//       res.send(result)
//     })

//     app.get('/orders', async (req, res) => {
//       const email = req.query.email
//       const orders = await ordersCollection.find({ userEmail: email }).toArray()
//       res.send(orders)
//     })

//     app.patch('/orders/:id', async (req, res) => {
//       const { orderStatus } = req.body
//       const result = await ordersCollection.updateOne(
//         { _id: new ObjectId(req.params.id) },
//         { $set: { orderStatus } }
//       )
//       res.send(result)
//     })

//     /* =====================
//        REVIEWS
//     ===================== */
//     app.post('/reviews', async (req, res) => {
//       const review = { ...req.body, date: new Date() }
//       const result = await reviewsCollection.insertOne(review)
//       res.send(result)
//     })

//     app.get('/reviews/:mealId', async (req, res) => {
//       const mealId = req.params.mealId
//       const reviews = await reviewsCollection.find({ foodId: mealId }).toArray()
//       res.send(reviews)
//     })

//     /* =====================
//        FAVORITES
//     ===================== */
//     app.post('/favorites', async (req, res) => {
//       const { userEmail, mealId } = req.body
//       const exists = await favoritesCollection.findOne({ userEmail, mealId })
//       if (exists) return res.send({ message: 'Already in favorites' })

//       const result = await favoritesCollection.insertOne({ ...req.body, addedTime: new Date() })
//       res.send(result)
//     })

//     app.get('/favorites', async (req, res) => {
//       const email = req.query.email
//       const favorites = await favoritesCollection.find({ userEmail: email }).toArray()
//       res.send(favorites)
//     })

//     app.delete('/favorites/:id', async (req, res) => {
//       const result = await favoritesCollection.deleteOne({ _id: new ObjectId(req.params.id) })
//       res.send(result)
//     })

//     /* =====================
//        REQUESTS (Become Chef/Admin)
//     ===================== */
//     app.post('/requests', async (req, res) => {
//       const request = { ...req.body, requestStatus: 'pending', requestTime: new Date() }
//       const result = await requestsCollection.insertOne(request)
//       res.send(result)
//     })

//     app.get('/requests', async (req, res) => {
//       const requests = await requestsCollection.find().toArray()
//       res.send(requests)
//     })

//     app.patch('/requests/:id/approve', async (req, res) => {
//       const request = await requestsCollection.findOne({ _id: new ObjectId(req.params.id) })
//       let updateRole = {}
//       if (request.requestType === 'chef') {
//         updateRole = { role: 'chef', chefId: 'chef-' + Math.floor(1000 + Math.random() * 9000) }
//       }
//       if (request.requestType === 'admin') {
//         updateRole = { role: 'admin' }
//       }

//       await usersCollection.updateOne({ email: request.userEmail }, { $set: updateRole })
//       const result = await requestsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { requestStatus: 'approved' } })
//       res.send(result)
//     })

//     app.patch('/requests/:id/reject', async (req, res) => {
//       const result = await requestsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { requestStatus: 'rejected' } })
//       res.send(result)
//     })

//     /* =====================
//        STRIPE PAYMENT
//     ===================== */
//     app.post('/create-checkout-session', async (req, res) => {
//       const { price, quantity, customerEmail, mealName } = req.body
//       const session = await stripe.checkout.sessions.create({
//         payment_method_types: ['card'],
//         mode: 'payment',
//         customer_email: customerEmail,
//         line_items: [
//           { price_data: { currency: 'usd', product_data: { name: mealName }, unit_amount: Math.round(price * 100) }, quantity }
//         ],
//         success_url: `${process.env.CLIENT_DOMAIN}/payment-success`,
//         cancel_url: `${process.env.CLIENT_DOMAIN}/order`,
//       })
//       res.send({ url: session.url })
//     })

//     app.get('/', (req, res) => res.send('Server is running...'))

//   } catch (err) {
//     console.error(err)
//   }
// }

// run().catch(console.dir)

// app.listen(port, () => console.log(`🚀 Server running on port ${port}`))

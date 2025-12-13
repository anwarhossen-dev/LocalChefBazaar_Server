



require('dotenv').config()
const express = require('express')
const cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
// const admin = require('firebase-admin')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 3000
const crypto = require("crypto");

// const serviceAccount = JSON.parse(decoded)
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// })


// const verifyFBToken = async (req, res, next) => {
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).send({ message: 'unauthorized access' })
//     }

//     try {
//         const idToken = token.split(' ')[1];
//         const decoded = await admin.auth().verifyIdToken(idToken);
//         console.log('decoded in the token', decoded);
//         req.decoded_email = decoded.email;
//         next();
//     }
//     catch (err) {
//         return res.status(401).send({ message: 'unauthorized access' })
//     }


// }

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
    const db = client.db('LocalChefBazzaarBD')
    const usersCollection = db.collection('users')
    const mealsReviewsCollection = db.collection('mealsReviews')
    const favoritesCollection = db.collection('favorites')
    const mealsCollection = db.collection('meals')
    const ordersCollection = db.collection('orders')


    // users data into Database
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.userStatus = "active";
      user.createdAt = new Date();

      // exists user checking
      const userExists = await usersCollection.findOne({ email: user.email });
      if (userExists) {
        return res.send({ message: "User Exists" });
      }
      const result = await usersCollection.insertOne(user);
      console.log("result", result);

      res.send(result);
    });
    // get user from database
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      console.log("email", email);
      const query = {};
      if (email) {
        query.email = email;
      }
      try {
        const cursor = usersCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });

    // save a meal data in db 
    app.post('/meals', async (req, res) => {
      const mealsData = req.body
      console.log(mealsData)
      const result = await mealsCollection.insertOne(mealsData)
      res.send(result)
    })

    // latest meals for home page
    app.get("/latest-meals", async (req, res) => {
      try {
        const cursor = mealsCollection.find().limit(8);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.send(error);
      }
    });

    // //get all meals from db

    app.get('/meals', async (req, res) => {
      const result = await mealsCollection.find().toArray()
      res.send(result)
    })
    //get all meals from db

    app.get('/meals/:id', async (req, res) => {
      const id = req.params.id
      const result = await mealsCollection.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    // GET all reviews (homepage showing limited)
    app.get("/reviews", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit);
        let cursor;

        if (limit) {
          cursor = mealsReviewsCollection.find().limit(limit).sort({ createdAt: -1 });
        } else {
          cursor = mealsReviewsCollection.find().sort({ createdAt: -1 });
        }

        const result = await cursor.toArray();
        res.send(result);

      } catch (error) {
        res.status(500).send({ message: "Failed to fetch reviews", error });
      }
    });

    app.post("/meals-reviews", async (req, res) => {
      const { mealId, userName, userEmail, UserPhoto, text, rating } = req.body;

      if (!mealId || !text || !rating) {
        return res.status(400).send({ message: "Invalid review data" });
      }
      // const formattedDate = dayjs().format("MMM D, YYYY h:mm A");
      // const formattedDate = dayjs().format("MMMM D, YYYY");
      const UserReviews = {
        mealId: new ObjectId(mealId),
        userName,
        userEmail,
        UserPhoto,
        text,
        rating,
        createdAt: new Date(),
      };
      const result = await mealsReviewsCollection.insertOne(UserReviews);
      res.send(result);
    });

    app.get("/favorites", async (req, res) => {
      const favorite = req.query;
      const query = {};
      const cursor = favoritesCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/favorites", async (req, res) => {
      const favorite = req.body;
      favorite.createdAt = new Date();
      if (!favorite.mealId) {
        return res.status(400).send({ message: "Invalid review data" });
      }
      const result = await favoritesCollection.insertOne(favorite);
      res.send(result);
    });

    //payment method
    app.post('/create-checkout-session', async (req, res) => {
      const paymentInfo = req.body;

      try {
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: paymentInfo.foodName,
                  description: paymentInfo.description,
                  images: paymentInfo.image ? [paymentInfo.image] : [], // ✅ prevent crash
                },
                unit_amount: paymentInfo.price * 100,
              },
              quantity: paymentInfo.quantity,
            },
          ],

          customer_email: paymentInfo.customer.email,
          mode: 'payment',

          metadata: {
            mealId: paymentInfo.mealId,
            customer: paymentInfo.customer.email,
          },

          success_url: `${process.env.CLIENT_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_DOMAIN}/meal/${paymentInfo.mealId}`,
        });

        res.send({ url: session.url });

      } catch (error) {
        console.error("Stripe error:", error.message);
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/payment-success', async (req, res) => {
      const { sessionId } = req.body;

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // FETCH THE MEAL DATA CORRECTLY
        const meal = await mealsCollection.findOne({
          _id: new ObjectId(session.metadata.mealId),
        });

        const order = await ordersCollection.findOne({
          transactionId: session.payment_intent,
        });

        // Only create order if payment completed AND no previous order exists
        if (session.status === 'complete' && meal && !order) {
          const orderInfo = {
            mealId: session.metadata.mealId,
            transactionId: session.payment_intent,
            customer: session.metadata.customer,
            status: 'pending',

            // meal info
            chef: meal.chefName,
            name: meal.foodName,
            category: meal.category,
            quantity: 1,
            price: session.amount_total / 100,
            image: meal.image,

            // Extra fields
            orderTime: new Date(),
            address: session.metadata.address,
            paymentStatus: session.payment_status,
          };

          const result = await ordersCollection.insertOne(orderInfo);

          // Reduce meal stock
          await mealsCollection.updateOne(
            { _id: new ObjectId(session.metadata.mealId) },
            { $inc: { quantity: -1 } }
          );

          return res.send({
            success: true,
            transactionId: session.payment_intent,
            orderId: result.insertedId,
          });
        }

        // If order already exists
        return res.send({
          success: true,
          transactionId: session.payment_intent,
          orderId: order._id,
        });

      } catch (error) {
        console.error('Payment success error:', error);
        res.status(500).send({ error: 'Payment processing failed' });
      }
    });

    // get all orders for a chef by email
     app.get('/my-orders/:email', async (req, res) => {
      const email = req.params.email

      const result = await ordersCollection.find({ customer: email }).toArray()
      res.send(result)
    })
     // get all orders for a chef by email
    app.get('/manage-orders/:email', async (req, res) => {
      const email = req.params.email

      const result = await ordersCollection
        .find({ 'chef.email': email })
        .toArray()
      res.send(result)
    })


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




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
    // app.post("/users", async (req, res) => {
    //   const user = req.body;
    //   user.role = "user";
    //   user.userStatus = "active";
    //   user.createdAt = new Date().toISOString();
    //   user.last_loggedIn = new Date().toISOString()

    //   // exists user checking
    //   const userExists = await usersCollection.findOne({ email: user.email });
    //   if (userExists) {
    //     return res.send({ message: "User Already Exists -------------------->" });
    //   }
    //   const result = await usersCollection.insertOne(user);
    //   console.log("result", result);

    //   res.send(result);
    // });

    app.post('/users', async (req, res) => {
      const userData = req.body
      userData.created_at = new Date().toISOString()
      userData.last_loggedIn = new Date().toISOString()
      userData.role = 'customer'

      const query = {
        email: userData.email,
      }

      const alreadyExists = await usersCollection.findOne(query)
      console.log('User Already Exists---> ', !!alreadyExists)

      if (alreadyExists) {
        console.log('Updating user info......')
        const result = await usersCollection.updateOne(query, {
          $set: {
            last_loggedIn: new Date().toISOString(),
          },
        })
        return res.send(result)
      }
       console.log('Saving new user info......')
      const result = await usersCollection.insertOne(userData)
      res.send(result)
    })
    // get user from database

      // get a user's role
    app.get('/user/role', async (req, res) => {
      const result = await usersCollection.findOne({ email })
      res.send({ role: result?.role })
    })
    // app.get("/users", async (req, res) => {
    //   const email = req.query.email;
    //   console.log("email", email);
    //   const query = {};
    //   if (email) {
    //     query.email = email;
    //   }
    //   try {
    //     const cursor = usersCollection.find(query);
    //     const result = await cursor.toArray();
    //     res.send(result);
    //   } catch (error) {
    //     res.send(error);
    //   }
    // });

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

    if (!existingOrder) {
      const meal = await mealsCollection.findOne({
        _id: new ObjectId(session.metadata.mealId),
      })

      await ordersCollection.insertOne({
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
      })

      await mealsCollection.updateOne(
        { _id: meal._id },
        { $inc: { quantity: -Number(session.metadata.quantity) } }
      )
    }

    // ✅ JSON RESPONSE ONLY
    res.json({ success: true })
  } catch (err) {
    console.error("Payment Success Error:", err.message)
    res.status(500).json({ error: "Payment failed" })
  }
})


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

    // prevent duplicate order (IMPORTANT)
    const existingOrder = await ordersCollection.findOne({
      transactionId: session.payment_intent,
    })

    if (existingOrder) {
      return res.json({ success: true, message: "Order already processed" })
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

    // ✅ return JSON, NOT redirect
    res.json({ success: true })
  } catch (err) {
    console.error("Payment Success Error:", err.message)
    res.status(500).json({ error: "Payment failed" })
  }
})



    // // get all orders for a chef by email
    //  app.get('/my-orders/:email', async (req, res) => {
    //   const email = req.params.email

    //   const result = await ordersCollection.find({ customer: email }).toArray()
    //   res.send(result)
    // })
    // save a meal data in db 
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
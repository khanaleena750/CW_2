// Import dependencies modules:
const express = require('express');
const path = require("path");
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

// Create an Express.js instance:
const app = express();

// Config Express.js
app.use(express.json()); // Middleware to parse JSON in requests
app.set('port', 3000); // Set the port number to 3000
app.use((req, res, next) => {
    // Set headers for CORS (Cross-Origin Resource Sharing)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

// Serve static files from the 'static', 'public', and 'images' directories
var staticPath = path.resolve(__dirname, "static");
app.use(express.static(staticPath));
var publicPath = path.resolve(__dirname, "public");
var imagePath = path.resolve(__dirname, "images");
app.use('/public', express.static(publicPath));
app.use('/images', express.static(imagePath));
app.use(function (req, res) {
    // Serve a plain text response if no static file is found
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Error 404 no static file found.");
    // Remove the next() call as it's not needed here
});

let db;

MongoClient.connect('mongodb+srv://ak2432:Aleenaali@gettingstarted.uumymka.mongodb.net/', { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
    } else {
        db = client.db(); // No need to specify the database name here
        console.log('Connected to MongoDB successfully');
    }
});

// Define a route for the root path
app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/messages');
});

// Define a route for searching lessons
app.get('/search', (req, res) => {
    const searchTerm = req.query.term;

    // Perform a MongoDB search using the searchTerm
    // Update the query based on your lesson schema
    db.collection('lessons').find({
        $or: [
            { title: { $regex: new RegExp(searchTerm, 'i') } },
            { location: { $regex: new RegExp(searchTerm, 'i') } },
        ],
    }).toArray()
        .then(results => {
            res.json(results);
        })
        .catch(error => {
            console.error('Error performing search:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Define a route for placing orders
app.post('/orders', (req, res) => {
    const order = req.body;

    // Validate the request body
    if (!order.cartItems || !Array.isArray(order.cartItems)) {
        return res.status(400).json({ error: 'Invalid request: cartItems is missing' });
    }

    // Extract titles from cartItems and add them to the order
    const placeOrder = order.cartItems.map(item => item.title);
    order.order = placeOrder;

    // Insert the order into the 'orders' collection
    db.collection('orders').insertOne(order, (err, result) => {
        if (err) {
            console.error('Error placing order:', err);
            return res.status(500).json({ error: 'Error placing order' });
        }
        console.log('Order placed successfully');
        return res.status(201).json({ message: 'Order placed successfully', orderId: result.insertedId });
    });
});

// Define a route to fetch products (assuming you have a MongoDB collection named 'products')
app.get('/products', (req, res) => {
    db.collection('products').find({}).toArray()
        .then(products => {
            res.json(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Define a route to save an order (assuming you have a MongoDB collection named 'order')
app.post('/order', (req, res) => {
    const order = req.body;

    db.collection('order').insertOne(order, (err, result) => {
        if (err) {
            console.error('Error placing order:', err);
            return res.status(500).json({ error: 'Error placing order' });
        }
        console.log('Order placed successfully');
        res.status(201).json({ message: 'Order placed successfully', orderId: result.insertedId });
    });
});

// Define a route to update available spaces for a product
app.put('/products/:productId/update-space', (req, res) => {
    const productId = req.params.productId;

    // Additional logic to update available spaces based on productId
    // Example: Assuming you have a MongoDB collection named 'products'
    db.collection('products').updateOne(
        { _id: ObjectID(productId) },
        { $inc: { spaces: -1 } } // Decrease available spaces by 1
    )
        .then(result => {
            console.log('Product space updated successfully');
            res.json({ message: 'Product space updated successfully' });
        })
        .catch(error => {
            console.error('Error updating product space:', error);
            res.status(500).json({ error: 'Error updating product space' });
        });
});

// Start the Express.js server on port 3000
app.listen(4000, () => {
    console.log('Express.js server running at localhost:4000');
});

// Note: The following lines are commented out, as they are not needed in your current configuration
// const port = process.env.PORT || 4000
// app.listen(port)

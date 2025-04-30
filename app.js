import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient, ObjectId } from 'mongodb';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import path from 'path';
import session from 'express-session';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import multer from 'multer';
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;
import { sendWelcomeEmail, sendContactFormEmail } from './js/emailer.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'url';
import { basename } from 'path';

// Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: 'dwleulesv',
    api_key: '779963937451435',
    api_secret: 'A4-apjDUYzgjlwRm7eSbVYaE5fc',
});

// Configure Multer for local storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // Correct WebSocket server initialization
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "html")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const sessionMiddleware = session({
    secret: 'sampleOnly',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60,  // Set session TTL (Time to Live), e.g., 14 days
    }),
    cookie: {
        secure: false, // Set to true in production with HTTPS
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24,  // 1 day expiry
    }
});

app.use(sessionMiddleware);


// ===================================================================
// 2. DATABASE CONNECTION
// ===================================================================
let db;
const connectDB = async () => {
    try {
        const client = new MongoClient(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await client.connect();
        console.log("✅ Connected to DB");
        db = client.db('SampleDB');
    } catch (error) {
        console.error("❌ DB connection failed:", error);
        process.exit(1);
    }
};

// Ensure DB is ready
app.use((req, res, next) => {
    if (!db) return res.status(503).json({ error: "Database connection is not ready" });
    req.db = db;
    next();
});

// ===================================================================
// 3. WEBSOCKET
// ===================================================================
let activeUsers = new Set();

wss.on("connection", (ws, req) => {
    sessionMiddleware(req, {}, () => {
        if (req.session?.user) {
            const userEmail = req.session.user.email;
            activeUsers.add(userEmail);
            // console.log("WebSocket user connected:", userEmail);
            ws.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));

            ws.on("close", () => {
                activeUsers.delete(userEmail);
            });
        }
    });
});

// ===================================================================
// 4. HELPER FUNCTIONS
// ===================================================================
const servePage = (route, page) =>
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, 'html', page)));

const serveFile = (route, folder, file) =>
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, folder, file)));

const getUserRole = (req) => req.session.user ? req.session.user.role : null;

const ensureAdmin = (req, res, next) => {
    if (req.session.user?.role.toLowerCase() !== 'admin') return res.redirect('/home');
    next();
};

// ===================================================================
// 5. HTML PAGES & STATIC FILES
// ===================================================================

// HTML Pages
servePage('/', 'index.html');
servePage('/signup', 'signup.html');
servePage('/login', 'login.html');
servePage('/home', 'home.html');
servePage('/profile', 'profile.html');
servePage('/settings', 'settings.html');
servePage('/staff', 'staff.html');
servePage('/counter', 'counter.html');
servePage('/employee', 'employee.html');
servePage('/reports', 'reports.html');
servePage('/menuItem', 'menuItem.html');
servePage('/help', 'help.html');

app.get('/dashboard', ensureAdmin, (req, res) =>
    res.sendFile(path.join(__dirname, 'html', 'dashboard.html'))
);

// Static JS files
['emailer', 'index', 'signup', 'login', 'user', 'menu', 'product', 'connection', 'dashboard', 'home', 'profile', 'staff', 'counter', 'settings', 'employee', 'reports'].forEach(file =>
    serveFile(`/js/${file}.js`, 'js', `${file}.js`)
);

// Static CSS files
['dashboard', 'signup', 'login', 'index', 'home', 'menuItem', 'profile', 'settings', 'staff', 'counter', 'mediaType', 'keyframe', 'employee', 'reports'].forEach(file =>
    serveFile(`/css/${file}.css`, 'css', `${file}.css`)
);

// Serve image files from /img
app.use('/img', express.static(path.join(__dirname, 'img')));

// ===================================================================
// 6. API ROUTES
// ===================================================================

// 6.1 Get current user session
app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.json(req.session.user);
});

// 6.2 Dashboard data
app.get('/api/dashboard-data', ensureAdmin, async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        res.json({ userCount, activeUsers: activeUsers.size });
    } catch (error) {
        console.error("❌ Dashboard Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 6.3 Active users
app.get('/activeUsers', (req, res) => res.json({ activeUsers: activeUsers.size }));

// 6.4 User count
app.get('/count', async (req, res) => {
    try {
        const userCount = await db.collection('users').countDocuments();
        res.json({ userCount });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 6.5 Validate old password
app.post('/api/validate-password', async (req, res) => {
    const { oldPassword } = req.body;
    if (!req.session.user) return res.status(401).json({ error: 'User not logged in' });

    const user = await db.collection('users').findOne({ email: req.session.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Old password is incorrect' });

    res.status(200).json({ success: 'Old password is valid' });
});

// ===================================================================
// 7. AUTH ROUTES
// ===================================================================

// 7.1 Register
app.post('/register', async (req, res) => {
    const { lastName, firstName, email, contact, address, gender, dob, username, password } = req.body;

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    const existingUser = await db.collection('users').findOne({
        $or: [{ email: emailLower }, { username: usernameLower }]
    });

    if (existingUser) return res.status(400).json({ error: "Email or username already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
        lastName, firstName, email: emailLower, contact, address, gender, dob,
        username: usernameLower, password: hashedPassword, createdDate: new Date(), role: 'userOnly'
    });

    if (!result.insertedId) return res.status(500).json({ error: "Registration failed" });

    await sendWelcomeEmail(email);
    res.status(200).json({ success: "Registration successful!" });
});

// 7.2 Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.redirect('/login?error=Invalid credentials');
    }

    const loginTime = new Date();
    const isAdmin = user.role.toLowerCase() === 'admin';
    let loginLogId = null;

    // Log login event for non-admin users
    if (!isAdmin) {
        const result = await db.collection('logs').insertOne({
            userId: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            loginTime,
            logoutTime: null,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true
        });
        loginLogId = result.insertedId;
    }

    // Regenerate the session (this will automatically clean up the old session)
    req.session.regenerate((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to regenerate session' });
        }

        // Clear out any previous user data from the session
        req.session.user = null;  // Explicitly clear the user data

        // Assign new user data to the session
        req.session.user = {
            lastName: user.lastName,
            firstName: user.firstName,
            email: user.email,
            contact: user.contact,
            address: user.address,
            gender: user.gender,
            dob: user.dob,
            username: user.username,
            role: user.role,
            loginLogId,
            loginTime
        };

        // Save the session with the new session ID in MongoDB
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save session' });
            }

            // Redirect based on user role
            res.redirect(isAdmin ? '/dashboard' : user.role === 'staff' ? '/staff' : '/home');
        });
    });
});

// 7.3 Logout
app.post("/logout", async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const { loginLogId, email } = req.session.user;

    try {
        if (loginLogId) {
            await db.collection('logs').updateOne(
                { _id: new ObjectId(loginLogId) },
                { $set: { logoutTime: new Date() } }
            );
        }

        activeUsers.delete(email);
        req.session.destroy(err => {
            if (err) return res.status(500).json({ error: "Logout failed" });
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    } catch (err) {
        console.error("Logout logging failed:", err);
        res.status(500).send("Logout error");
    }
});

// ===================================================================
// 8. USER ROUTES
// ===================================================================
// 8.1 Fetch all users (testing)
app.get('/users', async (req, res) => {
    try {
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;

    // Check if ObjectId is valid
    if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ error: 'Invalid User ID format' });
    }

    try {
        const collection = db.collection('users');

        // Query the database using findOne to fetch a single user by _id
        const user = await collection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // Send user data as JSON
        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.delete('/delete/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "User not found or already deleted" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/update/user', async (req, res) => {
    const { userId, password, ...updateFields } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        // Hash password if it's included in the update request
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
            updateFields.password = hashedPassword; // Replace password in updateFields with hashed password
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        res.status(200).json({
            message: "User updated successfully",
            updatedUser
        });
    } catch (error) {
        console.error("❌ Update Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ===================================================================
// 9. MENU ROUTES
// ===================================================================
// 9.1 Fetch menu by role
app.get('/menu', async (req, res) => {
    const role = getUserRole(req);
    if (!role) return res.status(403).json({ error: "User role not found or unauthorized" });

    try {
        const menuItems = await db.collection('menu').find({ role }).toArray();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 9.2 Insert 
app.post('/insert/menu', async (req, res) => {
    const { role, menuItems } = req.body;

    if (!role || !menuItems) {
        return res.status(400).json({ error: "Role and menu items are required" });
    }

    try {
        const result = await db.collection('menu').insertOne({
            role,
            items: menuItems
        });

        res.status(201).json({ message: "Menu inserted successfully", menuId: result.insertedId });
    } catch (error) {
        console.error("❌ Menu Insert Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 9.3 Update menu
app.put('/update/menu/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
        const result = await db.collection('menu').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.status(200).json({ message: "Menu updated successfully" });
    } catch (err) {
        console.error("❌ Error updating menu item:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 9.4 Delete menu
app.delete('/delete/menu/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Menu ID is required" });
    }

    try {
        const result = await db.collection('menu').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.status(200).json({ message: "Menu item deleted successfully" });
    } catch (error) {
        console.error("❌ Menu Deletion Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


//=====================================================================
//Employee routes
//=====================================================================
app.get('/logs', async (req, res) => {
    try {
        // If the current user is an admin
        if (req.session.user.role.toLowerCase() === 'admin') {
            // Fetch all user logs
            const logs = await db.collection('logs').find({}).toArray(); 
            res.json(logs);
        } else {
            // Fetch only the logs for the current user
            const userEmail = req.session.user.email;
            const logs = await db.collection('logs').find({ email: userEmail }).toArray();
            res.json(logs);
        }
    } catch (err) {
        res.status(500).json({ error: "Error fetching logs." });
    }
});

// ===================================================================
// 10. PRODUCT ROUTES (Testing)
// ===================================================================

// 10.1 Get products
app.get('/products', async (req, res) => {
    try {
        const category = req.query.category;
        const products = await db.collection('products').find().toArray();
        if (category) {
            // If category is provided, filter products by category (case-insensitive)
            const filteredProducts = products.filter(product => 
                product.category && product.category.toLowerCase() === category.toLowerCase()
            );
            
            if (filteredProducts.length > 0) {
                return res.json(filteredProducts); // Return filtered products
            } else {
                return res.status(404).json({ message: 'No products found in this category.' });
            }
        }
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal Server Error" }); // Handle any errors during the database operation
    }
});

// Add product route with Cloudinary image upload
app.post('/add/product', upload.single('image'), async (req, res) => {
    const { name, description, price, quantity, category } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }

    try {
        // Extract the file name and extension
        const fileName = path.parse(req.file.originalname).name; // Get the file name without extension
        const fileExtension = path.parse(req.file.originalname).ext; // Get the file extension

        // Build the public ID for Cloudinary
        const publicId = `${Date.now()}-${fileName}`;

        // Upload image to Cloudinary using upload_stream
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'products',
                    public_id: publicId, // Use sanitized public ID
                    timeout: 60000, // Set timeout to 60 seconds
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file.buffer); // Pass the file buffer to the stream
        });

        // Insert product into the database
        const imageUrl = result.secure_url;
        
        const dbResult = await db.collection('products').insertOne({
            name,
            description,
            price: parseFloat(price), // Ensure price is stored as a float
            image: imageUrl,
            category,
            quantity: parseInt(quantity), // Ensure quantity is stored as an integer
        });

        res.status(201).json({
            message: 'Product added successfully',
            productId: dbResult.insertedId,
            imageUrl,
        });
    } catch (error) {
        console.error('❌ Error inserting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 10.3 Update product
app.put('/update/product/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, image, quantity, category } = req.body;

    // Validate that all fields are provided
    if (!name || !description || !price || !quantity || !category) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const result = await db.collection('products').updateOne(
            { _id: new ObjectId(productId) }, // Find the product by ID
            {
                $set: {
                    name,
                    description,
                    price: parseInt(price),
                    image,
                    category,
                    quantity: parseInt(quantity),
                }
            }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Product updated successfully' });
        } else {
            res.status(404).json({ error: 'Product not found or no changes made' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 10.4 Delete product
app.delete('/delete/product/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        // Find the product by ID
        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete the product's image from Cloudinary if it exists
        if (product.image) {
            try {
                // Extract the public ID from the image URL
                const imageUrl = product.image;
                const publicId = imageUrl
                    .split('/')
                    .slice(-2)
                    .join('/')
                    .replace(/\.[^/.]+$/, ''); // Remove the file extension

                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.error('❌ Error deleting image from Cloudinary:', cloudinaryError);
            }
        }

        // Delete the product from the database
        const result = await db.collection('products').deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//===================================================================
// 11. RECEIPT ROUTES (Testing)
// ===================================================================
app.post('/insert/receipts', async (req, res) => {
    try {
        const receipt = req.body;
        // Save the receipt to the database
        await db.collection('receipts').insertOne(receipt);
        res.status(200).json({ message: "Receipt received successfully." });
    } catch (error) {
        console.error("Error saving receipt:", error);
        res.status(500).json({ error: "Failed to save receipt." });
    }
});

// Fetch all receipts
app.get('/get/receipts', async (req, res) => {
    try {
        const receipts = await db.collection('receipts').find().toArray();
        res.json(receipts);
    } catch (error) {
        console.error("Error fetching receipts:", error);
        res.status(500).json({ error: "Failed to fetch receipts." });
    }
});

// ===================================================================
// 12. CONTACT FORM
// ===================================================================
app.post("/submit-contact", async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "All fields are required!" });

    const response = await sendContactFormEmail(name, email, message);
    if (response.success) {
        res.json({ message: response.message });
    } else {
        res.status(500).json({ error: response.error });
    }
});

// ===================================================================
// 13. 404 HANDLER
// ===================================================================
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'html', '404.html'));
});

// ===================================================================
// 14. START SERVER
// ===================================================================
connectDB().then(() => {
    server.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}/`));
});

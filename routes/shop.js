import express from 'express';
const router = express.Router();
import fetch from 'node-fetch';

// Import Models
import Product from '../models/product.js';
import Testimonial from '../models/testimonial.js';
import User from '../models/user.js';
import Order from '../models/order.js';
import Page from '../models/page.js';
import ContactMessage from '../models/contactMessage.js';


// Home Page
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });

    // --- NEW LOGIC: Fetch products explicitly marked as featured ---
    const featuredProducts = await Product.find({ isFeatured: true })
      .sort({ createdAt: -1 }) // Sort by newest featured
      .limit(4) // Limit to display 4 products
      .lean();

    // --- NEW LOGIC: Fetch products explicitly marked as loved ---
    const lovedProducts = await Product.find({ isLoved: true })
      .sort({ rating: -1 }) // Sort by highest rating
      .limit(4) // Limit to display 4 products
      .lean();

    res.render('index', {
      pageTitle: res.locals.settings.metaTitle,
      testimonials,
      featuredProducts,
      lovedProducts
    });

  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.render('index', {
      pageTitle: res.locals.settings.metaTitle,
      testimonials: [],
      featuredProducts: [],
      lovedProducts: []
    });
  }
});


// NEW: Product Search Page
router.get('/products/search', async (req, res) => {
    try {
        const searchQuery = req.query.query ? req.query.query.trim() : '';

        if (!searchQuery) {
            // If search query is empty, redirect to the main products page
            return res.redirect('/products');
        }

        // Use a case-insensitive regular expression to search across 
        // multiple relevant fields (name, shortDesc, brand, category)
        const searchRegex = new RegExp(searchQuery, 'i');
        
        const products = await Product.find({
            $or: [
                { name: { $regex: searchRegex } },
                { shortDesc: { $regex: searchRegex } },
                { brand: { $regex: searchRegex } },
                { category: { $regex: searchRegex } }
            ]
        }).sort({ name: 1 }); // Sort by name ascending

        // Group the search results by category for consistent display
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});

        res.render('products', { 
            groupedProducts, 
            pageTitle: `Search Results for: "${searchQuery}"`
        });

    } catch (err) {
        console.error('Error fetching search results:', err);
        res.status(500).send('Server Error: Could not process search request.');
    }
});
// ... (rest of the shop.js routes continue)


// In routes/shop.js (around line 10)

// NEW: API for Search Suggestions
router.get('/api/products/suggest', async (req, res) => {
    try {
        const query = req.query.q ? req.query.q.trim() : '';

        // Only return suggestions if the query is long enough
        if (query.length < 2) {
            return res.json([]);
        }

        // Use a case-insensitive regular expression to search product name and brand, starting from the beginning of the field
        const searchRegex = new RegExp('^' + query, 'i');

        const suggestions = await Product.find({
            $or: [
                { name: { $regex: searchRegex } },
                { brand: { $regex: searchRegex } }
            ]
        })
        // Select necessary fields only to keep payload small
        .select('name id image price') 
        .limit(6) // Limit the number of suggestions
        .lean();

        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// All Products Page
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products', { groupedProducts, pageTitle: "All Antivirus Products" });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server Error: Could not load products.');
    }
});

// NEW: Norton Antivirus Product Listing Page
router.get('/products/norton', async (req, res) => {
    try {
        const products = await Product.find({ category: 'Norton' }); // Filter by category 'Norton'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_norton', { groupedProducts, pageTitle: "Norton Antivirus Products" });
    } catch (err) {
        console.error('Error fetching Norton products:', err);
        res.status(500).send('Server Error: Could not load Norton products.');
    }
});

// NEW: McAfee Antivirus Product Listing Page
router.get('/products/mcafee', async (req, res) => {
    try {
        const products = await Product.find({ category: 'McAfee' }); // Filter by category 'McAfee'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_mcafee', { groupedProducts, pageTitle: "McAfee Antivirus Products" });
    } catch (err) {
        console.error('Error fetching McAfee products:', err);
        res.status(500).send('Server Error: Could not load McAfee products.');
    }
});

router.get('/products/avast', async (req, res) => {
    try {
        const products = await Product.find({ category: 'AVAST' }); // Filter by category 'AVAST'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_avast', { groupedProducts, pageTitle: "Avast Antivirus Products" });
    } catch (err) {
        console.error('Error fetching avast products:', err);
        res.status(500).send('Server Error: Could not load avast products.');
    }
});

router.get('/products/bitdefender', async (req, res) => {
    try {
        const products = await Product.find({ category: 'BITDEFENDER' }); // Filter by category 'Bitdefender'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_bitdefender', { groupedProducts, pageTitle: "Bitdefender Antivirus Products" });
    } catch (err) {
        console.error('Error fetching Bitdefender products:', err);
        res.status(500).send('Server Error: Could not load Bitdefender products.');
    }
});

router.get('/products/avg', async (req, res) => {
    try {
        const products = await Product.find({ category: 'AVG' }); // Filter by category 'AVG'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_avg', { groupedProducts, pageTitle: "AVG Antivirus Products" });
    } catch (err) {
        console.error('Error fetching AVG products:', err);
        res.status(500).send('Server Error: Could not load AVG products.');
    }
});

router.get('/products/watchdog', async (req, res) => {
    try {
        const products = await Product.find({ category: 'Watchdog' }); // Filter by category 'Watchdog'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) { acc[product.category] = []; }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_watchdog', { groupedProducts, pageTitle: "Watchdog Antimalware Products" });
    } catch (err) {
        console.error('Error fetching Watchdog products:', err);
        res.status(500).send('Server Error: Could not load Watchdog products.');
    }
});


// Product Detail Page
router.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({ id: productId });
        if (product) {
            const relatedProducts = await Product.find({ category: product.category, id: { $ne: product.id } }).limit(4);
            res.render('product_detail', { product, relatedProducts, pageTitle: product.name });
        } else { res.status(404).send('Product not found'); }
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).send('Server Error: Could not load product details.');
    }
});

// User Login Page
router.get('/login', (req, res) => { res.render('login', { pageTitle: "Login | CyberSafeTrust", errorMessage: null }); });

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && user.password === password) {
            req.session.user = { id: user._id, username: user.username, role: user.role };
            res.redirect('/');
        } else { res.render('login', { pageTitle: "Login | CyberSafeTrust", errorMessage: 'Invalid username or password.' }); }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { pageTitle: "Login | CyberSafeTrust", errorMessage: 'An error occurred during login.' });
    }
});

// Contact Page
router.get('/contact', (req, res) => { res.render('contact', { pageTitle: "Contact Us", message: null, error: null }); });

router.post('/contact', async (req, res) => {
    const { email, subject, message } = req.body;
    if (!email || !subject || !message) { return res.render('contact', { pageTitle: "Contact Us", message: null, error: 'Please fill in all fields.' }); }
    
    try {
        const dynamicTransporter = req.app.locals.getTransporter(req.app.locals);
        const adminEmailRecipient = req.app.locals.settings.contactRecipientEmail || 'chaturvedipiyush40@gmail.com';

        const newContactMessage = new ContactMessage({
            senderEmail: email,
            subject: subject,
            message: message
        });
        await newContactMessage.save();
        console.log('Contact message saved to DB:', newContactMessage);

        const mailOptions = {
            from: dynamicTransporter.options.auth.user,
            to: adminEmailRecipient,
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <p>You have received a new contact message from your website:</p>
                <h3>Contact Details:</h3>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Subject:</strong> ${subject}</li>
                </ul>
                <h3>Message:</h3>
                <p>${message}</p>
                <p>View this message in admin panel: <a href="http://localhost:3000/admin/contact-messages/${newContactMessage._id}">Link to Message</a></p>
            `,
        };
        await dynamicTransporter.sendMail(mailOptions);
        console.log('Contact email sent successfully to admin!');

        if (req.app.locals.settings.sendCustomerContactConfirmEmail) {
            const customerMailOptions = {
                from: dynamicTransporter.options.auth.user,
                to: email,
                subject: `Confirmation: Your message to CyberSafeTrust - ${subject}`,
                html: `
                    <p>Dear Customer,</p>
                    <p>Thank you for contacting CyberSafeTrust. We have received your message and will get back to you shortly.</p>
                    <h3>Your Message Details:</h3>
                    <ul>
                        <li><strong>Subject:</strong> ${subject}</li>
                        <li><strong>Message:</strong> ${message}</li>
                    </ul>
                    <p>Sincerely,<br>The CyberSafeTrust Team</p>
                `,
            };
            await dynamicTransporter.sendMail(customerMailOptions);
            console.log('Confirmation email sent to customer!');
        }


        res.render('contact', { pageTitle: "Contact Us", message: 'Your message has been sent successfully!', error: null });

    } catch (error) {
        console.error('Error sending contact email or saving message:', error);
        res.render('contact', { pageTitle: "Contact Us", message: null, error: 'Failed to send your message. Please try again later.' });
    }
});

// CART ROUTES
router.get('/cart', (req, res) => { res.render('cart', { pageTitle: 'Your Shopping Cart' }); });

router.post('/cart/add', async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    try {
        const product = await Product.findOne({ id: productId });
        if (!product) { return res.status(404).json({ message: 'Product not found.' }); }
        if (!req.session.cart) { req.session.cart = []; }
        const existingItemIndex = req.session.cart.findIndex(item => item.id === productId);
        if (existingItemIndex > -1) { req.session.cart[existingItemIndex].quantity += parseInt(quantity); }
        else { req.session.cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: parseInt(quantity), }); }
        res.json({ message: 'Product added to cart!', cart: req.session.cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Failed to add product to cart.' });
    }
});

router.post('/cart/update', (req, res) => {
    const { productId, quantity } = req.body;
    if (!req.session.cart) { return res.status(400).json({ message: 'Cart is empty.' }); }
    const itemIndex = req.session.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        if (quantity <= 0) { req.session.cart.splice(itemIndex, 1); }
        else { req.session.cart[itemIndex].quantity = parseInt(quantity); }
        res.json({ message: 'Cart updated!', cart: req.session.cart });
    } else { res.status(404).json({ message: 'Product not found in cart.' }); }
});

// CHECKOUT ROUTES
router.get('/checkout', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) { return res.redirect('/cart'); }
    res.render('checkout', { 
        pageTitle: 'Checkout',
        customer: req.session.user ? { fullName: req.session.user.username, email: req.session.user.email, phone: '', address: '', city: '', zipCode: '', country: '' } : null
    });
});

router.post('/checkout/save-details', (req, res) => { req.session.customerDetails = req.body; res.status(200).json({ message: 'Customer details saved to session.' }); });

// PayPal API Routes
router.post('/api/orders', async (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) { return res.status(400).json({ error: 'Cart is empty. Cannot create order.' }); }
    const purchase_units = req.session.cart.map(item => ({ amount: { currency_code: 'USD', value: (item.price * item.quantity).toFixed(2) }, description: item.name, }));

    try {
        const accessToken = await req.app.locals.generateAccessToken(req.app.locals);
        const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ intent: 'CAPTURE', purchase_units: purchase_units, application_context: { return_url: 'http://localhost:3000/checkout/success', cancel_url: 'http://localhost:3000/checkout/cancel' }, }), });
        const order = await response.json();
        if (response.ok) { res.json({ orderID: order.id }); }
        else { console.error('PayPal create order error:', order); res.status(response.status).json({ error: order.message || 'Failed to create PayPal order' }); }
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/orders/:orderID/capture', async (req, res) => {
    const { orderID } = req.params;
    try {
        const accessToken = await req.app.locals.generateAccessToken(req.app.locals);
        const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, });
        const captureData = await response.json();
        if (response.ok) {
            const newOrder = new Order({
                userId: req.session.user ? req.session.user.id : null,
                customerName: req.session.customerDetails ? req.session.customerDetails.fullName : (req.session.user ? req.session.user.username : 'Guest'),
                customerEmail: req.session.customerDetails ? req.session.customerDetails.email : (req.session.user ? req.session.user.email : 'guest@example.com'),
                paypalOrderId: captureData.id,
                paypalPayerId: captureData.payer.payer_id,
                status: captureData.status,
                totalAmount: parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value),
                currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
                items: req.session.cart.map(item => ({ productId: item.id, name: item.name, price: item.price, quantity: item.quantity, image: item.image })),
                shippingAddress: req.session.customerDetails || {}
            });
            await newOrder.save(); console.log('Order saved to DB:', newOrder); req.session.cart = []; delete req.session.customerDetails; res.json(captureData);
        } else { console.error('PayPal capture order error:', captureData); res.status(response.status).json({ error: captureData.message || 'Failed to capture PayPal order' }); }
    } catch (error) {
        console.error('Error capturing PayPal order or saving order to DB:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/checkout/success', (req, res) => { res.send('<h1>Payment Successful!</h1><p>Thank you for your purchase.</p><a href="/">Go Home</a>'); });
router.get('/checkout/cancel', (req, res) => { res.send('<h1>Payment Cancelled</h1><p>Your payment was cancelled. Please try again.</p><a href="/">Go Home</a>'); });

// ROUTE FOR DISPLAYING DYNAMIC CMS PAGES (Publicly accessible)
router.get('/page/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug });
        if (page) { res.render('dynamic_page', { page, pageTitle: page.title }); }
        else { res.status(404).send('Page not found'); }
    } catch (error) {
        console.error('Error fetching dynamic page:', error);
        res.status(500).send('Server Error: Could not load page.');
    }
});

router.get('/login', (req, res) => { res.render('login', { pageTitle: "login", message: null, error: null }); });

export default router;

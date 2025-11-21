// Import necessary modules
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import fs from 'fs';
import http from 'http';
import https from 'https';
import multer from 'multer';
import MongoStore from 'connect-mongo'; // NEW: Import connect-mongo
import nodemailer from 'nodemailer';

// Database connection
import connectDB from './db.js'; // Ensure this is importing your connectDB function

// Models
import Setting from './models/setting.js';
import Page from './models/page.js';
import Product from './models/product.js';

// Import Route Modules
import shopRoutes from './routes/shop.js';
import adminRoutes from './routes/admin.js';


// Derive __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB(); // Ensure this establishes connection to the MONGODB_URI

// --- Multer Storage Configurations (kept here) ---
const productImagesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'products');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => { cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); }
});

const testimonialImagesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'testimonials');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => { cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`); }
});

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'logos');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => { cb(null, `main_logo${path.extname(file.originalname)}`); }
});

const campaignBannerImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'campaign_banners');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => { cb(null, `campaign_banner_${Date.now()}${path.extname(file.originalname)}`); }
});

// --- Multer Instances ---
app.locals.uploadProductImage = multer({
    storage: productImagesStorage, limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { const filetypes = /jpeg|jpg|png|gif/; const mimetype = filetypes.test(file.mimetype); const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); if (mimetype && extname) { return cb(null, true); } cb(new Error('Only images (jpeg, jpg, png, gif) are allowed for products!')); }
});

app.locals.uploadTestimonialImage = multer({
    storage: testimonialImagesStorage, limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { const filetypes = /jpeg|jpg|png|gif/; const mimetype = filetypes.test(file.mimetype); const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); if (mimetype && extname) { return cb(null, true); } cb(new Error('Only images (jpeg, jpg, png, gif) are allowed for testimonials!')); }
});

app.locals.uploadLogo = multer({
    storage: logoStorage, limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { const filetypes = /jpeg|jpg|png|gif|svg/; const mimetype = filetypes.test(file.mimetype); const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); if (mimetype && extname) { return cb(null, true); } cb(new Error('Only image files (jpeg, jpg, png, gif, svg) are allowed for logo!')); }
});

app.locals.uploadCampaignBannerImage = multer({
    storage: campaignBannerImageStorage, limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => { const filetypes = /jpeg|jpg|png|gif/; const mimetype = filetypes.test(file.mimetype); const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); if (mimetype && extname) { return cb(null, true); } cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed for campaign banners!')); }
});

// --- End Multer Configuration ---

// Pass common services/configs to routes via app.locals

app.locals.generateAccessToken = async (appLocals) => { /* ... */ };

app.locals.getTransporter = (appLocals) => { // <-- ADD/UPDATE THIS FUNCTION
    // Prioritize credentials from .env, fall back to admin settings
    const user = process.env.EMAIL_USER || appLocals.settings.emailUser;
    const pass = process.env.EMAIL_PASS || appLocals.settings.emailPass;

    if (!user || !pass) {
        console.error("Nodemailer: Email credentials missing.");
        return null;
    }
    
    // Auto-detect service (like Gmail) for simplified configuration
    const service = user.toLowerCase().includes('gmail') ? 'gmail' : null;
    
    return nodemailer.createTransport({
        service: service,
        // If not using a known service, configure host/port (using Gmail convention as an example)
        host: service ? undefined : 'smtp.yourhost.com', 
        port: service ? 465 : 587,
        secure: service ? true : false,
        auth: {
            user: user,
            pass: pass
        }
    });
}; // <-- END ADDED FUNCTION

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure express-session with MongoStore (CRITICAL FIX FOR DEPLOYMENT)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key_here',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored (e.g., cart item)
    store: MongoStore.create({ // Use MongoStore
        mongoUrl: process.env.MONGODB_URI, // Your MongoDB connection string
        collectionName: 'sessions', // Collection to store sessions in
        touchAfter: 24 * 3600 // Update session in DB only once every 24 hours (unless data changes)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
        httpOnly: true, // Prevent client-side JS from accessing cookie
        sameSite: 'Lax' // Recommended for CSRF protection and compatibility
    }
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if user is authenticated and is admin (defined globally for reusability)
app.locals.isAuthenticated = (req, res, next) => {
    if (req.session?.user?.role === 'admin') {
        return next();
    }
    res.redirect('/admin/login');
};

// Global Middleware to fetch settings and dynamic pages for all templates
app.use(async (req, res, next) => {
    // Ensure req.session.cart is properly accessed from session store
    // These `res.locals` must be derived from `req.session` which `connect-mongo` manages.
    res.locals.user = req.session.user;
    res.locals.cart = req.session.cart || [];

    // 1. Calculate Subtotal (Always defined first)
    res.locals.cartSubtotal = res.locals.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    let finalPrice = res.locals.cartSubtotal;
    let discount = 0; // Initialize discount amount
    
    res.locals.coupon = req.session.coupon || null;

    // 2. Coupon Discount Calculation Logic
    if (res.locals.coupon && res.locals.cart.length > 0) {
        const coupon = res.locals.coupon;
        
        // Fetch full product details (including category) for eligibility checks
        const cartProductIds = res.locals.cart.map(item => item.id);
        
        // Ensure Product model is imported correctly at the top of app.js 
        // (if not, you need to import it: import Product from './models/product.js';)
        const fullProducts = await Product.find({ id: { $in: cartProductIds } }).lean();

        let eligibleSubtotal = 0;

        for (const item of res.locals.cart) {
            const product = fullProducts.find(p => p.id === item.id);
            
            // Check if item is eligible for discount based on coupon rules
            const isEligible = (
                coupon.appliesTo === 'all' ||
                (coupon.appliesTo === 'products' && coupon.targetProductIds.includes(item.id)) ||
                (coupon.appliesTo === 'categories' && product && coupon.targetCategoryNames.includes(product.category))
            );

            if (isEligible) {
                eligibleSubtotal += item.price * item.quantity;
            }
        }
        
        // Apply discount only if there's an eligible subtotal
        if (eligibleSubtotal >= coupon.minOrderAmount) {
            if (coupon.discountType === 'percentage') {
                discount = eligibleSubtotal * (coupon.discountValue / 100);
            } else if (coupon.discountType === 'fixed') {
                discount = coupon.discountValue; 
            }
            
            // Ensure discount never exceeds the eligible subtotal
            discount = Math.min(discount, eligibleSubtotal); 
            finalPrice = res.locals.cartSubtotal - discount;
        } else {
             // Coupon failed minimum order check or eligibility check after items were removed
             req.session.coupon = null;
        }
    }
    // --- Final Assignment of Calculated Totals ---

    res.locals.cartTotalDiscount = discount.toFixed(2); 
    res.locals.cartTotalPrice = finalPrice.toFixed(2);
    
    res.locals.cartTotalItems = res.locals.cart.reduce((total, item) => total + item.quantity, 0);

    try {
        const settingsArray = await Setting.find({});
        req.app.locals.settings = {};
        settingsArray.forEach(setting => { req.app.locals.settings[setting.key] = setting.value; });

        res.locals.settings = req.app.locals.settings;

        // Set defaults if settings are not found
        res.locals.themeColor = req.app.locals.settings.themeColor || '#1e90ff';
        req.app.locals.settings.metaTitle = req.app.locals.settings.metaTitle || 'CyberSafeTrust | Antivirus Software & Security Solutions';
        req.app.locals.settings.metaDescription = req.app.locals.settings.metaDescription || 'Protect your digital life with the most trusted antivirus solutions. Save big on McAfee, Norton, Kaspersky, and more with instant activation and up to 80% off.';
        req.app.locals.settings.metaKeywords = req.app.locals.settings.metaKeywords || 'antivirus software, cybersecurity, virus protection, McAfee, Norton, Kaspersky, Bitdefender, buy antivirus online, PC security';
        res.locals.settings.homePhoneNumber = req.app.locals.settings.homePhoneNumber || '+5544669987';
        res.locals.settings.homeSubtitle = req.app.locals.settings.homeSubtitle || 'Highest Quality Commodities';
        res.locals.settings.homeHeading = req.app.locals.settings.homeHeading || 'Explore Top Antivirus Deals\nSave up to 80%';
        res.locals.settings.homeDescription = req.app.locals.settings.homeDescription || 'To protect your device and private information, choose the best antivirus software.';
        res.locals.settings.homeButtonText = req.app.locals.settings.homeButtonText || 'GET STARTED →';
        res.locals.settings.homeButtonLink = req.app.locals.settings.homeButtonLink || '/products';
        res.locals.settings.disclaimerHeading = req.app.locals.settings.disclaimerHeading || 'Disclaimer';
        res.locals.settings.disclaimerContent = req.app.locals.settings.disclaimerContent || `
            <strong>At ByteSafeGuard IT</strong> Solutions, we are proud to be an authorized reseller of premium branded products, operating with integrity and full regulatory compliance.<br>
            <strong>Trademark Use:</strong> All trademarks, logos, brand names, and product names on our site are the property of their respective owners, displayed solely for informational purposes.<br>
            <strong>Authorized Reseller:</strong> As an official participant in various reseller programs, we guarantee genuine products, each backed by the original brand’s warranty.<br>
            <strong>FTC Compliance:</strong> We adhere to all Federal Trade Commission (FTC) guidelines...<br>
            <strong>Commitment to Policy:</strong> ByteSafeGuard IT Solutions is dedicated to following all relevant policies...
        `.trim();
        res.locals.settings.mainLogoUrl = req.app.locals.settings.mainLogoUrl || '/image/CyberSafeTrust-logo.png';
        res.locals.settings.footerCompanyName = req.app.locals.settings.footerCompanyName || 'CyberSafeTrust';
        res.locals.settings.footerCompanyTagline = req.app.locals.settings.footerCompanyTagline || 'Protecting your digital life with the most trusted antivirus solutions.';
        res.locals.settings.footerQuickLinks = req.app.locals.settings.footerQuickLinks || [ { text: 'Home', url: '/' }, { text: 'All Products', url: '/products' }];
        res.locals.settings.footerContactEmail = req.app.locals.settings.footerContactEmail || 'support@cybersafetrust.com';
        res.locals.settings.footerContactPhone = req.app.locals.settings.footerContactPhone || '+91 98765 43210';
        res.locals.settings.footerContactAddress = req.app.locals.settings.footerContactAddress || 'Mumbai, India';
        res.locals.settings.footerPaymentMethods = req.app.locals.settings.footerPaymentMethods || 'Paypal, Visa, MasterCard, Discover and American Express';
        res.locals.settings.footerNewsletterHeading = req.app.locals.settings.footerNewsletterHeading || 'Stay Updated';
        res.locals.settings.footerCopyrightText = req.app.locals.settings.footerCopyrightText || '&copy; 2025 CyberSafeTrust. All rights reserved.';
        res.locals.settings.footerSocialIcons = req.app.locals.settings.footerSocialIcons || [ { name: 'Facebook', url: '#', img: 'https://img.icons8.com/ios-filled/20/ffffff/facebook--v1.png' }, { name: 'Twitter', url: '#', img: 'https://img.icons8.com/ios-filled/20/ffffff/twitter--v1.png' }, { name: 'LinkedIn', url: '#', img: 'https://img.icons8.com/ios-filled/20/ffffff/linkedin.png' } ];

        res.locals.settings.enableCampaignBanner = req.app.locals.settings.enableCampaignBanner || false;
        res.locals.settings.campaignBannerHeading = req.app.locals.settings.campaignBannerHeading || 'Limited Time Offer!';
        res.locals.settings.campaignBannerText = req.app.locals.settings.campaignBannerText || 'Get 50% OFF on all Antivirus products this week!';
        res.locals.settings.campaignBannerButtonText = req.app.locals.settings.campaignBannerButtonText || 'Shop Now';
        res.locals.settings.campaignBannerButtonLink = req.app.locals.settings.campaignBannerButtonLink || '/products';
        res.locals.settings.campaignBannerImageUrl = req.app.locals.settings.campaignBannerImageUrl || '';
        res.locals.settings.campaignBannerBackgroundColor = req.app.locals.settings.campaignBannerBackgroundColor || '#f0f8ff';
        res.locals.settings.campaignBannerTextColor = req.app.locals.settings.campaignBannerTextColor || '#333333';

        res.locals.settings.contactAddress = req.app.locals.settings.contactAddress || '511, Cyberhub, Sector 19, Gurugram, HR12200';
        res.locals.settings.contactEmail = req.app.locals.settings.contactEmail || 'support@cybersafetrust.com';
        res.locals.settings.contactPhone = req.app.locals.settings.contactPhone || '+91 98765 43210';


        res.locals.headerPages = await Page.find({ $or: [{ menuLocation: 'header' }, { menuLocation: 'both' }] }).sort({ order: 1, title: 1 });
        res.locals.footerPages = await Page.find({ $or: [{ menuLocation: 'footer' }, { menuLocation: 'both' }] }).sort({ order: 1, title: 1 });


    } catch (error) {
        console.error('Error fetching global settings or dynamic pages:', error);
        res.locals.themeColor = '#e63946';
        res.locals.settings = { /* ... all default settings ... */ };
        req.app.locals.settings = res.locals.settings;
        res.locals.headerPages = [];
        res.locals.footerPages = [];
    }

    next();
});

// Pass common services/configs to routes via app.locals
app.locals.generateAccessToken = async (appLocals) => { /* ... */ };
app.locals.getTransporter = (appLocals) => { /* ... */ };


// --- Use Route Modules ---
app.use('/', shopRoutes);
app.use('/admin', adminRoutes);


// Conditional Server Start
if (process.env.NODE_ENV === 'production') {
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
    };

    https.createServer(options, app).listen(443, () => { console.log('HTTPS Server running on port 443'); });
    http.createServer((req, res) => { res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` }); res.end(); }).listen(80, () => { console.log('HTTP to HTTPS redirect server running on port 80'); });

} else {
    app.listen(port, () => { console.log(`Development HTTP Server running on http://localhost:${port}`); });
}

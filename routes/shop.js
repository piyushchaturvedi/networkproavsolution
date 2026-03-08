import express from 'express';
const router = express.Router();
import fetch from 'node-fetch';
import crypto from 'crypto';
import { Parser } from 'json2csv';

// Import Models
import Product from '../models/product.js';
import Testimonial from '../models/testimonial.js';
import User from '../models/user.js';
import Order from '../models/order.js';
import Page from '../models/page.js';
import ContactMessage from '../models/contactMessage.js';
import Coupon from '../models/coupon.js';
import Subscriber from '../models/subscriber.js';
import path from "path";
import fs from 'fs';
import paypal from '@paypal/checkout-server-sdk';
import { sendAdminOrderNotification, sendCustomerOrderNotification } from "../utils/whatsapp.js";
import {
    fileURLToPath
} from "url";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const countriesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "public", "js", "countriesData.json"))
);
// Home Page
router.get('/', async (req, res) => {
    try {
        const testimonials = await Testimonial.find({}).sort({
            createdAt: -1
        });

        // --- NEW LOGIC: Fetch products explicitly marked as featured ---
        const featuredProducts = await Product.find({
                isFeatured: true
            })
            .sort({
                createdAt: -1
            }) // Sort by newest featured
            .limit(4) // Limit to display 4 products
            .lean();

        // --- NEW LOGIC: Fetch products explicitly marked as loved ---
        const lovedProducts = await Product.find({
                isLoved: true
            })
            .sort({
                rating: -1
            }) // Sort by highest rating
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


// Signup Page (GET)
router.get('/signup', (req, res) => {
    // If user is already logged in, redirect to profile
    if (req.session.user) return res.redirect('/profile');
    res.render('signup', {
        pageTitle: "Sign Up",
        error: null,
        message: null,
        formData: {}
    });
});

// Signup Submission (POST)
router.post('/signup', async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        // username,
        password,
        phone,
        address
    } = req.body;

    let formData = req.body;

    // ---------------------------
    // 1. Server-Side Validation
    // ---------------------------
    if (!firstName || !lastName || !email || !password || !phone) {
        return res.render('signup', {
            pageTitle: "Sign Up",
            error: 'Please fill all required fields.',
            message: null,
            formData
        });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
        // ---------------------------
        // 2. Check Duplicate User
        // ---------------------------
        const existingUser = await User.findOne({
            $or: [{
                email
            }, {
                username
            }]
        });

        if (existingUser) {
            return res.render('signup', {
                pageTitle: "Sign Up",
                error: 'Email or Username already exists.',
                message: null,
                formData
            });
        }

        // ---------------------------
        // 3. Create New User
        // ---------------------------
        const newUser = new User({
            fullName,
            firstName,
            lastName,
            email,
            // username,
            password, // IMPORTANT: Add hashing later
            phone,
            address: address || '',
            role: 'customer',
            isBlocked: false
        });

        await newUser.save();

        // ---------------------------
        // 4. Automatically login user
        // ---------------------------
        req.session.user = {
            id: newUser._id,
            // username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            fullName: newUser.fullName,
            phone: newUser.phone,
            address: newUser.address,
            isBlocked: newUser.isBlocked
        };

        return res.redirect('/profile');

    } catch (error) {
        console.error("Signup Error:", error);

        return res.render('signup', {
            pageTitle: "Sign Up",
            error: 'Something went wrong. Please try again.',
            message: null,
            formData
        });
    }
});



// Login Page (GET)
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/profile');
    res.render('login', {
        pageTitle: "Login | Customer",
        errorMessage: null
    });
});

// Login Submission (POST)
router.post('/login', async (req, res) => {
    // loginIdentifier can be username or email
    const {
        loginIdentifier,
        password
    } = req.body;

    try {
        // Allow login using either username or email
        const identifier = loginIdentifier.toLowerCase().trim();
        const user = await User.findOne({
            $or: [{
                username: identifier
            }, {
                email: identifier
            }]
        });

        if (user && user.password === password) {

            if (user.isBlocked) {
                return res.render('login', {
                    pageTitle: "Login | Customer",
                    errorMessage: 'Your account has been disabled by the administrator.'
                });
            }

            // Set session data for customer user (or admin)
            req.session.user = {
                id: user._id,
                // username: user.username, 
                role: user.role,
                email: user.email,
                isBlocked: user.isBlocked,
                fullName: user.fullName
            };

            // If the user is an admin, redirect them to the admin dashboard
            if (user.role === 'admin') {
                return res.redirect('/admin');
            }

            res.redirect('/profile');

        } else {
            res.render('login', {
                pageTitle: "Login | Customer",
                errorMessage: 'Invalid username/email or password.'
            });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', {
            pageTitle: "Login | Customer",
            errorMessage: 'An error occurred during login.'
        });
    }
});

// =======================================
// GOOGLE MERCHANT FEED – WATCHDOG (CSV)
// URL: /feeds/google-watchdog.csv
// =======================================
router.get('/admin/generate-watchdog-feed', async (req, res) => {
    try {
        const products = await Product.find({ brand: 'Watchdog' }).lean();

        if (!products.length) {
            return res.status(404).json({ message: 'No Watchdog products found' });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        const feedData = products.map(product => ({
            id: product.id,
            title: product.name,
            description: product.shortDesc 
                || (Array.isArray(product.longDesc) ? product.longDesc.join(' ') : ''),
            link: `${baseUrl}/product/${product.id}`,
            image_link: `${baseUrl}${product.image}`,
            price: `${product.price} USD`,
            availability: 'in stock',
            brand: product.brand,
            condition: 'new',
            identifier_exists: 'no'
        }));

        const fields = [
            'id','title','description','link','image_link',
            'price','availability','brand','condition','identifier_exists'
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(feedData);

        // ✅ FIXED PATH (MOST IMPORTANT)
        const feedsDir = path.join(__dirname, '..', 'public', 'feeds');
        if (!fs.existsSync(feedsDir)) {
            fs.mkdirSync(feedsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(feedsDir, 'google-watchdog.csv'),
            csv
        );

        res.json({
            success: true,
            message: 'Google Watchdog feed generated successfully',
            file: '/feeds/google-watchdog.csv'
        });

    } catch (err) {
        console.error('Feed generation error:', err);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});



// Profile Page (Requires Authentication)
router.get('/profile', async (req, res) => {
    // Check if user is authenticated
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // Fetch the latest user data to ensure the 'isBlocked' status is current
    const user = await User.findById(req.session.user.id).lean();

    // If user was deleted or fetch failed, destroy session
    if (!user) {
        req.session.destroy();
        return res.redirect('/login');
    }

    // Check if user was blocked since session started
    if (user.isBlocked) {
        req.session.destroy();
        return res.render('login', {
            pageTitle: "Login | Customer",
            errorMessage: 'Your account has been disabled by the administrator. Please log in again.'
        });
    }

    res.render('profile', {
        pageTitle: "My Profile",
        user: user
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        // Redirect to homepage after logging out
        res.redirect('/');
    });
});


// ===============================================
// 5. FORGOT PASSWORD
// ===============================================

// GET: Forgot Password Page
router.get('/forgot-password', (req, res) => {
    res.render('forgot_password', {
        pageTitle: "Forgot Password",
        message: req.query.message || null,
        error: req.query.error || null
    });
});


// POST: Forgot Password Request
router.post('/forgot-password', async (req, res) => {
    const {
        email
    } = req.body;

    // Basic validation
    if (!email) {
        return res.render('forgot_password', {
            pageTitle: "Forgot Password",
            error: 'Email is required.',
            message: null
        });
    }

    try {
        // Find user (exclude admin users)
        const user = await User.findOne({
            email,
            role: {
                $ne: 'admin'
            }
        });

        // ALWAYS show success message (avoid user enumeration attacks)
        const successMsg = 'If an account exists for that email, a password reset link has been sent.';

        // If no user exists → still return same success message
        if (!user) {
            return res.render('forgot_password', {
                pageTitle: "Forgot Password",
                message: successMsg,
                error: null
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Setup transporter (from stored admin SMTP settings)
        const transporter = req.app.locals.getTransporter(req.app.locals);
        const senderEmail = transporter ?.options?.auth?.user;

        if (!transporter || !senderEmail) {
            console.error("Email transporter not configured correctly.");
            return res.render('forgot_password', {
                pageTitle: "Forgot Password",
                error: 'Email service error. Please contact support.',
                message: null
            });
        }

        // Store token temporarily (Recommended: save hashed token + expiry in DB)
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes expiry
        await user.save();

        // Reset Password URL
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers.host;
        const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

        // Email Body
        const mailOptions = {
            from: false ? senderEmail : "support@networkproavsolution.com", // Use support email if configured
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <img src="https://networkproavsolution.com/uploads/logos/logo.png" style="max-width: 100%;
    height: 30px;
    display: block;"/>
<p>You requested a password reset for your account on NetworkproAV Solution.</p>
                <p>Click the button below to reset your password. This link expires in 15 minutes:</p>
                <a href="${resetUrl}" 
                    style="background-color:#ef4444;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">
                    Reset My Password
                </a>
                <p>If you did NOT request this, ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        console.log(`Reset email sent to ${user.email}. Token: ${resetToken}`);

        // Return success response
        return res.render('forgot_password', {
            pageTitle: "Forgot Password",
            message: successMsg,
            error: null
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('forgot_password', {
            pageTitle: "Forgot Password",
            error: 'An unexpected error occurred.',
            message: null
        });
    }
});


// 6. RESET PASSWORD FORM (GET Route)
router.get('/reset-password', async (req, res) => {
    const {
        token
    } = req.query;

    if (!token) {
        return res.render('reset_password', {
            pageTitle: 'Reset Password',
            error: 'Missing password reset token.',
            message: null,
            token: null,
            user: null
        });
    }

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.render('reset_password', {
                pageTitle: 'Reset Password',
                error: 'Invalid or expired password reset link. Please restart the forgot password process.',
                message: null,
                token: null,
                user: null
            });
        }

        return res.render('reset_password', {
            pageTitle: 'Set New Password',
            error: null,
            message: null,
            token,
            user: user.toObject()
        });

    } catch (error) {
        console.error('Error verifying reset token:', error);
        return res.render('reset_password', {
            pageTitle: 'Reset Password',
            error: 'Server error while verifying the reset link.',
            message: null,
            token: null,
            user: null
        });
    }
});


// 7. RESET PASSWORD SUBMISSION (POST Route)
router.post('/reset-password', async (req, res) => {
    const {
        token,
        password,
        confirmPassword
    } = req.body;

    // 1. Validate password match
    if (!password || !confirmPassword || password !== confirmPassword) {
        const userWithToken = await User.findOne({
            resetToken: token
        });

        return res.render('reset_password', {
            pageTitle: 'Set New Password',
            error: 'Passwords do not match.',
            message: null,
            token,
            user: userWithToken ? userWithToken.toObject() : null
        });
    }

    try {
        // 2. Validate token and its expiry
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.render('reset_password', {
                pageTitle: 'Reset Password',
                error: 'Invalid or expired password reset link. Please try again.',
                message: null,
                token: null,
                user: null
            });
        }

        // 3. Update password + clear the token
        user.password = password; // ⚠ Must hash in production
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        // 4. Destroy session to prevent conflicts
        req.session.destroy(() => {
            return res.redirect(
                '/login?errorMessage=' + encodeURIComponent('Password successfully reset. You can now log in.')
            );
        });

    } catch (error) {
        console.error('Password reset error:', error);
        return res.render('reset_password', {
            pageTitle: 'Reset Password',
            error: 'Server error while updating password.',
            message: null,
            token,
            user: null
        });
    }
});


// Countries
router.get('/location/countries', (req, res) => {
    res.json(Object.keys(countriesData));
});

// States
router.get('/location/states', (req, res) => {
    res.json(Object.keys(countriesData[req.query.country]?.states || {}));
});

// Cities
router.get('/location/cities', (req, res) => {
    res.json(countriesData[req.query.country]?.states[req.query.state] || []);
});

// Save checkout details in DB
// router.post('/checkout/save-details', async (req, res) => {
//     await User.updateOne({
//         email: req.body.email
//     }, {
//         $set: req.body
//     });
//     res.json({
//         success: true
//     });
// });




// Add this POST route after your /cart/update route (around line 300)
router.post('/cart/apply-coupon', async (req, res) => {
    // CRITICAL FIX: Ensure couponCode is defined
    const {
        couponCode
    } = req.body;
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.status(400).json({
            message: 'Cart is empty. Cannot apply coupon.'
        });
    }

    if (!couponCode) {
        return res.status(400).json({
            message: 'Coupon code is missing.'
        });
    }

    try {
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            delete req.session.coupon;
            return res.status(404).json({
                message: 'Invalid or inactive coupon code.'
            });
        }

        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            delete req.session.coupon;
            return res.status(400).json({
                message: 'Coupon has expired.'
            });
        }

        const cartProductIds = cart.map(item => item.id);
        const fullProducts = await Product.find({
            id: {
                $in: cartProductIds
            }
        }).lean();

        let isAnyProductEligible = false;

        for (const item of cart) {
            const product = fullProducts.find(p => p.id === item.id);

            const isEligible = (
                coupon.appliesTo === 'all' ||
                (coupon.appliesTo === 'products' && coupon.targetProductIds.includes(item.id)) ||
                (coupon.appliesTo === 'categories' && product && coupon.targetCategoryNames.includes(product.category))
            );

            if (isEligible) {
                isAnyProductEligible = true;
                break;
            }
        }

        if (!isAnyProductEligible) {
            delete req.session.coupon;
            return res.status(400).json({
                message: 'Coupon is not valid for any eligible product in your cart.'
            });
        }

        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        if (subtotal < coupon.minOrderAmount) {
            delete req.session.coupon;
            return res.status(400).json({
                message: `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required.`
            });
        }

        // Store the valid coupon in the session (including all targeting details)
        req.session.coupon = {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            appliesTo: coupon.appliesTo,
            targetProductIds: coupon.targetProductIds,
            targetCategoryNames: coupon.targetCategoryNames,
            minOrderAmount: coupon.minOrderAmount
        };

        res.json({
            message: `Coupon ${coupon.code} applied successfully!`,
            coupon: req.session.coupon
        });

    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            message: 'Failed to apply coupon due to server error.'
        });
    }
});


// Add this POST route to allow removal from the frontend
router.post('/cart/remove-coupon', (req, res) => {
    if (req.session.coupon) {
        delete req.session.coupon;
        return res.json({
            message: 'Coupon removed successfully!'
        });
    }
    res.status(404).json({
        message: 'No coupon currently applied.'
    });
});


router.post('/subscribe', async (req, res) => {
    const {
        email
    } = req.body; // Ensure 'email' is correctly destructured

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email address is required.'
        });
    }

    try {
        // NOTE: The Subscriber model must be correctly imported at the top of shop.js
        const newSubscriber = new Subscriber({
            email: email
        });
        await newSubscriber.save();

        // Optional: Add email notification logic here if needed.
        // --- NEW: Send Admin Notification Email ---
        const dynamicTransporter = req.app.locals.getTransporter(req.app.locals);
        // Use the Admin Recipient Email from settings or the ENV user as fallback
        const adminEmailRecipient = req.app.locals.settings.contactRecipientEmail || process.env.EMAIL_USER;

        if (dynamicTransporter && adminEmailRecipient) {
            const mailOptions = {
                from: dynamicTransporter.options.auth.user, // Sender email
                to: adminEmailRecipient, // Admin recipient
                subject: `NEW SUBSCRIPTION: ${email} has subscribed to the newsletter`,
                html: `
                    <p>A new email address has subscribed to your newsletter list:</p>
                    <h3>Email: ${email}</h3>
                    <p>You can view all subscribers in the Admin Panel at /admin/subscribers.</p>
                `,
            };
            await dynamicTransporter.sendMail(mailOptions);
            console.log('Admin notification email sent for new subscription.');
        } else {
            console.warn('Nodemailer not configured or recipient missing. Subscription saved, but email notification skipped.');
        }
        // --- END NEW ---
        res.status(201).json({
            success: true,
            message: 'Thank you for subscribing!'
        });

    } catch (error) {
        console.error('Subscription error:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'This email is already subscribed.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to subscribe. Please try again.'
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
            $or: [{
                    name: {
                        $regex: searchRegex
                    }
                },
                {
                    shortDesc: {
                        $regex: searchRegex
                    }
                },
                {
                    brand: {
                        $regex: searchRegex
                    }
                },
                {
                    category: {
                        $regex: searchRegex
                    }
                }
            ]
        }).sort({
            name: 1
        }); // Sort by name ascending

        // Group the search results by category for consistent display
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
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
                $or: [{
                        name: {
                            $regex: searchRegex
                        }
                    },
                    {
                        brand: {
                            $regex: searchRegex
                        }
                    }
                ]
            })
            // Select necessary fields only to keep payload small
            .select('name id image price')
            .limit(6) // Limit the number of suggestions
            .lean();

        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});



// All Products Page
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products', {
            groupedProducts,
            pageTitle: "All Antivirus Products"
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Server Error: Could not load products.');
    }
});

// NEW: Norton Antivirus Product Listing Page
router.get('/products/norton', async (req, res) => {
    try {
        const products = await Product.find({
            category: 'Norton'
        }); // Filter by category 'Norton'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_norton', {
            groupedProducts,
            pageTitle: "Norton Antivirus Products"
        });
    } catch (err) {
        console.error('Error fetching Norton products:', err);
        res.status(500).send('Server Error: Could not load Norton products.');
    }
});

// NEW: McAfee Antivirus Product Listing Page
router.get('/products/mcafee', async (req, res) => {
    try {
        const products = await Product.find({
            category: 'McAfee'
        }); // Filter by category 'McAfee'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_mcafee', {
            groupedProducts,
            pageTitle: "McAfee Antivirus Products"
        });
    } catch (err) {
        console.error('Error fetching McAfee products:', err);
        res.status(500).send('Server Error: Could not load McAfee products.');
    }
});

router.get('/products/avast', async (req, res) => {
    try {
        const products = await Product.find({
            category: 'AVAST'
        }); // Filter by category 'AVAST'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_avast', {
            groupedProducts,
            pageTitle: "Avast Antivirus Products"
        });
    } catch (err) {
        console.error('Error fetching avast products:', err);
        res.status(500).send('Server Error: Could not load avast products.');
    }
});

router.get('/products/bitdefender', async (req, res) => {
    try {
        const products = await Product.find({
            category: 'BITDEFENDER'
        }); // Filter by category 'Bitdefender'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_bitdefender', {
            groupedProducts,
            pageTitle: "Bitdefender Antivirus Products"
        });
    } catch (err) {
        console.error('Error fetching Bitdefender products:', err);
        res.status(500).send('Server Error: Could not load Bitdefender products.');
    }
});

router.get('/products/avg', async (req, res) => {
    try {
        const products = await Product.find({
            category: 'AVG'
        }); // Filter by category 'AVG'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_avg', {
            groupedProducts,
            pageTitle: "AVG Antivirus Products"
        });
    } catch (err) {
        console.error('Error fetching AVG products:', err);
        res.status(500).send('Server Error: Could not load AVG products.');
    }
});

router.get('/products/watchdog', async (req, res) => {
    try {
        const products = await Product.find({
            category: 'Watchdog'
        }); // Filter by category 'Watchdog'
        const groupedProducts = products.reduce((acc, product) => {
            if (!acc[product.category]) {
                acc[product.category] = [];
            }
            acc[product.category].push(product);
            return acc;
        }, {});
        res.render('products_watchdog', {
            groupedProducts,
            pageTitle: "Watchdog Antimalware Products"
        });
    } catch (err) {
        console.error('Error fetching Watchdog products:', err);
        res.status(500).send('Server Error: Could not load Watchdog products.');
    }
});


// Product Detail Page
router.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({
            id: productId
        });
        if (product) {
            const relatedProducts = await Product.find({
                category: product.category,
                id: {
                    $ne: product.id
                }
            }).limit(4);
            res.render('product_detail', {
                product,
                relatedProducts,
                pageTitle: product.name
            });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).send('Server Error: Could not load product details.');
    }
});

// User Login Page
router.get('/login', (req, res) => {
    res.render('login', {
        pageTitle: "Login | CyberSafeTrust",
        errorMessage: null
    });
});

router.post('/login', async (req, res) => {
    const {
        username,
        password
    } = req.body;
    try {
        const user = await User.findOne({
            username
        });
        if (user && user.password === password) {
            req.session.user = {
                id: user._id,
                username: user.username,
                role: user.role
            };
            res.redirect('/');
        } else {
            res.render('login', {
                pageTitle: "Login | CyberSafeTrust",
                errorMessage: 'Invalid username or password.'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', {
            pageTitle: "Login | CyberSafeTrust",
            errorMessage: 'An error occurred during login.'
        });
    }
});

// Contact Page
router.get('/contact', (req, res) => {
    res.render('contact', {
        pageTitle: "Contact Us",
        message: null,
        error: null
    });
});

router.post('/contact', async (req, res) => {
    const {
        email,
        subject,
        message
    } = req.body;
    if (!email || !subject || !message) {
        return res.render('contact', {
            pageTitle: "Contact Us",
            message: null,
            error: 'Please fill in all fields.'
        });
    }

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
                subject: `Confirmation: Your message to NetworkproAVsolution - ${subject}`,
                html: `
                    <p>Dear Customer,</p>
                    <p>Thank you for contacting NetworkproAVsolution. We have received your message and will get back to you shortly.</p>
                    <h3>Your Message Details:</h3>
                    <ul>
                        <li><strong>Subject:</strong> ${subject}</li>
                        <li><strong>Message:</strong> ${message}</li>
                    </ul>
                    <p>Sincerely,<br>The NetworkproAVsolution Team</p>
                `,
            };
            await dynamicTransporter.sendMail(customerMailOptions);
            console.log('Confirmation email sent to customer!');
        }


        res.render('contact', {
            pageTitle: "Contact Us",
            message: 'Your message has been sent successfully!',
            error: null
        });

    } catch (error) {
        console.error('Error sending contact email or saving message:', error);
        res.render('contact', {
            pageTitle: "Contact Us",
            message: null,
            error: 'Failed to send your message. Please try again later.'
        });
    }
});

// CART ROUTES
router.get('/cart', (req, res) => {
    res.render('cart', {
        pageTitle: 'Your Shopping Cart'
    });
});

router.post('/cart/add', async (req, res) => {
    const {
        productId,
        quantity = 1
    } = req.body;
    try {
        const product = await Product.findOne({
            id: productId
        });
        if (!product) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }
        if (!req.session.cart) {
            req.session.cart = [];
        }
        const existingItemIndex = req.session.cart.findIndex(item => item.id === productId);
        if (existingItemIndex > -1) {
            req.session.cart[existingItemIndex].quantity += parseInt(quantity);
        } else {
            req.session.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: parseInt(quantity),
            });
        }
        res.json({
            message: 'Product added to cart!',
            cart: req.session.cart
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            message: 'Failed to add product to cart.'
        });
    }
});

router.post('/cart/update', (req, res) => {
    const {
        productId,
        quantity
    } = req.body;
    if (!req.session.cart) {
        return res.status(400).json({
            message: 'Cart is empty.'
        });
    }
    const itemIndex = req.session.cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        if (quantity <= 0) {
            req.session.cart.splice(itemIndex, 1);
        } else {
            req.session.cart[itemIndex].quantity = parseInt(quantity);
        }
        res.json({
            message: 'Cart updated!',
            cart: req.session.cart
        });
    } else {
        res.status(404).json({
            message: 'Product not found in cart.'
        });
    }
});

// CHECKOUT ROUTES
router.get('/checkout', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect('/cart');
    }
    res.render('checkout', {
        pageTitle: 'Checkout',
        customer: req.session.user ? {
            fullName: req.session.user.username,
            email: req.session.user.email,
            phone: '',
            address: '',
            city: '',
            zipCode: '',
            country: ''
        } : null
    });
});

router.post('/checkout/save-details', async (req, res) => {

  const cart = req.session.cart || [];

  if (cart.length === 0) {
    return res.json({ error: "Cart empty" });
  }

  const total = cart.reduce((sum, item) =>
    sum + item.price * item.quantity, 0);

  let order = await Order.findOne({
    sessionId: req.session.id,
    status: "pending"
  });

  if (!order) {

    order = new Order({
      sessionId: req.session.id,
      userId: req.session.user ? req.session.user.id : null,
      status: "pending",
      OrderCompleteStatus:"pending",
      totalAmount: total,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      shippingAddress: req.body
    });

  } else {

    order.shippingAddress = req.body;

  }

  await order.save();

  req.session.orderId = order._id;

  res.json({ success: true, orderId: order._id });

});

// PayPal API Routes
router.post('/api/orders', async (req, res) => {

  const orderId = req.session.orderId;

  if (!orderId) {
    return res.status(400).json({ error: "Order not created yet" });
  }

  const order = await Order.findById(orderId);

  const total = order.totalAmount.toFixed(2);

  // create PayPal order
  const accessToken = await req.app.locals.generateAccessToken(req.app.locals);

  const PAYPAL_BASE_URL =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total
        }
      }]
    })
  });

  const paypalOrder = await response.json();

  order.paypalOrderId = paypalOrder.id;
  await order.save();

  res.json({ orderID: paypalOrder.id });

});



router.post('/api/orders/:orderID/capture', async (req, res) => {

  const { orderID } = req.params;

  const order = await Order.findOne({
    paypalOrderId: orderID
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const accessToken =
    await req.app.locals.generateAccessToken(req.app.locals);

  const PAYPAL_BASE_URL =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const captureData = await response.json();

  if (response.ok) {

    order.status = "success";
    order.paypalPayerId = captureData.payer.payer_id;

    await order.save();
    await sendAdminOrderNotification(order);
    // await sendCustomerOrderNotification(order);
    req.session.cart = [];

    return res.json({
      success: true,
      redirectUrl: `/thank-you?orderId=${orderID}`
    });

  } else {

    order.status = "failed";
    await order.save();
    await sendAdminOrderNotification(order);
    // await sendCustomerOrderNotification(order);
    res.status(400).json({ error: "Payment failed" });

  }

});

// ========================================
// PAYPAL WEBHOOK (SAVE ORDER HERE)
// ========================================
router.post('/api/paypal/webhook', express.json({ type: '*/*' }), async (req, res) => {
    try {

        const event = req.body;
        console.log("Webhook Event:", event.event_type);

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {

            const capture = event.resource;

            const paypalOrderId =
                capture.supplementary_data.related_ids.order_id;

            // Prevent duplicate
            const existingOrder = await Order.findOne({ paypalOrderId });
            if (existingOrder) {
                return res.status(200).json({ message: 'Already saved' });
            }

            const accessToken =
                await req.app.locals.generateAccessToken(req.app.locals);

            const PAYPAL_BASE_URL =
                process.env.PAYPAL_MODE === 'live'
                    ? 'https://api-m.paypal.com'
                    : 'https://api-m.sandbox.paypal.com';

            const response = await fetch(
                `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const orderDetails = await response.json();

            const newOrder = new Order({
                paypalOrderId,
                paypalPayerId: capture.payer.payer_id,
                status: capture.status,
                totalAmount: capture.amount.value,
                currency: capture.amount.currency_code,
                items: orderDetails.purchase_units[0].items || [],
                shippingAddress: orderDetails.purchase_units[0].shipping || {}
            });

            await newOrder.save();

            console.log("Order saved via webhook:", newOrder._id);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Webhook error");
    }
});

router.get('/thank-you', async (req, res) => {

    const { orderId } = req.query;

    if (!orderId) return res.redirect('/');

    let order = await Order.findOne({ paypalOrderId: orderId }).lean();
    console.log("ordds",order)
    if (!order) {
        return res.render('thank_you', {
            pageTitle: 'Processing...',
            order: null
        });
    }

    // 🔥 Attach category to each item
  for (let item of order.items) {
    const product = await Product.findOne({ id: item.productId }).lean();
    item.category = product?.category || "N/A";
  }

  console.log("ordds",order)

    // Clear session
    req.session.cart = [];
    delete req.session.customerDetails;

    res.render('thank_you', {
        pageTitle: 'Order Confirmed',
        order
    });
});

router.post('/create-paypal-order', async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        return res.status(400).json({
            error: 'Cart is empty'
        });
    }

    // Calculate total
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: total.toFixed(2)
            }
        }]
    });

    try {
        const order = await client.execute(request);
        // Return ONLY the JSON object containing the ID
        res.status(200).json({
            id: order.result.id
        });
    } catch (err) {
        console.error('PayPal Order Creation Error:', err);
        res.status(500).json({
            error: 'Failed to create order'
        });
    }
});

router.get('/checkout/success', (req, res) => {
    res.send('<h1>Payment Successful!</h1><p>Thank you for your purchase.</p><a href="/">Go Home</a>');
});
router.get('/checkout/cancel', (req, res) => {
    res.send('<h1>Payment Cancelled</h1><p>Your payment was cancelled. Please try again.</p><a href="/">Go Home</a>');
});

// ROUTE FOR DISPLAYING DYNAMIC CMS PAGES (Publicly accessible)
router.get('/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({
            slug: req.params.slug
        });
        if (page) {
            res.render('dynamic_page', {
                page,
                pageTitle: page.title
            });
        } else {
            res.status(404).send('Page not found');
        }
    } catch (error) {
        console.error('Error fetching dynamic page:', error);
        res.status(500).send('Server Error: Could not load page.');
    }
});

router.get('/login', (req, res) => {
    res.render('login', {
        pageTitle: "login",
        message: null,
        error: null
    });
});

export default router;

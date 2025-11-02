import express from 'express';
const router = express.Router();

import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Import Models
import Product from '../models/product.js';
import User from '../models/user.js';
import Order from '../models/order.js';
import Category from '../models/category.js';
import Setting from '../models/setting.js';
import Testimonial from '../models/testimonial.js';
import Page from '../models/page.js';
import ContactMessage from '../models/contactMessage.js';


// Middleware: Authenticated and Admin Check (access from app.locals)
const isAuthenticated = (req, res, next) => req.app.locals.isAuthenticated(req, res, next);

// Multer middleware functions (obtained from app.locals)
const uploadProductImageMiddleware = (req, res, next) => req.app.locals.uploadProductImage.single('productImage')(req, res, next);
const uploadTestimonialImageMiddleware = (req, res, next) => req.app.locals.uploadTestimonialImage.single('userImage')(req, res, next);

const settingsUploadFields = multer().fields([
    { name: 'mainLogoFile', maxCount: 1 },
    { name: 'campaignBannerImageFile', maxCount: 1 }
]);


// Helper for slug generation
const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};


// ADMIN LOGIN & LOGOUT
router.get('/login', (req, res) => {
    res.render('admin_login', { pageTitle: 'Admin Login', errorMessage: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && user.password === password) {
            req.session.user = { id: user._id, username: user.username, role: user.role, email: user.email };
            res.redirect('/admin');
        } else {
            res.render('admin_login', { pageTitle: 'Admin Login', errorMessage: 'Invalid admin credentials.' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).render('admin_login', { pageTitle: 'Admin Login', errorMessage: 'An error occurred during login.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) { console.error('Error destroying session:', err); }
        res.redirect('/admin/login');
    });
});


// ADMIN DASHBOARD
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const products = await Product.find({});
        const message = req.query.message || null;
        res.render('admin_dashboard', { products, pageTitle: 'Admin Dashboard', message });
    } catch (error) {
        console.error('Error fetching products for admin dashboard:', error);
        res.status(500).send('Server Error: Could not load admin dashboard.');
    }
});


// PRODUCT MANAGEMENT
router.get('/product/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({ id: productId });
        const categories = await Category.find({});
        if (product) { res.render('admin_product_edit', { product, categories, pageTitle: `Edit Product: ${product.name}`, message: null, error: null }); }
        else { res.status(404).send('Product not found for editing.'); }
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        res.status(500).send('Server Error: Could not load product for editing.');
    }
});

router.post('/product/update/:id', isAuthenticated, uploadProductImageMiddleware, async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = req.body;

        if (req.file) { updatedData.image = `/uploads/products/${req.file.filename}`; }
        else if (updatedData.image_url_option) { updatedData.image = updatedData.image_url_option; }

        if (updatedData.oldPrice) updatedData.oldPrice = parseFloat(updatedData.oldPrice);
        if (updatedData.price) updatedData.price = parseFloat(updatedData.price);
        if (updatedData.savePercent) updatedData.savePercent = parseInt(updatedData.savePercent);
        updatedData.rating = parseFloat(updatedData.rating) || 0;
        if (updatedData.longDesc && typeof updatedData.longDesc === 'string') { updatedData.longDesc = updatedData.longDesc.split('\n').map(line => line.trim()).filter(line => line.length > 0); }

        const product = await Product.findOneAndUpdate({ id: productId }, updatedData, { new: true });
        if (product) { res.redirect('/admin?message=Product updated successfully!'); }
        else { res.status(404).send('Product not found for update.'); }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Server Error: Could not update product.');
    }
});

router.get('/product/add', isAuthenticated, async (req, res) => {
    try {
        const categories = await Category.find({});
        res.render('admin_add_product', { pageTitle: 'Add New Product', categories, message: null, error: null });
    } catch (error) {
        console.error('Error loading add product form:', error);
        res.status(500).send('Server Error: Could not load add product form.');
    }
});

router.post('/product/add', isAuthenticated, uploadProductImageMiddleware, async (req, res) => {
    try {
        const newProductData = req.body;
        if (req.file) { newProductData.image = `/uploads/products/${req.file.filename}`; }
        else if (newProductData.image_url_option) { newProductData.image = newProductData.image_url_option; }
        else { newProductData.image = 'https://placehold.co/150x150/cccccc/000000?text=No+Image'; }

        newProductData.oldPrice = parseFloat(newProductData.oldPrice);
        newProductData.price = parseFloat(newProductData.price);
        newProductData.savePercent = parseInt(newProductData.savePercent);
        newProductData.rating = parseFloat(newProductData.rating) || 0;
        if (newProductData.longDesc && typeof newProductData.longDesc === 'string') { newProductData.longDesc = newProductData.longDesc.split('\n').map(line => line.trim()).filter(line => line.length > 0); }
        newProductData.id = `p${await Product.countDocuments() + 1 + Math.floor(Math.random() * 1000)}`;

        const newProduct = new Product(newProductData);
        await newProduct.save();
        res.redirect('/admin?message=Product added successfully!');
    } catch (error) {
        console.error('Error adding new product:', error);
        const categories = await Category.find({});
        let errorMessage = 'Failed to add product. Please check inputs.';
        if (error.code === 11000) { errorMessage = 'Product ID or Category already exists. Please use a unique ID.'; }
        else if (error.message.includes('Only images')) { errorMessage = error.message; }
        res.render('admin_add_product', { pageTitle: 'Add New Product', categories, message: null, error: errorMessage });
    }
});

router.post('/category/add', isAuthenticated, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) { return res.status(400).json({ error: 'Category name is required.' }); }
        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(200).json({ message: 'Category added successfully!', category: newCategory });
    } catch (error) {
        console.error('Error adding category:', error);
        if (error.code === 11000) { return res.status(409).json({ error: 'Category with this name already exists.' }); }
        res.status(500).json({ error: 'Failed to add category.' });
    }
});


router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin_user_management', { users, pageTitle: 'Manage Users' });
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).send('Server Error: Could not load user management.');
    }
});

router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'username email');
        res.render('admin_order_history', { orders, pageTitle: 'Order History' });
    } catch (error) {
        console.error('Error fetching orders for admin:', error);
        res.status(500).send('Server Error: Could not load order history.');
    }
});


router.get('/testimonials', isAuthenticated, async (req, res) => {
    try {
        const testimonials = await Testimonial.find({});
        res.render('admin_testimonials', { testimonials, pageTitle: 'Manage Testimonials', message: req.query.message || null, error: req.query.error || null });
    } catch (error) {
        console.error('Error fetching testimonials for admin:', error);
        res.status(500).send('Server Error: Could not load testimonials management.');
    }
});

router.get('/testimonial/add', isAuthenticated, (req, res) => {
    res.render('admin_add_testimonial', { pageTitle: 'Add New Testimonial', message: null, error: null });
});

router.post('/testimonial/add', isAuthenticated, uploadTestimonialImageMiddleware, async (req, res) => {
    try {
        const newTestimonialData = req.body;
        if (req.file) { newTestimonialData.userImage = `/uploads/testimonials/${req.file.filename}`; }
        else if (newTestimonialData.userImage_url_option) { newTestimonialData.userImage = newTestimonialData.userImage_url_option; }
        else { newTestimonialData.userImage = 'https://placehold.co/60x60/cccccc/000000?text=Avatar'; }
        
        newTestimonialData.rating = parseInt(newTestimonialData.rating);
        const newTestimonial = new Testimonial(newTestimonialData);
        await newTestimonial.save();
        res.redirect('/admin/testimonials?message=Testimonial added successfully!');
    } catch (error) {
        console.error('Error adding new testimonial:', error);
        let errorMessage = 'Failed to add testimonial. Please check inputs.';
        if (error.message.includes('Only images')) { errorMessage = error.message; }
        res.render('admin_add_testimonial', { pageTitle: 'Add New Testimonial', message: null, error: errorMessage });
    }
});

router.get('/testimonial/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const testimonialId = req.params.id;
        const testimonial = await Testimonial.findById(testimonialId);
        if (testimonial) { res.render('admin_edit_testimonial', { testimonial, pageTitle: `Edit Testimonial: ${testimonial.userName}`, message: null, error: null }); }
        else { res.status(404).send('Testimonial not found for editing.'); }
    } catch (error) {
        console.error('Error fetching testimonial for edit:', error);
        res.status(500).send('Server Error: Could not load testimonial for editing.');
    }
});

router.post('/testimonial/update/:id', isAuthenticated, uploadTestimonialImageMiddleware, async (req, res) => {
    try {
        const testimonialId = req.params.id;
        const updatedData = req.body;

        if (req.file) { updatedData.userImage = `/uploads/testimonials/${req.file.filename}`; }
        else if (updatedData.userImage_url_option) { updatedData.userImage = updatedData.userImage_url_option; }
        
        updatedData.rating = parseInt(updatedData.rating);

        const testimonial = await Testimonial.findByIdAndUpdate(testimonialId, updatedData, { new: true });
        if (testimonial) { res.redirect('/admin/testimonials?message=Testimonial updated successfully!'); }
        else { res.status(404).send('Testimonial not found for update.'); }
    } catch (error) {
        console.error('Error updating testimonial:', error);
        res.status(500).send('Server Error: Could not update testimonial.');
    }
});

router.post('/testimonial/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const testimonialId = req.params.id;
        const testimonial = await Testimonial.findByIdAndDelete(testimonialId);
        if (testimonial) {
            if (testimonial.userImage.startsWith('/uploads/testimonials/')) {
                const imagePath = path.join(__dirname, 'public', testimonial.userImage);
                fs.unlink(imagePath, (err) => { if (err) console.error('Error deleting old testimonial image file:', err); });
            }
            res.redirect('/admin/testimonials?message=Testimonial deleted successfully!');
        } else { res.status(404).send('Testimonial not found for deletion.'); }
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        res.status(500).send('Server Error: Could not delete testimonial.');
    }
});


// CMS PAGES MANAGEMENT
router.get('/pages', isAuthenticated, async (req, res) => {
    try {
        const pages = await Page.find({}).sort({ title: 1 });
        res.render('admin_pages', { pages, pageTitle: 'Manage CMS Pages', message: req.query.message || null, error: req.query.error || null });
    } catch (error) {
        console.error('Error fetching CMS pages for admin:', error);
        res.status(500).send('Server Error: Could not load CMS pages management.');
    }
});

router.get('/page/add', isAuthenticated, (req, res) => {
    res.render('admin_add_page', { pageTitle: 'Add New CMS Page', message: null, error: null });
});

router.post('/page/add', isAuthenticated, async (req, res) => {
    try {
        const { title, content, menuLocation } = req.body;
        if (!title || !content) { return res.render('admin_add_page', { pageTitle: 'Add New CMS Page', message: null, error: 'Title and content are required.' }); }
        
        const slug = generateSlug(title);
        if (!slug) {
            return res.render('admin_add_page', { pageTitle: 'Add New CMS Page', message: null, error: 'Title must contain valid characters for URL slug.' });
        }

        const newPage = new Page({
            title,
            slug,
            content,
            menuLocation: menuLocation
        });
        await newPage.save();
        res.redirect('/admin/pages?message=Page added successfully!');
    } catch (error) {
        console.error('Error adding new page:', error);
        let errorMessage = 'Failed to add page. Please check inputs.';
        if (error.code === 11000) { errorMessage = 'A page with this title already exists.'; }
        res.render('admin_add_page', { pageTitle: 'Add New CMS Page', message: null, error: errorMessage });
    }
});

router.get('/page/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const pageId = req.params.id;
        const page = await Page.findById(pageId);
        if (page) { res.render('admin_edit_page', { page, pageTitle: `Edit Page: ${page.title}`, message: null, error: null }); }
        else { res.status(404).send('CMS Page not found for editing.'); }
    } catch (error) {
        console.error('Error fetching CMS page for edit:', error);
        res.status(500).send('Server Error: Could not load CMS page for editing.');
    }
});

router.post('/page/update/:id', isAuthenticated, async (req, res) => {
    try {
        const pageId = req.params.id;
        const { title, content, menuLocation } = req.body;

        if (!title || !content) { return res.render('admin_edit_page', { page: { _id: pageId, title, content, menuLocation: menuLocation }, pageTitle: `Edit Page: ${title}`, message: null, error: 'Title and content are required.' }); }

        const slug = generateSlug(title);
        if (!slug) {
            return res.render('admin_edit_page', { page: { _id: pageId, title, content, menuLocation: menuLocation }, pageTitle: `Edit Page: ${title}`, message: null, error: 'Title must contain valid characters for URL slug.' });
        }

        const updatedPage = await Page.findByIdAndUpdate(pageId, {
            title,
            slug,
            content,
            menuLocation: menuLocation
        }, { new: true, runValidators: true });

        if (updatedPage) { res.redirect('/admin/pages?message=Page updated successfully!'); }
        else { res.status(404).send('CMS Page not found for update.'); }
    } catch (error) {
        console.error('Error updating CMS page:', error);
        let errorMessage = 'Failed to update page. Please check inputs.';
        if (error.code === 11000) { errorMessage = 'A page with this title already exists.'; }
        res.render('admin_edit_page', { page: { _id: req.params.id, ...req.body, menuLocation: req.body.menuLocation }, pageTitle: `Edit Page: ${req.body.title}`, message: null, error: errorMessage });
    }
});

router.post('/page/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const pageId = req.params.id;
        const page = await Page.findByIdAndDelete(pageId);
        if (page) { res.redirect('/admin/pages?message=Page deleted successfully!'); }
        else { res.status(404).send('CMS Page not found for deletion.'); }
    } catch (error) {
        console.error('Error deleting CMS page:', error);
        res.status(500).send('Server Error: Could not delete CMS page.');
    }
});

// CONTACT MESSAGES MANAGEMENT
router.get('/contact-messages', isAuthenticated, async (req, res) => {
    try {
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        res.render('admin_contact_messages', { messages, pageTitle: 'Contact Messages', message: req.query.message || null, error: req.query.error || null });
    } catch (error) {
        console.error('Error fetching contact messages for admin:', error);
        res.status(500).send('Server Error: Could not load contact messages.');
    }
});

router.get('/contact-messages/:id', isAuthenticated, async (req, res) => {
    try {
        const messageId = req.params.id;
        const message = await ContactMessage.findById(messageId);
        if (message) {
            message.read = true; // Mark as read when viewed
            await message.save();
            res.render('admin_view_contact_message', { message, pageTitle: `Message from ${message.senderEmail}` });
        } else {
            res.status(404).send('Contact message not found.');
        }
    } catch (error) {
        console.error('Error fetching contact message:', error);
        res.status(500).send('Server Error: Could not load message details.');
    }
});

router.post('/contact-messages/mark-read/:id', isAuthenticated, async (req, res) => {
    try {
        const messageId = req.params.id;
        await ContactMessage.findByIdAndUpdate(messageId, { read: true }, { new: true });
        res.redirect('/admin/contact-messages?message=Message marked as read.');
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.redirect('/admin/contact-messages?error=Failed to mark message as read.');
    }
});

router.post('/contact-messages/mark-replied/:id', isAuthenticated, async (req, res) => {
    try {
        const messageId = req.params.id;
        await ContactMessage.findByIdAndUpdate(messageId, { replied: true }, { new: true });
        res.redirect('/admin/contact-messages?message=Message marked as replied.');
    } catch (error) {
        console.error('Error marking message as replied:', error);
        res.redirect('/admin/contact-messages?error=Failed to mark message as replied.');
    }
});

router.post('/contact-messages/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const messageId = req.params.id;
        await ContactMessage.findByIdAndDelete(messageId);
        res.redirect('/admin/contact-messages?message=Message deleted successfully.');
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).send('Server Error: Could not delete message.');
    }
});

// WEBSITE SETTINGS MANAGEMENT
router.get('/settings', isAuthenticated, async (req, res) => {
    try {
        const settingsArray = await Setting.find({});
        const currentSettings = {};
        settingsArray.forEach(setting => { currentSettings[setting.key] = setting.value; });

        res.render('admin_settings', {
            pageTitle: 'Website Settings',
            currentThemeColor: currentSettings.themeColor || '#e63946',
            metaTitle: currentSettings.metaTitle || 'CyberSafeTrust | Antivirus Software & Security Solutions',
            metaDescription: currentSettings.metaDescription || 'Protect your digital life with the most trusted antivirus solutions. Save big on McAfee, Norton, Kaspersky, and more with instant activation and up to 80% off.',
            metaKeywords: currentSettings.metaKeywords || 'antivirus software, cybersecurity, virus protection, McAfee, Norton, Kaspersky, Bitdefender, buy antivirus online, PC security',
            paypalClientId: currentSettings.paypalClientId || '',
            paypalClientSecret: currentSettings.paypalClientSecret || '',
            emailUser: currentSettings.emailUser || '',
            emailPass: currentSettings.emailPass || '',
            homePhoneNumber: currentSettings.homePhoneNumber || '+5544669987',
            homeSubtitle: currentSettings.homeSubtitle || 'Highest Quality Commodities',
            homeHeading: currentSettings.homeHeading || 'Explore Top Antivirus Deals\nSave up to 80%',
            homeDescription: currentSettings.homeDescription || 'To protect your device and private information, choose the best antivirus software.',
            homeButtonText: currentSettings.homeButtonText || 'GET STARTED →',
            homeButtonLink: currentSettings.homeButtonLink || '/products',
            disclaimerHeading: currentSettings.disclaimerHeading || 'Disclaimer',
            disclaimerContent: currentSettings.disclaimerContent || `
                <strong>At ByteSafeGuard IT</strong> Solutions, we are proud to be an authorized reseller of premium branded products, operating with integrity and full regulatory compliance.<br>
                <strong>Trademark Use:</strong> All trademarks, logos, brand names, and product names on our site are the property of their respective owners, displayed solely for informational purposes.<br>
                <strong>Authorized Reseller:</strong> As an official participant in various reseller programs, we guarantee genuine products, each backed by the original brand’s warranty.<br>
                <strong>FTC Compliance:</strong> We adhere to all Federal Trade Commission (FTC) guidelines...<br>
                <strong>Commitment to Policy:</strong> ByteSafeGuard IT Solutions is dedicated to following all relevant policies...
            `.trim(),
            mainLogoUrl: currentSettings.mainLogoUrl || '',
            footerCompanyName: currentSettings.footerCompanyName || '',
            footerCompanyTagline: currentSettings.footerCompanyTagline || '',
            footerContactEmail: currentSettings.footerContactEmail || '',
            footerContactPhone: currentSettings.footerContactPhone || '',
            footerContactAddress: currentSettings.footerContactAddress || '',
            footerCompanyLogoUrl: currentSettings.footerCompanyLogoUrl || '',
            contactAddress: currentSettings.contactAddress || '',
            contactEmail: currentSettings.contactEmail || '',
            contactPhone: currentSettings.contactPhone || '',
            footerPaymentMethods: currentSettings.footerPaymentMethods || '',
            footerNewsletterHeading: currentSettings.footerNewsletterHeading || '',
            footerCopyrightText: currentSettings.footerCopyrightText || '',
            footerQuickLinksJson: JSON.stringify(currentSettings.footerQuickLinks || [], null, 2),
            footerSocialIconsJson: JSON.stringify(currentSettings.footerSocialIcons || [], null, 2),
            enableCampaignBanner: currentSettings.enableCampaignBanner || false,
            campaignBannerHeading: currentSettings.campaignBannerHeading || '',
            campaignBannerText: currentSettings.campaignBannerText || '',
            campaignBannerButtonText: currentSettings.campaignBannerButtonText || '',
            campaignBannerButtonLink: currentSettings.campaignBannerButtonLink || '',
            campaignBannerImageUrl: currentSettings.campaignBannerImageUrl || '',
            campaignBannerBackgroundColor: currentSettings.campaignBannerBackgroundColor || '#f0f8ff',
            campaignBannerTextColor: currentSettings.campaignBannerTextColor || '#333333',
            sendCustomerContactConfirmEmail: currentSettings.sendCustomerContactConfirmEmail || false,
            contactRecipientEmail: currentSettings.contactRecipientEmail || 'chaturvedipiyush40@gmail.com',
            message: req.query.message || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('Error loading settings page:', error);
        res.status(500).send('Server Error: Could not load settings.');
    }
});

router.post('/settings/update', isAuthenticated, settingsUploadFields, async (req, res) => {
    const { themeColor, metaTitle, metaDescription, metaKeywords, paypalClientId, paypalClientSecret, emailUser, emailPass, homePhoneNumber, homeSubtitle, homeHeading, homeDescription, homeButtonText, homeButtonLink, disclaimerHeading, disclaimerContent,
        footerCompanyName, footerCompanyTagline, footerContactEmail, footerContactPhone, footerContactAddress, footerPaymentMethods, footerNewsletterHeading, footerCopyrightText, footerQuickLinksJson, footerSocialIconsJson,
        enableCampaignBanner, campaignBannerHeading, campaignBannerText, campaignBannerButtonText, campaignBannerButtonLink, campaignBannerImageUrlInput, campaignBannerBackgroundColor, campaignBannerTextColor, campaignBannerImageOption,
        mainLogoUrlOption, mainLogoUrlInput, sendCustomerContactConfirmEmail, contactRecipientEmail, contactAddress, contactEmail, contactPhone
    } = req.body;

    try {
        const updateSetting = async (key, value) => {
            await Setting.findOneAndUpdate( { key: key }, { value: value, updatedAt: Date.now() }, { upsert: true, new: true } );
        };

        await updateSetting('themeColor', themeColor);
        await updateSetting('metaTitle', metaTitle);
        await updateSetting('metaDescription', metaDescription);
        await updateSetting('metaKeywords', metaKeywords);
        await updateSetting('paypalClientId', paypalClientId);
        await updateSetting('paypalClientSecret', paypalClientSecret);
        await updateSetting('emailUser', emailUser);
        await updateSetting('emailPass', emailPass);
        await updateSetting('homePhoneNumber', homePhoneNumber);
        await updateSetting('homeSubtitle', homeSubtitle);
        await updateSetting('homeHeading', homeHeading);
        await updateSetting('homeDescription', homeDescription);
        await updateSetting('homeButtonText', homeButtonText);
        await updateSetting('homeButtonLink', homeButtonLink);
        await updateSetting('disclaimerHeading', disclaimerHeading);
        await updateSetting('disclaimerContent', disclaimerContent);

        let newLogoUrl;
        const uploadedMainLogo = req.files && req.files['mainLogoFile'] ? req.files['mainLogoFile'][0] : null;

        if (mainLogoUrlOption === 'upload' && uploadedMainLogo) {
            newLogoUrl = `/uploads/logos/${uploadedMainLogo.filename}`;
        } else if (mainLogoUrlOption === 'url' && mainLogoUrlInput) {
            newLogoUrl = mainLogoUrlInput;
        } else {
            newLogoUrl = req.app.locals.settings.mainLogoUrl || '';
        }
        await updateSetting('mainLogoUrl', newLogoUrl);


        await updateSetting('footerCompanyName', footerCompanyName);
        await updateSetting('footerCompanyTagline', footerCompanyTagline);
        await updateSetting('footerContactEmail', footerContactEmail);
        await updateSetting('footerContactPhone', footerContactPhone);
        await updateSetting('footerContactAddress', footerContactAddress);
        await updateSetting('footerPaymentMethods', footerPaymentMethods);
        await updateSetting('footerNewsletterHeading', footerNewsletterHeading);
        await updateSetting('footerCopyrightText', footerCopyrightText);
        
        try { await updateSetting('footerQuickLinks', JSON.parse(footerQuickLinksJson)); } catch (e) { console.error("Error parsing footerQuickLinksJson:", e.message); }
        try { await updateSetting('footerSocialIcons', JSON.parse(footerSocialIconsJson)); } catch (e) { console.error("Error parsing footerSocialIconsJson:", e.message); }

        await updateSetting('enableCampaignBanner', enableCampaignBanner === 'on');
        await updateSetting('campaignBannerHeading', campaignBannerHeading);
        await updateSetting('campaignBannerText', campaignBannerText);
        await updateSetting('campaignBannerButtonText', campaignBannerButtonText);
        await updateSetting('campaignBannerButtonLink', campaignBannerButtonLink);
        await updateSetting('campaignBannerBackgroundColor', campaignBannerBackgroundColor);
        await updateSetting('campaignBannerTextColor', campaignBannerTextColor);

        let newCampaignBannerImageUrl;
        const uploadedBannerImage = req.files && req.files['campaignBannerImageFile'] ? req.files['campaignBannerImageFile'][0] : null;

        if (campaignBannerImageOption === 'upload' && uploadedBannerImage) {
            newCampaignBannerImageUrl = `/uploads/campaign_banners/${uploadedBannerImage.filename}`;
        } else if (campaignBannerImageOption === 'url' && campaignBannerImageUrlInput) {
            newCampaignBannerImageUrl = campaignBannerImageUrlInput;
        } else {
            newCampaignBannerImageUrl = req.app.locals.settings.campaignBannerImageUrl || '';
        }
        await updateSetting('campaignBannerImageUrl', newCampaignBannerImageUrl);

        await updateSetting('sendCustomerContactConfirmEmail', sendCustomerContactConfirmEmail === 'on');
        await updateSetting('contactRecipientEmail', contactRecipientEmail);
        await updateSetting('contactAddress', contactAddress);
        await updateSetting('contactEmail', contactEmail);
        await updateSetting('contactPhone', contactPhone);


        res.redirect('/admin/settings?message=Settings updated successfully!');
    } catch (error) {
        console.error('Error updating settings:', error);
        res.redirect('/admin/settings?error=Failed to update settings.');
    }
});


export default router;

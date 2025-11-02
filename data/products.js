// data/products.js
// This script is used to seed your MongoDB database with initial product information.
// You should run this file once after setting up your MongoDB connection.

import mongoose from 'mongoose';
import Product from '../models/product.js'; // Import the Product model
import dotenv from 'dotenv';
dotenv.config();

const productsToSeed = [
    {
        id: 'p1',
        name: 'Watchdog Antivirus - 1PC',
        category: 'Antivirus',
        oldPrice: 39.99,
        price: 9.99,
        savePercent: 67,
        image: '/image/Mcafee-livesafe.png',
        shortDesc: 'Watchdog Antivirus delivers powerful online protection, ensuring your identity and devices are always safe. Activate instantly. No shipping required.',
        longDesc: [
            'Watchdog Antivirus 1 Device / 1-Year is an incredible antivirus solution for your PCs, Macs, and other devices. With millions of loyal users worldwide, it has become acknowledged for top-quality protection against a wide variety of threats that present danger to your devices on a daily basis.',
            'When browsing the internet, many things can go wrong for you or your device. Cyber criminals use shady techniques to trick you into downloading viruses, entering your login credentials to fake websites, or breach your privacy by tracking you.',
            'You can avoid all of these things by utilizing the many features of Watchdog Antivirus. It makes it easy to protect yourself against such threats with an advanced antivirus solution that’s easy to use, yet incredibly effective in getting rid of malware and online schemes.',
            'Don’t fall victim to the tricks of cyber criminals and purchase Watchdog Antivirus today. With this product, you’re able to protect up to ten individual PCs or Macs, providing incredible protection for your family, friends, or workers. Stay cost-efficient by reducing the money spent on IT professionals managing antivirus solutions, and purchase our product for a great value.'
        ],
        brand: 'Watchdog',
        rating: 4.5, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p2',
        name: 'McAfee Antivirus - 3PC',
        category: 'Antivirus',
        oldPrice: 59.99,
        price: 29.99,
        savePercent: 67,
        image: '/image/McAfee-total-protection-1.png',
        shortDesc: 'McAfee Antivirus provides comprehensive protection for 3 PCs, safeguarding against viruses, malware, and online threats.',
        longDesc: [
            'McAfee Antivirus for 3 PCs offers robust security features to keep your digital life secure. Protect multiple devices with one subscription, ensuring peace of mind.',
            'Its advanced scanning engine detects and removes threats, while real-time protection shields you from emerging dangers. Enjoy safe browsing and secure online transactions.',
            'Easy to install and manage, McAfee Antivirus is ideal for families or small businesses needing reliable protection across various devices.'
        ],
        brand: 'McAfee',
        rating: 4.0, // ADD THIS LINE
        platform: 'Windows, macOS',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p3',
        name: 'Kaspersky Internet Security',
        category: 'Internet Security',
        oldPrice: 79.99,
        price: 49.99,
        savePercent: 67,
        image: '/image/McAfee-Internet-Security.png',
        shortDesc: 'Kaspersky Internet Security offers essential protection for your PC, safeguarding your privacy and finances online.',
        longDesc: [
            'Kaspersky Internet Security provides a secure environment for online banking, shopping, and browsing. It protects against phishing, malware, and ransomware.',
            'Features like VPN, Safe Money, and Password Manager enhance your online privacy and security. It ensures your digital activities are protected.',
            'Lightweight and efficient, it runs smoothly without slowing down your device, providing continuous protection against all forms of cyber threats.'
        ],
        brand: 'Kaspersky',
        rating: 4.8, // ADD THIS LINE
        platform: 'Windows, macOS, Android',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p4',
        name: 'Bitdefender Internet Security',
        category: 'Internet Security',
        oldPrice: 89.99,
        price: 59.99,
        savePercent: 67,
        image: '/image/McAfee-Internet-Security.png',
        shortDesc: 'Bitdefender Internet Security delivers multi-layered protection against all types of malware, including ransomware and zero-day exploits.',
        longDesc: [
            'Bitdefender Internet Security is renowned for its top-tier protection and performance. It includes features like a firewall, parental controls, and webcam protection.',
            'Its advanced threat detection system ensures that no malicious software can breach your defenses. It also optimizes system performance.',
            'With continuous updates and dedicated support, Bitdefender offers a complete security package for your internet-connected devices.'
        ],
        brand: 'Bitdefender',
        rating: 4.7, // ADD THIS LINE
        platform: 'Windows',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p5',
        name: 'McAfee Total Protection',
        category: 'Total Protection',
        oldPrice: 129.99,
        price: 99.99,
        savePercent: 67,
        image: '/image/McAfee-total-protection-1.png',
        shortDesc: 'McAfee Total Protection offers premium antivirus, identity, and privacy protection for all your devices.',
        longDesc: [
            'McAfee Total Protection is an all-in-one security suite that goes beyond traditional antivirus. It includes ransomware protection, password manager, and secure VPN.',
            'It protects your online privacy, secures your identity, and provides safe browsing. Features like file shredder and encrypted storage add extra layers of security.',
            'Ideal for users who want comprehensive protection across all their devices, from PCs and Macs to smartphones and tablets. Easy to manage and configure.'
        ],
        brand: 'McAfee',
        rating: 4.2, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p6',
        name: 'McAfee Antivirus Plus 1 Device / 1 Year',
        category: 'Antivirus',
        oldPrice: 59.99,
        price: 34.45,
        savePercent: 67,
        image: '/image/McAfee-antivirus-Plus-antivirus-1.png',
        shortDesc: 'McAfee Antivirus Plus delivers powerful online protection, ensuring your identity and devices are always safe. Activate instantly. No shipping required.',
        longDesc: [
            'McAfee Antivirus Plus 1 Device / 1-Year is an incredible antivirus solution for your PCs, Macs, and other devices. With millions of loyal users worldwide, it has become acknowledged for top-quality protection against a wide variety of threats that present danger to your devices on a daily basis. McAfee my Account Login',
            'When browsing the internet, many things can go wrong for you or your device. Cyber criminals use shady techniques to trick you into downloading viruses, entering your login credentials to fake websites, or breach your privacy by tracking you. McAfee Login',
            'You can avoid all of these things by utilizing the many features of McAfee Anti Virus Plus. McAfee makes it easy to protect yourself against such threats with an advanced antivirus solution that’s easy to use, yet incredibly effective in getting rid of malware and online schemes.',
            'Don’t fall victim to the tricks of cyber criminals and purchase McAfee Anti Virus Plus today. With this product, you’re able to protect up to ten individual PCs or Macs, providing incredible protection for your family, friends, or workers. Stay cost-efficient by reducing the money spent on IT professionals managing antivirus solutions, and purchase our product for a great value. mcafee.com/activate'
        ],
        brand: 'McAfee',
        rating: 3.9, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p7',
        name: 'McAfee Antivirus Plus 10-Devices / 5-Year',
        category: 'Antivirus',
        oldPrice: 79.99,
        price: 59.99,
        savePercent: 67,
        image: '/image/McAfee-antivirus-Plus-antivirus-1.png',
        shortDesc: 'McAfee Antivirus Plus 10-Devices- Unlimited / 5-Year offers robust protection for multiple devices over an extended period.',
        longDesc: [
            'This long-term McAfee solution ensures all your family\'s devices are continuously protected against the latest cyber threats. It\'s a cost-effective way to secure your digital footprint for years.',
            'Enjoy features like real-time scanning, network protection, and phishing prevention across Windows, macOS, Android, and iOS devices. Simple setup and continuous updates keep you safe.',
            'Perfect for comprehensive home security, allowing you to browse, shop, and bank online with confidence.'
        ],
        brand: 'McAfee',
        rating: 4.1, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p8',
        name: 'McAfee Internet Security 1 Device / 1 Year',
        category: 'Internet Security',
        oldPrice: 59.99,
        price: 39.99,
        savePercent: 67,
        image: '/image/McAfee-Internet-Security.png',
        shortDesc: 'McAfee Internet Security offers essential protection for 1 device, safeguarding your privacy and online activities.',
        longDesc: [
            'McAfee Internet Security provides robust defenses against viruses, spyware, and other online threats. It includes safe browsing tools and a firewall to protect your personal data.',
            'Ideal for individual users, it ensures a secure online experience without compromising system performance. Get real-time protection and automatic updates.',
            'Keep your digital life private and secure with McAfee\'s award-winning internet security features.'
        ],
        brand: 'McAfee',
        rating: 3.5, // ADD THIS LINE
        platform: 'Windows',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'p9',
        name: 'McAfee Total Protection 5-Devices',
        category: 'Total Protection',
        oldPrice: 119.99,
        price: 99.99,
        savePercent: 67,
        image: '/image/McAfee-total-protection-1.png',
        shortDesc: 'McAfee Total Protection for 5 devices provides comprehensive security for your family across multiple platforms.',
        longDesc: [
            'This suite offers a powerful combination of antivirus, identity protection, password manager, and secure VPN. Protect up to 5 devices including PCs, Macs, smartphones, and tablets.',
            'It defends against ransomware, malicious websites, and ensures your online transactions are safe. Features like encrypted storage and file shredder add an extra layer of privacy.',
            'Manage all your device security from a single dashboard, ensuring a seamless and protected digital experience for everyone.'
        ],
        brand: 'McAfee',
        rating: 4.6, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Instant Email Delivery'
    },
    {
        id: 'n1',
        name: 'Norton 360 Standard',
        category: 'Antivirus',
        oldPrice: 100.00,
        price: 90.00,
        savePercent: 10,
        image: '/image/Norton-360-Standard.png',
        shortDesc: 'Norton 360 Standard | 1 User 3 Year|Total Security For Pc,Mac, Android Or Ios |Additionally Includes Password Manager, Pc Cloud Back Up, Safecam For Pc|Email Delivery In 2 Hrs',
        longDesc: [
            'Norton 360 Standard provides powerful layers of protection for your devices and online privacy.',
            'Your PCs, Macs, smartphones, or tablets receive protection against malware, phishing, and ransomware.',
            'Includes Password Manager, PC Cloud Backup, and SafeCam for PC to help secure your digital life.'
        ],
        brand: 'Norton',
        rating: 4.9, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Email Delivery In 2 Hrs'
    },
    {
        id: 'n2',
        name: 'Norton 360 Deluxe',
        category: 'Total Protection',
        oldPrice: 120.00,
        price: 100.00,
        savePercent: 17,
        image: '/image/Norton-360-Deluxe.png',
        shortDesc: 'Norton 360 Deluxe | 5 Devices 3 Year|Total Security For Pc,Mac, Android Or Ios |Additionally Includes Password Manager, Pc Cloud Back Up, Safecam For Pc|Email Delivery In 2 Hrs',
        longDesc: [
            'Norton 360 Deluxe offers comprehensive security for up to 5 devices.',
            'It includes advanced protection against cyber threats, a VPN for online privacy, and parental control features.',
            'Secure your family’s devices, online activities, and personal information with this all-in-one solution.'
        ],
        brand: 'Norton',
        rating: 4.5, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Email Delivery In 2 Hrs'
    },
    {
        id: 'n3',
        name: 'Norton 360 Premium',
        category: 'Total Protection',
        oldPrice: 150.00,
        price: 125.00,
        savePercent: 17,
        image: '/image/Norton-360-Premium.png',
        shortDesc: 'Norton 360 Premium | 10 Devices 3 Year|Total Security For Pc,Mac, Android Or Ios |Additionally Includes Password Manager, Pc Cloud Back Up, Safecam For Pc|Email Delivery In 2 Hrs',
        longDesc: [
            'Norton 360 Premium provides ultimate protection for up to 10 devices.',
            'Enjoy all the features of Deluxe, plus more cloud storage and priority support.',
            'Ideal for large families or users with many devices needing top-tier security.'
        ],
        brand: 'Norton',
        rating: 4.9, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Email Delivery In 2 Hrs'
    },
    {
        id: 'n4',
        name: 'Norton Antivirus Plus',
        category: 'Antivirus',
        oldPrice: 60.00,
        price: 34.00,
        savePercent: 43,
        image: '/image/Norton-Antivirus-Plus.png',
        shortDesc: 'Norton Antivirus Plus | 1 Device 1 Year|Total Security For Pc,Mac, Android Or Ios |Additionally Includes Password Manager, Pc Cloud Back Up, Safecam For Pc|Email Delivery In 2 Hrs',
        longDesc: [
            'Norton AntiVirus Plus is a powerful antivirus solution for a single device.',
            'It provides essential real-time protection against malware, viruses, and online threats.',
            'Includes Password Manager and 2GB Cloud Backup to keep your digital life secure.'
        ],
        brand: 'Norton',
        rating: 4.3, // ADD THIS LINE
        platform: 'Windows, macOS',
        delivery: 'Email Delivery In 2 Hrs'
    },
    {
        id: 'n5',
        name: 'Norton Secure VPN',
        category: 'VPN',
        oldPrice: 50.00,
        price: 30.00,
        savePercent: 40,
        image: '/image/Norton-Secure-VPN.png',
        shortDesc: 'Norton Secure VPN | 5 Devices 1 Year|Online Privacy And Anonymity |No Logs Policy |Email Delivery In 2 Hrs',
        longDesc: [
            'Norton Secure VPN encrypts your online activity, helping to keep your information private.',
            'Browse anonymously and access your favorite content from anywhere with a no-logs policy.',
            'Protect up to 5 devices and secure your Wi-Fi connections, even on public hotspots.'
        ],
        brand: 'Norton',
        rating: 4.0, // ADD THIS LINE
        platform: 'Windows, macOS, Android, iOS',
        delivery: 'Email Delivery In 2 Hrs'
    }
    // Add more products as needed, following the same structure
];

// Connect to MongoDB and seed data
const seedDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/cybersafetrust", {});
        console.log('MongoDB Connected for seeding...');

        // Clear existing products and insert new ones
        await Product.deleteMany({});
        console.log('Existing products cleared.');
        await Product.insertMany(productsToSeed);
        console.log('Products seeded successfully!');
    } catch (err) {
        console.error('Error seeding database:', err.message);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

seedDB();

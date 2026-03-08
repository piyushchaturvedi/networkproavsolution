import fetch from "node-fetch";
import nodemailer from 'nodemailer';
/* ------------------------------------------------
   1. Base function to send WhatsApp message
------------------------------------------------ */

export async function sendWhatsApp(phone, message) {

  try {

    const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message }
      })
    });

    const data = await response.json();

    console.log("WhatsApp API Response:", data);

  } catch (error) {
    console.error("WhatsApp Error:", error);
  }

}


/* ------------------------------------------------
   2. Send order notification to admin
------------------------------------------------ */

export async function sendAdminOrderNotification(order) {

  try {

    const items = order.items
      .map(i => `${i.name} x${i.quantity}`)
      .join("\n");

    const message = `
🛒 *ORDER UPDATE*

Status: ${order.status.toUpperCase()}

Order ID: ${order._id}

Customer: ${order.customerName}
Email: ${order.customerEmail}

Items:
${items}

Total: $${order.totalAmount}

Address:
${order.shippingAddress?.address}
${order.shippingAddress?.city}
${order.shippingAddress?.state}
${order.shippingAddress?.country}

Time: ${new Date().toLocaleString()}
`;

    const phones = [
      process.env.ADMIN_PHONE_1,
      process.env.ADMIN_PHONE_2
    ];

    for (const phone of phones) {
      await sendWhatsApp(phone, message);
    }

  } catch (error) {
    console.error("Admin Notification Error:", error);
  }

}


/* ------------------------------------------------
   3. Send message to customer
------------------------------------------------ */

export async function sendCustomerOrderNotification(order) {

  try {

    if (!order.shippingAddress?.phone) return;

    const message = `
🙏 Thank you for your order!

Order ID: ${order._id}

Status: ${order.status}

Total Amount: $${order.totalAmount}

We will process your order shortly.

Arihant Divine Arts
`;

    await sendWhatsApp(order.shippingAddress.phone, message);

  } catch (error) {
    console.error("Customer Notification Error:", error);
  }

}


export async function sendAdminEmailNotification(order) {
  try {
    
    // Create the transporter using stored settings
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Format the items list using the Order model structure
    const itemsList = order.items
      .map(i => `- ${i.name} (x${i.quantity}) - $${i.price.toFixed(2)}`)
      .join("\n");

    // Construct the Professional Email Template
    const fullMessage = `Hello Admin,

A new order update has occurred on NetworkProAVSolution.

Order Details:
--------------------------------------------
Order ID: #${order._id}
Status: ${order.OrderCompleteStatus?.toUpperCase() || 'PENDING'}

Customer Information:
Name: ${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}
Email: ${order.shippingAddress?.email}
Phone: ${order.shippingAddress?.phone}
Postal Code: ${order.shippingAddress?.postalCode}
Billing Address:
${order.shippingAddress?.address}, ${order.shippingAddress?.city}
${order.shippingAddress?.state}, ${order.shippingAddress?.country}

Items Ordered:
${itemsList}

Total Amount: $${order.totalAmount}

--------------------------------------------

Time of Update: ${new Date().toLocaleString()}

Please log in to the admin panel to manage this order.`;

    // MULTIPLE EMAILS LOGIC:
    // You can provide a comma-separated string of emails to send to multiple people at once.
    const adminEmails = [
      process.env.ADMIN_EMAIL_1 || "", // Primary admin email from .env
      process.env.ADMIN_EMAIL_2 || "", // Example of pulling second admin from .env
      process.env.ADMIN_EMAIL_3 || ""  // Example of pulling third admin from .env
    ].filter(email => email !== "").join(", ");

    // Send the mail
    await transporter.sendMail({
      from: `"NetworkProAV Admin" <${process.env.EMAIL_USER}>`,
      to: adminEmails, // This now contains multiple emails separated by commas
      subject: `Order Update Notification - ID: #${order._id}`,
      text: fullMessage
    });

    console.log(`Admin email notification sent to [${adminEmails}] for Order: ${order._id}`);
  } catch (error) {
    console.error("Admin Email Notification Error:", error);
  }
}
import fetch from "node-fetch";

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
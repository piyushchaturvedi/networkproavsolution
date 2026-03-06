document.addEventListener('DOMContentLoaded', () => {
    // Check if the PayPal button container exists on the page
    const paypalButtonContainer = document.getElementById('paypal-button-container');

    if (paypalButtonContainer) {
        // Get the product ID from a data attribute or a hidden input
        const productId = paypalButtonContainer.dataset.productId;
        if (!productId) {
            console.error('Product ID not found for PayPal button.');
            return;
        }

        // Render the PayPal Smart Buttons
        paypal.Buttons({
            createOrder: function (data, actions) {
                // This function is called when the user clicks the PayPal button
                return fetch('/create-paypal-order', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    }
                }).then(function (res) {
                    if (!res.ok) {
                        return res.json().then(err => {
                            throw err;
                        });
                    }
                    return res.json();
                }).then(function (orderData) {
                    // CRITICAL: Ensure we return the ID string to the PayPal SDK
                    // If your server returns { id: 'xxxx' }, return orderData.id
                    if (!orderData.id) {
                        throw new Error('Order ID not returned from server');
                    }
                    return orderData.id;
                }).catch(err => {
                    console.error('PayPal Create Order Error:', err);
                    // Show a custom message box instead of alert()
                    const errorDiv = document.createElement('div');
                    errorDiv.style.color = 'red';
                    errorDiv.innerText = 'Could not initiate PayPal Checkout. Please try again.';
                    document.body.appendChild(errorDiv);
                });
            },
            onApprove: async function (data, actions) {
                // This function is called when the user approves the payment
                const res = await fetch('/capture-paypal-order', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        orderID: data.orderID
                    })
                });
                const details = await res.json();
                if (details.status === 'COMPLETED') {
                    window.location.href = '/order-success';
                } else {
                    window.location.href = '/order-failed';
                }
            },
            onError: function (err) {
                console.error('PayPal Script Error:', err);
            }
        }).render('#paypal-button-container');
    }
});

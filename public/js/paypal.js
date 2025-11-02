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
            // Set up the transaction
            createOrder: async function(data, actions) {
                try {
                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ productId: productId }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to create PayPal order on server.');
                    }

                    const order = await response.json();
                    return order.orderID; // Return the order ID obtained from your server
                } catch (error) {
                    console.error('Error creating PayPal order:', error);
                    // Display an error message to the user (e.g., using a custom modal)
                    alert('Could not set up PayPal transaction. Please try again later.'); // Using alert for simplicity, replace with custom UI
                }
            },

            // Finalize the transaction
            onApprove: async function(data, actions) {
                try {
                    const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to capture PayPal order on server.');
                    }

                    const orderData = await response.json();
                    // Show a success message to the buyer
                    // For example, redirect to a success page or update the UI
                    console.log('Capture result:', orderData);
                    window.location.href = '/checkout/success'; // Redirect on successful payment

                } catch (error) {
                    console.error('Error capturing PayPal order:', error);
                    // Display an error message to the user
                    alert('Payment could not be completed. Please try again.'); // Using alert for simplicity, replace with custom UI
                }
            },

            // Handle when the buyer cancels the transaction
            onCancel: function (data) {
                console.log('Payment cancelled by user:', data);
                window.location.href = '/checkout/cancel'; // Redirect on payment cancellation
            },

            // Handle errors
            onError: function (err) {
                console.error('An error occurred during the PayPal transaction:', err);
                // Display an error message to the user
                alert('An error occurred with PayPal. Please try again or contact support.'); // Using alert for simplicity, replace with custom UI
            }
        }).render('#paypal-button-container'); // Render the buttons into the specified container
    }
});

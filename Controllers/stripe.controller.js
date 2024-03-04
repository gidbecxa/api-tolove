const { STRIPE_SECRET_KEY } = require("../configEnv");
const logger = require("../logger");
const stripe = require('stripe')(STRIPE_SECRET_KEY);

module.exports = {
    /* createPaymentIntent: async (req, res) => {
        console.log(req.body);
        const { currency, items } = req.body;
        const packIndex = items[0].id;

        try {
            let amount = 0;

            // set the value of amount based on the price of the pack
            switch (packIndex) {
                case 1:
                    amount = 1499;
                    break;
                case 2:
                    amount = 2999;
                    break;
                case 3:
                    amount = 4999;
                    break;
                case 4:
                    amount = 9999;
                    break;
                case 5:
                    amount = 24999;
                    break;
                default:
                    break;
            }
            console.log(`Price amount: $${amount / 100}`);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency,
                // payment_method_types: ['link', 'card'],
                payment_method_types: ['card'],
            });

            const publishableKey = STRIPE_PUBLISHABLE_KEY;

            res.send({
                clientSecret: paymentIntent.client_secret,
                publishableKey: publishableKey
            });
        } catch (err) {
            res.status(400).send({
                error: { message: err.message }
            });
            logger.error(err);
        }
    }, */

    createPaymentMethods: async (req, res) => {
        console.log('card:', req.body);

        try {
            const { card } = req.body;
            // console.log(card.cvc, card.number, card.exp_month, card.exp_year);

            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    cvc: card.cvc,
                    exp_month: card.exp_month,
                    exp_year: card.exp_year,
                    number: card.number
                },
            });

            console.log("Payment method:", paymentMethod);
            res.json({ tokenId: paymentMethod.id });
        } catch (error) {
            console.log('Payment method creation error:', error);
            res.status(500).send({ error: 'An error occurred while creating the payment method' });
        }
    },

    createPaymentIntent: async (req, res) => {
        console.log('req for creating payment intent:', req.body);
        const { paymentMethodId, items } = req.body;
        const packIndex = items[0].id;

        try {
            let amount = 0;

            // set the amount based on the price of the pack
            switch (packIndex) {
                case 1:
                    amount = 149;
                    break;
                case 2:
                    amount = 2999;
                    break;
                case 3:
                    amount = 4999;
                    break;
                case 4:
                    amount = 9999;
                    break;
                case 5:
                    amount = 24999;
                    break;
                default:
                    break;
            }
            console.log(`Price amount: $${amount / 100}`);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method: paymentMethodId,
                // payment_method: 'pm_card_visa',
                confirm: true,
            });

            // console.log(paymentIntent.status, paymentIntent.client_secret);
            console.log("paymentIntent:", paymentIntent);
            res.json({
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status,
            });
        } catch (err) {
            console.log('Payment intent creation error:', err);
            res.status(500).send({ error: 'An error occurred while creating the payment intent' });
        }
    },

    createCustomer: async (req, res) => {
        try {
            const customer = await stripe.customers.create({
                phone: 'customer@example.com',
                // Additional customer details
            });
            console.log('Customer ID:', customer.id);
            res.json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            console.log('Customer creation error:', error);
        }
    },
}

const env = require('../config/env');

const stripe = env.stripeSecretKey ? require('stripe')(env.stripeSecretKey) : null;

const isEnabled = () => Boolean(stripe);

async function createCheckoutSession({ booking, roomType, hotelName }) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: booking.guest_email,
    client_reference_id: booking.id,
    metadata: { bookingId: booking.id, reference: booking.reference },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: env.currency,
          unit_amount: Math.round(Number(booking.total_price) * 100),
          product_data: {
            name: `${roomType} · ${hotelName}`,
            description: `${booking.check_in} → ${booking.check_out} · ${booking.nights} night(s)`,
          },
        },
      },
    ],
    // Stripe's minimum; matches how long we hold the room.
    expires_at: Math.floor(Date.now() / 1000) + env.holdMinutes * 60 + 60,
    success_url: `${env.appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/my-bookings?payment=cancelled`,
  });
  return session;
}

const retrieveSession = (id) => stripe.checkout.sessions.retrieve(id);

const constructEvent = (rawBody, signature) =>
  stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

const refund = (paymentIntent) => stripe.refunds.create({ payment_intent: paymentIntent });

module.exports = { isEnabled, createCheckoutSession, retrieveSession, constructEvent, refund };

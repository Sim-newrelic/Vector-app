import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.body;

  let sessionParams = {
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/cancel`,
    line_items: [],
  };

  if (type === 'one_time') {
    sessionParams.line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'One-Time File Download' },
          unit_amount: 100, // $1.00
        },
        quantity: 1,
      },
    ];
    sessionParams.mode = 'payment';
  } else if (type === 'subscription') {
    sessionParams.line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Unlimited Subscription' },
          recurring: { interval: 'month' },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      },
    ];
    sessionParams.mode = 'subscription';
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 
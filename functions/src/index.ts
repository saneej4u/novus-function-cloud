import * as functions from 'firebase-functions';

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const stripe = require('stripe')('sk_test_eLXRJynJYpe4E944tEAchGkt', {apiVersion: ''});

admin.initializeApp();

export const createStripePaymentIntent = functions.firestore
  .document('basket/{id}')
  .onCreate(async (snap, context) => {
    const { amount, currency } = snap.data();
    try {
      // Create a charge using the pushId as the idempotency key
      // to protect against double charges.
      const idempotencyKey = context.params.id;
      const payment = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          payment_method_types: ['card'],
        },
        { idempotencyKey }
      );
      // If the result is successful, write it back to the database.
      await snap.ref.set(payment);
      return;
    } catch (error) {
      // We want to capture errors and render them in a user-friendly way, while
      // still logging an exception with StackDriver
      console.log(error);
      await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
      return;
    }
  });

  function userFacingMessage(error: any) {
    return error.type
      ? error.message
      : 'An error occurred, developers have been alerted';
  }



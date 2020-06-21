import * as functions from 'firebase-functions';

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret, {
  apiVersion: '2020-03-02',
});

admin.initializeApp();

  export const updateStripePaymentIntent = functions.firestore.document('basket/{id}').onUpdate(async (change, context) => {
  
    const newValue = change.after.data();
  
    if(!newValue.isPaymentIntent)
    {
      return null
    }
  
    const { amount, currency } = newValue;
  
    try 
    {
      // Create a charge using the pushId as the idempotency key
      // to protect against double charges.
      const payment = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          payment_method_types: ['card'],
        });
      // If the result is successful, write it back to the database.
           // Then return a promise of a set operation to update the count
           return change.after.ref.set({payment}, {merge: true});
    } 
    catch (error) 
    {
      // We want to capture errors and render them in a user-friendly way, while
      // still logging an exception with StackDriver
      console.log(error);
      await newValue.ref.set({ error: userFacingMessage(error) }, { merge: true });
      return;
    }
  });


  function userFacingMessage(error: any) {
    return error.type
      ? error.message
      : 'An error occurred, developers have been alerted';
  }



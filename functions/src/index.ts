import * as functions from 'firebase-functions';

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret, {
  apiVersion: '2020-03-02',
});

admin.initializeApp();

  export const updateStripePaymentIntent = functions.firestore.document('basket/{id}').onUpdate(async (change, context) => {
  
    const oldValue = change.before.data();
    const newValue = change.after.data();
  
    if(!newValue.isPaymentIntent || oldValue.totalPrice == newValue.totalPrice)
    {
      return null
    }
 
    try 
    {
     
      if(newValue.payment)
      {
        const paymentIntentId = newValue.payment.id;

        const payment = await stripe.paymentIntents.update(paymentIntentId,{ amount: newValue.totalPrice});
        return change.after.ref.set({payment}, {merge: true});
      }
      else
      {
        const amount = newValue.totalPrice;
        const currency = 'gbp';         
        const idempotencyKey = context.params.id;

        const payment = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          payment_method_types: ['card'],
        },  { idempotencyKey });

        return change.after.ref.set({payment}, {merge: true});
      }

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



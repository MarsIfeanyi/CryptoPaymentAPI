require("dotenv").config();
const express = require("express");
const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      const url = req.originalUrl;
      if (url.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

var coinbase = require("coinbase-commerce-node");
var Client = coinbase.Client;
var resources = coinbase.resources;
var webhook = coinbase.webhook;

Client.init(process.env.COINBASE_API_KEY);

// Creating the Checkout endpoint/API
app.post("/checkout", async (req, res) => {
  const { amount, currency } = req.body; // hint: you can replace the currency here with static currency you like (USD, NGN etc). Here we are leaving it as currency thus making it dynamic.

  try {
    const charge = await resources.Charge.create({
      name: "Bale Charge",
      description: "Bale charge description",
      local_price: {
        amount: amount,
        currency: currency,
      },
      pricing_type: "fixed_price",
      metadata: {
        user_id: "3434",
      }, //hint: The metadata can have any value you want. here we are interested in  getting the unique ID of a user of "Bale".
    });

    res.status(200).json({
      charge: charge,
    });
  } catch (error) {
    res.status(500).json({
      error: error,
    });
  }
});

app.post("/webhooks", async (req, res) => {
  const event = webhook.verifyEventBody(
    req.rawBody,
    req.headers["x-cc-webhook-signature"],
    process.env.COINBASE_WEBHOOK_SECRET
  );

  console.log(event);

  try {
    if (event.type === "charge:confirmed") {
      let amount = event.data.pricing.local.amount;
      let currency = event.data.pricing.local.currency;
      let user_id = event.data.metadata.user_id;

      console.log(amount, currency, user_id);
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({
      error: error,
    });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3000");
});

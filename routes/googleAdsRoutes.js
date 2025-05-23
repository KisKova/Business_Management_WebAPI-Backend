const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const authMiddleware = require("../middlewares/authMiddleware");
const { GoogleAdsApi } = require("google-ads-api");
const googleAdsController = require("../features/google-ads/googleAdsController")

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEV_TOKEN,
});

const refreshToken = "1/8wHKhBIXtYONznn77e-BJupvXULYNf2ZkQq2BwDAY1w";
const rootCustomerId = "5166320402"; // Your MCC ID// Example: "5166320402"

router.get("/accounts", authMiddleware.authenticateJWT, googleAdsController.getAllAccounts);

router.post("/report", authMiddleware.authenticateJWT, googleAdsController.createReport);

module.exports = router;

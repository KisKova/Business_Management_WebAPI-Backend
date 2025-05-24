const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const googleAdsController = require("../features/google-ads/googleAdsController")

router.get("/accounts", authMiddleware.authenticateJWT, googleAdsController.getAllAccounts);

router.post("/report", authMiddleware.authenticateJWT, googleAdsController.createReport);

module.exports = router;

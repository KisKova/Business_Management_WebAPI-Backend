const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { GoogleAdsApi } = require("google-ads-api");

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEV_TOKEN,
});

const refreshToken = "1/8wHKhBIXtYONznn77e-BJupvXULYNf2ZkQq2BwDAY1w";
const rootCustomerId = "5166320402"; // Your MCC ID// Example: "5166320402"

router.get("/accounts", async (req, res) => {
    try {
        const customer = client.Customer({
            customer_id: rootCustomerId,
            refresh_token: refreshToken,
        });

        const query = `
            SELECT
                customer_client.client_customer,
                customer_client.descriptive_name,
                customer_client.manager,
                customer_client.level
            FROM customer_client
            WHERE customer_client.status = 'ENABLED' AND customer_client.manager = false
        `;

        const result = await customer.query(query);

        const accounts = result.map(row => ({
            id: row.customer_client.client_customer.split("/")[1],
            name: row.customer_client.descriptive_name,
        }));

        res.json(accounts);
    } catch (err) {
        console.error("Failed to fetch Google Ads accounts:", err.message);
        res.status(500).json({ error: "Unable to fetch client accounts." });
    }
});

// POST /google-ads/report
router.post("/report", async (req, res) => {
    const { customerId } = req.body;

    if (!customerId) {
        return res.status(400).json({ error: "Missing customerId" });
    }

    const customer = client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
        login_customer_id: rootCustomerId
    });

    const buildCampaignQuery = ({ startDate, endDate, includeMonth = false }) => {
        return `
        SELECT
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            ${includeMonth ? "segments.month," : ""}
            campaign.advertising_channel_type,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.all_conversions,
            metrics.all_conversions_value,
            metrics.cost_per_conversion,
            metrics.cost_per_all_conversions,
            metrics.ctr,
            metrics.average_cpc,
            metrics.view_through_conversions,
            metrics.video_views,
            metrics.video_view_rate,
            metrics.content_budget_lost_impression_share,
            metrics.search_budget_lost_impression_share,
            metrics.conversions_from_interactions_rate,
            metrics.all_conversions_from_interactions_rate,
            metrics.interactions,
            metrics.interaction_rate,
            metrics.average_cost
        FROM campaign
        WHERE
            segments.date BETWEEN \'${startDate}\' AND \'${endDate}\'
            AND metrics.impressions > 0
    `;
    };


    try {
        const startDate = "2025-03-01";
        const endDate = "2025-03-31";
        const includeMonth = true;

        const query = buildCampaignQuery({ startDate, endDate, includeMonth });
        const results = await customer.query(query);
        const fileName = `campaign_names_${customerId}.pdf`;
        const filePath = path.join(__dirname, fileName);

        const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const formatNumber = (value, decimals = 0) =>
            value?.toLocaleString("hu-HU", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });

        const formatFt = (value, decimals = 0) => `${formatNumber(value, decimals)} Ft`;

        const formatPercent = (value) =>
            `${formatNumber(value * 100, 2)}%`;


        const monthName = new Date(startDate).toLocaleString("en-US", { month: "long" });

        doc
            .moveDown(0.5)
            .font("Helvetica-Bold")
            .fontSize(14)
            .fillColor("#3c86ec")
            .text(`Summary results for ${monthName}`, { align: "left", textColor: "#3c86ec" })
            .moveDown(0.5);

        doc.font("Helvetica").fontSize(10)

        // 🔹 Define all the columns you want to include
        const headers = [
            "Campaign",
            "Clicks",
            "Impressions",
            "CTR",
            "Avg CPC",
            "Cost",
            "Conversions",
            "Cost/Conv",
            "Conversion rate"
        ];

        // 🔹 Build table rows starting with header row
        const data = [headers];

        results.forEach(row => {
            const m = row.metrics;

            data.push([
                row.campaign.name,
                formatNumber(m.clicks),
                formatNumber(m.impressions),
                formatPercent(m.ctr),
                formatFt(m.average_cpc / 1_000_000),
                formatFt(m.cost_micros / 1_000_000),
                formatNumber(m.conversions),
                formatFt(m.cost_per_conversion)
                    ? formatFt(m.cost_per_conversion / 1_000_000)
                    : "–",
                formatPercent(m.conversions_from_interactions_rate),
            ]);
        });

        // 🔹 Render the table
        /*formatNumber(m.conversions_value),
            formatNumber(m.all_conversions, 2),
            formatNumber(m.all_conversions_value, 2),
            formatFt(m.cost_per_all_conversions)
                ? formatFt(m.cost_per_all_conversions / 1_000_000)
                : "–",
            formatPercent(m.conversions_from_interactions_rate),
            formatNumber(m.interactions),
            formatFt(m.average_cost / 1_000_000)*/
        doc.table({
            rowStyles: (i) => {
                if(i === 0)  return { backgroundColor: "#3c86ec", textColor: "#fff"};
                if ((i + 2) % 2 === 0) return { backgroundColor: "#d8e6fb" }; // header color: #3c86ec
            },
            data,
            columnStyles: [100, "*", "*", "*", "*", "*", "*", "*", "*", "*"], // first column wider (campaign name)
            defaultStyle: {
                border: [false, false, false, false],
                padding: 5,
                align: { x: "center", y: "center" }
            },
        });

        doc.end();

        stream.on("finish", () => {
            res.download(filePath, fileName, err => {
                if (err) {
                    console.error("❌ Error sending PDF:", err);
                    return res.status(500).json({ error: "Failed to send PDF" });
                }
                fs.unlinkSync(filePath); // Clean up
            });
        });

    } catch (error) {
        console.error("❌ Failed to generate campaign name report:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
});


module.exports = router;

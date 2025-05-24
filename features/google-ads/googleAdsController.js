const BaseController = require('../../utils/BaseController');
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
const rootCustomerId = "5166320402";

const getAllAccounts = (req, res) =>
    BaseController.handleRequest(
        res,
        async () => {
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

            return result.map(row => ({
                id: row.customer_client.client_customer.split("/")[1],
                name: row.customer_client.descriptive_name,
            }));
        },
        { req }
    );

const createReport = async (req, res) => {
            const { customerId, customerName, month } = req.body;

            if (!customerId || !month) {
                return res.status(400).json({ error: "Missing customerId" });
            }

            const customer = client.Customer({
                customer_id: customerId,
                refresh_token: refreshToken,
                login_customer_id: rootCustomerId
            });

            /* istanbul ignore next */
            const buildCampaignQuery = ({ startDate, endDate, includeMonth = false }) => {
                return `
                SELECT
                    campaign.id,
                    campaign.name,
                    metrics.impressions,
                    metrics.clicks,
                    ${includeMonth ? "segments.month," : ""}
                    metrics.ctr,
                    metrics.average_cpc,
                    metrics.cost_micros,
                    metrics.conversions,
                    metrics.cost_per_conversion,
                    metrics.conversions_from_interactions_rate
                FROM campaign
                WHERE
                    segments.date BETWEEN \'${startDate}\' AND \'${endDate}\'
                    AND metrics.impressions > 0
            `;
            };


            try {
                const [year, monthNum] = month.split("-").map(Number);
                const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
                const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0];
                const includeMonth = true;

                const query = buildCampaignQuery({ startDate, endDate, includeMonth });
                const results = await customer.query(query);
                const fileName = `Campaign_report_${customerName}_${customerId}.pdf`;
                const filePath = path.join(__dirname, fileName);

                const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const formatNumber = (value, decimals = 0) =>
                    value?.toLocaleString("hu-HU", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals,
                    });

                //const formatFt = (value, decimal) => `${formatNumber(value, decimal)} Ft`;

                const formatPercent = (value) =>
                    `${formatNumber(value * 100, 2)}%`;


                const monthName = new Date(startDate).toLocaleString("en-US", { month: "long" });

                const logoPath = path.join(__dirname, "../../pdf_logo_en.jpeg");

                doc.image(logoPath, 40, 40, { width: 200 });

                doc.moveDown(5);

                doc
                    .moveDown(0.25)
                    .font("Helvetica-Bold")
                    .fontSize(16)
                    .fillColor("#3c86ec")
                    .text("Monthly Google Ads Campaign Report For " + customerName, { align: "center" })
                    .moveDown(0.5);

                doc
                    .moveDown(0.5)
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .fillColor("#3c86ec")
                    .text(`Summary results for ${monthName}`, { align: "left", textColor: "#3c86ec" })
                    .moveDown(0.5);

                doc.font("Helvetica").fontSize(9)

                const headers = [
                    "Campaign", "Clicks", "Impressions", "CTR", "Avg CPC", "Cost",
                    "Conversions", "CostPerConv", "Conversion rate"
                ];

                const data = [headers];

                results.forEach(row => {
                    const m = row.metrics;

                    data.push([
                        row.campaign.name,
                        formatNumber(m.clicks),
                        formatNumber(m.impressions),
                        formatPercent(m.ctr),
                        formatNumber(Math.round(m.average_cpc / 1_000_000), 1) + "Ft",
                        formatNumber(Math.round(m.cost_micros / 1_000_000), 1) + "Ft",
                        formatNumber(m.conversions),
                        m.conversions
                            ? formatNumber(Math.round(m.cost_per_conversion / 1_000_000), 1) + "Ft"
                            : "–",
                        formatPercent(m.conversions_from_interactions_rate),
                    ]);
                });
                /* istanbul ignore next */
                doc.table({
                    rowStyles: (i) => {
                        if(i === 0)  return { backgroundColor: "#3c86ec", textColor: "#fff"};
                        if ((i + 2) % 2 === 0) return { backgroundColor: "#d8e6fb" };
                    },
                    data,
                    columnStyles: [100, "*", "*", "*", 100, 100, "*", 100, "*"],
                    defaultStyle: {
                        border: [false, false, false, false],
                        padding: 10,
                        align: { x: "center", y: "center" }
                    },
                });

                doc.end();

                stream.on("finish", () => {
                    res.download(filePath, fileName, err => {
                        if (err) {
                            console.error("Error sending PDF:", err);
                            return res.status(500).json({ error: "Failed to send PDF" });
                        }
                        fs.unlinkSync(filePath); // Clean up
                    });
                });

            } catch (error) {
                console.error("Failed to generate campaign name report:", error);
                res.status(500).json({ error: "Failed to generate report" });
            }
        };


module.exports = {
    getAllAccounts,
    createReport
}
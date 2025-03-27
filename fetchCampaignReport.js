require("dotenv").config();
const { GoogleAdsApi } = require("google-ads-api");

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEV_TOKEN,
});

// ✅ listAccessibleCustomers is on the top-level `client`
const main = async () => {
    try {
        const result = await client.listAccessibleCustomers({
            refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        });

        console.log("✅ Accessible Google Ads Customer Accounts:");
        result.resource_names.forEach((resourceName) => {
            const customerId = resourceName.split("/").pop();
            console.log("→", customerId);
        });
    } catch (error) {
        console.error("❌ Error listing customers:", error.message);
    }
};

main();

require("dotenv").config();
const { GoogleAdsApi } = require("google-ads-api");

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEV_TOKEN,
});

const refreshToken = "1/8wHKhBIXtYONznn77e-BJupvXULYNf2ZkQq2BwDAY1w";
const rootCustomerId = "5166320402"; // Your MCC ID

const main = async () => {
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

    try {
        const response = await customer.query(query);

        if (!Array.isArray(response)) {
            throw new Error("Unexpected response format from Google Ads API.");
        }

        console.log(`\n📋 Accounts under MCC ${rootCustomerId}:`);
        response.forEach(row => {
            const acc = row.customer_client;
            console.log(`→ ${acc.descriptive_name} (${acc.client_customer}) [Manager: ${acc.manager}, Level: ${acc.level}]`);
        });

        console.log(`\n✅ Total accounts found: ${response.length}`);
    } catch (err) {
        console.error("❌ Error while querying accounts:");
        console.error(err.message || err);
    }
};

main();

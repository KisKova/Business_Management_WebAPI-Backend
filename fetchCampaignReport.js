require("dotenv").config();
const { GoogleAdsApi } = require("google-ads-api");

const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEV_TOKEN,
});

const refreshToken = "1/8wHKhBIXtYONznn77e-BJupvXULYNf2ZkQq2BwDAY1w";

const main = async () => {
    try {
        const customer = client.Customer({
            customer_id: 5166320402,
            refresh_token: refreshToken,
        });

        const query = "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.level FROM customer_client WHERE customer_client.manager = true";

        const response = await customer.query(query);

        const subMCCs = response.map(row => ({
            id: row.customer_client.client_customer,
            name: row.customer_client.descriptive_name,
            level: row.customer_client.level,
        }));

        console.log("📂 Sub-MCC accounts under");
        subMCCs.forEach(mcc =>
            console.log(`→ ${mcc.name} (${mcc.id}) [level ${mcc.level}]`)
        );

        return subMCCs;
    } catch (error) {
        console.error("❌ FAILED to connect to Google Ads API");
        console.error("→", error.message || error);
    }
};

main();

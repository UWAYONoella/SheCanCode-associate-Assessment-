const express = require("express");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(express.json());

app.use("/", paymentRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
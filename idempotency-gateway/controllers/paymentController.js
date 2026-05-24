const client = require("../store/redisClient");

const EXPIRY_TIME = 10 * 60 * 1000;

// normalize payload
function normalize(obj) {
    return JSON.stringify(
        Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {})
    );
}

// simulate delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.processPayment = async(req, res) => {
    const key = req.headers["idempotency-key"];
    const { amount, currency } = req.body;

    if (!key) {
        return res.status(400).json({
            error: "Idempotency-Key header is required"
        });
    }

    // 🔍 GET FROM REDIS
    const existingData = await client.get(key);
    const existing = existingData ? JSON.parse(existingData) : null;

    // ⏳ EXPIRY CHECK
    if (existing) {
        const isExpired =
            Date.now() - existing.createdAt > EXPIRY_TIME;

        if (isExpired) {
            await client.del(key);
        }
    }

    const refreshedData = await client.get(key);
    const updatedExisting = refreshedData ? JSON.parse(refreshedData) : null;

    // =========================
    // CASE 1: COMPLETED REQUEST
    // =========================
    if (updatedExisting && updatedExisting.status === "completed") {

        if (
            normalize(updatedExisting.payload) !== normalize(req.body)
        ) {
            return res.status(409).json({
                error: "Idempotency key already used for a different request body."
            });
        }

        res.setHeader("X-Cache-Hit", "true");

        return res
            .status(updatedExisting.statusCode)
            .json(updatedExisting.response);
    }

    // =========================
    // CASE 2: IN-FLIGHT (simple blocking simulation)
    // NOTE: Redis cannot store Promises, so we avoid storing them.
    // =========================
    if (updatedExisting && updatedExisting.status === "processing") {

        if (
            normalize(updatedExisting.payload) !== normalize(req.body)
        ) {
            return res.status(409).json({
                error: "Idempotency key already used for a different request body."
            });
        }

        // simple wait until processing finishes
        await sleep(2000);

        const finalData = await client.get(key);
        const parsedFinal = JSON.parse(finalData);

        res.setHeader("X-Cache-Hit", "true");

        return res
            .status(parsedFinal.statusCode)
            .json(parsedFinal.response);
    }

    // =========================
    // CASE 3: NEW REQUEST
    // =========================

    const response = {
        message: `Charged ${amount} ${currency}`
    };

    const dataToStore = {
        status: "processing",
        payload: req.body,
        response,
        statusCode: 201,
        createdAt: Date.now()
    };

    // store "processing"
    await client.set(key, JSON.stringify(dataToStore), {
        EX: 600
    });

    // simulate payment processing delay
    await sleep(2000);

    // final update
    const finalData = {
        status: "completed",
        payload: req.body,
        response,
        statusCode: 201,
        createdAt: Date.now()
    };

    await client.set(key, JSON.stringify(finalData), {
        EX: 600
    });

    return res.status(201).json(response);
};
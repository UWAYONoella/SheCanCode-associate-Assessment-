const crypto = require("crypto");

const SECRET = "supersecretkey"; // in real system → ENV variable

function verifySignature(req, res, next) {
    const signature = req.headers["x-signature"];
    const payload = JSON.stringify(req.body);

    const expected = crypto
        .createHmac("sha256", SECRET)
        .update(payload)
        .digest("hex");

    if (signature !== expected) {
        return res.status(401).json({
            error: "Invalid request signature"
        });
    }

    next();
}

module.exports = verifySignature;
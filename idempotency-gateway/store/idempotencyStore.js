const store = new Map();

/*
Structure:
key => {
  status: "processing" | "completed",
  response: {...},
  payload: {...},
  promise: Promise (for in-flight handling)
}
*/
{
    status,
    payload,
    response,
    statusCode,
    createdAt
}

store.set(key, {
    status: "completed",
    payload: req.body,
    response,
    statusCode: 201,
    createdAt: Date.now()
});

module.exports = store;
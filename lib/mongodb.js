const mongoose = require("mongoose");

function getCache() {
  if (!global._mongooseCache) {
    global._mongooseCache = {
      conn: null,
      promise: null,
      didLogConnected: false,
    };
  }
  return global._mongooseCache;
}

/**
 * Una sola conexión Mongoose entre recargas (Next.js dev).
 * @returns {Promise<typeof mongoose>}
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || typeof uri !== "string" || uri.trim() === "") {
    throw new Error(
      "MONGODB_URI no está definida. Configúrala en .env o .env.local."
    );
  }

  const cache = getCache();

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;

    if (!cache.didLogConnected) {
      cache.didLogConnected = true;
      console.log("MongoDB conectado");
    }

    return cache.conn;
  } catch (err) {
    cache.promise = null;
    cache.conn = null;
    throw err;
  }
}

module.exports = { connectDB };

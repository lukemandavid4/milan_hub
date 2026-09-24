import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { MongoClient, ObjectId } from "mongodb";

const port = Number(process.env.PORT || 8787);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const databaseName = process.env.MONGODB_DB || "milan_hub";
const client = new MongoClient(mongoUri);

const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
]);

const json = (response, status, body) => {
  const origin = response.req?.headers?.origin;
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": allowedOrigins.has(origin)
      ? origin
      : process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    vary: "Origin",
    "access-control-allow-headers": "content-type, x-user-id",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  response.end(JSON.stringify(body));
};

const readBody = async (request) => {
  let value = "";
  for await (const chunk of request) value += chunk;
  return value ? JSON.parse(value) : {};
};

const id = (value) => {
  if (!value) return undefined;
  return ObjectId.isValid(value) ? new ObjectId(value) : value;
};

const documentFilter = (value) => ({ $or: [{ _id: id(value) }, { id: value }] });

const passwordHash = (password) => createHash("sha256").update(password).digest("hex");

async function start() {
  await client.connect();
  const db = client.db(databaseName);
  const users = db.collection("users");
  const products = db.collection("products");
  const services = db.collection("services");
  const sales = db.collection("sales");
  const history = db.collection("history");
  const accessRequests = db.collection("access_requests");
  await users.createIndex({ email: 1 }, { unique: true });
  await accessRequests.createIndex({ status: 1, createdAt: -1 });

  const server = createServer(async (request, response) => {
    if (request.method === "OPTIONS") return json(response, 204, {});
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const path = url.pathname;
    try {
      if (request.method === "GET" && path === "/api/health")
        return json(response, 200, { ok: true });
      if (request.method === "GET" && path === "/api/state") {
        const [productRows, serviceRows, saleRows, historyRows] = await Promise.all([
          products.find({}).sort({ createdAt: -1 }).toArray(),
          services.find({}).sort({ createdAt: -1 }).toArray(),
          sales.find({}).sort({ soldAt: -1 }).toArray(),
          history.find({}).sort({ at: -1 }).toArray(),
        ]);
        return json(response, 200, {
          products: productRows.map(({ _id, ...product }) => ({ ...product, id: String(_id) })),
          services: serviceRows.map(({ _id, ...service }) => ({ ...service, id: String(_id) })),
          sales: saleRows.map(({ _id, ...sale }) => ({ ...sale, id: String(_id) })),
          history: historyRows.map(({ _id, ...entry }) => ({ ...entry, id: String(_id) })),
        });
      }

      if (request.method === "POST" && path === "/api/auth/request-access") {
        const body = await readBody(request);
        const email = String(body.email || "")
          .trim()
          .toLowerCase();
        if (!email || !body.password || body.password !== body.confirmPassword)
          return json(response, 400, { error: "Valid matching credentials are required" });
        const existing = await users.findOne({ email });
        if (existing)
          return json(response, 409, { error: "An account already exists for this email" });
        await accessRequests.updateOne(
          { email, status: "pending" },
          {
            $set: {
              email,
              role: body.role || "Seller",
              passwordHash: passwordHash(body.password),
              status: "pending",
              createdAt: new Date(),
            },
          },
          { upsert: true },
        );
        return json(response, 201, { ok: true });
      }

      if (request.method === "POST" && path === "/api/auth/login") {
        const body = await readBody(request);
        const user = await users.findOne({
          email: String(body.email || "")
            .trim()
            .toLowerCase(),
          passwordHash: passwordHash(String(body.password || "")),
          status: "active",
        });
        if (!user)
          return json(response, 401, { error: "Invalid credentials or account not approved" });
        return json(response, 200, {
          user: { id: String(user._id), email: user.email, role: user.role },
        });
      }

      if (request.method === "GET" && path === "/api/access-requests")
        return json(response, 200, {
          requests: await accessRequests
            .find({ status: "pending" })
            .sort({ createdAt: -1 })
            .toArray(),
        });
      if (request.method === "PATCH" && path.startsWith("/api/access-requests/")) {
        const requestId = id(path.split("/").pop());
        const body = await readBody(request);
        const access = await accessRequests.findOne({ _id: requestId });
        if (!access || !["approved", "rejected"].includes(body.status))
          return json(response, 400, { error: "Invalid access request" });
        await accessRequests.updateOne(
          { _id: requestId },
          { $set: { status: body.status, reviewedAt: new Date() } },
        );
        if (body.status === "approved")
          await users.updateOne(
            { email: access.email },
            {
              $set: {
                email: access.email,
                passwordHash: access.passwordHash,
                role: access.role,
                status: "active",
                createdAt: new Date(),
              },
            },
            { upsert: true },
          );
        return json(response, 200, { ok: true });
      }

      if (request.method === "GET" && path === "/api/products")
        return json(response, 200, {
          products: await products.find({}).sort({ createdAt: -1 }).toArray(),
        });
      if (request.method === "POST" && path === "/api/products") {
        const body = await readBody(request);
        const product = {
          ...body,
          quantity: Number(body.quantity || 0),
          price: Number(body.price || 0),
          threshold: Number(body.threshold ?? 3),
          sku: body.sku || `MH-${randomUUID().slice(0, 6).toUpperCase()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await products.insertOne(product);
        return json(response, 201, { product: { ...product, id: String(result.insertedId) } });
      }
      if (request.method === "PATCH" && path.startsWith("/api/products/")) {
        const productId = id(path.split("/").pop());
        const body = await readBody(request);
        await products.updateOne(documentFilter(path.split("/").pop()), {
          $set: { ...body, updatedAt: new Date() },
        });
        return json(response, 200, { ok: true });
      }
      if (request.method === "DELETE" && path.startsWith("/api/products/")) {
        await products.deleteOne(documentFilter(path.split("/").pop()));
        return json(response, 200, { ok: true });
      }

      if (request.method === "GET" && path === "/api/services")
        return json(response, 200, {
          services: await services.find({}).sort({ createdAt: -1 }).toArray(),
        });
      if (request.method === "POST" && path === "/api/services") {
        const body = await readBody(request);
        const service = { ...body, price: Number(body.price || 0), createdAt: new Date() };
        const result = await services.insertOne(service);
        return json(response, 201, { service: { ...service, id: String(result.insertedId) } });
      }

      if (request.method === "GET" && path === "/api/sales")
        return json(response, 200, { sales: await sales.find({}).sort({ soldAt: -1 }).toArray() });
      if (request.method === "POST" && path === "/api/sales/checkout") {
        const body = await readBody(request);
        const items = Array.isArray(body.items) ? body.items : [];
        if (!items.length) return json(response, 400, { error: "At least one sale is required" });
        const soldAt = new Date();
        for (const item of items) {
          if (item.kind === "product") {
            const productId = id(item.productId);
            const product = await products.findOne(documentFilter(item.productId));
            if (!product || product.quantity < Number(item.qty))
              return json(response, 409, { error: `Insufficient stock for ${item.name}` });
            const after = product.quantity - Number(item.qty);
            await products.updateOne(
              { _id: productId },
              { $set: { quantity: after, updatedAt: soldAt } },
            );
            await history.insertOne({
              kind: "product",
              name: product.name,
              action: "Sold",
              qty: Number(item.qty),
              before: product.quantity,
              after,
              amount: Number(item.price) * Number(item.qty),
              note: item.payment,
              at: soldAt,
            });
          } else {
            await history.insertOne({
              kind: "service",
              name: item.name,
              action: "Service",
              qty: Number(item.qty),
              before: 0,
              after: 0,
              amount: Number(item.price) * Number(item.qty),
              note: item.payment,
              at: soldAt,
            });
          }
          await sales.insertOne({ ...item, soldAt });
        }
        return json(response, 201, { ok: true });
      }
      if (request.method === "GET" && path === "/api/history")
        return json(response, 200, { history: await history.find({}).sort({ at: -1 }).toArray() });
      return json(response, 404, { error: "Not found" });
    } catch (error) {
      console.error(error);
      return json(response, 500, { error: "Internal server error" });
    }
  });

  server.listen(port, () => console.log(`Milan Hub API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error("Unable to start MongoDB API", error);
  process.exit(1);
});

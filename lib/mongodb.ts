import { MongoClient, ServerApiVersion } from "mongodb"

const uri = process.env.MONGODB_URI || ""
const dbName = process.env.MONGODB_DB || ""

if (!uri) {
  console.warn("MONGODB_URI is not set. API routes depending on MongoDB will fail.")
}

if (!dbName) {
  console.warn("MONGODB_DB is not set. API routes depending on MongoDB will fail.")
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise!

export async function getDb() {
  const cli = await clientPromise
  return cli.db(dbName)
}

export type CouponDoc = {
  _id?: any
  code: string
  isUsed: boolean
  addedAt: Date
  usedAt?: Date
  orderId?: string
}

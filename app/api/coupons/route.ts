import { NextResponse } from "next/server"
import { getDb, type CouponDoc } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    const docs = await col.find({}, { projection: { } }).sort({ addedAt: -1 }).toArray()
    const items = docs.map((d) => ({
      id: d._id?.toString(),
      code: d.code,
      isUsed: d.isUsed,
      addedAt: d.addedAt,
      usedAt: d.usedAt,
      orderId: d.orderId,
    }))
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to list coupons" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const codes: string[] = Array.isArray(body?.codes) ? body.codes : []
    if (!codes.length) {
      return NextResponse.json({ error: "codes[] required" }, { status: 400 })
    }

    const now = new Date()
    const docs: CouponDoc[] = codes.map((code) => ({ code: String(code).trim(), isUsed: false, addedAt: now }))

    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    await col.createIndex({ code: 1 }, { unique: true })

    const res = await col.insertMany(docs, { ordered: false })
    const inserted = await col
      .find({ _id: { $in: Object.values(res.insertedIds) } })
      .sort({ addedAt: -1 })
      .toArray()

    const items = inserted.map((d) => ({
      id: d._id?.toString(),
      code: d.code,
      isUsed: d.isUsed,
      addedAt: d.addedAt,
      usedAt: d.usedAt,
      orderId: d.orderId,
    }))
    return NextResponse.json(items, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to add coupons" }, { status: 500 })
  }
}

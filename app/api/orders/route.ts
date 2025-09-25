import { NextResponse } from "next/server"
import { getDb, type OrderDoc } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const col = db.collection<OrderDoc>("orders")
    const items = await col.find({}).sort({ timestamp: -1 }).toArray()
    return NextResponse.json(items.map((o) => ({ ...o, id: o._id?.toString() })))
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to list orders" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const newOrder: OrderDoc = {
      fullName: String(body.fullName || ""),
      email: String(body.email || ""),
      utrNumber: String(body.utrNumber || ""),
      quantity: Number(body.quantity || 0),
      totalAmount: Number(body.totalAmount || 0),
      couponCodes: Array.isArray(body.couponCodes) ? body.couponCodes : [],
      paymentProof: body.paymentProof ? String(body.paymentProof) : undefined,
      timestamp: new Date(),
      paymentVerified: false,
      status: "pending",
    }
    const db = await getDb()
    const col = db.collection<OrderDoc>("orders")
    const res = await col.insertOne(newOrder)
    const inserted = await col.findOne({ _id: res.insertedId })
    return NextResponse.json({ ...inserted, id: inserted?._id?.toString() }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create order" }, { status: 500 })
  }
}


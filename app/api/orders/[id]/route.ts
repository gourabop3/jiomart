import { NextResponse } from "next/server"
import { getDb, type OrderDoc } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const col = db.collection<OrderDoc>("orders")
    const doc = await col.findOne({ _id: new ObjectId(params.id) })
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ...doc, id: doc._id?.toString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch order" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const allowed: Partial<OrderDoc> = {}
    if (typeof body.status === "string") allowed.status = body.status
    if (typeof body.paymentVerified === "boolean") allowed.paymentVerified = body.paymentVerified
    if (Array.isArray(body.couponCodes)) allowed.couponCodes = body.couponCodes

    const db = await getDb()
    const col = db.collection<OrderDoc>("orders")
    const res = await col.findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: allowed },
      { returnDocument: "after" }
    )
    if (!res.value) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ...res.value, id: res.value._id?.toString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update order" }, { status: 500 })
  }
}


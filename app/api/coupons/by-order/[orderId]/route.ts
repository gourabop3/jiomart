import { NextResponse } from "next/server"
import { getDb, type CouponDoc } from "@/lib/mongodb"

export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  try {
    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    const docs = await col.find({ orderId: params.orderId }).project({ code: 1 }).toArray()
    const codes = docs.map((d) => d.code)
    return NextResponse.json({ codes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch coupons by order" }, { status: 500 })
  }
}


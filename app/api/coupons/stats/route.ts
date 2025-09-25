import { NextResponse } from "next/server"
import { getDb, type CouponDoc } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    const total = await col.countDocuments({})
    const used = await col.countDocuments({ isUsed: true })
    const available = await col.countDocuments({ isUsed: false })
    return NextResponse.json({ total, available, used })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to get stats" }, { status: 500 })
  }
}

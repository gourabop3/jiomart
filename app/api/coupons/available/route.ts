import { NextResponse } from "next/server"
import { getDb, type CouponDoc } from "@/lib/mongodb"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const count = Math.max(0, Math.min(200, Number(url.searchParams.get("count")) || 0))
    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    const docs = await col
      .find({ isUsed: false })
      .sort({ addedAt: -1 })
      .limit(count)
      .project({ code: 1 })
      .toArray()
    const codes = docs.map((d: any) => d.code)
    return NextResponse.json({ codes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to get available coupons" }, { status: 500 })
  }
}

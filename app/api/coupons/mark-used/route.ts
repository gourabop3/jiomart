import { NextResponse } from "next/server"
import { getDb, type CouponDoc } from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const codes: string[] = Array.isArray(body?.codes) ? body.codes : []
    const orderId: string | undefined = body?.orderId ? String(body.orderId) : undefined
    if (!codes.length) {
      return NextResponse.json({ error: "codes[] required" }, { status: 400 })
    }

    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    const res = await col.updateMany(
      { code: { $in: codes }, isUsed: false },
      { $set: { isUsed: true, orderId, usedAt: new Date() } }
    )

    return NextResponse.json({ matched: res.matchedCount, updated: res.modifiedCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to mark used" }, { status: 500 })
  }
}

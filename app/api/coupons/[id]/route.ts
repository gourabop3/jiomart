import { NextResponse } from "next/server"
import { getDb, type CouponDoc } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const db = await getDb()
    const col = db.collection<CouponDoc>("coupons")
    const res = await col.deleteOne({ _id: new ObjectId(id), isUsed: false } as any)
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Not found or already used" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete coupon" }, { status: 500 })
  }
}

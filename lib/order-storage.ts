export interface Order {
  id: string
  fullName: string
  email: string
  utrNumber: string
  quantity: number
  totalAmount: number
  couponCodes: string[]
  paymentProof?: string
  timestamp: Date
  paymentVerified: boolean
  status: "pending" | "verified" | "rejected"
}

export interface CouponInventory {
  id: string
  code: string
  isUsed: boolean
  addedAt: Date
  usedAt?: Date
  orderId?: string
}

export class OrderStorage {
  private static STORAGE_KEY = "jio_mart_orders"

  static saveOrder(order: Omit<Order, "id" | "timestamp" | "paymentVerified" | "status">): Order {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      timestamp: new Date(),
      paymentVerified: false,
      status: "pending",
    }

    const orders = this.getAllOrders()
    orders.push(newOrder)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders))
    return newOrder
  }

  static getAllOrders(): Order[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []

    try {
      const orders = JSON.parse(stored)
      return orders.map((order: any) => ({
        ...order,
        timestamp: new Date(order.timestamp),
      }))
    } catch {
      return []
    }
  }

  static updateOrderStatus(orderId: string, status: Order["status"], paymentVerified = false): void {
    const orders = this.getAllOrders()
    const orderIndex = orders.findIndex((order) => order.id === orderId)

    if (orderIndex !== -1) {
      orders[orderIndex].status = status
      orders[orderIndex].paymentVerified = paymentVerified
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders))
    }
  }

  static getOrderStats() {
    const orders = this.getAllOrders()
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      verified: orders.filter((o) => o.status === "verified").length,
      rejected: orders.filter((o) => o.status === "rejected").length,
      totalRevenue: orders.filter((o) => o.paymentVerified).reduce((sum, o) => sum + o.totalAmount, 0),
      totalCoupons: orders.reduce((sum, o) => sum + o.quantity, 0),
    }
  }
}

export class CouponStorage {
  private static STORAGE_KEY = "jio_mart_coupons"

  static addCoupons(codes: string[]): void {
    const existingCoupons = this.getAllCoupons()
    const newCoupons: CouponInventory[] = codes.map((code) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      code: code.trim(),
      isUsed: false,
      addedAt: new Date(),
    }))

    const allCoupons = [...existingCoupons, ...newCoupons]
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allCoupons))
  }

  static getAllCoupons(): CouponInventory[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []

    try {
      const coupons = JSON.parse(stored)
      return coupons.map((coupon: any) => ({
        ...coupon,
        addedAt: new Date(coupon.addedAt),
        usedAt: coupon.usedAt ? new Date(coupon.usedAt) : undefined,
      }))
    } catch {
      return []
    }
  }

  static getAvailableCoupons(quantity: number): string[] {
    const coupons = this.getAllCoupons()
    const available = coupons.filter((c) => !c.isUsed).slice(0, quantity)
    return available.map((c) => c.code)
  }

  static markCouponsAsUsed(codes: string[], orderId: string): void {
    const coupons = this.getAllCoupons()
    const updatedCoupons = coupons.map((coupon) => {
      if (codes.includes(coupon.code) && !coupon.isUsed) {
        return {
          ...coupon,
          isUsed: true,
          usedAt: new Date(),
          orderId,
        }
      }
      return coupon
    })
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedCoupons))
  }

  static getCouponStats() {
    const coupons = this.getAllCoupons()
    return {
      total: coupons.length,
      available: coupons.filter((c) => !c.isUsed).length,
      used: coupons.filter((c) => c.isUsed).length,
    }
  }

  static deleteCoupon(couponId: string): void {
    const coupons = this.getAllCoupons()
    const filteredCoupons = coupons.filter((c) => c.id !== couponId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCoupons))
  }
}

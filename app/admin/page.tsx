"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminAuth } from "@/lib/admin-auth"
import { OrderStorage, CouponStorage, type Order, type CouponInventory } from "@/lib/order-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState<"orders" | "coupons">("orders")
  const [coupons, setCoupons] = useState<CouponInventory[]>([])
  const [newCoupons, setNewCoupons] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    totalRevenue: 0,
    totalCoupons: 0,
  })
  const [couponStats, setCouponStats] = useState({
    total: 0,
    available: 0,
    used: 0,
  })

  useEffect(() => {
    setIsAuthenticated(AdminAuth.isAuthenticated())
    if (AdminAuth.isAuthenticated()) {
      loadData()
    }
  }, [])

  const loadData = () => {
    const allOrders = OrderStorage.getAllOrders()
    const orderStats = OrderStorage.getOrderStats()
    const allCoupons = CouponStorage.getAllCoupons()
    const couponStatistics = CouponStorage.getCouponStats()

    setOrders(allOrders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
    setStats(orderStats)
    setCoupons(allCoupons.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime()))
    setCouponStats(couponStatistics)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (AdminAuth.login(loginData.username, loginData.password)) {
      setIsAuthenticated(true)
      setLoginError("")
      loadData()
    } else {
      setLoginError("Invalid credentials")
    }
  }

  const handleLogout = () => {
    AdminAuth.logout()
    setIsAuthenticated(false)
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
  }

  const closeOrderDetails = () => {
    setSelectedOrder(null)
  }

  const verifyPayment = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      CouponStorage.markCouponsAsUsed(order.couponCodes, orderId)
    }
    OrderStorage.updateOrderStatus(orderId, "verified", true)
    loadData()
    if (selectedOrder && selectedOrder.id === orderId) {
      const updatedOrder = OrderStorage.getAllOrders().find((o) => o.id === orderId)
      if (updatedOrder) setSelectedOrder(updatedOrder)
    }
  }

  const rejectPayment = (orderId: string) => {
    OrderStorage.updateOrderStatus(orderId, "rejected", false)
    loadData()
    if (selectedOrder && selectedOrder.id === orderId) {
      const updatedOrder = OrderStorage.getAllOrders().find((o) => o.id === orderId)
      if (updatedOrder) setSelectedOrder(updatedOrder)
    }
  }

  const handleAddCoupons = () => {
    if (!newCoupons.trim()) return

    const couponCodes = newCoupons
      .split("\n")
      .map((code) => code.trim())
      .filter((code) => code.length > 0)

    if (couponCodes.length > 0) {
      CouponStorage.addCoupons(couponCodes)
      setNewCoupons("")
      loadData()
    }
  }

  const deleteCoupon = (couponId: string) => {
    CouponStorage.deleteCoupon(couponId)
    loadData()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <p className="text-gray-600">Access the admin dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="text"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="h-12"
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="h-12"
              />
              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
              <Button type="submit" className="w-full h-12">
                Login
              </Button>
            </form>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Demo Credentials:</strong>
                <br />
                Username: admin
                <br />
                Password: gourabxellipse
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Order Details</h1>
            <Button onClick={closeOrderDetails} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Order ID</label>
                  <p className="font-mono text-sm">#{selectedOrder.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p>{selectedOrder.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p>{selectedOrder.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">UTR Number</label>
                  <p className="font-mono text-sm">{selectedOrder.utrNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Order Date</label>
                  <p>
                    {selectedOrder.timestamp.toLocaleDateString()} at {selectedOrder.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-2xl font-bold">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Amount</label>
                  <p className="text-2xl font-bold text-green-600">₹{selectedOrder.totalAmount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.status === "verified"
                        ? "bg-green-100 text-green-800"
                        : selectedOrder.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.paymentProof && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Proof</label>
                    <p className="text-sm text-blue-600">{selectedOrder.paymentProof}</p>
                  </div>
                )}

                {selectedOrder.status === "pending" && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => verifyPayment(selectedOrder.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Verify Payment
                    </Button>
                    <Button onClick={() => rejectPayment(selectedOrder.id)} variant="destructive" className="flex-1">
                      Reject Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Generated Coupon Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {selectedOrder.couponCodes.map((coupon, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="font-mono text-lg font-bold text-blue-800">{coupon}</div>
                    <p className="text-sm text-blue-600 mt-1">₹50 off - JIO Mart</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={() => setActiveTab("orders")} variant={activeTab === "orders" ? "default" : "outline"}>
            Orders Management
          </Button>
          <Button onClick={() => setActiveTab("coupons")} variant={activeTab === "coupons" ? "default" : "outline"}>
            Coupon Management
          </Button>
        </div>

        {activeTab === "orders" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Verified Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₹{stats.totalRevenue}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <Button onClick={loadData} variant="outline" size="sm">
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No orders found. Orders will appear here when customers make purchases.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Order ID</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">UTR Number</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Quantity</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-xs">#{order.id}</td>
                            <td className="p-2">{order.fullName}</td>
                            <td className="p-2">{order.email}</td>
                            <td className="p-2 font-mono text-xs">{order.utrNumber}</td>
                            <td className="p-2 font-semibold">₹{order.totalAmount}</td>
                            <td className="p-2">{order.quantity}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === "verified"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="p-2 text-xs text-gray-500">
                              {order.timestamp.toLocaleDateString()} {order.timestamp.toLocaleTimeString()}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button onClick={() => viewOrderDetails(order)} variant="outline" size="sm">
                                  View
                                </Button>
                                {order.status === "pending" && (
                                  <>
                                    <Button
                                      onClick={() => verifyPayment(order.id)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-xs px-2"
                                    >
                                      ✓
                                    </Button>
                                    <Button
                                      onClick={() => rejectPayment(order.id)}
                                      variant="destructive"
                                      size="sm"
                                      className="text-xs px-2"
                                    >
                                      ✗
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "coupons" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{couponStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Available Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{couponStats.available}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Used Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{couponStats.used}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Coupons</CardTitle>
                  <p className="text-sm text-gray-600">Enter coupon codes (one per line)</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter coupon codes here, one per line:&#10;JIOMART51&#10;DISCOUNT51&#10;SAVE51"
                    value={newCoupons}
                    onChange={(e) => setNewCoupons(e.target.value)}
                    rows={6}
                    className="font-mono"
                  />
                  <Button onClick={handleAddCoupons} className="w-full">
                    Add Coupons
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coupon Inventory</CardTitle>
                  <Button onClick={loadData} variant="outline" size="sm">
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {coupons.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No coupons added yet. Add some coupons to get started.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {coupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            coupon.isUsed ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold">{coupon.code}</div>
                            <div className="text-xs text-gray-500">
                              Added: {coupon.addedAt.toLocaleDateString()}
                              {coupon.isUsed && coupon.usedAt && (
                                <span> • Used: {coupon.usedAt.toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                coupon.isUsed ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {coupon.isUsed ? "Used" : "Available"}
                            </span>
                            {!coupon.isUsed && (
                              <Button
                                onClick={() => deleteCoupon(coupon.id)}
                                variant="destructive"
                                size="sm"
                                className="text-xs px-2"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

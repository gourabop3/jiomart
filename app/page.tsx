"use client"

import type React from "react"
import { OrderStorage, CouponStorage } from "@/lib/order-storage"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function JioMartCoupon() {
  const [quantity, setQuantity] = useState("")
  const perCodePrice = 24
  const minQuantity = 10
  const [totalAmount, setTotalAmount] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [showPending, setShowPending] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [generatedCoupons, setGeneratedCoupons] = useState<string[]>([])
  const [paymentData, setPaymentData] = useState({
    fullName: "",
    email: "",
    utrNumber: "",
    paymentProof: null as File | null,
  })
  const [availableStock, setAvailableStock] = useState(0)
  const [stockError, setStockError] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrderId && showPending) {
      const checkOrderStatus = () => {
        const orders = OrderStorage.getAllOrders()
        const order = orders.find((o) => o.id === currentOrderId)

        if (order?.status === "verified" && order.paymentVerified) {
          setGeneratedCoupons(order.couponCodes)
          setShowPending(false)
          setShowCoupons(true)
        } else if (order?.status === "rejected") {
          alert("Your payment was rejected. Please contact support or try again with correct payment details.")
          handleStartOver()
        }
      }

      const interval = setInterval(checkOrderStatus, 3000) // Check every 3 seconds
      return () => clearInterval(interval)
    }
  }, [currentOrderId, showPending])

  useEffect(() => {
    const updateStock = async () => {
      try {
        const r = await fetch("/api/coupons/stats", { cache: "no-store" })
        const s = await r.json()
        setAvailableStock(s.available || 0)
        setStockError(null)
      } catch {
        setStockError("Stock unavailable")
      }
    }
    updateStock()
    const interval = setInterval(updateStock, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleQuantityChange = (value: string) => {
    setQuantity(value)
    const qty = Number.parseInt(value) || 0
    const total = qty * perCodePrice
    setTotalAmount(total)
  }

  const handleBuyNow = () => {
    setShowPayment(true)
  }

  const handlePayment = () => {
    if (paymentData.utrNumber.length >= 12) {
      const qty = Number.parseInt(quantity) || 0
      if (qty < minQuantity) {
        alert(`Minimum order quantity is ${minQuantity}`)
        return
      }

      const availableCoupons = CouponStorage.getAvailableCoupons(qty)

      if (availableCoupons.length < qty) {
        alert(`Sorry, only ${availableCoupons.length} coupons are available. Please contact admin to add more coupons.`)
        return
      }

      const savedOrder = OrderStorage.saveOrder({
        fullName: paymentData.fullName,
        email: paymentData.email,
        utrNumber: paymentData.utrNumber,
        quantity: qty,
        totalAmount: totalAmount,
        couponCodes: availableCoupons,
        paymentProof: paymentData.paymentProof?.name,
      })

      setCurrentOrderId(savedOrder.id)
      setShowPayment(false)
      setShowPending(true)
    }
  }

  const handleStartOver = () => {
    setShowPayment(false)
    setShowCoupons(false)
    setShowPending(false)
    setCurrentOrderId("")
    setQuantity("")
    setTotalAmount(0)
    setGeneratedCoupons([])
    setPaymentData({
      fullName: "",
      email: "",
      utrNumber: "",
      paymentProof: null,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPaymentData({ ...paymentData, paymentProof: file })
  }

  if (showPending) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-orange-600">Payment Under Verification</CardTitle>
              <p className="text-gray-600 mt-2">Please wait while we verify your payment</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Verifying Payment...</h3>
                  <p className="text-orange-700">Order ID: {currentOrderId}</p>
                  <p className="text-orange-700">UTR: {paymentData.utrNumber}</p>
                  <p className="text-orange-700">Amount: ₹{totalAmount}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Our admin will verify your payment within 1 hour</li>
                  <li>• You'll receive your coupons once payment is confirmed</li>
                  <li>• Coupons will be sent to: {paymentData.email}</li>
                  <li>• Keep this page open to see real-time updates</li>
                </ul>
              </div>

              <div className="text-center">
                <Button onClick={handleStartOver} variant="outline" className="w-full bg-transparent">
                  Cancel Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showCoupons) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">Payment Verified!</CardTitle>
              <p className="text-gray-600 mt-2">Your JIO Mart coupons are ready</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Order Summary</h3>
                  <p className="text-green-700">Coupon Type:101 pe 100 off - ₹24</p>
                  <p className="text-green-700">Quantity: {quantity}</p>
                  <p className="text-green-700">Total Paid: ₹{totalAmount}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">
                  Your Coupon Code{generatedCoupons.length > 1 ? "s" : ""}
                </h3>
                <div className="text-center text-sm text-gray-600 mb-4">
                  {generatedCoupons.length === 1
                    ? "You purchased 1 coupon code:"
                    : `You purchased ${generatedCoupons.length} coupon codes:`}
                </div>
                <div className="grid gap-3">
                  {generatedCoupons.map((coupon, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 text-center relative"
                    >
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        #{index + 1}
                      </div>
                      <div className="font-mono text-xl font-bold text-blue-800 mb-2">{coupon}</div>
                      <p className="text-sm text-blue-600">₹100 off - Valid for JIO Mart purchases</p>
                      <div className="mt-2 text-xs text-gray-500">Tap to copy code</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    📧 Coupons have been sent to your email: {paymentData.email}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">Save these codes for future use</p>
                </div>
                <Button onClick={handleStartOver} className="w-full bg-green-600 hover:bg-green-700">
                  Buy More Coupons
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
                  <img src="/images/upi-qr-code.png" alt="UPI Payment QR Code" className="w-48 h-48 mx-auto" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    <span className="font-semibold">Basic Package I</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="font-semibold">Total Amount: ₹{totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Enter Full Name"
                  value={paymentData.fullName}
                  onChange={(e) => setPaymentData({ ...paymentData, fullName: e.target.value })}
                  className="h-12 bg-white"
                />

                <Input
                  type="email"
                  placeholder="Enter Email Address"
                  value={paymentData.email}
                  onChange={(e) => setPaymentData({ ...paymentData, email: e.target.value })}
                  className="h-12 bg-white"
                />

                <Input
                  placeholder="Enter UTR Number"
                  value={paymentData.utrNumber}
                  onChange={(e) => setPaymentData({ ...paymentData, utrNumber: e.target.value })}
                  className="h-12 bg-white"
                />

                <div className="relative">
                  <input
                    type="file"
                    id="paymentProof"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="h-12 bg-white border border-gray-300 rounded-md flex items-center justify-between px-3 cursor-pointer">
                    <span className="text-blue-500">Choose File</span>
                    <span className="text-gray-500">
                      {paymentData.paymentProof ? paymentData.paymentProof.name : "no file selected"}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!paymentData.fullName || !paymentData.email || !paymentData.utrNumber}
                className="w-full h-12 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <span className="text-xl">🚀</span>
                Submit Your Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-card-foreground">JIO MART COUPON</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="h-12 bg-white border border-gray-300 rounded-md flex items-center px-3">
                  <span className="font-semibold text-gray-800">101 pe 100 off - ₹24</span>
                </div>
                <p className="text-sm text-gray-600">Get ₹100 off with coupon codes ending in 101</p>
                <p className="text-sm text-gray-600">
                  {stockError ? stockError : `Stock Available: ${availableStock}`}
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Enter Quantity"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  min={minQuantity}
                  className="h-12"
                />
              </div>

              <Button
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={!quantity || (Number(quantity) < minQuantity) || (!!availableStock && Number(quantity) > availableStock) || !!stockError}
                onClick={handleBuyNow}
              >
                {Number(quantity) > 0 && Number(quantity) < minQuantity
                  ? `Minimum ${minQuantity}`
                  : availableStock && Number(quantity) > availableStock
                    ? `Only ${availableStock} in stock`
                    : "BUY NOW"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-semibold text-muted-foreground">Your Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-card-foreground">Quantity</span>
                  <span className="text-2xl font-bold">{quantity || "0"}</span>
                </div>
                <div className="border-b border-dotted border-border"></div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-card-foreground">Per Code Price</span>
                  <span className="text-2xl font-bold">₹{perCodePrice}</span>
                </div>
                <div className="border-b border-dotted border-border"></div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-card-foreground">Total Amount</span>
                  <span className="text-2xl font-bold">₹{totalAmount}</span>
                </div>
                <div className="border-b border-dotted border-border"></div>
              </div>

              <Button
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={totalAmount === 0 || (Number(quantity) < minQuantity)}
                onClick={handleBuyNow}
              >
                PAY NOW
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-card-foreground">Important Information</h2>
            <div className="space-y-4 text-card-foreground">
              <p className="text-lg">
                <span className="font-semibold">1.</span> Minimum order quantity is 10 coupon codes. Orders below this
                limit are not accepted.
              </p>
              <p className="text-lg">
                <span className="font-semibold">2.</span> Delivery to your email typically within 1 hour after payment
                verification. Please ensure your email is correct.
              </p>
              <p className="text-lg">
                <span className="font-semibold">3.</span> Coupon validity and acceptance depend on JioMart policy.
                Offers may change or end without notice.
              </p>
              <p className="text-lg">
                <span className="font-semibold">4.</span> Stock is limited. If requested quantity exceeds available
                stock, adjust your order accordingly.
              </p>
              <p className="text-lg">
                <span className="font-semibold">5.</span> All sales are final. No refund or replacement once coupon
                codes are delivered and marked used.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

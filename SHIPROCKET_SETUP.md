# 🚚 Shiprocket Integration — Production Setup Guide

## Overview
This e-commerce platform uses **Shiprocket** for automated shipping and courier management. When an admin clicks "Ship via Shiprocket", the system:

1. ✅ Creates the order on Shiprocket
2. ✅ Auto-assigns the best courier (based on price, speed, serviceability)
3. ✅ Generates AWB (tracking number)
4. ✅ **Schedules pickup** — delivery boy will come to your shop/warehouse to collect the parcel
5. ✅ Updates order status to "Shipped" with tracking info
6. ✅ Customer can track the shipment in their order history

---

## 🔧 Setup Steps (MUST DO BEFORE GOING LIVE)

### 1. Create Shiprocket Account
- Go to: https://app.shiprocket.in/register
- Sign up for a **free account** (no credit card needed for testing)
- Verify your email and complete KYC (business documents)

### 2. Configure Pickup Address in Shiprocket Dashboard
**This is CRITICAL — without this, pickup will fail!**

1. Login to Shiprocket Dashboard
2. Go to: **Settings → Manage Pickup Addresses**
3. Click **"Add Pickup Address"**
4. Fill in your shop/warehouse details:
   - **Pickup Location Name**: `Primary` (or any name you want)
   - **Contact Person**: Your name
   - **Phone**: Your business phone
   - **Complete Address**: Your shop address with pincode
   - **City, State, Pincode**: Must be accurate
5. Click **Save**
6. **IMPORTANT**: Copy the exact "Pickup Location Name" you entered (e.g., "Primary")

### 3. Update `.env` File
Open `backend/.env` and update these lines:

```env
# Shiprocket Credentials
SHIPROCKET_EMAIL=your_actual_shiprocket_email@example.com
SHIPROCKET_PASSWORD=your_actual_shiprocket_password

# Must match EXACTLY the pickup location name from Step 2
SHIPROCKET_PICKUP_LOCATION=Primary
```

**⚠️ Common Mistakes:**
- Using wrong email/password → Authentication fails
- Pickup location name doesn't match dashboard → "Pickup address not found" error
- Not completing KYC → Orders get rejected

### 4. Test in Shiprocket Sandbox (Optional but Recommended)
Shiprocket provides a test mode:
- Use test credentials for initial testing
- Switch to production credentials when ready to go live

---

## 📦 How It Works (Admin Workflow)

### When Admin Ships an Order:

1. **Admin clicks "🚚 Ship via Shiprocket"** on an order
2. **Fills in package details**:
   - State (customer's state)
   - Length, Breadth, Height (in cm)
   - Weight (in kg)
   - These affect courier selection and pricing
3. **Clicks "Confirm & Ship — Schedule Pickup"**
4. **System does**:
   - Creates order on Shiprocket with customer's delivery address
   - Auto-assigns best courier (Delhivery, Bluedart, DTDC, etc.)
   - Generates AWB tracking number
   - **Schedules pickup** → Delivery boy gets notified to come collect the parcel
   - Updates order status to "Shipped"
   - Saves tracking ID in database
5. **Delivery boy arrives** at your pickup address (usually within 24 hours)
6. **Customer receives tracking updates** via SMS/email from Shiprocket
7. **Order gets delivered** → Admin marks as "Delivered" in the system

### If Pickup Needs to be Cancelled:
- Click **"Cancel Shipment"** button (only visible for Shipped orders)
- Order goes back to "Processing" status
- Admin can re-ship with corrected details

---

## 🔍 Troubleshooting Common Issues

### Issue 1: "Shiprocket login failed"
**Cause**: Wrong email/password in `.env`
**Fix**: Double-check `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`

### Issue 2: "Pickup address not found"
**Cause**: `SHIPROCKET_PICKUP_LOCATION` doesn't match dashboard
**Fix**: 
1. Go to Shiprocket Dashboard → Settings → Manage Pickup Addresses
2. Copy the EXACT name (case-sensitive)
3. Update `.env` file

### Issue 3: "No courier serviceable to this pincode"
**Cause**: Customer's pincode is not serviceable by any courier
**Fix**: 
- Check pincode serviceability on Shiprocket dashboard
- Contact customer to verify pincode
- Use alternative courier or manual shipping

### Issue 4: "AWB assignment failed"
**Cause**: Insufficient wallet balance or courier restrictions
**Fix**:
- Recharge Shiprocket wallet (Settings → Wallet)
- Check courier availability for that pincode
- Try manual AWB assignment from Shiprocket dashboard

### Issue 5: "Pickup not scheduled"
**Cause**: Pickup address incomplete or courier doesn't support auto-pickup
**Fix**:
- Verify pickup address has all required fields (phone, pincode, etc.)
- Manually schedule pickup from Shiprocket dashboard → Orders → Schedule Pickup

### Issue 6: "Duplicate order_id"
**Cause**: Retrying shipment for same order
**Fix**: Already handled — system appends timestamp to order_id to make it unique

---

## 💰 Pricing & Wallet

### Shiprocket Pricing Model:
- **Pay-per-shipment**: You only pay when you ship
- **No monthly fees** for basic plan
- **Rates**: ₹30-80 per shipment (depends on weight, distance, courier)
- **COD charges**: Extra ₹15-25 per COD order

### Wallet Recharge:
1. Go to Shiprocket Dashboard → Wallet
2. Add money (minimum ₹500)
3. Amount gets deducted automatically when you ship

### Payment Method Mapping:
- **Razorpay (paid online)** → Shiprocket sees as "Prepaid" → Lower shipping cost
- **COD orders** → Shiprocket sees as "COD" → Courier collects cash from customer

---

## 🎯 Production Checklist

Before going live, ensure:

- [ ] Shiprocket account created and KYC completed
- [ ] Pickup address configured in Shiprocket dashboard
- [ ] `.env` file updated with real credentials
- [ ] `SHIPROCKET_PICKUP_LOCATION` matches dashboard exactly
- [ ] Wallet recharged with sufficient balance
- [ ] Test order placed and shipped successfully
- [ ] Delivery boy came to pickup address to collect test parcel
- [ ] Customer received tracking SMS/email
- [ ] Tracking ID visible in customer's order history

---

## 📊 Monitoring & Logs

### Backend Logs:
The system logs important events:
- `console.warn("AWB assignment returned no awb_code")` → AWB failed
- `console.warn("Pickup scheduling response")` → Pickup scheduling issue
- `console.error("Pickup scheduling error")` → Pickup API error

### Check Shiprocket Dashboard:
- **Orders** → See all shipped orders
- **Shipments** → Track pickup and delivery status
- **Pickup** → See scheduled pickups
- **NDR Management** → Handle failed deliveries

---

## 🔐 Security Notes

- Never commit `.env` file to Git (already in `.gitignore`)
- Shiprocket credentials are sensitive — treat like passwords
- Only admins can trigger shipments (protected by `adminOnly` middleware)
- API token expires after 24 hours — system auto-refreshes on each request

---

## 📞 Support

**Shiprocket Support:**
- Email: care@shiprocket.in
- Phone: +91-120-4627180
- Dashboard: https://app.shiprocket.in

**Integration Issues:**
- Check backend console logs for detailed error messages
- Verify all `.env` variables are set correctly
- Test with a small order first before bulk shipping

---

## 🚀 Advanced Features (Optional)

### Enable in Future:
1. **Webhook Integration** — Get real-time delivery updates from Shiprocket
2. **Multi-warehouse** — Add multiple pickup locations
3. **Courier Selection** — Let admin choose specific courier instead of auto-assign
4. **Bulk Shipping** — Ship multiple orders at once
5. **Return Orders** — Handle product returns via Shiprocket

All these can be added by extending the `shipmentController.js` file.

---

**Last Updated**: January 2025
**Integration Version**: v1.0

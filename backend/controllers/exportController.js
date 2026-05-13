const Order   = require("../models/Order");
const User    = require("../models/User");
const Product = require("../models/Product");
const XLSX    = require("xlsx");
const PDFDocument = require("pdfkit");

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const money = (n) => `Rs.${Number(n || 0).toLocaleString("en-IN")}`;

/** Build a date-range filter from query params */
const buildDateFilter = (range, from, to) => {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { $gte: start };
  }
  if (range === "7days") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return { $gte: start };
  }
  if (range === "30days") {
    const start = new Date(now); start.setDate(now.getDate() - 30);
    return { $gte: start };
  }
  if (range === "custom" && from && to) {
    return { $gte: new Date(from), $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) };
  }
  return undefined; // no filter
};

/* ══════════════════════════════════════════════════════════
   ORDERS EXPORT
══════════════════════════════════════════════════════════ */
const exportOrders = async (req, res) => {
  try {
    const { format = "excel", range, from, to, status, userId } = req.query;

    const filter = {};
    const dateF = buildDateFilter(range, from, to);
    if (dateF) filter.createdAt = dateF;
    if (status && status !== "all") filter.status = status;
    if (userId) filter.user = userId;

    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);

    /* ── Excel ── */
    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Cloud Graphics Amravati — Orders Export"],
        ["Generated", new Date().toLocaleString("en-IN")],
        [],
        ["Total Orders", orders.length],
        ["Total Revenue", money(totalRevenue)],
        ["Filter: Date Range", range || "All time"],
        ["Filter: Status", status || "All"],
      ];
      const ws0 = XLSX.utils.aoa_to_sheet(summaryData);
      ws0["!cols"] = [{ wch: 28 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws0, "Summary");

      // Orders sheet
      const rows = orders.map((o, i) => ({
        "#": i + 1,
        "Order ID": o._id.toString().slice(-8).toUpperCase(),
        "Date": fmt(o.createdAt),
        "Customer": o.user?.name || "—",
        "Email": o.user?.email || "—",
        "Phone": o.shippingAddress?.phone || "—",
        "City": o.shippingAddress?.city || "—",
        "Items": o.items?.length || 0,
        "Total (Rs.)": o.totalPrice || 0,
        "Payment": o.paymentMethod === "razorpay" ? "Online" : "COD",
        "Pay Status": o.paymentStatus || "—",
        "Status": o.status || "—",
        "Tracking": o.shipment?.trackingId || "—",
      }));

      const ws1 = XLSX.utils.json_to_sheet(rows);
      ws1["!cols"] = [
        { wch: 4 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 26 },
        { wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, "Orders");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", `attachment; filename="orders_export_${Date.now()}.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buf);
    }

    /* ── PDF ── */
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Disposition", `attachment; filename="orders_export_${Date.now()}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 70).fill("#c41230");
    doc.fillColor("#fff").fontSize(18).font("Helvetica-Bold").text("Cloud Graphics Amravati", 40, 18);
    doc.fontSize(10).font("Helvetica").text("Orders Export Report", 40, 42);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 56);
    doc.moveDown(3);

    // Summary box
    doc.fillColor("#1a1a1a").fontSize(11).font("Helvetica-Bold").text("Summary", 40, 90);
    doc.rect(40, 105, doc.page.width - 80, 60).fill("#f7f7f7").stroke("#e0e0e0");
    doc.fillColor("#333").fontSize(10).font("Helvetica");
    doc.text(`Total Orders: ${orders.length}`, 55, 115);
    doc.text(`Total Revenue: ${money(totalRevenue)}`, 55, 130);
    doc.text(`Date Filter: ${range || "All time"}   |   Status Filter: ${status || "All"}`, 55, 145);

    // Table
    const tableTop = 185;
    const cols = [
      { label: "#",        x: 40,  w: 25 },
      { label: "Order ID", x: 65,  w: 65 },
      { label: "Date",     x: 130, w: 70 },
      { label: "Customer", x: 200, w: 110 },
      { label: "Total",    x: 310, w: 65 },
      { label: "Payment",  x: 375, w: 55 },
      { label: "Status",   x: 430, w: 70 },
      { label: "Tracking", x: 500, w: 90 },
    ];

    // Table header
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill("#c41230");
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
    cols.forEach((c) => doc.text(c.label, c.x + 3, tableTop + 6, { width: c.w - 4 }));

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(8);

    orders.forEach((o, i) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
      const bg = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
      doc.rect(40, y, doc.page.width - 80, 18).fill(bg);
      doc.fillColor("#333");
      const row = [
        i + 1,
        o._id.toString().slice(-8).toUpperCase(),
        fmt(o.createdAt),
        o.user?.name || "—",
        money(o.totalPrice),
        o.paymentMethod === "razorpay" ? "Online" : "COD",
        o.status,
        o.shipment?.trackingId || "—",
      ];
      cols.forEach((c, ci) => doc.text(String(row[ci]), c.x + 3, y + 5, { width: c.w - 4, ellipsis: true }));
      y += 18;
    });

    // Footer
    doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill("#1a1a1a");
    doc.fillColor("#aaa").fontSize(8).text("© Cloud Graphics Amravati — Confidential", 40, doc.page.height - 18);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   USERS EXPORT
══════════════════════════════════════════════════════════ */
const exportUsers = async (req, res) => {
  try {
    const { format = "excel", range, from, to } = req.query;

    const filter = { role: "user" };
    const dateF = buildDateFilter(range, from, to);
    if (dateF) filter.createdAt = dateF;

    const users = await User.find(filter).select("-password -resetPasswordOTP -resetPasswordOTPExpiry").sort({ createdAt: -1 }).lean();

    /* ── Excel ── */
    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ["Cloud Graphics Amravati — Users Export"],
        ["Generated", new Date().toLocaleString("en-IN")],
        [],
        ["Total Users", users.length],
        ["Filter: Date Range", range || "All time"],
      ];
      const ws0 = XLSX.utils.aoa_to_sheet(summaryData);
      ws0["!cols"] = [{ wch: 28 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws0, "Summary");

      const rows = users.map((u, i) => ({
        "#": i + 1,
        "Name": u.name,
        "Email": u.email,
        "Phone": u.phone || "—",
        "Role": u.role,
        "Blocked": u.isBlocked ? "Yes" : "No",
        "Registered": fmt(u.createdAt),
      }));

      const ws1 = XLSX.utils.json_to_sheet(rows);
      ws1["!cols"] = [{ wch: 4 }, { wch: 24 }, { wch: 28 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Users");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", `attachment; filename="users_export_${Date.now()}.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buf);
    }

    /* ── PDF ── */
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Disposition", `attachment; filename="users_export_${Date.now()}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 70).fill("#c41230");
    doc.fillColor("#fff").fontSize(18).font("Helvetica-Bold").text("Cloud Graphics Amravati", 40, 18);
    doc.fontSize(10).font("Helvetica").text("Users Export Report", 40, 42);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 56);

    doc.fillColor("#1a1a1a").fontSize(11).font("Helvetica-Bold").text("Summary", 40, 90);
    doc.rect(40, 105, doc.page.width - 80, 45).fill("#f7f7f7").stroke("#e0e0e0");
    doc.fillColor("#333").fontSize(10).font("Helvetica");
    doc.text(`Total Users: ${users.length}`, 55, 115);
    doc.text(`Date Filter: ${range || "All time"}`, 55, 130);

    const tableTop = 170;
    const cols = [
      { label: "#",           x: 40,  w: 25 },
      { label: "Name",        x: 65,  w: 120 },
      { label: "Email",       x: 185, w: 160 },
      { label: "Phone",       x: 345, w: 80 },
      { label: "Blocked",     x: 425, w: 55 },
      { label: "Registered",  x: 480, w: 80 },
    ];

    doc.rect(40, tableTop, doc.page.width - 80, 20).fill("#c41230");
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
    cols.forEach((c) => doc.text(c.label, c.x + 3, tableTop + 6, { width: c.w - 4 }));

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(8);
    users.forEach((u, i) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
      doc.rect(40, y, doc.page.width - 80, 18).fill(i % 2 === 0 ? "#fff" : "#f9f9f9");
      doc.fillColor("#333");
      const row = [i + 1, u.name, u.email, u.phone || "—", u.isBlocked ? "Yes" : "No", fmt(u.createdAt)];
      cols.forEach((c, ci) => doc.text(String(row[ci]), c.x + 3, y + 5, { width: c.w - 4, ellipsis: true }));
      y += 18;
    });

    doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill("#1a1a1a");
    doc.fillColor("#aaa").fontSize(8).text("© Cloud Graphics Amravati — Confidential", 40, doc.page.height - 18);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════════════════════
   PRODUCTS EXPORT
══════════════════════════════════════════════════════════ */
const exportProducts = async (req, res) => {
  try {
    const { format = "excel", range, from, to } = req.query;

    const filter = {};
    const dateF = buildDateFilter(range, from, to);
    if (dateF) filter.createdAt = dateF;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    const totalValue = products.reduce((s, p) => s + (p.price || 0), 0);

    /* ── Excel ── */
    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ["Cloud Graphics Amravati — Products Export"],
        ["Generated", new Date().toLocaleString("en-IN")],
        [],
        ["Total Products", products.length],
        ["Total Catalogue Value", money(totalValue)],
        ["Filter: Date Range", range || "All time"],
      ];
      const ws0 = XLSX.utils.aoa_to_sheet(summaryData);
      ws0["!cols"] = [{ wch: 28 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws0, "Summary");

      const rows = products.map((p, i) => ({
        "#": i + 1,
        "Name": p.name,
        "Category": p.category || "—",
        "Price (Rs.)": p.price || 0,
        "Original Price (Rs.)": p.originalPrice || 0,
        "Stock": p.stock ?? "—",
        "Available": p.isAvailable ? "Yes" : "No",
        "Custom Print": p.requiresCustomImage ? "Required" : p.allowCustomImage ? "Optional" : "No",
        "SKU": p.sku || "—",
        "Brand": p.brand || "—",
        "Added": fmt(p.createdAt),
      }));

      const ws1 = XLSX.utils.json_to_sheet(rows);
      ws1["!cols"] = [
        { wch: 4 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
        { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, "Products");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", `attachment; filename="products_export_${Date.now()}.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buf);
    }

    /* ── PDF ── */
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Disposition", `attachment; filename="products_export_${Date.now()}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 70).fill("#c41230");
    doc.fillColor("#fff").fontSize(18).font("Helvetica-Bold").text("Cloud Graphics Amravati", 40, 18);
    doc.fontSize(10).font("Helvetica").text("Products Export Report", 40, 42);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 56);

    doc.fillColor("#1a1a1a").fontSize(11).font("Helvetica-Bold").text("Summary", 40, 90);
    doc.rect(40, 105, doc.page.width - 80, 50).fill("#f7f7f7").stroke("#e0e0e0");
    doc.fillColor("#333").fontSize(10).font("Helvetica");
    doc.text(`Total Products: ${products.length}`, 55, 115);
    doc.text(`Total Catalogue Value: ${money(totalValue)}`, 55, 130);
    doc.text(`Date Filter: ${range || "All time"}`, 55, 145);

    const tableTop = 175;
    const cols = [
      { label: "#",        x: 40,  w: 25 },
      { label: "Name",     x: 65,  w: 150 },
      { label: "Category", x: 215, w: 80 },
      { label: "Price",    x: 295, w: 60 },
      { label: "Stock",    x: 355, w: 45 },
      { label: "Available",x: 400, w: 55 },
      { label: "Custom",   x: 455, w: 55 },
      { label: "Added",    x: 510, w: 70 },
    ];

    doc.rect(40, tableTop, doc.page.width - 80, 20).fill("#c41230");
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
    cols.forEach((c) => doc.text(c.label, c.x + 3, tableTop + 6, { width: c.w - 4 }));

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(8);
    products.forEach((p, i) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
      doc.rect(40, y, doc.page.width - 80, 18).fill(i % 2 === 0 ? "#fff" : "#f9f9f9");
      doc.fillColor("#333");
      const row = [
        i + 1, p.name, p.category || "—", money(p.price),
        p.stock ?? "—", p.isAvailable ? "Yes" : "No",
        p.requiresCustomImage ? "Required" : p.allowCustomImage ? "Optional" : "No",
        fmt(p.createdAt),
      ];
      cols.forEach((c, ci) => doc.text(String(row[ci]), c.x + 3, y + 5, { width: c.w - 4, ellipsis: true }));
      y += 18;
    });

    doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill("#1a1a1a");
    doc.fillColor("#aaa").fontSize(8).text("© Cloud Graphics Amravati — Confidential", 40, doc.page.height - 18);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { exportOrders, exportUsers, exportProducts };

import { prisma } from "@/lib/prisma";

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}) {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId ?? null,
    },
  });
}

export async function notifyAdminsForTransferRequest(data: {
  productType: string;
  productName: string;
  requesterName: string;
  quantity: number;
  transferRequestId: string;
}) {
  const allAdmins = await prisma.user.findMany({ where: { role: "admin" } });
  const admins = allAdmins.filter((a) => {
    const t = a.allowedProductTypes?.trim();
    if (!t) return true; // super admin
    const types = t.split(",").map((s) => s.trim().toLowerCase());
    return types.includes(data.productType.toLowerCase());
  });
  const title = "Nouvelle demande de transfert";
  const message = `${data.requesterName} demande ${data.quantity} ${data.productName}`;
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: "transfer_request_new",
      title,
      message,
      relatedId: data.transferRequestId,
    });
  }
}

/** Create stock alert notifications for admins (low stock / rupture) - called from dashboard */
export async function notifyStockAlerts(lowStock: { id: string; name: string }[], ruptures: { id: string; name: string }[]) {
  const admins = await prisma.user.findMany({ where: { role: "admin" } });
  if (admins.length === 0) return;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.notification.findMany({
    where: { type: { in: ["stock_low", "stock_rupture"] }, createdAt: { gte: since } },
    select: { relatedId: true, type: true },
  });
  const recentSet = new Set(recent.map((r) => `${r.type}:${r.relatedId}`));

  for (const p of lowStock) {
    if (recentSet.has(`stock_low:${p.id}`)) continue;
    recentSet.add(`stock_low:${p.id}`);
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "stock_low",
        title: "Stock bas",
        message: `Le produit "${p.name}" est en stock bas.`,
        relatedId: p.id,
      });
    }
  }
  for (const p of ruptures) {
    if (recentSet.has(`stock_rupture:${p.id}`)) continue;
    recentSet.add(`stock_rupture:${p.id}`);
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "stock_rupture",
        title: "Rupture de stock",
        message: `Le produit "${p.name}" est en rupture.`,
        relatedId: p.id,
      });
    }
  }
}

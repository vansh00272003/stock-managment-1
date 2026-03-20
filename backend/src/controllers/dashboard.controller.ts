import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalInvoices, stockSum, recentLogs, productsWithStock] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.invoice.count(),
      prisma.stockLevel.aggregate({
        _sum: {
          quantity: true,
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      prisma.product.findMany({
        include: {
          stockLevels: true
        }
      })
    ]);

    // Calculate low stock count
    const lowStockCount = productsWithStock.filter((p: any) => {
      const totalStock = p.stockLevels.reduce((sum: number, sl: any) => sum + sl.quantity, 0);
      return totalStock < p.reorderPoint;
    }).length;

    const totalRevenue = await prisma.order.aggregate({
      where: { type: 'SALES', status: 'FULFILLED' },
      _sum: { totalAmount: true }
    });

    // Fetch last 6 months of movements for trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const movements = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { type: true, quantity: true, createdAt: true }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendsMap: Record<string, { name: string, in: number, out: number }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const name = monthNames[d.getMonth()]!;
      trendsMap[name] = { name, in: 0, out: 0 };
    }

    movements.forEach((m: any) => {
      const date = new Date(m.createdAt);
      const monthName = monthNames[date.getMonth()]!;
      if (trendsMap[monthName]) {
        if (m.type === 'INBOUND') trendsMap[monthName].in += m.quantity;
        if (m.type === 'OUTBOUND') trendsMap[monthName].out += m.quantity;
      }
    });

    const movementTrends = Object.values(trendsMap);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalInvoices,
      totalStock: stockSum._sum.quantity || 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      lowStockCount,
      movementTrends,
      recentActivity: recentLogs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

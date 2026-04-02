import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Auto-update overdue invoices - isolated in a try-catch to prevent listing failure
    try {
      await prisma.invoice.updateMany({
        where: {
          status: { notIn: ['PAID', 'CANCELLED', 'OVERDUE'] },
          dueDate: { lt: now },
        },
        data: { status: 'OVERDUE' },
      });
    } catch (autoOverdueError) {
      console.error('Auto-overdue update failed:', autoOverdueError);
    }

    const { search, startDate, endDate } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerEmail: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate && endDate) {
        where.issuedAt.gte = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.issuedAt.lte = end;
      } else if (startDate) {
        const start = new Date(startDate as string);
        const end = new Date(startDate as string);
        end.setHours(23, 59, 59, 999);
        where.issuedAt.gte = start;
        where.issuedAt.lte = end;
      } else if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.issuedAt.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: {
          include: { 
            user: { select: { id: true, firstName: true, lastName: true } } 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    console.error('getInvoices Error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const invoice = await prisma.invoice.findUnique({
      where: { id } as any,
      include: {
        order: {
          include: { 
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            orderItems: { include: { product: true } }
          }
        }
      }
    });

    if (!invoice) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { orderId, dueDate, issuedAt, customerName, customerEmail, purchaseOrder, amount, items, status } = req.body;

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        orderId: orderId || null,
        invoiceNumber,
        customerName,
        customerEmail,
        purchaseOrder,
        amount: amount || 0,
        issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        items: items || [],
        status: status || 'DRAFT',
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice Creation Error:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { dueDate, customerName, customerEmail, purchaseOrder, amount, items, status, commercialInvoiceUrl } = req.body;

    const updateData: any = {
      customerName,
      customerEmail,
      purchaseOrder,
      amount,
      items,
      status,
      commercialInvoiceUrl,
    };

    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status === 'ISSUED') updateData.issuedAt = new Date();
    if (status === 'PAID') updateData.paidAt = new Date();

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
    const id = req.params.id as string;
      const { status, commercialInvoiceUrl } = req.body;
  
      const updateData: any = {};
      if (status) updateData.status = status;
      if (commercialInvoiceUrl) updateData.commercialInvoiceUrl = commercialInvoiceUrl;
      
      if (status === 'ISSUED') updateData.issuedAt = new Date();
      if (status === 'PAID') updateData.paidAt = new Date();

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
      });
  
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  };

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.invoice.delete({ where: { id } });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

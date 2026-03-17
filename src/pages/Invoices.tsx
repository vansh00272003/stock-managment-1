import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus, Trash2, Edit, Download, Printer, Eye, Upload } from 'lucide-react';
import { useLogStore } from '@/store/logStore';

const initialProducts = [
  { id: '1', sku: 'LAP-001', name: 'ThinkPad X1 Carbon', category: 'Electronics', price: 1299.99, stock: 45, reorder: 10 },
  { id: '2', sku: 'MON-023', name: 'Dell UltraSharp 27"', category: 'Electronics', price: 499.00, stock: 8, reorder: 15 },
  { id: '3', sku: 'DESK-100', name: 'Ergo Standing Desk', category: 'Furniture', price: 350.00, stock: 120, reorder: 20 },
  { id: '4', sku: 'CHAIR-05', name: 'Herman Miller Aeron', category: 'Furniture', price: 1100.00, stock: 2, reorder: 5 },
];

interface InvoiceItem {
  id: string;
  productId: string;
  sku: string;
  description: string;
  quantity: number;
  price: number;
  gst: number;
}

interface Invoice {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  dueDate: string;
  purchaseOrder: string;
  commercialInvoiceUrl?: string;
  items: InvoiceItem[];
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
}

const initialInvoices: Invoice[] = [
  {
    id: 'INV-2026-001',
    customerName: 'Acme Corp',
    customerEmail: 'billing@acmecorp.com',
    date: '2026-03-10',
    dueDate: '2026-04-10',
    purchaseOrder: 'PO-99281',
    items: [
      { id: '1', productId: '1', sku: 'LAP-001', description: 'ThinkPad X1 Carbon', quantity: 2, price: 1299.99, gst: 18 },
      { id: '2', productId: '2', sku: 'MON-023', description: 'Dell UltraSharp 27"', quantity: 2, price: 499.99, gst: 18 }
    ],
    total: 4247.95,
    status: 'PAID',
    commercialInvoiceUrl: 'commercial_invoice_INV-2026-001.pdf'
  },
  {
    id: 'INV-2026-002',
    customerName: 'TechStart Inc',
    customerEmail: 'accounts@techstart.io',
    date: '2026-03-15',
    dueDate: '2026-04-15',
    purchaseOrder: 'PO-10022',
    items: [
      { id: '1', productId: '4', sku: 'CHAIR-05', description: 'Herman Miller Aeron', quantity: 5, price: 1199.00, gst: 18 }
    ],
    total: 7074.10,
    status: 'DRAFT'
  }
];

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusInvoice, setStatusInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDateDays, setDueDateDays] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  const addLog = useLogStore(state => state.addLog);

  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let hasChanges = false;
    const updatedInvoices = invoices.map(inv => {
      if (inv.status !== 'PAID' && inv.status !== 'OVERDUE' && inv.dueDate < today) {
        hasChanges = true;
        return { ...inv, status: 'OVERDUE' as const };
      }
      return inv;
    });
    
    if (hasChanges) {
      setInvoices(updatedInvoices);
    }
  }, [invoices]);

  const openCreateModal = () => {
    setEditingInvoice(null);
    setCustomerName('');
    setCustomerEmail('');
    setPurchaseOrder('');
    
    const today = new Date();
    setInvoiceDate(today.toISOString().split('T')[0]);
    
    setDueDateDays(30);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);
    setDueDate(nextMonth.toISOString().split('T')[0]);
    
    setItems([{ id: Math.random().toString(), productId: '', sku: '', description: '', quantity: 1, price: 0, gst: 0 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setCustomerName(invoice.customerName);
    setCustomerEmail(invoice.customerEmail);
    setPurchaseOrder(invoice.purchaseOrder || '');
    setInvoiceDate(invoice.date);
    setDueDate(invoice.dueDate);
    
    const start = new Date(invoice.date);
    const end = new Date(invoice.dueDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    setDueDateDays(diffDays >= 0 ? diffDays : 0);
    
    setItems([...invoice.items]);
    setIsModalOpen(true);
  };

  const handleInvoiceDateChange = (dateStr: string) => {
    setInvoiceDate(dateStr);
    if (dateStr) {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + dueDateDays);
      setDueDate(date.toISOString().split('T')[0]);
    }
  };

  const handleDueDateDaysChange = (daysStr: string) => {
    const days = parseInt(daysStr, 10) || 0;
    setDueDateDays(days);
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + days);
      setDueDate(date.toISOString().split('T')[0]);
    }
  };

  const handleDueDateChange = (dateStr: string) => {
    setDueDate(dateStr);
    if (invoiceDate && dateStr) {
      const start = new Date(invoiceDate);
      const end = new Date(dateStr);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setDueDateDays(diffDays >= 0 ? diffDays : 0);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), productId: '', sku: '', description: '', quantity: 1, price: 0, gst: 0 }]);
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = initialProducts.find(p => p.id === productId);
    if (product) {
      setItems(items.map(item => {
        if (item.id === itemId) {
          return { ...item, productId: product.id, sku: product.sku, description: product.name, price: product.price, gst: 18 };
        }
        return item;
      }));
    }
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price * (item.gst || 0) / 100), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = calculateTotal();
    
    if (editingInvoice) {
      const updatedInvoice: Invoice = {
        ...editingInvoice,
        customerName,
        customerEmail,
        date: invoiceDate,
        dueDate,
        purchaseOrder,
        items,
        total
      };
      setInvoices(invoices.map(inv => inv.id === editingInvoice.id ? updatedInvoice : inv));
      addLog({ user: 'Current User', action: 'UPDATE', entity: 'Invoice', details: `Updated invoice ${updatedInvoice.id}` });
    } else {
      const newInvoice: Invoice = {
        id: `INV-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        customerName,
        customerEmail,
        date: invoiceDate,
        dueDate,
        purchaseOrder,
        items,
        total,
        status: 'DRAFT'
      };
      setInvoices([newInvoice, ...invoices]);
      addLog({ user: 'Current User', action: 'CREATE', entity: 'Invoice', details: `Created invoice ${newInvoice.id}` });
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
    addLog({ user: 'Current User', action: 'DELETE', entity: 'Invoice', details: `Deleted invoice ${id}` });
  };

  const handleStatusChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get('status') as Invoice['status'];
    
    if (statusInvoice) {
      setInvoices(invoices.map(inv => inv.id === statusInvoice.id ? { ...inv, status: newStatus } : inv));
      addLog({ user: 'Current User', action: 'UPDATE', entity: 'Invoice Status', details: `Changed status of ${statusInvoice.id} to ${newStatus}` });
    }
    setIsStatusModalOpen(false);
    setStatusInvoice(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'SENT': return 'default';
      case 'OVERDUE': return 'destructive';
      case 'DRAFT': return 'secondary';
      default: return 'outline';
    }
  };

  const handleDownloadDraft = (invoice: Invoice) => {
    const content = `
DRAFT BILL
=========================================
Invoice ID: ${invoice.id}
Date: ${invoice.date}
Due Date: ${invoice.dueDate}
PO Number: ${invoice.purchaseOrder || 'N/A'}

Billed To:
${invoice.customerName}
${invoice.customerEmail}

Items:
${invoice.items.map(item => `- [${item.sku}] ${item.description} x${item.quantity} @ ₹${item.price.toFixed(2)} (GST: ${item.gst || 0}%) = ₹${(item.quantity * item.price * (1 + (item.gst || 0) / 100)).toFixed(2)}`).join('\n')}

=========================================
Subtotal: ₹${invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
Total GST: ₹${invoice.items.reduce((sum, item) => sum + (item.quantity * item.price * (item.gst || 0) / 100), 0).toFixed(2)}
Total: ₹${invoice.total.toFixed(2)}
Status: ${invoice.status}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Draft_Bill_${invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog({ user: 'Current User', action: 'DOWNLOAD', entity: 'Draft Bill', details: `Downloaded draft bill for ${invoice.id}` });
  };

  const handleUploadCommercialInvoice = (invoiceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, commercialInvoiceUrl: file.name } : inv));
      addLog({ user: 'Current User', action: 'UPLOAD', entity: 'Commercial Invoice', details: `Uploaded commercial invoice ${file.name} for ${invoiceId}` });
    }
  };

  const handleDownloadCommercialInvoice = (invoice: Invoice) => {
    if (!invoice.commercialInvoiceUrl) return;
    const blob = new Blob(['Simulated Commercial Invoice Content'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = invoice.commercialInvoiceUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog({ user: 'Current User', action: 'DOWNLOAD', entity: 'Commercial Invoice', details: `Downloaded commercial invoice for ${invoice.id}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices & Billing</h1>
          <p className="text-slate-500">Manage customer invoices, track payments, and bill products.</p>
        </div>
        <Button className="gap-2" onClick={openCreateModal}>
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-lg">All Invoices</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium text-indigo-600">{invoice.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{invoice.customerName}</span>
                      <span className="text-xs text-slate-500">{invoice.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{invoice.date}</TableCell>
                  <TableCell className="text-slate-500">{invoice.dueDate}</TableCell>
                  <TableCell className="font-medium">₹{invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(invoice.status)}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setStatusInvoice(invoice);
                        setIsStatusModalOpen(true);
                      }}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="View Invoice" onClick={() => {
                        setViewInvoice(invoice);
                        setIsViewModalOpen(true);
                      }}>
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download Draft Bill" onClick={() => handleDownloadDraft(invoice)}>
                        <FileText className="w-4 h-4 text-indigo-500" />
                      </Button>
                      
                      <div className="relative inline-block">
                        <Button variant="ghost" size="icon" title="Upload Commercial Invoice" onClick={() => document.getElementById(`upload-${invoice.id}`)?.click()}>
                          <Upload className="w-4 h-4 text-emerald-500" />
                        </Button>
                        <input 
                          type="file" 
                          id={`upload-${invoice.id}`} 
                          className="hidden" 
                          onChange={(e) => handleUploadCommercialInvoice(invoice.id, e)} 
                        />
                      </div>

                      {invoice.commercialInvoiceUrl && (
                        <Button variant="ghost" size="icon" title="Download Commercial Invoice" onClick={() => handleDownloadCommercialInvoice(invoice)}>
                          <Download className="w-4 h-4 text-slate-700" />
                        </Button>
                      )}

                      <Button variant="ghost" size="icon" title="Edit Invoice" onClick={() => openEditModal(invoice)}>
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete Invoice" onClick={() => handleDelete(invoice.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No invoices found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Invoice Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>Fill in the customer and product details for this bill.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-6 py-4">
              {/* Customer Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold border-b pb-2">Customer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerEmail">Customer Email</Label>
                    <Input id="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input id="invoiceDate" type="date" value={invoiceDate} onChange={e => handleInvoiceDateChange(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDateDays">Terms (Days)</Label>
                    <Input id="dueDateDays" type="number" min="0" value={dueDateDays} onChange={e => handleDueDateDaysChange(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={e => handleDueDateChange(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchaseOrder">Purchase Order (PO)</Label>
                  <Input id="purchaseOrder" placeholder="e.g. PO-12345" value={purchaseOrder} onChange={e => setPurchaseOrder(e.target.value)} />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-sm font-semibold">Line Items</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="grid gap-2 flex-1">
                        {index === 0 && <Label className="text-xs">Product</Label>}
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={item.productId}
                          onChange={e => handleProductSelect(item.id, e.target.value)}
                          required
                        >
                          <option value="" disabled>Select a product...</option>
                          {initialProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2 w-24">
                        {index === 0 && <Label className="text-xs">Qty</Label>}
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} 
                          required 
                        />
                      </div>
                      <div className="grid gap-2 w-32">
                        {index === 0 && <Label className="text-xs">Price (₹)</Label>}
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          value={item.price} 
                          onChange={e => updateItem(item.id, 'price', Number(e.target.value))} 
                          required 
                        />
                      </div>
                      <div className="grid gap-2 w-20">
                        {index === 0 && <Label className="text-xs">GST (%)</Label>}
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          value={item.gst || 0} 
                          onChange={e => updateItem(item.id, 'gst', Number(e.target.value))} 
                          required 
                        />
                      </div>
                      <div className="grid gap-2 w-24">
                        {index === 0 && <Label className="text-xs">Total</Label>}
                        <div className="h-10 flex items-center font-medium text-sm">
                          ₹{(item.quantity * item.price * (1 + (item.gst || 0) / 100)).toFixed(2)}
                        </div>
                      </div>
                      <div className="grid gap-2 pt-0">
                        {index === 0 && <Label className="text-xs opacity-0">Action</Label>}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-4 border-t">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total GST</span>
                      <span className="font-medium">₹{calculateTotalTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>Change the status for {statusInvoice?.id}.</DialogDescription>
          </DialogHeader>
          {statusInvoice && (
            <form onSubmit={handleStatusChange}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">New Status</Label>
                  <Select id="status" name="status" defaultValue={statusInvoice.status} required>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
                <Button type="submit">Confirm Status</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <DialogTitle className="text-2xl">Invoice {viewInvoice?.id}</DialogTitle>
              <DialogDescription>Issued on {viewInvoice?.date}</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadDraft(viewInvoice)}>
                <FileText className="w-4 h-4" /> Draft Bill
              </Button>
              {viewInvoice?.commercialInvoiceUrl && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadCommercialInvoice(viewInvoice)}>
                  <Download className="w-4 h-4" /> Commercial Invoice
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </DialogHeader>
          
          {viewInvoice && (
            <div className="py-6 space-y-8">
              <div className="flex justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Billed To</h4>
                  <p className="font-medium text-lg">{viewInvoice.customerName}</p>
                  <p className="text-slate-600">{viewInvoice.customerEmail}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Invoice Details</h4>
                  <p><span className="text-slate-500 mr-2">PO Number:</span> <span className="font-medium">{viewInvoice.purchaseOrder || 'N/A'}</span></p>
                  <p><span className="text-slate-500 mr-2">Due Date:</span> <span className="font-medium">{viewInvoice.dueDate}</span></p>
                  <p className="mt-1">
                    <span className="text-slate-500 mr-2">Status:</span> 
                    <Badge variant={getStatusBadgeVariant(viewInvoice.status)}>{viewInvoice.status}</Badge>
                  </p>
                </div>
              </div>

              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID (SKU)</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">GST %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.gst || 0}%</TableCell>
                        <TableCell className="text-right">₹{(item.quantity * item.price * (1 + (item.gst || 0) / 100)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end border-t pt-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">₹{viewInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total GST</span>
                    <span className="font-medium">₹{viewInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price * (item.gst || 0) / 100), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>₹{viewInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus, Trash2, Eye, Download, Printer, Upload, Edit, Search, X, Calendar } from 'lucide-react';
import { useLogStore } from '@/store/logStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  gst: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const emptyItem = (): InvoiceItem => ({
  id: Math.random().toString(36).slice(2),
  productId: '',
  sku: '',
  name: '',
  quantity: 1,
  price: 0,
  gst: 0,
});

const calcSubtotal = (items: InvoiceItem[]) =>
  items.reduce((s, i) => s + i.quantity * i.price, 0);

const calcTax = (items: InvoiceItem[]) =>
  items.reduce((s, i) => s + i.quantity * i.price * ((i.gst || 0) / 100), 0);

const calcTotal = (items: InvoiceItem[]) =>
  calcSubtotal(items) + calcTax(items);

const statusVariant = (status: string) => {
  switch (status) {
    case 'PAID': return 'success';
    case 'ISSUED': return 'default';
    case 'CANCELLED': return 'destructive';
    case 'OVERDUE': return 'destructive';
    case 'DRAFT': return 'secondary';
    default: return 'outline';
  }
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const today = () => new Date().toISOString().split('T')[0];

// ── component ────────────────────────────────────────────────────────────────

export default function Invoices() {
  const queryClient = useQueryClient();
  const addLog = useLogStore((s) => s.addLog);

  // ── modal visibility ────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // ── selected records ────
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [statusInvoice, setStatusInvoice] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── form fields ────
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [terms, setTerms] = useState(30);
  const [dueDate, setDueDate] = useState(addDays(today(), 30));
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);

  // ── search and filters ────
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // auto-calculate due date whenever invoice date or terms change
  useEffect(() => {
    if (invoiceDate) setDueDate(addDays(invoiceDate, Number(terms) || 0));
  }, [invoiceDate, terms]);

  // ── queries ────
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', searchTerm, startDate, endDate],
    queryFn: () => api.get('/invoices', { 
      params: { search: searchTerm, startDate, endDate } 
    }).then((r) => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  });

  // ── mutations ────
  const createMut = useMutation({
    mutationFn: (body: any) => api.post('/invoices', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      closeForm();
    },
    onError: (e: any) =>
      alert('Create failed: ' + (e.response?.data?.message || e.message)),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.put(`/invoices/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      closeForm();
    },
    onError: (e: any) =>
      alert('Update failed: ' + (e.response?.data?.message || e.message)),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsStatusOpen(false);
    },
  });

  const uploadMut = useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) =>
      api.patch(`/invoices/${id}/status`, { commercialInvoiceUrl: filename }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
    onError: (e: any) =>
      alert('Delete failed: ' + (e.response?.data?.message || e.message)),
  });

  // ── form helpers ────
  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setInvoiceDate(today());
    setTerms(30);
    setPurchaseOrder('');
    setItems([emptyItem()]);
    setEditingId(null);
  };

  const closeForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (inv: any) => {
    setEditingId(inv.id);
    setCustomerName(inv.customerName || '');
    setCustomerEmail(inv.customerEmail || '');
    setInvoiceDate(
      inv.issuedAt ? new Date(inv.issuedAt).toISOString().split('T')[0] : today()
    );
    setPurchaseOrder(inv.purchaseOrder || '');

    // parse items – they come from JSON, may or may not have ids
    const parsed: InvoiceItem[] = Array.isArray(inv.items)
      ? inv.items.map((it: any) => ({
        ...it,
        id: it.id || Math.random().toString(36).slice(2),
      }))
      : [emptyItem()];
    setItems(parsed);

    // compute terms from dates
    if (inv.issuedAt && inv.dueDate) {
      const start = new Date(inv.issuedAt).getTime();
      const end = new Date(inv.dueDate).getTime();
      const diff = Math.ceil((end - start) / 86400000);
      setTerms(diff >= 0 ? diff : 30);
    }

    setIsFormOpen(true);
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const p = products.find((pr: any) => pr.id === productId);
    if (!p) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, productId: p.id, sku: p.sku, name: p.name, price: p.price, gst: 18 }
          : i
      )
    );
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i))
    );
  };

  // ── submit ────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      customerName,
      customerEmail,
      issuedAt: invoiceDate,
      dueDate,
      purchaseOrder,
      amount: calcTotal(items),
      items,
      status: editingId ? undefined : 'DRAFT',
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, body });
    } else {
      createMut.mutate(body);
    }
  };

  // ── file actions ────
  const handleUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Max 10MB allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        // Since commercialInvoiceUrl is just a string in the DB, 
        // we store the whole data URL (which includes mime-type + base64 content)
        uploadMut.mutate({ id, filename: base64 });
        addLog({ user: 'Current User', action: 'UPLOAD', entity: 'Invoice', details: `Uploaded attachment for invoice ${id}` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (inv: any) => {
    const itemLines = (inv.items || [])
      .map(
        (i: any) =>
          `  [${i.sku}] ${i.name}  x${i.quantity} @ ₹${i.price}  (GST ${i.gst || 0}%)`
      )
      .join('\n');

    const content = [
      `INVOICE — ${inv.invoiceNumber || inv.id}`,
      `Date: ${inv.issuedAt ? format(new Date(inv.issuedAt), 'PPP') : 'N/A'}`,
      `Due:  ${inv.dueDate ? format(new Date(inv.dueDate), 'PPP') : 'N/A'}`,
      `Customer: ${inv.customerName || ''}`,
      `Email: ${inv.customerEmail || ''}`,
      `PO: ${inv.purchaseOrder || 'N/A'}`,
      '',
      'Items:',
      itemLines,
      '',
      `Total: ₹${inv.amount?.toLocaleString() || 0}`,
      `Status: ${inv.status}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${inv.invoiceNumber || inv.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAttachment = (inv: any) => {
    const dataUrl = inv.commercialInvoiceUrl;
    if (!dataUrl) return;

    if (dataUrl.startsWith('data:')) {
      try {
        // More robust download for large base64 strings using Blobs
        const parts = dataUrl.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Invoice_Attachment_${inv.invoiceNumber || inv.id.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("PDF download failed:", err);
        // Fallback to simple link if parsing fails
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = "attachment.pdf";
        link.click();
      }
    } else {
      // If it's just a filename (old data), it won't work perfectly but we try
      window.open(dataUrl, '_blank');
    }
    
    addLog({ user: 'Current User', action: 'DOWNLOAD', entity: 'Invoice', details: `Downloaded attachment for invoice ${inv.id}` });
  };

  const filteredInvoices = invoices;

  const handleBulkExport = () => {
    if (filteredInvoices.length === 0) return;

    const headers = ['Invoice Number', 'Customer Name', 'Email', 'Issued Date', 'Due Date', 'Amount', 'Status', 'PO Reference'];
    const rows = filteredInvoices.map((inv: any) => [
      inv.invoiceNumber || inv.id,
      inv.customerName,
      inv.customerEmail,
      inv.issuedAt ? format(new Date(inv.issuedAt), 'yyyy-MM-dd') : 'N/A',
      inv.dueDate ? format(new Date(inv.dueDate), 'yyyy-MM-dd') : 'N/A',
      inv.amount,
      inv.status,
      inv.purchaseOrder || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoices_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog({ 
      user: 'Current User', 
      action: 'EXPORT', 
      entity: 'Invoice', 
      details: `Exported ${filteredInvoices.length} invoices to CSV` 
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // JSX
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoices &amp; Billing
          </h1>
          <p className="text-slate-500">
            Manage customer invoices, track payments, and bill products.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      {/* Listing Card */}
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
          <h3 className="font-semibold text-lg">All Invoices</h3>
          <div className="flex items-center gap-2">
            {(searchTerm || startDate || endDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-slate-500 gap-1"
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                <X className="w-3 h-3" /> Clear Filters
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={handleBulkExport}
              disabled={filteredInvoices.length === 0}
            >
              <Download className="w-3 h-3" /> Export CSV ({filteredInvoices.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by invoice #, customer name or email..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none uppercase">From</span>
              <Input 
                type="date" 
                className="pl-14"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none uppercase">To</span>
              <Input 
                type="date" 
                className="pl-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    No invoices match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv: any) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-indigo-600 font-medium">
                      {inv.invoiceNumber || inv.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{inv.customerName || '—'}</span>
                        <span className="text-xs text-slate-500">{inv.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {inv.issuedAt ? format(new Date(inv.issuedAt), 'yyyy-MM-dd') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {inv.dueDate ? format(new Date(inv.dueDate), 'yyyy-MM-dd') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{inv.amount?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(inv.status)}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setStatusInvoice(inv);
                          setIsStatusOpen(true);
                        }}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* View */}
                        <Button variant="ghost" size="icon" title="View"
                          onClick={() => { setViewInvoice(inv); setIsViewOpen(true); }}>
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        {/* Download Draft */}
                        <Button variant="ghost" size="icon" title="Download Draft"
                          onClick={() => handleDownload(inv)}>
                          <FileText className="w-4 h-4 text-indigo-500" />
                        </Button>
                        {/* Upload Attachment */}
                        <div className="relative inline-block">
                          <input type="file" id={`up-${inv.id}`} className="hidden"
                            onChange={(e) => handleUpload(inv.id, e)} />
                          <Button variant="ghost" size="icon" title="Upload Attachment"
                            onClick={() => document.getElementById(`up-${inv.id}`)?.click()}>
                            <Upload className="w-4 h-4 text-emerald-500" />
                          </Button>
                        </div>
                        {/* Download Attachment (if exists) */}
                        {inv.commercialInvoiceUrl && (
                          <Button variant="ghost" size="icon" title="Download Attachment"
                            onClick={() => handleDownloadAttachment(inv)}>
                            <Download className="w-4 h-4 text-slate-700" />
                          </Button>
                        )}
                        {/* Edit */}
                        <Button variant="ghost" size="icon" title="Edit"
                          onClick={() => openEdit(inv)}>
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        {/* Delete */}
                        <Button variant="ghost" size="icon" title="Delete"
                          onClick={() => { if (confirm('Delete this invoice?')) deleteMut.mutate(inv.id); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Create / Edit Modal ─────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) closeForm(); else setIsFormOpen(true); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>Fill in customer details and line items for billing.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Customer */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold border-b pb-2">Customer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Customer Name</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Customer Email</Label>
                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label>Invoice Date</Label>
                    <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Terms (Days)</Label>
                    <Input type="number" min="0" value={terms} onChange={(e) => setTerms(Number(e.target.value))} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={dueDate} readOnly className="bg-slate-50" />
                  </div>
                  <div className="grid gap-2">
                    <Label>PO Reference</Label>
                    <Input value={purchaseOrder} onChange={(e) => setPurchaseOrder(e.target.value)} placeholder="PO-XXXX" />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-sm font-semibold">Line Items</h4>
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-1"
                    onClick={() => setItems((p) => [...p, emptyItem()])}>
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="grid gap-2 flex-1">
                        {idx === 0 && <Label className="text-xs">Product</Label>}
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          value={item.productId}
                          onChange={(e) => handleProductSelect(item.id, e.target.value)}
                          required
                        >
                          <option value="" disabled>Select a product…</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2 w-24">
                        {idx === 0 && <Label className="text-xs">Qty</Label>}
                        <Input type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} required />
                      </div>
                      <div className="grid gap-2 w-32">
                        {idx === 0 && <Label className="text-xs">Price (₹)</Label>}
                        <Input type="number" step="0.01" min="0" value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} required />
                      </div>
                      <div className="grid gap-2 w-20">
                        {idx === 0 && <Label className="text-xs">GST %</Label>}
                        <Input type="number" min="0" max="100" value={item.gst}
                          onChange={(e) => updateItem(item.id, 'gst', Number(e.target.value))} required />
                      </div>
                      <div className="grid gap-2 w-24">
                        {idx === 0 && <Label className="text-xs">Total</Label>}
                        <div className="h-10 flex items-center font-medium text-sm">
                          ₹{(item.quantity * item.price * (1 + (item.gst || 0) / 100)).toFixed(2)}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {idx === 0 && <Label className="text-xs opacity-0">X</Label>}
                        <Button type="button" variant="ghost" size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={items.length === 1}
                          onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-4 border-t">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">₹{calcSubtotal(items).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total GST</span>
                      <span className="font-medium">₹{calcTax(items).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                      <span>Grand Total</span>
                      <span>₹{calcTotal(items).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {createMut.isPending || updateMut.isPending
                  ? 'Saving…'
                  : editingId ? 'Save Changes' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── View Modal ──────────────────────────────────────────────────── */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-0">
          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              .print-hidden { display: none !important; }
              body { background: white !important; }
              .dialog-overlay { background: transparent !important; }
            }
          `}} />

          {/* Company Header (Always visible in View Modal, also good for Print) */}
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-indigo-700">BALAJI ENTERPRISES</h2>
              <div className="text-sm text-slate-500 space-y-0.5">
                <p>Chennai</p>
                <p>Chennai, Tamil Nadu - 600001</p>
                <p>Email: [EMAIL_ADDRESS] | Tel: </p>
                <p className="font-semibold text-slate-700 pt-1">GSTIN: </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-indigo-700 print:bg-white print:border print:p-1">
                <FileText className="w-5 h-5" />
                <span className="font-bold text-xl uppercase tracking-wider">Tax Invoice</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between border-b pb-4 print-hidden">
            <div>
              <DialogTitle className="text-2xl">
                Invoice {viewInvoice?.invoiceNumber || viewInvoice?.id?.slice(0, 8)}
              </DialogTitle>
              <DialogDescription>
                Issued on {viewInvoice?.issuedAt ? format(new Date(viewInvoice.issuedAt), 'PPP') : 'N/A'}
              </DialogDescription>
            </div>
            <div className="flex gap-2 print:hidden">
              {viewInvoice?.commercialInvoiceUrl && (
                <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleDownloadAttachment(viewInvoice)}>
                  <Download className="w-4 h-4" /> Attachment
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2"
                onClick={() => viewInvoice && handleDownload(viewInvoice)}>
                <Download className="w-4 h-4" /> Export MD
              </Button>
              <Button variant="default" size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          </div>

          {viewInvoice && (
            <div className="py-2 space-y-8">
              <div className="flex justify-between gap-8">
                <div className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-none print:p-0">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-3">Billed To</h4>
                  <div className="space-y-1">
                    <p className="font-bold text-xl text-slate-900">{viewInvoice.customerName}</p>
                    <p className="text-slate-600 font-medium">{viewInvoice.customerEmail}</p>
                  </div>
                </div>
                <div className="text-right flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-white print:border-none print:p-0">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-3">Invoice Details</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-slate-500 font-medium mr-2">Invoice #:</span> <span className="font-bold text-slate-900">{viewInvoice.invoiceNumber || viewInvoice.id?.slice(0, 8)}</span></p>
                    <p><span className="text-slate-500 font-medium mr-2">PO Reference:</span> <span className="font-bold text-slate-900">{viewInvoice.purchaseOrder || 'N/A'}</span></p>
                    <p><span className="text-slate-500 font-medium mr-2">Issued On:</span> <span className="font-bold text-slate-900">{viewInvoice.issuedAt ? format(new Date(viewInvoice.issuedAt), 'dd MMM yyyy') : '—'}</span></p>
                    <p><span className="text-slate-500 font-medium mr-2">Due Date:</span> <span className="font-bold text-indigo-600">{viewInvoice.dueDate ? format(new Date(viewInvoice.dueDate), 'dd MMM yyyy') : '—'}</span></p>
                    <div className="mt-2 inline-block">
                      <Badge variant={statusVariant(viewInvoice.status)} className="px-3 py-1 text-xs">
                        {viewInvoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 print:border-slate-300">
                <Table>
                  <TableHeader className="bg-slate-900 pointer-events-none print:bg-slate-100">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-white print:text-slate-900">SKU / Code</TableHead>
                      <TableHead className="text-white print:text-slate-900">Product Description</TableHead>
                      <TableHead className="text-white text-right print:text-slate-900">Qty</TableHead>
                      <TableHead className="text-white text-right print:text-slate-900">Rate (₹)</TableHead>
                      <TableHead className="text-white text-right print:text-slate-900">GST %</TableHead>
                      <TableHead className="text-white text-right print:text-slate-900 font-bold">Total (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viewInvoice.items || []).map((it: any, i: number) => (
                      <TableRow key={it.id || i} className="border-b border-slate-100 hover:bg-transparent">
                        <TableCell className="font-mono text-[11px] text-slate-500 uppercase">{it.sku}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{it.name || it.description}</TableCell>
                        <TableCell className="text-right font-medium">{it.quantity}</TableCell>
                        <TableCell className="text-right font-medium">{Number(it.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right text-slate-500 font-medium">{it.gst || 0}%</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {((it.quantity * it.price) * (1 + (it.gst || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pt-4">
                <div className="w-80 space-y-4">
                  <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-none print:p-0">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Net Value</span>
                      <span className="text-slate-900 font-bold">₹{calcSubtotal(viewInvoice.items || []).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Tax Amount</span>
                      <span className="text-slate-900 font-bold text-indigo-600">₹{calcTax(viewInvoice.items || []).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4 py-6 bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 print:bg-white print:text-slate-900 print:shadow-none print:border-t-2 print:border-slate-200 print:p-2 print:px-0">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] print:text-slate-400">Grand Total</p>
                      <p className="text-xs italic text-indigo-100 print:hidden">Authorized Signature Required</p>
                    </div>
                    <span className="text-4xl font-black tracking-tight leading-none">
                      ₹{viewInvoice.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 0}
                    </span>
                  </div>

                  <div className="mt-12 pt-8 flex justify-end print:block hidden">
                    <div className="w-48 text-center space-y-2">
                      <div className="h-12 border-b-2 border-slate-300"></div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authorized Signatory</p>
                      <p className="text-[9px] text-slate-400 italic">For Balaji Enterprises</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for your business!</p>
                <p className="text-[9px] text-slate-400 italic">Generated electronically on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Status Modal ────────────────────────────────────────────────── */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Change status for {statusInvoice?.invoiceNumber || statusInvoice?.id?.slice(0, 8)}.
            </DialogDescription>
          </DialogHeader>
          {statusInvoice && (
            <div className="py-4">
              <Label className="text-xs mb-2 block">New Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue={statusInvoice.status}
                onChange={(e) =>
                  statusMut.mutate({ id: statusInvoice.id, status: e.target.value })
                }
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ISSUED">ISSUED</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsStatusOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

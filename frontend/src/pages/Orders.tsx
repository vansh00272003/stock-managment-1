import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLogStore } from '@/store/logStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function Orders() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const addLog = useLogStore(state => state.addLog);

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (newOrder: any) => api.post('/orders', newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => alert('Create failed: ' + (error.response?.data?.message || error.message)),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsEditModalOpen(false);
      setEditingOrder(null);
    },
    onError: (error: any) => alert('Update failed: ' + (error.response?.data?.message || error.message)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get('productId') as string;
    const quantity = Number(formData.get('quantity'));
    const unitPrice = Number(formData.get('unitPrice'));
    const type = formData.get('type') as string;

    createOrderMutation.mutate({
      type,
      items: [{ productId, quantity, unitPrice }]
    });
    addLog({ user: 'Current User', action: 'CREATE', entity: 'Order', details: `Created ${type} order` });
  };

  const handleEditOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get('productId') as string;
    const quantity = Number(formData.get('quantity'));
    const unitPrice = Number(formData.get('unitPrice'));
    const type = formData.get('type') as string;

    updateOrderMutation.mutate({
      id: editingOrder.id,
      data: { type, items: [{ productId, quantity, unitPrice }] }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULFILLED': return <Badge variant="success">Fulfilled</Badge>;
      case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
      case 'APPROVED': return <Badge variant="default">Approved</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to get primary item summary from order
  const getItemsSummary = (order: any) => {
    if (!order.orderItems || order.orderItems.length === 0) return { name: 'N/A', qty: 0 };
    const items = order.orderItems;
    if (items.length === 1) {
      return { name: items[0].product?.name || 'Unknown', qty: items[0].quantity };
    }
    return { name: `${items[0].product?.name || 'Unknown'} +${items.length - 1} more`, qty: items.reduce((s: number, i: any) => s + i.quantity, 0) };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500">Manage incoming sales and outbound purchase orders.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Order
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-lg">Order History</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOrders ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10">No orders found.</TableCell></TableRow>
              ) : (
                orders.map((order: any) => {
                  const summary = getItemsSummary(order);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.type === 'SALES' ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-blue-500" />
                          )}
                          {order.type}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{summary.name}</TableCell>
                      <TableCell>{summary.qty}</TableCell>
                      <TableCell className="text-slate-500">{format(new Date(order.createdAt), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className="font-medium">₹{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 items-center">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingOrder(order);
                            setIsEditModalOpen(true);
                          }}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <select
                            className="text-xs border rounded p-1"
                            defaultValue={order.status}
                            onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="FULFILLED">Fulfilled</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Order Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Order Type</Label>
                <select id="type" name="type" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" required>
                  <option value="SALES">Sales Order (Outgoing)</option>
                  <option value="PURCHASE">Purchase Order (Incoming)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productId">Product</Label>
                <select id="productId" name="productId" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" required>
                  <option value="">Select a product...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Modify order details. This will replace existing items.</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleEditOrder}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Order Type</Label>
                  <select id="edit-type" name="type" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" defaultValue={editingOrder.type} required>
                    <option value="SALES">Sales Order</option>
                    <option value="PURCHASE">Purchase Order</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-productId">Product</Label>
                  <select id="edit-productId" name="productId" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" defaultValue={editingOrder.orderItems?.[0]?.productId} required>
                    <option value="">Select a product...</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input id="edit-quantity" name="quantity" type="number" min="1" defaultValue={editingOrder.orderItems?.[0]?.quantity} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-unitPrice">Unit Price (₹)</Label>
                    <Input id="edit-unitPrice" name="unitPrice" type="number" step="0.01" defaultValue={editingOrder.orderItems?.[0]?.unitPrice} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateOrderMutation.isPending}>
                  {updateOrderMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

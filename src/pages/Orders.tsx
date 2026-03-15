import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, FilterX, Trash2, Edit } from 'lucide-react';
import { useLogStore } from '@/store/logStore';

const initialOrders = [
  { id: 'PO-2026-001', type: 'PURCHASE', status: 'PENDING', date: '2026-03-15', total: 45000.00, user: 'Bob Manager' },
  { id: 'SO-2026-089', type: 'SALES', status: 'FULFILLED', date: '2026-03-14', total: 1299.99, user: 'Diana Sales' },
  { id: 'SO-2026-090', type: 'SALES', status: 'APPROVED', date: '2026-03-14', total: 2599.98, user: 'Diana Sales' },
  { id: 'PO-2026-002', type: 'PURCHASE', status: 'CANCELLED', date: '2026-03-10', total: 12000.00, user: 'Alice Admin' },
];

export default function Orders() {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState<any>(null);
  
  const addLog = useLogStore(state => state.addLog);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterUser('');
  };

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newOrder = {
      id: `${formData.get('orderType') === 'PURCHASE' ? 'PO' : 'SO'}-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      type: formData.get('orderType') as string,
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0],
      total: Number(formData.get('qty')) * Number(formData.get('price')),
      user: 'Current User',
    };
    setOrders([newOrder, ...orders]);
    addLog({ user: 'Current User', action: 'CREATE', entity: 'Order', details: `Created order ${newOrder.id}` });
    setIsCreateModalOpen(false);
  };

  const handleEditOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedOrder = {
      ...editingOrder,
      type: formData.get('orderType') as string,
      total: Number(formData.get('qty')) * Number(formData.get('price')),
    };
    setOrders(orders.map(o => o.id === editingOrder.id ? updatedOrder : o));
    addLog({ user: 'Current User', action: 'UPDATE', entity: 'Order', details: `Updated order ${updatedOrder.id}` });
    setIsEditModalOpen(false);
    setEditingOrder(null);
  };

  const handleStatusChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get('status') as string;
    setOrders(orders.map(o => o.id === statusOrder.id ? { ...o, status: newStatus } : o));
    addLog({ user: 'Current User', action: 'UPDATE', entity: 'Order Status', details: `Changed status of ${statusOrder.id} to ${newStatus}` });
    setIsStatusModalOpen(false);
    setStatusOrder(null);
  };

  const handleDelete = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    addLog({ user: 'Current User', action: 'DELETE', entity: 'Order', details: `Deleted order ${id}` });
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'ALL' || order.type === filterType;
    const matchStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const matchUser = !filterUser || order.user.toLowerCase().includes(filterUser.toLowerCase());
    const matchDateFrom = !filterDateFrom || new Date(order.date) >= new Date(filterDateFrom);
    const matchDateTo = !filterDateTo || new Date(order.date) <= new Date(filterDateTo);
    
    return matchSearch && matchType && matchStatus && matchUser && matchDateFrom && matchDateTo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500">Manage purchase and sales orders.</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" /> Create Order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Search Order ID..." 
                  className="pl-9" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALES">Sales</option>
              </Select>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Input 
                placeholder="Created By (User)" 
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap text-slate-500">From:</Label>
                  <Input 
                    type="date" 
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap text-slate-500">To:</Label>
                  <Input 
                    type="date" 
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={resetFilters} className="gap-2 shrink-0">
                <FilterX className="w-4 h-4" /> Reset Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium text-indigo-600">{order.id}</TableCell>
                    <TableCell>
                      <Badge variant={order.type === 'PURCHASE' ? 'outline' : 'secondary'}>
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{order.date}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>{order.user}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'PENDING' ? 'warning' : order.status === 'APPROVED' ? 'default' : order.status === 'FULFILLED' ? 'success' : 'destructive'}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setStatusOrder(order);
                          setIsStatusModalOpen(true);
                        }}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingOrder(order);
                        setIsEditModalOpen(true);
                      }}>
                        <Edit className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                    No orders found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Order Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Fill in the details to create a new purchase or sales order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrder}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="orderType">Order Type</Label>
                <Select id="orderType" name="orderType" required>
                  <option value="PURCHASE">Purchase Order (Restock)</option>
                  <option value="SALES">Sales Order (Fulfillment)</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select id="product" name="product" required>
                  <option value="1">ThinkPad X1 Carbon</option>
                  <option value="2">Dell UltraSharp 27"</option>
                  <option value="3">Ergo Standing Desk</option>
                  <option value="4">Herman Miller Aeron</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" name="qty" type="number" min="1" defaultValue="1" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Unit Price ($)</Label>
                  <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit">Create Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Update the details of the order.</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleEditOrder}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-orderType">Order Type</Label>
                  <Select id="edit-orderType" name="orderType" defaultValue={editingOrder.type} required>
                    <option value="PURCHASE">Purchase Order (Restock)</option>
                    <option value="SALES">Sales Order (Fulfillment)</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-qty">Quantity</Label>
                    <Input id="edit-qty" name="qty" type="number" min="1" defaultValue="1" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Unit Price ($)</Label>
                    <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={(editingOrder.total).toFixed(2)} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Order Status</DialogTitle>
            <DialogDescription>Update the status for order {statusOrder?.id}.</DialogDescription>
          </DialogHeader>
          {statusOrder && (
            <form onSubmit={handleStatusChange}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">New Status</Label>
                  <Select id="status" name="status" defaultValue={statusOrder.status} required>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="FULFILLED">Fulfilled</option>
                    <option value="CANCELLED">Cancelled</option>
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
    </div>
  );
}

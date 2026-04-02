import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MapPin, Package, RefreshCw, Layers } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function Stock() {
  const queryClient = useQueryClient();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [editingStock, setEditingStock] = useState<any>(null);

  // Queries
  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const response = await api.get('/stock/movements');
      return response.data;
    },
  });

  const { data: stockLevels = [], isLoading: isLoadingLevels } = useQuery({
    queryKey: ['stock-levels'],
    queryFn: async () => {
      const response = await api.get('/stock/levels');
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

  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/locations');
      return response.data;
    },
  });

  // Mutations
  const createMovementMutation = useMutation({
    mutationFn: (newMovement: any) => api.post('/stock/movements', newMovement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      setIsMovementModalOpen(false);
    },
    onError: (error: any) => {
      alert('Movement failed: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateStockLevelMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string, quantity: number }) => api.put(`/stock/levels/${id}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditStockModalOpen(false);
      setEditingStock(null);
    },
    onError: (error: any) => {
      alert('Update failed: ' + (error.response?.data?.message || error.message));
    }
  });

  const deleteStockLevelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/stock/levels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      alert('Delete failed: ' + (error.response?.data?.message || error.message));
    }
  });

  const createLocationMutation = useMutation({
    mutationFn: (newLocation: any) => api.post('/locations', newLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsLocationModalOpen(false);
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsEditLocationModalOpen(false);
      setEditingLocation(null);
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  // Handlers
  const handleAddMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const movementData = {
      productId: formData.get('productId'),
      fromLocationId: formData.get('fromLocationId') || null,
      toLocationId: formData.get('toLocationId') || null,
      quantity: Number(formData.get('quantity')),
      type: formData.get('type'),
      reason: formData.get('reason'),
    };
    createMovementMutation.mutate(movementData);
  };

  const handleUpdateStock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateStockLevelMutation.mutate({
      id: editingStock.id,
      quantity: Number(formData.get('quantity')),
    });
  };

  const handleCreateLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createLocationMutation.mutate({
      name: formData.get('name'),
      address: formData.get('address'),
    });
  };

  const handleUpdateLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateLocationMutation.mutate({
      id: editingLocation.id,
      data: {
        name: formData.get('name'),
        address: formData.get('address'),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock & Inventory Management</h1>
          <p className="text-slate-500">Track movements and manage warehouse locations.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="w-4 h-4" /> Sync
          </Button>
          <Button className="gap-2" onClick={() => setIsMovementModalOpen(true)}>
            <Plus className="w-4 h-4" /> New Movement
          </Button>
        </div>
      </div>

      <Tabs defaultValue="movements" className="w-full">
        <TabsList className="flex flex-col sm:flex-row h-auto w-full max-w-[600px] p-1 bg-slate-100/80 gap-1 border border-slate-200">
          <TabsTrigger value="movements" className="flex-1 py-2 text-xs sm:text-sm">Stock Movements</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 py-2 text-xs sm:text-sm">Current Inventory</TabsTrigger>
          <TabsTrigger value="locations" className="flex-1 py-2 text-xs sm:text-sm">Warehouses / Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Recent Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingMovements ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
                  ) : movements.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10">No movements recorded.</TableCell></TableRow>
                  ) : (
                    movements.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-slate-500 text-sm">
                          {format(new Date(m.createdAt), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{m.product?.name}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'INBOUND' ? 'success' : m.type === 'OUTBOUND' ? 'destructive' : 'secondary'}>
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.fromLocation?.name || '--'}</TableCell>
                        <TableCell>{m.toLocation?.name || '--'}</TableCell>
                        <TableCell className="text-right font-bold">{m.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                Stock by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLevels ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                  ) : stockLevels.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">No stock found in any warehouse.</TableCell></TableRow>
                  ) : (
                    stockLevels.map((sl: any) => (
                      <TableRow key={sl.id}>
                        <TableCell className="font-medium text-slate-700">{sl.location?.name}</TableCell>
                        <TableCell>{sl.product?.name}</TableCell>
                        <TableCell className="font-mono text-xs">{sl.product?.sku}</TableCell>
                        <TableCell className="text-right font-black text-indigo-600">{sl.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingStock(sl); setIsEditStockModalOpen(true); }}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(window.confirm('Remove this stock level entry?')) deleteStockLevelMutation.mutate(sl.id); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <div className="flex justify-end mb-4">
             <Button className="gap-2" size="sm" onClick={() => setIsLocationModalOpen(true)}>
              <Plus className="w-4 h-4" /> Add Warehouse
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Active Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLocations ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
                  ) : locations.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-10">No warehouses found.</TableCell></TableRow>
                  ) : (
                    locations.map((loc: any) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell className="text-slate-500">{loc.address || 'No address'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingLocation(loc); setIsEditLocationModalOpen(true); }}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(window.confirm('Delete this warehouse?')) deleteLocationMutation.mutate(loc.id); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Modal */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Movement</DialogTitle>
            <DialogDescription>Record stock entry, exit, or transfer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMovement}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="productId">Product</Label>
                <select id="productId" name="productId" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" required>
                  <option value="">Select a product...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Movement Type</Label>
                  <select id="type" name="type" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" required>
                    <option value="INBOUND">Stock In (+)</option>
                    <option value="OUTBOUND">Stock Out (-)</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fromLocationId">Source Location</Label>
                  <select id="fromLocationId" name="fromLocationId" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">None (Supplier/External)</option>
                    {locations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="toLocationId">Target Location</Label>
                  <select id="toLocationId" name="toLocationId" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">None (Customer/External)</option>
                    {locations.map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason / Notes</Label>
                <Input id="reason" name="reason" placeholder="e.g. Sales fulfillment, restock" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMovementMutation.isPending}>
                {createMovementMutation.isPending ? 'Processing...' : 'Confirm Movement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Modal */}
      <Dialog open={isEditStockModalOpen} onOpenChange={setIsEditStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>Directly update the quantity for {editingStock?.product?.name} at {editingStock?.location?.name}.</DialogDescription>
          </DialogHeader>
          {editingStock && (
            <form onSubmit={handleUpdateStock}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock-qty">Current Quantity</Label>
                  <Input id="stock-qty" name="quantity" type="number" defaultValue={editingStock.quantity} required />
                </div>
              </div>
              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsEditStockModalOpen(false)}>Cancel</Button>
                 <Button type="submit" disabled={updateStockLevelMutation.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Location Modal */}
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Warehouse</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLocation}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input id="name" name="name" placeholder="e.g. Main Warehouse" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="Location details..." />
              </div>
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsLocationModalOpen(false)}>Cancel</Button>
               <Button type="submit" disabled={createLocationMutation.isPending}>Save Location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={isEditLocationModalOpen} onOpenChange={setIsEditLocationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <form onSubmit={handleUpdateLocation}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Warehouse Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editingLocation.name} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" name="address" defaultValue={editingLocation.address} />
                </div>
              </div>
              <DialogFooter>
                 <Button type="button" variant="outline" onClick={() => setIsEditLocationModalOpen(false)}>Cancel</Button>
                 <Button type="submit" disabled={updateLocationMutation.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

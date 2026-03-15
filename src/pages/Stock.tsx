import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowDownRight, ArrowUpRight, Plus, RefreshCw, Loader2, Trash2, Edit } from 'lucide-react';
import { useLogStore } from '@/store/logStore';

const initialMovements = [
  { id: '1', date: '2026-03-15 09:30', product: 'ThinkPad X1 Carbon', type: 'INBOUND', qty: 50, location: 'Main Warehouse', user: 'Bob Manager' },
  { id: '2', date: '2026-03-14 14:15', product: 'Dell UltraSharp 27"', type: 'OUTBOUND', qty: 2, location: 'Retail Store A', user: 'Diana Sales' },
  { id: '3', date: '2026-03-14 11:00', product: 'Herman Miller Aeron', type: 'TRANSFER', qty: 5, location: 'Main -> Store B', user: 'Bob Manager' },
  { id: '4', date: '2026-03-13 16:45', product: 'Ergo Standing Desk', type: 'ADJUSTMENT', qty: -1, location: 'Main Warehouse', user: 'Alice Admin' },
];

export default function Stock() {
  const [movements, setMovements] = useState(initialMovements);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const addLog = useLogStore(state => state.addLog);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleAddMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productMap: Record<string, string> = {
      '1': 'ThinkPad X1 Carbon',
      '2': 'Dell UltraSharp 27"',
      '3': 'Ergo Standing Desk',
      '4': 'Herman Miller Aeron'
    };
    
    const locationMap: Record<string, string> = {
      'MAIN': 'Main Warehouse',
      'STORE_A': 'Retail Store A',
      'STORE_B': 'Retail Store B'
    };

    const newMovement = {
      id: Math.random().toString(),
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      product: productMap[formData.get('product') as string] || 'Unknown Product',
      type: formData.get('type') as string,
      qty: Number(formData.get('qty')),
      location: locationMap[formData.get('location') as string] || 'Unknown Location',
      user: 'Current User',
    };
    setMovements([newMovement, ...movements]);
    addLog({ user: 'Current User', action: 'CREATE', entity: 'Stock Movement', details: `Recorded ${newMovement.type} for ${newMovement.product}` });
    setIsAddModalOpen(false);
  };

  const handleEditMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedMovement = {
      ...editingMovement,
      qty: Number(formData.get('qty')),
      reason: formData.get('reason') as string,
    };
    setMovements(movements.map(m => m.id === editingMovement.id ? updatedMovement : m));
    addLog({ user: 'Current User', action: 'UPDATE', entity: 'Stock Movement', details: `Updated movement ${updatedMovement.id}` });
    setIsEditModalOpen(false);
    setEditingMovement(null);
  };

  const handleDelete = (id: string) => {
    setMovements(movements.filter(m => m.id !== id));
    addLog({ user: 'Current User', action: 'DELETE', entity: 'Stock Movement', details: `Deleted movement ${id}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Movements</h1>
          <p className="text-slate-500">Track inbound, outbound, and adjustments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} 
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" /> New Movement
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-lg">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-slate-500 text-xs">{movement.date}</TableCell>
                  <TableCell className="font-medium">{movement.product}</TableCell>
                  <TableCell>
                    {movement.type === 'INBOUND' && <Badge variant="success" className="gap-1"><ArrowDownRight className="w-3 h-3"/> Inbound</Badge>}
                    {movement.type === 'OUTBOUND' && <Badge variant="secondary" className="gap-1"><ArrowUpRight className="w-3 h-3"/> Outbound</Badge>}
                    {movement.type === 'TRANSFER' && <Badge variant="outline">Transfer</Badge>}
                    {movement.type === 'ADJUSTMENT' && <Badge variant="destructive">Adjustment</Badge>}
                  </TableCell>
                  <TableCell className={`font-mono font-medium ${movement.qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {movement.qty > 0 ? `+${movement.qty}` : movement.qty}
                  </TableCell>
                  <TableCell>{movement.location}</TableCell>
                  <TableCell>{movement.user}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingMovement(movement);
                      setIsEditModalOpen(true);
                    }}>
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(movement.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Stock Movement Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
            <DialogDescription>Log a manual stock adjustment, inbound delivery, or outbound shipment.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMovement}>
            <div className="grid gap-4 py-4">
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
                  <Label htmlFor="type">Movement Type</Label>
                  <Select id="type" name="type" required>
                    <option value="INBOUND">Inbound (+)</option>
                    <option value="OUTBOUND">Outbound (-)</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="ADJUSTMENT">Adjustment (+/-)</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" name="qty" type="number" defaultValue="1" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Select id="location" name="location" required>
                  <option value="MAIN">Main Warehouse</option>
                  <option value="STORE_A">Retail Store A</option>
                  <option value="STORE_B">Retail Store B</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason / Notes (Optional)</Label>
                <Input id="reason" name="reason" placeholder="e.g. Damaged goods, Supplier delivery" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit">Record Movement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Movement Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock Movement</DialogTitle>
            <DialogDescription>Update the quantity or notes for this movement.</DialogDescription>
          </DialogHeader>
          {editingMovement && (
            <form onSubmit={handleEditMovement}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Product</Label>
                  <Input value={editingMovement.product} disabled />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Movement Type</Label>
                    <Input value={editingMovement.type} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-qty">Quantity</Label>
                    <Input id="edit-qty" name="qty" type="number" defaultValue={editingMovement.qty} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-reason">Reason / Notes</Label>
                  <Input id="edit-reason" name="reason" defaultValue={editingMovement.reason || ''} placeholder="e.g. Damaged goods" />
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
    </div>
  );
}

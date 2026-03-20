import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Trash2, Edit } from 'lucide-react';
import { useLogStore } from '@/store/logStore';

const initialUsers = [
  { id: '1', name: 'Alice Admin', email: 'alice@enterprise.com', role: 'SUPER_ADMIN', status: 'Active' },
  { id: '2', name: 'Bob Manager', email: 'bob@enterprise.com', role: 'STOCK_MANAGER', status: 'Active' },
  { id: '3', name: 'Charlie Staff', email: 'charlie@enterprise.com', role: 'STANDARD_USER', status: 'Inactive' },
  { id: '4', name: 'Diana Sales', email: 'diana@enterprise.com', role: 'STANDARD_USER', status: 'Active' },
];

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const addLog = useLogStore(state => state.addLog);

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUser = {
      id: Math.random().toString(),
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: formData.get('status') === 'ACTIVE' ? 'Active' : 'Inactive',
    };
    setUsers([...users, newUser]);
    addLog({ user: 'Current User', action: 'CREATE', entity: 'User', details: `Created user ${newUser.name}` });
    setIsAddModalOpen(false);
  };

  const handleEditUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedUser = {
      ...editingUser,
      name: `${formData.get('firstName')} ${formData.get('lastName')}`,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      status: formData.get('status') === 'ACTIVE' ? 'Active' : 'Inactive',
    };
    setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
    addLog({ user: 'Current User', action: 'UPDATE', entity: 'User', details: `Updated user ${updatedUser.name}` });
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    setUsers(users.filter(u => u.id !== id));
    if (userToDelete) {
      addLog({ user: 'Current User', action: 'DELETE', entity: 'User', details: `Deleted user ${userToDelete.name}` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage employee access and roles.</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input placeholder="Search users..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : user.role === 'STOCK_MANAGER' ? 'secondary' : 'outline'}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'success' : 'destructive'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingUser(user);
                      setIsEditModalOpen(true);
                    }}>
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new employee account and assign their role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" placeholder="John" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Doe" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="john.doe@enterprise.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">System Role</Label>
                <Select id="role" name="role" required>
                  <option value="STANDARD_USER">Standard User (Staff/Sales)</option>
                  <option value="STOCK_MANAGER">Stock Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Account Status</Label>
                <Select id="status" name="status" required>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update employee account details.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input id="edit-firstName" name="firstName" defaultValue={editingUser.name.split(' ')[0]} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input id="edit-lastName" name="lastName" defaultValue={editingUser.name.split(' ').slice(1).join(' ')} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingUser.email} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">System Role</Label>
                  <Select id="edit-role" name="role" defaultValue={editingUser.role} required>
                    <option value="STANDARD_USER">Standard User (Staff/Sales)</option>
                    <option value="STOCK_MANAGER">Stock Manager</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Account Status</Label>
                  <Select id="edit-status" name="status" defaultValue={editingUser.status.toUpperCase()} required>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
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

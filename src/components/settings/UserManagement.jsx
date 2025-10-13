import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/api/entities";
import { Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await User.list();
            setUsers(data);
            setIsLoading(false);
        };
        fetchUsers();
    }, []);
    
    // NOTE: Base44 handles the actual user invitation logic.
    // This is a placeholder for the UI flow.
    const handleInvite = () => {
        if(!inviteEmail) return;
        alert(`An invitation would be sent to ${inviteEmail}. This is a UI demonstration.`);
        setInviteEmail('');
        setShowInvite(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold">User Management & Roles</h3>
                    <p className="text-sm text-slate-500">Invite and manage team members' access.</p>
                </div>
                <Button onClick={() => setShowInvite(!showInvite)}><Plus className="w-4 h-4 mr-2"/>Invite User</Button>
            </div>
            
            {showInvite && (
                <div className="p-4 border rounded-lg flex items-end gap-3">
                    <div className="flex-grow">
                        <Label>User Email</Label>
                        <Input type="email" placeholder="new.user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}/>
                    </div>
                    <Button onClick={handleInvite}><Send className="w-4 h-4 mr-2"/>Send Invite</Button>
                </div>
            )}

            <div className="border-t pt-6">
                <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium">{user.full_name}</div>
                                    <div className="text-sm text-slate-500">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Select defaultValue={user.role} disabled>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" disabled><Trash2 className="w-4 h-4 text-red-500"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SubscriptionLog } from '@/api/entities';
import { ListCollapse, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SubscriptionLogViewer() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const allLogs = await SubscriptionLog.list('-created_date', 100); // Get latest 100 logs
            setLogs(allLogs);
        } catch (error) {
            console.error('Error loading subscription logs:', error);
            toast.error("Failed to load audit logs.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListCollapse className="h-5 w-5 text-slate-600" />
                    Subscription Audit Logs
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="w-6 h-6 animate-spin inline-block"/></TableCell></TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center">No logs found.</TableCell></TableRow>
                        ) : (
                            logs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-sm text-slate-500">{format(new Date(log.created_date), 'MMM d, yyyy, HH:mm')}</TableCell>
                                    <TableCell>{log.admin_email}</TableCell>
                                    <TableCell>{log.user_email}</TableCell>
                                    <TableCell className="font-medium">{log.action}</TableCell>
                                    <TableCell>{log.details}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
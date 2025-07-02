"use client";

import React, { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { sendPasswordReset, demoteAdmin } from '../actions';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import papaparse from 'papaparse';

interface Registration {
    id: string;
    timestamp: string;
    eventName?: string;
    fullName?: string;
    email?: string;
    classSection?: string;
    [key: string]: any;
}

interface User {
    uid: string;
    email: string;
    role: 'admin' | 'student';
}

interface DashboardClientProps {
    registrations: Registration[];
    users: User[];
}

export default function DashboardClient(props: DashboardClientProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { user: adminUser } = useAuth();

    // --- Generic Action Handler ---
    const handleAction = (action: () => Promise<{success: boolean, message: string}>) => {
        startTransition(async () => {
            const result = await action();
            toast({
                title: result.success ? "Success" : "Error",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
        });
    };

    // --- Data Export ---
    const exportToPDF = (data: any[], title: string, headers: string[], bodyKeys: string[]) => {
        const doc = new jsPDF();
        doc.text(title, 14, 15);
        (doc as any).autoTable({
            head: [headers],
            body: data.map(item => bodyKeys.map(key => {
                if (key === 'timestamp') return format(new Date(item[key]), "PPp");
                return item[key] ?? 'N/A';
            })),
            startY: 20,
        });
        doc.save(`${title.replace(/ /g, '_')}_export.pdf`);
    };

    const exportToCSV = (data: any[], title: string) => {
        const processedData = data.map(item => ({
            ...item,
            timestamp: format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss")
        }));
        const csv = papaparse.unparse(processedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${title.replace(/ /g, '_')}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Component: Events Tab ---
    const EventsTab = () => {
        const [eventSearch, setEventSearch] = useState("");

        const staticEvents = [
            {
                name: 'Coding Hackathon',
                date: '15 July 2025',
                description: 'The Inter-School Coding Hackathon is a thrilling event where students collaborate to solve real-world problems. Open to all coding enthusiasts, it promotes creativity, teamwork, and innovation. Prizes will be awarded to the most outstanding solutions. Don’t miss it!',
            }
        ];

        const registrationsByEvent = props.registrations.reduce((acc, reg) => {
            const eventName = reg.eventName || 'General Event';
            if (!acc[eventName]) {
                acc[eventName] = [];
            }
            acc[eventName].push(reg);
            return acc;
        }, {} as Record<string, Registration[]>);

        const allEventNames = [...new Set([...staticEvents.map(e => e.name), ...Object.keys(registrationsByEvent)])];
        
        const events = allEventNames.map(eventName => {
            const staticEventData = staticEvents.find(e => e.name === eventName);
            const eventRegistrations = registrationsByEvent[eventName] || [];
            return {
                name: eventName,
                date: staticEventData?.date || 'N/A',
                description: staticEventData?.description || 'Details not available.',
                registrations: eventRegistrations,
            };
        });

        const filteredEvents = events.filter(event => event.name.toLowerCase().includes(eventSearch.toLowerCase()));

        return (
            <div>
                 <Input
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="max-w-sm mb-4"
                />
                <div className="border rounded-lg">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event Name</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Registrations</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                                <TableRow key={event.name}>
                                    <TableCell className="font-medium">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <span className="cursor-pointer hover:underline">{event.name}</span>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl">
                                                <DialogHeader>
                                                    <DialogTitle>{event.name}</DialogTitle>
                                                    <CardDescription>{event.date}</CardDescription>
                                                </DialogHeader>
                                                <p className="py-4 text-sm text-muted-foreground">{event.description}</p>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                    <TableCell>{event.date}</TableCell>
                                    <TableCell>{event.registrations.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" disabled={event.registrations.length === 0}>
                                                    View Registrations
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl">
                                                <DialogHeader>
                                                    <DialogTitle>Registrations for: {event.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex items-center gap-4 my-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="ml-auto" disabled={event.registrations.length === 0}>
                                                                <FileDown className="h-4 w-4 mr-2" />Export
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => exportToPDF(event.registrations, event.name, ['Name', 'Email', 'Class', 'Registered On'], ['fullName', 'email', 'classSection', 'timestamp'])}>Export as PDF</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => exportToCSV(event.registrations, event.name)}>Export as CSV</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Class</TableHead><TableHead>Registered On</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {event.registrations.length > 0 ? event.registrations.map(reg => (
                                                                <TableRow key={reg.id}>
                                                                    <TableCell>{reg.fullName}</TableCell>
                                                                    <TableCell>{reg.email}</TableCell>
                                                                    <TableCell>{reg.classSection}</TableCell>
                                                                    <TableCell>{format(new Date(reg.timestamp), "PPp")}</TableCell>
                                                                </TableRow>
                                                            )) : (
                                                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No registrations for this event yet.</TableCell></TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">No events found.</TableCell></TableRow>
                            )}
                        </TableBody>
                     </Table>
                </div>
            </div>
        )
    };

    // --- Component: Settings Tab ---
    const SettingsTab = () => {
        const admins = props.users; 
        return (
            <div className="space-y-8 max-w-2xl">
                <Card>
                    <CardHeader><CardTitle>Admin Account</CardTitle><CardDescription>Manage your account settings.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between"><p>Email: <strong>{adminUser?.email}</strong></p></div>
                        <Button variant="outline" onClick={() => handleAction(() => sendPasswordReset(adminUser!.email!))} disabled={isPending || !adminUser?.email}>
                            Send Password Reset Email
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Manage Admins</CardTitle><CardDescription>Only manually promoted users appear here. You can demote admins to students.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {admins.length > 0 ? admins.map(admin => (
                                    <TableRow key={admin.uid}>
                                        <TableCell>{admin.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="destructive" 
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Demote ${admin.email} to student? They will lose admin access.`)) {
                                                        handleAction(() => demoteAdmin(admin.uid));
                                                    }
                                                }}
                                                disabled={isPending || admin.uid === adminUser?.uid}
                                            >
                                                Demote
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                     <TableRow><TableCell colSpan={2} className="text-center h-24">No admins found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <p className="text-sm text-muted-foreground mt-4">To add a new admin, have them sign up as a student first, then manually change their role to 'admin' in the Firestore database.</p>
                    </CardContent>
                </Card>
            </div>
        )
    };
    

    // --- Main Render ---
    return (
        <Tabs defaultValue="registrations">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="registrations">Event Registrations</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="registrations" className="mt-6">
                <EventsTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
                <SettingsTab />
            </TabsContent>
        </Tabs>
    );
}

// Add this to your global types or a dedicated types file if you have one
declare global {
    interface Document {
        fonts: any;
    }
    interface Navigator {
        msSaveBlob?: (blob: any, defaultName?: string) => boolean
    }
}


"use client";

import React, { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShieldAlert, HeartPulse, Siren, MessageSquareQuote, Trash2, CheckCircle, Circle, FileDown, ArrowLeft, MoreHorizontal, Users, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { format } from 'date-fns';
import { updateReportStatus, deleteReport, sendPasswordReset, demoteAdmin } from '../actions';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import papaparse from 'papaparse';

interface Report {
    id: string;
    timestamp: string;
    status: 'New' | 'Reviewed';
    fullName?: string;
    email?: string;
    classSection?: string;
    details?: string;
    [key: string]: any;
}

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
    bullyingReports: Report[];
    emotionalHealthReports: Report[];
    schoolIncidentReports: Report[];
    otherConcernsReports: Report[];
    users: User[];
}

const reportCategories = [
    { id: 'bullying', title: 'Bullying Reports', icon: ShieldAlert, dataKey: 'bullyingReports' },
    { id: 'emotional', title: 'Emotional Health Reports', icon: HeartPulse, dataKey: 'emotionalHealthReports' },
    { id: 'incident', title: 'School Incident Reports', icon: Siren, dataKey: 'schoolIncidentReports' },
    { id: 'other', title: 'Other Concerns', icon: MessageSquareQuote, dataKey: 'otherConcernsReports' },
];

export default function DashboardClient(props: DashboardClientProps) {
    const [activeReportCategory, setActiveReportCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const { user: adminUser } = useAuth();

    const allReports: { [key: string]: Report[] } = {
        bullyingReports: props.bullyingReports,
        emotionalHealthReports: props.emotionalHealthReports,
        schoolIncidentReports: props.schoolIncidentReports,
        otherConcernsReports: props.otherConcernsReports
    };
    
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
    
    // --- Report Actions ---
    const handleDelete = (collectionName: string, id: string) => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;
        handleAction(() => deleteReport(collectionName, id));
    };

    const handleStatusChange = (collectionName: string, id: string, status: 'New' | 'Reviewed') => {
        handleAction(() => updateReportStatus(collectionName, id, status));
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

    // --- Component: Report Table ---
    const ReportTable = ({ reports, collectionName, title }: { reports: Report[], collectionName: string, title: string }) => {
        const filteredReports = reports.filter(r => 
            (r.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const columns = [
            { header: 'Name', key: 'fullName' },
            { header: 'Email', key: 'email' },
            { header: 'Class', key: 'classSection' },
            { header: 'Report', key: 'details' },
        ];

        return (
            <div>
                 <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="icon" onClick={() => setActiveReportCategory(null)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">{title} ({filteredReports.length})</h2>
                 </div>
                 <div className="flex items-center gap-4 mb-4">
                    <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <FileDown className="h-4 w-4 mr-2" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => exportToPDF(filteredReports, title, [...columns.map(c=>c.header), 'Status', 'Submitted'], [...columns.map(c=>c.key), 'status', 'timestamp'])}>Export as PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToCSV(filteredReports, title)}>Export as CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map(c => <TableHead key={c.key}>{c.header}</TableHead>)}
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.length > 0 ? filteredReports.map(item => (
                                <TableRow key={item.id}>
                                    {columns.map(c => <TableCell key={c.key} className={c.key === 'details' ? 'min-w-[300px]' : ''}>{item[c.key] || 'N/A'}</TableCell>)}
                                    <TableCell><Badge variant={item.status === 'New' ? 'destructive' : 'secondary'}>{item.status}</Badge></TableCell>
                                    <TableCell>{format(new Date(item.timestamp), "PPp")}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isPending}><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleStatusChange(collectionName, item.id, item.status === 'New' ? 'Reviewed' : 'New')}>
                                                    {item.status === 'New' ? <CheckCircle className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                                                    Mark as {item.status === 'New' ? 'Reviewed' : 'New'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(collectionName, item.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={columns.length + 3} className="text-center h-24">No reports found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
            </div>
        )
    };

    // --- Component: Events Tab ---
    const EventsTab = () => {
        const [eventSearch, setEventSearch] = useState("");
        const events = props.registrations.reduce((acc, reg) => {
            const eventName = reg.eventName || 'General Event';
            if (!acc[eventName]) {
                acc[eventName] = [];
            }
            acc[eventName].push(reg);
            return acc;
        }, {} as Record<string, Registration[]>);

        const filteredEvents = Object.entries(events).filter(([eventName]) => eventName.toLowerCase().includes(eventSearch.toLowerCase()));

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
                        <TableHeader><TableRow><TableHead>Event Name</TableHead><TableHead>Registrations</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredEvents.length > 0 ? filteredEvents.map(([eventName, registrations]) => (
                                <TableRow key={eventName}>
                                    <TableCell className="font-medium">{eventName}</TableCell>
                                    <TableCell>{registrations.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild><Button variant="outline">View Registrations</Button></DialogTrigger>
                                            <DialogContent className="max-w-4xl">
                                                <DialogHeader>
                                                    <DialogTitle>Registrations for: {eventName}</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex items-center gap-4 my-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto"><FileDown className="h-4 w-4 mr-2" />Export</Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => exportToPDF(registrations, eventName, ['Name', 'Email', 'Class', 'Registered On'], ['fullName', 'email', 'classSection', 'timestamp'])}>Export as PDF</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => exportToCSV(registrations, eventName)}>Export as CSV</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Class</TableHead><TableHead>Registered On</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {registrations.map(reg => (
                                                                <TableRow key={reg.id}><TableCell>{reg.fullName}</TableCell><TableCell>{reg.email}</TableCell><TableCell>{reg.classSection}</TableCell><TableCell>{format(new Date(reg.timestamp), "PPp")}</TableCell></TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="text-center h-24">No events found.</TableCell></TableRow>
                            )}
                        </TableBody>
                     </Table>
                </div>
            </div>
        )
    };

    // --- Component: Settings Tab ---
    const SettingsTab = () => {
        const admins = props.users.filter(u => u.role === 'admin');
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
                                {admins.map(admin => (
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
                                ))}
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
        <Tabs defaultValue="reports">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="registrations">Event Registrations</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="reports" className="mt-6">
                {activeReportCategory ? (
                    <ReportTable
                        reports={allReports[reportCategories.find(c => c.id === activeReportCategory)!.dataKey]}
                        collectionName={reportCategories.find(c => c.id === activeReportCategory)!.dataKey}
                        title={reportCategories.find(c => c.id === activeReportCategory)!.title}
                    />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {reportCategories.map(cat => (
                            <Card 
                                key={cat.id} 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                    setSearchTerm("");
                                    setActiveReportCategory(cat.id);
                                }}
                            >
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">{cat.title}</CardTitle>
                                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{allReports[cat.dataKey].length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {allReports[cat.dataKey].filter(r => r.status === 'New').length} new reports
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
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

    
    
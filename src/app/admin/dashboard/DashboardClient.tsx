
"use client";

import React, { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, CheckCircle, Circle, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { updateReportStatus, deleteReport } from '../actions';
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import papaparse from 'papaparse';

interface Report {
    id: string;
    timestamp: string;
    status: 'new' | 'handled';
    [key: string]: any;
}

interface DashboardClientProps {
    initialRegistrations: Report[];
    initialBullyingReports: Report[];
    initialCyberSecurityReports: Report[];
}

export default function DashboardClient({
    initialRegistrations,
    initialBullyingReports,
    initialCyberSecurityReports
}: DashboardClientProps) {
    const [registrations, setRegistrations] = useState(initialRegistrations);
    const [bullyingReports, setBullyingReports] = useState(initialBullyingReports);
    const [cyberSecurityReports, setCyberSecurityReports] = useState(initialCyberSecurityReports);

    const [searchReg, setSearchReg] = useState("");
    const [searchBully, setSearchBully] = useState("");
    const [searchCyber, setSearchCyber] = useState("");
    
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAction = (action: () => Promise<{success: boolean, message: string}>, successMessage: string, errorMessage: string) => {
        startTransition(async () => {
            const result = await action();
            toast({
                title: result.success ? "Success" : "Error",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
        });
    };
    
    const handleDelete = (collectionName: string, id: string) => {
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
        handleAction(() => deleteReport(collectionName, id), "Report deleted", "Failed to delete report");
    };

    const handleStatusChange = (collectionName: string, id: string, status: string) => {
        handleAction(() => updateReportStatus(collectionName, id, status), "Status updated", "Failed to update status");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <Badge variant="destructive">New</Badge>;
            case 'handled': return <Badge variant="secondary">Handled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredRegistrations = registrations.filter(item =>
        item.fullName?.toLowerCase().includes(searchReg.toLowerCase()) ||
        item.classSection?.toLowerCase().includes(searchReg.toLowerCase()) ||
        item.rollNumber?.toLowerCase().includes(searchReg.toLowerCase())
    );
    const filteredBullyingReports = bullyingReports.filter(item =>
        item.details?.toLowerCase().includes(searchBully.toLowerCase())
    );
    const filteredCyberSecurityReports = cyberSecurityReports.filter(item =>
        item.details?.toLowerCase().includes(searchCyber.toLowerCase())
    );

    const exportToPDF = (data: Report[], title: string, headers: string[], bodyKeys: string[]) => {
        const doc = new jsPDF();
        doc.text(title, 14, 15);
        (doc as any).autoTable({
            head: [headers],
            body: data.map(item => bodyKeys.map(key => item[key] ?? 'N/A')),
            startY: 20,
        });
        doc.save(`${title.replace(/ /g, '_')}_export.pdf`);
    };

    const exportToCSV = (data: Report[], title: string) => {
        const csv = papaparse.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${title.replace(/ /g, '_')}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const renderTable = (title: string, data: Report[], collectionName: string, searchVal: string, setSearchFn: (val: string) => void, columns: {header: string, key: string}[]) => (
        <div>
            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder={`Search in ${title}...`}
                    value={searchVal}
                    onChange={(e) => setSearchFn(e.target.value)}
                    className="max-w-sm"
                />
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            <FileDown className="h-4 w-4 mr-2" />
                            Export Data
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => exportToPDF(data, title, columns.map(c => c.header), columns.map(c => c.key))}>
                            Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToCSV(data, title)}>
                            Export as CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(col => <TableHead key={col.key}>{col.header}</TableHead>)}
                             <TableHead>Status</TableHead>
                             <TableHead>Submitted</TableHead>
                             <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map(item => (
                            <TableRow key={item.id}>
                                {columns.map(col => <TableCell key={col.key}>{item[col.key] || 'N/A'}</TableCell>)}
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell>{format(new Date(item.timestamp), "PPp")}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" disabled={isPending}>...</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {item.status === 'new' && (
                                                <DropdownMenuItem onClick={() => handleStatusChange(collectionName, item.id, 'handled')}>
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Handled
                                                </DropdownMenuItem>
                                            )}
                                            {item.status === 'handled' && (
                                                <DropdownMenuItem onClick={() => handleStatusChange(collectionName, item.id, 'new')}>
                                                   <Circle className="mr-2 h-4 w-4" /> Mark as New
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(collectionName, item.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={columns.length + 3} className="text-center">No reports found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
    
    return (
        <Tabs defaultValue="registrations">
            <TabsList>
                <TabsTrigger value="registrations">Event Registrations ({filteredRegistrations.length})</TabsTrigger>
                <TabsTrigger value="bullying">Bullying Reports ({filteredBullyingReports.length})</TabsTrigger>
                <TabsTrigger value="cybersecurity">Cyber Security Reports ({filteredCyberSecurityReports.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="registrations" className="mt-4">
                {renderTable('Event Registrations', filteredRegistrations, 'registrations', searchReg, setSearchReg, [
                    { header: 'Name', key: 'fullName' },
                    { header: 'Class', key: 'classSection' },
                    { header: 'Roll No.', key: 'rollNumber' },
                    { header: 'Contact', key: 'contactNumber' },
                    { header: 'Experience', key: 'codingExperience' },
                ])}
            </TabsContent>
            <TabsContent value="bullying" className="mt-4">
                {renderTable('Bullying Reports', filteredBullyingReports, 'bullyingReports', searchBully, setSearchBully, [
                    { header: 'Details', key: 'details' },
                ])}
            </TabsContent>
            <TabsContent value="cybersecurity" className="mt-4">
                {renderTable('Cyber Security Reports', filteredCyberSecurityReports, 'cyberSecurityReports', searchCyber, setSearchCyber, [
                    { header: 'Details', key: 'details' },
                ])}
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

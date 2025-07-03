
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import papaparse from 'papaparse';
import { Input } from '@/components/ui/input';

interface Registration {
  id: string;
  timestamp: string;
  eventName?: string;
  fullName?: string;
  email?: string;
  classSection?: string;
  rollNumber?: string;
  contactNumber?: string;
  codingExperience?: string;
  [key: string]: any;
}

interface RegistrationDetailsClientProps {
  eventName: string;
  registrations: Registration[];
}

export default function RegistrationDetailsClient({ eventName, registrations }: RegistrationDetailsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRegistrations = registrations.filter(reg =>
    (reg.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (reg.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (reg.classSection?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (reg.rollNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Registrations for: ${eventName}`, 14, 15);
    (doc as any).autoTable({
      head: [['Name', 'Email', 'Class', 'Roll No.', 'Contact', 'Coding Exp.', 'Registered On']],
      body: filteredRegistrations.map(reg => [
        reg.fullName ?? 'N/A',
        reg.email ?? 'N/A',
        reg.classSection ?? 'N/A',
        reg.rollNumber ?? 'N/A',
        reg.contactNumber ?? 'N/A',
        reg.codingExperience ?? 'N/A',
        format(new Date(reg.timestamp), "PPp")
      ]),
      startY: 20,
    });
    doc.save(`${eventName.replace(/ /g, '_')}_registrations.pdf`);
  };

  const exportToCSV = () => {
    const processedData = filteredRegistrations.map(reg => ({
      ...reg,
      timestamp: format(new Date(reg.timestamp), "yyyy-MM-dd HH:mm:ss")
    }));
    const csv = papaparse.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${eventName.replace(/ /g, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <Link href="/admin/dashboard">
                <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
            </Link>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={filteredRegistrations.length === 0}>
                        <FileDown className="h-4 w-4 mr-2" />Export
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={exportToPDF}>
                        Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportToCSV}>
                        Export as CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <Card>
        <CardHeader>
            <CardTitle className="text-2xl">Registrations for: {eventName}</CardTitle>
            <CardDescription>
                {registrations.length} registration(s) found for this event.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Input
                placeholder="Search registrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm mb-4"
            />
            <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Coding Exp.</TableHead>
                    <TableHead>Registered On</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {registrations.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No registrations for this event yet.
                    </TableCell>
                    </TableRow>
                ) : filteredRegistrations.length > 0 ? filteredRegistrations.map(reg => (
                    <TableRow key={reg.id}>
                    <TableCell>{reg.fullName}</TableCell>
                    <TableCell>{reg.email}</TableCell>
                    <TableCell>{reg.classSection}</TableCell>
                    <TableCell>{reg.rollNumber}</TableCell>
                    <TableCell>{reg.contactNumber}</TableCell>
                    <TableCell>{reg.codingExperience}</TableCell>
                    <TableCell>{format(new Date(reg.timestamp), "PPp")}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No registrations found matching your search.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}


"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileDown, RefreshCw, Wifi, WifiOff, ShieldAlert, HeartHandshake, Siren, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { sendPasswordReset, demoteAdmin } from '../actions';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Your client-side Firebase config
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import papaparse from 'papaparse';
import Link from 'next/link';

interface Registration {
  id: string;
  timestamp: string;
  eventName?: string;
  [key: string]: any;
}

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'student';
}

interface Report {
    id: string;
    timestamp: string;
    type: string; // This matches your Firestore field
    category: string; // This is computed for UI display
    name: string;
    classSection: string;
    description: string;
}

interface DashboardClientProps {
  registrations: Registration[];
  users: User[];
  reports: Report[];
}

export default function DashboardClient(props: DashboardClientProps) {
  const [registrations, setRegistrations] = useState<Registration[]>(props.registrations);
  const [users, setUsers] = useState<User[]>(props.users);
  const [reports, setReports] = useState<Report[]>(props.reports);
  const [isPending, startTransition] = useTransition();
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  // Real-time listener for registrations
  useEffect(() => {
    if (!adminUser) return;

    const registrationsQuery = query(
      collection(db, 'registrations'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeRegistrations = onSnapshot(
      registrationsQuery,
      (snapshot) => {
        const registrationsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() ? 
              data.timestamp.toDate().toISOString() : 
              (data.timestamp || new Date().toISOString()),
          } as Registration;
        });
        
        setRegistrations(registrationsData);
        setLastUpdated(new Date());
        setIsConnected(true);
      },
      (error) => {
        console.error('Error in registrations real-time listener:', error);
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Real-time updates for registrations temporarily unavailable",
          variant: "destructive",
        });
      }
    );

    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);
      },
      (error) => {
        console.error('Error in users real-time listener:', error);
      }
    );
    
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeReports = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const reportsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const typeToCategory = {
                'bullying': 'Bullying Reports',
                'mental_health': 'Mental Health Reports', 
                'incident': 'School Incidents',
                'other': 'Other Issues'
            };
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.() ?
                    data.timestamp.toDate().toISOString() :
                    (data.timestamp || new Date().toISOString()),
                type: data.type || 'other',
                category: typeToCategory[data.type as keyof typeof typeToCategory] || 'Other Issues',
                name: data.name || 'Anonymous',
                classSection: data.classSection || 'N/A',
                description: data.description || 'No description provided.',
            } as Report;
        });
        setReports(reportsData);
      },
      (error) => {
          console.error('Error in reports real-time listener:', error);
          toast({
              title: "Connection Error",
              description: "Real-time updates for reports temporarily unavailable",
              variant: "destructive",
          });
      }
    );

    return () => {
      unsubscribeRegistrations();
      unsubscribeUsers();
      unsubscribeReports();
    };
  }, [adminUser, toast]);

  const handleAction = (action: () => Promise<{ success: boolean, message: string }>) => {
    startTransition(async () => {
      const result = await action();
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    });
  };

  const exportToPDF = (data: any[], title: string, headers: string[], bodyKeys: string[]) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    (doc as any).autoTable({
      head: [headers],
      body: data.map(item =>
        bodyKeys.map(key => {
          if (key === 'timestamp') {
            try {
              return format(new Date(item[key]), "PPp");
            } catch (e) {
              return item[key] || 'N/A';
            }
          }
          return item[key] ?? 'N/A';
        })
      ),
      startY: 20,
    });
    doc.save(`${title.replace(/ /g, '_')}_export.pdf`);
  };

  const exportToCSV = (data: any[], title: string) => {
    const processedData = data.map(item => ({
      ...item,
      timestamp: (() => {
        try {
          return format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss");
        } catch (e) {
          return item.timestamp || 'N/A';
        }
      })()
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

  const EventsTab = () => {
    const [eventSearch, setEventSearch] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [registrationSearch, setRegistrationSearch] = useState("");
  
    const staticEvents = [
      {
        name: 'Coding Hackathon',
        date: '15 July 2025',
        description: 'The Inter-School Coding Hackathon is a thrilling event where students collaborate to solve real-world problems. Open to all coding enthusiasts, it promotes creativity, teamwork, and innovation. Prizes will be awarded to the most outstanding solutions. Do not miss it!',
      }
    ];
  
    // Group registrations by event name
    const registrationsByEvent = registrations.reduce((acc, reg) => {
      const eventName = reg.eventName || 'General Event';
      if (!acc[eventName]) {
        acc[eventName] = [];
      }
      acc[eventName].push(reg);
      return acc;
    }, {} as Record<string, Registration[]>);
  
    // Get all unique event names from both static events and registrations
    const allEventNames = [...new Set([
      ...staticEvents.map(e => e.name), 
      ...Object.keys(registrationsByEvent)
    ])];
  
    // Create events array with proper data
    const events = allEventNames.map(eventName => {
      const staticEventData = staticEvents.find(e => e.name === eventName);
      const eventRegistrations = registrationsByEvent[eventName] || [];
      
      return {
        name: eventName,
        date: staticEventData?.date || 'N/A',
        description: staticEventData?.description || 'Details not available.',
        registrations: eventRegistrations,
        registrationCount: eventRegistrations.length,
      };
    });
  
    // Filter events based on search
    const filteredEvents = events.filter(event => 
      event.name.toLowerCase().includes(eventSearch.toLowerCase())
    );
  
    // If an event is selected, show its registrations
    if (selectedEvent) {
      const eventData = events.find(e => e.name === selectedEvent);
      const filteredRegistrations = eventData?.registrations.filter(reg => 
        (reg.fullName || '').toLowerCase().includes(registrationSearch.toLowerCase()) ||
        (reg.contactNumber || '').toLowerCase().includes(registrationSearch.toLowerCase()) ||
        (reg.classSection || '').toLowerCase().includes(registrationSearch.toLowerCase()) ||
        (reg.rollNumber || '').toLowerCase().includes(registrationSearch.toLowerCase())
      ) || [];

      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" onClick={() => { setSelectedEvent(null); setRegistrationSearch(""); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={filteredRegistrations.length === 0}>
                    <FileDown className="h-4 w-4 mr-2" />Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() =>
                    exportToPDF(
                      filteredRegistrations,
                      `${selectedEvent} Registrations`,
                      ['Name', 'Contact', 'Class', 'Roll No', 'Coding Experience', 'Registered On'],
                      ['fullName', 'contactNumber', 'classSection', 'rollNumber', 'codingExperience', 'timestamp']
                    )}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToCSV(filteredRegistrations, `${selectedEvent} Registrations`)}>
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registrations for: {selectedEvent}</CardTitle>
              <CardDescription>{filteredRegistrations.length} registration(s) found for this event.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search registrations..."
                value={registrationSearch}
                onChange={(e) => setRegistrationSearch(e.target.value)}
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
                    {filteredRegistrations.length > 0 ? filteredRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.fullName || 'N/A'}</TableCell>
                        <TableCell>{reg.email || 'N/A'}</TableCell>
                        <TableCell>{reg.classSection || 'N/A'}</TableCell>
                        <TableCell>{reg.rollNumber || 'N/A'}</TableCell>
                        <TableCell>{reg.contactNumber || 'N/A'}</TableCell>
                        <TableCell>{reg.codingExperience || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(reg.timestamp), 'PPp')}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {registrationSearch ? 'No registrations match your search.' : 'No registrations for this event yet.'}
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
  
    return (
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Search events..."
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            {isConnected ? (
              <><Wifi className="h-4 w-4 text-green-500" /> Live</>
            ) : (
              <><WifiOff className="h-4 w-4 text-red-500" /> Offline</>
            )}
             (Last: {format(lastUpdated, "HH:mm:ss")})
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{registrations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allEventNames.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
        </div>
  
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
                        
                        {/* Show recent registrations in dialog */}
                        {event.registrations.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Recent Registrations:</h4>
                            <div className="max-h-48 overflow-y-auto">
                              {event.registrations.slice(0, 5).map((reg, idx) => (
                                <div key={reg.id} className="text-sm p-2 border-b">
                                  <div className="font-medium">{reg.fullName || 'Name not provided'}</div>
                                  <div className="text-muted-foreground">
                                    {reg.classSection || 'Class not provided'} | 
                                    {reg.contactNumber || 'Contact not provided'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(reg.timestamp), "PPp")}
                                  </div>
                                </div>
                              ))}
                              {event.registrations.length > 5 && (
                                <div className="text-xs text-muted-foreground p-2">
                                  +{event.registrations.length - 5} more registrations
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>
                    <span className={event.registrationCount > 0 ? "font-semibold" : ""}>
                      {event.registrationCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedEvent(event.name)}
                    >
                      View Registrations
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">No events found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const ReportsTab = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const reportCategories = [
        { name: 'Bullying Reports', icon: ShieldAlert, description: "Review reports related to bullying incidents." },
        { name: 'Mental Health Reports', icon: HeartHandshake, description: "Access confidential mental health support requests." },
        { name: 'School Incidents', icon: Siren, description: "View reports about general school incidents." },
        { name: 'Other Issues', icon: AlertCircle, description: "See all other miscellaneous reports." },
    ];

    if (selectedCategory) {
        const categoryData = reportCategories.find(c => c.name === selectedCategory);
        const filteredReports = reports
            .filter(report => report.category === selectedCategory)
            .filter(report => 
                report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.classSection.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.description.toLowerCase().includes(searchTerm.toLowerCase())
            );

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <Button variant="outline" onClick={() => { setSelectedCategory(null); setSearchTerm(""); }}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Categories
                    </Button>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" disabled={filteredReports.length === 0}>
                                <FileDown className="h-4 w-4 mr-2" />Export
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() =>
                                exportToPDF(
                                  filteredReports,
                                  selectedCategory,
                                  ['Name', 'Class & Section', 'Description', 'Submitted On'],
                                  ['name', 'classSection', 'description', 'timestamp']
                                )}>
                                Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportToCSV(filteredReports, selectedCategory)}>
                                Export as CSV
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {categoryData?.icon && <categoryData.icon className="h-6 w-6" />}
                            {selectedCategory}
                        </CardTitle>
                        <CardDescription>{filteredReports.length} report(s) found in this category.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Input
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm mb-4"
                          />
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Class & Section</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Submitted On</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.length > 0 ? filteredReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{report.name}</TableCell>
                                            <TableCell>{report.classSection}</TableCell>
                                            <TableCell className="max-w-md truncate">{report.description}</TableCell>
                                            <TableCell>{format(new Date(report.timestamp), 'PPp')}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">No reports found for this category.</TableCell>
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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Report Categories</h2>
                <p className="text-muted-foreground">Select a category to view submitted reports.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportCategories.map(category => {
                    const Icon = category.icon;
                    const count = reports.filter(r => r.category === category.name).length;
                    
                    return (
                        <Card key={category.name} className="hover:shadow-xl transition-shadow cursor-pointer flex flex-col" onClick={() => setSelectedCategory(category.name)}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Icon className="h-8 w-8 text-primary-foreground" />
                                    <div className="text-2xl font-bold">{count}</div>
                                </div>
                                <CardTitle>{category.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
  };

  const SettingsTab = () => {
    return (
      <div className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Admin Account</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p>Email: <strong>{adminUser?.email}</strong></p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleAction(() => sendPasswordReset(adminUser!.email!))}
              disabled={isPending || !adminUser?.email}
            >
              Send Password Reset Email
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Admins</CardTitle>
            <CardDescription>Only manually promoted users appear here. You can demote admins to students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? users.map(admin => (
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
                  <TableRow><TableCell colSpan={2} className="text-center h-24">No other admins found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground mt-4">
              To add a new admin, have them sign up as a student first, then manually change their role to 'admin' in the Firestore database.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ProjectReportTab = () => {
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Helper to fetch image and convert to Base64
    const getImageAsBase64 = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok for ${url}`);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error fetching image for PDF:", error);
        return null; // Return null if image fails to load
      }
    };
    
    const generateProjectReport = async () => {
        setIsGeneratingReport(true);
        toast({ title: "Generating Report...", description: "Please wait while the PDF is being created." });

        const doc = new jsPDF();
        let y = 15; // Vertical position tracker
        const pageHeight = doc.internal.pageSize.height;
        const leftMargin = 15;
        const contentWidth = doc.internal.pageSize.width - (leftMargin * 2);

        const addPageIfNeeded = (spaceNeeded: number) => {
            if (y + spaceNeeded > pageHeight - 20) {
                doc.addPage();
                y = 15;
            }
        };
        
        // --- Title ---
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("🧠 Mentora – The School Support Chatbot", doc.internal.pageSize.width / 2, y, { align: 'center' });
        y += 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Final Project Report", doc.internal.pageSize.width / 2, y, { align: 'center' });
        y += 7;
        doc.setFontSize(12);
        doc.text("July 2025", doc.internal.pageSize.width / 2, y, { align: 'center' });
        y += 15;

        // --- Introduction ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("1. Introduction to the Problem", leftMargin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const introText = "Today’s students face a wide range of challenges — academic stress, mental health issues, cyberbullying, peer pressure, and a lack of confidence in asking for help. Many students feel isolated, anxious, or afraid to speak up due to fear of judgment or not knowing where to go. While schools offer support through teachers and counselors, these resources are not always accessible or available when students need them most.\n\nMentora was developed to fill this gap — a 24/7 digital companion designed for school students. Whether it’s asking for emotional help, dealing with a bully, understanding a homework problem, or staying updated about school events — Mentora is there, always listening, always helping.\n\nBuilt as a web-based chatbot system, it integrates multiple areas of student life into one friendly interface, while giving school administrators a simple dashboard to manage events, reports, and feedback — all in real time.";
        const introLines = doc.splitTextToSize(introText, contentWidth);
        doc.text(introLines, leftMargin, y);
        y += introLines.length * 5 + 10;
        
        addPageIfNeeded(80);

        // --- 5W1H Canvas ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("2. 5W1H Canvas", leftMargin, y);
        y += 7;
        (doc as any).autoTable({
            startY: y,
            head: [['Question', 'Answer']],
            body: [
                ['Who?', 'School students aged 12–17, and school admins or counselors who support them'],
                ['What?', 'A full-featured chatbot website for academic help, mental wellness, event registration, cyber safety, and anonymous reporting'],
                ['When?', 'Available 24/7 for both students and admins'],
                ['Where?', 'Accessible from any browser-based device (mobile, tablet, desktop)'],
                ['Why?', 'To reduce hesitation in asking for help, provide confidential support, and centralize school-related tools'],
                ['How?', 'Developed using Next.js, Firebase, Tailwind UI, Dialogflow agents, and OpenAI integration'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [230, 230, 250] }, // Light Lavender
        });
        y = (doc as any).lastAutoTable.finalY + 10;

        addPageIfNeeded(90);

        // --- Empathy Map ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("3. Empathy Map (Student-Centric)", leftMargin, y);
        y += 7;
        (doc as any).autoTable({
            startY: y,
            head: [['SAYS', 'THINKS']],
            body: [
                [
                  '"I\'m too stressed to study."\n"No one understands how I feel."', 
                  '"Will people think I\'m weak if I ask for help?"\n"Maybe this isn\'t serious enough to talk about."'
                ],
            ],
            theme: 'grid',
            headStyles: { fillColor: [119, 221, 167] }, // Pastel Green
        });
        y = (doc as any).lastAutoTable.finalY + 5;
        (doc as any).autoTable({
            startY: y,
            head: [['DOES', 'FEELS']],
            body: [
                 [
                  'Avoids teachers or counselors\nLooks for answers online alone', 
                  'Anxious, isolated, misunderstood\nOverwhelmed, stuck, helpless'
                 ],
            ],
            theme: 'grid',
            headStyles: { fillColor: [119, 221, 167] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
        
        addPageIfNeeded(60);

        // --- Key Challenges ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("4. Key Challenges Faced", leftMargin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const challenges = [
            "SendGrid API Integration: Initially used for email confirmations, setting it up with environment variables proved difficult and was eventually removed.",
            "Web Hosting: Hosting on Firebase required reworking of routing and build steps, especially for API routes.",
            "Dialogflow Webhook Setup: Managing secure communication between Dialogflow and the backend webhook took multiple debugging sessions.",
            "Chatbot Integration: Using multiple agents (Mental Health, Cyber Security, Reports) and switching them cleanly on different pages was complex.",
            "Realtime Admin Dashboard: Syncing Firestore changes to the frontend in real time needed careful Firestore rule design.",
            "No Prior Dialogflow Experience: Understanding context handling, slot filling, and follow-up flows took time but paid off in the end.",
        ];
        challenges.forEach(item => {
            const lines = doc.splitTextToSize(`- ${item}`, contentWidth);
            doc.text(lines, leftMargin, y);
            y += lines.length * 5 + 2;
            addPageIfNeeded(20);
        });
        y += 5;
        
        doc.addPage();
        y = 15;

        // --- Development Screenshots ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("5. Development Screenshots", leftMargin, y);
        y += 7;

        const screenshotPaths = [
            { path: '/mental.jpg', title: 'Mental Health chatbot interface' },
            { path: '/homework.jpg', title: 'Homework Help section' },
            { path: '/event.jpg', title: 'Event Registration form' },
            { path: '/bully.png', title: 'Cyber Bullying Support chatbot' },
            { path: '/cyber.webp', title: 'Cyber Security tips chatbot' },
            { path: '/reports.jpg', title: 'Report Chatbot with confirmation logic' },
        ];

        for (const shot of screenshotPaths) {
            addPageIfNeeded(85);
            const imgData = await getImageAsBase64(shot.path);
            if (imgData) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "italic");
                doc.text(shot.title, leftMargin, y);
                y += 5;

                const imgProps = doc.getImageProperties(imgData);
                const imgWidth = contentWidth * 0.8;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                doc.addImage(imgData, imgProps.fileType, leftMargin + (contentWidth * 0.1), y, imgWidth, imgHeight);
                y += imgHeight + 10;
            }
        }
        
        addPageIfNeeded(70);

        // --- Enhancing School Life ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("6. How Mentora Enhances School Life", leftMargin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const enhancements = [
            "24/7 Access: Students can reach out anytime — even outside school hours.",
            "Safe & Confidential: Students can share personal concerns without fear of judgment.",
            "Centralized Tool: Combines academic help, wellness, event info, and safety tools in one platform.",
            "Proactive Support: Encourages early reporting of bullying or emotional struggles.",
            "Data-Driven Admin Panel: Helps school staff spot patterns, track events, and manage feedback.",
        ];
        enhancements.forEach(item => {
            const lines = doc.splitTextToSize(`- ${item}`, contentWidth);
            doc.text(lines, leftMargin, y);
            y += lines.length * 5 + 2;
        });
        y += 5;
        
        addPageIfNeeded(60);

        // --- Limitations & Future Scope ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("7. Current Limitations", leftMargin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const limitations = [
            "Not a replacement for real human counselors or psychologists.",
            "Bot responses are based on training phrases — lacks true conversational depth.",
            "No built-in crisis detection or escalation logic.",
            "English-only; may not work for students more comfortable in other languages.",
            "Web-only (no mobile app version yet)",
        ];
        limitations.forEach(item => {
            const lines = doc.splitTextToSize(`- ${item}`, contentWidth - 5);
            doc.text(lines, leftMargin + 5, y);
            y += lines.length * 5 + 2;
        });
        y += 5;

        addPageIfNeeded(80);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("8. Future Improvements", leftMargin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const futureScope = [
            "🎙️ Voice Chat Support – To make the chatbot even more accessible",
            "📱 Mobile App Version – Native app for Android and iOS with push notifications",
            "🌐 Multi-language Support – Adding Hindi or regional languages",
            "📊 Sentiment Detection – Adjust bot tone or flag urgent conversations",
            "🗓️ Calendar Sync – Let students add school events to personal calendars",
            "🏆 Gamification – Encourage usage with badges, points, and streaks",
            "👨‍🏫 Counselor Integration Panel – Secure portal for school counselors to follow up directly"
        ];
        futureScope.forEach(item => {
            const lines = doc.splitTextToSize(item, contentWidth - 5);
            doc.text(lines, leftMargin + 5, y);
            y += lines.length * 5 + 2;
        });

        // --- Save the PDF ---
        doc.save("Mentora_Hub_Project_Report.pdf");
        setIsGeneratingReport(false);
        toast({ title: "Success!", description: "The project report has been downloaded." });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Documentation</CardTitle>
                <CardDescription>
                    Generate a complete project report in PDF format. This includes an overview,
                    design artifacts, challenges, and future scope.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    The generated report provides a comprehensive summary of the Mentora Hub project,
                    suitable for documentation, presentation, or review purposes.
                </p>
            </CardContent>
            <CardFooter>
                <Button onClick={generateProjectReport} disabled={isGeneratingReport}>
                    <Download className="mr-2 h-4 w-4" />
                    {isGeneratingReport ? 'Generating...' : 'Download PDF Report'}
                </Button>
            </CardFooter>
        </Card>
    );
  };


  return (
    <Tabs defaultValue="registrations">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="registrations">Event Registrations</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="report-generator">Project Report</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="registrations" className="mt-6">
        <EventsTab />
      </TabsContent>
      <TabsContent value="reports" className="mt-6">
        <ReportsTab />
      </TabsContent>
       <TabsContent value="report-generator" className="mt-6">
        <ProjectReportTab />
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

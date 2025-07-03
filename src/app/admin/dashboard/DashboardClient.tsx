"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { sendPasswordReset, demoteAdmin } from '../actions';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

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

interface DashboardClientProps {
  registrations: Registration[];
  users: User[];
}

export default function DashboardClient(props: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

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
        description: staticEventData?.description || (staticEventData ? staticEventData.description : 'Details not available.'),
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
                    <Button asChild variant="outline">
                      <Link href={`/admin/registrations/${encodeURIComponent(event.name)}`}>
                        View Registrations
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No events found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const SettingsTab = () => {
    const admins = props.users;
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
            <p className="text-sm text-muted-foreground mt-4">
              To add a new admin, have them sign up as a student first, then manually change their role to 'admin' in the Firestore database.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

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
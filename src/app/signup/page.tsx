
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, type UserCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BotMessageSquare } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let userCredential: UserCredential | undefined;
    try {
      // Step 1: Create the user in Firebase Authentication
      userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    } catch (error: any) {
      console.error('Sign up failed during auth creation:', error);
      
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already registered. Please try logging in instead.';
      } else {
        description = error.message || description;
      }

      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: description,
      });
      return; // Stop the function if auth creation fails
    }

    try {
      // Step 2: If auth creation was successful, create the user document in Firestore
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: 'student', // Default role for all new sign-ups
      });

      toast({ title: 'Success', description: 'Your account has been created. Please log in.' });
      router.push('/login');
    } catch (error: any) {
        console.error('Sign up failed during Firestore document creation:', error);
        // This is a critical error. The user has an auth account but no profile document.
        toast({
            variant: 'destructive',
            title: 'Account Creation Incomplete',
            description: "Your account was created, but we couldn't save your profile due to a database error. Please check Firestore permissions.",
            duration: 10000 // Give more time to read
        });
        // Still redirect to login, they have an account they can use, though it will be limited.
        router.push('/login');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <BotMessageSquare size={40} className="text-primary-foreground mr-2" />
            <CardTitle className="text-2xl">Create Account</CardTitle>
          </div>
          <CardDescription>Enter your email and password to sign up</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="student@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing up...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

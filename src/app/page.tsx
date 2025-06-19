
"use client";
// import { useEffect } from 'react'; // No longer needed for DialogflowContext
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquareText, NotebookPen, CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MentoraHeader from '@/components/mentora/Header';
// import { useDialogflow } from '@/contexts/DialogflowContext'; // Removed

const cardData = [
  {
    href: '/mental-health',
    icon: MessageSquareText,
    title: 'Mental Health Support',
    description: 'A safe space to talk, reflect, and find resources for your well-being.',
  },
  {
    href: '/homework-help',
    icon: NotebookPen,
    title: 'Homework Helper Bot',
    description: 'Get assistance with your homework questions and understand complex topics.',
  },
  {
    href: '/activities',
    icon: CalendarDays,
    title: 'Activities Assistant',
    description: 'Stay updated on school events, clubs, and extracurricular activities.',
  },
];

const benefits = [
  "Instant, 24/7 access to support and information.",
  "Personalized assistance tailored to your needs.",
  "A friendly companion for your academic journey.",
  "Confidential and secure platform for your queries."
];

export default function HomePage() {
  // const { setConfig } = useDialogflow(); // Removed

  // useEffect(() => { // Removed
  //   setConfig(null); // No chatbot on the homepage
  // }, [setConfig]);

  return (
    <>
      <MentoraHeader
        isHomePage
        title={<span className="font-headline">👋 Welcome to Mentora Hub</span>}
        subtitle={<span className="font-headline">Your All-in-One Student Support Companion</span>}
        description="Navigating student life can be challenging. Mentora Hub is here to provide you with instant support for mental wellness, homework queries, and staying updated with school activities. Explore our features and let Mentora be your guide!"
      />
      <div className="container mx-auto py-12 px-4 md:px-8">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 font-headline text-primary-foreground">Explore Mentora Hub</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {cardData.map((card) => (
              <Link href={card.href} key={card.title} passHref={false}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col bg-card hover:border-accent">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <card.icon className="w-12 h-12 text-accent" />
                    </div>
                    <CardTitle className="text-center font-headline">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription className="text-center">{card.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-16 bg-primary/5 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-8 font-headline text-primary-foreground">Why Mentora?</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Students collaborating" 
                width={600} 
                height={400} 
                className="rounded-lg shadow-md"
                data-ai-hint="student wellness education" 
              />
            </div>
            <div className="md:w-1/2">
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="h-5 w-5 text-accent mr-2 mt-1 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="text-center py-12 bg-accent/20 rounded-lg">
          <h2 className="text-3xl font-bold mb-4 font-headline text-accent-foreground">Ready to Engage?</h2>
          <p className="text-lg text-foreground/90 mb-6">
            Dive into Mentora Hub and discover how we can support your journey.
          </p>
          <Link href="/mental-health" passHref={false}>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Get Started with Mental Health Support
            </Button>
          </Link>
        </section>
      </div>
    </>
  );
}

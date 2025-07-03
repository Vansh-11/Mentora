
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { NotebookPen, CalendarDays, Shield, ShieldCheck, Megaphone } from 'lucide-react';

interface CardData {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const cardData: CardData[] = [
    {
    href: '/mental-health',
    title: 'Mental Health Support',
    description: 'A safe space to talk about your feelings, manage stress, and find well-being resources.',
    icon: Shield,
  },
  {
    href: '/homework-help',
    title: 'Homework Help',
    description: 'Get assistance with challenging subjects like Physics, Chemistry, and English.',
    icon: NotebookPen,
  },
  {
    href: '/activities',
    title: 'Activities & Events',
    description: 'View upcoming and completed school events. Register for activities and see event details.',
    icon: CalendarDays,
  },
  {
    href: '/bullying-help',
    title: 'Bullying Support',
    description: 'Get help and support for bullying situations in a confidential space.',
    icon: Shield,
  },
   {
    href: '/cyber-security',
    title: 'Cyber Security Help',
    description: 'Get help with online safety, scams, and protecting your digital identity.',
    icon: ShieldCheck,
  },
  {
    href: '/report-an-issue',
    title: 'Report an Issue',
    description: 'Confidential reporting for bullying, mental health concerns, or other school incidents.',
    icon: Megaphone,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        isHomePage={true} 
        title="Welcome to Mentora Hub"
        subtitle="Your All-in-One Student Support Companion"
        description="Navigate through our services for mental well-being, academic assistance, and exploring school activities. Mentora is here to help you thrive."
      />
      <main className="flex-grow container mx-auto py-8 md:py-12">
        <section className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">Explore Mentora's Features</h2>
          <p className="text-lg text-foreground/90 max-w-2xl mx-auto mb-8">
            Mentora offers a range of tools to support your student life. Click on a feature below to learn more and get started.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {cardData.map((card) => {
              const Icon = card.icon;
              return (
                <Link href={card.href} key={card.title} className="block no-underline">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full flex flex-col">
                    <CardHeader className="items-center text-center">
                      <div className="p-3 bg-primary/20 rounded-full mb-2 inline-block">
                        <Icon size={32} className="text-primary-foreground" />
                      </div>
                      <CardTitle className="font-headline text-xl text-primary-foreground">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center flex-grow">
                      <CardDescription className="text-foreground/80">
                        {card.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="bg-primary/10 p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">Ready to Engage?</h2>
          <p className="text-lg text-foreground/90 mb-6 max-w-xl mx-auto">
            Your well-being and academic success are important. Mentora is designed to be a helpful companion on your student journey.
            Explore the sections above to get started.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
}

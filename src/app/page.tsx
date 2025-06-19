
import Header from '@/components/mentora/Header';
import Footer from '@/components/mentora/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { MessageSquareText, NotebookPen, CalendarDays, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        isHomePage={true} 
        title="👋 Welcome to Mentora Hub"
        subtitle="Your All-in-One Student Support Companion"
        description="Navigate through our services for mental well-being, academic assistance, and exploring school activities. Mentora is here to help you thrive."
      />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <section className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">Explore Mentora's Features</h2>
          <p className="text-lg text-foreground/90 max-w-2xl mx-auto mb-8">
            Mentora offers a range of tools to support your student life. Click on a feature below to learn more and get started.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/mental-health" className="block no-underline">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className="p-3 bg-primary/20 rounded-full mb-2 inline-block">
                    <MessageSquareText size={32} className="text-primary-foreground" />
                  </div>
                  <CardTitle className="font-headline text-xl text-primary-foreground">🧠 Mental Health Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-grow">
                  <CardDescription className="text-foreground/80">
                    A safe space to talk about your feelings, manage stress, and find well-being resources.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/homework-help" className="block no-underline">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className="p-3 bg-primary/20 rounded-full mb-2 inline-block">
                    <NotebookPen size={32} className="text-primary-foreground" />
                  </div>
                  <CardTitle className="font-headline text-xl text-primary-foreground">📚 Homework Help</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-grow">
                  <CardDescription className="text-foreground/80">
                    Get assistance with challenging subjects like Physics, Chemistry, Maths, and English.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/activities" className="block no-underline">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl h-full flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className="p-3 bg-primary/20 rounded-full mb-2 inline-block">
                    <CalendarDays size={32} className="text-primary-foreground" />
                  </div>
                  <CardTitle className="font-headline text-xl text-primary-foreground">📅 Activities & Events</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-grow">
                  <CardDescription className="text-foreground/80">
                    View upcoming and completed school events. Register for activities and see event details.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        <section className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-6">Why Mentora?</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Illustration of diverse students benefiting from support"
                data-ai-hint="student wellness education"
                width={600} 
                height={400} 
                className="rounded-lg shadow-md mx-auto" 
              />
            </div>
            <ul className="space-y-4 text-left text-foreground/90 text-lg">
              <li className="flex items-start">
                <Zap size={20} className="text-accent flex-shrink-0 mr-3 mt-1" />
                Instant, 24/7 access to support and information.
              </li>
              <li className="flex items-start">
                <Zap size={20} className="text-accent flex-shrink-0 mr-3 mt-1" />
                Confidential and non-judgmental interactions.
              </li>
              <li className="flex items-start">
                <Zap size={20} className="text-accent flex-shrink-0 mr-3 mt-1" />
                Personalized assistance for your academic and emotional needs.
              </li>
              <li className="flex items-start">
                <Zap size={20} className="text-accent flex-shrink-0 mr-3 mt-1" />
                Easy-to-use interface, designed for students.
              </li>
            </ul>
          </div>
        </section>
        
        <section className="bg-primary/10 p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-primary-foreground mb-4">Ready to Engage?</h2>
          <p className="text-lg text-foreground/90 mb-6 max-w-xl mx-auto">
            Your well-being and academic success are important. Mentora is designed to be a helpful companion on your student journey.
            Explore the sections above or click the chat bubble in the corner to start a general conversation.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
}


"use client";
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MentoraHeader from '@/components/mentora/Header';
import { useDialogflow, type DialogflowConfig } from '@/contexts/DialogflowContext';
import { MessageSquareHeart, Sparkles, ChevronRight, CalendarCheck2 } from 'lucide-react';

const pageConfig: DialogflowConfig = {
  agentId: '75e34229-81d6-48dc-a566-837752d63132',
  intent: 'WELCOME',
  chatTitle: 'Activities Assistant',
};

const exampleQuestions = [
  "What's happening this week at school?",
  "Tell me about the upcoming science fair.",
  "Are there any sports events on Saturday?",
  "How can I join the debate club?",
  "When is the next school holiday?",
];

export default function ActivitiesPage() {
  const { setConfig, openChat, isScriptLoaded, isChatConfigured } = useDialogflow();

  useEffect(() => {
    setConfig(pageConfig);
  }, [setConfig]);
  
  const handleOpenChat = () => {
    if (isScriptLoaded && isChatConfigured) {
      openChat();
    } else if (isScriptLoaded && !isChatConfigured) {
      setConfig(pageConfig);
      setTimeout(openChat, 100);
    }
  };

  return (
    <>
      <MentoraHeader
        title="🗓️ Activities Assistant"
        subtitle="Your Guide to School Events and Extracurriculars"
        description="Stay in the loop with all the happenings at school! Mentora's Activities Assistant can help you find information on events, clubs, sports, and important dates."
      />
      <div className="container mx-auto py-12 px-4 md:px-8">
        <Card className="shadow-lg bg-card">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
                <CalendarCheck2 className="h-8 w-8 text-accent" />
                <CardTitle className="font-headline text-2xl text-primary-foreground">Discover What's Happening!</CardTitle>
            </div>
            <CardDescription>
              Use the chat bot to ask about school activities, events, clubs, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="flex items-center text-lg font-semibold mb-2 text-primary-foreground">
                <MessageSquareHeart className="h-6 w-6 text-accent mr-2" />
                Welcome!
              </div>
              <p className="text-foreground/90">
                Mentora is excited to help you explore all the activities your school has to offer. Whether you're looking for club meetings, sports schedules, or special events, just ask!
              </p>
            </div>

            <div>
              <div className="flex items-center text-lg font-semibold mb-2 text-primary-foreground">
                <Sparkles className="h-6 w-6 text-accent mr-2" />
                Example Questions to Ask
              </div>
              <ul className="space-y-2 text-foreground/80">
                {exampleQuestions.map((question, index) => (
                  <li key={index} className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-accent mr-2 shrink-0" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-center pt-4">
              <Button onClick={handleOpenChat} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Ask About Activities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

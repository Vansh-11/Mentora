"use client";
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MentoraHeader from '@/components/mentora/Header';
import { useDialogflow, type DialogflowConfig } from '@/contexts/DialogflowContext';
import { Info, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';

const pageConfig: DialogflowConfig = {
  agentId: '20dce2b7-dfcf-491e-bee9-5d19f6c8837f',
  intent: 'WELCOME',
  chatTitle: 'Homework Helper',
};

export default function HomeworkHelpPage() {
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
        title="📘 Homework Helper Bot"
        subtitle="Ask Your Questions Directly!"
        description="Stuck on a tricky homework problem? Mentora's Homework Helper Bot is here to assist. Get explanations, work through problems, and deepen your understanding of various subjects."
      />
      <div className="container mx-auto py-12 px-4 md:px-8">
        <Card className="shadow-lg bg-card">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-8 w-8 text-accent" />
                <CardTitle className="font-headline text-2xl text-primary-foreground">Your AI Study Partner</CardTitle>
            </div>
            <CardDescription>
              Use the chat bot to get help with your homework questions. Follow the tips below for the best experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="flex items-center text-lg font-semibold mb-2 text-primary-foreground">
                <Info className="h-6 w-6 text-accent mr-2" />
                How to Use the Bot
              </div>
              <p className="text-foreground/90">
                Simply type your question into the chat window. Be as specific as possible for the best results. For example, instead of "Help with math," try "How do I solve quadratic equations using the formula?"
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-foreground/80 pl-4">
                <li>Break down complex questions into smaller parts.</li>
                <li>Specify the subject or topic if it's not obvious.</li>
                <li>If you have an image of the problem, try describing it in text.</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center text-lg font-semibold mb-2 text-primary-foreground">
                <Sparkles className="h-6 w-6 text-accent mr-2" />
                Example Questions
              </div>
              <ul className="list-disc list-inside space-y-1 text-foreground/80 pl-4">
                <li>"Explain the process of photosynthesis."</li>
                <li>"What were the main causes of World War I?"</li>
                <li>"Can you help me understand Newton's laws of motion?"</li>
                <li>"How do I balance this chemical equation: H2 + O2 → H2O?"</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center text-lg font-semibold mb-2 text-destructive">
                <AlertTriangle className="h-6 w-6 mr-2" />
                Important Note
              </div>
              <p className="text-foreground/90">
                Mentora is a tool to help you learn and understand, not to do your homework for you. It aims to guide you to the answers. The bot may not always have the perfect answer for highly specific or complex niche topics, and its knowledge is based on its training data. Always double-check critical information.
              </p>
            </div>
            
            <div className="text-center pt-4">
              <Button onClick={handleOpenChat} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Ask a Question
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

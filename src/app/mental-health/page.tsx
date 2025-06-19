
"use client";
import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MentoraHeader from '@/components/mentora/Header';
import { useDialogflow, type DialogflowConfig } from '@/contexts/DialogflowContext';
import { Lightbulb, MessageCircle, Smile, Ear } from 'lucide-react';

const pageConfig: DialogflowConfig = {
  agentId: 'f1d56207-6f14-457c-b432-416d9a804919',
  intent: 'WELCOME',
  chatTitle: 'Mental Health Support',
  chatSubtitle: 'Here to support you',
};

const supportAreas = [
  { icon: Ear, text: "A listening ear when you need to talk." },
  { icon: Smile, text: "Guidance on managing stress and anxiety." },
  { icon: Lightbulb, text: "Information and resources for various mental health topics." },
  { icon: MessageCircle, text: "A safe and confidential space for your thoughts." },
];

export default function MentalHealthPage() {
  const { setConfig, openChat, isScriptLoaded, isChatConfigured } = useDialogflow();

  useEffect(() => {
    setConfig(pageConfig);
  }, [setConfig]);

  const handleOpenChat = () => {
    if (isScriptLoaded && isChatConfigured) {
      openChat();
    } else if (isScriptLoaded && !isChatConfigured) {
      setConfig(pageConfig); // Ensure config is set
      setTimeout(openChat, 100); // Give time for config to apply
    }
  };
  
  return (
    <>
      <MentoraHeader
        title="🧠 Mental Health Support"
        subtitle="Your Safe Space to Talk and Reflect"
        description="Mentora is here to offer a supportive and understanding ear. Whether you're feeling overwhelmed, stressed, or just need someone to talk to, our AI companion provides a confidential space to explore your feelings and find helpful resources."
      />
      <div className="container mx-auto py-12 px-4 md:px-8">
        <section className="grid md:grid-cols-2 gap-8 mb-16 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4 font-headline text-primary-foreground">How Mentora Can Help Your Well-being</h2>
            <p className="mb-6 text-foreground/90">
              Mentora provides AI-driven conversational support designed to help you navigate emotional challenges. While not a replacement for professional therapy, Mentora can:
            </p>
            <ul className="space-y-3 mb-6">
              {supportAreas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <area.icon className="h-6 w-6 text-accent mr-3 mt-1 shrink-0" />
                  <span>{area.text}</span>
                </li>
              ))}
            </ul>
             <Button onClick={handleOpenChat} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Talk to Mentora Now
            </Button>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x450.png"
              alt="Person meditating peacefully"
              width={600}
              height={450}
              className="rounded-lg shadow-xl"
              data-ai-hint="serene mind wellness"
            />
          </div>
        </section>

        <section>
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline text-primary-foreground">Using the Chat for Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground/90">
              <p>
                When you click the "Talk to Mentora Now" button, a chat window will appear. You can start by saying "Hi" or by asking a question related to how you're feeling.
              </p>
              <p>
                <strong>Examples of what you can discuss:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>"I'm feeling really stressed about exams."</li>
                <li>"How can I deal with feeling lonely?"</li>
                <li>"I'm having trouble sleeping."</li>
                <li>"Can you give me some relaxation techniques?"</li>
              </ul>
              <p>
                Remember, Mentora is here to provide support and information. For serious mental health concerns, please consult a qualified professional or use the emergency resources provided in the footer.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

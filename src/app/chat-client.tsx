'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BrainCircuit,
  Loader2,
  Send,
  Sparkles,
  User,
  HeartHandshake,
} from 'lucide-react';
import { getAIAdvice } from './actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Message = {
  id: number;
  user: 'User A' | 'User B' | 'AI' | 'System';
  text: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    user: 'System',
    text: 'Welcome to CounselorAI. Two users can chat here about their relationship. When you are ready, click "Get Counselor\'s Advice" for an AI-powered perspective.',
  },
];

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<'A' | 'B'>('A');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: `User ${currentUser}`,
        text: input,
      },
    ]);
    setInput('');
  };

  const handleGetAdvice = () => {
    const chatHistory = messages
      .filter((m) => m.user.startsWith('User'))
      .map((m) => `${m.user}: ${m.text}`)
      .join('\n');

    if (chatHistory.length < 50) {
      toast({
        variant: 'destructive',
        title: 'Not enough context',
        description:
          'Please have a longer conversation before asking for advice.',
      });
      return;
    }

    startTransition(async () => {
      const result = await getAIAdvice(chatHistory);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else if (result.advice) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), user: 'AI', text: result.advice },
        ]);
      }
    });
  };

  return (
    <div className="flex h-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-3xl h-full md:h-[90vh] flex flex-col shadow-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <HeartHandshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-2xl">
                  CounselorAI
                </CardTitle>
                <CardDescription>
                  Your space for relationship dialogue and insight.
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleGetAdvice} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get Counselor's Advice
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-y-auto">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <form
            onSubmit={handleSendMessage}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <Label htmlFor="user-tabs">Sending as:</Label>
              <Tabs
                id="user-tabs"
                value={currentUser}
                onValueChange={(value) => setCurrentUser(value as 'A' | 'B')}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="A">User A</TabsTrigger>
                  <TabsTrigger value="B">User B</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex w-full items-start space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Type your message as User ${currentUser}...`}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e as any);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isPending}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUserA = message.user === 'User A';
  const isUserB = message.user === 'User B';
  const isAI = message.user === 'AI';
  const isSystem = message.user === 'System';

  if (isSystem) {
    return (
      <div className="text-center text-xs text-muted-foreground p-2 my-4 bg-muted rounded-md max-w-md mx-auto">
        {message.text}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-start gap-3', isUserB && 'justify-end')}
    >
      {(isUserA || isAI) && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback>
            {isUserA && 'A'}
            {isAI && <BrainCircuit className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'p-3 rounded-xl max-w-xs md:max-w-md lg:max-w-lg text-sm shadow-md break-words',
          isUserA && 'bg-card border',
          isUserB && 'bg-primary text-primary-foreground',
          isAI &&
            'bg-accent/30 border border-accent/50 max-w-none md:max-w-none lg:max-w-none'
        )}
      >
        {isAI && (
          <p className="font-bold font-headline text-accent-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            Counselor's Advice
          </p>
        )}
        <p className="whitespace-pre-line">{message.text}</p>
      </div>
      {isUserB && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="bg-primary text-primary-foreground">
            B
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

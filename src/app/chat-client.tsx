'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
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
  HeartHandshake,
  MessageSquareQuote,
  FileQuestion,
} from 'lucide-react';
import { getAIAdvice, getInitialQuestions } from './actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Message = {
  id: number;
  user: 'AI' | 'System';
  text: string;
};

type AppState = 'topic' | 'questions' | 'advice';
type Answers = Record<number, { A?: string; B?: string }>;

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [appState, setAppState] = useState<AppState>('topic');
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
  }, [messages, questions]);

  const handleGenerateQuestions = () => {
    if (topic.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Topic is too short',
        description: 'Please enter a topic to discuss.',
      });
      return;
    }
    startTransition(async () => {
      const result = await getInitialQuestions(topic);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else if (result.questions) {
        setQuestions(result.questions);
        setAppState('questions');
        setAnswers({}); // Reset answers
        setMessages([]); // Reset messages
      }
    });
  };

  const handleAnswerChange = (
    questionIndex: number,
    user: 'A' | 'B',
    value: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        [user]: value,
      },
    }));
  };

  const allQuestionsAnswered = () => {
    if (questions.length === 0) return false;
    return questions.every((_, index) => {
      const questionAnswers = answers[index];
      return (
        questionAnswers &&
        questionAnswers.A?.trim() !== '' &&
        questionAnswers.B?.trim() !== ''
      );
    });
  };

  const handleGetAdvice = () => {
    let context = `Topic: ${topic}\n\n`;
    questions.forEach((q, index) => {
      context += `Question ${index + 1}: ${q}\n`;
      context += `User A Answer: ${answers[index]?.A || 'No answer'}\n`;
      context += `User B Answer: ${answers[index]?.B || 'No answer'}\n\n`;
    });

    startTransition(async () => {
      const result = await getAIAdvice(context);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else if (result.advice) {
        setMessages([{ id: Date.now(), user: 'AI', text: result.advice }]);
        setAppState('advice');
      }
    });
  };

  const startOver = () => {
    setTopic('');
    setQuestions([]);
    setAnswers({});
    setMessages([]);
    setAppState('topic');
  };

  return (
    <div className="flex h-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-4xl h-full md:h-[90vh] flex flex-col shadow-2xl">
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
            {appState !== 'topic' && (
              <Button onClick={startOver} variant="outline">
                Start Over
              </Button>
            )}
          </div>
        </CardHeader>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <CardContent className="p-6">
            {appState === 'topic' && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="p-4 bg-primary/20 rounded-full">
                  <MessageSquareQuote className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-headline">
                  What would you like to discuss?
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Enter a topic like "Communication", "Finances", or "Future
                  Plans" to get started. The AI will generate some questions
                  to guide your conversation.
                </p>
                <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                  <Input
                    type="text"
                    placeholder="Enter your topic..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuestions()}
                    disabled={isPending}
                  />
                  <Button onClick={handleGenerateQuestions} disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate Questions
                  </Button>
                </div>
              </div>
            )}

            {appState === 'questions' && (
              <div className="space-y-8">
                <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center justify-center gap-2"><FileQuestion/> Here are some questions about "{topic}"</h3>
                    <p className="text-muted-foreground text-sm">Both partners should answer each question thoughtfully.</p>
                </div>
                {questions.map((q, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <p className="font-semibold text-primary">
                      {index + 1}. {q}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`userA-${index}`}>User A's Answer</Label>
                        <Textarea
                          id={`userA-${index}`}
                          placeholder="User A, please write your answer here..."
                          value={answers[index]?.A || ''}
                          onChange={(e) =>
                            handleAnswerChange(index, 'A', e.target.value)
                          }
                          className="min-h-[120px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`userB-${index}`}>User B's Answer</Label>
                        <Textarea
                          id={`userB-${index}`}
                          placeholder="User B, please write your answer here..."
                          value={answers[index]?.B || ''}
                          onChange={(e) =>
                            handleAnswerChange(index, 'B', e.target.value)
                          }
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {appState === 'advice' && (
                 <div className="p-6 space-y-6">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                </div>
            )}
          </CardContent>
        </ScrollArea>

        {(appState === 'questions' || appState === 'advice') && (
          <CardFooter className="border-t pt-6 flex-col items-center gap-4">
            {appState === 'questions' && (
              <Button
                onClick={handleGetAdvice}
                disabled={isPending || !allQuestionsAnswered()}
                size="lg"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Get Counselor's Advice
              </Button>
            )}
             {appState === 'advice' && (
                <div className="text-center">
                    <p className="text-muted-foreground">Would you like to discuss another topic?</p>
                </div>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
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
    <div className={cn('flex items-start gap-3')}>
      {isAI && (
        <div className="p-2 bg-primary/20 rounded-full">
            <BrainCircuit className="w-5 h-5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'p-4 rounded-xl max-w-none text-sm shadow-md',
          isAI &&
            'bg-accent/30 border border-accent/50'
        )}
      >
        {isAI && (
          <p className="font-bold font-headline text-accent-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            Counselor's Advice
          </p>
        )}
        <div className="prose prose-sm max-w-none break-words text-foreground">
          {message.text.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

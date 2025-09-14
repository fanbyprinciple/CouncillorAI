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
  User,
  ListChecks,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { getAIAdvice, getInitialQuestions, getActionableSteps } from './actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

type Message = {
  id: number;
  user: string;
  text: string;
};

type AppState = 'topic' | 'questions' | 'advice' | 'ended';
type Answers = Record<number, { A?: string; B?: string }>;

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [userAName, setUserAName] = useState('User A');
  const [userBName, setUserBName] = useState('User B');
  const [input, setInput] = useState('');
  const [activeUser, setActiveUser] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('topic');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
  }, [messages, questions, currentQuestionIndex]);

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
        setCurrentQuestionIndex(0);
        setAnswers({});
        setMessages([]);
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

  const isCurrentQuestionAnswered = () => {
    const currentAnswers = answers[currentQuestionIndex];
    return (
      currentAnswers &&
      currentAnswers.A?.trim() !== '' &&
      currentAnswers.B?.trim() !== ''
    );
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

  const getFullChatHistory = () => {
    let history = `Topic: ${topic}\n\n`;
    questions.forEach((q, index) => {
      history += `Question ${index + 1}: ${q}\n`;
      history += `${userAName}'s Answer: ${answers[index]?.A || 'No answer'}\n`;
      history += `${userBName}'s Answer: ${answers[index]?.B || 'No answer'}\n\n`;
    });
    history += '--- START OF CONVERSATION ---\n\n';
    history += messages.map((m) => `${m.user}: ${m.text}`).join('\n');
    return history;
  };

  const handleGetAdvice = () => {
    const chatHistory = getFullChatHistory();

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
        setAppState('advice');
      }
    });
  };

  const handleGetActionableSteps = () => {
    const chatHistory = getFullChatHistory();
    startTransition(async () => {
        const result = await getActionableSteps(chatHistory);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error getting actionable steps',
                description: result.error,
            });
        } else if (result.steps) {
            setMessages(prev => [...prev, {id: Date.now(), user: 'AI Action Plan', text: result.steps}]);
            setAppState('ended');
        }
    });
  }

  const handleSendMessage = () => {
    if (input.trim() === '' || !activeUser) {
        toast({
            variant: 'destructive',
            title: 'Cannot send message',
            description: 'Please select a user and type a message.',
        });
        return;
    }

    const newMessage: Message = { id: Date.now(), user: activeUser, text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    const updatedHistory = getFullChatHistory() + `\n${activeUser}: ${input}`;

    startTransition(async () => {
      const result = await getAIAdvice(updatedHistory);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error getting AI response',
          description: result.error,
        });
      } else if (result.advice) {
        setMessages((prev) => [...prev, { id: Date.now() + 1, user: 'AI', text: result.advice }]);
      }
    });
  };

  const startOver = () => {
    setTopic('');
    setQuestions([]);
    setAnswers({});
    setMessages([]);
    setAppState('topic');
    setUserAName('User A');
    setUserBName('User B');
    setInput('');
    setActiveUser(null);
    setCurrentQuestionIndex(0);
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
          <CardContent className="p-6 flex flex-col min-h-full">
            {appState === 'topic' && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="p-4 bg-primary/20 rounded-full">
                  <MessageSquareQuote className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-headline">
                  Let's Get Started
                </h2>
                <p className="text-muted-foreground max-w-lg">
                  First, enter your names. Then, provide a topic like "Communication", "Finances", or "Future
                  Plans". The AI will generate some questions to guide your conversation.
                </p>
                <div className="w-full max-w-sm space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Enter first name"
                        value={userAName === 'User A' ? '' : userAName}
                        onChange={(e) => setUserAName(e.target.value || 'User A')}
                        disabled={isPending}
                      />
                      <Input
                        type="text"
                        placeholder="Enter second name"
                        value={userBName === 'User B' ? '' : userBName}
                        onChange={(e) => setUserBName(e.target.value || 'User B')}
                        disabled={isPending}
                      />
                  </div>
                  <div className="flex w-full items-center space-x-2">
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
              </div>
            )}

            {appState === 'questions' && questions.length > 0 && (
              <div className="space-y-6">
                 <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center justify-center gap-2"><FileQuestion/> Here are some questions about "{topic}"</h3>
                    <p className="text-muted-foreground text-sm">Both partners should answer each question thoughtfully.</p>
                </div>

                <div className="space-y-2">
                    <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full" />
                    <p className="text-center text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>

                <div className="space-y-4 p-4 border rounded-lg shadow-sm">
                  <p className="font-semibold text-primary text-lg">
                    {questions[currentQuestionIndex]}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`userA-${currentQuestionIndex}`}>{userAName}'s Answer</Label>
                      <Textarea
                        id={`userA-${currentQuestionIndex}`}
                        placeholder={`${userAName}, please write your answer here...`}
                        value={answers[currentQuestionIndex]?.A || ''}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestionIndex, 'A', e.target.value)
                        }
                        className="min-h-[150px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`userB-${currentQuestionIndex}`}>{userBName}'s Answer</Label>
                      <Textarea
                        id={`userB-${currentQuestionIndex}`}
                        placeholder={`${userBName}, please write your answer here...`}
                        value={answers[currentQuestionIndex]?.B || ''}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestionIndex, 'B', e.target.value)
                        }
                        className="min-h-[150px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0}>
                        <ArrowLeft className="mr-2"/>
                        Previous
                    </Button>
                    {currentQuestionIndex < questions.length - 1 ? (
                        <Button onClick={() => setCurrentQuestionIndex(i => i + 1)} disabled={!isCurrentQuestionAnswered()}>
                            Next
                            <ArrowRight className="ml-2"/>
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleGetAdvice()}
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
                </div>
              </div>
            )}

            {(appState === 'advice' || appState === 'ended') && (
                 <div className="space-y-6 flex-1">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} userAName={userAName} userBName={userBName}/>
                    ))}
                     {appState === 'ended' && (
                        <div className="text-center p-4 bg-primary/10 rounded-lg text-primary-foreground">
                            <p className="font-semibold text-primary">The conversation has ended.</p>
                            <p className="text-sm text-muted-foreground">We hope this session was helpful. You can start over to begin a new session.</p>
                        </div>
                    )}
                </div>
            )}
          </CardContent>
        </ScrollArea>

        {(appState === 'advice') && (
          <CardFooter className="border-t pt-6 flex-col items-center gap-4">
            <div className="w-full space-y-4">
                <Button onClick={handleGetActionableSteps} disabled={isPending} variant="outline" size="lg" className="w-full">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                Get Actionable Steps
                </Button>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Replying as:</span>
                     <Button
                        variant={activeUser === userAName ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveUser(userAName)}
                    >
                        <User className="mr-2"/>
                        {userAName}
                    </Button>
                     <Button
                        variant={activeUser === userBName ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveUser(userBName)}
                    >
                         <User className="mr-2"/>
                        {userBName}
                    </Button>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="text"
                    placeholder={`Type your message as ${activeUser || '...'} `}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isPending || !activeUser}
                  />
                  <Button onClick={handleSendMessage} disabled={isPending || !activeUser}>
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send />
                    )}
                  </Button>
                </div>
              </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function ChatMessage({ message, userAName, userBName }: { message: Message, userAName: string, userBName: string }) {
  const isAI = message.user === 'AI';
  const isActionPlan = message.user === 'AI Action Plan';

  const isUserA = message.user === userAName;
  const isUserB = message.user === userBName;
  const isUser = isUserA || isUserB;

  return (
    <div className={cn('flex items-start gap-3', isUser && 'justify-end')}>
      <div
        className={cn(
          'flex flex-col gap-1',
          isUser && 'items-end'
        )}
      >
        <div
          className={cn(
            'p-4 rounded-xl max-w-xl text-sm shadow-md',
            (isAI || isActionPlan) && 'bg-accent/30 border border-accent/50',
            isUser && 'bg-primary/20 text-primary-foreground'
          )}
        >
          <p className="font-bold text-sm mb-1 text-foreground flex items-center gap-2">
            {isActionPlan ? <><ListChecks/> Action Plan</> : isAI ? 'CounselorAI' : message.user}
          </p>
          <div className="prose prose-sm max-w-none break-words text-foreground">
             {message.text}
          </div>
        </div>
      </div>
    </div>
  );
}

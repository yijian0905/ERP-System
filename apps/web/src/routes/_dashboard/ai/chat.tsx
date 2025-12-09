import { createFileRoute } from '@tanstack/react-router';
import {
  Bot,
  ChevronRight,
  Copy,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/ai/chat')({
  component: AIChatPage,
});

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date;
}

// Sample suggestions
const suggestions = [
  "What's my current inventory status?",
  "Show me sales trends for this month",
  "Which products are running low on stock?",
  "Who are my top 5 customers?",
  "Generate a sales summary report",
  "What invoices are overdue?",
];

// Mock chat sessions
const mockSessions: ChatSession[] = [
  { id: '1', title: 'Inventory Analysis', lastMessage: 'Here are the low stock items...', createdAt: new Date() },
  { id: '2', title: 'Sales Report', lastMessage: 'Your total sales this month...', createdAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Customer Insights', lastMessage: 'Top customers by revenue...', createdAt: new Date(Date.now() - 172800000) },
];

// Mock AI responses
const mockResponses: Record<string, string> = {
  "What's my current inventory status?": `Based on your current inventory data:

📦 **Total Stock Items**: 285 products across 3 warehouses

**Stock Summary by Category:**
- Electronics: 45 items (15.8%)
- Office Supplies: 120 items (42.1%)
- Furniture: 35 items (12.3%)
- Accessories: 85 items (29.8%)

⚠️ **Alerts:**
- 4 items are below reorder point
- 2 items predicted to stockout within 5 days
- Warehouse capacity at 75% (Main), 45% (Secondary)

Would you like me to generate a detailed inventory report or show the specific low-stock items?`,

  "Which products are running low on stock?": `Here are the products that need attention:

🔴 **Critical (Below Reorder Point):**
1. **Mechanical Keyboard** (ELEC-002)
   - Current: 8 units | Reorder at: 15 | Days of stock: 5
   
2. **Printer Ink Black** (OFFC-002)
   - Current: 12 units | Reorder at: 25 | Days of stock: 10

🟡 **Warning (Approaching Reorder):**
3. **Wireless Mouse** (ELEC-001)
   - Current: 45 units | Reorder at: 50 | Days of stock: 18

4. **USB-C Cable** (ELEC-004)
   - Current: 18 units | Reorder at: 30 | Days of stock: 12

**Recommended Action:** Create a purchase order for these items. Want me to help draft one?`,

  default: `I understand you're asking about your ERP system data. Based on my analysis:

📊 **Current Business Overview:**
- Total Revenue (This Month): $45,231
- Active Orders: 12 pending, 8 processing
- Inventory Value: $188,500
- Outstanding Invoices: $68,600

I can help you with:
- Inventory analysis and stock recommendations
- Sales trends and customer insights
- Financial reports and forecasts
- Order management queries

What specific information would you like me to look into?`,
};

function AIChatPage() {
  const sessions = mockSessions;
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const responseContent = mockResponses[input.trim()] || mockResponses.default;

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    
    setTimeout(scrollToBottom, 100);
  }, [input, isLoading]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleNewChat = () => {
    setActiveSession(null);
    setMessages([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <PageContainer className="max-w-none">
      <PageHeader
        title="AI Assistant"
        description="Ask questions about your business data"
      />

      {/* L3 Feature Banner */}
      <div className="mb-6 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:border-purple-900 dark:from-purple-950/50 dark:to-pink-950/50">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/50">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">
              Enterprise AI Assistant
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Powered by advanced language models with access to your ERP data for intelligent insights
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Sidebar - Chat History */}
        <div className="w-64 flex-shrink-0 rounded-lg border bg-card">
          <div className="p-4 border-b">
            <Button className="w-full" onClick={handleNewChat}>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
          <div className="p-2 overflow-y-auto h-[calc(100%-73px)]">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
              Recent Chats
            </p>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={cn(
                  'w-full flex items-start gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted',
                  activeSession === session.id && 'bg-muted'
                )}
              >
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col rounded-lg border bg-card">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">How can I help you today?</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                  I can help you analyze your business data, generate reports, 
                  and provide insights about inventory, sales, customers, and more.
                </p>

                {/* Suggestions */}
                <div className="grid gap-2 sm:grid-cols-2 max-w-xl">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' && 'flex-row-reverse'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={cn(
                      'flex flex-col gap-1 max-w-[80%]',
                      message.role === 'user' && 'items-end'
                    )}>
                      <div className={cn(
                        'rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(message.content)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-lg bg-muted px-4 py-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your business..."
                className="flex-1 h-10 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-center text-muted-foreground">
              AI responses are generated based on your ERP data. Always verify critical information.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

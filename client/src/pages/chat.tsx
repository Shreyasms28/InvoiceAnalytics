/**
 * Chat with Data Page
 * 
 * Natural language SQL query interface using Vanna AI
 * User can type questions in plain English, which get converted to SQL,
 * executed, and results displayed in a table
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Database, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  query: string;
  sql?: string;
  rows?: any[];
  error?: string;
  timestamp: Date;
}

export default function ChatWithData() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  // Mutation to send query to backend (which proxies to Vanna)
  const chatMutation = useMutation({
    mutationFn: async (userQuery: string) => {
      return await apiRequest('POST', '/api/chat-with-data', { query: userQuery });
    },
    onSuccess: (data, userQuery) => {
      // Add successful response to messages
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        query: userQuery,
        sql: data.sql,
        rows: data.rows,
        timestamp: new Date()
      }]);
      setQuery(''); // Clear input
    },
    onError: (error: any) => {
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        query: query,
        error: error.response?.data?.message || error.message || 'Failed to process query',
        timestamp: new Date()
      }]);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process query',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || chatMutation.isPending) return;
    chatMutation.mutate(query.trim());
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Chat with Data
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about your invoices in natural language
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No queries yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Try asking something like "Show me the top 5 vendors by total spend" or
                "What are my pending invoices?"
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-4">
                {/* User Query */}
                <div className="flex justify-end">
                  <Card className="inline-block max-w-2xl p-4 bg-primary text-primary-foreground">
                    <p className="text-sm">{message.query}</p>
                  </Card>
                </div>

                {/* AI Response */}
                <div className="space-y-3">
                  {message.error ? (
                    <Card className="p-4 border-destructive bg-destructive/10">
                      <p className="text-sm text-destructive font-medium">Error: {message.error}</p>
                    </Card>
                  ) : (
                    <>
                      {/* Generated SQL */}
                      {message.sql && (
                        <Card className="p-4 bg-muted">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Generated SQL
                            </span>
                          </div>
                          <pre className="text-sm font-mono overflow-x-auto text-foreground">
                            {message.sql}
                          </pre>
                        </Card>
                      )}

                      {/* Results Table */}
                      {message.rows && message.rows.length > 0 && (
                        <Card className="p-0 overflow-hidden">
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm" data-testid="table-query-results">
                              <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                  {Object.keys(message.rows[0]).map((key) => (
                                    <th
                                      key={key}
                                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                    >
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {message.rows.map((row, idx) => (
                                  <tr key={idx} className="hover-elevate">
                                    {Object.values(row).map((value: any, cellIdx) => (
                                      <td key={cellIdx} className="px-4 py-3 text-foreground">
                                        {value === null ? (
                                          <span className="text-muted-foreground italic">null</span>
                                        ) : typeof value === 'number' ? (
                                          <span className="tabular-nums">{value.toLocaleString()}</span>
                                        ) : (
                                          String(value)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
                            {message.rows.length} row{message.rows.length !== 1 ? 's' : ''} returned
                          </div>
                        </Card>
                      )}

                      {message.rows && message.rows.length === 0 && (
                        <Card className="p-4 text-center text-muted-foreground">
                          <p className="text-sm">No results found</p>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating SQL and fetching results...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your invoices... (e.g., 'Show me vendors with unpaid invoices')"
              className="pr-12 min-h-24 resize-none"
              data-testid="input-query"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!query.trim() || chatMutation.isPending}
              className="absolute bottom-2 right-2"
              data-testid="button-send-query"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Send, Plus, Bot, Sparkles, 
  BarChart3, AlertCircle, Users, Package, FileText, DollarSign, MessageSquare 
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { User } from "@/api/entities";
import MessageBubble from "../components/assistant/MessageBubble";
import { useLocalization } from "../components/contexts/LocalizationContext";
import { useCompanyProfile } from "../components/contexts/CompanyProfileContext";

export default function AIAssistant() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { t } = useLocalization();
  const { isSubscriptionActive } = useCompanyProfile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadUser();
  }, []);

  // Effect for managing real-time subscription
  useEffect(() => {
    let unsubscribe;
    if (currentConversation?.id) {
      unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
        setMessages(data.messages || []);
      });
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentConversation?.id]); // Depend on currentConversation.id to re-subscribe on change

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      await loadConversations(userData.email);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadConversations = async (userEmail) => {
    setIsLoading(true);
    try {
      const convos = await base44.agents.listConversations({
        agent_name: "erp_assistant"
      });
      setConversations(convos);
      
      // Load the most recent conversation by default
      if (convos.length > 0) {
        await loadConversation(convos[0].id);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId) => {
    setIsLoading(true);
    try {
      const conversation = await base44.agents.getConversation(conversationId);
      setCurrentConversation(conversation);
      setMessages(conversation.messages || []); // Initial messages
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => { // Renamed from createNewConversation
    setIsLoading(true);
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "erp_assistant",
        metadata: {
          name: `Chat - ${new Date().toLocaleDateString()}`,
          description: "AI Assistant conversation"
        }
      });
      
      setCurrentConversation(conversation);
      setMessages([]);
      await loadConversations(user.email); // Reload conversation list to include new one
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!inputMessage.trim() || !currentConversation || isSending || !isSubscriptionActive) return;

    setIsSending(true);
    const messageText = inputMessage;
    setInputMessage("");

    try {
      await base44.agents.addMessage(currentConversation, {
        role: "user",
        content: messageText
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setInputMessage(messageText); // Restore the message on error
    } finally {
      setIsSending(false);
    }
  };

  // Modified to accept a string directly
  const handleQuickAction = (messageText) => {
    setInputMessage(messageText);
    // Note: Quick actions here only populate the input. User needs to send or create conversation.
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Bot className="w-8 h-8 text-violet-600" />
              {t('assistant.title') || 'AI Assistant'}
            </h1>
            <p className="text-slate-600 mt-1">
              {t('assistant.description') || 'Ask me anything about your business'}
            </p>
          </div>
          {/* New Chat button moved to sidebar */}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => handleQuickAction("Summarize my sales for last month")}
            disabled={!isSubscriptionActive || isSending}
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-300"
          >
            <BarChart3 className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium">Sales Summary</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleQuickAction("Show me all overdue invoices")}
            disabled={!isSubscriptionActive || isSending}
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-300"
          >
            <AlertCircle className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium">Overdue Invoices</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleQuickAction("Who are my top 5 customers?")}
            disabled={!isSubscriptionActive || isSending}
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-300"
          >
            <Users className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium">Top Customers</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleQuickAction("Check stock levels for all products")}
            disabled={!isSubscriptionActive || isSending}
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-300"
          >
            <Package className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium">Stock Levels</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleQuickAction("Show my pending quotations")}
            disabled={!isSubscriptionActive || isSending}
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-300"
          >
            <FileText className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium">Pending Quotes</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleQuickAction("Summarize my expenses for this month")}
            disabled={!isSubscriptionActive || isSending}
            className="h-auto py-3 px-4 flex flex-col items-start gap-1 hover:bg-violet-50 hover:border-violet-300"
          >
            <DollarSign className="w-5 h-5 text-violet-600" />
            <span className="text-sm font-medium">Expenses</span>
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Conversations Sidebar */}
          <aside className="hidden lg:block lg:w-80 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations
              </h3>
            </div>

            <div className="p-2">
              <Button
                onClick={handleNewConversation}
                className="w-full mb-3 bg-violet-600 hover:bg-violet-700"
                disabled={!isSubscriptionActive || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>

              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      currentConversation?.id === conv.id
                        ? 'bg-violet-100 text-violet-700'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">
                      {conv.metadata?.name || 'Conversation'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(conv.created_date).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            {!currentConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Bot className="w-16 h-16 text-violet-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {t('assistant.welcome') || 'Welcome to AI Assistant'}
                </h2>
                <p className="text-slate-600 text-center mb-6 max-w-md">
                  {t('assistant.welcome_message') || 'Start a new conversation to get insights about your business, manage tasks, and more.'}
                </p>
                {/* Quick actions moved to global section above */}
              </div>
            ) : (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="w-5 h-5 text-violet-600" />
                    {currentConversation.metadata?.name || 'Chat'}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Sparkles className="w-12 h-12 text-violet-400 mb-3" />
                      <p className="text-slate-600">
                        {t('assistant.start_conversation') || 'Start by asking me something...'}
                      </p>
                      {/* Quick actions moved to global section above */}
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <MessageBubble key={index} message={message} />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </CardContent>

                <div className="p-4 border-t bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={t('assistant.type_message') || "Type your message..."}
                      disabled={isSending || !isSubscriptionActive}
                      className="flex-1"
                    />
                    <Button 
                      type="submit"
                      disabled={!inputMessage.trim() || isSending || !isSubscriptionActive}
                      className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

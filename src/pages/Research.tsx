import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED_QUESTIONS = [
  "How did Pakistani media cover the IMF bailout?",
  "Which outlets are ignoring PTI coverage?",
  "Compare Dawn vs Geo on economic reporting",
  "What stories are trending this week?",
  "Show me the most biased coverage today",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/news-chat`;

export default function Research() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (resp.status === 429) {
        upsertAssistant("⚠️ Rate limit exceeded. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        upsertAssistant("⚠️ Usage limit reached. Please add credits to continue.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      upsertAssistant("Sorry, something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <main className="container py-6 max-w-3xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">AI Research Mode</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask questions about Pakistani news coverage, bias patterns, and media narratives. Powered by Sachhh's news intelligence.
        </p>
      </header>

      {/* Chat area */}
      <div className="min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4 p-1">
        {messages.length === 0 && (
          <div className="space-y-3 pt-8">
            <p className="text-sm text-muted-foreground text-center">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 px-3"
                  onClick={() => send(q)}
                >
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card className={`max-w-[85%] ${msg.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
              <CardContent className="p-3">
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <Card>
              <CardContent className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Analyzing news data...
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Pakistani news coverage..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}

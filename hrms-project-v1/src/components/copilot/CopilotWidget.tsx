"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Bot,
  User,
  HelpCircle,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";
import { CopilotAction, matchHRMSKnowledge } from "@/lib/copilot/knowledge";

interface ChatMessage {
  id: string;
  sender: "user" | "gpilot";
  text: string;
  actions?: CopilotAction[];
  suggestedQuestions?: string[];
  timestamp: string;
}

export function CopilotWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, user } = useViewMode();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcome greeting on mount or first open
  useEffect(() => {
    if (messages.length === 0) {
      const initial = matchHRMSKnowledge("", pathname || "", activeRole || "EMPLOYEE");
      setMessages([
        {
          id: "welcome-1",
          sender: "gpilot",
          text: initial.reply,
          actions: initial.suggestedActions,
          suggestedQuestions: initial.suggestedQuestions,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [pathname, activeRole]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call Gpilot API (with fallback to client-side knowledge matcher)
      let responseData;
      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            route: pathname || "",
            role: activeRole || "EMPLOYEE",
          }),
        });
        if (res.ok) {
          responseData = await res.json();
        }
      } catch (err) {
        console.warn("Falling back to local knowledge engine:", err);
      }

      if (!responseData) {
        responseData = matchHRMSKnowledge(query, pathname || "", activeRole || "EMPLOYEE");
      }

      const botMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: "gpilot",
        text: responseData.reply,
        actions: responseData.suggestedActions,
        suggestedQuestions: responseData.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "gpilot",
          text: "Sorry, I ran into a temporary error. Please try asking again!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const initial = matchHRMSKnowledge("", pathname || "", activeRole || "EMPLOYEE");
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: "gpilot",
        text: initial.reply,
        actions: initial.suggestedActions,
        suggestedQuestions: initial.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleActionClick = (url: string) => {
    router.push(url);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Helper to format simple markdown-like text (bold, lists, code)
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      // Bold replacement: **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-neutral-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-1">
            <span className="text-amber-500 font-bold">•</span>
            <span className="flex-1">{formattedLine.slice(1)}</span>
          </div>
        );
      }

      if (/^\d+\.\s/.test(line.trim())) {
        const num = line.trim().match(/^\d+\./)?.[0];
        return (
          <div key={idx} className="flex items-start space-x-2 my-1">
            <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs mt-0.5">{num}</span>
            <span className="flex-1">{formattedLine}</span>
          </div>
        );
      }

      return line.trim() === "" ? (
        <div key={idx} className="h-2" />
      ) : (
        <p key={idx} className="leading-relaxed">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button - labeled "Gpilot" with NO page name badge */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Gpilot HRMS Assistant"
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#FDCD56] hover:bg-[#F3C348] text-[#262729] font-semibold text-sm rounded-full shadow-lg shadow-amber-500/25 border border-amber-300/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#262729] text-[#FDCD56]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="tracking-tight text-sm font-bold">Gpilot</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#262729]/10 text-[#262729]">
              AI
            </span>
          </button>
        </div>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out ${
            isMinimized
              ? "bottom-6 right-6 w-72 h-14"
              : "bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh]"
          } flex flex-col bg-white dark:bg-[#1E2022] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#262729] text-white border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FDCD56] text-[#262729] flex items-center justify-center font-bold shadow-sm shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm tracking-tight text-white">Gpilot</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDCD56] text-[#262729]">
                    HRMS AI
                  </span>
                </div>
                <p className="text-[11px] text-white/80 font-medium">Intelligent TeamHub Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-white">
              <button
                onClick={handleReset}
                title="Restart conversation"
                aria-label="Restart conversation"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label={isMinimized ? "Expand" : "Minimize"}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Messages container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-[#18191B] text-neutral-800 dark:text-neutral-100 text-sm">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-start gap-2 max-w-[90%]">
                      {msg.sender === "gpilot" && (
                        <div className="w-6 h-6 rounded-full bg-[#FDCD56] text-[#262729] flex-shrink-0 flex items-center justify-center mt-1 font-bold">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`p-3.5 rounded-2xl shadow-xs text-xs sm:text-sm ${
                          msg.sender === "user"
                            ? "bg-[#262729] text-white rounded-tr-none"
                            : "bg-white dark:bg-[#222326] text-neutral-800 dark:text-neutral-100 border border-neutral-200/80 dark:border-white/10 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {renderFormattedText(msg.text)}

                        {/* Interactive Deep-link action buttons */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-white/10 flex flex-wrap gap-2">
                            {msg.actions.map((act, i) => (
                              <button
                                key={i}
                                onClick={() => handleActionClick(act.url)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FDCD56]/20 hover:bg-[#FDCD56] text-[#262729] dark:text-[#FDCD56] dark:hover:text-[#262729] text-xs font-semibold border border-[#FDCD56]/50 transition-colors"
                              >
                                <span>{act.label}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-medium mt-1 px-1 tabular-nums">
                      {msg.timestamp}
                    </span>

                    {/* Suggested Questions (Chips) */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="text-left text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-[#222326] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 hover:border-amber-400 transition-colors flex items-center gap-1 shadow-2xs font-medium"
                          >
                            <HelpCircle className="w-3 h-3 text-[#FDCD56] shrink-0" />
                            <span className="line-clamp-1">{q}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-neutral-500 text-xs italic">
                    <div className="w-6 h-6 rounded-full bg-[#FDCD56]/20 text-[#FDCD56] flex items-center justify-center animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>Gpilot is finding the best answer...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white dark:bg-[#1E2022] border-t border-neutral-200 dark:border-white/10 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Gpilot anything about HRMS..."
                  className="flex-1 bg-neutral-100 dark:bg-[#18191B] text-neutral-900 dark:text-white placeholder:text-neutral-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 focus:border-[#FDCD56] focus:outline-none focus:ring-1 focus:ring-[#FDCD56] transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-[#FDCD56] text-[#262729] hover:bg-[#F3C348] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}


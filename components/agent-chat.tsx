"use client";

/**
 * Welcome! This is the chat panel you will edit for the workshop!
 *
 * During the workshop you'll connect it to a real agent: swap the
 * local `useState` for `useChat` from the AI SDK, point the form
 * at `sendMessage`, and render each message's `parts` inside
 * `<ConversationContent>`.
 *
 * Workshop docs: https://agent-foundations-certification.vercel.app/docs/chat-agent
 */
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

import { useChat } from "@ai-sdk/react"; 
import { Message, MessageContent, MessageResponse } from "./ai-elements/message"; 

import type { ShoppingAgentUIMessage } from "@/lib/agent";
import { ErrorBoundary } from "@/components/error-boundary";
import { AgentProductList } from "./agent-product-list";
import { AgentProductDetail } from "@/components/agent-product-detail";
import type { Product } from "@/lib/types"; 

import { WorkflowChatTransport } from "@workflow/ai";
import { useMemo, useEffect } from "react";

export function AgentChat() {
  const [input, setInput] = useState("");
  const [resumeFailed, setResumeFailed] = useState(false);

  const activeRunId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("active-workflow-run-id") ?? undefined;
  }, []);

  const { messages, error, sendMessage } = useChat<ShoppingAgentUIMessage>({
    resume: Boolean(activeRunId) && !resumeFailed,
    transport: new WorkflowChatTransport({
      api: "/api/chat",
      onChatSendMessage: (response) => {
        const runId = response.headers.get("x-workflow-run-id");
        if (runId) localStorage.setItem("active-workflow-run-id", runId);
        setResumeFailed(false);
      },
      onChatEnd: () => localStorage.removeItem("active-workflow-run-id"),
      prepareReconnectToStreamRequest: ({ api, ...rest }) => {
        const runId = localStorage.getItem("active-workflow-run-id");
        if (!runId) throw new Error("No active workflow run ID found");
        return { ...rest, api: `/api/chat/${encodeURIComponent(runId)}/stream` };
      },
    }),
    onError: (err) => {
      // If resume fails, clear stale run ID and allow fresh start
      if (activeRunId && err.message.includes("workflow")) {
        console.warn("Failed to resume workflow, starting fresh:", err);
        localStorage.removeItem("active-workflow-run-id");
        setResumeFailed(true);
      }
    },
  });

  const handleSubmit = (message: PromptInputMessage) => { 
    sendMessage({ text: input }); 
    setInput(""); 
  }; 

  if (error) return <div>{error.message}</div>;

  return (
    <ErrorBoundary>
      <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((m) =>
            m.parts.map((p, i) => {
              switch (p.type) {
                case "text":
                  return (
                    <Message key={`${m.id}-${i}`} from={m.role}>
                      <MessageContent>
                        <MessageResponse>{p.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  );
                case "tool-searchProducts":
                  return (
                    <AgentProductList key={`${m.id}-${i}`} invocation={p} />
                  );
                case "tool-getProductDetails": {
                  const result = p.output as { success?: boolean; product?: Product } | undefined;
                  if (result?.success && result?.product) {
                    return (
                      <AgentProductDetail
                        key={`${m.id}-${i}`}
                        product={result.product}
                      />
                    );
                  }
                  return null;
                }
                default:
                  return null;
              }
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask the agent"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status="ready" disabled={!input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
    </ErrorBoundary>
  );
}

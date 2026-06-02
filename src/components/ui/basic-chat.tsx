"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";

import { Card } from "./card";
import { Button } from "./button";
import { Input } from "./input";

export interface BasicChatMessage {
  id: string;
  content: string;
  sender: "me" | "other";
}

export interface BasicChatProps {
  userName: string;
  userAvatar?: string;
  userOnline?: boolean;
  messages: BasicChatMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  onSendMessage: () => void;
}

export default function BasicChat({
  userName,
  userAvatar,
  userOnline = false,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
}: BasicChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage();
  };

  return (
    <Card className="w-full h-[650px] flex flex-col rounded-lg bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3 p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-semibold overflow-hidden">
            {userAvatar ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={userAvatar} className="w-full h-full rounded-full" />
            ) : (
              userName?.charAt(0) || "U"
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{userName}</p>
            {userOnline && <span className="text-xs text-green-500">Online</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "other" && (
              <div className="w-6 h-6 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                {userName?.charAt(0) || "U"}
              </div>
            )}

            <div
              className={`px-3 py-2 rounded-lg text-sm max-w-xs break-words transition-all duration-200 hover:scale-[1.02] ${
                msg.sender === "me"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow"
              }`}
            >
              {msg.content}
            </div>

            {msg.sender === "me" && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                M
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t flex gap-2 bg-white dark:bg-gray-800">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <Button
          onClick={sendMessage}
          className="shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}


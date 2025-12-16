"use client";

import { messageText } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

// 分析文言作成のエンドポイント
const chatApi = "/api/checkStream";
// 単体テスト作成のエンドポイント
const excelApi = "/api/checkExportExcel";

export const Chat = () => {
  const [input, setInput] = useState("");
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: chatApi,
      credentials: "include",
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;
    sendMessage({ text: input }, {});
    setInput("");
  };

  return (
    <div className="flex flex-col items-center">
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ファイル名を入力..."
          className="p-0.5 border"
          disabled={status !== "ready"} // status が ready のときだけ入力可能にする例
        />
        <button
          type="submit"
          disabled={status !== "ready"}
          className="p-0.5 border hover:cursor-pointer hover:bg-zinc-100"
        >
          check!
        </button>
      </form>

      <div>
        {messages &&
          messages.map((msg) => {
            const text = messageText(msg);

            return (
              <div key={msg.id}>
                <p style={{ whiteSpace: "pre-wrap" }}>{text}</p>
                <br />
              </div>
            );
          })}
      </div>
    </div>
  );
};

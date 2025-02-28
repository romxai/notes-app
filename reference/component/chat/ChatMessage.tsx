import { ChatMessage as ChatMessageType } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileIcon, GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex gap-3">
      <Avatar className="h-12 w-12 shrink-0">
        {message.role === "user" ? (
          <>
            <AvatarImage src="" />
            <AvatarFallback
              className="flex items-center justify-center h-full w-full text-lg font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #4F46E5,rgb(240, 87, 237))",
              }}
            ></AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="" />
            <AvatarFallback
              className="flex items-center justify-center h-full w-full text-lg font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #FF6B6B,rgb(101, 157, 236))",
              }}
            >
              <GraduationCap className="h-7 w-7" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-slate-800 text-base font-bold">
            {message.role === "user" ? "You" : "CHAT A.I.+"}
          </span>
          <span className="text-slate-400 text-sm font-medium">
            {formattedTime}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-3xl">
          <div className="prose prose-sm md:prose-lg prose-slate max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc ml-6 mt-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal ml-6 mt-2" {...props} />
                ),
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                a: ({ node, ...props }) => (
                  <a className="text-blue-600 hover:underline" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-blue-500 pl-4 italic text-gray-600"
                    {...props}
                  />
                ),
                code: ({ node, inline, className, children, ...props }) =>
                  inline ? (
                    <code
                      className="bg-gray-100 rounded px-1 py-0.5 text-red-600"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-gray-900 text-white rounded-lg p-3 overflow-x-auto">
                      <code {...props}>{children}</code>
                    </pre>
                  ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {message.attachments?.map((attachment, index) => (
            <div key={index} className="mt-3">
              {attachment.type === "image" ? (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200">
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-auto max-h-[260px] object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <FileIcon className="h-4 w-4 text-slate-500" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {attachment.name}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

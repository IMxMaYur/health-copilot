export default function ChatPage() {
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
      <h2 className="text-2xl font-semibold mb-2">Chat</h2>
      <p className="text-sm text-slate-400 mb-4">
        This will be the AI assistant chat for health management (non-diagnostic).
      </p>

      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Chat UI goes here (messages + input box).
      </div>
    </div>
  );
}

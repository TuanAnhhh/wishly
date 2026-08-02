import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, ScrollArea } from '@wishly/ui';

type GuestMessage = { name: string; text: string; link: string };

export type SendZaloDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (pendingOnly: boolean) => Promise<{ messages: GuestMessage[]; hint: string }>;
  onCopyAll: (messages: GuestMessage[]) => Promise<void>;
};

/** "Gửi thiệp qua Zalo" — chép nội dung tin nhắn cá nhân hoá, không gửi tự động (chưa có ZNS OA). */
export function SendZaloDialog({ open, onOpenChange, onLoad, onCopyAll }: SendZaloDialogProps) {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [hint, setHint] = useState('');

  async function load(pendingOnly: boolean) {
    const res = await onLoad(pendingOnly);
    setMessages(res.messages);
    setHint(res.hint);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Gửi thiệp qua Zalo</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-secondary-foreground">
              Chép nội dung rồi dán vào Zalo cho từng nhóm — không gửi tự động.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void load(false)}>
                Tải tin nhắn tất cả
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void load(true)}
              >
                Chỉ khách chưa phản hồi
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!messages.length}
                onClick={() => void onCopyAll(messages)}
              >
                Chép {messages.length || 'N'} tin nhắn
              </Button>
            </div>
            {hint ? <p className="text-sm text-secondary-foreground">{hint}</p> : null}
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.link} className="space-y-2 border border-border p-3 text-sm">
                  <p className="font-medium">{m.name}</p>
                  <pre className="whitespace-pre-wrap text-secondary-foreground">{m.text}</pre>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void navigator.clipboard.writeText(m.text)}
                    >
                      Chép
                    </Button>
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <a
                        href={`https://zalo.me/?text=${encodeURIComponent(m.text)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở Zalo
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default SendZaloDialog;

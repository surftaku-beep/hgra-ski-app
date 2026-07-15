"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  sendContactMessage,
  type ContactFormState,
} from "@/app/contact/actions";

const initialState: ContactFormState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">名前</Label>
          <Input id="contact-name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">メールアドレス</Label>
          <Input id="contact-email" name="email" type="email" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject">件名</Label>
        <Input id="contact-subject" name="subject" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">お問い合わせ内容</Label>
        <Textarea id="contact-message" name="message" rows={5} required />
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">
          送信が完了しました。お問い合わせいただきありがとうございます。
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "送信中..." : "送信する"}
      </Button>
    </form>
  );
}

"use server";

import { Resend } from "resend";

export type ContactFormState = {
  error?: string;
  success?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = normalize(formData.get("name"));
  const email = normalize(formData.get("email"));
  const subject = normalize(formData.get("subject"));
  const message = normalize(formData.get("message"));

  if (!name || !email || !subject || !message) {
    return { error: "すべての項目を入力してください。" };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "メールアドレスの形式が正しくありません。" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const receiver = process.env.CONTACT_RECEIVER_EMAIL;
  if (!apiKey || !receiver) {
    console.error(
      "[sendContactMessage] RESEND_API_KEY / CONTACT_RECEIVER_EMAIL is not configured",
    );
    return {
      error:
        "現在お問い合わせフォームをご利用いただけません。しばらくしてから再度お試しください。",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "HGRAスキーチーム お問い合わせフォーム <onboarding@resend.dev>",
      to: receiver,
      replyTo: email,
      subject: `[お問い合わせ] ${subject}`,
      text: `送信者: ${name} <${email}>\n件名: ${subject}\n\n${message}`,
    });

    if (error) {
      console.error("[sendContactMessage] resend error:", error);
      return {
        error: "送信に失敗しました。時間をおいて再度お試しください。",
      };
    }
  } catch (err) {
    console.error("[sendContactMessage] unexpected error:", err);
    return { error: "送信に失敗しました。時間をおいて再度お試しください。" };
  }

  return { success: true };
}

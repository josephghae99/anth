import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const chat = await getChatById({ id: params.id });

  if (!chat || chat.userId !== session.user.id) {
    redirect("/chat");
  }

  return <Chat id={params.id} initialMessages={JSON.parse(chat.messages)} />;
}

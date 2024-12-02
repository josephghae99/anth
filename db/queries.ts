import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, reservation } from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

let db: ReturnType<typeof drizzle>;

try {
  const POSTGRES_URL = process.env.POSTGRES_URL;
  if (!POSTGRES_URL) {
    console.warn("POSTGRES_URL is not defined in environment variables");
    throw new Error("Database connection not available");
  }

  const client = postgres(`${POSTGRES_URL}?sslmode=require`);
  db = drizzle(client);
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  // Provide a mock db during build time
  db = {
    select: () => Promise.resolve([]),
    insert: () => Promise.resolve([]),
    update: () => Promise.resolve([]),
    delete: () => Promise.resolve([]),
  } as any;
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    return [];
  }
}

export async function createUser(email: string, password: string) {
  try {
    let salt = genSaltSync(10);
    let hash = hashSync(password, salt);
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    return [];
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    return null;
  }
}

export async function createReservation({
  id,
  userId,
  details,
}: {
  id: string;
  userId: string;
  details: any;
}) {
  try {
    return await db.insert(reservation).values({
      id,
      createdAt: new Date(),
      userId,
      hasCompletedPayment: false,
      details: JSON.stringify(details),
    });
  } catch (error) {
    console.error("Failed to create reservation");
    throw error;
  }
}

export async function getReservationById({ id }: { id: string }) {
  try {
    const [selectedReservation] = await db
      .select()
      .from(reservation)
      .where(eq(reservation.id, id));
    return selectedReservation;
  } catch (error) {
    console.error("Failed to get reservation");
    return null;
  }
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  try {
    return await db
      .update(reservation)
      .set({
        hasCompletedPayment,
      })
      .where(eq(reservation.id, id));
  } catch (error) {
    console.error("Failed to update reservation");
    throw error;
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getKnowledgeBase } from "@/lib/knowledge-base";

// Zod schema pro request body
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z
    .object({
      step: z.string().optional(),
      vehicleData: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  conversationId: z.string().optional(),
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hodina

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatný požadavek", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, context, conversationId } = parsed.data;

    // Rate limiting — max 50 zpráv za hodinu
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await prisma.aiConversation.count({
      where: {
        userId,
        updatedAt: { gte: oneHourAgo },
      },
    });

    if (recentCount > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Příliš mnoho požadavků. Zkuste to za chvíli." },
        { status: 429 }
      );
    }

    // Načíst existující konverzaci nebo vytvořit novou
    let conversation: { id: string; messages: ChatMessage[] } | null = null;

    if (conversationId) {
      const existing = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (existing) {
        conversation = {
          id: existing.id,
          messages: existing.messages as unknown as ChatMessage[],
        };
      }
    }

    const previousMessages: ChatMessage[] = conversation?.messages ?? [];

    // Přidat user zprávu
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Sestavit system prompt
    const knowledgeBase = getKnowledgeBase();
    let systemPrompt = `Jsi AI asistent pro makléře v platformě Carmakler. Pomáháš makléřům s otázkami ohledně:
- Smluv a právních záležitostí
- Focení vozidel
- Prohlídky a inspekce vozidel
- Cenotvorby a oceňování
- Právních otázek (přepis, STK, DPH)
- Procesů a postupů v Carmakler

PRAVIDLA:
- Odpovídej vždy česky
- Buď stručný a praktický
- Pokud si nejsi jistý, řekni to
- Odkazuj na konkrétní sekce knowledge base
- Nikdy nevymýšlej právní rady — odkaž na právníka nebo BackOffice

KNOWLEDGE BASE:
${knowledgeBase}`;

    // Kontextové instrukce
    if (context?.step) {
      systemPrompt += `\n\nUŽIVATEL JE PRÁVĚ V KROKU: ${context.step}. Přizpůsob odpovědi tomuto kontextu.`;
    }
    if (context?.vehicleData) {
      systemPrompt += `\n\nDATA VOZIDLA: ${JSON.stringify(context.vehicleData)}`;
    }

    // Sestavit zprávy pro Claude API (posledních 10 zpráv + nová)
    const recentMessages = previousMessages.slice(-9);
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> =
      recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    claudeMessages.push({ role: "user", content: message });

    // Volání Claude API
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const assistantContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };

    // Uložit do DB — posledních 10 zpráv
    const allMessages = [...previousMessages, userMessage, assistantMessage].slice(
      -10
    );

    let savedConversationId: string;

    if (conversation) {
      await prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          messages: allMessages as unknown as Prisma.InputJsonValue,
          context: context
            ? (context as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
      savedConversationId = conversation.id;
    } else {
      const created = await prisma.aiConversation.create({
        data: {
          userId,
          messages: allMessages as unknown as Prisma.InputJsonValue,
          context: context
            ? (context as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
      savedConversationId = created.id;
    }

    return NextResponse.json({
      response: assistantContent,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: "Chyba při komunikaci s AI" },
      { status: 500 }
    );
  }
}

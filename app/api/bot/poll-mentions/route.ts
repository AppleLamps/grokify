import { NextRequest, NextResponse } from 'next/server';
import { getDb, botMentions, botState } from '@/db';
import { eq, and, gt } from 'drizzle-orm';
import { fetchMentions } from '@/lib/bot/x-api';
import { processMention } from '@/lib/bot/pipeline';
import { AUTHOR_RATE_LIMIT, TIME_BUDGET_MS } from '@/lib/bot/constants';

export const maxDuration = 300;

async function upsertBotState(
  db: ReturnType<typeof getDb>,
  lastMentionId: string | undefined,
  lastPollAt: Date
) {
  const existing = await db
    .select({ id: botState.id })
    .from(botState)
    .where(eq(botState.id, 'singleton'))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(botState)
      .set({
        lastMentionId: lastMentionId || undefined,
        lastPollAt,
        updatedAt: new Date(),
      })
      .where(eq(botState.id, 'singleton'));
  } else {
    await db.insert(botState).values({
      id: 'singleton',
      lastMentionId: lastMentionId || null,
      lastPollAt,
      updatedAt: new Date(),
    });
  }
}

export async function GET(req: NextRequest) {
  // 1. Validate cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const startTime = Date.now();
  const botHandle = (process.env.X_BOT_HANDLE || 'GrokifyBot').toLowerCase();

  // 2. Get last processed mention ID
  const stateRows = await db
    .select()
    .from(botState)
    .where(eq(botState.id, 'singleton'))
    .limit(1);

  const sinceId = stateRows[0]?.lastMentionId || undefined;

  // 3. Fetch new mentions from X
  let mentions;
  try {
    mentions = await fetchMentions(sinceId);
  } catch (error) {
    console.error('[Bot] Failed to fetch mentions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentions' },
      { status: 500 }
    );
  }

  if (!mentions || mentions.length === 0) {
    await upsertBotState(db, sinceId, new Date());
    return NextResponse.json({ processed: 0, total: 0 });
  }

  // 4. Sort chronologically (oldest first)
  const sorted = mentions.sort((a, b) =>
    BigInt(a.id) < BigInt(b.id) ? -1 : 1
  );

  let processedCount = 0;
  let latestId = sinceId;

  for (const mention of sorted) {
    // Time budget check
    if (Date.now() - startTime > TIME_BUDGET_MS) {
      console.log('[Bot] Time budget exhausted, remaining will process next cron');
      break;
    }

    // Update latest ID tracker
    if (!latestId || BigInt(mention.id) > BigInt(latestId)) {
      latestId = mention.id;
    }

    // Skip self-mentions (prevent loops)
    if (mention.authorHandle.toLowerCase() === botHandle) {
      continue;
    }

    // Deduplication check
    const existing = await db
      .select({ id: botMentions.id })
      .from(botMentions)
      .where(eq(botMentions.tweetId, mention.id))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    // Per-author rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentByAuthor = await db
      .select({ id: botMentions.id })
      .from(botMentions)
      .where(
        and(
          eq(botMentions.authorId, mention.authorId),
          gt(botMentions.createdAt, oneHourAgo)
        )
      );

    if (recentByAuthor.length >= AUTHOR_RATE_LIMIT) {
      console.log(`[Bot] Rate limited @${mention.authorHandle} (${recentByAuthor.length} requests in last hour)`);
      continue;
    }

    // Insert as processing
    await db.insert(botMentions).values({
      tweetId: mention.id,
      authorId: mention.authorId,
      authorHandle: mention.authorHandle,
      targetHandle: 'pending',
      status: 'processing',
    });

    try {
      const result = await processMention(mention);

      await db
        .update(botMentions)
        .set({
          status: 'completed',
          targetHandle: result.targetHandle,
          artStyle: result.style,
          replyTweetId: result.replyTweetId,
          processedAt: new Date(),
        })
        .where(eq(botMentions.tweetId, mention.id));

      processedCount++;
      console.log(`[Bot] Successfully processed mention ${mention.id} -> reply ${result.replyTweetId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Bot] Failed to process mention ${mention.id}:`, errorMessage);

      await db
        .update(botMentions)
        .set({
          status: 'failed',
          errorMessage,
          processedAt: new Date(),
        })
        .where(eq(botMentions.tweetId, mention.id));
    }
  }

  // 5. Update bot state with latest ID
  await upsertBotState(db, latestId, new Date());

  console.log(`[Bot] Poll complete: ${processedCount}/${sorted.length} processed`);
  return NextResponse.json({
    processed: processedCount,
    total: sorted.length,
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  distributeScoutLeadsToBrokers,
  expireStaleScoutLeads,
} from "@/lib/scout-lead-management";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Neautorizováno" },
        { status: 401 }
      );
    }

    // 1. Expire stale unassigned leads (7 days)
    const expired = await expireStaleScoutLeads();

    // 2. Distribute SOUKROMNIK leads to brokers
    const distribution = await distributeScoutLeadsToBrokers(5);

    console.log(
      `[scout-lead-distribution] distributed=${distribution.distributed} brokers=${distribution.brokers} expired=${expired}`
    );

    return NextResponse.json({
      distributed: distribution.distributed,
      brokers: distribution.brokers,
      expired,
    });
  } catch (error) {
    console.error(
      "POST /api/cron/scout-lead-distribution error:",
      error
    );
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

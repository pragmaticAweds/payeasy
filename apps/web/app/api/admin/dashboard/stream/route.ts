import { NextRequest } from "next/server";

// Simulate metric fluctuations for demo purposes
function generateMetricUpdate() {
  const baseStats = {
    totalUsers: 1284,
    activeListings: 356,
    totalPayments: 892,
    revenue: 128450,
  };

  return {
    stats: {
      totalUsers: baseStats.totalUsers + Math.floor(Math.random() * 5),
      activeListings: baseStats.activeListings + Math.floor(Math.random() * 3) - 1,
      totalPayments: baseStats.totalPayments + Math.floor(Math.random() * 4),
      revenue: `$${(baseStats.revenue + Math.floor(Math.random() * 500)).toLocaleString()}`,
    },
    systemStatus: {
      database: "operational",
      blockchain: "operational",
      authentication: "operational",
      payments: Math.random() > 0.8 ? "degraded" : "operational",
    },
  };
}

const activityTemplates = [
  { type: "listing", title: "New listing submitted: Modern Apartment", link: "/admin/listings/301" },
  { type: "payment", title: "Payment received: $2,450 escrow deposit", link: "/admin/payments/401" },
  { type: "message", title: "Support ticket: Verification request", link: "/admin/messages/201" },
  { type: "listing", title: "Listing updated: Beach House pricing", link: "/admin/listings/205" },
  { type: "payment", title: "Refund processed for booking #789", link: "/admin/payments/402" },
  { type: "message", title: "New admin alert: Suspicious login attempt", link: "/admin/messages/202" },
];

function generateActivityUpdate() {
  const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
  return {
    recentActivities: [
      {
        id: `rt-${Date.now()}`,
        type: template.type,
        title: template.title,
        createdAt: new Date().toISOString(),
        link: template.link,
      },
    ],
  };
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let tick = 0;

      const interval = setInterval(() => {
        if (request.signal.aborted) {
          clearInterval(interval);
          controller.close();
          return;
        }

        try {
          // Send metric updates every tick, activity updates every 3rd tick
          const update =
            tick % 3 === 0
              ? { ...generateMetricUpdate(), ...generateActivityUpdate() }
              : generateMetricUpdate();

          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(data));
          tick++;
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 5000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Order {
  id: string;
  order_number: string;
  customer_email?: string;
  customer_name?: string;
  shipping_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  veeqo_order_id?: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  sku?: string;
}

interface VeeqoOrderPayload {
  deliver_to: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
    email: string;
  };
  line_items: Array<{
    sellable_id: number;
    quantity: number;
    price: number;
  }>;
  channel_id: number;
  warehouse_id?: number;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
  };
  number?: string;
}

function buildVeeqoOrder(
  order: Order,
  orderItems: OrderItem[],
  options: {
    warehouseId?: number;
    channelId: number;
  }
): VeeqoOrderPayload {
  const shippingAddress = order.shipping_address || {};
  const customerName = order.customer_name || '';
  const [firstName, ...lastNameParts] = customerName.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;

  const veeqoOrder: VeeqoOrderPayload = {
    deliver_to: {
      first_name: firstName || 'Guest',
      last_name: lastName || 'Customer',
      address1: shippingAddress.line1 || '',
      address2: shippingAddress.line2,
      city: shippingAddress.city || '',
      state: shippingAddress.state,
      zip: shippingAddress.postal_code || '',
      country: shippingAddress.country || 'US',
      email: order.customer_email || '',
    },
    line_items: orderItems.map((item) => ({
      sellable_id: parseInt(item.variant_id || item.product_id || '0'),
      quantity: item.quantity,
      price: parseFloat(item.price.toString()),
    })),
    channel_id: options.channelId,
    customer: {
      email: order.customer_email || '',
      first_name: firstName || 'Guest',
      last_name: lastName || 'Customer',
    },
    number: order.order_number,
  };

  if (options.warehouseId) {
    veeqoOrder.warehouse_id = options.warehouseId;
  }

  return veeqoOrder;
}

async function processPushToVeeqo(
  supabase: any,
  job: any,
  veeqoApiKey: string,
  veeqoChannelId: string,
  veeqoWarehouseId: string
) {
  console.log(`Processing push_to_veeqo for order ${job.order_id}`);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", job.order_id)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${job.order_id}`);
  }

  if (order.veeqo_order_id) {
    console.log(`Order already has veeqo_order_id: ${order.veeqo_order_id}`);
    return;
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", job.order_id);

  if (itemsError || !orderItems || orderItems.length === 0) {
    throw new Error(`Order items not found for order: ${job.order_id}`);
  }

  const veeqoPayload = buildVeeqoOrder(order, orderItems, {
    channelId: parseInt(veeqoChannelId),
    warehouseId: veeqoWarehouseId ? parseInt(veeqoWarehouseId) : undefined,
  });

  console.log("Creating Veeqo order:", JSON.stringify(veeqoPayload, null, 2));

  const veeqoResponse = await fetch("https://api.veeqo.com/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": veeqoApiKey,
    },
    body: JSON.stringify(veeqoPayload),
  });

  if (!veeqoResponse.ok) {
    const errorText = await veeqoResponse.text();
    throw new Error(`Veeqo API error: ${veeqoResponse.status} - ${errorText}`);
  }

  const veeqoOrder = await veeqoResponse.json();
  console.log("Veeqo order created:", veeqoOrder.id);

  await supabase
    .from("orders")
    .update({ veeqo_order_id: veeqoOrder.id.toString() })
    .eq("id", job.order_id);

  await supabase.from("order_sync_jobs").insert({
    order_id: job.order_id,
    job_type: "check_shipment",
    status: "pending",
  });

  console.log("Created check_shipment job");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const veeqoApiKey = Deno.env.get("VEEQO_API_KEY");
    const veeqoChannelId = Deno.env.get("VEEQO_CHANNEL_ID");
    const veeqoWarehouseId = Deno.env.get("VEEQO_WAREHOUSE_ID");

    if (!veeqoApiKey || !veeqoChannelId) {
      throw new Error("Missing Veeqo configuration");
    }

    const { data: pendingJobs, error: jobsError } = await supabase
      .from("order_sync_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (jobsError) {
      throw jobsError;
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending jobs", processed: 0 }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];

    for (const job of pendingJobs) {
      try {
        await supabase
          .from("order_sync_jobs")
          .update({
            status: "processing",
            attempts: job.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        if (job.job_type === "push_to_veeqo") {
          await processPushToVeeqo(
            supabase,
            job,
            veeqoApiKey,
            veeqoChannelId,
            veeqoWarehouseId || ""
          );
        }

        await supabase
          .from("order_sync_jobs")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({
          job_id: job.id,
          job_type: job.job_type,
          status: "completed",
        });

        console.log(`✅ Job ${job.id} completed`);
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        const maxAttempts = 3;
        const newStatus = job.attempts + 1 >= maxAttempts ? "failed" : "pending";

        await supabase
          .from("order_sync_jobs")
          .update({
            status: newStatus,
            error_message: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({
          job_id: job.id,
          job_type: job.job_type,
          status: "error",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Jobs processed",
        processed: results.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Order sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

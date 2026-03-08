import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function createVeeqoProduct(
  productName: string,
  price: number,
  veeqoApiKey: string
): Promise<number> {
  const payload = {
    title: productName,
    variants: [
      {
        title: productName,
        sku: `${productName}-${Date.now()}`
          .replace(/\s+/g, "-")
          .toLowerCase(),
        cost_price: price,
        retail_price: price
      }
    ]
  };

  const response = await fetch("https://api.veeqo.com/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": veeqoApiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Veeqo product creation error: ${response.status} - ${errorText}`
    );
  }

  const createdProduct = await response.json();
// Testing Testing Testing
console.log(
  "Full Veeqo product response:",
  JSON.stringify(createdProduct, null, 2)
);

const sellableId =
  createdProduct?.variants?.[0]?.sellable_id ||
  createdProduct?.variants?.[0]?.id ||
  null;

if (!sellableId) {
  throw new Error("Could not determine sellable_id from Veeqo response");
}

return sellableId;

interface Order {
  id: string;
  order_number: string;
  public_order_number?: number;
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
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
  };
  line_items_attributes: Array<{
    sellable_id: number;
    quantity: number;
    price_per_unit: number;
  }>;
  channel_id: number;
  warehouse_id?: number;
  customer_attributes: {
    email: string;
    first_name: string;
    last_name: string;
  };
  payment_status: string;
  number?: string;
}


async function buildVeeqoOrder(
  order: Order,
  orderItems: OrderItem[],
  options: {
    warehouseId?: number;
    channelId: number;
    veeqoApiKey: string;
  }
): Promise<VeeqoOrderPayload> {
  const shippingAddress = order.shipping_address || {};
  const customerName = order.customer_name || '';
  const [firstName, ...lastNameParts] = customerName.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;

  const lineItems = [];
  for (const item of orderItems) {
    const sellableId = await createVeeqoProduct(
      item.variant_name || item.product_name,
      parseFloat(item.price.toString()),
      options.veeqoApiKey
    );

    lineItems.push({
      sellable_id: sellableId,
      quantity: item.quantity,
      price_per_unit: parseFloat(item.price.toString()),
    });
  }

  const veeqoOrder: VeeqoOrderPayload = {
    deliver_to: {
      first_name: firstName || 'Guest',
      last_name: lastName || 'Customer',
      address1: shippingAddress.line1 || 'Unknown',
      address2: shippingAddress.line2 || '',
      city: shippingAddress.city || 'Unknown',
      state: shippingAddress.state || '',
      zip: shippingAddress.postal_code || '00000',
      country: shippingAddress.country || 'US',
      email: order.customer_email || 'guest@cosclubusa.com',
    },
    line_items_attributes: lineItems,
    channel_id: options.channelId,
    customer_attributes: {
      email: order.customer_email || 'guest@cosclubusa.com',
      first_name: firstName || 'Guest',
      last_name: lastName || 'Customer',
    },
    payment_status: 'paid',
    number: order.order_number,
  };

  if (options.warehouseId) {
    veeqoOrder.warehouse_id = options.warehouseId;
  }

  return veeqoOrder;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  resendApiKey: string
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Cosmetic Club <orders@cosclubusa.com>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email send failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

function generateShippingNotificationEmail(details: {
  order_number: string;
  customer_name: string;
  tracking_number: string;
}): string {
  const logoUrl =
    "https://gwwnscgpfurcbkqmfpbq.supabase.co/storage/v1/object/public/product-images/brands/1771321073443-xg7gsjxpzfq.jpg";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${logoUrl}" alt="Cosmetic Club" style="max-width: 140px; height: auto; display: block;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #111827; line-height: 1.2;">
                Your order has shipped
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Customer</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">${details.customer_name}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 18px; color: #111827; font-weight: 600;">#${details.order_number}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 0;">
                    <div style="font-size: 18px; color: #111827; font-weight: 600; font-family: 'Courier New', monospace;">${details.tracking_number}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center; font-size: 16px; font-weight: 500; color: #111827; margin-bottom: 4px;">
                Cosmetic Club
              </div>
              <div style="text-align: center; font-size: 14px; color: #6b7280;">
                <a href="mailto:orders@cosclubusa.com" style="color: #3b82f6; text-decoration: none;">orders@cosclubusa.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateDeliveryNotificationEmail(details: {
  order_number: string;
  customer_name: string;
  order_id?: string;
}): string {
  const logoUrl =
    "https://gwwnscgpfurcbkqmfpbq.supabase.co/storage/v1/object/public/product-images/brands/1771321073443-xg7gsjxpzfq.jpg";
  const orderUrl = details.order_id
    ? `https://cosclubusa.com/account?order=${details.order_id}`
    : "https://cosclubusa.com/account";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${logoUrl}" alt="Cosmetic Club" style="max-width: 140px; height: auto; display: block;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #111827; line-height: 1.2;">
                Your order has been delivered
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Customer</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">${details.customer_name}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 0;">
                    <div style="font-size: 18px; color: #111827; font-weight: 600;">#${details.order_number}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; font-size: 16px; color: #4b5563; line-height: 1.5;">
                We hope you enjoy your purchase.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <a href="${orderUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center;">
                View Order
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center; font-size: 16px; font-weight: 500; color: #111827; margin-bottom: 4px;">
                Cosmetic Club
              </div>
              <div style="text-align: center; font-size: 14px; color: #6b7280;">
                <a href="mailto:orders@cosclubusa.com" style="color: #3b82f6; text-decoration: none;">orders@cosclubusa.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
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
    console.log(`Order already synced to Veeqo: ${order.veeqo_order_id}`);
    return;
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", job.order_id);

  if (itemsError || !orderItems || orderItems.length === 0) {
    throw new Error(`Order items not found for order: ${job.order_id}`);
  }

  const veeqoPayload = await buildVeeqoOrder(order, orderItems, {
    channelId: parseInt(veeqoChannelId),
    warehouseId: veeqoWarehouseId ? parseInt(veeqoWarehouseId) : undefined,
    veeqoApiKey: veeqoApiKey,
  });

  console.log(
    "Creating Veeqo order payload:",
    JSON.stringify(veeqoPayload, null, 2)
  );

console.log("VEEQO ORDER PAYLOAD:");
console.log(JSON.stringify(veeqoPayload, null, 2));

const veeqoResponse = await fetch("https://api.veeqo.com/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": veeqoApiKey,
  },
  body: JSON.stringify({
    order: veeqoPayload
  }),
});

if (!veeqoResponse.ok) {
  const errorText = await veeqoResponse.text();
  console.error("VEEQO ORDER ERROR:");
  console.error(errorText);
  throw new Error(`Veeqo API error: ${veeqoResponse.status} - ${errorText}`);
}

  const veeqoOrder = await veeqoResponse.json();
  console.log("Veeqo order created:", veeqoOrder.id);

  await supabase
    .from("orders")
    .update({ veeqo_order_id: veeqoOrder.id.toString() })
    .eq("id", job.order_id);

  const nextCheck = new Date();
  nextCheck.setMinutes(nextCheck.getMinutes() + 10);

  await supabase.from("order_sync_jobs").insert({
    order_id: job.order_id,
    job_type: "check_shipment",
    status: "pending",
    next_run_at: nextCheck.toISOString(),
  });

  console.log("Created check_shipment job scheduled for", nextCheck.toISOString());
}

async function processCheckShipment(
  supabase: any,
  job: any,
  veeqoApiKey: string,
  resendApiKey: string
) {
  console.log(`Processing check_shipment for order ${job.order_id}`);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", job.order_id)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${job.order_id}`);
  }

  if (!order.veeqo_order_id) {
    throw new Error(
      `Order ${job.order_id} does not have a veeqo_order_id yet`
    );
  }

  const veeqoResponse = await fetch(
    `https://api.veeqo.com/orders/${order.veeqo_order_id}`,
    {
      method: "GET",
      headers: {
        "x-api-key": veeqoApiKey,
      },
    }
  );

  if (!veeqoResponse.ok) {
    const errorText = await veeqoResponse.text();
    throw new Error(`Veeqo API error: ${veeqoResponse.status} - ${errorText}`);
  }

  const veeqoOrder = await veeqoResponse.json();
  console.log("Veeqo order status:", veeqoOrder.deliver_to?.delivery_status);

  const deliveryStatus = veeqoOrder.deliver_to?.delivery_status;
  const trackingNumber = veeqoOrder.deliver_to?.tracking_number;
  const customerEmail = order.customer_email;
  const customerName = order.customer_name || "Customer";
  const displayOrderNumber = order.public_order_number
    ? `COS-${order.public_order_number}`
    : order.order_number;

  if (
    deliveryStatus === "shipped" &&
    !order.tracking_email_sent &&
    trackingNumber &&
    customerEmail
  ) {
    console.log("Order shipped - sending tracking email");

    const emailHtml = generateShippingNotificationEmail({
      order_number: displayOrderNumber,
      customer_name: customerName,
      tracking_number: trackingNumber,
    });

    await sendEmail(
      customerEmail,
      `Your Cosmetic Club order #${displayOrderNumber} has shipped`,
      emailHtml,
      resendApiKey
    );

    await supabase
      .from("orders")
      .update({ tracking_email_sent: true })
      .eq("id", job.order_id);

    console.log("Tracking email sent");

    const nextCheck = new Date();
    if (job.attempts < 12) {
      nextCheck.setMinutes(nextCheck.getMinutes() + 10);
    } else if (job.attempts < 48) {
      nextCheck.setHours(nextCheck.getHours() + 1);
    } else {
      nextCheck.setHours(nextCheck.getHours() + 6);
    }

    await supabase.from("order_sync_jobs").insert({
      order_id: job.order_id,
      job_type: "check_shipment",
      status: "pending",
      next_run_at: nextCheck.toISOString(),
    });

    console.log("Created new check_shipment job to monitor delivery, scheduled for", nextCheck.toISOString());
  } else if (
    deliveryStatus === "delivered" &&
    !order.delivery_email_sent &&
    customerEmail
  ) {
    console.log("Order delivered - sending delivery email");

    const emailHtml = generateDeliveryNotificationEmail({
      order_number: displayOrderNumber,
      customer_name: customerName,
      order_id: order.id,
    });

    await sendEmail(
      customerEmail,
      `Your Cosmetic Club order #${displayOrderNumber} has been delivered`,
      emailHtml,
      resendApiKey
    );

    await supabase
      .from("orders")
      .update({ delivery_email_sent: true })
      .eq("id", job.order_id);

    console.log("Delivery email sent - order lifecycle complete");
  } else if (deliveryStatus !== "shipped" && deliveryStatus !== "delivered") {
    console.log(
      `Order not shipped yet (status: ${deliveryStatus}), will check again later`
    );

    const nextCheck = new Date();
    if (job.attempts < 12) {
      nextCheck.setMinutes(nextCheck.getMinutes() + 10);
    } else if (job.attempts < 48) {
      nextCheck.setHours(nextCheck.getHours() + 1);
    } else {
      nextCheck.setHours(nextCheck.getHours() + 6);
    }

    await supabase.from("order_sync_jobs").insert({
      order_id: job.order_id,
      job_type: "check_shipment",
      status: "pending",
      next_run_at: nextCheck.toISOString(),
    });
  } else {
    console.log("No action needed - emails already sent or missing data");
  }
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
      .lte("next_run_at", new Date().toISOString())
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
            processing_started_at: new Date().toISOString(),
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
        } else if (job.job_type === "check_shipment") {
          const resendApiKey = Deno.env.get("RESEND_API_KEY");
          if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY configuration");
          }
          await processCheckShipment(supabase, job, veeqoApiKey, resendApiKey);
        } else {
          console.log(`Unknown job type: ${job.job_type}, marking as completed`);
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

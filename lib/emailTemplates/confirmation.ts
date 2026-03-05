interface OrderItem {
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  total: number;
}

export function generateOrderConfirmationEmail(
  order: OrderDetails,
  items: OrderItem[]
): string {
  const logoUrl = "https://gwwnscgpfurcbkqmfpbq.supabase.co/storage/v1/object/public/product-images/brands/1771321073443-xg7gsjxpzfq.jpg";

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80" style="padding-right: 16px; vertical-align: top;">
              ${
                item.product_image
                  ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />`
                  : `<div style="width: 80px; height: 80px; background-color: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb;"></div>`
              }
            </td>
            <td style="vertical-align: top;">
              <div style="font-size: 16px; font-weight: 500; color: #111827; margin-bottom: 4px;">
                ${item.product_name}
              </div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                Quantity: ${item.quantity}
              </div>
              <div style="font-size: 16px; font-weight: 600; color: #111827;">
                $${item.price.toFixed(2)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join("");

  const shippingAddressHtml = `
    ${order.shipping_address.line1}<br />
    ${order.shipping_address.line2 ? `${order.shipping_address.line2}<br />` : ""}
    ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}<br />
    ${order.shipping_address.country}
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${logoUrl}" alt="Cosmetic Club" style="max-width: 140px; height: auto; display: block;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #111827; line-height: 1.2;">
                Thank you for your order!
              </h1>
            </td>
          </tr>

          <!-- Customer Info -->
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
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">${order.customer_name}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="font-size: 18px; color: #111827; font-weight: 600;">#${order.order_number}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">
                Order Items
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #111827; padding-top: 16px;">
                <tr>
                  <td align="left" style="padding: 8px 0;">
                    <span style="font-size: 18px; font-weight: 600; color: #111827;">Total</span>
                  </td>
                  <td align="right" style="padding: 8px 0;">
                    <span style="font-size: 20px; font-weight: 700; color: #111827;">$${order.total.toFixed(2)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">
                Shipping Address
              </div>
              <div style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                ${shippingAddressHtml}
              </div>
            </td>
          </tr>

          <!-- Footer Message -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center; font-size: 15px; color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                We'll notify you when your order ships.
              </div>
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

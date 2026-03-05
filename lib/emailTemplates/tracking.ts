interface ShippingDetails {
  order_number: string;
  customer_name: string;
  tracking_number: string;
}

type Carrier = 'USPS' | 'UPS' | 'FedEx' | 'Unknown';

function detectCarrier(trackingNumber: string): Carrier {
  const cleaned = trackingNumber.replace(/\s+/g, '').toUpperCase();

  if (/^(94|93|92|94|95)[0-9]{20}$/.test(cleaned) || /^[0-9]{20,22}$/.test(cleaned)) {
    return 'USPS';
  }

  if (/^1Z[0-9A-Z]{16}$/.test(cleaned)) {
    return 'UPS';
  }

  if (/^[0-9]{12,14}$/.test(cleaned) || /^[0-9]{15}$/.test(cleaned) || /^[0-9]{20}$/.test(cleaned)) {
    return 'FedEx';
  }

  return 'Unknown';
}

function getTrackingUrl(trackingNumber: string, carrier: Carrier): string {
  const cleaned = trackingNumber.replace(/\s+/g, '');

  switch (carrier) {
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleaned}`;
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${cleaned}`;
    case 'FedEx':
      return `https://www.fedex.com/fedextrack/?trknbr=${cleaned}`;
    default:
      return '#';
  }
}

export function generateShippingNotificationEmail(
  details: ShippingDetails
): string {
  const logoUrl = "https://gwwnscgpfurcbkqmfpbq.supabase.co/storage/v1/object/public/product-images/brands/1771321073443-xg7gsjxpzfq.jpg";
  const carrier = detectCarrier(details.tracking_number);
  const trackingUrl = getTrackingUrl(details.tracking_number, carrier);

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
                Your order has shipped
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
                  <td style="padding-bottom: ${carrier !== 'Unknown' ? '8px' : '0'};">
                    <div style="font-size: 18px; color: #111827; font-weight: 600; font-family: 'Courier New', monospace;">${details.tracking_number}</div>
                  </td>
                </tr>
                ${carrier !== 'Unknown' ? `
                <tr>
                  <td>
                    <div style="font-size: 14px; color: #6b7280;">Carrier: ${carrier}</div>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          ${carrier !== 'Unknown' ? `
          <!-- Track Package Button -->
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <a href="${trackingUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center;">
                Track Package
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
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

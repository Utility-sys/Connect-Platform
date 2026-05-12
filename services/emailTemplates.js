/**
 * Connect Platforms: Professional Email Template Engine
 * Optimized for mobile readability, accessibility, and high-end visual branding.
 */

const BASE_STYLES = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #1e293b;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const HEADER_GRADIENT = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
const ACCENT_COLOR    = '#3b82f6';
const ERROR_COLOR     = '#ef4444';
const WARNING_COLOR   = '#f59e0b';
const SUCCESS_COLOR   = '#10b981';



// ── Header ────────────────────────────────────────────────────────────────────
const header = () => `
  <div style="background: #ffffff; padding: 24px 30px; text-align: left; border-radius: 16px 16px 0 0; border-bottom: 1px solid #e2e8f0;">
    <img src="cid:connectlogo" alt="Connect Platform" style="height: 32px; max-width: 100%; display: block; object-fit: contain;" />
  </div>`;

// ── Footer ────────────────────────────────────────────────────────────────────
const footer = () => `
  <div style="background: #f8fafc; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: 0;">
    <p style="margin: 0; font-size: 12px; color: #94a3b8; letter-spacing: 0.5px;">
      &copy; 2026 <b>CONNECT PLATFORMS</b>. All rights reserved.<br/>
      The Industry Standard in Venue Management.
    </p>
  </div>`;

// ── Wrapper ───────────────────────────────────────────────────────────────────
const wrap = (content) => `
  <div style="${BASE_STYLES}; background: #f8fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      ${header()}
      <div style="padding: 40px 30px;">
        ${content}
      </div>
      ${footer()}
    </div>
  </div>`;

/**
 * Intelligent Time Slot Formatting
 * Merges contiguous slots (e.g., [6, 7] becomes 06:00 - 08:00)
 */
const formatSlots = (slots) => {
  if (!slots || !Array.isArray(slots) || slots.length === 0) return '—';
  const hours = [...new Set(slots.map(Number))].sort((a, b) => a - b);
  
  const groups = [];
  if (hours.length > 0) {
    let currentGroup = [hours[0]];
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === hours[i - 1] + 1) {
        currentGroup.push(hours[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [hours[i]];
      }
    }
    groups.push(currentGroup);
  }

  return groups.map(group => {
    const start = String(group[0]).padStart(2, '0') + ':00';
    const end   = String(group[group.length - 1] + 1).padStart(2, '0') + ':00';
    return `${start} - ${end}`;
  }).join(', ');
};

// ══════════════════════════════════════════════════════════════════════════════
//  BOOKING CONFIRMED — Customer copy
// ══════════════════════════════════════════════════════════════════════════════
exports.bookingConfirmed = (user, venue, booking) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">Reservation Confirmed!</h2>
    <p>Hi <strong>${user.firstName || 'there'}</strong>, your booking at
       <span style="color: ${ACCENT_COLOR}; font-weight: bold;">${venue.name}</span>
       is secured. We've notified the venue owner, and they're excited to host you!</p>

    <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Booking Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr><td style="padding: 8px 0; color: #475569;">Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #475569;">Session Time</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${formatSlots(booking.timeSlots)}</td></tr>
        <tr><td style="padding: 8px 0; color: #475569;">Location</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${venue.location}</td></tr>
        <tr>
          <td style="padding: 16px 0 0 0; color: #0f172a; font-weight: bold; border-top: 1px solid #cbd5e1;">Total Amount</td>
          <td style="padding: 16px 0 0 0; text-align: right; font-weight: 800; color: ${ACCENT_COLOR}; border-top: 1px solid #cbd5e1;">LKR ${booking.totalAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="http://localhost:5173/customer-dashboard"
         style="background: ${ACCENT_COLOR}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        View in Dashboard
      </a>
    </div>

    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">Please arrive 10 minutes early for a smooth check-in.</p>
  `;
  return wrap(content);
};

// ══════════════════════════════════════════════════════════════════════════════
//  BOOKING CONFIRMED — Owner copy (separate, revenue-focused email)
// ══════════════════════════════════════════════════════════════════════════════
exports.bookingConfirmedForOwner = (owner, venue, booking, customer) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">New Booking Confirmed!</h2>
    <p>Hi <strong>${owner.firstName || 'there'}</strong>, a reservation at
       <span style="font-weight: bold; color: ${SUCCESS_COLOR};">${venue.name}</span>
       has just been <strong>confirmed</strong>. Here are the full details:</p>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #166534;">Customer Details</h3>
      <p style="margin: 0; font-weight: bold; color: #0f172a; font-size: 16px;">${customer.firstName} ${customer.lastName}</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${customer.email}</p>
      ${customer.phone ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${customer.phone}</p>` : ''}

      <hr style="border: 0; border-top: 1px solid #bbf7d0; margin: 20px 0;" />

      <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #166534;">Reservation Schedule</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr><td style="padding: 8px 0; color: #475569;">Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #475569;">Session Time</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatSlots(booking.timeSlots)}</td></tr>
        <tr><td style="padding: 8px 0; color: #475569;">Venue</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${venue.name}</td></tr>
        <tr>
          <td style="padding: 16px 0 0 0; color: #0f172a; font-weight: bold; border-top: 1px solid #bbf7d0;">Revenue Earned</td>
          <td style="padding: 16px 0 0 0; text-align: right; font-weight: 800; color: ${SUCCESS_COLOR}; border-top: 1px solid #bbf7d0; font-size: 18px;">LKR ${booking.totalAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="http://localhost:5173/owner-dashboard"
         style="background: ${SUCCESS_COLOR}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Open Venue Portal
      </a>
    </div>

    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">
      Manage your upcoming bookings and revenue insights in your <strong>Venue Portal</strong>.
    </p>
  `;
  return wrap(content, 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)');
};

// ══════════════════════════════════════════════════════════════════════════════
//  BOOKING REMINDER
// ══════════════════════════════════════════════════════════════════════════════
exports.bookingReminder = (user, venue, booking) => {
  const content = `
    <h2 style="margin-top: 0; color: #92400e; font-size: 24px;">Coming Up Soon!</h2>
    <p>Hi <strong>${user.firstName || 'there'}</strong>, this is a friendly reminder that your session at
       <b>${venue.name}</b> starts in less than 4 hours.</p>

    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="margin: 0; font-size: 15px; color: #92400e;"><b>Date:</b> ${booking.date}</p>
      <p style="margin: 12px 0 0 0; font-size: 15px; color: #92400e;"><b>Time:</b> ${formatSlots(booking.timeSlots)} (Local Time)</p>
      <p style="margin: 12px 0 0 0; font-size: 15px; color: #92400e;"><b>Location:</b> ${venue.location}</p>
    </div>

    <p style="font-size: 14px; color: #475569;">
      Need directions or want to contact the host? Access your booking details in the
      <a href="http://localhost:5173/customer-dashboard"
         style="color: ${WARNING_COLOR}; font-weight: bold; text-decoration: none;">Customer Portal</a>.
    </p>
  `;
  return wrap(content, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)');
};

// ══════════════════════════════════════════════════════════════════════════════
//  EMERGENCY CANCELLATION
// ══════════════════════════════════════════════════════════════════════════════
exports.emergencyCancellation = (user, venue, booking, reason) => {
  const content = `
    <h2 style="margin-top: 0; color: ${ERROR_COLOR}; font-size: 24px;">Important: Booking Cancelled</h2>
    <p>Dear <strong>${user.firstName || 'Valued Customer'}</strong>, we regret to inform you that your booking at
       <b>${venue.name}</b> has been cancelled by the venue owner due to an emergency.</p>

    <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: ${ERROR_COLOR};">Official Reason</h3>
      <p style="margin: 0; font-size: 16px; color: #991b1b; font-style: italic;">"${reason || 'Unexpected venue emergency'}"</p>
    </div>

    <div style="font-size: 14px; color: #475569; background: #f8fafc; padding: 20px; border-radius: 12px;">
      <p style="margin: 0;"><b>Booking ID:</b> #${booking.id}</p>
      <p style="margin: 8px 0 0 0;"><b>Original Date:</b> ${booking.date}</p>
      <p style="margin: 8px 0 0 0;"><b>Refund Status:</b> Any payments made will be fully refunded to your original payment method within 3–5 business days.</p>
    </div>

    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">
      We apologize for the inconvenience and invite you to
      <a href="http://localhost:5173/search" style="color: ${ACCENT_COLOR}; text-decoration: none; font-weight: bold;">Explore other venues</a>
      on Connect Platforms.
    </p>
  `;
  return wrap(content, 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)');
};

// ══════════════════════════════════════════════════════════════════════════════
//  BOOKING EDITED
// ══════════════════════════════════════════════════════════════════════════════
exports.bookingEdited = (user, venue, booking) => {
  const content = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">Reservation Updated</h2>
    <p>Hi <strong>${user.firstName || 'there'}</strong>, your booking at
       <span style="color: ${ACCENT_COLOR}; font-weight: bold;">${venue.name}</span>
       has been successfully rescheduled.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Updated Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr><td style="padding: 8px 0; color: #475569;">New Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #475569;">Session Time</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatSlots(booking.timeSlots)}</td></tr>
        <tr>
          <td style="padding: 16px 0 0 0; color: #0f172a; font-weight: bold; border-top: 1px solid #cbd5e1;">Booking ID</td>
          <td style="padding: 16px 0 0 0; text-align: right; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1;">#${booking.id}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="http://localhost:5173/customer-dashboard"
         style="background: #0f172a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Manage Booking
      </a>
    </div>
  `;
  return wrap(content);
};

// ══════════════════════════════════════════════════════════════════════════════
//  WELCOME
// ══════════════════════════════════════════════════════════════════════════════
exports.welcomeEmail = (user) => {
  const isOwner = user.role === 'owner';

  const ownerContent = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">Welcome to Connect, ${user.firstName}!</h2>
    <p style="font-size: 16px; color: #334155;">
      Your venue owner account is now active. Connect is Sri Lanka's leading venue management platform,
      and we're thrilled to have you onboard as a venue partner.
    </p>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #166534;">Get Started as a Venue Partner</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
        <li>List your venue and set competitive pricing</li>
        <li>Manage availability with real-time slot control</li>
        <li>Track bookings, revenue, and performance analytics</li>
        <li>Receive instant notifications for every new reservation</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="http://localhost:5173/owner-dashboard"
         style="background: ${SUCCESS_COLOR}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Go to Venue Portal
      </a>
    </div>
  `;

  const customerContent = `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 24px;">Welcome to Connect, ${user.firstName}!</h2>
    <p style="font-size: 16px; color: #334155;">
      Your account is ready. Connect helps you discover and book the finest sports courts, music studios,
      and entertainment venues across Sri Lanka.
    </p>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #1e40af;">What You Can Do on Connect</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
        <li>Browse verified venues by category and price</li>
        <li>Book your preferred time slot in seconds</li>
        <li>Manage all your bookings in one dashboard</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="http://localhost:5173/search"
         style="background: ${ACCENT_COLOR}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Explore Venues
      </a>
    </div>
  `;

  const content = isOwner ? ownerContent : customerContent;
  const bg = isOwner
    ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';

  return wrap(content, bg);
};

exports.newBookingForOwner = exports.bookingConfirmedForOwner;

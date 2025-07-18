import { MailService } from '@sendgrid/mail';
import { storage } from './storage';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email reporting will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface DailyReportData {
  date: string;
  trips: any[];
  expenses: any[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalTrips: number;
  totalPassengers: number;
  averageRevenuePerTrip: number;
}

export async function generateDailyReport(date: Date = new Date()): Promise<DailyReportData> {
  // Set date to start of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get trips and expenses for the day
  const dayTrips = await storage.getTripsByDateRange(startOfDay, endOfDay);
  const expenses = await storage.getExpensesByDateRange(startOfDay, endOfDay);

  // Calculate totals
  const totalRevenue = dayTrips.reduce((sum, trip) => sum + parseFloat(trip.revenue || '0'), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || '0'), 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalPassengers = dayTrips.reduce((sum, trip) => sum + trip.initialPassengers, 0);
  const averageRevenuePerTrip = dayTrips.length > 0 ? totalRevenue / dayTrips.length : 0;

  return {
    date: date.toISOString().split('T')[0],
    trips: dayTrips,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome,
    totalTrips: dayTrips.length,
    totalPassengers,
    averageRevenuePerTrip
  };
}

export function generateEmailHTML(reportData: DailyReportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Transit Report - ${reportData.date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1f2937; margin: 0; font-size: 28px; }
        .header p { color: #6b7280; margin: 5px 0 0 0; font-size: 16px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #3b82f6; }
        .metric h3 { margin: 0 0 10px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric .value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .metric.revenue .value { color: #059669; }
        .metric.expense .value { color: #dc2626; }
        .metric.net .value { color: ${reportData.netIncome >= 0 ? '#059669' : '#dc2626'}; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
        .trip-list, .expense-list { background: #f9fafb; border-radius: 8px; overflow: hidden; }
        .trip, .expense { padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .trip:last-child, .expense:last-child { border-bottom: none; }
        .trip-info, .expense-info { flex: 1; }
        .trip-route, .expense-desc { font-weight: 600; color: #1f2937; margin-bottom: 5px; }
        .trip-details, .expense-details { font-size: 14px; color: #6b7280; }
        .trip-revenue, .expense-amount { font-weight: bold; font-size: 16px; }
        .trip-revenue { color: #059669; }
        .expense-amount { color: #dc2626; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .no-data { text-align: center; padding: 40px; color: #6b7280; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Transit Tracker Daily Report</h1>
          <p>${new Date(reportData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="summary">
          <div class="metric revenue">
            <h3>Total Revenue</h3>
            <div class="value">$${reportData.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="metric expense">
            <h3>Total Expenses</h3>
            <div class="value">$${reportData.totalExpenses.toFixed(2)}</div>
          </div>
          <div class="metric net">
            <h3>Net Income</h3>
            <div class="value">$${reportData.netIncome.toFixed(2)}</div>
          </div>
          <div class="metric">
            <h3>Total Trips</h3>
            <div class="value">${reportData.totalTrips}</div>
          </div>
          <div class="metric">
            <h3>Passengers Served</h3>
            <div class="value">${reportData.totalPassengers}</div>
          </div>
          <div class="metric">
            <h3>Avg Revenue/Trip</h3>
            <div class="value">$${reportData.averageRevenuePerTrip.toFixed(2)}</div>
          </div>
        </div>

        <div class="section">
          <h2>Trips Completed (${reportData.trips.length})</h2>
          <div class="trip-list">
            ${reportData.trips.length === 0 ? 
              '<div class="no-data">No trips completed today</div>' :
              reportData.trips.map(trip => `
                <div class="trip">
                  <div class="trip-info">
                    <div class="trip-route">${trip.origin} → ${trip.destination}</div>
                    <div class="trip-details">
                      ${trip.initialPassengers} passengers • Started: ${new Date(trip.startTime).toLocaleTimeString()}
                      ${trip.endTime ? ` • Completed: ${new Date(trip.endTime).toLocaleTimeString()}` : ''}
                      • Driver: ${trip.driverName || 'Unknown'}
                    </div>
                  </div>
                  <div class="trip-revenue">$${parseFloat(trip.revenue || '0').toFixed(2)}</div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="section">
          <h2>Expenses Recorded (${reportData.expenses.length})</h2>
          <div class="expense-list">
            ${reportData.expenses.length === 0 ? 
              '<div class="no-data">No expenses recorded today</div>' :
              reportData.expenses.map(expense => `
                <div class="expense">
                  <div class="expense-info">
                    <div class="expense-desc">${expense.description}</div>
                    <div class="expense-details">
                      Category: ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      ${expense.notes ? ` • ${expense.notes}` : ''}
                    </div>
                  </div>
                  <div class="expense-amount">-$${parseFloat(expense.amount || '0').toFixed(2)}</div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <div class="footer">
          <p>Generated automatically by Transit Tracker • ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendDailyReport(
  toEmail: string, 
  fromEmail: string = 'noreply@transit-tracker.com',
  date: Date = new Date()
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured. Email report not sent.");
    return false;
  }

  try {
    const reportData = await generateDailyReport(date);
    const htmlContent = generateEmailHTML(reportData);
    
    const message = {
      to: toEmail,
      from: fromEmail,
      subject: `Transit Tracker Daily Report - ${reportData.date}`,
      html: htmlContent,
      text: `Daily Transit Report for ${reportData.date}
      
Total Revenue: $${reportData.totalRevenue.toFixed(2)}
Total Expenses: $${reportData.totalExpenses.toFixed(2)}
Net Income: $${reportData.netIncome.toFixed(2)}
Total Trips: ${reportData.totalTrips}
Passengers Served: ${reportData.totalPassengers}
Average Revenue per Trip: $${reportData.averageRevenuePerTrip.toFixed(2)}

This report was generated automatically by Transit Tracker.`
    };

    await mailService.send(message);
    console.log(`Daily report sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending daily report:', error);
    return false;
  }
}

// Schedule daily reports (this would typically be called by a cron job)
export function scheduleDailyReport(toEmail: string, fromEmail?: string) {
  // Send report every day at 11:59 PM
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  
  const timeUntilReport = tomorrow.getTime() - now.getTime();
  
  setTimeout(async () => {
    await sendDailyReport(toEmail, fromEmail);
    // Schedule the next report for the following day
    setInterval(async () => {
      await sendDailyReport(toEmail, fromEmail);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntilReport);
  
  console.log(`Daily reports scheduled for ${toEmail}. Next report at ${tomorrow.toLocaleString()}`);
}
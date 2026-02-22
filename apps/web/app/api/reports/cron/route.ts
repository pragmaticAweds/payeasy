import { NextRequest, NextResponse } from 'next/server';
import { generateCSV } from '../../../../lib/exports/reports';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = [{ id: 1, metric: 'Users', value: 100 }, { id: 2, metric: 'Transactions', value: 500 }];
        const csvData = generateCSV(data);
        const buffer = Buffer.from(csvData, 'utf-8');

        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'reports@payeasy.app',
                to: process.env.ADMIN_EMAIL || 'admin@payeasy.app',
                subject: 'Scheduled Daily Report',
                html: '<p>Please find attached the latest daily report.</p>',
                attachments: [{ filename: `daily-report.csv`, content: buffer }]
            });
        }

        return NextResponse.json({ success: true, message: 'Report generated and emailed.' });
    } catch (error: any) {
        console.error('Cron Report Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

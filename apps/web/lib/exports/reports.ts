import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { renderToStream, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

export type ReportItem = Record<string, any>;

export const generateCSV = (data: ReportItem[]): string => Papa.unparse(data);

export const generateExcel = (data: ReportItem[]): Buffer => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10 },
    header: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    row: { flexDirection: 'row', borderBottom: '1px solid #ccc', padding: 4 },
    cell: { flex: 1, padding: 2 },
});

const ReportDocument = ({ data, title }: { data: ReportItem[]; title: string }) => {
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    return React.createElement(Document, null,
        React.createElement(Page, { size: 'A4', style: styles.page },
            React.createElement(Text, { style: styles.header }, title),
            React.createElement(View, { style: styles.row },
                headers.map((h, i) => React.createElement(Text, { key: i, style: styles.cell }, h))
            ),
            data.map((row, i) =>
                React.createElement(View, { key: i, style: styles.row },
                    headers.map((h, j) => React.createElement(Text, { key: j, style: styles.cell }, String(row[h] ?? '')))
                )
            )
        )
    );
};

export const generatePDF = async (data: ReportItem[], title: string = 'Report'): Promise<Buffer> => {
    const stream = await renderToStream(React.createElement(ReportDocument, { data, title }));
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};

export const trackReportGeneration = async (
    userId: string,
    type: string,
    format: string,
    filterDescription: string
) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('report_history').insert({
        user_id: userId,
        report_type: type,
        format,
        filters: filterDescription,
        generated_at: new Date().toISOString(),
    });
};

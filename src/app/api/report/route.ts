import { generateReportAction } from "@/app/reports/actions";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // We are not validating the body here, assuming the action will do it.
        const result = await generateReportAction(body);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in /api/report:', error);
        if (error instanceof Error) {
            // Return the actual error message for better debugging
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown internal server error occurred.' }, { status: 500 });
    }
}

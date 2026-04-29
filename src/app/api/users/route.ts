import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json(
		{ message: 'Not implemented. Use /api/erpnext for backend requests.' },
		{ status: 501 }
	);
}

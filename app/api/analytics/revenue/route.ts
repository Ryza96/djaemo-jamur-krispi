import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/analytics/revenue
 * Menampilkan total penjualan (revenue) dari order yang sudah dibayar
 * 
 * Query params:
 * - status: filter berdasarkan status (default: 'paid')
 * - months: berapa bulan ke belakang (default: 1 = bulan ini)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'paid';
    const months = parseInt(searchParams.get('months') || '1', 10);

    // Hitung date untuk filter
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    let query = supabase
      .from('orders')
      .select('total_amount', { count: 'exact' });

    // Filter berdasarkan status (default 'paid' = lunas)
    if (status) {
      query = query.eq('status', status);
    }

    // Filter berdasarkan tanggal
    query = query.gte('created_at', startDate.toISOString());

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Hitung total
    const totalRevenue = (data || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const orderCount = count || 0;

    return NextResponse.json({
      total_revenue: totalRevenue,
      order_count: orderCount,
      status: status,
      period_months: months,
      period_start: startDate.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('GET /api/analytics/revenue exception:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

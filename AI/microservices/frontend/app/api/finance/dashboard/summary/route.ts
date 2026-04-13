import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock dashboard data
    return NextResponse.json({
      income: 50000000,
      expense: 12500000,
      balance: 37500000,
      categoryBreakdown: [
        { name: 'Ăn uống', total: 3500000, percentage: 28, description: 'Tiền ăn uống hàng ngày' },
        { name: 'Di chuyển', total: 2500000, percentage: 20, description: 'Xăng, taxi, grab' },
        { name: 'Mua sắm', total: 3000000, percentage: 24, description: 'Quần áo, đồ dùng' },
        { name: 'Giải trí', total: 2000000, percentage: 16, description: 'Phim, game, du lịch' },
        { name: 'Hóa đơn', total: 1500000, percentage: 12, description: 'Điện, nước, mạng' },
      ],
      recentTransactions: [
        {
          id: 'txn-1',
          amount: 500000,
          category: 'Ăn uống',
          description: 'Cơm trưa tại nhà hàng',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'expense',
        },
        {
          id: 'txn-2',
          amount: 1000000,
          category: 'Mua sắm',
          description: 'Quần áo tại Shopee',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'expense',
        },
        {
          id: 'txn-3',
          amount: 300000,
          category: 'Di chuyển',
          description: 'Đổ xăng',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'expense',
        },
      ],
      monthlyStats: {
        'Tháng 3': {
          income: 45000000,
          expense: 11000000,
        },
        'Tháng 4': {
          income: 50000000,
          expense: 12500000,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch dashboard: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

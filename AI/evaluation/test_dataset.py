
NLP_TEST_DATA = [
    {
        "text": "Sáng nay ăn phở hết 55k",
        "expected": {"amount": 55000.0, "category": "Ăn uống", "type": "expense"}
    },
    {
        "text": "Vừa nhận lương 15 triệu từ công ty",
        "expected": {"amount": 15000000.0, "category": "Lương", "type": "income"}
    },
    {
        "text": "Đổ xăng xe máy mất 80.000đ",
        "expected": {"amount": 80000.0, "category": "Di chuyển", "type": "expense"}
    },
    {
        "text": "Thanh toán tiền điện 1.250.000 vnđ",
        "expected": {"amount": 1250000.0, "category": "Hóa đơn", "type": "expense"}
    },
    {
        "text": "Được mẹ cho 5 lít tiêu vặt",
        "expected": {"amount": 500000.0, "category": "Thu nhập khác", "type": "income"}
    },
    {
        "text": "Mua 2 quyển sách trên shopee hết 320k",
        "expected": {"amount": 320000.0, "category": "Mua sắm", "type": "expense"}
    },
    {
        "text": "Đi karaoke với bạn hết 1 củ 2",
        "expected": {"amount": 1200000.0, "category": "Giải trí", "type": "expense"}
    },
    {
        "text": "Lì xì cho cháu 200 ngàn",
        "expected": {"amount": 200000.0, "category": "Lì xì", "type": "expense"}
    },
    {
        "text": "Nộp học phí tiếng Anh 5.5tr",
        "expected": {"amount": 5500000.0, "category": "Giáo dục", "type": "expense"}
    },
    {
        "text": "Bán hàng online được 450.000đ",
        "expected": {"amount": 450000.0, "category": "Kinh doanh", "type": "income"}
    },
    {
        "text": "Mua thuốc đau bụng hết 45k",
        "expected": {"amount": 45000.0, "category": "Sức khỏe", "type": "expense"}
    },
    {
        "text": "Tiền mạng tháng này là 220k",
        "expected": {"amount": 220000.0, "category": "Hóa đơn", "type": "expense"}
    },
    {
        "text": "Taxi về nhà mất 150 nghìn",
        "expected": {"amount": 150000.0, "category": "Di chuyển", "type": "expense"}
    },
    {
        "text": "Đóng bảo hiểm nhân thọ 2.5 triệu",
        "expected": {"amount": 2500000.0, "category": "Bảo hiểm", "type": "expense"}
    },
    {
        "text": "Mua bó rau ngoài chợ hết 15.000",
        "expected": {"amount": 15000.0, "category": "Mua sắm", "type": "expense"}
    }
]

ADVISOR_TEST_SCENARIOS = [
    {
        "name": "Nợ nhiều, muốn mua đồ công nghệ",
        "query": "Tôi có nên mua iPhone 16 Pro Max ngay bây giờ không?",
        "context": {
            "balance": 5000000,
            "totalIncome": 20000000,
            "totalExpense": 18000000,
            "categoryBreakdown": [
                {"name": "Trả nợ", "total": 10000000},
                {"name": "Ăn uống", "total": 5000000}
            ]
        }
    },
    {
        "name": "Chi tiêu ăn uống quá cao",
        "query": "Tại sao tôi không tiết kiệm được tiền tháng này?",
        "context": {
            "balance": 500000,
            "totalIncome": 15000000,
            "totalExpense": 14500000,
            "categoryBreakdown": [
                {"name": "Ăn uống", "total": 8000000},
                {"name": "Mua sắm", "total": 4000000}
            ]
        }
    },
    {
        "name": "Tư vấn đầu tư ban đầu",
        "query": "Tôi nên làm gì với số dư 50 triệu hiện tại?",
        "context": {
            "balance": 50000000,
            "totalIncome": 25000000,
            "totalExpense": 10000000,
            "categoryBreakdown": [
                {"name": "Nhà cửa", "total": 5000000}
            ]
        }
    }
]
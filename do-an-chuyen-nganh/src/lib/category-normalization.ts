export function normalizeCategoryName(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function cleanCategoryName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}

export function getCategoryIdentityKey(name: string, type: string): string {
  return `${normalizeCategoryName(name)}|${type}`
}

const VIETNAMESE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'mua-sam': [
    'mua sam',
    'quần áo',
    'ao quan',
    'thời trang',
    'giày dép',
    'giay dep',
    'túi xách',
    'tui xach',
    'trang sức',
    'trang suc',
    'makeup',
    'son môi',
    'son moi',
    'sữa rửa mặt',
    'sua rua mat',
    'quần',
    'áo',
    'váy',
    'đầm',
    'nón',
    'mũ',
    'kính',
    'đồng hồ',
    'dong ho',
    'mua hang',
    'shopping',
    'order',
    'cửa hàng',
    'cua hang',
  ],
  'an-uong': [
    'an uong',
    'ăn sáng',
    'an sang',
    'ăn trưa',
    'an trua',
    'ăn tối',
    'an toi',
    'cơm',
    'com',
    'phở',
    'pho',
    'bún',
    'bun',
    'bánh mì',
    'banh mi',
    'cafe',
    'cà phê',
    'ca phe',
    'trà',
    'tra',
    'nước',
    'nuoc',
    'thức ăn',
    'thuc an',
    'nhà hàng',
    'nha hang',
    'quán ăn',
    'quan an',
    'siêu thị',
    'sieu thi',
    'mart',
    'winmart',
    'circle k',
    'gs25',
    'miniso',
  ],
  'di-chuyen': [
    'di chuyen',
    'xe',
    'ô tô',
    'o to',
    'ô tô',
    'xe máy',
    'xe may',
    'xăng',
    'xang',
    'dầu',
    'dau',
    'grab',
    'taxi',
    'bay',
    'máy bay',
    'may bay',
    'tàu',
    'tau',
    'xe buýt',
    'xe buyt',
    'bus',
    'metro',
    'uber',
    'be',
    'gojek',
  ],
  'nha-cua': [
    'nha cua',
    'điện',
    'dien',
    'nước',
    'nuoc',
    'wifi',
    'internet',
    'thuê nhà',
    'thue nha',
    'mướn',
    'muon',
    'điện thoại',
    'dien thoai',
    'sim',
    'viettel',
    'mobifone',
    'vinaphone',
    'fpt',
    'gas',
    'bếp',
    'bep',
  ],
  'giai-tri': [
    'giải trí',
    'giai tri',
    'phim',
    'phim chiếu',
    'rap',
    'rạp',
    'netflix',
    'spotify',
    'nhạc',
    'nhac',
    'game',
    'trò chơi',
    'tro choi',
    'sách',
    'sach',
    'book',
    'kawaii',
    'lego',
  ],
  'suc-khoe': [
    'sức khỏe',
    'suc khoe',
    'thuốc',
    'thuoc',
    'bệnh viện',
    'benh vien',
    'khám',
    'kham',
    'bác sĩ',
    'bac si',
    'phòng khám',
    'phong kham',
    'y tế',
    'y te',
    'bảo hiểm',
    'bao hiem',
    'vitamin',
    'thực phẩm chức năng',
    'thuc pham chuc nang',
    'điều dưỡng',
    'dieu duong',
  ],
  'hoc-vien': [
    'học',
    'hoc',
    'học phí',
    'hoc phi',
    'khóa học',
    'khoa hoc',
    'sách',
    'sach',
    'vở',
    'vo',
    'bút',
    'but',
    'tập',
    'tap',
    'dụng cụ',
    'dung cu',
    'trường',
    'truong',
    'lớp',
    'lop',
    'khoa',
    'đại học',
    'dai hoc',
    'university',
    'school',
  ],
  'khac': [],
}

export function findMatchingCategoryByKeyword(
  input: string,
  availableCategories: Array<{ id: string | number; name: string; type: string }>,
): { id: string | number; name: string; type: string } | null {
  const normalizedInput = normalizeCategoryName(input)
  if (!normalizedInput) return null

  const matchingCategoryNames = new Map<string, string>()

  for (const [categoryKey, keywords] of Object.entries(VIETNAMESE_CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword) || keyword.includes(normalizedInput)) {
        const category = availableCategories.find(
          (c) => normalizeCategoryName(c.name).includes(categoryKey.replace('-', '')) || categoryKey.replace('-', '') === normalizeCategoryName(c.name),
        )
        if (category) {
          matchingCategoryNames.set(categoryKey, category.name)
        }
      }
    }
  }

  if (matchingCategoryNames.size === 0) return null

  const firstMatch = matchingCategoryNames.values().next().value
  return availableCategories.find((c) => c.name === firstMatch) ?? null
}

export function findBestCategoryMatch(
  input: string,
  availableCategories: Array<{ id: string | number; name: string; type: string }>,
): { id: string | number; name: string; type: string; confidence: 'high' | 'medium' | 'low' } | null {
  const normalizedInput = normalizeCategoryName(input)
  if (!normalizedInput) return null

  const highConfidenceMatch = availableCategories.find((c) => {
    const normalizedName = normalizeCategoryName(c.name)
    return normalizedInput === normalizedName || normalizedInput.includes(normalizedName) || normalizedName.includes(normalizedInput)
  })
  if (highConfidenceMatch) {
    return { ...highConfidenceMatch, confidence: 'high' }
  }

  const keywordMatch = findMatchingCategoryByKeyword(input, availableCategories)
  if (keywordMatch) {
    return { ...keywordMatch, confidence: 'medium' }
  }

  const partialMatch = availableCategories.find((c) => {
    const normalizedName = normalizeCategoryName(c.name)
    const firstWordInput = normalizedInput.split(' ')[0]
    const firstWordCategory = normalizedName.split(' ')[0]
    return firstWordInput.length >= 3 && firstWordCategory.length >= 3 && (firstWordInput.includes(firstWordCategory) || firstWordCategory.includes(firstWordInput))
  })
  if (partialMatch) {
    return { ...partialMatch, confidence: 'low' }
  }

  return null
}

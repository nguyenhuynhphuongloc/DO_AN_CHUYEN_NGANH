'use client'

import React from 'react'
import * as LucideIcons from 'lucide-react'

interface Props {
  icon: string
  size?: number
  className?: string
}

const legacyIconMap: Record<string, string> = {
  '🍔': 'Utensils',
  '🏠': 'House',
  '🚗': 'Car',
  '🎮': 'Gamepad2',
  '💰': 'CircleDollarSign',
  '📚': 'BookOpen',
  '💊': 'HeartPulse',
  '🎁': 'Gift',
  '✈️': 'Plane',
  '👕': 'Shirt',
  '💼': 'BriefcaseBusiness',
  '📱': 'Smartphone',
  '🎬': 'Clapperboard',
  '☕': 'Coffee',
  '🛒': 'ShoppingCart',
  '💡': 'Lightbulb',
  '🏋️': 'Dumbbell',
  '🎵': 'Music',
  '💳': 'CreditCard',
  '📦': 'Package',
  MdRestaurant: 'Utensils',
  MdHome: 'House',
  MdDirectionsCar: 'Car',
  MdGames: 'Gamepad2',
  MdAttachMoney: 'CircleDollarSign',
  MdMenuBook: 'BookOpen',
  MdMedicalServices: 'HeartPulse',
  MdCardGiftcard: 'Gift',
  MdFlight: 'Plane',
  MdCheckroom: 'Shirt',
  MdWork: 'BriefcaseBusiness',
  MdPhoneAndroid: 'Smartphone',
  MdMovie: 'Clapperboard',
  MdLocalCafe: 'Coffee',
  MdShoppingCart: 'ShoppingCart',
  MdLightbulb: 'Lightbulb',
  MdFitnessCenter: 'Dumbbell',
  MdMusicNote: 'Music',
  MdCreditCard: 'CreditCard',
  MdInventory2: 'Package',
  MdSchool: 'GraduationCap',
  MdPaid: 'Banknote',
  MdPets: 'PawPrint',
}

export default function CategoryIcon({ icon, size = 20, className }: Props) {
  const iconName = legacyIconMap[icon] || icon || 'Package'
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[iconName]
  const FallbackIcon = LucideIcons.Package

  return IconComponent ? (
    <IconComponent size={size} className={className} strokeWidth={2.1} />
  ) : (
    <FallbackIcon size={size} className={className} strokeWidth={2.1} />
  )
}

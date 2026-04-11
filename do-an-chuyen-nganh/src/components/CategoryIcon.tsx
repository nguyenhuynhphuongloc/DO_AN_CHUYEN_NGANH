'use client'
import React from 'react'
import * as MdIcons from 'react-icons/md'

interface Props {
  icon: string
  size?: number
  className?: string
}

// Map common emojis to React Icons for backward compatibility
const emojiMap: Record<string, string> = {
  '🍔': 'MdRestaurant',
  '🏠': 'MdHome',
  '🚗': 'MdDirectionsCar',
  '🎮': 'MdGames',
  '💰': 'MdAttachMoney',
  '📚': 'MdMenuBook',
  '💊': 'MdMedicalServices',
  '🎁': 'MdCardGiftcard',
  '✈️': 'MdFlight',
  '👕': 'MdCheckroom',
  '💼': 'MdWork',
  '📱': 'MdPhoneAndroid',
  '🎬': 'MdMovie',
  '☕': 'MdLocalCafe',
  '🛒': 'MdShoppingCart',
  '💡': 'MdLightbulb',
  '🏋️': 'MdFitnessCenter',
  '🎵': 'MdMusicNote',
  '💳': 'MdCreditCard',
  '📦': 'MdInventory2',
}

export default function CategoryIcon({ icon, size = 20, className }: Props) {
  // 1. Check if icon is an emoji in our map
  const mappedIconName = emojiMap[icon] || icon
  
  // 2. Try to get the component from MdIcons
  const IconComponent = (MdIcons as any)[mappedIconName]
  
  if (IconComponent) {
    return <IconComponent size={size} className={className} />
  }
  
  // 3. Fallback to original string (emoji or text)
  return <span className={className} style={{ fontSize: `${size}px`, lineHeight: 1 }}>{icon}</span>
}

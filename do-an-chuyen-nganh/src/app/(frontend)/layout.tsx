import React from 'react'
import './globals.css'

export const metadata = {
  title: 'FinTrack - Quản Lý Thu Chi Cá Nhân',
  description: 'Ứng dụng quản lý thu chi cá nhân thông minh với AI',
  icons: {
    icon: '/img/logo.png',
    shortcut: '/img/logo.png',
    apple: '/img/logo.png',
  },
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}

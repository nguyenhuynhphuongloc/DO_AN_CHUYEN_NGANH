'use client'

import React, { useEffect } from 'react'

const ForceLightTheme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const html = document.documentElement

    // Đặt thuộc tính theme là light ngay lập tức
    html.setAttribute('data-theme', 'light')

    // Theo dõi để ngăn việc thay đổi ngược lại
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          if (html.getAttribute('data-theme') !== 'light') {
            html.setAttribute('data-theme', 'light')
          }
        }
      })
    })

    observer.observe(html, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}

export default ForceLightTheme

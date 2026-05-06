import Image from 'next/image'

type AppLogoProps = {
  className?: string
  size?: number
  priority?: boolean
}

export default function AppLogo({ className, size = 40, priority = false }: AppLogoProps) {
  return (
    <Image
      src="/img/logo.png"
      alt="FinTrack"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  )
}

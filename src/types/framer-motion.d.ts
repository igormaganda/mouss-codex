/* eslint-disable @typescript-eslint/no-explicit-any */
import 'framer-motion'

// Fix framer-motion Easing type to accept number[] (cubic-bezier shorthand)
declare module 'framer-motion' {
  type Easing = string | number[]
}

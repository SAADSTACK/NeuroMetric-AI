// Manually declare types since vite/client is missing
// This fixes the "Cannot find type definition file for 'vite/client'" error
// and ensures process.env is typed correctly for the application.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    NEXT_PUBLIC_FIREBASE_API_KEY?: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    NEXT_PUBLIC_FIREBASE_APP_ID?: string;
    [key: string]: string | undefined;
  }
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}
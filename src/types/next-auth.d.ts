import 'next-auth';

declare module 'next/navigation' {
  export function redirect(url: string): never;
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string | string[]>>(): T;
  export function notFound(): never;
}

declare module 'next/headers' {
  export function headers(): Promise<Headers>;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      businessId: string | null;
      businessSlug: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    businessId: string | null;
    businessSlug: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    businessId: string | null;
    businessSlug: string | null;
  }
}

'use client';

import { useUser, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';

export default function Header() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        {/* Loading skeleton */}
      </header>
    );
  }

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      {!isSignedIn ? (
        <>
          <SignInButton />
          <SignUpButton />
        </>
      ) : (
        <UserButton />
      )}
    </header>
  );
}


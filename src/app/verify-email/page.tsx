'use client';
// This page is no longer used and can be deleted.
// For now, it redirects to the home page.
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyEmailPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null;
}

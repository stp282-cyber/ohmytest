import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SuperAdminNav } from '@/components/navigation/SuperAdminNav';

export default async function SuperAdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role !== 'super_admin') {
        redirect('/login');
    }

    return (
        <DashboardLayout user={session.user} navigation={<SuperAdminNav />}>
            {children}
        </DashboardLayout>
    );
}

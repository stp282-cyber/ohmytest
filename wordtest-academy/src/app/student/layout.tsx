import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNav } from '@/components/navigation/StudentNav';

export default async function StudentLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.user.role !== 'student') {
        redirect('/login');
    }

    return (
        <DashboardLayout user={session.user} navigation={<StudentNav />}>
            {children}
        </DashboardLayout>
    );
}

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

// This page is protected by the middleware.
// Only users with the 'admin' role can access it.

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-bold">Admin Panel</h1>
                <p className="text-lg text-muted-foreground mt-1">Welcome, administrator.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>User management interface goes here.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Course Management</CardTitle>
                    <CardDescription>Create, edit, and delete courses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Course management interface goes here.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>View application analytics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Analytics dashboards go here.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}

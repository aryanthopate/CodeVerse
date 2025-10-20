// This page is intentionally left blank for now.
// The multi-step course creation form will be added in a subsequent step
// to keep this change focused on the core database integration.
import { AdminLayout } from '@/components/admin-layout';

export default function NewCoursePage() {
    return (
        <AdminLayout>
             <div className="space-y-8">
                <h1 className="text-4xl font-bold">Create a New Course</h1>
                <p className="text-lg text-muted-foreground">This is where the multi-step form to add a new course, chapters, and topics will go.</p>
            </div>
        </AdminLayout>
    )
}
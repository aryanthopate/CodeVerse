
import { AdminLayout } from '@/components/admin-layout';

export default function EditCoursePage({ params }: { params: { courseId: string } }) {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-4xl font-bold">Edit Course</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Editing course with ID: {params.courseId}
        </p>
        <p className="mt-8 text-center text-muted-foreground">
            Edit form and AI generation tools coming soon!
        </p>
      </div>
    </AdminLayout>
  );
}

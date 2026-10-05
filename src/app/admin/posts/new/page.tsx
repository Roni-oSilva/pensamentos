import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { OfficialPostForm } from "@/components/admin/OfficialPostForm";
import { AdminTitle } from "@/components/admin/ui";

export const metadata = { title: "Nova publicação" };

export default async function NewOfficialPost() {
  await requireAdmin("/admin/posts/new");
  return (<><AdminTitle title="Nova publicação" /><OfficialPostForm categories={await listCategories()} /></>);
}

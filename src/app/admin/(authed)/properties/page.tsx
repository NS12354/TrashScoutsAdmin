import { redirect } from "next/navigation";

// The properties list was merged into the Overview (/admin). Keep this path
// working for old links/bookmarks by redirecting.
export default function PropertiesListRedirect() {
  redirect("/admin");
}

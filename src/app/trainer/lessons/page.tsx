import { redirect } from "next/navigation";

export default function TrainerLessonsRedirect() {
  redirect("/trainer/courses");
}

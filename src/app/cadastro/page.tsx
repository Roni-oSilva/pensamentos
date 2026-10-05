import { SignupForm } from "@/components/auth/AuthForms";

export const metadata = { title: "Criar conta", robots: { index: false } };

export default function SignupPage() {
  return (
    <div className="container-narrow flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <h1 className="mb-8 font-display text-5xl text-white">Criar conta</h1>
      <SignupForm />
    </div>
  );
}

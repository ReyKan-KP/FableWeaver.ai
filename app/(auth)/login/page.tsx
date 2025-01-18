import { AuthForm } from "@/components/auth-form";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-4xl font-bold text-center bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-transparent bg-clip-text">
          Login to FableWeaver.ai
        </h1>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}

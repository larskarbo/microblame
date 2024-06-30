// src/pages/login.tsx

import { signIn } from "next-auth/react";
import { Logo } from "../components/layout/Layout";
import { LoggedOutPage } from "../components/layout/auth";

export default function LoginPage() {
  const signInWithGoogle = () => {
    void signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <LoggedOutPage>
      <div className="flex flex-col justify-center flex-1 min-h-full py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center justify-center">
            <Logo />
          </div>
          <h2 className="mt-6 text-2xl font-bold leading-9 tracking-tight text-center text-gray-900">
            Sign in or sign up
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="px-6 py-12 bg-white shadow sm:rounded-lg sm:px-12">
            <div>
              <div className="">
                <button
                  onClick={signInWithGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-gray-2000 px-3 py-1.5 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F] border"
                >
                  <img src="/google.svg" className="w-5 h-5" />
                  <span className="text-sm font-medium leading-6">Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoggedOutPage>
  );
}

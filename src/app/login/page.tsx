// "use client";

// import { useRouter } from "next/navigation";
// import { Button } from "@/component/button";
// import { Card } from "@/component/card";
// import Link from "next/link";


// export default function LoginPage() {
//   const router = useRouter();
 

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     // later replace with real auth
//     router.push("/dashboard");
//   }
//   <div className="text-center text-sm text-white/60">
//   New to Aurora?{" "}
//   <Link href="/get-started" className="text-violet-400 hover:underline">
//     Get started
//   </Link>
// </div>

//   return (
//     <div className="mx-auto max-w-md py-16">
//       <Card>
//         <form onSubmit={handleSubmit} className="space-y-5">
//           {/* Header */}
//           <div className="text-center space-y-1">
//             <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 font-bold">
//               A
//             </div>
//             <h1 className="text-2xl font-bold">Welcome back</h1>
//             <p className="text-sm text-white/60">
//               Sign in to continue to Aurora
//             </p>
//           </div>

//           {/* Email */}
//           <div className="space-y-1">
//             <label className="text-xs text-white/60">Email</label>
//             <input
//               type="email"
//               required
//               className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-violet-500"
//               placeholder="you@example.com"
//             />
//           </div>

//           {/* Password */}
//           <div className="space-y-1">
//             <label className="text-xs text-white/60">Password</label>
//             <input
//               type="password"
//               required
//               className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-violet-500"
//               placeholder="••••••••"
//             />
//           </div>

//           <div className="text-right">
//             <Link href="#" className="text-xs text-violet-400 hover:underline">
//               Forgot password?
//             </Link>
//           </div>

//           <Button type="submit">Sign in</Button>

//           <div className="flex items-center gap-3 text-xs text-white/40">
//             <div className="flex-1 h-px bg-white/10" />
//             or
//             <div className="flex-1 h-px bg-white/10" />
//           </div>

//           <Button type="button" variant="ghost">
//             Continue with Google
//           </Button>

//           <div className="text-center text-sm text-white/60">
//             New to Aurora?{" "}
//             <Link href="/get-started" className="text-violet-400 hover:underline">
//               Get started
//             </Link>
//           </div>
//         </form>
//       </Card>
//     </div>
//   );
// }
"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

const LS_AUTH = "aurora:authed";

export default function LoginPage() {
  const router = useRouter();

  function signIn() {
    localStorage.setItem(LS_AUTH, "true");
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Card>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-white/60">Aurora</div>
            <h1 className="mt-1 text-3xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-white/60">
              No email/password yet — use quick sign-in for now.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={signIn}>Quick Sign-in</Button>
            <Button variant="ghost" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </div>

          <div className="text-xs text-white/40">
            Later you can replace this with Clerk / NextAuth.
          </div>
        </div>
      </Card>
    </div>
  );
}

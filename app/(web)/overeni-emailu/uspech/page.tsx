import Link from "next/link";

export const metadata = { title: "Email ověřen — CarMakléř" };

export default function VerifyEmailSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-green-600"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Email úspěšně ověřen!
        </h1>
        <p className="text-gray-600 mb-6">
          Váš účet je nyní plně aktivní. Můžete se přihlásit a začít používat
          všechny funkce CarMakléř.
        </p>
        <Link
          href="/login"
          className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors no-underline"
        >
          Přihlásit se
        </Link>
      </div>
    </div>
  );
}

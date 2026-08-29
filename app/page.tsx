import { cookies } from "next/headers";
import { redirect } from "next/navigation";


const SUBMISSION_FLASH_COOKIE = "cap-submit-status";

export default async function Home() {
  const cookieStore = await cookies();
  const submissionFlash = cookieStore.get(SUBMISSION_FLASH_COOKIE)?.value;
  const submittedResult = submissionFlash ? JSON.parse(submissionFlash) as {
    result?: string;
    communityId?: string;
  } : null;
  const isSubmitted = Boolean(submittedResult);
  const evaluation = submittedResult?.result;
  const submittedCommunityId = submittedResult?.communityId;
  const capServiceUrl = process.env.CAP_SERVICE_URL;
  const capSubmitUrl = capServiceUrl
    ? `${capServiceUrl.replace(/\/$/, "")}/odata/v4/submitAnswer`
    : null;

  async function submitToCap(formData: FormData) {
    "use server";

    const actionCookieStore = await cookies();

    if (!capSubmitUrl) {
      throw new Error("CAP_SERVICE_URL is not configured.");
    }

    const requestPayload = {
      data: {
        communityId: String(formData.get("communityId") ?? ""),
        answer: String(formData.get("answer") ?? ""),
        week: String(formData.get("week") ?? ""),
      },
    };

    const response = await fetch(
      capSubmitUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CAP request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const evaluation = String(result?.result);
    const communityId = String(result?.communityId ?? requestPayload.data.communityId);

    actionCookieStore.set(
      SUBMISSION_FLASH_COOKIE,
      JSON.stringify({
        result: evaluation,
        communityId,
      }),
      {
        httpOnly: true,
        maxAge: 3,
        path: "/",
        sameSite: "lax",
      }
    );

    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <style>{`
        @keyframes dismiss-success-banner {
          0%, 80% {
            opacity: 1;
            transform: translateY(0);
            max-height: 120px;
            margin-bottom: 1rem;
          }
          100% {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
            margin-bottom: 0;
          }
        }
      `}</style>

      <div className="w-full max-w-sm text-center">
        {isSubmitted ? (
          <div
            aria-live="polite"
            className="overflow-hidden rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            style={{ animation: "dismiss-success-banner 5s ease forwards" }}
          >
            <p className="font-medium">Request submitted.</p>
            <p className="mt-1 text-emerald-100/90">
              Result: {evaluation} | Community ID: {submittedCommunityId ?? "unknown-communityId"}
            </p>
          </div>
        ) : null}

        {/* Profile Image placeholder */}
        <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-300 flex items-center justify-center">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img 
    src="/profile.jpg" 
    alt="Waseem Akram" 
    className="w-full h-full object-cover object-top scale-100"
  />
</div>
        
        <h1 className="text-2xl font-bold">Waseem Akram</h1>
        <p className="text-slate-400 mb-6">SAP BTP & CAP Developer</p>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <a href="https://github.com/waseemakram1713" target="_blank" className="w-full py-3 px-4 bg-emerald-600 rounded-lg border border-emerald-500 hover:bg-emerald-500 transition">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/waseemak2917/" target="_blank" className="w-full py-3 px-4 bg-yellow-400 rounded-lg border border-yellow-300 hover:bg-yellow-300 transition text-gray-900">
            LinkedIn
          </a>

          <form action={submitToCap}>
            <input type="hidden" name="communityId" value="waseem1713" />
            <input type="hidden" name="answer" value="Hydration" />
            <input type="hidden" name="week" value="week4" />

            <button type="submit" className="w-full py-3 px-4 bg-red-600 rounded-lg hover:bg-red-500 transition font-medium cursor-pointer flex items-center justify-center gap-2">
              <a href="https://community.sap.com/t5/user/viewprofilepage/user-id/2305350" target="_blank" >
                SAP Community
              </a>
              {isSubmitted && <span className="text-xl">✓</span>}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { AuthView } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";

export const dynamicParams = false;

export function generateStaticParams() {
    return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
    params,
}: {
    params: Promise<{ path: string }>;
}) {
    const { path } = await params;

    return (
        <div className="w-full h-full flex flex-col items-stretch">
            <Header />
            <main className="w-full flex grow flex-col items-center justify-center self-center p-4 md:p-6">
                <AuthView path={path} />
            </main>
            <Footer />
        </div>
    );
}

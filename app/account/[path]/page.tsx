import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { AccountView } from "@daveyplate/better-auth-ui";
import { accountViewPaths } from "@daveyplate/better-auth-ui/server";

export const dynamicParams = false;

export function generateStaticParams() {
    return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
    params,
}: {
    params: Promise<{ path: string }>;
}) {
    const { path } = await params;

    return (
        <div className="w-full h-full flex flex-col items-stretch">
            <Header />

            <main className="mt-15 p-4 md:p-6">
                <AccountView path={path} />
            </main>
            <Footer />
        </div>
    );
}

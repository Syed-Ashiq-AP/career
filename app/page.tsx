import Footer from "@/components/layout/footer";
import Hero from "@/components/page-layout/home/hero";
import Header from "@/components/layout/header";

export default function Home() {
    return (
        <div className="font-sans">
            <Header />
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <Hero />
            </main>
            <Footer />
        </div>
    );
}

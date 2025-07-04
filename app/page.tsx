import Navbar from "@/components/nav-bar/nav-bar";
import CoolButton from "@/components/ui/cool-button";

export default function Home() {
    return (
        <div className="w-full flex flex-col items-stretch dark:bg-radial-[circle_at_50%_0%,#0b2c40_0%,#081f2d_40%,#050d14_100%] bg-radial-[circle_at_50%_0%,#f1f5f9_0%,#cbd5e1_40%,#94a3b8_100%]">
            <Navbar />
            <main className="w-full flex flex-col items-stretch">
                {/* Hero */}
                <div className="flex flex-col items-center pt-30 gap-8 h-dvh">
                    <h1 className="font-bold px-5 text-5xl md:text-7xl">
                        Unlock{" "}
                        <span
                            className="bg-clip-text bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 text-transparent animate-(--animate-aurora) bg-[length:200%_auto] relative"
                            style={{
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Opportunities
                        </span>
                    </h1>
                    <p className="">with your assistant</p>
                    <div className="flex flex-col md:flex-row gap-10 items-stretch">
                        <CoolButton title="Get Started" href="/chat">
                            Try our AI Agent
                        </CoolButton>
                        <CoolButton title="Get Started" href="/career">
                            Future Career
                        </CoolButton>
                    </div>
                    <p className="font-medium text-lg">start right away</p>
                </div>
            </main>
        </div>
    );
}

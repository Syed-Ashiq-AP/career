import { ModeToggle } from "@/components/mode-toggle";
import { SheetMenu } from "@/components/side-panel/sheet-menu";

export function Navbar() {
    return (
        <header className="fixed top-0 z-20 lg:z-0 w-full">
            <div className="mx-4 sm:mx-8 flex h-14 items-center">
                <SheetMenu />

                <div className="flex flex-1 items-center justify-end">
                    {/* <ModeToggle /> */}
                    {/* <UserNav /> */}
                </div>
            </div>
        </header>
    );
}

import { SheetMenu } from "@/components/side-panel/sheet-menu";

export function Navbar() {
    return (
        <header className="w-full">
            <div className="px-4 flex h-14 items-center border-b bg-card">
                <SheetMenu />
            </div>
        </header>
    );
}

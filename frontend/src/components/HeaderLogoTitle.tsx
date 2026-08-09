import { Link } from "react-router";

export default function HeaderLogoTitle() {
    return (
        <Link to="/" className="flex gap-2 items-center">
            <img
                className="h-6"
                src="https://www.gstatic.com/marketing-cms/assets/images/a4/97/92c1ec494d129f3fb8d7caa91584/gemini-update.png=s48-fcrop64=1,00000000ffffffff-rw"
                alt=""
            />
            <div className="flex gap-1 text-xl items-center text-green-500 tracking-wide">
                <h1 className="font-bold">Galaxy</h1>
                <span className="font-semibold">Store</span>
            </div>
        </Link>
    );
}
